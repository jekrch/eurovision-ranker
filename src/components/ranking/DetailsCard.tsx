import classNames from 'classnames';
import { type FC, useRef, useEffect } from 'react';
import { FaFileAlt, FaTv } from 'react-icons/fa';
import Flag from "react-world-flags"
import { CountryContestant } from '../../data/CountryContestant';
import { AppState } from '../../redux/store';
import { voteCodeHasType } from '../../utilities/VoteProcessor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleDown, faAngleDoubleUp, faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { getContestantCategoryRankingsFromUrl, getCountryCategoryRankingsFromUrl } from '../../utilities/CategoryUtil';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';

export interface DetailsCardProps {
  rank?: number;
  countryContestant: CountryContestant;
  className?: string;
  isDragging: boolean;
  categoryScrollPosition: number;
  onCategoryScroll: (callback: React.UIEvent<HTMLDivElement>) => void;
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
  const vote = useAppSelector((state: AppState) => state.vote);
  const categories = useAppSelector((state: AppState) => state.categories);
  const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
  const isGlobalMode = useAppSelector((state: AppState) => state.globalSearch);
  const showTotalRank = useAppSelector((state: AppState) => state.showTotalRank);
  const showComparison = useAppSelector((state: AppState) => state.showComparison);
  const contestant = props.countryContestant.contestant;
  const country = props.countryContestant.country;
  const categoryRankingsRef = useRef<HTMLDivElement>(null);

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

  //console.log(categoryRankings)
  /**
   * Returns the difference between the provided category rank and the actualRank along 
   * with an up/down angle icon to represent the diff. 
   * 
   * @param props 
   * @param categoryRank 
   * @returns 
   */
  function getRankIconaAndDiff(actualRank: number | undefined, categoryRank: number | undefined) {
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
          "m-auto text-slate-400 bg-[#22222f]x bg-[#03022d] bg-opacity-30 no-select",
          "relative mx-[.5rem] min-h-[2.5em] py-[0.4em] flex flex-row", 
          "items-stretch !cursor-grabber whitespace-normal text-sm overflow-hidden",
          "shadow rounded  border border-0.5",
          props.isDragging ? "shadow-slate-700 shadow-sm border-solid" : "",
          !props.isDragging && props.rank === 1 ? "first-card-glow" : "",
          props.rank ? "border-solid border-slate-400" : "border-dashed",
        )}
      >
        <div className="-my-2 flex-shrink-0 pb-[1px] mr-3 font-bold w-8 pr-[0.01em] border-r-[0.05em] border-[#334678]x border-slate-500 bg-[#334678] bg-opacity-80 text-slate-300 tracking-tighter items-center justify-center flex text-lg font-monox rounded-sm">
          {props.rank}
        </div>

        <div className="relative w-12 mr-3 flex items-center">
          <div className="relative w-full">
            {country.key !== 'yu' ? (
              <Flag code={country.key} className="w-full opacity-80" />
            ) : (
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Yugoslavia_%281946-1992%29.svg"
                alt="Flag of Yugoslavia"
                className="w-full h-auto opacity-80"
              />
            )}
            {isGlobalMode && contestant && (
              <div className="bottom-0 left-0 right-0 bg-slate-600 bg-opacity-30 text-slate-300 text-sm font-bold text-center py-1">
                {contestant.year}
              </div>
            )}
          </div>
        </div>

        <div className={classNames("flex-grow text-slate-300 font-bold")}>
          <div className={`overflow-hidden overflow-ellipsis`}>
            <span className="float-right flex flex-row items-center">
              {contestant?.youtube &&
                <div
                  onClick={() => { props.openSongModal() }}
                  className='cursor-pointer rounded text-slate-500 hover:text-slate-100 mr-[0.7em]'>
                  <FaFileAlt className='text-base' />
                </div>
              }
              {contestant?.youtube &&
                <a href={contestant?.youtube} target="_blank" rel="noopener noreferrer" className='rounded text-slate-500 hover:text-slate-100'>
                  <FaTv className='text-xl mr-[0.3em]' />
                </a>
              }
            </span>
            <span className="overflow-hidden overflow-ellipsis">{country?.name}</span>
          </div>

          {/* <i className={`z-1 float-right ml-3 flag-icon -mr-2 ${props.country?.icon}`} /> */}

          <div className="pr-[1.5em] flex flex-grow items-center justify-between font-normal">
            <div className="">
              {contestant ? (
                <>
                  <span className="font-xs text-sm text-slate-400">
                    {contestant?.artist}
                  </span>
                  <span className="ml-2 font-xs text-xs text-slate-400">
                    {contestant.song?.length && !contestant.song?.includes("TBD") ? `"${contestant.song}"` : `${contestant.song}`}
                  </span>

                  <div className="mt-1 font-xs text-xs text-gray-400 mb-1 flex flex-wrap">
                    {(contestant?.votes?.totalPoints !== undefined && voteCodeHasType(vote, 't')) &&
                      <div className="flex items-center mr-2">
                        <span className="text-gray-500">total:&nbsp;</span>
                        <span>{`${contestant?.votes?.totalPoints}`}</span>
                      </div>
                    }
                    {(contestant?.votes?.telePoints !== undefined && voteCodeHasType(vote, 'tv')) &&
                      <div className="flex items-center mr-2">
                        <span className="text-gray-500">tele:&nbsp;</span>
                        <span>{`${contestant?.votes?.telePoints}`}</span>
                      </div>
                    }
                    {(contestant?.votes?.juryPoints !== undefined && voteCodeHasType(vote, 'j')) &&
                      <div className="flex items-center mr-2">
                        <span className="text-gray-500">jury:&nbsp;</span>
                        <span>{`${contestant?.votes?.juryPoints}`}</span>
                      </div>
                    }
                  </div>
                </>
              ) :
                <>
                  <span className="font-xs text-xs text-gray-500 strong">
                    Did not participate
                  </span>
                </>
              }
            </div>
          </div>


        </div>

        {/* 
          if we are not in the immutable, categorized total rank mode,
          show a gripper indicating that the cards can be dragged
        */}
        {!showTotalRank &&
          <div id="right-edge" className="mb-[0.2em] absolute bottom-0 right-0 flex-shrink-0 flex flex-row justify-between text-xl font-bold text-slate-500">
            <div id="gripper" className="text-right pl-[0.3em] mr-[0.3em]">
              &#8942;&#8942;
            </div>
          </div>
        }

      </div>
      {categories?.length > 0 && (showTotalRank || showComparison) && (
        <div
          ref={categoryRankingsRef}
          className="mt-0 mx-[0.6em] shadow-lg rounded-b-md bg-[#1c214c] bg-opacity-100 border-gray-600 border-x-[0.01em] border-b-[0.01em] overflow-x-auto relative ml-[2em]"
          onScroll={props.onCategoryScroll}
        >
          <div className="flex">
            {categories.map((category, index) => {

              if (!showTotalRank && index === activeCategory) {
                return;
              }

              const categoryRankIndex = categoryRankings?.[category.name];

              var { arrowIcon, rankDifference } = getRankIconaAndDiff(
                props.rank, categoryRankIndex
              );

              return (
                <div
                  key={index}
                  className="px-2 py-1 text-xs flex-shrink-0 text-slate-400 h-[2em] flex"
                  title={`weight: ${category.weight}`}
                >
                  <span className="">{category.name}:</span>{' '}
                  <span className="ml-1 font-medium text-slate-300">{categoryRankIndex || '--'}</span>
                  {arrowIcon &&
                    <FontAwesomeIcon
                      icon={arrowIcon}
                      className={classNames("pt-[0.2em] ml-1 inline-block text-sm text-opacity-40", rankDifference < 0 ? 'text-green-500' : 'text-red-500')}
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

