import {
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided,
} from '@hello-pangea/dnd';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { FaChevronRight } from 'react-icons/fa';

import { Card } from './Card';
import { DetailsCard } from './DetailsCard';
import { IntroColumnWrapper } from './IntroColumnWrapper';
import RankedItemsHeader from './RankedItemsHeader';
import { StrictModeDroppable } from './StrictModeDroppable';
import { supportedYears } from '../../data/Contestants';
import { CountryContestant } from '../../data/CountryContestant';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import { RankingAddition, useRecentlyAdded } from '../../hooks/useRecentlyAdded';
import { useViewOpening } from '../../hooks/useViewOpening';
import { ViewSwitch } from '../../hooks/useViewSwitch';
import { deleteRankedCountry } from '../../redux/rankingActions';
import { selectActiveRankedItems } from '../../redux/rankingSelectors';
import { setShowUnranked } from '../../redux/rootSlice';
import { AppDispatch, AppState } from '../../redux/store';
import { staggerStyle } from '../../utilities/animationUtil';
import { generateYoutubePlaylistUrl } from '../../utilities/YoutubeUtil';
import { HeartIcon } from '../HeartIcon';
import IconButton from '../IconButton';

interface RankedCountriesListProps {
  openSongModal: (countryContestant: CountryContestant) => void;
  openModal: (tabName: string) => void;
  openConfigModal: (tabName: string) => void;
  setRunTour: (run: boolean) => void;
  setRunSortTour: (run: boolean) => void;
  openNameModal: () => void;
  openMapModal: () => void;
  openSorterModal: () => void;
  openAuthModal: () => void;
  openQuizModal: () => void;
  /** the country most recently added with its "+" button on the select view */
  latestAddition?: RankingAddition | null;
  /** how the user arrived at this view, which sets the direction of its entrance */
  viewSwitch?: ViewSwitch;
}

/**
 * The list of ranked country contestants that appears on the right side column
 * of the select view and as the central column on the details/list view
 *
 * @param
 * @returns
 */
const RankedCountriesList: React.FC<RankedCountriesListProps> = ({
  openSongModal,
  openModal,
  openConfigModal,
  setRunTour,
  setRunSortTour,
  openNameModal,
  openMapModal,
  openSorterModal,
  openAuthModal,
  openQuizModal,
  latestAddition = null,
  viewSwitch = null,
}) => {
  const dispatch: AppDispatch = useAppDispatch();
  const showUnranked = useAppSelector((state: AppState) => state.root.showUnranked);
  const theme = useAppSelector((state: AppState) => state.root.theme);
  const showTotalRank = useAppSelector((state: AppState) => state.root.showTotalRank);
  const isDeleteMode = useAppSelector((state: AppState) => state.root.isDeleteMode);
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const isOpening = useViewOpening(rankedItems.length > 0);
  const wasRecentlyAdded = useRecentlyAdded(latestAddition);

  // A switch between views moves the ranked column sideways (see
  // transitions.css); the page load keeps the plain settle.
  const containerEntrance =
    viewSwitch === 'toDetails'
      ? 'view-enter-from-right-animation'
      : viewSwitch === 'toSelect'
        ? 'view-enter-left-animation'
        : 'view-enter-animation';
  const itemEntrance =
    viewSwitch === 'toDetails'
      ? 'view-item-enter-from-right-animation'
      : viewSwitch === 'toSelect'
        ? 'view-item-enter-from-left-animation'
        : 'view-item-enter-animation';

  /**
   * used to synchronize the horizontal scrollbar on detail cards across all ranked items
   */
  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);

  const handleCategoryScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setCategoryScrollPosition(event.currentTarget.scrollLeft);
  };

  /**
   * Identify country with the provided Id in the rankedItems array, and
   * move them back into the unrankedItems array, alphabetically. The store
   * update is projected to the URL by the single URL writer.
   *
   * @param countryId
   */
  const handleDeleteRankedCountry = useCallback(
    (id: string) => {
      dispatch(deleteRankedCountry(id));
    },
    [dispatch],
  );

  return (
    <div className={classNames('tour-step-5 z-20', containerEntrance)}>
      <StrictModeDroppable droppableId="rankedItems">
        {(provided: DroppableProvided) => (
          <div className={classNames('grid h-full max-h-full min-h-full grid-rows-[auto_1fr]')}>
            <RankedItemsHeader
              setMapModalShow={() => openMapModal()}
              generateYoutubePlaylistUrl={() => generateYoutubePlaylistUrl(rankedItems)}
              supportedYears={supportedYears}
              openNameModal={openNameModal}
              openConfig={openConfigModal}
              openSorterModal={openSorterModal}
              openQuizModal={openQuizModal}
              className={
                showUnranked
                  ? 'min-w-[9em] max-w-50vw-6em'
                  : 'w-[80vw] max-w-[30.5em] min-w-[20.5em]'
              }
            />

            <div className="px-1 overflow-y-auto h-full">
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={classNames(
                  'overflow-y-auto overflow-x-hidden pt-3 ranked-items-background w-full h-full',
                  showUnranked
                    ? 'min-w-[9em] max-w-50vw-6em'
                    : 'w-[85vw] max-w-[30em] min-w-[20em]',
                  { 'auroral-background': theme.includes('ab') },
                )}
              >
                {rankedItems.length === 0 && showUnranked && (
                  <IntroColumnWrapper
                    openModal={openModal}
                    openConfigModal={openConfigModal}
                    setRunTour={setRunTour}
                    setRunSortTour={setRunSortTour}
                    openAuthModal={openAuthModal}
                    openQuizModal={openQuizModal}
                  />
                )}
                {!showUnranked && rankedItems.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-center mb-40 min-mt-5 text-[var(--er-text-muted)] mx-10 text-sm">
                      <div>Click 'Select' to choose</div> countries to rank
                      <div>
                        <HeartIcon
                          alt="Heart"
                          className="inline align-middle ml-[0.5em] mt-3 mb-1 w-6 h-6 pulse-on-load my-heart-icon"
                        />
                      </div>
                    </span>
                  </div>
                )}
                {rankedItems.map((countryContestant: CountryContestant, index: number) => (
                  <Draggable
                    key={`draggable-${countryContestant?.uid ?? countryContestant.id}`}
                    draggableId={countryContestant?.uid ?? countryContestant.id}
                    index={index}
                    isDragDisabled={showTotalRank}
                  >
                    {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                      <li
                        key={`li-${countryContestant?.uid ?? countryContestant.id}`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={classNames('no-select m-2 mx-1', {
                          'mt-0': index === 0,
                        })}
                      >
                        {/* The staggered entrance rides on a wrapper because
                            the <li> above carries the drag transform (see
                            transitions.css), and it only plays while the view
                            is opening (see useViewOpening) so a card added to
                            the ranking doesn't wait its turn. A card added
                            with its "+" button plays its own entrance instead
                            (see useRecentlyAdded). */}
                        <div
                          className={classNames({
                            [itemEntrance]: isOpening,
                            'ranked-item-added-animation':
                              !isOpening &&
                              showUnranked &&
                              wasRecentlyAdded(countryContestant?.uid ?? countryContestant.id),
                          })}
                          style={isOpening ? staggerStyle(index) : undefined}
                        >
                          {showUnranked ? (
                            <Card
                              key={`card-${countryContestant?.uid ?? countryContestant.id}`}
                              className="m-auto text-[var(--er-text-tertiary)] bg-[var(--er-card-surface)] no-select"
                              rank={index + 1}
                              countryContestant={countryContestant}
                              isDeleteMode={showUnranked && isDeleteMode}
                              deleteCallBack={handleDeleteRankedCountry}
                              isDragging={snapshot.isDragging}
                              isDropAnimating={snapshot.isDropAnimating}
                            />
                          ) : (
                            <DetailsCard
                              key={`card-${countryContestant?.uid ?? countryContestant.id}`}
                              rank={index + 1}
                              countryContestant={countryContestant}
                              openSongModal={() => openSongModal(countryContestant)}
                              isDragging={snapshot.isDragging}
                              categoryScrollPosition={categoryScrollPosition}
                              onCategoryScroll={handleCategoryScroll}
                            />
                          )}
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {/* The drop gap has to open downward without widening the column. The dnd
                    library sizes its placeholder from the card being dragged, so a card
                    arriving from the other column brings that column's width with it and
                    this one stretches for the length of the drag, then snaps back on the
                    drop. Clipping keeps the gap's height and takes its width out of the
                    column's intrinsic size. */}
                <div className="max-w-0 overflow-hidden">{provided.placeholder}</div>
              </ul>
            </div>
            {showUnranked && rankedItems?.length > 0 && (
              <div className="pl-2 rounded-b-md h-8 !bg-[var(--er-surface-bar)] ranked-bar-background text-[var(--er-text-secondary)] items-center flex shadow-md gradient-background">
                <IconButton
                  className={classNames(
                    'tour-step-4 ml-auto py-1 pl-[0.7em] pr-[0.9em] mr-0 w-[6em]',
                    { 'tada-animation-6s': showUnranked && rankedItems?.length },
                  )}
                  onClick={() => dispatch(setShowUnranked(!showUnranked))}
                  title={'View List'}
                />
                <FaChevronRight
                  className={classNames(
                    'ml-2 mr-auto text-lg justify-center align-center bounce-right text-[var(--r-accent-blue)]',
                    { 'tada-animation': showUnranked && rankedItems?.length },
                  )}
                />
              </div>
            )}
          </div>
        )}
      </StrictModeDroppable>
    </div>
  );
};

export default RankedCountriesList;
