/**
 * 음악팀 모집/지원 API 서비스
 *
 * @description 음악팀 모집 및 지원자 관련 API 호출 함수들을 제공합니다.
 * @version 2.0.0
 * @since 2025-09-15
 * @reference FRONTEND_API_MIGRATION_GUIDE.md - 백엔드 API 스키마 통일화 반영
 */

import {
  CommunityAPI,
  COMMUNITY_ENDPOINTS,
  StandardListResponse,
  StandardSingleResponse,
  handleApiResponse,
  handleApiError,
  buildQueryParams
} from './community-common';

import {
  MusicTeamRecruitment,
  MusicTeamSeeker,
  MusicRecruitmentFilterOptions,
  MusicSeekerFilterOptions,
  CreateMusicRecruitmentDTO,
  CreateMusicSeekerDTO,
  UpdateMusicRecruitmentDTO,
  UpdateMusicSeekerDTO
} from '../types/music-team';

// =============================================================================
// API 엔드포인트 정의
// =============================================================================
const MUSIC_TEAM_ENDPOINTS = {
  // 음악팀 모집
  RECRUITMENTS: '/community/music-team-recruitments',
  RECRUITMENT_DETAIL: (id: number) => `/community/music-team-recruitments/${id}`,
  RECRUITMENT_APPLY: (id: number) => `/community/music-team-recruitments/${id}/apply`,
  RECRUITMENT_APPLICANTS: (id: number) => `/community/music-team-recruitments/${id}/applicants`,
  RECRUITMENT_STATS: '/community/music-team-recruitments/stats',

  // 음악팀 지원자
  SEEKERS: '/community/music-team-seekers',
  SEEKER_DETAIL: (id: number) => `/community/music-team-seekers/${id}`,
  SEEKER_MATCHES: (id: number) => `/community/music-team-seekers/${id}/matches`,
  SEEKER_STATS: '/community/music-team-seekers/stats',

  // 매칭 시스템
  MATCHING: '/community/music-team/matching',
  MATCH_DETAIL: (id: number) => `/community/music-team/matches/${id}`,
  MATCH_ACCEPT: (id: number) => `/community/music-team/matches/${id}/accept`,
  MATCH_REJECT: (id: number) => `/community/music-team/matches/${id}/reject`,

  // 공통
  INSTRUMENTS: '/community/music-team/instruments',
  TEAM_TYPES: '/community/music-team/team-types',
  EXPERIENCE_LEVELS: '/community/music-team/experience-levels',
  PORTFOLIO_UPLOAD: '/community/music-team/portfolio/upload'
} as const;

// =============================================================================
// 음악팀 모집 API 클래스
// =============================================================================
class MusicTeamRecruitmentAPI {
  /**
   * 음악팀 모집 목록 조회
   */
  static async getList(options: MusicRecruitmentFilterOptions = {}): Promise<StandardListResponse<MusicTeamRecruitment>> {
    try {
      return await CommunityAPI.getList<MusicTeamRecruitment>('music-recruitment', options as any);
    } catch (error) {
      throw handleApiError(error, 'MusicTeamRecruitmentAPI.getList');
    }
  }

  /**
   * 음악팀 모집 상세 조회
   */
  static async getDetail(id: number): Promise<StandardSingleResponse<MusicTeamRecruitment>> {
    try {
      return await CommunityAPI.getDetail<MusicTeamRecruitment>('music-recruitment', id);
    } catch (error) {
      throw handleApiError(error, 'MusicTeamRecruitmentAPI.getDetail');
    }
  }

  /**
   * 음악팀 모집 생성
   */
  static async create(data: CreateMusicRecruitmentDTO): Promise<StandardSingleResponse<MusicTeamRecruitment>> {
    try {
      return await CommunityAPI.create<MusicTeamRecruitment>('music-recruitment', data);
    } catch (error) {
      throw handleApiError(error, 'MusicTeamRecruitmentAPI.create');
    }
  }

  /**
   * 음악팀 모집 수정
   */
  static async update(id: number, data: UpdateMusicRecruitmentDTO): Promise<StandardSingleResponse<MusicTeamRecruitment>> {
    try {
      return await CommunityAPI.update<MusicTeamRecruitment>('music-recruitment', id, data);
    } catch (error) {
      throw handleApiError(error, 'MusicTeamRecruitmentAPI.update');
    }
  }

  /**
   * 음악팀 모집 삭제
   */
  static async delete(id: number): Promise<void> {
    try {
      return await CommunityAPI.delete('music-recruitment', id);
    } catch (error) {
      throw handleApiError(error, 'MusicTeamRecruitmentAPI.delete');
    }
  }

  /**
   * 음악팀 모집에 지원하기
   */
  static async apply(recruitmentId: number, applicationData: {
    seeker_id?: number;
    cover_letter?: string;
    portfolio_urls?: string[];
    expected_start_date?: string;
    additional_info?: string;
  }): Promise<StandardSingleResponse<any>> {
    try {
      const response = await fetch(MUSIC_TEAM_ENDPOINTS.RECRUITMENT_APPLY(recruitmentId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      });

      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamRecruitmentAPI.apply');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamRecruitmentAPI.apply');
    }
  }

  /**
   * 모집 지원자 목록 조회
   */
  static async getApplicants(recruitmentId: number, options: {
    page?: number;
    limit?: number;
    status?: 'all' | 'pending' | 'accepted' | 'rejected';
  } = {}): Promise<StandardListResponse<any>> {
    try {
      const response = await fetch(`${MUSIC_TEAM_ENDPOINTS.RECRUITMENT_APPLICANTS(recruitmentId)}?${buildQueryParams(options as any)}`);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamRecruitmentAPI.getApplicants');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamRecruitmentAPI.getApplicants');
    }
  }

  /**
   * 지원자 상태 변경 (수락/거절)
   */
  static async updateApplicationStatus(recruitmentId: number, applicationId: number, status: 'accepted' | 'rejected', notes?: string): Promise<StandardSingleResponse<any>> {
    try {
      const response = await fetch(`${MUSIC_TEAM_ENDPOINTS.RECRUITMENT_APPLICANTS(recruitmentId)}/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes })
      });

      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamRecruitmentAPI.updateApplicationStatus');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamRecruitmentAPI.updateApplicationStatus');
    }
  }

  /**
   * 음악팀 모집 통계 조회
   */
  static async getStats(): Promise<StandardSingleResponse<any>> {
    try {
      const response = await fetch(MUSIC_TEAM_ENDPOINTS.RECRUITMENT_STATS);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamRecruitmentAPI.getStats');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamRecruitmentAPI.getStats');
    }
  }

  /**
   * 내가 작성한 모집 목록 조회
   */
  static async getMyRecruitments(options: MusicRecruitmentFilterOptions = {}): Promise<StandardListResponse<MusicTeamRecruitment>> {
    try {
      const response = await fetch(`${MUSIC_TEAM_ENDPOINTS.RECRUITMENTS}/my-recruitments?${buildQueryParams(options as any)}`);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamRecruitmentAPI.getMyRecruitments');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamRecruitmentAPI.getMyRecruitments');
    }
  }

  /**
   * 인기 모집 공고 조회
   */
  static async getPopularRecruitments(limit: number = 10): Promise<StandardListResponse<MusicTeamRecruitment>> {
    try {
      return await MusicTeamRecruitmentAPI.getList({
        limit,
        sort_by: 'applicants_count',
        sort_order: 'desc',
        status: 'active'
      } as any);
    } catch (error) {
      throw handleApiError(error, 'MusicTeamRecruitmentAPI.getPopularRecruitments');
    }
  }
}

// =============================================================================
// 음악팀 지원자 API 클래스
// =============================================================================
class MusicTeamSeekerAPI {
  /**
   * 음악팀 지원자 목록 조회
   */
  static async getList(options: MusicSeekerFilterOptions = {}): Promise<StandardListResponse<MusicTeamSeeker>> {
    try {
      return await CommunityAPI.getList<MusicTeamSeeker>('music-seeker', options as any);
    } catch (error) {
      throw handleApiError(error, 'MusicTeamSeekerAPI.getList');
    }
  }

  /**
   * 음악팀 지원자 상세 조회
   */
  static async getDetail(id: number): Promise<StandardSingleResponse<MusicTeamSeeker>> {
    try {
      return await CommunityAPI.getDetail<MusicTeamSeeker>('music-seeker', id);
    } catch (error) {
      throw handleApiError(error, 'MusicTeamSeekerAPI.getDetail');
    }
  }

  /**
   * 음악팀 지원자 생성
   */
  static async create(data: CreateMusicSeekerDTO): Promise<StandardSingleResponse<MusicTeamSeeker>> {
    try {
      return await CommunityAPI.create<MusicTeamSeeker>('music-seeker', data);
    } catch (error) {
      throw handleApiError(error, 'MusicTeamSeekerAPI.create');
    }
  }

  /**
   * 음악팀 지원자 수정
   */
  static async update(id: number, data: UpdateMusicSeekerDTO): Promise<StandardSingleResponse<MusicTeamSeeker>> {
    try {
      return await CommunityAPI.update<MusicTeamSeeker>('music-seeker', id, data);
    } catch (error) {
      throw handleApiError(error, 'MusicTeamSeekerAPI.update');
    }
  }

  /**
   * 음악팀 지원자 삭제
   */
  static async delete(id: number): Promise<void> {
    try {
      return await CommunityAPI.delete('music-seeker', id);
    } catch (error) {
      throw handleApiError(error, 'MusicTeamSeekerAPI.delete');
    }
  }

  /**
   * 지원자 매칭 결과 조회
   */
  static async getMatches(seekerId: number, options: {
    page?: number;
    limit?: number;
    min_score?: number;
  } = {}): Promise<StandardListResponse<any>> {
    try {
      const response = await fetch(`${MUSIC_TEAM_ENDPOINTS.SEEKER_MATCHES(seekerId)}?${buildQueryParams(options as any)}`);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamSeekerAPI.getMatches');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamSeekerAPI.getMatches');
    }
  }

  /**
   * 지원자 통계 조회
   */
  static async getStats(): Promise<StandardSingleResponse<any>> {
    try {
      const response = await fetch(MUSIC_TEAM_ENDPOINTS.SEEKER_STATS);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamSeekerAPI.getStats');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamSeekerAPI.getStats');
    }
  }

  /**
   * 내 지원자 프로필 조회
   */
  static async getMyProfile(): Promise<StandardSingleResponse<MusicTeamSeeker>> {
    try {
      const response = await fetch(`${MUSIC_TEAM_ENDPOINTS.SEEKERS}/my-profile`);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamSeekerAPI.getMyProfile');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamSeekerAPI.getMyProfile');
    }
  }

  /**
   * 추천 지원자 목록 조회 (모집자를 위한)
   */
  static async getRecommendedSeekers(recruitmentId: number, limit: number = 10): Promise<StandardListResponse<MusicTeamSeeker>> {
    try {
      const response = await fetch(`${MUSIC_TEAM_ENDPOINTS.SEEKERS}/recommended?recruitment_id=${recruitmentId}&limit=${limit}`);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamSeekerAPI.getRecommendedSeekers');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamSeekerAPI.getRecommendedSeekers');
    }
  }
}

// =============================================================================
// 음악팀 매칭 API 클래스
// =============================================================================
class anyingAPI {
  /**
   * 자동 매칭 실행
   */
  static async findMatches(options: {
    seeker_id?: number;
    recruitment_id?: number;
    min_score?: number;
    limit?: number;
  } = {}): Promise<StandardListResponse<any>> {
    try {
      const response = await fetch(`${MUSIC_TEAM_ENDPOINTS.MATCHING}?${buildQueryParams(options as any)}`);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamAPI');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }

  /**
   * 매칭 상세 정보 조회
   */
  static async getMatchDetail(matchId: number): Promise<StandardSingleResponse<any>> {
    try {
      const response = await fetch(MUSIC_TEAM_ENDPOINTS.MATCH_DETAIL(matchId));
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamAPI');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }

  /**
   * 매칭 수락
   */
  static async acceptMatch(matchId: number, message?: string): Promise<StandardSingleResponse<any>> {
    try {
      const response = await fetch(MUSIC_TEAM_ENDPOINTS.MATCH_ACCEPT(matchId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });

      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamAPI');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }

  /**
   * 매칭 거절
   */
  static async rejectMatch(matchId: number, reason?: string): Promise<StandardSingleResponse<any>> {
    try {
      const response = await fetch(MUSIC_TEAM_ENDPOINTS.MATCH_REJECT(matchId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason })
      });

      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamAPI');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }

  /**
   * 나의 매칭 기록 조회
   */
  static async getMyMatches(options: {
    page?: number;
    limit?: number;
    status?: 'all' | 'pending' | 'accepted' | 'rejected';
    type?: 'as_seeker' | 'as_recruiter' | 'all';
  } = {}): Promise<StandardListResponse<any>> {
    try {
      const response = await fetch(`${MUSIC_TEAM_ENDPOINTS.MATCHING}/my-matches?${buildQueryParams(options as any)}`);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamAPI');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }
}

// =============================================================================
// 통합 음악팀 API 클래스
// =============================================================================
class MusicTeamIntegratedAPI {
  /**
   * 음악팀 관련 통합 검색
   */
  static async searchAll(query: string, options: {
    includeRecruitments?: boolean;
    includeSeekers?: boolean;
    limit?: number;
  } = {}): Promise<{
    recruitments: StandardListResponse<MusicTeamRecruitment>;
    seekers: StandardListResponse<MusicTeamSeeker>;
  }> {
    try {
      const { includeRecruitments = true, includeSeekers = true, limit = 10 } = options;

      const promises: Promise<any>[] = [];

      if (includeRecruitments) {
        promises.push(MusicTeamRecruitmentAPI.getList({} as any));
      }

      if (includeSeekers) {
        promises.push(MusicTeamSeekerAPI.getList({} as any));
      }

      const results = await Promise.all(promises);

      return {
        recruitments: includeRecruitments ? results[0] : { success: true, data: [], pagination: {} as any },
        seekers: includeSeekers ? results[includeRecruitments ? 1 : 0] : { success: true, data: [], pagination: {} as any }
      };
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }

  /**
   * 악기 목록 조회
   */
  static async getInstruments(): Promise<StandardSingleResponse<any[]>> {
    try {
      const response = await fetch(MUSIC_TEAM_ENDPOINTS.INSTRUMENTS);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamAPI');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }

  /**
   * 팀 타입 목록 조회
   */
  static async getTeamTypes(): Promise<StandardSingleResponse<any[]>> {
    try {
      const response = await fetch(MUSIC_TEAM_ENDPOINTS.TEAM_TYPES);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamAPI');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }

  /**
   * 경험 레벨 목록 조회
   */
  static async getExperienceLevels(): Promise<StandardSingleResponse<any[]>> {
    try {
      const response = await fetch(MUSIC_TEAM_ENDPOINTS.EXPERIENCE_LEVELS);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamAPI');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }

  /**
   * 포트폴리오 파일 업로드
   */
  static async uploadPortfolio(file: File, options: {
    type: 'audio' | 'video' | 'document';
    description?: string;
  }): Promise<StandardSingleResponse<{ url: string; filename: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', options.type);
      if (options.description) {
        formData.append('description', options.description);
      }

      const response = await fetch(MUSIC_TEAM_ENDPOINTS.PORTFOLIO_UPLOAD, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamAPI');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }

  /**
   * 대시보드용 요약 정보 조회
   */
  static async getDashboardSummary(): Promise<StandardSingleResponse<{
    active_recruitments: MusicTeamRecruitment[];
    recent_seekers: MusicTeamSeeker[];
    top_matches: any[];
    popular_instruments: any[];
    stats: {
      total_recruitments: number;
      total_seekers: number;
      successful_matches: number;
      active_recruitments: number;
    };
  }>> {
    try {
      const [recruitments, seekers, recruitmentStats, seekerStats] = await Promise.all([
        MusicTeamRecruitmentAPI.getList({} as any),
        MusicTeamSeekerAPI.getList({} as any),
        MusicTeamRecruitmentAPI.getStats(),
        MusicTeamSeekerAPI.getStats()
      ]);

      return {
        success: true,
        data: {
          active_recruitments: recruitments.data,
          recent_seekers: seekers.data,
          top_matches: [], // 매칭 데이터는 별도로 로드
          popular_instruments: [],
          stats: {
            total_recruitments: recruitmentStats.data?.total_recruitments || 0,
            total_seekers: seekerStats.data?.total_seekers || 0,
            successful_matches: recruitmentStats.data?.successful_matches || 0,
            active_recruitments: recruitmentStats.data?.active_recruitments || 0
          }
        }
      };
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }

  /**
   * 실시간 추천 시스템
   */
  static async getRecommendations(userId: number, type: 'recruitment' | 'seeker'): Promise<StandardListResponse<MusicTeamRecruitment | MusicTeamSeeker>> {
    try {
      const endpoint = type === 'recruitment'
        ? `/community/music-team/recommendations/recruitments`
        : `/community/music-team/recommendations/seekers`;

      const response = await fetch(`${endpoint}?user_id=${userId}`);
      const result = await response.json();
      return handleApiResponse(result, 'MusicTeamAPI');
    } catch (error) {
      throw handleApiError(error, 'MusicTeamAPI');
    }
  }
}

// 기본 내보내기
export {
  MusicTeamRecruitmentAPI as default,
  MusicTeamSeekerAPI,
  anyingAPI,
  MusicTeamIntegratedAPI,
  MUSIC_TEAM_ENDPOINTS
};