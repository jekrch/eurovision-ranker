import { sortByVotes, updateVoteTypeCode, voteCodeHasType } from "./VoteProcessor";
import { fetchVotesForYear } from "./VoteRepository";

jest.mock("./VoteRepository", () => ({
    fetchVotesForYear: jest.fn()
  }));
  

describe('voteCodeHasType', () => {
  it('returns true if vote code includes type code', () => {
    const result = voteCodeHasType('f-tv-gb', 'tv');
    expect(result).toBeTruthy();
  });

  it('returns false if vote code does not include type code', () => {
    const result = voteCodeHasType('f-j.t', 'tv');
    expect(result).toBeFalsy();
  });
});

describe('updateVoteTypeCode', () => {
    it('adds vote type if not present and add is true', () => {
      const result = updateVoteTypeCode('f-j', 'tv', true);
      expect(result).toBe('f-j.tv');
    });
  
    it('removes vote type if present and add is false', () => {
      const result = updateVoteTypeCode('f-j.tv', 'tv', false);
      expect(result).toBe('f-j');
    });
  });