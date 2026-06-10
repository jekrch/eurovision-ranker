import React, {
    createContext,
    useContext,
    useLayoutEffect,
    useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { CountryContestant } from '../../data/CountryContestant';
import { VideoInfo, buildSrc, computePipGeom, PLAYER_FRAME_ID } from './videoPipShared';
import { usePipPlayer } from './usePipPlayer';
import PipControlBar from './PipControlBar';

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
 *
 * This file is the React context + provider DOM shell; the player engine lives
 * in `usePipPlayer`, the floating control bar in `PipControlBar`, and the shared
 * types/helpers in `videoPipShared`.
 */

export type { VideoInfo } from './videoPipShared';

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

export const VideoPipProvider: React.FC<{
    // re-opens the song modal for the given contestant when the pip is expanded
    onExpand: (contestant: CountryContestant) => void;
    // closes the song modal when the user pops the docked player out to a pip
    onMinimize: () => void;
    children: React.ReactNode;
}> = ({ onExpand, onMinimize, children }) => {
    const player = usePipPlayer(onExpand, onMinimize);
    const {
        video,
        mode,
        autoplay,
        autoContinue,
        expandNonce,
        containerRef,
        iframeRef,
        getTargetGeom,
        handleIframeLoad,
        navigate,
        toggleAutoContinue,
        expand,
        closePip,
        onBarPointerDown,
        registerDock,
        unregisterDock,
        popOut,
        playList,
        hasPlayableVideos,
        activeVideoId,
        pipVideoId,
    } = player;

    const ctxValue: VideoPipContextValue = {
        registerDock,
        unregisterDock,
        activeVideoId,
        pipVideoId,
        expandNonce,
        popOut,
        playList,
        hasPlayableVideos,
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
                            <PipControlBar
                                autoContinue={autoContinue}
                                onBarPointerDown={onBarPointerDown}
                                navigate={navigate}
                                toggleAutoContinue={toggleAutoContinue}
                                expand={expand}
                                closePip={closePip}
                            />
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
