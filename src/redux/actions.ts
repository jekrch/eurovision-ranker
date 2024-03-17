import { Category } from "../utilities/CategoryUtil";
import { CountryContestant } from '../data/CountryContestant';
import { SetNameAction, SetYearAction, SetRankedItemsAction, SetUnrankedItemsAction, SetShowUnrankedAction, SetContestantsAction, SetIsDeleteModeAction, SetThemeAction, SetVoteAction, SetHeaderMenuOpen, SetCategories } from './types';

export const SET_NAME = 'SET_NAME';
export const SET_YEAR = 'SET_YEAR';
export const SET_THEME = 'SET_THEME';
export const SET_VOTE = 'SET_VOTE';
export const SET_HEADER_MENU_OPEN = 'SET_HEADER_MENU_OPEN';
export const SET_SHOW_UNRANKED = 'SET_SHOW_UNRANKED';
export const SET_IS_DELETE_MODE = 'SET_IS_DELETE_MODE';
export const SET_CONTESTANTS = 'SET_CONTESTANTS';
export const SET_RANKED_ITEMS = 'SET_RANKED_ITEMS';
export const SET_UNRANKED_ITEMS = 'SET_UNRANKED_ITEMS';
export const SET_CATEGORIES = 'SET_CATEGORIES';

export const setName = (name: string): SetNameAction => (
    { type: SET_NAME, payload: name }
);

export const setYear = (year: string): SetYearAction => (
    { type: SET_YEAR, payload: year }
);

export const setTheme = (theme: string): SetThemeAction => (
    { type: SET_THEME, payload: theme }
);

export const setHeaderMenuOpen = (headerMenuOpen: boolean): SetHeaderMenuOpen => (
    { type: SET_HEADER_MENU_OPEN, payload: headerMenuOpen }
);

export const setVote = (vote: string): SetVoteAction => (
    { type: SET_VOTE, payload: vote }
);

export const setShowUnranked = (showUnranked: boolean): SetShowUnrankedAction => (
    { type: SET_SHOW_UNRANKED, payload: showUnranked }
);

export const SetIsDeleteMode = (showUnranked: boolean): SetIsDeleteModeAction => (
    { type: SET_IS_DELETE_MODE, payload: showUnranked }
);

export const setRankedItems = (items: CountryContestant[]): SetRankedItemsAction => (
    { type: SET_RANKED_ITEMS, payload: items }
);

export const setUnrankedItems = (items: CountryContestant[]): SetUnrankedItemsAction => (
    { type: SET_UNRANKED_ITEMS, payload: items }
);

export const setContestants = (items: CountryContestant[]): SetContestantsAction => (
    { type: SET_CONTESTANTS, payload: items }
);

export const setCategories = (categories: Category[]): SetCategories => (
    { type: SET_CATEGORIES, payload: categories }
);