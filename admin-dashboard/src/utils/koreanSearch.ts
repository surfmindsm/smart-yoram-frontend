/**
 * 한글 초성 검색 유틸리티
 *
 * 사용 예시:
 * - matchKoreanSearch("홍길동", "ㅎㄱㄷ") => true
 * - matchKoreanSearch("김철수", "ㄱㅊㅅ") => true
 * - matchKoreanSearch("이순신", "이순") => true (일반 문자열 검색도 가능)
 */

// 한글 초성 배열
const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 한글 유니코드 범위
const HANGUL_START = 0xAC00; // '가'
const HANGUL_END = 0xD7A3;   // '힣'

/**
 * 한글 문자에서 초성 추출
 * @param char 한글 문자 (한 글자)
 * @returns 초성 문자 또는 원본 문자 (한글이 아닌 경우)
 */
export const getChosung = (char: string): string => {
  const charCode = char.charCodeAt(0);

  // 한글 범위 확인
  if (charCode < HANGUL_START || charCode > HANGUL_END) {
    return char; // 한글이 아니면 원본 반환
  }

  // 초성 인덱스 계산
  const chosungIndex = Math.floor((charCode - HANGUL_START) / (21 * 28));
  return CHOSUNG_LIST[chosungIndex];
};

/**
 * 문자열에서 초성만 추출
 * @param text 문자열
 * @returns 초성으로 변환된 문자열
 */
export const extractChosung = (text: string): string => {
  return text.split('').map(char => getChosung(char)).join('');
};

/**
 * 검색어가 초성인지 확인
 * @param searchTerm 검색어
 * @returns 초성 여부
 */
export const isChosungSearch = (searchTerm: string): boolean => {
  // 초성만으로 이루어진 검색어인지 확인
  return searchTerm.split('').every(char => CHOSUNG_LIST.includes(char));
};

/**
 * 한글 초성 검색 매칭
 * @param targetText 검색 대상 텍스트
 * @param searchTerm 검색어
 * @returns 매칭 여부
 */
export const matchKoreanSearch = (targetText: string, searchTerm: string): boolean => {
  if (!targetText || !searchTerm) {
    return false;
  }

  const normalizedTarget = targetText.toLowerCase().trim();
  const normalizedSearch = searchTerm.toLowerCase().trim();

  // 1. 일반 문자열 검색 (기본 검색)
  if (normalizedTarget.includes(normalizedSearch)) {
    return true;
  }

  // 2. 초성 검색
  if (isChosungSearch(normalizedSearch)) {
    // 대상 텍스트를 초성으로 변환
    const targetChosung = extractChosung(normalizedTarget);

    // 초성이 포함되어 있는지 확인
    return targetChosung.includes(normalizedSearch);
  }

  // 3. 혼합 검색 (일부는 완전한 글자, 일부는 초성)
  // 예: "홍ㄱㄷ" → "홍길동" 매칭
  let targetIndex = 0;
  let searchIndex = 0;

  while (targetIndex < normalizedTarget.length && searchIndex < normalizedSearch.length) {
    const searchChar = normalizedSearch[searchIndex];
    const targetChar = normalizedTarget[targetIndex];

    // 초성 문자인 경우
    if (CHOSUNG_LIST.includes(searchChar)) {
      const targetChosung = getChosung(targetChar);
      if (targetChosung === searchChar) {
        searchIndex++;
        targetIndex++;
      } else {
        targetIndex++;
      }
    }
    // 일반 문자인 경우
    else {
      if (targetChar === searchChar) {
        searchIndex++;
        targetIndex++;
      } else {
        targetIndex++;
      }
    }
  }

  // 모든 검색 문자를 찾았는지 확인
  return searchIndex === normalizedSearch.length;
};

/**
 * 배열에서 한글 초성 검색으로 필터링
 * @param items 검색 대상 배열
 * @param searchTerm 검색어
 * @param getTextFunc 각 항목에서 검색할 텍스트를 가져오는 함수
 * @returns 필터링된 배열
 */
export const filterByKoreanSearch = <T>(
  items: T[],
  searchTerm: string,
  getTextFunc: (item: T) => string | null | undefined
): T[] => {
  if (!searchTerm || !searchTerm.trim()) {
    return items;
  }

  return items.filter(item => {
    const text = getTextFunc(item);
    if (!text) return false;
    return matchKoreanSearch(text, searchTerm);
  });
};
