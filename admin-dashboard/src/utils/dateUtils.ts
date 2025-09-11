/**
 * 날짜 포맷 유틸리티 함수들
 */

/**
 * 등록일 표시용 포맷 (년-월-일 시:분)
 */
export const formatCreatedAt = (dateString: string): string => {
  const date = new Date(dateString);
  
  // 유효하지 않은 날짜인 경우 원본 문자열 반환
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * 행사일 표시용 포맷 (년월일 요일)
 */
export const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  // 유효하지 않은 날짜인 경우 원본 문자열 반환
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
};

/**
 * 마감일 표시용 포맷 (년-월-일)
 */
export const formatDeadline = (dateString: string): string => {
  const date = new Date(dateString);
  
  // 유효하지 않은 날짜인 경우 원본 문자열 반환
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};