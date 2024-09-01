import { useCallback } from 'react';
import { useAppSelector } from './stateHooks';
import { convertRankingsStrToArray, getUrlParam, updateQueryParams } from '../utilities/UrlUtil';
import { AppState } from '../redux/store';
import { convertRankingUrlParamsByMode } from '../utilities/ContestantUtil';

export const useConvertRankParams = () => {
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const globalSearch = useAppSelector((state: AppState) => state.globalSearch);
    const categories = useAppSelector((state: AppState) => state.categories);

    const convertRankingURLParams = useCallback((manualGlobalSearchFlag?: boolean) => {

        let isGlobalSearchMode = globalSearch;

        if (manualGlobalSearchFlag !== undefined) {
            isGlobalSearchMode = manualGlobalSearchFlag;
        }

        convertRankingUrlParamsByMode(categories, isGlobalSearchMode, rankedItems);
    }, [globalSearch, rankedItems]);


    return convertRankingURLParams;
}
