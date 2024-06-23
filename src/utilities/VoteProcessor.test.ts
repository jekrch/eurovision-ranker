import { updateVoteTypeCode, voteCodeHasType, voteCodeHasSourceCountry } from "./VoteProcessor";

vi.mock("./VoteRepository", () => ({
    fetchVotesForYear: vi.fn()
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

  describe('voteCodeHasSourceCountry', () => {
    it('returns false for voteCode without a source country', () => {
      const result = voteCodeHasSourceCountry('f-j');
      expect(result).toBeFalsy();
    });

    it('returns true for voteCode with a source country', () => {
      const result = voteCodeHasSourceCountry('f-j-gb');
      expect(result).toBeTruthy();
    });
  });