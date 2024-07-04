import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../../redux/types';
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
import { setActiveCategory } from '../../../redux/actions';

const AnalyzeTab: React.FC = () => {
  const dispatch = useDispatch<any>();
  const year = useSelector((state: AppState) => state.year);
  const categories = useSelector((state: AppState) => state.categories);
  const activeCategory = useSelector((state: AppState) => state.activeCategory);
  const [voteType, setVoteType] = useState('televote');
  const [mostSimilarComparisons, setMostSimilarComparisons] = useState<RankingComparison[]>([]);
  const [mostDissimilarComparisons, setMostDissimilarComparisons] = useState<RankingComparison[]>([]);
  const [codeCountryNameMap, setCodeCountryNameMap] = useState<Map<string, Country[]>>(new Map());


  
  // Get all country rank codes for the selected year and vote type
  const getAllCountryRankCodes = async (voteType: string, round: string, voteYear: string) => {
    const codeCountryNameMap = new Map<string, Country[]>();

    const countryContestants = await fetchCountryContestantsByYear(voteYear, '');

    for (const country of countries) {
      const concatenatedIds = await getRankingIds(voteYear, voteType, 'final', countryContestants, country.key);

      if (codeCountryNameMap.has(concatenatedIds)) {
        codeCountryNameMap.get(concatenatedIds)?.push(country);
      } else {
        codeCountryNameMap.set(concatenatedIds, [country]);
      }
    }

    return codeCountryNameMap;
  };

  // Get ranking IDs based on the selected vote year, vote type, round, and source country key
  const getRankingIds = async (
    voteYear: string,
    voteType: string,
    round: string,
    countryContestants: CountryContestant[],
    sourceCountryKey: string
  ) => {
    countryContestants = await sortByVotes(countryContestants, voteYear, voteType, round, sourceCountryKey);

    const sortedContestants = countryContestants.filter((cc) => cc?.contestant?.votes !== undefined);

    return sortedContestants.map((cc) => cc.id).join('');
  };

    // Find the most similar vote by country for the current ranking
  const findMostSimilarVoteByCountry = async () => {
    const extractedParams = getUrlParams(activeCategory);
    const currentRankingCode = extractedParams.rankings;
    const codeCountryMap: Map<string, Country[]> = await getAllCountryRankCodes(voteType, 'final', year);
    setCodeCountryNameMap(codeCountryMap);
    const codeArrays = Array.from(codeCountryMap.keys());
    const similarComparisons = await findMostSimilarLists(year, currentRankingCode!, codeArrays);
    setMostSimilarComparisons(similarComparisons);
  };

  // Find the most dissimilar vote by country for the current ranking
  const findMostDissimilarVoteByCountry = async () => {
    const extractedParams = getUrlParams(activeCategory);
    const currentRankingCode = extractedParams.rankings;
    const codeCountryMap: Map<string, Country[]> = await getAllCountryRankCodes(voteType, 'final', year);
    setCodeCountryNameMap(codeCountryMap);
    const codeArrays = Array.from(codeCountryMap.keys());
    const dissimilarComparisons = await findMostDissimilarLists(year, currentRankingCode!, codeArrays);
    setMostDissimilarComparisons(dissimilarComparisons);
  };

  
  function getCountryNamesFromComparisons(
    mostSimilarComparisons: RankingComparison[], 
    codeCountryNameMap: Map<string, Country[]>
  ): string[] {
    return mostSimilarComparisons
      .flatMap(comparison => codeCountryNameMap.get(comparison.list2Code) ?? [])
      .map(country => country.name);
  }

  // Get the title for the ranking link based on the vote type and country name
  const getRankingTitle = (voteType: string, countryName: string) => {
    return `${voteType.charAt(0).toUpperCase() + voteType.slice(1)}: ${countryName}`;
  };

  // Get the URL for the ranking link based on the comparison, year, vote type, and country name
  const getRankingUrl = (comparison: RankingComparison, countryName: string) => {
    return `?r=${comparison.list2Code}&y=${year.substring(2, 4)}&n=${getRankingTitle(voteType, countryName).replaceAll(' ', '+')}&v=${voteType === 'televote' ? 'tv' : 'j'}`;
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

  
  return (
    <div className="mb-0">
      <p className="relative mb-[1em] mt-2 text-sm">
        Compare your current ranking with the Jury or Tele vote from each participating country
      </p>
      <div className="mt-5 mb-[1.5em]">
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
          options={['televote', 'jury']}
          showSearch={false}
        />
        <IconButton
          className="ml-3 font-normal pl-[0.7em] rounded-md text-xs py-[0.5em] pr-[1em]"
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
      {mostSimilarComparisons.length > 0 && (
        <div className="mt-4">
          <p className="text-sm">Most similar {voteType} rankings:</p>
          <ul>
            {mostSimilarComparisons.map((comparison, index) => (
              <li key={index}>
                {getCountryNamesFromComparisons([comparison], codeCountryNameMap).map((countryName, countryIndex) => {
                  const rankingTitle = getRankingTitle(voteType, countryName);
                  return (
                    <React.Fragment key={countryIndex}>
                      <a
                        href={getRankingUrl(comparison, countryName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                        title={rankingTitle}
                      >
                        {countryName} ({formatPercentSimilarity(comparison.percentSimilarity)}%)
                      </a>
                      <IconButton
                        className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-normal pl-[0.7em] rounded-md text-xs py-[0.5em] pr-[1em]"
                        onClick={() => addRankingAsCategory(comparison.list2Code, rankingTitle)}
                        icon={undefined}
                        title="Add as Category"
                      />
                      {countryIndex < getCountryNamesFromComparisons([comparison], codeCountryNameMap).length - 1 && ', '}
                    </React.Fragment>
                  );
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
      {mostDissimilarComparisons.length > 0 && (
        <div className="mt-4">
          <p className="text-sm">Most dissimilar {voteType} rankings:</p>
          <ul>
            {mostDissimilarComparisons.map((comparison, index) => (
              <li key={index}>
                {getCountryNamesFromComparisons([comparison], codeCountryNameMap).map((countryName, countryIndex) => {
                  const rankingTitle = getRankingTitle(voteType, countryName);
                  return (
                    <React.Fragment key={countryIndex}>
                      <a
                        href={getRankingUrl(comparison, countryName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                        title={rankingTitle}
                      >
                        {countryName} ({formatPercentSimilarity(comparison.percentSimilarity)}%)
                      </a>
                      <IconButton
                        className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-normal pl-[0.7em] rounded-md text-xs py-[0.5em] pr-[1em]"
                        onClick={() => addRankingAsCategory(comparison.list2Code, rankingTitle)}
                        icon={undefined}
                        title="Add as Category"
                      />
                      {countryIndex < getCountryNamesFromComparisons([comparison], codeCountryNameMap).length - 1 && ', '}
                    </React.Fragment>
                  );
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AnalyzeTab;
