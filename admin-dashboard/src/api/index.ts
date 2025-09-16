/**
 * 커뮤니티 API 인덱스
 *
 * @description 모든 커뮤니티 API들을 한 곳에서 export합니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

// 공통 API
export * from './community-common';

// 개별 도메인 API들
export * from './community-sharing-api';
export * from './job-posts-api';
export * from './church-events-api';
export * from './music-team-api';

// 통합 API 서비스들
export {
  SharingAPI,
  RequestAPI,
  OfferAPI,
  SharingIntegratedAPI
} from './community-sharing-api';

export {
  JobPostAPI,
  JobSeekerAPI,
  JobMatchingAPI,
  JobApplicationAPI,
  JobIntegratedAPI
} from './job-posts-api';

export {
  ChurchEventAPI,
  ChurchNewsAPI,
  ChurchIntegratedAPI
} from './church-events-api';

export {
  default as MusicTeamRecruitmentAPI,
  MusicTeamSeekerAPI,
  anyingAPI as MusicTeamMatchingAPI,
  MusicTeamIntegratedAPI
} from './music-team-api';

// 공통 클래스 및 함수들
export {
  CommunityAPI,
  COMMUNITY_ENDPOINTS,
  handleApiResponse,
  handleApiError,
  buildQueryParams,
  isStandardListResponse,
  isStandardSingleResponse,
  isApiErrorResponse,
  normalizeResponse
} from './community-common';