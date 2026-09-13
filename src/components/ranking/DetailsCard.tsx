import {
  faAngleDoubleDown,
  faAngleDoubleUp,
  faAngleDown,
  faAngleUp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { type FC, useRef, useEffect } from 'react';
import { FaInfoCircle } from 'react-icons/fa';

import { CountryContestant } from '../../data/CountryContestant';
import { useAppSelector } from '../../hooks/stateHooks';
import { AppState } from '../../redux/store';
import { getContestantCategoryRankingsFromUrl } from '../../utilities/CategoryUtil';
import { voteCodeHasType } from '../../utilities/VoteProcessor';
import { getYoutubeThumbnail, getYouTubeVideoId } from '../../utilities/YoutubeUtil';
import { LazyLoadedFlag } from '../LazyFlag';
import { useVideoPip } from '../video/VideoPipContext';

export interface DetailsCardProps {
  rank?: number;
  countryContestant: CountryContestant;
  className?: string;
  isDragging: boolean;
  categoryScrollPosition: number;
  onCategoryScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  openSongModal: () => void;
}

/**
 * The country contestant card that is displayed per ranked item in the
 * details view
 *
 * @param props
 * @returns
 */
export const DetailsCard: FC<DetailsCardProps> = (props) => {
  const categories = useAppSelector((state: AppState) => state.root.categories);
  const activeCategory = useAppSelector((state: AppState) => state.root.activeCategory);
  const isGlobalMode = useAppSelector((state: AppState) => state.root.globalSearch);
  const showTotalRank = useAppSelector((state: AppState) => state.root.showTotalRank);
  const showComparison = useAppSelector((state: AppState) => state.root.showComparison);
  const showThumbnail = useAppSelector((state: AppState) => state.root.showThumbnail);
  const showPlace = useAppSelector((state: AppState) => state.root.showPlace);
  const vote = useAppSelector((state: AppState) => state.root.vote);
  const contestant = props.countryContestant.contestant;
  const country = props.countryContestant.country;
  const categoryRankingsRef = useRef<HTMLDivElement>(null);

  const youtubeThumb = getYoutubeThumbnail(contestant?.youtube);

  // when this card's video is the one loaded in the floating pip, flag it
  const { pipVideoId } = useVideoPip();
  const cardVideoId = contestant?.youtube ? getYouTubeVideoId(contestant.youtube) : null;
  const isNowPlaying = !!pipVideoId && cardVideoId === pipVideoId;

  // the #1 card gets a pulsing glow: an inner radial fill (first-card-glow) plus
  // an outer halo rendered behind the card (first-card-halo) so it can spill
  // outside the card's overflow-hidden box
  const showGlow = !props.isDragging && props.rank === 1;

  useEffect(() => {
    if (categoryRankingsRef.current) {
      categoryRankingsRef.current.scrollLeft = props.categoryScrollPosition;
    }
  }, [props.categoryScrollPosition]);

  function getCategoryRankings() {
    if (!showTotalRank && !showComparison) return undefined;
    return getContestantCategoryRankingsFromUrl(categories, props.countryContestant);
  }

  const categoryRankings = getCategoryRankings();

  /**
   * Returns the difference between the provided category rank and the actualRank along
   * with an up/down angle icon to represent the diff.
   *
   * @param props
   * @param categoryRank
   * @returns
   */
  function getRankIconAndDiff(actualRank: number | undefined, categoryRank: number | undefined) {
    const rankDifference = actualRank && categoryRank ? categoryRank - actualRank : 0;
    let arrowIcon = null;
    if (rankDifference < 0) {
      arrowIcon = Math.abs(rankDifference) >= 3 ? faAngleDoubleUp : faAngleUp;
    } else if (rankDifference > 0) {
      arrowIcon = rankDifference >= 3 ? faAngleDoubleDown : faAngleDown;
    }
    return { arrowIcon, rankDifference };
  }

  return (
    <div>
      <div className={classNames('relative mx-[.5rem]', { isolate: showGlow })}>
        {showGlow && <span className="first-card-halo" aria-hidden="true" />}
        <div
          key={props.rank ? 'ranked-' : `unranked-card-${contestant?.id ?? country.id}`}
          className={classNames(
            props.className,
            'm-auto text-content-tertiary bg-[var(--er-surface-card)] no-select',
            'relative min-h-[2.5em] py-[0.4em] flex flex-row',
            'items-stretch !cursor-grabber whitespace-normal text-sm overflow-hidden',
            'border border-solid border-line-secondary rounded-lg',
            'transition-shadow duration-fast ease-out',
            props.isDragging ? 'shadow-drag' : '',
            showGlow ? 'first-card-glow' : '',
          )}
        >
          {youtubeThumb && showThumbnail && (
            <div className="absolute top-0 right-0 h-full w-[30%] pointer-events-none overflow-hidden">
              <div className="relative w-full h-full">
                <img
                  src={youtubeThumb}
                  className="w-full h-full object-cover opacity-40"
                  style={{
                    display: 'block',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%)',
                    maskImage: 'linear-gradient(to right, transparent 0%, black 30%)',
                    objectPosition: '50% 50%',
                    transform: 'scale(1.1)',
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.parentElement!.parentElement!.style.display = 'none';
                  }}
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.naturalWidth === 120 || target.naturalWidth === 320) {
                      target.parentElement!.parentElement!.style.display = 'none';
                    }
                  }}
                  alt=""
                />
              </div>
            </div>
          )}

          <div className="relative z-10 flex flex-row items-stretch w-full">
            <div className="tabular relative -my-2 flex-shrink-0 w-8 border-r border-line-secondary bg-[var(--er-surface-accent-70)] text-content-primary font-semibold items-center justify-center flex text-lg">
              {props.rank}
              {isNowPlaying && (
                <span
                  className="eq-bars absolute bottom-[3px] left-1/2 -translate-x-1/2"
                  title="Now playing"
                  aria-label="Now playing"
                >
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </div>

            <div className="relative w-[5em] min-w-[4rem] my-1 ml-2 -mr-3 self-stretch overflow-hidden">
              {country.key !== 'yu' ? (
                <LazyLoadedFlag
                  code={country.key}
                  className="block w-full h-full object-cover opacity-80"
                  style={{
                    WebkitMaskImage:
                      'linear-gradient(to right, rgba(0,0,0,0.9) 50%, transparent 100%)',
                    maskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 50%, transparent 100%)',
                  }}
                />
              ) : (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Yugoslavia_%281946-1992%29.svg"
                  alt="Flag of Yugoslavia"
                  className="block w-full h-full object-cover opacity-80"
                  style={{
                    WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
                    maskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
                  }}
                />
              )}
              {isGlobalMode && contestant && (
                <div className="tabular absolute bottom-0 left-0 right-0 bg-[var(--er-button-neutral-40)] text-content-secondary text-xs font-medium text-center py-1 z-10">
                  {contestant.year}
                </div>
              )}
            </div>
            {/* END OF UPDATED FLAG SECTION */}

            {/* Text content and row actions share one grid: a flexible text
                column and an auto-width action column. Everything lines up on
                the same edges whichever display toggles are on. */}
            <div className="min-w-0 flex-grow grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 items-start pl-3 pr-1">
              <div className="min-w-0">
                <div className="truncate text-content-secondary font-medium">{country?.name}</div>

                {contestant ? (
                  <>
                    <div className="min-w-0 font-normal">
                      <span className="text-sm text-content-tertiary">{contestant?.artist}</span>
                      <span className="ml-2 text-xs text-content-tertiary rounded-sm bg-[var(--er-surface-tertiary-70)]">
                        {contestant.song?.length && !contestant.song?.includes('TBD')
                          ? `"${contestant.song}"`
                          : `${contestant.song}`}
                      </span>
                    </div>

                    {/* one rhythm for every metadata row, rather than a mix of
                        mt-1/mb-1/mb-0 */}
                    <div className="tabular mt-1 space-y-0.5 text-micro text-content-subtle font-normal">
                      {(contestant?.votes?.totalPoints !== undefined &&
                        voteCodeHasType(vote, 't')) ||
                      (contestant?.votes?.telePoints !== undefined &&
                        voteCodeHasType(vote, 'tv')) ||
                      (contestant?.votes?.juryPoints !== undefined &&
                        voteCodeHasType(vote, 'j')) ? (
                        <div className="flex flex-wrap gap-x-3">
                          {contestant?.votes?.totalPoints !== undefined &&
                            voteCodeHasType(vote, 't') && (
                              <span>
                                <span className="text-content-muted">total </span>
                                {contestant.votes.totalPoints}
                              </span>
                            )}
                          {contestant?.votes?.telePoints !== undefined &&
                            voteCodeHasType(vote, 'tv') && (
                              <span>
                                <span className="text-content-muted">tele </span>
                                {contestant.votes.telePoints}
                              </span>
                            )}
                          {contestant?.votes?.juryPoints !== undefined &&
                            voteCodeHasType(vote, 'j') && (
                              <span>
                                <span className="text-content-muted">jury </span>
                                {contestant.votes.juryPoints}
                              </span>
                            )}
                        </div>
                      ) : null}

                      {(contestant?.finalsRank ?? contestant?.contestRank) && showPlace && (
                        <div>
                          <span className="text-content-muted">place </span>
                          {contestant?.finalsRank ?? contestant?.contestRank}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-content-muted">Did not participate</span>
                )}
              </div>

              {/* Action column: song info at the top, drag affordance at the
                  bottom, both on the card's right edge. */}
              <div className="flex flex-col items-end justify-between self-stretch">
                {contestant?.youtube ? (
                  <button
                    type="button"
                    aria-label={`Song details for ${country?.name}`}
                    onClick={props.openSongModal}
                    className="rounded text-content-muted hover:text-content-secondary transition-colors duration-fast ease-out"
                  >
                    <FaInfoCircle className="text-base" title="song info" />
                  </button>
                ) : (
                  <span />
                )}

                {/* gripper: shown unless we are in the immutable, categorized
                    total-rank mode, where cards cannot be reordered */}
                {!showTotalRank && (
                  <span
                    aria-hidden="true"
                    className="leading-none text-xl text-content-muted select-none"
                  >
                    &#8942;&#8942;
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {categories?.length > 0 && (showTotalRank || showComparison) && (
        <div
          ref={categoryRankingsRef}
          className="mt-0 mx-[0.6em] rounded-b-md bg-[var(--er-surface-tertiary)] border-line-medium border-x border-b overflow-x-auto relative ml-[2em]"
          onScroll={props.onCategoryScroll}
        >
          <div className="flex">
            {categories.map((category, index) => {
              if (!showTotalRank && index === activeCategory) {
                return null;
              }
              const categoryRankIndex = categoryRankings?.[category.name];
              const { arrowIcon, rankDifference } = getRankIconAndDiff(
                props.rank,
                categoryRankIndex,
              );
              return (
                <div
                  key={index}
                  className="px-2 py-1 text-xs flex-shrink-0 text-[var(--er-text-tertiary)] h-[2em] flex items-center"
                  title={`weight: ${category.weight}`}
                >
                  <span className="">{category.name}:</span>{' '}
                  <span className="ml-1 font-medium text-[var(--er-text-secondary)]">
                    {categoryRankIndex || '--'}
                  </span>
                  {arrowIcon && (
                    <FontAwesomeIcon
                      icon={arrowIcon}
                      className={classNames(
                        'ml-1 inline-block text-sm text-opacity-40',
                        rankDifference < 0
                          ? 'text-[var(--er-accent-success)]'
                          : 'text-[var(--er-accent-error)]',
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
