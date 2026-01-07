import { getChosung, extractChosung, isChosungSearch, matchKoreanSearch } from './koreanSearch';

describe('koreanSearch utilities', () => {
  describe('getChosung', () => {
    it('should extract chosung from Korean characters', () => {
      expect(getChosung('홍')).toBe('ㅎ');
      expect(getChosung('길')).toBe('ㄱ');
      expect(getChosung('동')).toBe('ㄷ');
      expect(getChosung('김')).toBe('ㄱ');
      expect(getChosung('철')).toBe('ㅊ');
      expect(getChosung('수')).toBe('ㅅ');
    });

    it('should return original character for non-Korean characters', () => {
      expect(getChosung('A')).toBe('A');
      expect(getChosung('1')).toBe('1');
      expect(getChosung(' ')).toBe(' ');
    });
  });

  describe('extractChosung', () => {
    it('should extract chosung from Korean string', () => {
      expect(extractChosung('홍길동')).toBe('ㅎㄱㄷ');
      expect(extractChosung('김철수')).toBe('ㄱㅊㅅ');
      expect(extractChosung('이순신')).toBe('ㅇㅅㅅ');
      expect(extractChosung('박영희')).toBe('ㅂㅇㅎ');
    });

    it('should handle mixed Korean and non-Korean characters', () => {
      expect(extractChosung('홍길동123')).toBe('ㅎㄱㄷ123');
      expect(extractChosung('김AB철')).toBe('ㄱABㅊ');
    });
  });

  describe('isChosungSearch', () => {
    it('should return true for chosung-only strings', () => {
      expect(isChosungSearch('ㅎㄱㄷ')).toBe(true);
      expect(isChosungSearch('ㄱㅊㅅ')).toBe(true);
      expect(isChosungSearch('ㅇㅅㅅ')).toBe(true);
    });

    it('should return false for strings with non-chosung characters', () => {
      expect(isChosungSearch('홍길동')).toBe(false);
      expect(isChosungSearch('ㅎ길동')).toBe(false);
      expect(isChosungSearch('abc')).toBe(false);
      expect(isChosungSearch('123')).toBe(false);
    });
  });

  describe('matchKoreanSearch', () => {
    it('should match exact Korean names', () => {
      expect(matchKoreanSearch('홍길동', '홍길동')).toBe(true);
      expect(matchKoreanSearch('김철수', '김철수')).toBe(true);
    });

    it('should match partial Korean names', () => {
      expect(matchKoreanSearch('홍길동', '홍')).toBe(true);
      expect(matchKoreanSearch('홍길동', '길동')).toBe(true);
      expect(matchKoreanSearch('김철수', '김철')).toBe(true);
    });

    it('should match chosung search', () => {
      expect(matchKoreanSearch('홍길동', 'ㅎㄱㄷ')).toBe(true);
      expect(matchKoreanSearch('김철수', 'ㄱㅊㅅ')).toBe(true);
      expect(matchKoreanSearch('이순신', 'ㅇㅅㅅ')).toBe(true);
      expect(matchKoreanSearch('박영희', 'ㅂㅇㅎ')).toBe(true);
    });

    it('should match partial chosung search', () => {
      expect(matchKoreanSearch('홍길동', 'ㅎㄱ')).toBe(true);
      expect(matchKoreanSearch('김철수', 'ㄱㅊ')).toBe(true);
      expect(matchKoreanSearch('이순신', 'ㅇ')).toBe(true);
    });

    it('should match mixed search (Korean + chosung)', () => {
      expect(matchKoreanSearch('홍길동', '홍ㄱㄷ')).toBe(true);
      expect(matchKoreanSearch('김철수', '김ㅊㅅ')).toBe(true);
      expect(matchKoreanSearch('이순신', '이ㅅㅅ')).toBe(true);
    });

    it('should not match incorrect searches', () => {
      expect(matchKoreanSearch('홍길동', 'ㄱㄱㄱ')).toBe(false);
      expect(matchKoreanSearch('김철수', 'ㅎㄱㄷ')).toBe(false);
      expect(matchKoreanSearch('이순신', '박')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(matchKoreanSearch('홍길동', '홍길동')).toBe(true);
      expect(matchKoreanSearch('HongGilDong', 'hong')).toBe(true);
      expect(matchKoreanSearch('HongGilDong', 'HONG')).toBe(true);
    });

    it('should handle empty or null values', () => {
      expect(matchKoreanSearch('', '홍길동')).toBe(false);
      expect(matchKoreanSearch('홍길동', '')).toBe(false);
      expect(matchKoreanSearch(null as any, '홍길동')).toBe(false);
      expect(matchKoreanSearch('홍길동', null as any)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(matchKoreanSearch(' 홍길동 ', '홍길동')).toBe(true);
      expect(matchKoreanSearch('홍길동', ' ㅎㄱㄷ ')).toBe(true);
    });
  });
});
