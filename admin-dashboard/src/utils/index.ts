/**
 * 유틸리티 함수 인덱스
 *
 * @description 모든 유틸리티 함수들을 한 곳에서 export합니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

// 기존 유틸리티들
export * from './dateUtils';
export * from './status-mapping';

// 새로운 커뮤니티 헬퍼들
export * from './community-helpers';

// 개별 함수들 명시적 export
export {
  formatCreatedAt,
  formatEventDate
} from './dateUtils';

export {
  mapToStandardStatus,
  getStatusLabel,
  getStatusClass,
  getStatusFilterOptions
} from './status-mapping';

export {
  getModuleLabel,
  getModuleIcon,
  getModuleColor,
  getCategoryLabel,
  getInstrumentLabel,
  getEventTypeLabel,
  formatContact,
  validatePhone,
  validateEmail,
  generatePostSummary,
  calculateSearchScore,
  sortPosts,
  filterPosts,
  deduplicatePosts,
  highlightText,
  formatFileSize,
  isValidUrl
} from './community-helpers';