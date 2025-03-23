import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CountryContestant } from '../../data/CountryContestant';
import { faChevronLeft, faChevronRight, faTv, faPlay, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, AppState } from '../../redux/store';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import classNames from 'classnames';
import { setRankedItems } from '../../redux/rootSlice';
import {
  generateInitialComparisons,
  calculateRanking,
  generateAdditionalComparisons,
  shouldAddMoreComparisons
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
 * with detailed cards similar to DetailsCard
 */
const SorterModal: React.FC<SorterModalProps> = ({
  isOpen,
  onClose,
  initialItems,
}) => {
  const dispatch: AppDispatch = useAppDispatch();
  const categories = useAppSelector((state: AppState) => state.categories);
  const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortedItems, setSortedItems] = useState<CountryContestant[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Add a ref to track the highest progress value
  const maxProgressRef = useRef<number>(0);
  // Track initial comparison count to calculate baseline progress
  const [initialComparisonCount, setInitialComparisonCount] = useState<number>(0);
  // Track the total number of added comparisons
  const [totalAddedComparisons, setTotalAddedComparisons] = useState<number>(0);

  /**
 * calculate progress percentage for the progress bar
 * modified to adjust expectations for total comparisons
 */
  const calculateProgress = useCallback((): number => {
    if (isComplete) return 100;
    if (comparisons.length === 0) return 0;

    // get completed comparisons count
    const completed = comparisons.filter(c => c.choice).length;

    // estimate total expected comparisons based on n*log2(n) formula
    // this is a better estimate than just using initialComparisonCount
    const expectedTotalComparisons = Math.ceil(initialItems.length * Math.log2(initialItems.length));

    // calculate progress with weighted formula that expects more comparisons
    let progress = 0;

    // early progress should be slower (expect more comparisons)
    if (completed < initialComparisonCount) {
      // first phase: completing initial comparisons (0-60%)
      progress = (completed / initialComparisonCount) * 60;
    } else {
      // second phase: refinement comparisons (60-95%)
      const additionalCompleted = completed - initialComparisonCount;
      const expectedAdditional = expectedTotalComparisons - initialComparisonCount;

      // base progress (60%) + refinement progress (up to 35%)
      progress = 60 + (additionalCompleted / Math.max(1, expectedAdditional)) * 35;

      // if we've done more comparisons than the expected amount, accelerate progress
      if (completed >= expectedTotalComparisons) {
        progress = Math.max(progress, 95);
      }
    }

    // ensure progress doesn't exceed 95% until complete
    progress = Math.min(progress, 95);

    // ensure progress never decreases
    if (progress > maxProgressRef.current) {
      maxProgressRef.current = progress;
    } else {
      progress = maxProgressRef.current;
    }

    return Math.round(progress);
  }, [comparisons, isComplete, initialComparisonCount, initialItems.length]);

  /**
   * handle user's choice between two items
   */
  const handleChoice = useCallback((choice: 'left' | 'right') => {
    if (currentIndex >= comparisons.length) return;

    // update the current comparison with user's choice
    const updatedComparisons = [...comparisons];
    updatedComparisons[currentIndex] = {
      ...updatedComparisons[currentIndex],
      choice,
    };

    setComparisons(updatedComparisons);

    // move to next comparison
    if (currentIndex < comparisons.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // done with current batch, check if we need more comparisons
      const currentRanking = calculateRanking(updatedComparisons, initialItems);

      // check if more comparisons would improve accuracy
      const needsMoreComparisons = shouldAddMoreComparisons(
        currentRanking,
        updatedComparisons,
        initialItems
      );

      if (needsMoreComparisons && updatedComparisons.length < initialItems.length * 2) {
        // add more strategic comparisons
        const additionalComparisons = generateAdditionalComparisons(
          currentRanking,
          updatedComparisons,
          initialItems
        );

        if (additionalComparisons.length > 0) {
          // Update the count of added comparisons
          setTotalAddedComparisons(prevCount => prevCount + additionalComparisons.length);

          setComparisons([...updatedComparisons, ...additionalComparisons]);
          setCurrentIndex(updatedComparisons.length);
          return;
        }
      }

      // we're done - finalize ranking
      setSortedItems(currentRanking);
      setIsComplete(true);
    }
  }, [currentIndex, comparisons, initialItems]);

  /**
   * go back to previous comparison
   */
  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  /**
   * apply final ranking and close modal
   */
  const handleApplyRanking = useCallback(() => {
    if (sortedItems.length > 0) {
      dispatch(setRankedItems(sortedItems));
      updateUrlFromRankedItems(
          activeCategory, categories, sortedItems
      );
      onClose();
    }
  }, [sortedItems, dispatch, onClose]);

  // generate initial comparisons when modal opens
  useEffect(() => {
    if (isOpen && initialItems.length > 1) {
      // reset state
      setCurrentIndex(0);
      setIsComplete(false);
      setSortedItems([]);
      maxProgressRef.current = 0;
      setTotalAddedComparisons(0);

      // generate comparisons
      const initialComparisons = generateInitialComparisons(initialItems);
      setComparisons(initialComparisons);
      setInitialComparisonCount(initialComparisons.length);
    }
  }, [isOpen, initialItems]);


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
                {isComplete ? "Ranking Complete" : "Choose Your Preference"}
              </h2>
            </div>
            {activeCategory !== undefined && (
              <div className="items-center w-full mb-2 text-center">{categories[activeCategory!]?.name} </div>
            )}
          </div>
          <div className="mb-6">
            {/* <div className="flex justify-between mb-1 text-sm">
              <span className="text-slate-300 mb-2">Progress</span>
            </div> */}
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Main content area - scrollable when needed */}
        <div className="flex-grow overflow-y-auto px-2 py-1">
          {isComplete ? (
            <div className="flex flex-col items-center justify-center">
              <p className="mb-6 text-center text-slate-200">
                Based on your choices, we've created your ranking
              </p>
            </div>
          ) : (
            currentIndex < comparisons.length && (
              <div className="flex flex-col justify-center items-center gap-4 mb-8">
                {/* Left card */}
                <div
                  onClick={() => handleChoice('left')}
                  className={classNames(
                    "w-full cursor-pointer transition-colors duration-200 hover:ring-2 hover:ring-blue-400",
                    comparisons[currentIndex].choice === 'left' ? "ring-4 ring-blue-500 rounded-lg" : "rounded-lg"
                  )}
                >
                  <ContestantCard
                    countryContestant={comparisons[currentIndex].leftItem}
                    isSelected={comparisons[currentIndex].choice === 'left'}
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
                    comparisons[currentIndex].choice === 'right' ? "ring-4 ring-blue-500 rounded-lg" : "rounded-lg"
                  )}
                >
                  <ContestantCard
                    countryContestant={comparisons[currentIndex].rightItem}
                    isSelected={comparisons[currentIndex].choice === 'right'}
                  />
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer section with buttons - fixed at bottom */}
        <div className="flex-shrink-0 mt-2">
          {isComplete ? (
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
            currentIndex < comparisons.length && (
              <div className="flex justify-between mt-1">
                <IconButton
                  onClick={handleBack}
                  disabled={currentIndex === 0}
                  className={classNames(
                    "flex items-center px-4 py-2 text-sm rounded",
                    currentIndex === 0
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
                  onClick={() => comparisons[currentIndex].choice && handleChoice(comparisons[currentIndex].choice)}
                  className={classNames(
                    "flex items-center px-4 py-2 text-sm text-white rounded",
                    comparisons[currentIndex].choice
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  )}
                  disabled={!comparisons[currentIndex].choice}
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