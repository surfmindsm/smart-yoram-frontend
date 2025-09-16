/**
 * 커뮤니티 공통 타입 정의
 *
 * @description 모든 커뮤니티 API에서 사용하는 공통 타입들을 정의합니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

// 커뮤니티 표준 상태값
export type CommunityStatus = "active" | "completed" | "cancelled" | "paused";

// 표준 페이지네이션 인터페이스
export interface StandardPagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// 표준 목록 응답 인터페이스
export interface StandardListResponse<T> {
  success: boolean;
  data: T[];
  pagination: StandardPagination;
}

// 표준 단일 응답 인터페이스
export interface StandardSingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 커뮤니티 기본 게시글 인터페이스
export interface CommunityBasePost {
  id: number;
  title: string;
  description?: string;
  status: CommunityStatus;
  author_id: number;
  author_name: string;
  church_id?: number;
  church_name?: string | null;
  view_count: number;
  likes: number;
  comments?: number;
  created_at: string;
  updated_at?: string;
}

// 연락처 정보 인터페이스
export interface ContactInfo {
  contact_phone: string;
  contact_email?: string;
  contact_method?: "phone" | "email" | "both";
  contact_info?: string; // 하위호환용 (읽기전용)
}

// 위치 정보 인터페이스
export interface LocationInfo {
  location: string;
  detailed_location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// 이미지 정보 인터페이스
export interface ImageInfo {
  images: string[];
  thumbnail?: string;
}

// 카테고리 정보 인터페이스
export interface CategoryInfo {
  category: string;
  subcategory?: string;
}

// 날짜 관련 인터페이스
export interface DateInfo {
  start_date?: string;
  end_date?: string;
  deadline?: string;
}

// API 에러 응답 인터페이스
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
}

// 커뮤니티 통계 인터페이스
export interface CommunityStats {
  total_posts: number;
  active_sharing: number;
  active_requests: number;
  job_posts: number;
  music_teams: number;
  events_this_month: number;
  total_members: number;
}

// 필터 옵션 인터페이스
export interface FilterOptions {
  status?: CommunityStatus | 'all';
  category?: string | 'all';
  search?: string;
  author_id?: number;
  church_id?: number;
  date_from?: string;
  date_to?: string;
}

// 정렬 옵션 타입
export type SortOption = 'latest' | 'oldest' | 'most_viewed' | 'most_liked' | 'title_asc' | 'title_desc';

// 페이지네이션 옵션 인터페이스
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: SortOption;
}

// API 요청 옵션 인터페이스 (필터 + 페이지네이션)
export interface ApiRequestOptions extends FilterOptions, PaginationOptions {}

// 상태 매핑 함수 타입
export type StatusMappingFunction = (legacyStatus: string) => CommunityStatus;

// 데이터 변환 함수 타입
export type DataTransformFunction<T, U> = (backendData: T) => U;