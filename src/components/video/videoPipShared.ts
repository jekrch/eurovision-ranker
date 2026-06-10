import { CountryContestant } from '../../data/CountryContestant';
import { getYouTubeVideoId } from '../../utilities/YoutubeUtil';

/**
 * Shared types, constants, and pure helpers for the Picture-in-Picture video
 * player. The stateful player logic lives in `usePipPlayer`, the floating
 * control bar in `PipControlBar`, and the context/provider in `VideoPipContext`.
 */

export type VideoInfo = {
  videoId: string;
  title: string;
  youtubeUrl?: string;
  // kept so "expand" can re-open the song modal on the right contestant
  contestant: CountryContestant;
};

export type Mode = 'docked' | 'pip';

export const PLAYER_FRAME_ID = 'er-pip-player-frame';

// youtube player states (from the IFrame API / postMessage protocol)
export const YT_PLAYING = 1;
export const YT_ENDED = 0;
export const YT_BUFFERING = 3;

export const PIP_MARGIN = 16;
export const PIP_MAX_WIDTH = 360;
// vertical room reserved below the pip video for the control bar (bar height +
// its top margin), so the bar stays on-screen above the viewport edge
export const PIP_BAR_SPACE = 40;
export const TRANSITION =
  'left 340ms cubic-bezier(0.16,1,0.3,1), top 340ms cubic-bezier(0.16,1,0.3,1), width 340ms cubic-bezier(0.16,1,0.3,1), height 340ms cubic-bezier(0.16,1,0.3,1)';

export const AUTO_CONTINUE_KEY = 'er-pip-autocontinue';

export type Geom = { left: number; top: number; width: number; height: number };

export const buildSrc = (videoId: string, autoplay: boolean): string => {
  const origin = encodeURIComponent(window.location.origin);
  // enablejsapi=1 turns on the postMessage protocol. A fresh in-modal dock
  // never autoplays (user presses play); navigating the pip / auto-continuing
  // to the next track does, since the user already drove playback.
  return `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${origin}&rel=0&playsinline=1&widgetid=1${autoplay ? '&autoplay=1' : ''}`;
};

// build the player payload for a ranked item, or null if it has no video
export const videoInfoFor = (cc: CountryContestant): VideoInfo | null => {
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

export const itemKey = (cc: CountryContestant): string => cc.uid ?? cc.id;

// geometry of the floating pip. with no `pos` it sits in the default
// bottom-right corner; with one (user dragged it) it honors that position,
// clamped so the video and its control bar stay fully on-screen.
export const computePipGeom = (pos?: { left: number; top: number } | null): Geom => {
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
