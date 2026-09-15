// @vitest-environment jsdom
import {
  areCategoriesSet,
  categoryRankingsExist,
  getAllCategoryRankingsFromUrl,
  getContestantCategoryRankingsFromUrl,
  getCountryCategoryRankingsFromUrl,
  parseCategoriesUrlParam,
} from './categoryUrl';
import { Category } from './types';
import { Country } from '../../data/Country';
import { CountryContestant } from '../../data/CountryContestant';

const setUrl = (search: string) => window.history.replaceState(null, '', search);

const categories: Category[] = [
  { name: 'vocals', weight: 5 },
  { name: 'staging', weight: 3 },
];

beforeEach(() => setUrl('/'));

describe('parseCategoriesUrlParam', () => {
  it('reads each category name and weight', () => {
    expect(parseCategoriesUrlParam('vocals-5|staging-3')).toEqual([
      { name: 'vocals', weight: 5 },
      { name: 'staging', weight: 3 },
    ]);
  });

  it('keeps a dash that belongs to the category name', () => {
    expect(parseCategoriesUrlParam('stage-presence-4')).toEqual([
      { name: 'stage-presence', weight: 4 },
    ]);
  });

  it('reads a single category', () => {
    expect(parseCategoriesUrlParam('vocals-5')).toEqual([{ name: 'vocals', weight: 5 }]);
  });
});

describe('categoryRankingsExist', () => {
  it('reports rankings when a category has one', () => {
    const params = new URLSearchParams('c=vocals-5|staging-3&r1=abc');

    expect(categoryRankingsExist(params)).toBe(true);
  });

  it('reports none when the categories are all empty', () => {
    const params = new URLSearchParams('c=vocals-5|staging-3&r1=');

    expect(categoryRankingsExist(params)).toBe(false);
  });

  it('reports none when no categories are defined', () => {
    expect(categoryRankingsExist(new URLSearchParams('r1=abc'))).toBe(false);
  });

  it('falls back to the current address when given no params', () => {
    setUrl('?c=vocals-5&r1=abc');

    expect(categoryRankingsExist()).toBe(true);
  });
});

describe('getAllCategoryRankingsFromUrl', () => {
  it('maps each category to the countries ranked under it', () => {
    const params = new URLSearchParams('r1=abc&r2=cba');

    expect(getAllCategoryRankingsFromUrl(categories, params)).toEqual({
      vocals: ['a', 'b', 'c'],
      staging: ['c', 'b', 'a'],
    });
  });

  it('leaves out a category that has not been ranked', () => {
    const params = new URLSearchParams('r1=abc');

    expect(getAllCategoryRankingsFromUrl(categories, params)).toEqual({
      vocals: ['a', 'b', 'c'],
    });
  });

  it('maps nothing when no categories are given', () => {
    expect(getAllCategoryRankingsFromUrl([], new URLSearchParams('r1=abc'))).toEqual({});
  });
});

describe('getCountryCategoryRankingsFromUrl', () => {
  it('reports the place a country holds in each category', () => {
    setUrl('?r1=abc&r2=cba');
    const country = { id: 'c', key: 'cy', name: 'Cyprus', icon: '' } as Country;

    expect(getCountryCategoryRankingsFromUrl(categories, country)).toEqual({
      vocals: 3,
      staging: 1,
    });
  });

  it('reports no place for a country missing from a category ranking', () => {
    setUrl('?r1=ab');
    const country = { id: 'z', key: 'zz', name: 'Zed', icon: '' } as Country;

    expect(getCountryCategoryRankingsFromUrl(categories, country)).toEqual({ vocals: 0 });
  });

  it('reports nothing when no category has been ranked', () => {
    const country = { id: 'a', key: 'aa', name: 'A', icon: '' } as Country;

    expect(getCountryCategoryRankingsFromUrl(categories, country)).toEqual({});
  });
});

describe('getContestantCategoryRankingsFromUrl', () => {
  it('reports the place a contestant holds in each category', () => {
    setUrl('?r1=abc&r2=cba');
    const countryContestant = { id: 'b', country: {}, contestant: null } as CountryContestant;

    expect(getContestantCategoryRankingsFromUrl(categories, countryContestant)).toEqual({
      vocals: 2,
      staging: 2,
    });
  });

  it('matches on the contestant when the ranking spans several contests', () => {
    setUrl('?r1=>aaabbbccc');
    const countryContestant = {
      id: 'b',
      country: {},
      contestant: { id: 'ccc' },
    } as CountryContestant;

    expect(getContestantCategoryRankingsFromUrl(categories, countryContestant)).toEqual({
      vocals: 3,
    });
  });

  it('reports no place for a contestant missing from the ranking', () => {
    setUrl('?r1=ab');
    const countryContestant = { id: 'z', country: {}, contestant: null } as CountryContestant;

    expect(getContestantCategoryRankingsFromUrl(categories, countryContestant)).toEqual({
      vocals: 0,
    });
  });
});

describe('areCategoriesSet', () => {
  it('reports categories once they are defined', () => {
    setUrl('?c=vocals-5');

    expect(areCategoriesSet()).toBe(true);
  });

  it('reports none when the category param is empty', () => {
    setUrl('?c=');

    expect(areCategoriesSet()).toBe(false);
  });

  it('reports none when the address has no categories', () => {
    expect(areCategoriesSet()).toBe(false);
  });
});
