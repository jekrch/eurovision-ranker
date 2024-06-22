import React from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../redux/types';
import { countries } from '../../data/Countries';
import { fetchCountryContestantsByYear } from '../../utilities/ContestantRepository';
import { sortByVotes } from '../../utilities/VoteProcessor';
import { findMostSimilarLists } from '../../utilities/RankAnalyzer';
import { getUrlParam } from '../../utilities/UrlUtil';
import IconButton from '../IconButton';
import { Country } from '../../data/Country';
import { CountryContestant } from '../../data/CountryContestant';

const AnalyzeTab: React.FC = () => {
  const year = useSelector((state: AppState) => state.year);

  // Get all country rank codes for the selected year and vote type
  const getAllCountryRankCodes = async (voteType: string, round: string, voteYear: string) => {
    const codeCountryNameMap = new Map<string, Country[]>();

    const countryContestants = await fetchCountryContestantsByYear(voteYear, '');

    for (const country of countries) {
      const concatenatedIds = await getRankingIds(voteYear, 'televote', 'final', countryContestants, country.key);

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
    const voteYear = year;

    const currentRankingCode = getUrlParam('r');

    const codeCountryNameMap: Map<string, Country[]> = await getAllCountryRankCodes('televote', 'final', voteYear);

    const codeArrays = Array.from(codeCountryNameMap.keys());

    const mostSimilarComparisons = await findMostSimilarLists(voteYear, currentRankingCode!, codeArrays);

    console.log(mostSimilarComparisons);

    let countryNames = '';

    for (const comparison of mostSimilarComparisons) {
      const countries = codeCountryNameMap.get(comparison.list2Code);

      for (const country of countries!) {
        countryNames += `${country.name}, `;
      }
    }

    console.log(currentRankingCode);
    console.log(countryNames);
  };

  return (
    <div className="mb-0">
      <p className="relative mb-[1em] mt-2 text-sm">
        Compare your current ranking with others, including the Jury and/or Tele vote from each participating country
      </p>
      <div className="mt-5 mb-[1.5em]">
        <IconButton
          className="ml-1 font-normal pl-[0.7em] rounded-md text-xs py-[0.5em] pr-[1em]"
          onClick={async () => await findMostSimilarVoteByCountry()}
          icon={undefined}
          title="Most similar"
        />
      </div>
    </div>
  );
};

export default AnalyzeTab;