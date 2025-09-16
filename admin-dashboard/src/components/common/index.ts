/**
 * 공통 컴포넌트 인덱스
 *
 * @description 모든 공통 컴포넌트들을 한 곳에서 export합니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

// 컴포넌트들
export { default as CommunityPostCard } from './CommunityPostCard';
export { default as CommunityPagination, SimplePagination, PaginationSkeleton } from './CommunityPagination';
export { default as StatusBadge, StatusFilter, StatusStats, StatusHistory } from './StatusBadge';

// 타입들은 각 컴포넌트 파일에서 직접 import하여 사용