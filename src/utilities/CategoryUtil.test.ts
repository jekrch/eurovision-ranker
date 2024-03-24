import {  isValidCategoryName, reorderByAllWeightedRankings } from './CategoryUtil';
import { CountryContestant } from '../data/CountryContestant';
import { Category } from './CategoryUtil';
import { convertRankingsStrToArray, updateQueryParams } from './UrlUtil';

jest.mock('./UrlUtil', () => ({
    convertRankingsStrToArray: jest.fn(),
    updateQueryParams: jest.fn(),
}));

jest.mock('../redux/actions', () => ({
    setActiveCategory: jest.fn(),
    setCategories: jest.fn(),
    setRankedItems: jest.fn(),
    setShowTotalRank: jest.fn(),
}));

describe('reorderByAllWeightedRankings', () => {
    const mockCountryContestants: CountryContestant[] = [
        {
            id: '1', country: {
                id: '1', name: 'Country 1', key: 'c1',
                icon: ''
            }
        },
        {
            id: '2', country: {
                id: '2', name: 'Country 2', key: 'c2',
                icon: ''
            }
        },
        {
            id: '3', country: {
                id: '3', name: 'Country 3', key: 'c3',
                icon: ''
            }
        },
        {
            id: '4', country: {
                id: '4', name: 'Country 4', key: 'c4',
                icon: ''
            }
        },
    ];


    beforeEach(() => {
        jest.clearAllMocks();
        (convertRankingsStrToArray as jest.Mock).mockImplementation((ranking) => ranking.split(''));
    });


    it('should reorder the rankedItems based on weighted category rankings', () => {

        const mockCategories: Category[] = [
            { name: 'Category 1', weight: 2 },
            { name: 'Category 2', weight: 1 },
        ];

        const searchParams = new URLSearchParams(
            'r1=1234&r2=3412'
        );

        const expectedResult = [
            mockCountryContestants[0], // 1
            mockCountryContestants[2], // 3
            mockCountryContestants[1], // 2
            mockCountryContestants[3], // 4
        ];

        const result = reorderByAllWeightedRankings(
            mockCategories, mockCountryContestants, searchParams
        );

        expect(result).toEqual(expectedResult);
    });

    it('reorder the rankedItems based on first category in array (given equal category weights)', () => {

        const mockCategories: Category[] = [
            { name: 'Category 1', weight: 1 }, // equal weights here, so we'll prefer the first for ties
            { name: 'Category 2', weight: 1 }, 
        ];

        const searchParams = new URLSearchParams(
            'r1=1234&r2=2134'
        );

        const expectedResult = [
            mockCountryContestants[0], // 1
            mockCountryContestants[1], // 2
            mockCountryContestants[2], // 3
            mockCountryContestants[3], // 4
        ];

        const result = reorderByAllWeightedRankings(
            mockCategories, mockCountryContestants, searchParams
        );

        expect(result).toEqual(expectedResult);
    });

    it('reorder the rankedItems based categories with equal weight', () => {

        const mockCategories: Category[] = [
            { name: 'Category 1', weight: 1 }, 
            { name: 'Category 2', weight: 1 }, 
        ];

        const searchParams = new URLSearchParams(
            'r1=1234&r2=4231'
        );

        const expectedResult = [
            mockCountryContestants[1], // 2
            mockCountryContestants[0], // 1
            mockCountryContestants[3], // 4
            mockCountryContestants[2], // 3
        ];

        const result = reorderByAllWeightedRankings(
            mockCategories, mockCountryContestants, searchParams
        );

        expect(result).toEqual(expectedResult);
    });

});

describe('isValidCategoryName', () => {
    it('should return false if the category name contains "|"', () => {
        const categories: Category[] = [];
        const result = isValidCategoryName('Invalid|Name', categories);
        expect(result).toBe(false);
    });

    it('should return false if the category name is "Total"', () => {
        const categories: Category[] = [];
        const result = isValidCategoryName('Total', categories);
        expect(result).toBe(false);
    });

    it('should return false if the category name already exists', () => {
        const categories: Category[] = [{ name: 'Existing Category', weight: 1 }];
        const result = isValidCategoryName('Existing Category', categories);
        expect(result).toBe(false);
    });

    it('should return true if the category name is valid', () => {
        const categories: Category[] = [];
        const result = isValidCategoryName('New Category', categories);
        expect(result).toBe(true);
    });
});