/**
 * 커뮤니티 타입 정의 통합 인덱스
 *
 * @description 모든 커뮤니티 관련 타입들을 한 곳에서 export합니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

// 모든 타입들을 단순히 재export
export * from './community-common';
export * from './community-sharing';
export * from './job-posts';
export * from './music-team';
export * from './church-events';
export * from './chat';

// 커뮤니티 모듈 타입
export type CommunityModule =
  | 'sharing'
  | 'request'
  | 'offer'
  | 'job-post'
  | 'job-seeker'
  | 'music-recruitment'
  | 'music-seeker'
  | 'church-event'
  | 'church-news';

// API 엔드포인트 타입
export type CommunityEndpoint = {
  [K in CommunityModule]: string;
};