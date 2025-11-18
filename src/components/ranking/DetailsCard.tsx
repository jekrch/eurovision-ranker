import classNames from 'classnames';
import { type FC, useRef, useEffect } from 'react';
import { FaFileAlt, FaTv } from 'react-icons/fa';
import { LazyLoadedFlag } from '../LazyFlag';
import { CountryContestant } from '../../data/CountryContestant';
import { AppState } from '../../redux/store';
import { voteCodeHasType } from '../../utilities/VoteProcessor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleDown, faAngleDoubleUp, faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { getContestantCategoryRankingsFromUrl } from '../../utilities/CategoryUtil';
import { useAppSelector } from '../../hooks/stateHooks';
import { getYoutubeThumbnail, } from '../../utilities/YoutubeUtil';

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
  const categories = useAppSelector((state: AppState) => state.categories);
  const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
  const isGlobalMode = useAppSelector((state: AppState) => state.globalSearch);
  const showTotalRank = useAppSelector((state: AppState) => state.showTotalRank);
  const showComparison = useAppSelector((state: AppState) => state.showComparison);
  const showThumbnail = useAppSelector((state: AppState) => state.showThumbnail);
  const showPlace = useAppSelector((state: AppState) => state.showPlace);
  const vote = useAppSelector((state: AppState) => state.vote);
  const contestant = props.countryContestant.contestant;
  const country = props.countryContestant.country;
  const categoryRankingsRef = useRef<HTMLDivElement>(null);

  const youtubeThumb = getYoutubeThumbnail(contestant?.youtube);

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
      <div
        key={props.rank ? 'ranked-' : `unranked-card-${contestant?.id ?? country.id}`}
        className={classNames(
          props.className,
          "m-auto text-[var(--er-text-tertiary)] bg-[var(--er-surface-primary)]x bg-opacity-30 no-select",
          "relative mx-[.5rem] min-h-[2.5em] py-[0.4em] flex flex-row", // Main card padding is py-[0.4em]
          "items-stretch !cursor-grabber whitespace-normal text-sm overflow-hidden",
          "shadow border border-0.5 border-solid border-[var(--er-border-primary)] rounded-l-lg rounded-r-sm",
          props.isDragging ? "shadow-[var(--er-button-primary-hover)] shadow-sm border-solid" : "",
          !props.isDragging && props.rank === 1 ? "first-card-glow" : ""
        )}
        style={{
          position: 'relative',
        }}
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

          <div className="-my-2 flex-shrink-0 pb-[1px] mr-0 font-bold w-8 pr-[0.01em] border-r-[0.05em] border-[var(--er-border-secondary)] bg-[var(--er-surface-accent-70)] bg-opacity-70 text-[var(--er-text-primary)] tracking-tighter items-center justify-center flex text-lg rounded-sm">
            {props.rank}
          </div>

          <div className="relative w-[5em] min-w-[4rem] -my-[0.2em]x my-1 ml-[0.2em]x ml-2 -mr-3 self-stretch overflow-hidden">
            {country.key !== 'yu' ? (
              <LazyLoadedFlag
                code={country.key}
                className="block w-full h-full object-cover opacity-80"
                style={{
                     WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 50%, transparent 100%)',
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
              <div className="absolute bottom-0 left-0 right-0 bg-[var(--er-button-neutral-40)] text-[var(--er-text-secondary)] text-sm font-bold text-center py-1 z-10">
                {contestant.year}
              </div>
            )}
          </div>
          {/* END OF UPDATED FLAG SECTION */}

          {/* Text content section. Starts immediately after the flag container */}
          <div className={classNames("flex-grow text-[var(--er-text-secondary)] font-bold pl-3")}> {/* Added pl-3 for spacing if flag edge is too abrupt */}
            <div className={`overflow-hidden overflow-ellipsis`}>
              <span className={classNames("float-right flex flex-row items-center", contestant?.youtube ? 'bg-opacity-70 bg-[var(--er-surface-tertiary-70)] border-[0.1em] border-[var(--er-border-tertiary)] rounded-[0.2em] px-[0.5em] py-[0.1em] mr-[0.4em]': '')}>
                {contestant?.youtube &&
                  <div
                    onClick={() => { props.openSongModal() }}
                    className='cursor-pointer rounded text-[var(--er-text-muted)] hover:text-[var(--er-text-secondary)] mr-[1.3em] -ml-1'>
                    <FaFileAlt className='text-base' title="lyrics"/>
                  </div>
                }
                {contestant?.youtube &&
                  <a href={contestant?.youtube} target="_blank" rel="noopener noreferrer" className='rounded text-[var(--er-text-muted)] hover:text-[var(--er-text-secondary)]'>
                    <FaTv className='text-xl -m-[0.1em] my-[0.1em]' title="youtube"/>
                  </a>
                }
              </span>
              <span className="overflow-hidden overflow-ellipsis">{country?.name}</span>
            </div>

            <div className="pr-[1.5em] flex flex-grow items-center justify-between font-normal">
              <div className="">
                {contestant ? (
                  <>
                    <span className="font-xs text-sm text-[var(--er-text-tertiary)]">
                      {contestant?.artist}
                    </span>
                    <span className={classNames("ml-2 font-xs text-xs text-[var(--er-text-tertiary)] rounded-sm bg-[var(--er-surface-tertiary-70)] bg-opacity-60")}>
                      {contestant.song?.length && !contestant.song?.includes("TBD") ? `"${contestant.song}"` : `${contestant.song}`}
                    </span>

                    <div className="mt-1 font-xs text-xs text-[var(--er-text-subtle)] mb-1 flex flex-wrap">
                      {(contestant?.votes?.totalPoints !== undefined && voteCodeHasType(vote, 't')) &&
                        <div className="flex items-center mr-2">
                          <span className="text-[var(--er-text-muted)]">total:&nbsp;</span>
                          <span>{`${contestant?.votes?.totalPoints}`}</span>
                        </div>
                      }
                      {(contestant?.votes?.telePoints !== undefined && voteCodeHasType(vote, 'tv')) &&
                        <div className="flex items-center mr-2">
                          <span className="text-[var(--er-text-muted)]">tele:&nbsp;</span>
                          <span>{`${contestant?.votes?.telePoints}`}</span>
                        </div>
                      }
                      {(contestant?.votes?.juryPoints !== undefined && voteCodeHasType(vote, 'j')) &&
                        <div className="flex items-center mr-2">
                          <span className="text-[var(--er-text-muted)]">jury:&nbsp;</span>
                          <span>{`${contestant?.votes?.juryPoints}`}</span>
                        </div>
                      }
                    </div>
                    {(contestant?.finalsRank && showPlace) &&
                        <div className="mt-1 font-xs text-xs text-[var(--er-text-subtle)] mb-0 flex flex-wrap items-center mr-2">
                          <span className="text-[var(--er-text-muted)]">place:&nbsp;</span>
                          <span>{`${contestant?.finalsRank}`}</span>
                        </div>
                      }
                  </>
                ) : (
                  <span className="font-xs text-xs text-[var(--er-text-muted)] font-bold">
                    Did not participate
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 
            if we are not in the immutable, categorized total rank mode,
            show a gripper indicating that the cards can be dragged
          */}

          {!showTotalRank &&
            <div id="right-edge" className="mb-[0em] absolute bottom-0 right-0 flex-shrink-0 flex flex-row justify-between text-xl font-bold text-[var(--er-text-muted)] z-10">
              <div id="gripper" className="text-right pl-[0.3em] mr-[0.3em]">
                &#8942;&#8942;
              </div>
            </div>
          }
        </div>
      </div>

      {categories?.length > 0 && (showTotalRank || showComparison) && (
        <div
          ref={categoryRankingsRef}
          className="mt-0 mx-[0.6em] shadow-lg rounded-b-md bg-[var(--er-surface-tertiary)] bg-opacity-100 border-[var(--er-border-medium)] border-x-[0.01em] border-b-[0.01em] overflow-x-auto relative ml-[2em]"
          onScroll={props.onCategoryScroll}
        >
          <div className="flex">
            {categories.map((category, index) => {
              if (!showTotalRank && index === activeCategory) {
                return null;
              }
              const categoryRankIndex = categoryRankings?.[category.name];
              const { arrowIcon, rankDifference } = getRankIconAndDiff(
                props.rank, categoryRankIndex
              );
              return (
                <div
                  key={index}
                  className="px-2 py-1 text-xs flex-shrink-0 text-[var(--er-text-tertiary)] h-[2em] flex items-center"
                  title={`weight: ${category.weight}`}
                >
                  <span className="">{category.name}:</span>{' '}
                  <span className="ml-1 font-medium text-[var(--er-text-secondary)]">{categoryRankIndex || '--'}</span>
                  {arrowIcon &&
                    <FontAwesomeIcon
                      icon={arrowIcon}
                      className={classNames("ml-1 inline-block text-sm text-opacity-40", rankDifference < 0 ? 'text-[var(--r-accent-success)]' : 'text-[var(--r-accent-error)]')}
                    />
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};