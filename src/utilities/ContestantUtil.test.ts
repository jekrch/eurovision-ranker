import { clone, getDistinctRankedYears, getUids } from './ContestantUtil';
import { CountryContestant } from '../data/CountryContestant';

function countryContestant(
  key: string,
  overrides: Partial<CountryContestant> = {},
): CountryContestant {
  return {
    id: key,
    country: { id: key, name: key.toUpperCase(), key, icon: '' },
    contestant: null,
    ...overrides,
  } as CountryContestant;
}

describe('clone', () => {
  it('returns a copy that matches the original', () => {
    const original = [countryContestant('gb')];

    expect(clone(original)).toEqual(original);
  });

  it('leaves the original untouched when the copy is edited', () => {
    const original = [countryContestant('gb')];

    const copy = clone(original);
    copy[0].country.name = 'changed';

    expect(original[0]!.country.name).toBe('GB');
  });
});

describe('getUids', () => {
  it('collects the uid of every entry that has one', () => {
    const contestants = [
      countryContestant('gb', { uid: 'a1' }),
      countryContestant('se'),
      countryContestant('no', { uid: 'b2' }),
    ];

    expect(getUids(contestants)).toEqual(['a1', 'b2']);
  });

  it('collects nothing from an empty ranking', () => {
    expect(getUids([])).toEqual([]);
  });
});

describe('getDistinctRankedYears', () => {
  it('lists each contest year once, in the order first ranked', () => {
    const contestants = [
      countryContestant('gb', { contestant: { year: '2023' } as never }),
      countryContestant('se', { contestant: { year: '2018' } as never }),
      countryContestant('no', { contestant: { year: '2023' } as never }),
    ];

    expect(getDistinctRankedYears(contestants)).toEqual(['2023', '2018']);
  });

  it('skips entries that have no contestant attached', () => {
    const contestants = [
      countryContestant('gb', { contestant: { year: '2023' } as never }),
      countryContestant('se'),
    ];

    expect(getDistinctRankedYears(contestants)).toEqual(['2023']);
  });
});
