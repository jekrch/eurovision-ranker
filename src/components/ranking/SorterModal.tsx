import React, { useState, useEffect, useCallback, CSSProperties } from 'react';
import { CountryContestant } from '../../data/CountryContestant';
import { faChevronLeft, faChevronRight, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, AppState } from '../../redux/store';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import classNames from 'classnames';
import { setRankedItems } from '../../redux/rootSlice';
import {
  initSortState,
  advanceAlgorithm,
  processChoice,
  getSortedItems,
  SortState,
  ActionType,
} from '../../utilities/SorterUtils';
import { LazyLoadedFlag } from '../LazyFlag';
import { getYoutubeThumbnail } from '../../utilities/YoutubeUtil';
import Modal from '../modals/Modal';
import IconButton from '../IconButton';
import { FaYoutube } from 'react-icons/fa';
import { updateUrlFromRankedItems } from '../../utilities/UrlUtil';
import TooltipHelp from '../TooltipHelp';

// types
interface SorterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems: CountryContestant[];
}

export interface Comparison {
  leftItem: CountryContestant;
  rightItem: CountryContestant;
  choice?: 'left' | 'right';
}

// contestant card props interface
interface ContestantCardProps {
  countryContestant: CountryContestant;
  isSelected?: boolean;
}

/**
 * sorter modal component that presents pairs of contestants for ranking
 * using the Ford-Johnson algorithm for optimal comparisons
 */
const SorterModal: React.FC<SorterModalProps> = ({
  isOpen,
  onClose,
  initialItems,
}) => {
  const dispatch: AppDispatch = useAppDispatch();
  const categories = useAppSelector((state: AppState) => state.categories);
  const activeCategory = useAppSelector((state: AppState) => state.activeCategory);

  // use a single sortState object to manage the entire sorting process
  const [sortState, setSortState] = useState<SortState | null>(null);

  /**
   * handle user's choice between two items
   */
  const handleChoice = useCallback((choice: 'left' | 'right') => {
    if (!sortState) return;

    // get the current comparison
    const currentComparison = sortState.comparisons[sortState.currentIndex];
    if (!currentComparison) return;

    // process the user's choice and advance the algorithm
    const newState = processChoice(sortState, choice);

    // if we're not done, continue with the next comparison
    if (!newState.isComplete) {
      setSortState(newState);
    } else {
      // we're done - set the sorted items and mark as complete
      console.log("sorting complete!");
      setSortState(newState);
    }

    // remove focus from last selected item otherwise this carries to the
    // next comparison on mobile
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [sortState]);

  /**
   * go back to previous comparison
   */
  const handleBack = useCallback(() => {
    if (!sortState || sortState.currentIndex <= 0) return;

    // create a copy of the current state
    const newState = { ...sortState };

    // remove the choice from the current comparison
    newState.comparisons = [...newState.comparisons];
    newState.comparisons[newState.currentIndex].choice = undefined;

    // go back to the previous comparison
    newState.currentIndex -= 1;

    setSortState(newState);
  }, [sortState]);

  /**
   * apply final ranking and close modal
   */
  const handleApplyRanking = useCallback(() => {
    if (!sortState || !sortState.isComplete) return;

    // get the sorted items
    const sortedItems = getSortedItems(sortState);

    if (sortedItems.length > 0) {
      // log the sorted items to help with debugging
      console.log("applying sorted items:", sortedItems);

      // make sure we have the same number of items as we started with
      if (sortedItems.length !== initialItems.length) {
        console.warn(`warning: sorted items count (${sortedItems.length}) doesn't match initial items (${initialItems.length})`);
      }

      // verify that all items have valid uids, but never replace the original data
      const validItems = sortedItems.map((item, index) => {
        // only fix the uid if it's missing, don't change anything else
        if (!item.uid) {
          return {
            ...item,
            uid: `item-${index}-${Date.now()}`
          };
        }
        return item;
      });

      // apply the ranking to the state
      dispatch(setRankedItems(validItems));

      // update url
      updateUrlFromRankedItems(
        activeCategory,
        categories,
        validItems
      );

      onClose();
    } else {
      console.error("no sorted items to apply");
      // don't apply an empty ranking, this would be worse than doing nothing
      onClose(); // close the modal anyway to avoid getting stuck
    }
  }, [sortState, dispatch, onClose, activeCategory, categories, initialItems.length]);

  // initialize the sort state when the modal opens
  useEffect(() => {
    if (isOpen && initialItems.length > 1) {
      console.log(`starting sorter with ${initialItems.length} items`);

      // initialize the sorting algorithm
      let newSortState = initSortState(initialItems);

      setSortState(newSortState); // set the initial state directly
    } else {
      setSortState(null);  // clear the state when closing or with <= 1 items
    }
  }, [isOpen, initialItems]);


  // calculate progress percentage for the bar
  const progress = sortState
    ? (sortState.comparisons.filter(c => c.choice).length / sortState.estimatedTotalComparisons) * 100
    : 0;

  // get current comparison
  const currentComparison = sortState &&
    sortState.currentIndex < sortState.comparisons.length ?
    sortState.comparisons[sortState.currentIndex] : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="!max-h-[95vh] sort-tour-step-modal px-0">
      {/* modal content wrapper with max-height and overflow styling */}
      <div className="flex flex-col max-h-[90vh] overflow-hidden">
        {/* header section - fixed at top */}
        <div className="flex-shrink-0 px-4">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className={classNames(
                "text-xl font-bold text-center w-full",
                "text-slate-200"
              )}>
                {sortState?.isComplete ? "Ranking complete" : "Choose Your Preference"}
                {!sortState?.isComplete && <TooltipHelp
                  content="Answer with your preferences and a ranking will be generated that reflects your choices. If you want to skip this, just close the window or click 'skip sorting' below."
                  className="text-slate-300 align-middle mb-1 -mr-1"
                />}
              </h2>
            </div>
            {activeCategory !== undefined && (
              <div className="items-center w-full mb-0 text-center">{categories[activeCategory!]?.name} </div>
            )}
          </div>
          <div className="mb-3">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {/* display comparison count for better user feedback */}
            <div className="text-xs text-slate-400 text-right mt-1">
              {sortState && (
                <span>
                  comparisons: {sortState.comparisons.filter(c => c.choice).length}
                  {/* ~{sortState.estimatedTotalComparisons} */}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* main content area - scrollable when needed */}
        <div className="flex-grow overflow-y-auto px-0 py-0 pt-1">
          {sortState?.isComplete ? (
            <div className="flex flex-col items-center justify-center px-4">
              <p className="mb-6 text-center text-slate-200">
                based on your choices, we've created your ranking
              </p>
            </div>
          ) : (
            currentComparison && (
              <div className="flex flex-col justify-center items-center gap-2 mb-2">
                {/* left card */}
                <div
                  onClick={() => handleChoice('left')}
                  className={classNames(
                    "w-full cursor-pointer transition-colors duration-200 md:hover:ring-2 md:hover:ring-blue-400 active:ring-2 active:ring-blue-400",
                    currentComparison.choice === 'left' ? "ring-4 ring-blue-500 rounded-lg" : "rounded-lg"
                  )}
                >
                  <ContestantCard
                    countryContestant={currentComparison.leftItem}
                    isSelected={currentComparison.choice === 'left'}
                  />
                </div>

                <div className="text-md font-bold text-slate-300">
                  vs
                </div>

                {/* right card */}
                <div
                  onClick={() => handleChoice('right')}
                  className={classNames(
                    "w-full cursor-pointer transition-colors duration-200 md:hover:ring-2 md:hover:ring-blue-400 active:ring-2 active:ring-blue-400",
                    currentComparison.choice === 'right' ? "ring-4 ring-blue-500 rounded-lg" : "rounded-lg"
                  )}
                >
                  <ContestantCard
                    countryContestant={currentComparison.rightItem}
                    isSelected={currentComparison.choice === 'right'}
                  />
                </div>
              </div>
            )
          )}
        </div>

        {/* footer section with buttons - fixed at bottom */}
        <div className="flex-shrink-0 mt-2 px-4">
          {sortState?.isComplete ? (
            <div className="flex justify-center space-x-4">
              <IconButton
                onClick={onClose}
                className="px-4 py-2 text-sm text-white bg-gray-500 rounded hover:bg-gray-600"
                title="cancel"
                icon={faTimes}
              />
              <IconButton
                onClick={handleApplyRanking}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                title="apply ranking"
                icon={faCheck}
              />
            </div>
          ) : (
            currentComparison && (
              <div className="flex justify-between mt-1">
                {/* <IconButton
                                    onClick={handleBack}
                                    disabled={!sortState || sortState.currentIndex === 0}
                                    className={classNames(
                                        "flex items-center px-4 py-2 text-sm rounded",
                                        !sortState || sortState.currentIndex === 0
                                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700"
                                    )}
                                    title="back"
                                    icon={faChevronLeft}
                                /> */}
                <IconButton
                  onClick={onClose}
                  className="px-4 py-2 pr-[1.2em] text-sm text-white bg-gray-500 rounded hover:bg-gray-600"
                  title="skip sorting"
                  icon={faTimes}
                />
                {/* <IconButton
                                    onClick={() => handleChoice(currentComparison.choice || 'left')}
                                    className={classNames(
                                        "flex items-center px-4 py-2 text-sm text-white rounded",
                                        currentComparison.choice
                                            ? "bg-blue-600 hover:bg-blue-700"
                                            : "bg-gray-700 text-gray-500 cursor-not-allowed"
                                    )}
                                    disabled={!currentComparison.choice}
                                    title="next"
                                    icon={faChevronRight}
                                /> */}
              </div>
            )
          )}
        </div>
      </div>
    </Modal>
  );
};

// the contestantCard component
const ContestantCard: React.FC<ContestantCardProps> = ({
  countryContestant,
  isSelected,
}) => {
  const isGlobalMode = useAppSelector((state) => state.globalSearch);
  const showThumbnail = useAppSelector((state) => state.showThumbnail);

  const contestant = countryContestant.contestant;
  const country = countryContestant.country;

  // get youtube thumbnail if video url exists
  const youtubeThumb = getYoutubeThumbnail(contestant?.youtube);

  // flag styles
  const flagContainerStyles = "absolute top-0 left-0 h-full w-[12em] pointer-events-none overflow-hidden";
  const flagImageStyles = "w-full h-full object-cover opacity-60";

  // add a css class for flag mask in the component
  useEffect(() => {
    // create a style element
    const styleEl = document.createElement('style');
    // add the css for the flag mask
    styleEl.innerHTML = `
      .flag-mask {
        -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%);
        mask-image: linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%);
        object-position: center center;
        object-fit: cover;
      }
    `;
    // append to head
    document.head.appendChild(styleEl);

    // cleanup on unmount
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // gradient mask for flag
  const flagMaskStyle: React.CSSProperties = {
    display: 'block',
    WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%)',
    maskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%)',
    objectPosition: 'center center',
    objectFit: 'cover',
  };

  // youtube thumbnail styles
  const thumbContainerStyles = "absolute top-0 right-0 h-full w-[35%] pointer-events-none overflow-hidden";
  const thumbImageStyles = "w-full h-full object-cover opacity-50";
  const thumbMaskStyle: React.CSSProperties = {
    display: 'block',
    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 40%)',
    maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 40%)',
    objectPosition: '50% 50%',
    objectFit: 'cover',
    transform: 'scale(1.05)',
  };

  return (
    <div>
      <div
        className={classNames(
          "m-auto text-slate-400 bg-[#03022d] bg-opacity-30 no-select choice-background",
          "relative mx-auto min-h-[9em] py-[0.4em]", // relative positioning for absolute children
          "flex flex-col items-stretch whitespace-normal text-sm overflow-hidden", // overflow hidden needed for mask/absolute children
          "shadow border-y border-0.5 rounded-md", // Added rounded corners
          isSelected ? "border-blue-500 border-solid" : "border-solid border-slate-700", // Darker border when not selected
          "w-full z-100"
        )}
      >
        {/* flag background */}
        <div className={flagContainerStyles}>
          <div className="relative w-full h-full">
            {country.key !== 'yu' ? (
              <LazyLoadedFlag
                code={country.key}
                className={`${flagImageStyles} flag-mask`}
              />
            ) : (
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Yugoslavia_%281946-1992%29.svg"
                alt="flag of yugoslavia"
                className={flagImageStyles}
                style={flagMaskStyle}
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
                style={thumbMaskStyle}
                alt=""
              />
            </div>
          </div>
        )}

        {/* content */}
        <div className="relative z-10 flex flex-col items-stretch justify-center w-full p-2 pl-32 h-full">
          <div className="flex-grow text-slate-300 font-bold flex flex-col justify-center">
            {/* country name and youtube link */}
            <div className="overflow-hidden overflow-ellipsis flex justify-between items-center mb-2">
              <span className="overflow-hidden overflow-ellipsis text-lg tracking-wide bg-[#301c4c] bg-opacity-35 rounded-md px-2 py-1 shadow-sm">
                {country?.name}
              </span>
              <span className="flex flex-row items-center">
                {contestant?.youtube && (
                  <a
                    href={contestant?.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className='rounded text-red-500 hover:text-red-400 transition-colors duration-200'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaYoutube className='text-4xl' title="watch on youtube" />
                  </a>
                )}
              </span>
            </div>

            {/* artist, song, and year info */}
            <div className="pr-2 font-normal">
              {contestant ? (
                <>
                  <div className="font-medium text-base bg-[#301c4c] bg-opacity-35 rounded-md inline-block px-2 py-1 text-slate-200 shadow-sm">
                    {contestant?.artist}
                  </div>
                  <div className="mt-2 font-medium text-sm bg-[#301c4c] bg-opacity-35 rounded-md inline-block px-2 py-1 text-slate-200 shadow-sm">
                    {contestant.song?.length && !contestant.song?.includes("TBD")
                      ? `"${contestant.song}"`
                      : `${contestant.song}`
                    }
                  </div>
                  {/* year display */}
                  {isGlobalMode && contestant && (
                    <div className="bg-[#1c214c] bg-opacity-75 text-slate-200 text-xs font-bold text-center py-1 px-2 mt-2 inline-block rounded-md ml-2 shadow-sm">
                      {contestant.year}
                    </div>
                  )}
                </>
              ) : (
                <span className="font-medium text-sm bg-[#1c214c] bg-opacity-75 rounded-md inline-block px-2 py-1 text-slate-200 shadow-sm italic">
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

export default SorterModal;
