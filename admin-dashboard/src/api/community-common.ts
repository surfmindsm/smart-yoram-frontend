/**
 * 커뮤니티 공통 API 함수들
 *
 * @description 모든 커뮤니티 API에서 공통으로 사용하는 함수들을 제공합니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

import { api, getApiUrl } from '../services/api';
import {
  StandardListResponse,
  StandardSingleResponse,
  ApiErrorResponse,
  ApiRequestOptions,
  CommunityBasePost,
  CommunityModule
} from '../types';

// API 엔드포인트 매핑
export const COMMUNITY_ENDPOINTS: Record<CommunityModule, string> = {
  'sharing': '/community/sharing',
  'request': '/community/item-request',
  'offer': '/community/item-sale',
  'job-post': '/community/job-posting',
  'job-seeker': '/community/job-seeking',
  'music-recruitment': '/community/music-team-recruitments',
  'music-seeker': '/music-team-seekers',
  'church-event': '/community/church-events',
  'church-news': '/community/church-news'
};

/**
 * 공통 API 응답 처리 함수
 */
export const handleApiResponse = <T>(response: any, operation: string): T => {
  console.log(`🔍 ${operation} API 응답:`, response);

  // 표준 응답 구조 확인: { success: boolean, data: any, pagination?: any }
  if (response.data?.success === true) {
    console.log(`✅ ${operation} 성공 (표준 응답)`);
    return response.data.data || response.data;
  }
  // 하위 호환성을 위한 HTTP 상태 코드 체크
  else if (response.status === 200 || response.status === 201) {
    console.log(`✅ ${operation} 성공 (HTTP 상태 코드)`);
    return response.data?.data || response.data;
  }
  // 명시적 실패 응답
  else if (response.data?.success === false) {
    const errorMessage = response.data.message || '알 수 없는 오류가 발생했습니다.';
    console.error(`❌ ${operation} 실패 (서버 오류):`, response.data);
    throw new Error(errorMessage);
  }
  // 예상치 못한 응답 구조
  else {
    console.error(`❌ ${operation} 실패 - 응답 구조가 예상과 다름:`, response.data);
    throw new Error(`${operation}에 실패했습니다.`);
  }
};

/**
 * 공통 오류 처리 함수
 */
export const handleApiError = (error: any, operation: string): never => {
  console.group(`❌ ${operation} 실패`);
  console.error('전체 에러 객체:', error);
  console.error('에러 메시지:', error.message);
  console.error('에러 응답 데이터:', error.response?.data);
  console.error('에러 상태 코드:', error.response?.status);

  // 표준 오류 응답 처리
  if (error.response?.data?.success === false) {
    const apiError = error.response.data as ApiErrorResponse;
    console.error('API 오류 상세:', apiError);
  }

  console.groupEnd();
  throw error;
};

/**
 * 쿼리 매개변수 생성 함수
 */
export const buildQueryParams = (options: ApiRequestOptions = {}): URLSearchParams => {
  const params = new URLSearchParams();

  // 페이지네이션 매개변수
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.sort) params.append('sort', options.sort);

  // 필터 매개변수
  if (options.status && options.status !== 'all') params.append('status', options.status);
  if (options.category && options.category !== 'all') params.append('category', options.category);
  if (options.search) params.append('search', options.search);
  if (options.author_id) params.append('author_id', options.author_id.toString());
  if (options.church_id) params.append('church_id', options.church_id.toString());
  if (options.date_from) params.append('date_from', options.date_from);
  if (options.date_to) params.append('date_to', options.date_to);

  return params;
};

/**
 * 공통 API 클래스
 */
export class CommunityAPI {
  /**
   * 목록 조회
   */
  static async getList<T>(
    module: CommunityModule,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<T>> {
    try {
      const endpoint = COMMUNITY_ENDPOINTS[module];
      const params = buildQueryParams(options);
      const url = `${getApiUrl(endpoint)}?${params}`;

      console.log(`📋 ${module} 목록 조회:`, url);
      const response = await api.get(url);

      return handleApiResponse<StandardListResponse<T>>(response, `${module} 목록 조회`);
    } catch (error: any) {
      return handleApiError(error, `${module} 목록 조회`);
    }
  }

  /**
   * 상세 조회
   */
  static async getDetail<T>(
    module: CommunityModule,
    id: number
  ): Promise<StandardSingleResponse<T>> {
    try {
      const endpoint = COMMUNITY_ENDPOINTS[module];
      const url = getApiUrl(`${endpoint}/${id}`);

      console.log(`📄 ${module} 상세 조회:`, url);
      const response = await api.get(url);

      return handleApiResponse<StandardSingleResponse<T>>(response, `${module} 상세 조회`);
    } catch (error: any) {
      return handleApiError(error, `${module} 상세 조회`);
    }
  }

  /**
   * 생성
   */
  static async create<T>(
    module: CommunityModule,
    data: any
  ): Promise<StandardSingleResponse<T>> {
    try {
      const endpoint = COMMUNITY_ENDPOINTS[module];
      const url = getApiUrl(endpoint);

      console.log(`📝 ${module} 생성:`, url, data);
      const response = await api.post(url, data);

      return handleApiResponse<StandardSingleResponse<T>>(response, `${module} 생성`);
    } catch (error: any) {
      return handleApiError(error, `${module} 생성`);
    }
  }

  /**
   * 수정
   */
  static async update<T>(
    module: CommunityModule,
    id: number,
    data: any
  ): Promise<StandardSingleResponse<T>> {
    try {
      const endpoint = COMMUNITY_ENDPOINTS[module];
      const url = getApiUrl(`${endpoint}/${id}`);

      console.log(`📝 ${module} 수정:`, url, data);
      const response = await api.put(url, data);

      return handleApiResponse<StandardSingleResponse<T>>(response, `${module} 수정`);
    } catch (error: any) {
      return handleApiError(error, `${module} 수정`);
    }
  }

  /**
   * 삭제
   */
  static async delete(
    module: CommunityModule,
    id: number
  ): Promise<void> {
    try {
      const endpoint = COMMUNITY_ENDPOINTS[module];
      const url = getApiUrl(`${endpoint}/${id}`);

      console.log(`🗑️ ${module} 삭제:`, url);
      await api.delete(url);

      console.log(`✅ ${module} 삭제 성공`);
    } catch (error: any) {
      return handleApiError(error, `${module} 삭제`);
    }
  }

  /**
   * 좋아요 토글
   */
  static async toggleLike(
    module: CommunityModule,
    id: number
  ): Promise<{ liked: boolean; likes: number }> {
    try {
      const endpoint = COMMUNITY_ENDPOINTS[module];
      const url = getApiUrl(`${endpoint}/${id}/like`);

      console.log(`❤️ ${module} 좋아요 토글:`, url);
      const response = await api.post(url);

      return handleApiResponse<{ liked: boolean; likes: number }>(response, `${module} 좋아요`);
    } catch (error: any) {
      return handleApiError(error, `${module} 좋아요`);
    }
  }

  /**
   * 조회수 증가
   */
  static async incrementView(
    module: CommunityModule,
    id: number
  ): Promise<{ view_count: number }> {
    try {
      const endpoint = COMMUNITY_ENDPOINTS[module];
      const url = getApiUrl(`${endpoint}/${id}/view`);

      console.log(`👀 ${module} 조회수 증가:`, url);
      const response = await api.post(url);

      return handleApiResponse<{ view_count: number }>(response, `${module} 조회수 증가`);
    } catch (error: any) {
      return handleApiError(error, `${module} 조회수 증가`);
    }
  }

  /**
   * 검색 (전체 텍스트 검색)
   */
  static async search<T>(
    module: CommunityModule,
    query: string,
    options: Omit<ApiRequestOptions, 'search'> = {}
  ): Promise<StandardListResponse<T>> {
    return this.getList<T>(module, { ...options, search: query });
  }

  /**
   * 내가 작성한 게시글 조회
   */
  static async getMyPosts<T>(
    module: CommunityModule,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<T>> {
    try {
      const endpoint = COMMUNITY_ENDPOINTS[module];
      const params = buildQueryParams({ ...options, author_id: options.author_id });
      const url = `${getApiUrl(`${endpoint}/my`)}?${params}`;

      console.log(`👤 내 ${module} 게시글 조회:`, url);
      const response = await api.get(url);

      return handleApiResponse<StandardListResponse<T>>(response, `내 ${module} 게시글 조회`);
    } catch (error: any) {
      return handleApiError(error, `내 ${module} 게시글 조회`);
    }
  }

  /**
   * 파일 업로드
   */
  static async uploadFiles(
    files: File[]
  ): Promise<{ urls: string[] }> {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const url = getApiUrl('/upload/community');

      console.log(`📁 파일 업로드:`, url, files);
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return handleApiResponse<{ urls: string[] }>(response, '파일 업로드');
    } catch (error: any) {
      return handleApiError(error, '파일 업로드');
    }
  }
}

/**
 * 타입 가드 함수들
 */
export const isStandardListResponse = <T>(data: any): data is StandardListResponse<T> => {
  return data &&
    typeof data.success === 'boolean' &&
    Array.isArray(data.data) &&
    data.pagination &&
    typeof data.pagination.current_page === 'number';
};

export const isStandardSingleResponse = <T>(data: any): data is StandardSingleResponse<T> => {
  return data &&
    typeof data.success === 'boolean' &&
    data.data !== undefined;
};

export const isApiErrorResponse = (data: any): data is ApiErrorResponse => {
  return data &&
    data.success === false &&
    typeof data.error === 'string' &&
    typeof data.message === 'string';
};

/**
 * 응답 데이터 정규화 함수
 */
export const normalizeResponse = <T>(response: any): StandardSingleResponse<T> | StandardListResponse<T> => {
  if (isStandardListResponse<T>(response) || isStandardSingleResponse<T>(response)) {
    return response;
  }

  // 레거시 응답 구조를 표준으로 변환
  if (Array.isArray(response)) {
    return {
      success: true,
      data: response,
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_count: response.length,
        per_page: response.length,
        has_next: false,
        has_prev: false
      }
    };
  }

  return {
    success: true,
    data: response
  };
};

// Re-export types for convenience
export type { StandardListResponse, StandardSingleResponse };