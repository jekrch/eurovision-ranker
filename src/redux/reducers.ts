import { CountryContestant } from '../data/CountryContestant';
import { SET_NAME, SET_YEAR, SET_RANKED_ITEMS, SET_UNRANKED_ITEMS, SET_SHOW_UNRANKED, SET_CONTESTANTS, SET_IS_DELETE_MODE, SET_THEME, SET_VOTE, SET_URL } from './actions';
import { Action, AppState } from './types';

const initialState: AppState = {
  name: '',
  year: '',
  theme: '',
  vote: 'loading',
  showUnranked: false,
  isDeleteMode: false,
  contestants: [],
  rankedItems: [],
  unrankedItems: [],
  url: ''
};

const rootReducer = (state = initialState, action: Action): AppState => {
  switch (action.type) {
    case SET_NAME:
      return { ...state, name: action.payload as string };
    case SET_YEAR:
      return { ...state, year: action.payload as string };
    case SET_THEME:
        return { ...state, theme: action.payload as string };
    case SET_VOTE:
      return { ...state, vote: action.payload as string };
    case SET_URL:
      return { ...state, url: action.payload as string };
    case SET_SHOW_UNRANKED:
        return { ...state, showUnranked: action.payload as boolean };
    case SET_IS_DELETE_MODE:
        return { ...state, isDeleteMode: action.payload as boolean };
    case SET_RANKED_ITEMS:
      return { ...state, rankedItems: action.payload as CountryContestant[] };
    case SET_UNRANKED_ITEMS:
      return { ...state, unrankedItems: action.payload as CountryContestant[] };
    case SET_CONTESTANTS:
      return { ...state, contestants: action.payload as CountryContestant[] };
    default:
      return state;
  }
};

export default rootReducer;
