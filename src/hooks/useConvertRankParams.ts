import { useCallback } from 'react';
import { useAppSelector } from './stateHooks';
import { AppState } from '../redux/store';
import { convertRankingUrlParamsByMode } from '../utilities/ContestantUtil';

export const useConvertRankParams = () => {
    const rankedItems = useAppSelector((state: AppState) => state.root.rankedItems);
    const globalSearch = useAppSelector((state: AppState) => state.root.globalSearch);
    const categories = useAppSelector((state: AppState) => state.root.categories);

    const convertRankingURLParams = useCallback((manualGlobalSearchFlag?: boolean) => {

        let isGlobalSearchMode = globalSearch;

        if (manualGlobalSearchFlag !== undefined) {
            isGlobalSearchMode = manualGlobalSearchFlag;
        }

        convertRankingUrlParamsByMode(categories, isGlobalSearchMode, rankedItems);
    }, [globalSearch, rankedItems]);


    return convertRankingURLParams;
}
