import { Dispatch } from 'redux';
import { decodeRankingsFromURL } from './UrlUtil';
import { setShowUnranked } from '../redux/actions';


export const setVh = () => {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

export const handlePopState = (
  event: PopStateEvent,
  areCategoriesSet: () => boolean,
  activeCategory: number | undefined,
  dispatch: Dispatch<any>
) => {
  // User clicked back (or forward) button
  const decodeFromUrl = async () => {
    let category = areCategoriesSet() && !activeCategory ? 0 : activeCategory;
    const rankingsExist = await decodeRankingsFromURL(category, dispatch);

    // Set showUnranked based on whether rankings exist
    dispatch(
      setShowUnranked(!rankingsExist)
    );
  };
  decodeFromUrl();
};

export const addWindowEventListeners = (
  setVhCallback: () => void,
  handlePopStateCallback: (event: PopStateEvent) => void
) => {
  window.addEventListener('resize', setVhCallback);
  window.addEventListener('orientationchange', setVhCallback);
  window.addEventListener('popstate', handlePopStateCallback);
};

export const removeWindowEventListeners = (
  setVhCallback: () => void,
  handlePopStateCallback: (event: PopStateEvent) => void
) => {
  window.removeEventListener('resize', setVhCallback);
  window.removeEventListener('popstate', handlePopStateCallback);
};