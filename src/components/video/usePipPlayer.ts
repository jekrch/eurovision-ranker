import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { CountryContestant } from '../../data/CountryContestant';
import { getYouTubeVideoId } from '../../utilities/YoutubeUtil';
import { useAppSelector } from '../../hooks/stateHooks';
import {
    VideoInfo,
    Mode,
    Geom,
    PLAYER_FRAME_ID,
    YT_PLAYING,
    YT_ENDED,
    YT_BUFFERING,
    TRANSITION,
    AUTO_CONTINUE_KEY,
    videoInfoFor,
    itemKey,
    computePipGeom,
} from './videoPipShared';

/**
 * The stateful Picture-in-Picture player engine: it owns the single iframe's
 * video/mode state, the rAF "glue" loop that keeps a docked player pinned to its
 * placeholder, the docked <-> pip transitions, drag handling, and the YouTube
 * postMessage play-state tracking. The provider renders the DOM; this hook drives
 * it.
 *
 * `onExpand` re-opens the song modal for a contestant when the pip is expanded;
 * `onMinimize` closes the song modal when the docked player is popped out.
 */
export const usePipPlayer = (
    onExpand: (contestant: CountryContestant) => void,
    onMinimize: () => void
) => {
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

    const hasPlayableVideos = rankedItems.some(
        (cc) => cc.contestant?.youtube && getYouTubeVideoId(cc.contestant.youtube)
    );

    return {
        // render state
        video,
        mode,
        autoplay,
        autoContinue,
        expandNonce,
        containerRef,
        iframeRef,
        getTargetGeom,
        handleIframeLoad,
        // control-bar actions
        navigate,
        toggleAutoContinue,
        expand,
        closePip,
        onBarPointerDown,
        // context actions / derived
        registerDock,
        unregisterDock,
        popOut,
        playList,
        hasPlayableVideos,
        activeVideoId: video?.videoId ?? null,
        pipVideoId: mode === 'pip' && video ? video.videoId : null,
    };
};
