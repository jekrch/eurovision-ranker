import React, { useState } from 'react';
import { AppState } from '../../../redux/store';
import { countries } from '../../../data/Countries';
import { fetchCountryContestantsByYear } from '../../../utilities/ContestantRepository';
import { sortByVotes } from '../../../utilities/VoteProcessor';
import { RankingComparison, findMostDissimilarLists, findMostSimilarLists } from '../../../utilities/RankAnalyzer';
import { getUrlParam, getUrlParams, updateQueryParams } from '../../../utilities/UrlUtil';
import IconButton from '../../IconButton';
import { Country } from '../../../data/Country';
import { CountryContestant } from '../../../data/CountryContestant';
import Dropdown from '../../Dropdown';
import { saveCategories } from '../../../utilities/CategoryUtil';
import { setShowComparison } from '../../../redux/rootSlice';
import { getSourceCountryKey, getVoteTypeCodeFromOption, getVoteTypeOptionsByYear } from '../../../utilities/VoteUtil';
import TooltipHelp from '../../TooltipHelp';
import Checkbox from '../../Checkbox';
import BetaBadge from '../../BetaBadge';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';

const AnalyzeTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const year = useAppSelector((state: AppState) => state.year);
  const categories = useAppSelector((state: AppState) => state.categories);
  const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
  const [voteType, setVoteType] = useState(
    // if we have all 3 vote types for this year, use Televote as the default, else use Total
    getVoteTypeOptionsByYear(year)?.length > 1 ? 'Televote' : 'Total'
  );
  const [mostSimilarComparisons, setMostSimilarComparisons] = useState<RankingComparison[]>([]);
  const [mostDissimilarComparisons, setMostDissimilarComparisons] = useState<RankingComparison[]>([]);
  const [codeCountryNameMap, setCodeCountryNameMap] = useState<Map<string, Country[]>>(new Map());
  const showComparison = useAppSelector((state: AppState) => state.showComparison);
  const globalSearch = useAppSelector((state: AppState) => state.globalSearch);

  /**
   * Get all country rank codes for the selected year and vote type
   * 
   * @param voteType 
   * @param round 
   * @param voteYear 
   * @returns 
   */
  const getAllCountryRankCodes = async (globalMode: boolean, round: string, voteYear: string) => {
    const codeCountryNameMap = new Map<string, Country[]>();

    const countryContestants = await fetchCountryContestantsByYear(voteYear, '');

    for (const country of countries) {

      const concatenatedIds = await getRankingIds(
        globalMode, voteType, 'final', countryContestants, country.key
      );

      //console.log(globalMode)
      //console.log(concatenatedIds)
      if (codeCountryNameMap.has(concatenatedIds)) {
        codeCountryNameMap.get(concatenatedIds)?.push(country);
      } else {
        codeCountryNameMap.set(concatenatedIds, [country]);
      }
    }

    return codeCountryNameMap;
  };

  /**
   * Get ranking IDs based on the selected vote year, vote type, round, and source country key
   * 
   * @param voteYear 
   * @param voteType 
   * @param round 
   * @param countryContestants 
   * @param sourceCountryKey 
   * @returns 
   */
  const getRankingIds = async (
    globalMode: boolean,
    voteType: string,
    round: string,
    countryContestants: CountryContestant[],
    sourceCountryKey: string
  ) => {
    countryContestants = await sortByVotes(
      countryContestants, voteType, round, sourceCountryKey
    );

    const sortedContestants = countryContestants.filter(
      (cc) => cc?.contestant?.votes !== undefined
    );

    return sortedContestants.map((cc) => {
        return globalMode ? cc.uid : cc?.id;
      }
    ).join('');
  };

  // Find the most similar vote by country for the current ranking
  const findMostSimilarVoteByCountry = async () => {
    const extractedParams = getUrlParams(activeCategory);
    const currentRankingCode = extractedParams.rankings;
    const codeCountryMap: Map<string, Country[]> = await getAllCountryRankCodes(globalSearch, 'final', year);
    setCodeCountryNameMap(codeCountryMap);
    const codeArrays = Array.from(codeCountryMap.keys());
    const similarComparisons = await findMostSimilarLists(year, currentRankingCode!, codeArrays);
    setMostSimilarComparisons(similarComparisons);
  };

  // Find the most dissimilar vote by country for the current ranking
  const findMostDissimilarVoteByCountry = async () => {
    const extractedParams = getUrlParams(activeCategory);
    const currentRankingCode = extractedParams.rankings;
    const codeCountryMap: Map<string, Country[]> = await getAllCountryRankCodes(globalSearch, 'final', year);
    setCodeCountryNameMap(codeCountryMap);
    const codeArrays = Array.from(codeCountryMap.keys());
    const dissimilarComparisons = await findMostDissimilarLists(year, currentRankingCode!, codeArrays);
    setMostDissimilarComparisons(dissimilarComparisons);
  };


  function getCountryNamesFromComparisons(
    mostSimilarComparisons: RankingComparison[],
    codeCountryNameMap: Map<string, Country[]>
  ): string[] {
    const countries = mostSimilarComparisons
      .flatMap(comparison => codeCountryNameMap.get(comparison.list2Code) ?? [])
      .map(country => country.name);

    return countries.sort((a, b) => a?.localeCompare(b));
  }

  // Get the title for the ranking link based on the vote type and country name
  const getRankingTitle = (voteType: string, countryName: string) => {
    return `${voteType.charAt(0).toUpperCase() + voteType.slice(1)}: ${countryName}`;
  };

  // Get the URL for the ranking link based on the comparison, year, vote type, and country name
  const getRankingUrl = (comparison: RankingComparison, countryName: string) => {
    return `?r=${comparison.list2Code}` +
      `&y=${year.substring(2, 4)}` +
      `&n=${getRankingTitle(voteType, countryName).replaceAll(' ', '+')}` +
      `&v=f-${getVoteTypeCodeFromOption(voteType)}-${getSourceCountryKey(countryName)}`;
  };

  // Format the percent similarity to the nearest tenth percent or percent if it's .0
  const formatPercentSimilarity = (percent: number) => {
    const roundedPercent = Math.round(percent * 10) / 10;
    return roundedPercent % 1 === 0 ? roundedPercent.toFixed(0) : roundedPercent.toFixed(1);
  };

  const addRankingAsCategory = (rankingCode: string, rankingTitle: string) => {
    const currentNonCatRanking = getUrlParam('r');

    let updatedCategories = [...categories];

    // if there's an uncategorized ranking create a cat for it 
    if (currentNonCatRanking) {

      const currentRankingTitle = 'Original';
      const originalRanking = {
        name: currentRankingTitle,
        weight: 5,
      };
      updatedCategories = [...updatedCategories, originalRanking];

    }

    // comparison categories should have no weight so that the total 
    // ranking reflect the original
    const newCategory = {
      name: rankingTitle,
      weight: 0,
    };

    const categoriesWithNewRanking = [...updatedCategories, newCategory];
    saveCategories(
      categoriesWithNewRanking,
      dispatch,
      updatedCategories,
      activeCategory
    );

    // add param for new ranking based on the category index
    const categoryIndex = categoriesWithNewRanking.length;
    updateQueryParams({
      [`r${categoryIndex}`]: rankingCode,
    });
  };

  /**
   * Handle check even on show category comparison checkbox
   * @param checked 
   */
  const onShowComparisonChange = (checked: boolean) => {
    updateQueryParams({ cm: checked === true ? 't' : 'f' })
    dispatch(
      setShowComparison(checked === true)
    );
  };

  const renderComparisonList = (comparisons: RankingComparison[], title: string) => (
    <div className="mt-4">
      <p className="text-sm mb-2">{title} {voteType} rankings:</p>
      <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
        {comparisons.flatMap(comparison =>
          getCountryNamesFromComparisons([comparison], codeCountryNameMap).map((country, index) => (
            <React.Fragment key={`${comparison.list2Code}-${index}`}>
              <div className="whitespace-nowrap flex items-center">

                <a href={getRankingUrl(comparison, country)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className=" text-blue-500 hover:underline"
                  title={getRankingTitle(voteType, country)}
                >
                  <span className="mt-auto">
                    {country} ({formatPercentSimilarity(comparison.percentSimilarity)}%)
                  </span>
                </a>
              </div>
              <div>
                <IconButton
                  className="pl-[0.7em] py-[0.5em] pr-[1em]"
                  onClick={() => addRankingAsCategory(comparison.list2Code, getRankingTitle(voteType, country))}
                  icon={undefined}
                  title="Add as Category"
                />
              </div>
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );

  return (

    <div className="mb-0">
      <div className="relative mb-[1em] mt-2 flex items-center">
        <div className="flex justify-center items-center mr-3 ml-3">
          <BetaBadge className="flex-shrink-0" />
        </div>
        <p className="text-sm mr-1">
          Compare your current ranking with the Jury or Tele vote from each participating country
        </p>
      </div>
      <div className="mt-5 mb-[1.5em]">
        <div>
          <Dropdown
            key="vote-type-selector"
            className="z-50 ml-3 mx-auto mb-2"
            menuClassName="w-auto"
            value={voteType}
            onChange={(v) => {
              setVoteType(v);
              setMostSimilarComparisons([]);
              setMostDissimilarComparisons([]);
            }}
            options={getVoteTypeOptionsByYear(year)}
            showSearch={false}
          />
        </div>
        <div className="mb-1">
          <TooltipHelp
            content="When viewing a category ranking, also display the contestant's rank in each other category"
            className="ml-2 pb-1"
          />
          <Checkbox
            id="total-checkbox"
            checked={showComparison}
            onChange={(c) => onShowComparisonChange(c)}
            label="Show Category Comparisons"
          />
        </div>
        <IconButton
          className="ml-3 pl-[0.7em] py-[0.5em] pr-[1em]"
          onClick={async () => await findMostSimilarVoteByCountry()}
          icon={undefined}
          title="Most similar"
        />
        <IconButton
          className="ml-3 font-normal pl-[0.7em] rounded-md text-xs py-[0.5em] pr-[1em]"
          onClick={async () => await findMostDissimilarVoteByCountry()}
          icon={undefined}
          title="Most dissimilar"
        />
      </div>

      {mostSimilarComparisons.length > 0 && renderComparisonList(mostSimilarComparisons, "Most similar")}
      {mostDissimilarComparisons.length > 0 && renderComparisonList(mostDissimilarComparisons, "Most dissimilar")}
    </div>
  );
};

export default AnalyzeTab;
