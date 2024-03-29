import { CountryContestant } from "../data/CountryContestant";
import { Category } from "../utilities/CategoryUtil";

export interface AppState {
    name: string;
    year: string;
    showUnranked: boolean;
    isDeleteMode: boolean;
    headerMenuOpen: boolean;
    contestants: CountryContestant[];
    rankedItems: CountryContestant[];
    unrankedItems: CountryContestant[];
    categories: Category[];
    activeCategory: number | undefined;
    showTotalRank: boolean;
    theme: string;
    vote: string;
  }
  
  export interface Action {
    type: string;
    payload: any;
  }
  
  export interface SetNameAction extends Action {
    type: 'SET_NAME';
    payload: string;
  }
  
  export interface SetYearAction extends Action {
    type: 'SET_YEAR';
    payload: string;
  }
  
  export interface SetVoteAction extends Action {
    type: 'SET_VOTE';
    payload: string;
  }

  export interface SetThemeAction extends Action {
    type: 'SET_THEME';
    payload: string;
  }

  export interface SetShowUnrankedAction extends Action {
    type: 'SET_SHOW_UNRANKED';
    payload: boolean;
  }

  export interface SetHeaderMenuOpen extends Action {
    type: 'SET_HEADER_MENU_OPEN';
    payload: boolean;
  }

  export interface SetIsDeleteModeAction extends Action {
    type: 'SET_IS_DELETE_MODE';
    payload: boolean;
  }

  export interface SetRankedItemsAction extends Action {
    type: 'SET_RANKED_ITEMS';
    payload: CountryContestant[];
  }

  export interface SetUnrankedItemsAction extends Action {
    type: 'SET_UNRANKED_ITEMS';
    payload: CountryContestant[];
  }

  export interface SetContestantsAction extends Action {
    type: 'SET_CONTESTANTS';
    payload: CountryContestant[];
  }
  
  export interface SetCategories extends Action {
    type: 'SET_CATEGORIES';
    payload: Category[];
  }

  export interface SetActiveCategory extends Action {
    type: 'SET_ACTIVE_CATEGORY';
    payload: number | undefined;
  }

  export interface SetShowTotalRank extends Action {
    type: 'SHOW_TOTAL_RANK';
    payload: boolean;
  }