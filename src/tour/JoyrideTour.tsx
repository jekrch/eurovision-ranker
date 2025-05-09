import React, { useCallback, useEffect, useState } from 'react';
import { CallBackProps, EVENTS, ACTIONS, STATUS } from 'react-joyride';
import { AppDispatch, AppState } from '../redux/store';
import { setYear, setName, setShowUnranked, setRankedItems, setUnrankedItems, setShowTotalRank, setHeaderMenuOpen, setContestants, setGlobalSearch, setTheme } from '../redux/rootSlice';
import { fetchCountryContestantsByYear } from '../utilities/ContestantRepository';
import { tourSteps } from '../tour/steps';
import { joyrideOptions } from '../utilities/JoyrideUtil';
import type Joyride from 'react-joyride';
import { clearCategories, clearCategories as clearCategoriesUtil } from '../utilities/CategoryUtil';
import { CountryContestant } from '../data/CountryContestant';
import { clearAllRankingParams, goToUrl, updateQueryParams } from '../utilities/UrlUtil';
import { useAppDispatch, useAppSelector } from '../hooks/stateHooks';
import { clone } from '../utilities/ContestantUtil';
import { useResetRanking } from '../hooks/useResetRanking';

interface JoyrideTourProps {
  setRefreshUrl: (num: number) => void;
  openConfigModal: (tabName: string) => void;
  setConfigModalShow: (show: boolean) => void;
  setRunTour: (run: boolean) => void;
  runTour: boolean;
}

const JoyrideTour: React.FC<JoyrideTourProps> = (props: JoyrideTourProps) => {
  const dispatch: AppDispatch = useAppDispatch();
  const year = useAppSelector((state: AppState) => state.year);
  const categories = useAppSelector((state: AppState) => state.categories);
  const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
  const unrankedItems = useAppSelector((state: AppState) => state.unrankedItems);
  const [startTour, setStartTour] = useState<boolean>(false);
  const resetRanking = useResetRanking();
  const [originalUrlQuery, setOriginalUrlQuery] = useState<string>('');
  const [joyrideStepIndex, setJoyrideStepIndex] = useState(0);
  const [JoyrideComponent, setJoyrideComponent] = useState<typeof Joyride | null>(null);

  useEffect(() => {

    if (props.runTour) {
      // Only import when the tour is about to run
      import('react-joyride').then((module) => {
        setJoyrideComponent(() => module.default);
      });
    }

    if (props.runTour !== startTour) {

      // if we're starting the tour, save the current URL so we can 
      // restore it after exiting the tour. Then clear the current 
      // ranking state.
      if (props.runTour) {
        setOriginalUrlQuery(window.location.search);
        clearRankingForTour();

      }

      setStartTour(props.runTour);

      // if we're exiting the tour, return to the URL we had 
      // when the tour began 
      if (!props.runTour) {
        goToUrl(originalUrlQuery, undefined);
      }
    }

  }, [props.runTour]);

  /**
   * In order to prepare for a tour, we should clear the theme, ensure 
   * that we're not in advanced/global mode, and clear any current ranking.
   * Note that the original ranking will be restored when the tour ends. 
   */
  function clearRankingForTour() {
    updateQueryParams({
      'g': undefined,
      t: ''
    }
    );

    dispatch(
      setGlobalSearch(false)
    );

    dispatch(
      setTheme('')
    );

    resetRanking();
  }

  useEffect(() => {
    const executeJoyRideStep = async () => {
      await executeTourStepActions(joyrideStepIndex);
    }
    executeJoyRideStep();
  }, [joyrideStepIndex])

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data;

    if (type === EVENTS.STEP_BEFORE && index === 0) {
      clearRanking(year);
    }

    if (
      [STATUS.FINISHED, STATUS.SKIPPED].includes(status as any) ||
      (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER)
    ) {
      props.setRunTour(false); // End the tour
      setJoyrideStepIndex(0);
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setJoyrideStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  }, []);

  async function clearRanking(year: string) {

    let yearContestants = await fetchCountryContestantsByYear(
      year, ''
    );

    dispatch(
      setContestants(yearContestants)
    );
    dispatch(
      setUnrankedItems(yearContestants)
    );

    dispatch(
      setRankedItems([])
    );

    clearAllRankingParams(categories);

    props.setRefreshUrl(Math.random());
  }

  /**
   * Each case statement corresponds to a step in the tour
   * @param index 
   */
  async function executeTourStepActions(
    index: number
  ) {
    switch (index) {

      case 1:
        if (year !== '2023') {
          dispatch(setYear('2023'));
          props.setRefreshUrl(Math.random());
        }

        await clearRanking(year);

        dispatch(
          setName('')
        );

        dispatch(
          setShowUnranked(true)
        );

        clearCategories(
          '', categories, dispatch
        );

        dispatch(
          setShowTotalRank(false)
        );

        break;

      case 2:
        const specificCountryCodes = ['fi', 'hr', 'es', 'cz', 'no', 'is'];

        // Filter out the specific items based on country codes
        const specificItems = unrankedItems.filter(
          item => specificCountryCodes.includes(item.country.key.toLowerCase())
        );

        // Remove these items from unrankedItems
        const remainingUnrankedItems = unrankedItems.filter(
          item => !specificCountryCodes.includes(item.country.key.toLowerCase())
        );

        // Sort the specific items in the desired order
        const sortedSpecificItems = specificCountryCodes.map(code =>
          specificItems.find(
            item => item.country.key.toLowerCase() === code
          )
        ).filter(item => item !== undefined) as CountryContestant[];

        const newRankedItems = [...sortedSpecificItems, ...rankedItems];

        dispatch(setRankedItems(newRankedItems));
        dispatch(setUnrankedItems(remainingUnrankedItems));
        dispatch(setName("Sigrit's Top Picks"));

        props.setRefreshUrl(Math.random())

        break;

      case 4:
        dispatch(
          setShowUnranked(false)
        );

        break;

      case 5:

        let swappedRankedItems = clone(rankedItems);

        if (rankedItems.length >= 2) {
          // swap the first two elements

          swappedRankedItems[0] = rankedItems[1];
          swappedRankedItems[1] = rankedItems[0];
        }

        dispatch(
          setRankedItems(swappedRankedItems)
        );

        props.setRefreshUrl(Math.random());

        dispatch(
          setHeaderMenuOpen(true)
        );

        break;

      case 6:
        dispatch(
          setHeaderMenuOpen(true)
        );
        break;
      
      case 11:
        dispatch(
          setShowUnranked(true)
        );
        //openModal('rankings');
        break;

      case 13:
        props.openConfigModal('rankings');
        break;

      case 14:
        props.setConfigModalShow(false);
        break;

      case 16:
        props.setConfigModalShow(false);
        dispatch(setName(""));
        await clearRanking(year);
        dispatch(
          setShowUnranked(true)
        );
        break;
    }
  }

  if (!JoyrideComponent) return null;

  return (
    <JoyrideComponent
      disableScrolling={true}
      disableScrollParentFix={true}
      continuous
      run={startTour}
      steps={tourSteps}
      stepIndex={joyrideStepIndex}
      callback={handleJoyrideCallback}
      showProgress={true}
      disableOverlay={false}
      styles={joyrideOptions}
    />
  );
};

export default JoyrideTour;
