/**
 * 구인/구직 API 서비스
 *
 * @description 구인 공고, 구직 신청 관련 API 함수들을 제공합니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

import { CommunityAPI } from './community-common';
import {
  JobPost,
  JobSeeker,
  CreateJobPostDTO,
  CreateJobSeekerDTO,
  UpdateJobPostDTO,
  UpdateJobSeekerDTO,
  JobPostFilterOptions,
  JobSeekerFilterOptions,
  ApiRequestOptions,
  StandardListResponse,
  StandardSingleResponse,
  JobApplication,
  ApplicationStatus
} from '../types';

/**
 * 구인 공고 API 서비스
 */
export class JobPostAPI {
  /**
   * 구인 공고 목록 조회
   */
  static async getList(
    options: ApiRequestOptions & JobPostFilterOptions = {}
  ): Promise<StandardListResponse<JobPost>> {
    return CommunityAPI.getList<JobPost>('job-post', options);
  }

  /**
   * 구인 공고 상세 조회
   */
  static async getDetail(id: number): Promise<StandardSingleResponse<JobPost>> {
    return CommunityAPI.getDetail<JobPost>('job-post', id);
  }

  /**
   * 구인 공고 등록
   */
  static async create(data: CreateJobPostDTO): Promise<StandardSingleResponse<JobPost>> {
    return CommunityAPI.create<JobPost>('job-post', data);
  }

  /**
   * 구인 공고 수정
   */
  static async update(
    id: number,
    data: UpdateJobPostDTO
  ): Promise<StandardSingleResponse<JobPost>> {
    return CommunityAPI.update<JobPost>('job-post', id, data);
  }

  /**
   * 구인 공고 삭제
   */
  static async delete(id: number): Promise<void> {
    return CommunityAPI.delete('job-post', id);
  }

  /**
   * 구인 공고 좋아요
   */
  static async toggleLike(id: number): Promise<{ liked: boolean; likes: number }> {
    return CommunityAPI.toggleLike('job-post', id);
  }

  /**
   * 구인 공고 조회수 증가
   */
  static async incrementView(id: number): Promise<{ view_count: number }> {
    return CommunityAPI.incrementView('job-post', id);
  }

  /**
   * 직책별 구인 공고 조회
   */
  static async getByPosition(
    position: string,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobPost>> {
    return this.getList({ ...options, position } as any);
  }

  /**
   * 고용 형태별 구인 공고 조회
   */
  static async getByEmploymentType(
    employmentType: string,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobPost>> {
    return this.getList({ ...options, employment_type: employmentType } as any);
  }

  /**
   * 교회별 구인 공고 조회
   */
  static async getByChurch(
    churchId: number,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobPost>> {
    return this.getList({ ...options, church_id: churchId });
  }

  /**
   * 마감일이 임박한 구인 공고 조회
   */
  static async getExpiringSoon(
    days: number = 7,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobPost>> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.getList({
      ...options,
      date_to: endDate.toISOString().split('T')[0]
    });
  }

  /**
   * 내가 등록한 구인 공고 조회
   */
  static async getMyPosts(
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobPost>> {
    return CommunityAPI.getMyPosts<JobPost>('job-post', options);
  }
  /**
   * 구인 공고 검색
   */
  static async search(
    query: string,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobPost>> {
    return CommunityAPI.search<JobPost>('job-post', query, options);
  }
}

/**
 * 구직 신청 API 서비스
 */
export class JobSeekerAPI {
  /**
   * 구직자 목록 조회
   */
  static async getList(
    options: ApiRequestOptions & JobSeekerFilterOptions = {}
  ): Promise<StandardListResponse<JobSeeker>> {
    return CommunityAPI.getList<JobSeeker>('job-seeker', options);
  }

  /**
   * 구직자 상세 조회
   */
  static async getDetail(id: number): Promise<StandardSingleResponse<JobSeeker>> {
    return CommunityAPI.getDetail<JobSeeker>('job-seeker', id);
  }

  /**
   * 구직 신청 등록
   */
  static async create(data: CreateJobSeekerDTO): Promise<StandardSingleResponse<JobSeeker>> {
    return CommunityAPI.create<JobSeeker>('job-seeker', data);
  }

  /**
   * 구직 신청 수정
   */
  static async update(
    id: number,
    data: UpdateJobSeekerDTO
  ): Promise<StandardSingleResponse<JobSeeker>> {
    return CommunityAPI.update<JobSeeker>('job-seeker', id, data);
  }

  /**
   * 구직 신청 삭제
   */
  static async delete(id: number): Promise<void> {
    return CommunityAPI.delete('job-seeker', id);
  }

  /**
   * 구직자 좋아요
   */
  static async toggleLike(id: number): Promise<{ liked: boolean; likes: number }> {
    return CommunityAPI.toggleLike('job-seeker', id);
  }

  /**
   * 구직자 조회수 증가
   */
  static async incrementView(id: number): Promise<{ view_count: number }> {
    return CommunityAPI.incrementView('job-seeker', id);
  }

  /**
   * 사역 분야별 구직자 조회
   */
  static async getByMinistryField(
    ministryField: string,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobSeeker>> {
    return this.getList({ ...options, ministry_field: ministryField } as any);
  }

  /**
   * 경력별 구직자 조회
   */
  static async getByExperience(
    experienceLevel: string,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobSeeker>> {
    return this.getList({ ...options, experience_level: experienceLevel } as any);
  }

  /**
   * 내 구직 신청 조회
   */
  static async getMyApplications(
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobSeeker>> {
    return CommunityAPI.getMyPosts<JobSeeker>('job-seeker', options);
  }

  /**
   * 구직자 검색
   */
  static async search(
    query: string,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobSeeker>> {
    return CommunityAPI.search<JobSeeker>('job-seeker', query, options);
  }
}

/**
 * 구인/구직 매칭 API 서비스
 */
export class JobMatchingAPI {
  /**
   * 구인 공고에 맞는 구직자 추천
   */
  static async getRecommendedSeekers(
    jobPostId: number,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobSeeker & { matchScore: number }>> {
    try {
      const response = await CommunityAPI.getList<JobSeeker & { matchScore: number }>(
        'job-seeker',
        { ...options, job_post_id: jobPostId } as any
      );
      return response;
    } catch (error) {
      console.error('추천 구직자 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 구직자에게 맞는 구인 공고 추천
   */
  static async getRecommendedJobs(
    seekerId: number,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobPost & { matchScore: number }>> {
    try {
      const response = await CommunityAPI.getList<JobPost & { matchScore: number }>(
        'job-post',
        { ...options, seeker_id: seekerId } as any
      );
      return response;
    } catch (error) {
      console.error('추천 구인 공고 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 매칭 점수 계산
   */
  static calculateMatchScore(jobPost: JobPost, seeker: JobSeeker): number {
    let score = 0;

    // 사역 분야 매칭 (40점)
    if (seeker.ministry_field.includes(jobPost.position)) {
      score += 40;
    }

    // 위치 매칭 (20점)
    if (seeker.preferred_location.includes(jobPost.location)) {
      score += 20;
    }

    // 고용 형태 매칭 (20점)
    if (seeker.availability === jobPost.employment_type) {
      score += 20;
    }

    // 교회 타입 매칭 (20점)
    if (jobPost.company_name && seeker.career.includes('교회')) {
      score += 20;
    }

    return Math.min(score, 100);
  }
}

/**
 * 지원 관리 API 서비스
 */
export class JobApplicationAPI {
  /**
   * 지원 신청
   */
  static async apply(data: {
    job_post_id: number;
    seeker_id: number;
    cover_letter?: string;
    resume_url?: string;
  }): Promise<StandardSingleResponse<JobApplication>> {
    try {
      const response = await CommunityAPI.create<JobApplication>('job-post', {
        ...data,
        action: 'apply'
      });
      return response;
    } catch (error) {
      console.error('지원 신청 실패:', error);
      throw error;
    }
  }

  /**
   * 지원 취소
   */
  static async cancel(applicationId: number): Promise<void> {
    try {
      await CommunityAPI.delete('job-post', applicationId);
    } catch (error) {
      console.error('지원 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 지원 상태 변경
   */
  static async updateStatus(
    applicationId: number,
    status: ApplicationStatus
  ): Promise<StandardSingleResponse<JobApplication>> {
    try {
      const response = await CommunityAPI.update<JobApplication>('job-post', applicationId, {
        status,
        action: 'update_status'
      });
      return response;
    } catch (error) {
      console.error('지원 상태 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 구인 공고의 지원자 목록 조회
   */
  static async getApplicationsByJobPost(
    jobPostId: number,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobApplication>> {
    try {
      const response = await CommunityAPI.getList<JobApplication>('job-post', {
        ...options,
        job_post_id: jobPostId,
        type: 'applications'
      } as any);
      return response;
    } catch (error) {
      console.error('지원자 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 구직자의 지원 내역 조회
   */
  static async getApplicationsBySeeker(
    seekerId: number,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<JobApplication>> {
    try {
      const response = await CommunityAPI.getList<JobApplication>('job-seeker', {
        ...options,
        seeker_id: seekerId,
        type: 'applications'
      } as any);
      return response;
    } catch (error) {
      console.error('지원 내역 조회 실패:', error);
      throw error;
    }
  }
}

/**
 * 통합 구인/구직 API 서비스
 */
export class JobIntegratedAPI {
  // 개별 API 서비스들을 속성으로 노출
  static jobPost = JobPostAPI;
  static seeker = JobSeekerAPI;
  static matching = JobMatchingAPI;
  static application = JobApplicationAPI;

  /**
   * 구인/구직 통계 조회
   */
  static async getStatistics(): Promise<{
    total_job_posts: number;
    total_seekers: number;
    active_job_posts: number;
    active_seekers: number;
    total_applications: number;
    total_matches: number;
  }> {
    try {
      const [jobPostStats, seekerStats] = await Promise.all([
        JobPostAPI.getList({ limit: 1 }),
        JobSeekerAPI.getList({ limit: 1 })
      ]);

      return {
        total_job_posts: jobPostStats.pagination.total_count,
        total_seekers: seekerStats.pagination.total_count,
        active_job_posts: jobPostStats.pagination.total_count, // 임시
        active_seekers: seekerStats.pagination.total_count, // 임시
        total_applications: 0, // TODO: 실제 API 구현 필요
        total_matches: 0 // TODO: 실제 API 구현 필요
      };
    } catch (error) {
      console.error('구인/구직 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 전체 검색 (구인 공고 + 구직자)
   */
  static async searchAll(
    query: string,
    options: ApiRequestOptions = {}
  ): Promise<{
    jobPosts: StandardListResponse<JobPost>;
    seekers: StandardListResponse<JobSeeker>;
  }> {
    try {
      const [jobPosts, seekers] = await Promise.all([
        JobPostAPI.search(query, options),
        JobSeekerAPI.search(query, options)
      ]);

      return { jobPosts, seekers };
    } catch (error) {
      console.error('구인/구직 통합 검색 실패:', error);
      throw error;
    }
  }
}