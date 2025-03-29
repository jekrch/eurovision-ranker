import React, { useState, useEffect, useCallback } from 'react';
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
  calculateProgress,
  getSortedItems,
  shouldContinueSorting,
  SortState,
  ActionType
} from '../../utilities/SorterUtils';
import { LazyLoadedFlag } from '../LazyFlag';
import { getYoutubeThumbnail } from '../../utilities/YoutubeUtil';
import Modal from '../modals/Modal';
import IconButton from '../IconButton';
import { FaYoutube } from 'react-icons/fa';
import { updateUrlFromRankedItems } from '../../utilities/UrlUtil';

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

//cContestant Card Props interface
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
  
  // Use a single sortState object to manage the entire sorting process
  const [sortState, setSortState] = useState<SortState | null>(null);

  /**
   * handle user's choice between two items
   */
  const handleChoice = useCallback((choice: 'left' | 'right') => {
    if (!sortState) return;

    // Get the current comparison
    const currentComparison = sortState.comparisons[sortState.currentIndex];
    if (!currentComparison) return;
    
    // Log the choice for debugging
    if (currentComparison.leftItem?.contestant?.year && currentComparison.rightItem?.contestant?.year) {
      console.log(`Comparing years: ${currentComparison.leftItem.contestant.year} vs ${currentComparison.rightItem.contestant.year}, chose: ${choice}`);
    }

    // Process the user's choice and advance the algorithm
    const newState = processChoice(sortState, choice);
    
    // If we're not done, continue with the next comparison
    if (!newState.isComplete) {
      setSortState(newState);
    } else {
      // We're done - set the sorted items and mark as complete
      console.log("Sorting complete!");
      
      // Log the final ranking for debugging
      const sortedItems = getSortedItems(newState);
      if (sortedItems.length > 0 && sortedItems[0]?.contestant?.year) {
        console.log("Final ranking by year:", sortedItems.map(item => item.contestant?.year).join(", "));
      }
      
      setSortState(newState);
    }
  }, [sortState]);

  /**
   * go back to previous comparison
   */
  const handleBack = useCallback(() => {
    if (!sortState || sortState.currentIndex <= 0) return;
    
    // Create a copy of the current state
    const newState = { ...sortState };
    
    // Remove the choice from the current comparison
    newState.comparisons = [...newState.comparisons];
    newState.comparisons[newState.currentIndex].choice = undefined;
    
    // Go back to the previous comparison
    newState.currentIndex -= 1;
    
    setSortState(newState);
  }, [sortState]);

  /**
   * apply final ranking and close modal
   */
  const handleApplyRanking = useCallback(() => {
    if (!sortState || !sortState.isComplete) return;
    
    // Get the sorted items
    const sortedItems = getSortedItems(sortState);
    
    if (sortedItems.length > 0) {
      // Log the sorted items to help with debugging
      console.log("Applying sorted items:", sortedItems);
      
      // Make sure we have the same number of items as we started with
      if (sortedItems.length !== initialItems.length) {
        console.warn(`Warning: Sorted items count (${sortedItems.length}) doesn't match initial items (${initialItems.length})`);
      }
      
      // Verify that all items have valid UIDs, but never replace the original data
      const validItems = sortedItems.map((item, index) => {
        // Only fix the UID if it's missing, don't change anything else
        if (!item.uid) {
          return {
            ...item,
            uid: `item-${index}-${Date.now()}`
          };
        }
        return item;
      });
      
      // Apply the ranking to the state
      dispatch(setRankedItems(validItems));
      
      // Update URL
      updateUrlFromRankedItems(
        activeCategory, 
        categories, 
        validItems
      );
      
      onClose();
    } else {
      console.error("No sorted items to apply");
      // Don't apply an empty ranking, this would be worse than doing nothing
      onClose(); // Close the modal anyway to avoid getting stuck
    }
  }, [sortState, dispatch, onClose, activeCategory, categories, initialItems.length]);

  // Initialize the sort state when the modal opens
  useEffect(() => {
    if (isOpen && initialItems.length > 1) {
      console.log(`Starting sorter with ${initialItems.length} items`);
      
      // Initialize the sorting algorithm
      const newSortState = initSortState(initialItems);
      console.log(`Estimated comparisons: ${newSortState.estimatedTotalComparisons}`);
      
      // Advance to the first comparison
      setSortState(advanceAlgorithm(newSortState));
    }
  }, [isOpen, initialItems]);
  
  // For debugging/monitoring
  useEffect(() => {
    if (sortState) {
      const progress = calculateProgress(sortState);
      const completed = sortState.comparisons.filter(c => c.choice).length;
      console.log(`Progress: ${progress}%, Comparisons: ${completed}/${sortState.estimatedTotalComparisons}`);
    }
  }, [sortState]);

  // Get the current comparison to display
  const currentComparison = sortState && 
    sortState.currentIndex < sortState.comparisons.length ? 
    sortState.comparisons[sortState.currentIndex] : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="!max-h-[95vh]">
      {/* Modal content wrapper with max-height and overflow styling */}
      <div className="flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header section - fixed at top */}
        <div className="flex-shrink-0">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className={classNames(
                "text-xl font-bold text-center w-full",
                "text-slate-300"
              )}>
                {sortState?.isComplete ? "Ranking Complete" : "Choose Your Preference"}
              </h2>
            </div>
            {activeCategory !== undefined && (
              <div className="items-center w-full mb-2 text-center">{categories[activeCategory!]?.name} </div>
            )}
          </div>
          <div className="mb-6">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${sortState ? calculateProgress(sortState) : 0}%` }}
              ></div>
            </div>
            {/* Display comparison count for better user feedback */}
            <div className="text-xs text-slate-400 text-right mt-1">
              {sortState && (
                <span>
                  Comparisons: {sortState.comparisons.filter(c => c.choice).length} / 
                  ~{sortState.estimatedTotalComparisons}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main content area - scrollable when needed */}
        <div className="flex-grow overflow-y-auto px-2 py-1">
          {sortState?.isComplete ? (
            <div className="flex flex-col items-center justify-center">
              <p className="mb-6 text-center text-slate-200">
                Based on your choices, we've created your ranking
              </p>
            </div>
          ) : (
            currentComparison && (
              <div className="flex flex-col justify-center items-center gap-4 mb-8">
                {/* Left card */}
                <div
                  onClick={() => handleChoice('left')}
                  className={classNames(
                    "w-full cursor-pointer transition-colors duration-200 hover:ring-2 hover:ring-blue-400",
                    currentComparison.choice === 'left' ? "ring-4 ring-blue-500 rounded-lg" : "rounded-lg"
                  )}
                >
                  <ContestantCard
                    countryContestant={currentComparison.leftItem}
                    isSelected={currentComparison.choice === 'left'}
                  />
                </div>

                <div className="text-md font-bold text-slate-300">
                  VS
                </div>

                {/* Right card */}
                <div
                  onClick={() => handleChoice('right')}
                  className={classNames(
                    "w-full cursor-pointer transition-colors duration-200 hover:ring-2 hover:ring-blue-400",
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

        {/* Footer section with buttons - fixed at bottom */}
        <div className="flex-shrink-0 mt-2">
          {sortState?.isComplete ? (
            <div className="flex justify-center space-x-4">
              <IconButton
                onClick={onClose}
                className="px-4 py-2 text-sm text-white bg-gray-500 rounded hover:bg-gray-600"
                title="Cancel"
                icon={faTimes}
              />
              <IconButton
                onClick={handleApplyRanking}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                title="Apply Ranking"
                icon={faCheck}
              />
            </div>
          ) : (
            currentComparison && (
              <div className="flex justify-between mt-1">
                <IconButton
                  onClick={handleBack}
                  disabled={!sortState || sortState.currentIndex === 0}
                  className={classNames(
                    "flex items-center px-4 py-2 text-sm rounded",
                    !sortState || sortState.currentIndex === 0
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                  title="Back"
                  icon={faChevronLeft}
                />
                <IconButton
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-white bg-gray-500 rounded hover:bg-gray-600"
                  title="Skip Sorting"
                  icon={faTimes}
                />
                <IconButton
                  onClick={() => currentComparison.choice && handleChoice(currentComparison.choice)}
                  className={classNames(
                    "flex items-center px-4 py-2 text-sm text-white rounded",
                    currentComparison.choice
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  )}
                  disabled={!currentComparison.choice}
                  title="Next"
                  icon={faChevronRight}
                />
              </div>
            )
          )}
        </div>
      </div>
    </Modal>
  );
};

// The ContestantCard component 
const ContestantCard: React.FC<ContestantCardProps> = ({
  countryContestant,
  isSelected,
}) => {
  const isGlobalMode = useAppSelector((state) => state.globalSearch);
  const showThumbnail = useAppSelector((state) => state.showThumbnail);

  const contestant = countryContestant.contestant;
  const country = countryContestant.country;

  // get YouTube thumbnail if video URL exists
  const youtubeThumb = getYoutubeThumbnail(contestant?.youtube);

  return (
    <div>
      <div
        className={classNames(
          "m-auto text-slate-400 bg-[#03022d] bg-opacity-30 no-select",
          "relative mx-auto min-h-[9em] py-[0.4em] flex flex-col",
          "items-stretch whitespace-normal text-sm overflow-hidden",
          "shadow rounded border border-0.5",         
          isSelected ? "border-blue-500 border-solid" : "border-solid border-slate-400",
          "w-full"
        )}
        style={{ position: 'relative' }}
      >
        {/* YouTube thumbnail background */}
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
                  scale: '1.1',
                }}
                alt=""
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-stretch justify-center w-full p-2 h-full">
          <div className="flex flex-row mb-2 items-center">
            <div className="relative w-20 min-w-16 mr-4 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-full">
                  {country.key !== 'yu' ? (
                    <LazyLoadedFlag code={country.key} className="w-full opacity-80" />
                  ) : (
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Yugoslavia_%281946-1992%29.svg"
                      alt="Flag of Yugoslavia"
                      className="w-full h-auto opacity-80"
                    />
                  )}
                </div>
                {isGlobalMode && contestant && (
                  <div className="bg-slate-600 bg-opacity-30 text-slate-300 text-base font-bold text-center py-1 mt-1 w-full">
                    {contestant.year}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-grow text-slate-300 font-bold flex flex-col justify-center">
              <div className="overflow-hidden overflow-ellipsis flex justify-between items-center">
                <span className="overflow-hidden overflow-ellipsis text-base">{country?.name}</span>

                <span className="flex flex-row items-center">
                  {contestant?.youtube && (
                    <a
                      href={contestant?.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className='rounded text-red-500 hover:text-red-400'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaYoutube className='text-4xl' title="Watch on YouTube" />
                    </a>
                  )}
                </span>
              </div>

              <div className="pr-2 font-normal">
                {contestant ? (
                  <>
                    <div className="font-xs text-base text-slate-400">
                      {contestant?.artist}
                    </div>
                    <div className="mt-1 font-xs text-sm bg-[#1c214c] bg-opacity-60 rounded-sm inline-block px-1 py-0.5 text-slate-400">
                      {contestant.song?.length && !contestant.song?.includes("TBD")
                        ? `"${contestant.song}"`
                        : `${contestant.song}`
                      }
                    </div>
                  </>
                ) : (
                  <span className="font-xs text-sm text-gray-500 strong">
                    Did not participate
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SorterModal;