import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
    FaChevronLeft,
    FaChevronRight,
    FaExpand,
    FaInfinity,
    FaTimes,
} from 'react-icons/fa';
import { CountryContestant } from '../../data/CountryContestant';
import { getYouTubeVideoId } from '../../utilities/YoutubeUtil';
import { useAppSelector } from '../../hooks/stateHooks';

/**
 * Picture-in-Picture video support.
 *
 * The whole point of this module is that a single YouTube <iframe> must never
 * change its DOM parent — re-parenting an iframe forces the browser to reload
 * it, which would interrupt playback. So we render exactly one player inside a
 * fixed-position container portaled to <body>, and we only ever animate that
 * container's geometry (left/top/width/height). The video keeps playing in its
 * own compositor layer, so repositioning never stutters the audio/video.
 *
 * The player has two visual states:
 *  - "docked": glued on top of a placeholder element inside the song modal's
 *    video tab (tracked every frame so it follows the modal's open animation
 *    and any scrolling).
 *  - "pip": a small floating box in the bottom-right corner.
 *
 * When the user leaves the video (switches tab / closes the modal) while it's
 * playing, we transition docked -> pip. Expanding the pip re-opens the modal on
 * the video tab, which re-docks the same (still-playing) iframe.
 *
 * We avoid the official IFrame Player API on purpose: the app's CSP only allows
 * scripts from 'self', so we can't load https://www.youtube.com/iframe_api.
 * Instead we talk to the embed over its postMessage JSON protocol
 * (enablejsapi=1), which only needs frame-src (already allowed) to read the
 * play state. The user drives play/pause/seek/fullscreen with YouTube's own
 * native controls.
 */

export type VideoInfo = {
    videoId: string;
    title: string;
    youtubeUrl?: string;
    // kept so "expand" can re-open the song modal on the right contestant
    contestant: CountryContestant;
};

type Mode = 'docked' | 'pip';

interface VideoPipContextValue {
    // called by the modal's video tab when it mounts: the player docks onto `el`
    registerDock: (el: HTMLElement, info: VideoInfo) => void;
    // called when that tab unmounts (tab switch / modal close): goes pip if the
    // video is playing, otherwise stops
    unregisterDock: (el: HTMLElement) => void;
    // videoId of the currently loaded video, or null. lets the modal know which
    // song is "live" in the player.
    activeVideoId: string | null;
    // videoId of the video currently loaded in the floating pip, or null when
    // it's docked / nothing is up. lets the ranked list flag the live card.
    pipVideoId: string | null;
    // bumped each time the user expands the pip; the modal watches this to swing
    // itself back to the video tab
    expandNonce: number;
    // pops the docked player out to a floating pip and closes the modal
    popOut: () => void;
    // floats a pip starting from the top ranked playable video with
    // auto-continue on, so it plays straight down the ranked list
    playList: () => void;
    // whether the ranked list has at least one playable video
    hasPlayableVideos: boolean;
}

const VideoPipContext = createContext<VideoPipContextValue | null>(null);

export const useVideoPip = (): VideoPipContextValue => {
    const ctx = useContext(VideoPipContext);
    if (!ctx) {
        throw new Error('useVideoPip must be used within a VideoPipProvider');
    }
    return ctx;
};

const PLAYER_FRAME_ID = 'er-pip-player-frame';

// youtube player states (from the IFrame API / postMessage protocol)
const YT_PLAYING = 1;
const YT_ENDED = 0;
const YT_BUFFERING = 3;

const PIP_MARGIN = 16;
const PIP_MAX_WIDTH = 360;
// vertical room reserved below the pip video for the control bar (bar height +
// its top margin), so the bar stays on-screen above the viewport edge
const PIP_BAR_SPACE = 40;
const TRANSITION = 'left 340ms cubic-bezier(0.16,1,0.3,1), top 340ms cubic-bezier(0.16,1,0.3,1), width 340ms cubic-bezier(0.16,1,0.3,1), height 340ms cubic-bezier(0.16,1,0.3,1)';

type Geom = { left: number; top: number; width: number; height: number };

const buildSrc = (videoId: string, autoplay: boolean): string => {
    const origin = encodeURIComponent(window.location.origin);
    // enablejsapi=1 turns on the postMessage protocol. A fresh in-modal dock
    // never autoplays (user presses play); navigating the pip / auto-continuing
    // to the next track does, since the user already drove playback.
    return `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${origin}&rel=0&playsinline=1&widgetid=1${autoplay ? '&autoplay=1' : ''}`;
};

const AUTO_CONTINUE_KEY = 'er-pip-autocontinue';

// build the player payload for a ranked item, or null if it has no video
const videoInfoFor = (cc: CountryContestant): VideoInfo | null => {
    const youtubeUrl = cc.contestant?.youtube;
    const videoId = youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null;
    if (!videoId) return null;
    return {
        videoId,
        title: `${cc.contestant?.artist ?? ''} - ${cc.contestant?.song ?? ''}`,
        youtubeUrl,
        contestant: cc,
    };
};

const itemKey = (cc: CountryContestant): string => cc.uid ?? cc.id;

// geometry of the floating pip. with no `pos` it sits in the default
// bottom-right corner; with one (user dragged it) it honors that position,
// clamped so the video and its control bar stay fully on-screen.
const computePipGeom = (pos?: { left: number; top: number } | null): Geom => {
    const width = Math.min(PIP_MAX_WIDTH, window.innerWidth - PIP_MARGIN * 2);
    const height = Math.round((width * 9) / 16);
    const maxLeft = window.innerWidth - width - PIP_MARGIN;
    const maxTop = window.innerHeight - height - PIP_MARGIN - PIP_BAR_SPACE;
    if (pos) {
        return {
            left: Math.max(PIP_MARGIN, Math.min(pos.left, maxLeft)),
            top: Math.max(PIP_MARGIN, Math.min(pos.top, maxTop)),
            width,
            height,
        };
    }
    return { left: maxLeft, top: maxTop, width, height };
};

export const VideoPipProvider: React.FC<{
    // re-opens the song modal for the given contestant when the pip is expanded
    onExpand: (contestant: CountryContestant) => void;
    // closes the song modal when the user pops the docked player out to a pip
    onMinimize: () => void;
    children: React.ReactNode;
}> = ({ onExpand, onMinimize, children }) => {
    // `video` drives the portal/iframe; null means no player mounted at all
    const [video, setVideo] = useState<VideoInfo | null>(null);
    const [mode, setMode] = useState<Mode>('docked');
    const [expandNonce, setExpandNonce] = useState(0);
    // whether the currently loaded src should autoplay (pip navigation / auto-continue)
    const [autoplay, setAutoplay] = useState(false);
    // when on, a finished pip video advances to the next ranked track instead of closing
    const [autoContinue, setAutoContinue] = useState<boolean>(() => {
        try {
            return localStorage.getItem(AUTO_CONTINUE_KEY) === 'true';
        } catch {
            return false;
        }
    });

    // the ranked list drives left/right navigation between adjacent videos
    const rankedItems = useAppSelector((state) => state.root.rankedItems);
    const rankedItemsRef = useRef(rankedItems);
    rankedItemsRef.current = rankedItems;
    const autoContinueRef = useRef(autoContinue);
    autoContinueRef.current = autoContinue;
    // guards against YouTube's repeated "ended" messages double-advancing the
    // auto-continue; released once the next track actually starts playing
    const advancingRef = useRef(false);

    // refs mirror state for the rAF loop / message handler, which need the
    // latest values without restarting
    const videoRef = useRef<VideoInfo | null>(null);
    const modeRef = useRef<Mode>('docked');
    // 'animating' = easing into place (transition on), 'glued' = locked to the
    // dock target every frame (transition off, crisp during scroll)
    const phaseRef = useRef<'animating' | 'glued' | 'pip'>('glued');
    const dockElRef = useRef<HTMLElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerStateRef = useRef<number>(-1);
    const onExpandRef = useRef(onExpand);
    onExpandRef.current = onExpand;
    const onMinimizeRef = useRef(onMinimize);
    onMinimizeRef.current = onMinimize;
    // set when the user pops out manually, so the dock's unmount floats the
    // player to a pip even if it was paused (instead of tearing it down)
    const forcePipRef = useRef(false);

    const rafRef = useRef<number | null>(null);
    const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // running exit-animation timer / guard so a closing pip animates out once
    // before it's torn down (rather than vanishing instantly)
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closingRef = useRef(false);
    const lastGeomRef = useRef<Geom | null>(null);
    // user-chosen pip position (from dragging the control bar); null = default
    // bottom-right corner. reset each fresh pop-out so the pip reappears there.
    const pipPosRef = useRef<{ left: number; top: number } | null>(null);

    const getTargetGeom = useCallback((): Geom | null => {
        if (modeRef.current === 'docked') {
            const dock = dockElRef.current;
            if (!dock) return null;
            const r = dock.getBoundingClientRect();
            return { left: r.left, top: r.top, width: r.width, height: r.height };
        }
        return computePipGeom(pipPosRef.current);
    }, []);

    const applyGeom = useCallback((geom: Geom, animate: boolean) => {
        const el = containerRef.current;
        if (!el) return;
        el.style.transition = animate ? TRANSITION : 'none';
        const last = lastGeomRef.current;
        // skip redundant writes so a glued player doesn't thrash layout each frame
        if (
            !last ||
            last.left !== geom.left ||
            last.top !== geom.top ||
            last.width !== geom.width ||
            last.height !== geom.height
        ) {
            el.style.left = `${geom.left}px`;
            el.style.top = `${geom.top}px`;
            el.style.width = `${geom.width}px`;
            el.style.height = `${geom.height}px`;
            lastGeomRef.current = geom;
        }
    }, []);

    const positionNow = useCallback(() => {
        const geom = getTargetGeom();
        if (geom) {
            applyGeom(geom, phaseRef.current !== 'glued');
        }
    }, [getTargetGeom, applyGeom]);

    const stopRaf = useCallback(() => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    const ensureRaf = useCallback(() => {
        if (rafRef.current != null) return;
        const tick = () => {
            positionNow();
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [positionNow]);

    // central transition between docked and pip; keeps refs + render state in
    // sync and decides whether the rAF glue loop should run.
    // `animateIn` eases the player into the dock target (used when flying back
    // from a pip); otherwise it locks on immediately so it tracks the modal's
    // own open animation in lockstep.
    const goMode = useCallback((next: Mode, animateIn = false) => {
        modeRef.current = next;
        setMode(next);
        if (animTimerRef.current) {
            clearTimeout(animTimerRef.current);
            animTimerRef.current = null;
        }
        if (next === 'docked') {
            ensureRaf();
            if (animateIn) {
                // ease into place, then lock on for crisp scroll-following
                phaseRef.current = 'animating';
                animTimerRef.current = setTimeout(() => {
                    phaseRef.current = 'glued';
                }, 380);
            } else {
                phaseRef.current = 'glued';
            }
        } else {
            // fresh pop-out lands in the default corner; dragging sets a position
            pipPosRef.current = null;
            // pip is static relative to the viewport; one animated write is
            // enough (CSS finishes the docked -> corner transition on its own)
            phaseRef.current = 'pip';
            stopRaf();
            positionNow();
        }
    }, [ensureRaf, stopRaf, positionNow]);

    // abort an in-flight exit animation and clear the faded-out styles, so the
    // same container can be reused (re-dock / load a new pip) cleanly
    const cancelClose = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        closingRef.current = false;
        const el = containerRef.current;
        if (el) {
            el.style.opacity = '';
            el.style.transform = '';
        }
    }, []);

    const registerDock = useCallback((el: HTMLElement, info: VideoInfo) => {
        // flying back from a floating pip should glide into place; a fresh open
        // (or a brand-new video) should lock straight onto the modal
        const animateIn = modeRef.current === 'pip';
        cancelClose();
        dockElRef.current = el;
        if (videoRef.current?.videoId !== info.videoId) {
            // a different song: (re)load the iframe with the new id. opening from
            // the modal never autoplays — the user presses play themselves
            playerStateRef.current = -1;
            lastGeomRef.current = null;
            videoRef.current = info;
            setAutoplay(false);
            setVideo(info);
        } else {
            // same song returning from pip: keep playing, just refresh metadata
            videoRef.current = { ...videoRef.current, ...info };
        }
        goMode('docked', animateIn);
    }, [goMode, cancelClose]);

    const unregisterDock = useCallback((el: HTMLElement) => {
        // ignore stale unmounts from a placeholder we already moved past
        if (dockElRef.current !== el) return;
        dockElRef.current = null;
        const st = playerStateRef.current;
        const playing = st === YT_PLAYING || st === YT_BUFFERING;
        if (forcePipRef.current) {
            // user popped out explicitly: float it regardless of play state
            forcePipRef.current = false;
            goMode('pip');
        } else if (playing) {
            goMode('pip');
        } else {
            // not actively watching -> tear the player down so audio stops
            stopRaf();
            lastGeomRef.current = null;
            videoRef.current = null;
            setVideo(null);
        }
    }, [goMode, stopRaf]);

    // rip the player out of the DOM and stop everything
    const teardownPlayer = useCallback(() => {
        stopRaf();
        dockElRef.current = null;
        lastGeomRef.current = null;
        videoRef.current = null;
        setVideo(null);
    }, [stopRaf]);

    const closePip = useCallback(() => {
        if (closingRef.current) return;
        // pause the embed straight away so audio stops while it animates out
        const w = iframeRef.current?.contentWindow;
        if (w) {
            try {
                w.postMessage(
                    JSON.stringify({
                        event: 'command',
                        func: 'pauseVideo',
                        args: [],
                        id: PLAYER_FRAME_ID,
                        channel: 'widget',
                    }),
                    '*'
                );
            } catch {
                /* ignore */
            }
        }
        const el = containerRef.current;
        // no element to animate (e.g. ended off-screen) -> tear down immediately
        if (!el) {
            teardownPlayer();
            return;
        }
        // freeze the glue loop and shrink/fade the floating box toward its
        // corner, then unmount once the transition has played
        closingRef.current = true;
        stopRaf();
        el.style.transition =
            'opacity 220ms ease, transform 240ms cubic-bezier(0.4,0,0.7,1)';
        el.style.transformOrigin = 'bottom right';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.82) translateY(12px)';
        closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
            closingRef.current = false;
            teardownPlayer();
        }, 240);
    }, [stopRaf, teardownPlayer]);

    const expand = useCallback(() => {
        const cc = videoRef.current?.contestant;
        if (!cc) return;
        // re-open the modal; its video tab will re-dock this same iframe
        onExpandRef.current?.(cc);
        setExpandNonce((n) => n + 1);
    }, []);

    // pop the docked player out to a floating pip: flag it so the dock's unmount
    // floats (not tears down) the player, then close the modal to trigger that
    const popOut = useCallback(() => {
        if (!videoRef.current || modeRef.current === 'pip') return;
        forcePipRef.current = true;
        onMinimizeRef.current?.();
    }, []);

    // drag the floating pip around by grabbing its control bar. clicks that
    // land on a control button fall through to that button instead of dragging.
    const onBarPointerDown = useCallback((e: React.PointerEvent) => {
        if (modeRef.current !== 'pip') return;
        if ((e.target as HTMLElement).closest('button')) return;
        const el = containerRef.current;
        if (!el) return;
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const baseLeft = rect.left;
        const baseTop = rect.top;

        const onMove = (ev: PointerEvent) => {
            pipPosRef.current = {
                left: baseLeft + (ev.clientX - startX),
                top: baseTop + (ev.clientY - startY),
            };
            // write directly without a transition so the box tracks the cursor
            applyGeom(computePipGeom(pipPosRef.current), false);
        };
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [applyGeom]);

    // swap the pip to a different video (and autoplay it). geometry stays put,
    // so the floating box doesn't move — only the iframe src changes.
    const loadPipVideo = useCallback((info: VideoInfo) => {
        cancelClose();
        playerStateRef.current = -1;
        videoRef.current = info;
        setAutoplay(true);
        setVideo(info);
    }, [cancelClose]);

    // step to the adjacent ranked item that has a video, wrapping at the ends.
    // dir = +1 -> next, -1 -> previous.
    const navigate = useCallback((dir: 1 | -1) => {
        const current = videoRef.current?.contestant;
        if (!current) return;
        const playable = rankedItemsRef.current.filter(
            (cc) => cc.contestant?.youtube && getYouTubeVideoId(cc.contestant.youtube)
        );
        if (playable.length < 2) return;
        const key = itemKey(current);
        const idx = playable.findIndex((cc) => itemKey(cc) === key);
        // if the current video isn't in the list, enter from the matching end
        const from = idx === -1 ? (dir === 1 ? -1 : 0) : idx;
        const nextIdx = (from + dir + playable.length) % playable.length;
        const info = videoInfoFor(playable[nextIdx]);
        if (info) loadPipVideo(info);
    }, [loadPipVideo]);

    // start a floating pip from the top playable ranked item with auto-continue
    // on, so the list plays straight through without opening the song modal.
    const playList = useCallback(() => {
        const playable = rankedItemsRef.current.filter(
            (cc) => cc.contestant?.youtube && getYouTubeVideoId(cc.contestant.youtube)
        );
        if (!playable.length) return;
        const info = videoInfoFor(playable[0]);
        if (!info) return;
        cancelClose();
        // turn auto-continue on (and persist it) so it advances down the list
        setAutoContinue(true);
        autoContinueRef.current = true;
        try {
            localStorage.setItem(AUTO_CONTINUE_KEY, 'true');
        } catch {
            /* ignore storage errors (e.g. private mode) */
        }
        advancingRef.current = false;
        playerStateRef.current = -1;
        lastGeomRef.current = null;
        videoRef.current = info;
        setAutoplay(true);
        setVideo(info);
        goMode('pip');
    }, [goMode, cancelClose]);

    const toggleAutoContinue = useCallback(() => {
        setAutoContinue((on) => {
            const next = !on;
            try {
                localStorage.setItem(AUTO_CONTINUE_KEY, String(next));
            } catch {
                /* ignore storage errors (e.g. private mode) */
            }
            return next;
        });
    }, []);

    // seed the container's geometry before first paint so it never flashes at
    // 0,0, and keep the rAF loop alive while a video is mounted in docked mode
    useLayoutEffect(() => {
        if (!video) {
            stopRaf();
            return;
        }
        positionNow();
        if (modeRef.current === 'docked') {
            ensureRaf();
        }
        return () => {
            // nothing per-render; full teardown handled on unmount below
        };
    }, [video, positionNow, ensureRaf, stopRaf]);

    // reposition the pip on viewport resize (docked mode is handled by the rAF
    // loop reading the dock element's rect)
    useEffect(() => {
        const onResize = () => {
            if (modeRef.current === 'pip') positionNow();
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [positionNow]);

    // listen for the YouTube embed's postMessage events to track play state
    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            if (typeof e.data !== 'string') return;
            if (e.origin && e.origin.indexOf('youtube') === -1) return;
            let data: { event?: string; info?: number | { playerState?: number } } | null;
            try {
                data = JSON.parse(e.data);
            } catch {
                return;
            }
            if (!data) return;

            let state: number | undefined;
            if (data.event === 'onStateChange' && typeof data.info === 'number') {
                state = data.info;
            } else if (
                data.event === 'infoDelivery' &&
                typeof data.info === 'object' &&
                data.info !== null &&
                typeof data.info.playerState === 'number'
            ) {
                state = data.info.playerState;
            }
            if (state === undefined) return;

            playerStateRef.current = state;
            // a started track clears the auto-continue lock for the next ending
            if (state === YT_PLAYING || state === YT_BUFFERING) {
                advancingRef.current = false;
            }
            // when a floating video finishes: advance to the next track if
            // auto-continue is on, otherwise retire the pip. youtube fires the
            // ended state repeatedly, so the lock keeps us from skipping ahead.
            if (state === YT_ENDED && modeRef.current === 'pip') {
                if (autoContinueRef.current) {
                    if (!advancingRef.current) {
                        advancingRef.current = true;
                        navigate(1);
                    }
                } else {
                    closePip();
                }
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [closePip, navigate]);

    // full teardown on provider unmount
    useEffect(() => {
        return () => {
            stopRaf();
            if (animTimerRef.current) clearTimeout(animTimerRef.current);
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, [stopRaf]);

    // open the postMessage channel once the embed has loaded so play-state
    // events start flowing
    const handleIframeLoad = useCallback(() => {
        const w = iframeRef.current?.contentWindow;
        if (!w) return;
        const post = (msg: object) => {
            try {
                w.postMessage(JSON.stringify(msg), '*');
            } catch {
                /* ignore */
            }
        };
        const handshake = () => {
            post({ event: 'listening', id: PLAYER_FRAME_ID, channel: 'widget' });
            post({
                event: 'command',
                func: 'addEventListener',
                args: ['onStateChange'],
                id: PLAYER_FRAME_ID,
                channel: 'widget',
            });
        };
        // retry briefly in case the widget isn't ready for the first handshake
        handshake();
        let tries = 0;
        const interval = setInterval(() => {
            tries += 1;
            handshake();
            if (tries >= 6) clearInterval(interval);
        }, 250);
    }, []);

    const ctxValue: VideoPipContextValue = {
        registerDock,
        unregisterDock,
        activeVideoId: video?.videoId ?? null,
        pipVideoId: mode === 'pip' && video ? video.videoId : null,
        expandNonce,
        popOut,
        playList,
        hasPlayableVideos: rankedItems.some(
            (cc) => cc.contestant?.youtube && getYouTubeVideoId(cc.contestant.youtube)
        ),
    };

    const isPip = mode === 'pip';
    const initialGeom = video ? getTargetGeom() ?? computePipGeom() : null;

    return (
        <VideoPipContext.Provider value={ctxValue}>
            {children}
            {video &&
                createPortal(
                    <div
                        ref={containerRef}
                        className="er-video-player-root group fixed"
                        style={{
                            left: initialGeom ? `${initialGeom.left}px` : 0,
                            top: initialGeom ? `${initialGeom.top}px` : 0,
                            width: initialGeom ? `${initialGeom.width}px` : 0,
                            height: initialGeom ? `${initialGeom.height}px` : 0,
                            zIndex: isPip ? 1000 : 55,
                        }}
                    >
                        {/* control bar — sits just below the floating pip video.
                            lives outside the clipped video box so it can extend
                            past the bottom edge; pip-only, like the float itself */}
                        {isPip && (
                            <div
                                onPointerDown={onBarPointerDown}
                                title="Drag to move"
                                style={{ touchAction: 'none' }}
                                className="absolute inset-x-0 top-full mt-1 flex cursor-grab select-none items-center gap-0.5 rounded-md bg-black/85 px-1 py-1 text-white/90 shadow-lg active:cursor-grabbing"
                            >
                                <button
                                    type="button"
                                    aria-label="Previous video"
                                    title="Previous"
                                    onClick={() => navigate(-1)}
                                    className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15 hover:text-white"
                                >
                                    <FaChevronLeft className="text-xs" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Next video"
                                    title="Next"
                                    onClick={() => navigate(1)}
                                    className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15 hover:text-white ml-2"
                                >
                                    <FaChevronRight className="text-xs" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Autoplay next video"
                                    aria-pressed={autoContinue}
                                    title={
                                        autoContinue
                                            ? 'Auto-continue on'
                                            : 'Auto-continue to next video'
                                    }
                                    onClick={toggleAutoContinue}
                                    className={`flex h-7 items-center gap-1 rounded px-1.5 ml-3 text-[0.65rem] font-semibold uppercase tracking-wide ${
                                        autoContinue
                                            ? 'bg-white/90 text-black'
                                            : 'text-white/80 hover:bg-white/15 hover:text-white'
                                    }`}
                                >
                                    <FaInfinity className="text-xs" />
                                    Auto
                                </button>

                                <div className="flex-1" />

                                <button
                                    type="button"
                                    aria-label="Return to tab"
                                    title="Return to tab"
                                    onClick={expand}
                                    className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15 hover:text-white mr-3"
                                >
                                    <FaExpand className="text-xs" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Close video"
                                    title="Close"
                                    onClick={closePip}
                                    className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15 hover:text-white"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>
                        )}

                        {/* the video box itself — clipped + framed. fills the
                            tracked geometry exactly so docked mode is unchanged */}
                        <div
                            className="absolute inset-0 overflow-hidden rounded-md bg-black"
                            style={{
                                boxShadow: isPip
                                    ? '0 10px 30px rgba(0,0,0,0.5)'
                                    : 'none',
                                // a soft ring matches the modal's video box framing
                                outline: '1px solid var(--er-border-secondary)',
                                outlineOffset: '-1px',
                            }}
                        >
                            <iframe
                                ref={iframeRef}
                                id={PLAYER_FRAME_ID}
                                className="absolute inset-0 h-full w-full"
                                src={buildSrc(video.videoId, autoplay)}
                                title={video.title}
                                onLoad={handleIframeLoad}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        </div>
                    </div>,
                    document.body
                )}
        </VideoPipContext.Provider>
    );
};

/**
 * Placeholder rendered inside the song modal's video tab. It reserves the video
 * area and registers itself as the dock target; the persistent player from the
 * provider floats on top of it. Unmounting (tab switch / modal close) hands the
 * player off to pip mode (if playing) or stops it.
 */
export const VideoDock: React.FC<{ info: VideoInfo }> = ({ info }) => {
    const { registerDock, unregisterDock } = useVideoPip();
    const ref = useRef<HTMLDivElement>(null);
    const infoRef = useRef(info);
    infoRef.current = info;

    useLayoutEffect(() => {
        const el = ref.current;
        if (el) registerDock(el, infoRef.current);
        return () => {
            if (el) unregisterDock(el);
        };
        // re-register only when the song actually changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [info.videoId]);

    return (
        <div
            ref={ref}
            className="relative w-full aspect-video rounded-md overflow-hidden bg-black ring-1 ring-[var(--er-border-secondary)]"
        />
    );
};
