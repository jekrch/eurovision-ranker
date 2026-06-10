import { faAlignLeft, faPlay, faChartColumn } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import Modal from './Modal';
import SongLyricsTab from './song/SongLyricsTab';
import { TabKey } from './song/songModalUtils';
import SongVideoTab from './song/SongVideoTab';
import SongVotesTab from './song/SongVotesTab';
import { useSongModal } from './song/useSongModal';
import { CountryContestant } from '../../data/CountryContestant';

type SongModalProps = {
  isOpen: boolean;
  countryContestant?: CountryContestant;
  onClose: () => void;
};

/**
 * A modal for displaying song details with a tabbed view: lyrics, an in-app
 * video player, and the song's voting results (which countries gave what
 * points, split by jury / televote where available). It's opened from the
 * detailsCard. Data loading and tab state live in useSongModal; each tab body
 * is its own component under ./song.
 */
const SongModal: React.FC<SongModalProps> = (props: SongModalProps) => {
  const m = useSongModal({ isOpen: props.isOpen, countryContestant: props.countryContestant });
  const { contestant, videoId } = m;

  const TabButton: React.FC<{ tab: TabKey; icon: typeof faAlignLeft; label: string }> = ({
    tab,
    icon,
    label,
  }) => (
    <li className="mr-0 sm:mr-2">
      <button
        onClick={() => m.selectTab(tab)}
        aria-label={label}
        title={label}
        className={`inline-flex items-center gap-2 justify-center px-[14px] sm:px-4 py-3 border-b-2 border-transparent ${
          m.activeTab === tab
            ? 'text-[var(--er-interactive-primary)] !border-[var(--er-interactive-primary)]'
            : 'hover:text-[var(--er-text-muted)]'
        }`}
      >
        <FontAwesomeIcon className="text-md" icon={icon} fixedWidth />
        <span className="text-sm">{label}</span>
      </button>
    </li>
  );

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      className="z-50 select-text h-[36em] gradient-background-modal"
    >
      <div className="-mt-[0.5em] mr-[1.2em] mb-3">
        <div className="font-semibold text-base text-[var(--er-text-secondary)] pr-6">
          {props.countryContestant?.country.name} &ndash; {contestant?.artist}
        </div>
        <div className="text-sm text-[var(--er-text-tertiary)] italic mt-[0.15em]">
          "{contestant?.song}"
        </div>
      </div>

      <div className="border-b border-[var(--er-border-secondary)]">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-[var(--er-text-muted)] dark:text-[var(--er-text-subtle)]">
          <TabButton tab="lyrics" icon={faAlignLeft} label="Lyrics" />
          {videoId && <TabButton tab="video" icon={faPlay} label="Video" />}
          {m.hasVotes && <TabButton tab="votes" icon={faChartColumn} label="Votes" />}
        </ul>
      </div>

      {/* fixed-height body so the modal doesn't resize when switching tabs */}
      <div className="flex-1 min-h-0 flex flex-col">
        {m.activeTab === 'lyrics' && (
          <SongLyricsTab
            composers={m.composers}
            lyricists={m.lyricists}
            hasLyrics={m.hasLyrics}
            lyrics={m.lyrics}
            engLyrics={m.engLyrics}
            showEng={m.showEng}
            showEngLyrics={m.showEngLyrics}
            updateShowEngLyrics={m.updateShowEngLyrics}
          />
        )}

        {/* Gated on isOpen so closing the modal hands the player off immediately
                (rather than letting it shrink with the modal's exit animation). */}
        {m.activeTab === 'video' && videoId && props.isOpen && props.countryContestant && (
          <SongVideoTab
            videoId={videoId}
            countryContestant={props.countryContestant}
            youtubeUrl={contestant?.youtube}
            artist={contestant?.artist}
            song={contestant?.song}
            popOut={m.popOut}
          />
        )}

        {m.activeTab === 'votes' && (
          <SongVotesTab
            roundVotes={m.roundVotes}
            selectedRound={m.selectedRound}
            setSelectedRound={m.setSelectedRound}
            activeRoundVotes={m.activeRoundVotes}
            hasJuryTeleSplit={m.hasJuryTeleSplit}
            sortKey={m.sortKey}
            sortDir={m.sortDir}
            onSort={m.handleSort}
            sortedVotes={m.sortedVotes}
          />
        )}
      </div>
    </Modal>
  );
};

export default SongModal;
