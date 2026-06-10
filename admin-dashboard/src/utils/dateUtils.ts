/**
 * 날짜 포맷 유틸리티 함수들 — 전 화면 통일 포맷 사용
 *
 * 표시 포맷:
 *   - 날짜만:  YYYY-MM-DD       (예: 2026-06-10)
 *   - 날짜+시:  YYYY-MM-DD HH:MM (예: 2026-06-10 14:30)
 *
 * 잘못된 값/빈 값: '-' 반환 (placeholder)
 *   - 등록일 전용은 '등록일 없음'으로 처리
 */

const KST = 'Asia/Seoul';

const pad = (n: number) => n.toString().padStart(2, '0');

/**
 * Date → YYYY-MM-DD (KST)
 */
const toYMD = (date: Date): string => {
  // Intl로 KST 변환 후 part 추출 (timezone 안전)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value || '';
  const m = parts.find(p => p.type === 'month')?.value || '';
  const d = parts.find(p => p.type === 'day')?.value || '';
  return `${y}-${m}-${d}`;
};

/**
 * Date → HH:MM (KST)
 */
const toHM = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: KST,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const h = parts.find(p => p.type === 'hour')?.value || '00';
  const m = parts.find(p => p.type === 'minute')?.value || '00';
  return `${h}:${m}`;
};

/**
 * 날짜 포맷 — YYYY-MM-DD
 *
 * - 입력이 이미 'YYYY-MM-DD' 형태면 그대로 반환
 * - ISO/Timestamp 입력은 KST 기준으로 변환
 * - 빈 값 / 유효하지 않은 값은 fallback ('-')
 */
export const formatDate = (
  value: string | Date | null | undefined,
  fallback: string = '-'
): string => {
  if (!value || value === 'null') return fallback;

  // 'YYYY-MM-DD' 그대로면 그대로 반환
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return fallback;
  return toYMD(date);
};

/**
 * 날짜+시간 포맷 — YYYY-MM-DD HH:MM
 */
export const formatDateTime = (
  value: string | Date | null | undefined,
  fallback: string = '-'
): string => {
  if (!value || value === 'null') return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return fallback;
  return `${toYMD(date)} ${toHM(date)}`;
};

/**
 * 등록일 표시 — YYYY-MM-DD HH:MM (없으면 '등록일 없음')
 *
 * 기존 코드 호환을 위해 유지
 */
export const formatCreatedAt = (dateString: string | null | undefined): string => {
  if (!dateString || dateString === 'null') return '등록일 없음';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '등록일 없음';
  return `${toYMD(date)} ${toHM(date)}`;
};

/**
 * 행사일 — YYYY-MM-DD (기존 행사일 헬퍼도 통일 포맷으로 변경)
 */
export const formatEventDate = (dateString: string): string => {
  return formatDate(dateString, dateString);
};

/**
 * 마감일 — YYYY-MM-DD
 */
export const formatDeadline = (dateString: string): string => {
  return formatDate(dateString, dateString);
};
