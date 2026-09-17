import classNames from 'classnames';
import React from 'react';
import { FaYoutube } from 'react-icons/fa';

import { CountryContestant } from '../../data/CountryContestant';
import { useAppSelector } from '../../hooks/stateHooks';
import { getYoutubeThumbnail } from '../../utilities/YoutubeUtil';
import { LazyLoadedFlag } from '../LazyFlag';

interface SorterContestantCardProps {
  countryContestant: CountryContestant;
  showAsPreviousChoice?: boolean;
}

const SorterContestantCard: React.FC<SorterContestantCardProps> = ({
  countryContestant,
  showAsPreviousChoice,
}) => {
  const isGlobalMode = useAppSelector((state) => state.root.globalSearch);
  const showThumbnail = useAppSelector((state) => state.root.showThumbnail);

  const contestant = countryContestant.contestant;
  const country = countryContestant.country;
  const youtubeThumb = getYoutubeThumbnail(contestant?.youtube);

  // flag related styles
  const flagContainerStyles =
    'absolute top-0 left-0 h-full w-[12em] pointer-events-none overflow-hidden';
  const flagImageStyles = 'w-full h-full object-cover opacity-60';
  // apply mask directly as inline style for flag image
  const flagMaskStyle: React.CSSProperties = {
    display: 'block',
    WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%)',
    maskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%)',
    objectPosition: 'center center',
    objectFit: 'cover',
  };

  // thumbnail related styles
  const thumbContainerStyles =
    'absolute top-0 right-0 h-full w-[35%] pointer-events-none overflow-hidden';
  const thumbImageStyles = 'w-full h-full object-cover opacity-50';
  // apply mask directly as inline style for thumbnail image
  const thumbMaskStyle: React.CSSProperties = {
    display: 'block',
    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 40%)',
    maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 40%)',
    objectPosition: '50% 50%',
    objectFit: 'cover',
    transform: 'scale(1.05)',
  };

  // fade the artist/song bar backgrounds out toward the right so the thumbnail
  // shows through. the dark scrim is solid on the left (keeping text readable
  // over the flag) and fades to fully transparent before the right edge.
  const nameBarBgStyle: React.CSSProperties = {
    backgroundImage:
      'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.32) 45%, transparent 80%)',
  };

  // note: removed useEffect hook for flag-mask css as styles are applied inline

  return (
    <div className="relative">
      {/* highlight if this was the previous choice */}
      {showAsPreviousChoice && (
        <>
          <div className="absolute inset-0 bg-[var(--er-interactive-primary)] opacity-20 rounded-xl pointer-events-none z-20"></div>
          <div className="absolute inset-0 rounded-xl pointer-events-none z-20 ring-2 ring-inset ring-[var(--er-interactive-primary)]"></div>
        </>
      )}

      <div
        className={classNames(
          'm-auto text-[var(--er-text-tertiary)] bg-[var(--er-surface-primary)] bg-opacity-30 no-select choice-background',
          'relative mx-auto min-h-[9em]', // maintain minimum height
          'flex flex-col items-stretch whitespace-normal text-sm overflow-hidden', // allow internal overflow hidden
          'border border-solid border-[color-mix(in_srgb,var(--er-border-primary)_45%,transparent)] rounded-xl',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.3),0_4px_12px_-4px_rgba(0,0,0,0.35)]',
          'w-full z-10',
        )}
      >
        {/* flag background */}
        <div className={flagContainerStyles}>
          <div className="relative w-full h-full">
            {country.key !== 'yu' ? (
              <LazyLoadedFlag
                code={country.key}
                className={flagImageStyles}
                style={flagMaskStyle}
              />
            ) : (
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Yugoslavia_%281946-1992%29.svg"
                alt="Flag of Yugoslavia"
                className={flagImageStyles}
                style={flagMaskStyle} // apply mask style directly
              />
            )}
          </div>
        </div>

        {/* youtube thumbnail */}
        {youtubeThumb && showThumbnail && (
          <div className={thumbContainerStyles}>
            <div className="relative w-full h-full">
              <img
                src={youtubeThumb}
                className={thumbImageStyles}
                style={thumbMaskStyle} // apply mask style directly
                alt=""
              />
            </div>
          </div>
        )}

        {/* content */}
        {/* ensure content area uses full height available from min-h */}
        <div className="relative z-10 flex flex-col items-stretch justify-center w-full p-2 pl-32 min-h-[9em]">
          <div className="flex-grow text-[var(--er-text-secondary)] font-bold flex flex-col justify-center">
            {/* country name and youtube link */}
            {/* country name container prevents pushing youtube link down */}
            <div className="flex justify-between items-center mb-2">
              {/* allow country name to truncate */}
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-lg font-semibold tracking-tight text-[var(--er-text-primary)] bg-black/30 ring-1 ring-inset ring-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-sm shadow-black/20 mr-2 flex-shrink">
                {country?.name}
              </span>

              {/* keep youtube link from shrinking */}
              <span className="flex flex-row items-center flex-shrink-0">
                {contestant?.youtube && (
                  <a
                    href={contestant?.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded text-[var(--er-accent-error)] hover:brightness-125 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-[filter] duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaYoutube className="text-4xl" title="Watch on YouTube" />
                  </a>
                )}
              </span>
            </div>

            {/* artist, song, and year info */}
            <div className="pr-2 font-normal">
              {contestant ? (
                <>
                  {/* use block and truncate artist name to prevent wrapping */}
                  <div
                    className="block font-semibold text-base rounded-lg px-2 py-1 text-[var(--er-text-primary)] overflow-hidden text-ellipsis whitespace-nowrap"
                    style={nameBarBgStyle}
                  >
                    {contestant?.artist}
                  </div>

                  {/* use block and truncate song name to prevent wrapping */}
                  <div
                    style={nameBarBgStyle}
                    className="mt-2 block font-medium text-sm rounded-lg px-2 py-1 text-[var(--er-text-secondary)] overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {contestant.song?.length && !contestant.song?.toLowerCase().includes('tbd')
                      ? `"${contestant.song}"`
                      : `${contestant.song}`}
                  </div>

                  {isGlobalMode && contestant && (
                    // year tag remains inline-block as it's short
                    <div className="bg-black/30 ring-1 ring-inset ring-white/10 backdrop-blur-sm text-[var(--er-text-secondary)] text-xs font-semibold tabular-nums tracking-wide text-center py-0.5 px-2 mt-2 inline-block rounded-md ml-2">
                      {contestant.year}
                    </div>
                  )}
                </>
              ) : (
                <span className="font-medium text-sm bg-black/30 ring-1 ring-inset ring-white/10 backdrop-blur-sm rounded-lg inline-block px-2.5 py-1 text-[var(--er-text-tertiary)] italic">
                  did not participate
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SorterContestantCard;
