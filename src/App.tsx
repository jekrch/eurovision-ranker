import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from './components/Card';
import { StrictModeDroppable } from './components/StrictModeDroppable';
import classNames from 'classnames';
import { CountryContestant } from './data/CountryContestant';
import { fetchCountryContestantsByYear } from './utilities/ContestantFactory';
import MainModal from './components/MainModal';
import Dropdown from './components/Dropdown';
import { supportedYears } from './data/Contestants';
import NameModal from './components/NameModal';
import { FaTv } from 'react-icons/fa';
import Navbar from './components/NavBar';
import EditNav from './components/EditNav';
import IntroColumn from './components/IntroColumn';
import { generateYoutubePlaylistUrl, rankedHasAnyYoutubeLinks } from './utilities/YoutubeUtil';
import { AppState } from './redux/types';
import { useDispatch, useSelector } from 'react-redux';
import { setName, setYear, setRankedItems, setUnrankedItems, setShowUnranked, setContestants } from './redux/actions';
import { decodeRankingsFromURL } from './utilities/UrlUtil';
import { Dispatch } from 'redux';
import MapModal from './components/MapModal';

const App: React.FC = () => {
  const [mainModalShow, setMainModalShow] = useState(false);
  const [nameModalShow, setNameModalShow] = useState(false);
  const [mapModalShow, setMapModalShow] = useState(false);
  const [refreshUrl, setRefreshUrl] = useState(0);
  const [refreshDnD, setRefreshDnD] = useState(0);
  const [modalTab, setModalTab] = useState('about')
  const dispatch: Dispatch<any> = useDispatch();
  const { 
    year, name, rankedItems, unrankedItems, showUnranked, isDeleteMode
  } = useSelector((state: AppState) => state);


  /**
   * Encode rankings to csv for URL
   * @param rankedCountries 
   * @returns 
   */
  const encodeRankingsToURL = (rankedCountries: CountryContestant[]): string => {
    const ids = rankedCountries.map(item => item.id);
    return ids.join('');
  };

  useEffect(() => {
    const rankingsExist = decodeRankingsFromURL(
      dispatch
    );
    // Set showUnranked based on whether rankings exist
    dispatch(
      setShowUnranked(!rankingsExist)
    );
  }, [])

  useEffect(() => {
    updateQueryParams({ r: encodeRankingsToURL(rankedItems) });
    updateQueryParams({ y: year.slice(-2) });
    updateQueryParams({ n: name });
  }, [rankedItems, refreshUrl]);

  useEffect(() => {

    if (!year?.length) {
      return;
    }
    let yearContestants = fetchCountryContestantsByYear(
      year, dispatch
    );

    updateQueryParams({ y: year.slice(-2) });
    
    dispatch(
      setContestants(yearContestants)
    );
    dispatch(
      setUnrankedItems(yearContestants)
    );
    decodeRankingsFromURL(
      dispatch
    );
  }, [year]);

  useEffect(() => {
    updateQueryParams({ n: name });
  }, [name]);

  /**
   * Function to update the query parameters
   */
  function updateQueryParams(params: { [key: string]: string }) {
    const searchParams = new URLSearchParams(window.location.search);

    // Set new or update existing parameters
    Object.keys(params).forEach(key => {
      searchParams.set(key, params[key]);
    });

    // Update the URL without reloading the page
    window.history.pushState(null, '', '?' + searchParams.toString());
  }

  /**
   * Handler for the drop event. Either reposition an item within 
   * its source array or move it to the other array 
   * 
   * @param result 
   * @returns 
   */
  const handleOnDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    let activeList, setActiveList, otherList, setOtherList;

    if (source.droppableId === 'unrankedItems') {
      activeList = unrankedItems;
      setActiveList = setUnrankedItems;
      otherList = rankedItems;
      setOtherList = setRankedItems;
    } else {
      activeList = rankedItems;
      setActiveList = setRankedItems;
      otherList = unrankedItems;
      setOtherList = setUnrankedItems;
    }

    const items = Array.from(activeList);
    const [reorderedItem] = items.splice(source.index, 1);

    // moving between lists
    if (destination.droppableId !== source.droppableId) {
      const destinationItems = Array.from(otherList);
      destinationItems.splice(destination.index, 0, reorderedItem);
      dispatch(
        setOtherList(destinationItems)
        );
    } else {
      items.splice(
        destination.index, 0, reorderedItem
      );
      dispatch(
        setActiveList(items)
      );
    }

    dispatch(setActiveList(items));
    setRefreshUrl(Math.random())
  };

  /**
   * Identify country with the provided Id in the rankedItems array, and 
   * move them back into the unrankedItems array, alphabetically 
   * 
   * @param countryId 
   */
  function deleteRankedCountry(countryId: string) {
    const index = rankedItems.findIndex(i => i.id === countryId);
    const [objectToMove] = rankedItems.splice(index, 1);
    const insertionIndex = unrankedItems.findIndex(
      i => i.country.name > objectToMove.country.name
    );
    if (insertionIndex === -1) {
      unrankedItems.push(objectToMove); // If no country is found with a name greater than our object, append it at the end.
    } else {
      unrankedItems.splice(insertionIndex, 0, objectToMove); // Insert at the found index
    }

    dispatch(
      setRankedItems(rankedItems)
    );
    dispatch(
      setUnrankedItems(unrankedItems)
    );
    setRefreshUrl(Math.random())
  }

  function openModal(tabName: string): void {
    setModalTab(tabName);
    setMainModalShow(true)
  }

  return (
    <>
      <div className="flex flex-col h-screen">

        <Navbar
          openModal={openModal}
        />
        <div className="flex-grow overflow-auto overflow-x-hidden bg-[#040241] flex justify-center pixelated-background">
          <DragDropContext
            onDragEnd={handleOnDragEnd}
            key={`drag-drop-context-${refreshDnD}`}
            onDragStart={() => {
              if (window.navigator.vibrate) {
                window.navigator.vibrate(100);
              }
            }}
          >

            <div className="flex flex-row justify-center gap-4 p-4">
              {/* Unranked Countries List */}
              {showUnranked && (
                <div className="max-w-[50vw] overflow-y-auto flex-grow mr-1" >
                  <StrictModeDroppable droppableId="unrankedItems" key={`strict-${refreshDnD}`}>
                    {(provided) => (
                      <ul
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={classNames("pt-3 min-w-[10em]", "")}
                      >
                        {unrankedItems.map((item, index) => (
                          <Draggable
                            key={item.id.toString()}
                            draggableId={item.id.toString()}
                            index={index}
                          >

                            {(provided, snapshot) => {
                              return (
                                <li
                                  key={item.id.toString()}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="no-select m-2"
                                >
                                  <Card
                                    key={item.id.toString()}
                                    className="m-auto text-slate-400 bg-'blue' no-select"
                                    country={item.country}
                                    contestant={item.contestant}
                                    isDragging={snapshot.isDragging}
                                  />
                                </li>
                              )
                            }}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    )}
                  </StrictModeDroppable>

                </div>
              )}
              {/* Ranked Countries List */}
              <div>
                <StrictModeDroppable droppableId="rankedItems">
                  {(provided) => (
                    <ul
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={classNames("h-full min-w-[10em] overflow-y-auto overflow-x-hidden pt-3 bg-[#1d1b54]", showUnranked ? "max-w-[50vw]" : "w-[80vw] max-w-[30em]")}
                    >
                      <div className="z-40 w-full text-center font-bold bg-blue-900 text-slate-300 py-1 -mt-3 text-md tracking-tighter">
                        {showUnranked ? (
                          <div className="w-full m-auto flex">
                            <Dropdown
                              className="mx-auto relative w-[5em]"
                              value={year}
                              onChange={y => { dispatch(setYear(y)); }}
                              options={supportedYears}
                            />
                          </div>
                        ) : (
                          <div className="mx-2 flex justify-between items-center">
                            <div className="justify-center w-full ml-2">
                              {year}
                              {name?.length > 0 && (
                                <span className="font-bold text-slate-400 text-md"> - {name}</span>
                              )}
                            </div>
                            {rankedHasAnyYoutubeLinks(rankedItems) && (
                              <a
                                href={generateYoutubePlaylistUrl(rankedItems)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="generate youtube playlist"
                                className='text-slate-500 hover:text-slate-100'
                              >
                                <FaTv className='text-xl' />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {(rankedItems.length === 0 && showUnranked) && (
                        <IntroColumn openModal={openModal} />
                      )}
                      {rankedItems.map((item, index) => (
                        <Draggable key={`draggable-${item.id.toString()}`} draggableId={item.id.toString()} index={index}>
                          {(provided, snapshot) => {
                            return (
                              <li
                                key={`li-${item.id.toString()}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="no-select m-2"
                              >
                                <Card
                                  key={`card-${item.id.toString()}`}
                                  className="m-auto text-slate-400 bg- bg-[#03022d] no-select"
                                  rank={index + 1}
                                  country={item.country}
                                  contestant={item.contestant!}
                                  isLargeView={!showUnranked}
                                  isDeleteMode={showUnranked && isDeleteMode}
                                  deleteCallBack={deleteRankedCountry}
                                  isDragging={snapshot.isDragging}
                                />
                              </li>
                            )
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </StrictModeDroppable>
              </div>
            </div>
          </DragDropContext>
        </div>

        {showUnranked &&
          <EditNav
            setNameModalShow={setNameModalShow}
            setMapModalShow={setMapModalShow}
          />
        }
      </div>
      <MainModal
        tab={modalTab}
        isOpen={mainModalShow}
        onClose={() => setMainModalShow(false)}
      />
      <NameModal
        isOpen={nameModalShow}
        onClose={() => {
          setNameModalShow(false);
        }}
      />
      <MapModal isOpen={mapModalShow} onClose={()=> {setMapModalShow(false)}}/>
    </>
  );
};

export default App;

