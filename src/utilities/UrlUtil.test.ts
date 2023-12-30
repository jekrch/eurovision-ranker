import { convertRankingsStrToArray } from "./UrlUtil";

describe('convertRankingsStrToArray', () => {
    it('should correctly convert a string without special characters', () => {
        expect(convertRankingsStrToArray('abc')).toEqual(['a', 'b', 'c']);
    });

    it('should correctly convert a string with periods', () => {
        expect(convertRankingsStrToArray('a.b.c')).toEqual(['a', '.b', '.c']);
    });

    it('should handle underscores followed by non-periods', () => {
        expect(convertRankingsStrToArray('a_b_c')).toEqual(['a', '_b', '_c']);
    });

    it('should handle underscores followed by periods', () => {
        expect(convertRankingsStrToArray('a_.b_.c')).toEqual(['a', '_.b', '_.c']);
    });

    it('should remove duplicates', () => {
        expect(convertRankingsStrToArray('a.a.a_b.b_.c')).toEqual(['a', '.a', '_b', '.b', '_.c']);
    });

    it('should handle empty strings', () => {
        expect(convertRankingsStrToArray('')).toEqual([]);
    });

    it('should handle strings ending with underscored codes', () => {
        expect(convertRankingsStrToArray('ab.')).toEqual(['a', 'b', '.']);
        expect(convertRankingsStrToArray('ab_c')).toEqual(['a', 'b', '_c']);
    });
});