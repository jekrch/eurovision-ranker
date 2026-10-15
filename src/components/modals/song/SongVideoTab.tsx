import React from 'react';
import { FaYoutube, FaClone } from 'react-icons/fa';

import { CountryContestant } from '../../../data/CountryContestant';
import { VideoDock, VideoInfo } from '../../video/VideoPipContext';

type SongVideoTabProps = {
  videoId: string;
  countryContestant: CountryContestant;
  youtubeUrl?: string;
  artist?: string;
  song?: string;
  popOut: (info?: VideoInfo) => void;
};

/**
 * The actual <iframe> lives in the app-level VideoPipProvider so it can keep
 * playing as a floating pip when the user leaves this tab or closes the modal.
 * VideoDock just reserves the area and tells the provider to glue the persistent
 * player on top of it.
 */
const SongVideoTab: React.FC<SongVideoTabProps> = ({
  videoId,
  countryContestant,
  youtubeUrl,
  artist,
  song,
  popOut,
}) => {
  const info: VideoInfo = {
    videoId,
    title: `${artist} - ${song}`,
    youtubeUrl,
    contestant: countryContestant,
  };
  return (
    <div className="flex-1 min-h-0 overflow-auto mt-[1em]">
      {/* keyed so a new song decides afresh whether to wait behind a floating pip */}
      <VideoDock key={videoId} info={info} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-(--er-surface-tertiary-70) hover:bg-(--er-interactive-secondary) border-[0.1em] border-(--er-border-tertiary) px-3 py-[0.35em] text-sm font-medium text-(--er-text-secondary) transition-colors"
        >
          <FaYoutube className="text-lg text-[#FF0000]" />
          Watch on YouTube
        </a>
        <button
          type="button"
          onClick={() => popOut(info)}
          title="Keep playing in a floating window"
          className="inline-flex items-center gap-2 rounded-md bg-(--er-surface-tertiary-70) hover:bg-(--er-interactive-secondary) border-[0.1em] border-(--er-border-tertiary) px-3 py-[0.35em] text-sm font-medium text-(--er-text-secondary) transition-colors"
        >
          <FaClone className="text-base" />
          Pop out
        </button>
      </div>
    </div>
  );
};

export default SongVideoTab;
