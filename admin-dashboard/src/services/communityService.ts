import { api, getApiUrl, userService, authService } from './api';
import { formatCreatedAt } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { supabaseApiService } from './supabaseApiService';
import { supabaseAuthService } from './supabaseAuthService';
import { formatDisplayLocation } from '../data/koreaLocations';

// 표준 페이지네이션 타입 (마이그레이션 가이드 준수)
export interface StandardPagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// 표준 목록 응답 타입
export interface StandardListResponse<T> {
  success: boolean;
  data: T[];
  pagination: StandardPagination;
}

// 교회 ID를 교회명으로 매핑하는 캐시
const churchesCache: { [key: number]: string } = {};
let churchesCacheLoaded = false;

// 모든 교회 정보를 미리 로드
const loadChurchesCache = async () => {
  if (churchesCacheLoaded) return;

  try {
    const { data: churches, error } = await supabaseApiService.supabase
      .from('churches')
      .select('id, name');

    if (churches && !error) {
      churches.forEach((church: any) => {
        if (church.id && church.name) {
          churchesCache[church.id] = church.name;
        }
      });
      churchesCacheLoaded = true;
      console.log('✅ 교회 캐시 로드 완료:', Object.keys(churchesCache).length, '개');
    }
  } catch (error) {
    console.error('❌ 교회 캐시 로드 실패:', error);
  }
};

// 앱 시작 시 교회 캐시 로드
loadChurchesCache();

const getChurchNameById = (churchId: number): string | null => {
  if (churchId === 9998) return null; // 협력사

  // 캐시에서 조회
  return churchesCache[churchId] || null;
};

// 사용자 데이터 캐시
let usersCache: any[] | null = null;
let usersCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 사용자 ID로 사용자명을 조회하는 함수 (API 호출)
const getUserNameById = async (authorId: number): Promise<string | null> => {
  try {
    // 캐시가 있고 유효하면 캐시 사용
    const now = Date.now();
    if (usersCache && (now - usersCacheTime) < CACHE_DURATION) {
      // console.log('👥 캐시에서 사용자 조회:', authorId);
      const user = usersCache.find(u => u.id === authorId);
      return user ? (user.full_name || user.name || user.username || user.email || `사용자${authorId}`) : null;
    }

    // Users API 직접 호출해서 구조 확인
    // console.log('👥 Users API 직접 호출 중...');
    try {
      const response = await api.get(getApiUrl('/users/'));
      // console.log('👥 Users API 응답 전체:', response);
      // console.log('👥 Users API 응답 데이터:', response.data);

      if (response.data && Array.isArray(response.data)) {
        usersCache = response.data;
        usersCacheTime = now;

        // console.log('👥 사용자 목록 샘플:', response.data.slice(0, 3));
        const user = usersCache.find((u: any) => u.id === authorId);
        // console.log(`👥 authorId ${authorId}에 해당하는 사용자:`, user);

        return user ? (user.full_name || user.name || user.username || user.email || `사용자${authorId}`) : null;
      }
    } catch (apiError: any) {
      console.error('👥 Users API 호출 실패 (403 등):', apiError.response?.status, apiError.message);

      // 403인 경우 Supabase members 시도
      if (apiError.response?.status === 403) {
        // console.log('👥 403 에러로 Supabase members 시도...');
        const { supabaseApiService } = await import('./supabaseApiService');
        const membersResponse = await supabaseApiService.members.getAll();
        // console.log('👥 Supabase members 응답:', membersResponse);

        if (membersResponse && Array.isArray(membersResponse.data)) {
          usersCache = membersResponse.data;
          usersCacheTime = now;

          const user = usersCache.find((u: any) => u.id === authorId);
          // console.log(`👥 Supabase에서 authorId ${authorId}에 해당하는 사용자:`, user);
          return user ? (user.full_name || user.name || user.username || user.email || `사용자${authorId}`) : null;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('👥 전체 사용자 조회 실패:', error);
    return null;
  }
};

// 공통 API 응답 처리 함수 (마이그레이션 가이드 준수)
const handleApiResponse = (response: any, operation: string) => {
  // console.log(`🔍 ${operation} API 응답 전체:`, response);
  // console.log(`🔍 ${operation} API 응답 데이터:`, response.data);
  // console.log(`🔍 ${operation} API 응답 상태:`, response.status);
  // console.log(`🔍 success 필드:`, response.data?.success);

  // 표준 응답 구조 확인: { success: boolean, data: any, pagination?: any }
  if (response.data?.success === true) {
    // console.log(`✅ ${operation} 성공 (표준 응답)`);
    return response.data.data || response.data;
  }
  // 하위 호환성을 위한 HTTP 상태 코드 체크
  else if (response.status === 200 || response.status === 201) {
    // console.log(`✅ ${operation} 성공 (HTTP 상태 코드)`);
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

// 공통 오류 처리 함수 (마이그레이션 가이드 준수)
const handleApiError = (error: any, operation: string): never => {
  console.group(`❌ ${operation} 실패`);
  console.error('전체 에러 객체:', error);
  console.error('에러 메시지:', error.message);
  console.error('에러 응답 데이터:', error.response?.data);
  console.error('에러 상태 코드:', error.response?.status);

  // 표준 오류 응답 처리: { success: false, error: string, message: string, details?: any }
  if (error.response?.data?.success === false) {
    const errorInfo = error.response.data;
    console.error(`❌ 서버 오류 (${errorInfo.error || 'UNKNOWN_ERROR'}):`, errorInfo.message);
    if (errorInfo.details) {
      console.error('오류 상세 정보:', errorInfo.details);
    }
    throw new Error(errorInfo.message || '서버에서 오류가 발생했습니다.');
  }
  console.error('에러 헤더:', error.response?.headers);
  console.error('요청 URL:', error.config?.url);
  console.error('요청 메서드:', error.config?.method);
  console.error('요청 데이터:', error.config?.data);

  // 422 Validation Error의 경우 상세 정보 출력
  if (error.response?.status === 422) {
    console.group(`🔍 ${operation} Validation 오류 상세`);
    console.error('Validation 오류 전체:', error.response.data);
    if (error.response.data?.detail) {
      console.error('Validation 오류 필드별 상세:', error.response.data.detail);
      // 각 필드별 오류를 개별적으로 출력
      if (Array.isArray(error.response.data.detail)) {
        error.response.data.detail.forEach((detail: any, index: number) => {
          console.error(`필드 ${index + 1} 오류:`, detail);
        });
      }
    }
    console.groupEnd();
  }
  console.groupEnd();

  throw error;
};

// 공통 데이터 정리 함수
const cleanApiData = (data: any) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === null || cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

// 연락처 정보 분리 함수
const parseContactInfo = (contactInfo: string): { phone?: string; email?: string } => {
  if (!contactInfo || typeof contactInfo !== 'string') {
    return {};
  }

  const phoneRegex = /(\d{2,3}-\d{3,4}-\d{4}|\d{10,11})/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  const phoneMatch = contactInfo.match(phoneRegex);
  const emailMatch = contactInfo.match(emailRegex);

  return {
    phone: phoneMatch ? phoneMatch[0] : undefined,
    email: emailMatch ? emailMatch[0] : undefined
  };
};

// JSON 배열 파싱 개선 함수
const parseJsonArray = (value: any, fallback: any[] = []): any[] => {
  // 이미 배열인 경우
  if (Array.isArray(value)) {
    return value;
  }

  // 문자열인 경우 JSON 파싱 시도
  if (typeof value === 'string') {
    // 빈 문자열이나 null/undefined 문자열 처리
    if (!value || value === 'null' || value === 'undefined') {
      return fallback;
    }

    try {
      const parsed = JSON.parse(value);
      // 파싱된 결과가 배열인지 확인
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // 파싱된 결과가 배열이 아니면 배열로 감싸기
      return [parsed];
    } catch (error) {
      // console.warn(`JSON 배열 파싱 실패: ${value}`, error);
      // 파싱 실패 시 문자열을 쉼표로 분할하여 배열로 만들기
      const splitResult = value.split(',').map(item => item.trim()).filter(item => item);
      return splitResult.length > 0 ? splitResult : fallback;
    }
  }

  // null, undefined 등인 경우
  if (value === null || value === undefined) {
    return fallback;
  }

  // 기타 타입인 경우 배열로 감싸기
  return [value];
};

// 필드 길이 검증 및 제한 함수
const validateAndTrimField = (value: any, maxLength: number, fieldName?: string): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (stringValue.length > maxLength) {
    if (fieldName) {
      // console.warn(`${fieldName} 필드가 최대 길이(${maxLength}자)를 초과하여 잘림: ${stringValue.length}자 -> ${maxLength}자`);
    }
    return stringValue.substring(0, maxLength);
  }

  return stringValue;
};

// 커뮤니티 필드 길이 제한 상수
const FIELD_LIMITS = {
  TITLE: 100,
  DESCRIPTION: 1000,
  SHORT_TEXT: 50,
  MEDIUM_TEXT: 200,
  LONG_TEXT: 500,
  CONTACT_INFO: 100,
  LOCATION: 100,
  NAME: 50,
  EMAIL: 100,
  PHONE: 20,
  CATEGORY: 30,
  REASON: 500,
  EXPERIENCE: 1000,
  PORTFOLIO: 1000,
  PORTFOLIO_FILE: 50000000, // 50MB for Base64 encoded files
  INTRODUCTION: 1000
} as const;


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

// 교회 행사 소식 인터페이스
export interface ChurchNews {
  id: number;
  title: string;
  content: string;
  category: string;
  priority?: 'urgent' | 'important' | 'normal';
  isUrgent?: boolean;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  organizer?: string;
  attachments?: any[];
  targetAudience?: string;
  participationFee?: string;
  registrationMethod?: string;
  registrationRequired?: boolean;
  registrationDeadline?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  additionalInfo?: string;
  status?: 'active' | 'completed' | 'cancelled';
  view_count?: number;
  viewCount?: number;
  likes?: number;
  comments?: number;
  tags?: string[];
  imageUrls?: string[];
  images?: string[];
  userName?: string;
  user_name?: string;
  author?: string;
  authorId?: number;
  author_id?: number;
  authorName?: string;
  author_name?: string;
  churchId?: number;
  church_id?: number;
  churchName?: string;
  church_name?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  description?: string;
  event_date?: string;
  event_time?: string;
}

// 무료 나눔 관련 인터페이스
export interface SharingItem {
  id: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  quantity: number;
  images: string[];
  church: string | null; // null 허용으로 변경 (9998 교회 처리를 위함)
  church_id?: number; // 교회 ID 필드 추가
  location: string;
  province?: string | null; // 도/시
  district?: string | null; // 시/군/구
  deliveryAvailable?: boolean; // 택배 가능 여부
  contactPhone?: string; // 연락처 전화번호
  contactEmail?: string; // 연락처 이메일
  contactInfo?: string; // 기존 필드 (호환성 유지)
  status: 'available' | 'reserved' | 'completed';
  createdAt: string;
  view_count: number;
  likes: number;
  comments: number;
  userName?: string; // 사용자명 필드 추가
}

// 물품 요청 관련 인터페이스
export interface RequestItem {
  id: number;
  title: string;
  description: string;
  category: string;
  requestedItem?: string;
  quantity?: number;
  reason?: string;
  neededDate?: string;
  church: string | null;
  church_id?: number; // 교회 ID 필드 추가
  location: string;
  province?: string | null; // 도/시
  district?: string | null; // 시/군/구
  deliveryAvailable?: boolean; // 택배 가능 여부
  contactPhone?: string; // 연락처 전화번호
  contactEmail?: string; // 연락처 이메일
  contactInfo?: string; // 기존 필드 (호환성 유지)
  status: 'requesting' | 'matching' | 'completed' | 'active';
  createdAt: string;
  view_count: number;
  likes: number;
  comments: number;
  urgency: 'low' | 'medium' | 'high' | 'normal'; // 백엔드 호환성을 위해 normal 추가
  userName?: string; // 사용자명 필드 추가
  rewardType?: string; // 보상 타입
  rewardAmount?: number; // 보상 금액
  images?: string[]; // 이미지 배열
}

// 물품 판매 관련 인터페이스 (구 물품 판매)
export interface OfferItem {
  id: number;
  title: string;
  itemName: string;
  category: string;
  condition: string;
  quantity: number;
  price?: number; // 판매가격 필드 추가
  description: string;
  church: string | null;
  location: string;
  province?: string | null; // 도/시
  district?: string | null; // 시/군/구
  deliveryAvailable?: boolean; // 택배 가능 여부
  deliveryMethod: string;
  status: 'available' | 'reserved' | 'completed';
  createdAt: string;
  view_count: number;
  likes: number;
  comments: number;
  userName?: string; // 사용자명 필드 추가
  images?: string[]; // 이미지 필드 추가
  contactPhone?: string; // 연락처 전화번호
  contactEmail?: string; // 연락처 이메일
  contactInfo?: string; // 기존 필드 (호환성 유지)
}

// 구인 공고 관련 인터페이스
export interface JobPost {
  id: number;
  title: string;
  description?: string; // 상세 설명 필드 추가
  churchName: string | null;
  churchIntro: string;
  position: string;
  jobType: 'full-time' | 'part-time' | 'volunteer';
  salary: string;
  benefits: string[];
  qualifications: string[];
  requiredDocuments: string[];
  location: string;
  deadline: string;
  applicationDeadline?: string;
  status: 'open' | 'closed';
  createdAt: string;
  view_count: number;
  likes: number;
  comments?: number;
  applications: number;
  contactPhone?: string; // 연락처 전화번호
  contactEmail?: string; // 연락처 이메일
  contactInfo?: string; // 기존 필드 (호환성 유지)
  userName?: string; // 사용자명 필드 추가
  company?: string; // 회사명 필드 추가
  church?: string; // 교회명 필드 추가
}

// 구직 신청 관련 인터페이스
export interface JobSeeker {
  id: number;
  title: string;
  name: string;
  ministryField: string[];
  career: string;
  education: string;
  certifications: string[];
  introduction: string;
  preferredLocation: string[];
  availability: string;
  status: 'active' | 'inactive';
  createdAt: string;
  view_count: number;
  likes: number;
  matches: number;
  userName?: string; // 사용자명 필드 추가
  church?: string | null; // 교회명 필드 추가
}

// 음악팀 모집 관련 인터페이스
export interface MusicRecruitment {
  id: number;
  title: string;
  church_name: string;
  recruitment_type: string;
  worship_type: string; // 예배 형태 필드 (주일예배, 수요예배 등)
  team_types: string[]; // 팀 형태 필드 (찬양팀, 워십팀 등) - JSONB 배열
  schedule?: string;
  location?: string;
  description?: string;
  requirements?: string;
  compensation?: string;
  contact_phone: string;
  contact_email?: string;
  contact_info?: string; // 백워드 호환성
  status: string;
  applications: number;
  view_count: number;
  likes: number;
  created_at: string;
  createdAt: string; // camelCase 변환용 - component compatibility
  updated_at?: string;
  author_id: number;
  author_name: string;
  church_id: number;
  userName?: string; // 사용자명 필드 추가 (camelCase 버전)
}

// 음악팀 참여 관련 인터페이스
export interface MusicSeeker {
  id: number;
  title: string;
  name: string;                    // author_name 매핑
  teamName?: string;               // team_name 매핑 (새 필드)
  instrument: string;              // 팀 형태 (단일 선택으로 변경)
  instruments?: string[];          // 호환성을 위해 유지
  experience: string;
  portfolio: string;
  portfolioFile?: string;          // 포트폴리오 파일 (Base64 또는 URL)
  preferredGenre?: string[];       // 제거되었지만 호환성을 위해 optional로 유지
  preferredLocation: string[];     // 배열 타입
  availability?: string;           // 기존 호환성
  availableDays: string[];         // 새로 추가된 필드
  availableTime?: string;          // 새로 추가된 필드
  contactPhone: string;            // contact_phone 매핑
  contactEmail?: string;           // contact_email 매핑
  status: 'available' | 'interviewing' | 'inactive';
  createdAt: string | null;
  created_at?: string;             // 백엔드 호환성
  view_count: number;
  likes: number;
  matches: number;
  applications?: number;           // 지원/문의 건수
  userName?: string;               // 사용자명 필드 추가
  author_name?: string;            // 백엔드 호환성
  authorName?: string;             // camelCase 버전
  church?: string | null;          // 교회명 필드 추가
  church_name?: string | null;     // 백엔드 호환성
  churchName?: string;             // camelCase 버전
  location?: string;               // 지역 정보
  contact_phone?: string;          // 연락처 (snake_case)
  introduction?: string;           // 자기소개
}

// 교회 행사 관련 인터페이스
export interface ChurchEvent {
  id: number;
  title: string;
  description: string;
  eventType: string;
  church: string | null;
  location: string;
  startDate: string;
  endDate: string;
  registrationRequired: boolean;
  capacity: number;
  currentParticipants: number;
  contactPhone?: string; // 연락처 전화번호
  contactEmail?: string; // 연락처 이메일
  contact?: string; // 기존 필드 (호환성 유지)
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  view_count: number;
  userName?: string; // 사용자명 필드 추가
  likes: number;
  registrations: number;
}

// 기도 요청 관련 인터페이스
export interface PrayerRequest {
  id: number;
  title: string;
  content: string;
  category: string;
  isPublic: boolean;
  church: string | null;
  requesterName: string;
  status: 'active' | 'answered' | 'closed';
  created_at: string;
  prayerCount: number;
  view_count: number;
}

// 최근 게시글 인터페이스
export interface RecentPost {
  id: number;
  type: 'sharing' | 'request' | 'offer' | 'job-posting' | 'job-seeking' | 'music-recruit' | 'music-seeking' | 'church-event' | 'prayer-request';
  title: string;
  church: string | null;
  location: string;
  createdAt: string;
  status: string;
}

// 데이터 변환 함수들
export const transformMusicSeekerFromBackend = (backendData: any): MusicSeeker => {
  return {
    id: backendData.id,
    title: backendData.title,
    name: backendData.author_name || '익명',
    teamName: backendData.team_name,
    instrument: backendData.instrument,
    instruments: backendData.instrument ? [backendData.instrument] : [], // 호환성
    experience: backendData.experience || '',
    portfolio: backendData.portfolio || '',
    preferredGenre: [], // 제거된 필드
    preferredLocation: parseJsonArray(backendData.preferred_location, []),
    availability: '', // 호환성
    availableDays: parseJsonArray(backendData.available_days, []),
    availableTime: backendData.available_time,
    contactPhone: backendData.contact_phone,
    contactEmail: backendData.contact_email,
    status: backendData.status || 'available',
    createdAt: backendData.created_at || '',
    view_count: backendData.view_count || 0,
    likes: backendData.likes || 0,
    matches: backendData.matches || 0,
    applications: backendData.applications || 0,
    userName: backendData.author_name || '익명',
    authorName: backendData.author_name,
    church: backendData.church_id === 9998 ? null : (backendData.church_name || backendData.church || getChurchNameById(backendData.church_id)),
    churchName: backendData.church_name,
    location: backendData.location,
    introduction: backendData.introduction,
    // Compatibility fields for backward compatibility
    created_at: backendData.created_at,
    author_name: backendData.author_name,
    church_name: backendData.church_name,
    contact_phone: backendData.contact_phone
  };
};

// 커뮤니티 서비스
export const communityService = {
  // 커뮤니티 홈 데이터
  getHomeStats: async (): Promise<CommunityStats> => {
    try {
      // console.log('🏠 커뮤니티 통계 Supabase Edge Function 호출 중...');
      const { supabaseApiService } = await import('./supabaseApiService');
      const { data, error } = await supabaseApiService.supabase.functions.invoke('community/stats', {
        method: 'GET'
      });

      if (error) {
        console.error('❌ 커뮤니티 통계 조회 실패:', error);
        throw error;
      }

      // console.log('✅ 커뮤니티 통계 Edge Function 응답:', data);

      // Edge Function 응답 구조가 { success: true, data: {...} } 형태인 경우 처리
      if (data?.success && data?.data) {
        return data.data;
      }

      return data;
    } catch (error: any) {
      console.error('❌ 커뮤니티 통계 조회 실패:', error);
      // Fallback mock data
      return {
        total_posts: 125,
        active_sharing: 23,
        active_requests: 15,
        job_posts: 8,
        music_teams: 5,
        events_this_month: 12,
        total_members: 1200
      };
    }
  },

  getRecentPosts: async (limit: number = 10): Promise<RecentPost[]> => {
    try {
      // console.log('📄 최근 게시글 Supabase Edge Function 호출 중...');
      const { supabaseApiService } = await import('./supabaseApiService');
      const { data, error } = await supabaseApiService.supabase.functions.invoke('community/recent-posts', {
        method: 'GET',
        body: JSON.stringify({ limit })
      });

      if (error) {
        console.error('❌ 최근 게시글 조회 실패:', error);
        throw error;
      }

      // console.log('✅ 최근 게시글 Edge Function 응답:', data);

      // Edge Function 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (data?.success && data?.data) {
        return data.data;
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ 최근 게시글 조회 실패:', error);
      // Fallback mock data
      return [
        {
          id: 1,
          type: 'sharing',
          title: '아이 옷 나눔합니다',
          status: '진행중',
          church: '소망교회',
          location: '서울 강남구',
          createdAt: '2시간 전'
        },
        {
          id: 2,
          type: 'request',
          title: '책상 하나 구해요',
          status: '요청중',
          church: '믿음교회',
          location: '서울 서초구',
          createdAt: '4시간 전'
        },
        {
          id: 3,
          type: 'job-posting',
          title: '주일학교 교사 모집',
          status: '모집중',
          church: '사랑교회',
          location: '서울 종로구',
          createdAt: '1일 전'
        }
      ];
    }
  },

  // 무료 나눔
  getSharingItems: async (params?: {
    category?: string;
    status?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<SharingItem[]> => {
    try {
      // Use Supabase Edge Function for sharing
      const queryParams = new URLSearchParams();
      queryParams.set('is_free', 'true'); // 무료 나눔만 조회
      if (params?.category && params.category !== 'all') queryParams.set('category', params.category);
      // status 파라미터는 무료나눔에서 사용하지 않음 (is_free=true만으로 충분)
      if (params?.search) queryParams.set('search', params.search);
      if (params?.skip) queryParams.set('skip', params.skip.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());

      // Supabase functions.invoke()가 쿼리 파라미터를 제대로 전달하지 못하므로 fetch 사용
      const functionName = 'community-sharing';
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      const fullUrl = `${supabaseUrl}/functions/v1/${functionName}?${queryParams.toString()}`;

      console.log('🔗 [무료나눔] Edge Function 호출 URL:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 무료나눔 조회 실패:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.success ? result.data : result;

      // Supabase functions.invoke()는 응답을 직접 파싱하므로
      // data가 배열이면 직접 사용, 객체면 data.data 사용
      let responseData = Array.isArray(data) ? data : (data?.data || []);

      // Edge Function 필터가 작동하지 않을 경우를 대비한 프론트엔드 필터링
      responseData = responseData.filter((item: any) => item.is_free === true);

      // community/sharing function returns object with data array
      if (responseData && Array.isArray(responseData)) {
        // N+1 쿼리 최적화: 모든 church_id와 author_id를 한 번에 조회
        const churchIds = Array.from(new Set(responseData
          .map((item: any) => item.church_id)
          .filter((id: number) => id && id !== 9998)));
        const authorIds = Array.from(new Set(responseData
          .map((item: any) => item.author_id)
          .filter(Boolean)));

        // 교회 정보 일괄 조회
        const churchMap = new Map<number, { name: string; address: string }>();
        if (churchIds.length > 0) {
          const { data: churches } = await supabaseApiService.supabase
            .from('churches')
            .select('id, name, address')
            .in('id', churchIds);

          if (churches) {
            churches.forEach(church => {
              churchMap.set(church.id, {
                name: church.name,
                address: church.address
              });
            });
          }
        }

        // 사용자 정보 일괄 조회
        const userMap = new Map<number, string>();
        if (authorIds.length > 0) {
          const { data: users } = await supabaseApiService.supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', authorIds);

          if (users) {
            users.forEach(user => {
              userMap.set(user.id, user.full_name || user.email || '익명');
            });
          }
        }

        // 백엔드 필드명을 프론트엔드 인터페이스에 맞게 변환 (캐시된 정보 활용)
        const transformedData = responseData.map((item: any): SharingItem => {
          // church_id 9998(협력사)인 경우 null 처리
          let churchName: string | null = null;
          let churchAddress = item.location || null;

          if (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') {
            churchName = null;
            churchAddress = '-';
          } else if (item.church_id) {
            const church = churchMap.get(item.church_id);
            if (church) {
              churchName = church.name || null;
              churchAddress = church.address || church.name || churchAddress;
            }
          } else {
            // church_name 필드가 있으면 사용
            churchName = item.church_name || item.church || null;
          }

          const churchId = (item.church_id === 9998) ? undefined : item.church_id;
          const userName = item.author_id ? (userMap.get(item.author_id) || '익명') : '익명';

          // 위치 정보 포맷팅
          const displayLocation = formatDisplayLocation({
            province: item.province,
            district: item.district,
            deliveryAvailable: item.delivery_available,
            churchAddress: churchAddress,
            location: item.location
          });

          return {
            id: item.id,
            title: item.title,
            description: item.description || item.content,
            category: item.category,
            condition: item.condition || '양호',
            quantity: item.quantity || 1,
            images: item.images || [],
            church: churchName,
            church_id: churchId,
            location: displayLocation,
            contactPhone: item.contact_phone || '',
            contactEmail: item.contact_email || '',
            contactInfo: item.contact_info || '',
            status: item.status,
            createdAt: item.created_at || item.createdAt || null,
            view_count: item.view_count || 0,
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: userName
          };
        });

        return transformedData;
      }

      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      // console.warn('예상치 못한 Supabase API 응답 구조:', data);
      return [];
    } catch (error: any) {
      console.error('❌ 무료 나눔 조회 실패 (Supabase API):', error);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  // 단일 무료 나눔 아이템 조회 (상세 페이지용)
  getSharingItemById: async (id: number): Promise<SharingItem | null> => {
    try {
      const functionName = 'community-sharing';
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      const fullUrl = `${supabaseUrl}/functions/v1/${functionName}?id=${id}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('❌ 무료나눔 상세 조회 실패:', response.status);
        return null;
      }

      const result = await response.json();

      // Edge Function이 배열을 반환하는 경우 처리 (캐시 문제)
      let item;
      if (Array.isArray(result)) {
        item = result.find((i: any) => i.id === id);
      } else {
        item = result.success ? result.data : result;
      }

      if (!item) return null;

      // church와 author 정보가 JOIN되어 있으므로 추가 조회 불필요
      const churchName = (item.church_id === 9998) ? null : (item.church?.name || item.church_name);
      const userName = item.author?.full_name || item.author?.email || item.author_name || item.user_name || '익명';

      return {
        id: item.id,
        title: item.title,
        description: item.description || item.content,
        category: item.category,
        condition: item.condition || '양호',
        quantity: item.quantity || 1,
        images: item.images || [],
        church: churchName,
        church_id: item.church_id === 9998 ? undefined : item.church_id,
        location: item.church?.address || item.location || null,
        contactPhone: item.contact_phone || '',
        contactEmail: item.contact_email || '',
        contactInfo: item.contact_info || '',
        status: item.status,
        createdAt: item.created_at || item.createdAt || null,
        view_count: item.view_count || 0,
        likes: item.likes || 0,
        comments: item.comments || 0,
        userName: userName
      };
    } catch (error: any) {
      console.error('❌ 무료 나눔 상세 조회 실패:', error);
      return null;
    }
  },

  createSharingItem: async (itemData: Partial<SharingItem>): Promise<SharingItem> => {
    try {
      // console.log('📝 무료 나눔 등록 API 호출 중...', itemData);

      // 현재 사용자 정보 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();

      if (!currentUser || !currentUser.user) {
        throw new Error('사용자 인증이 필요합니다.');
      }

      const userId = currentUser.user.id;
      const churchId = currentUser.profile?.church_id || 9998; // 기본값 9998

      // console.log('👤 현재 사용자 정보:', {
      //   userId,
      //   churchId,
      //   email: currentUser.user.email,
      //   profile: currentUser.profile
      // });

      // author_id는 정수여야 하므로 profile에서 ID를 가져오거나 변환
      let authorId = null;
      if (currentUser.profile?.id) {
        authorId = parseInt(currentUser.profile.id.toString());
      }

      // console.log('🔢 변환된 author_id:', authorId);

      // 필드 길이 검증 및 제한
      const validatedData = {
        ...itemData,
        title: validateAndTrimField(itemData.title, FIELD_LIMITS.TITLE, '제목'),
        description: validateAndTrimField(itemData.description, FIELD_LIMITS.DESCRIPTION, '설명'),
        category: validateAndTrimField(itemData.category, FIELD_LIMITS.CATEGORY, '카테고리'),
        location: validateAndTrimField(itemData.location, FIELD_LIMITS.LOCATION, '위치'),
        contactInfo: validateAndTrimField(itemData.contactInfo, FIELD_LIMITS.CONTACT_INFO, '연락처 정보')
      };

      // 연락처 필드 추출
      const contactPhone = (itemData as any).contact_phone || validatedData.contactPhone || (itemData as any).contactPhone || '';
      const contactEmail = (itemData as any).contact_email || validatedData.contactEmail || (itemData as any).contactEmail || '';

      // contact_info 생성: contact_phone과 contact_email 합치기
      let contactInfo = validatedData.contactInfo || (itemData as any).contact_info || '';
      if (!contactInfo && contactPhone) {
        contactInfo = contactPhone;
        if (contactEmail) {
          contactInfo += ` | ${contactEmail}`;
        }
      }

      // 백엔드 API에 맞게 필드명 변환 (snake_case)
      const backendData: any = {
        ...validatedData,
        is_free: true, // 무료나눔은 항상 true
        price: 0, // 무료나눔은 가격이 0
        contact_info: contactInfo,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        // 위치 정보 추가
        province: itemData.province || null,
        district: itemData.district || null,
        deliveryAvailable: itemData.deliveryAvailable || false,
        // 사용자 정보 추가
        church_id: churchId,
        author_id: authorId,
        status: 'active',
        // 기존 camelCase 필드 제거 (snake_case는 유지)
        contactInfo: undefined,
        contactPhone: undefined,
        contactEmail: undefined
      };

      console.log('📤 [무료나눔] 백엔드로 전송할 데이터:', backendData);
      console.log('📤 [무료나눔] is_free 값:', backendData.is_free, '타입:', typeof backendData.is_free);
      // console.log('📞 연락처 필드 확인:', {
      //   contact_phone: backendData.contact_phone,
      //   contact_email: backendData.contact_email,
      //   contact_info: backendData.contact_info
      // });
      const { data, error } = await supabaseApiService.supabase.functions.invoke('community/sharing', {
        method: 'POST',
        body: backendData
      });

      if (error) {
        console.error('❌ 무료나눔 등록 실패:', error);
        console.error('❌ 에러 전체:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ 무료 나눔 등록 API 응답:', data);
      return data;
    } catch (error: any) {
      console.error('❌ 무료 나눔 등록 실패 (catch):', error);
      console.error('❌ 에러 메시지:', error.message);
      console.error('❌ 에러 전체:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  updateSharingItem: async (itemId: number, itemData: Partial<SharingItem>): Promise<SharingItem> => {
    try {
      const response = await api.put(getApiUrl(`/community/free-sharing/${itemId}`), itemData);
      return response.data;
    } catch (error: any) {
      console.error('무료 나눔 수정 실패:', error);
      throw error;
    }
  },

  deleteSharingItem: async (itemId: number): Promise<void> => {
    try {
      await api.delete(getApiUrl(`/community/free-sharing/${itemId}`));
    } catch (error: any) {
      console.error('무료 나눔 삭제 실패:', error);
      throw error;
    }
  },

  // 무료 나눔 상태 변경
  updateSharingItemStatus: async (itemId: number, status: string): Promise<void> => {
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/community_sharing?id=eq.${itemId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey || '',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`상태 변경 실패: ${response.status}`);
      }
    } catch (error: any) {
      console.error('무료 나눔 상태 변경 실패:', error);
      throw error;
    }
  },

  // 물품 요청
  getRequestItems: async (params?: {
    category?: string;
    status?: string;
    urgency?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<RequestItem[]> => {
    try {
      // console.log('📝 물품요청 조회 Supabase Edge Function 호출 중...', params);

      // Supabase Edge Function 사용
      const queryParams = new URLSearchParams();
      if (params?.category && params.category !== 'all') queryParams.set('category', params.category);
      if (params?.urgency && params.urgency !== 'all') queryParams.set('urgency', params.urgency);
      if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.skip) queryParams.set('skip', params.skip.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());

      const functionUrl = queryParams.toString()
        ? `community-requests?${queryParams.toString()}`
        : 'community-requests';

      const { data, error } = await supabaseApiService.supabase.functions.invoke(functionUrl, {
        method: 'GET'
      });

      if (error) {
        console.error('❌ 물품요청 조회 실패:', error);
        throw error;
      }

      // console.log('✅ 물품요청 Edge Function 응답:', data);

      // community/requests function returns object with data array
      if (data && data.success && Array.isArray(data.data)) {
        // N+1 쿼리 최적화: 모든 church_id와 author_id를 한 번에 조회
        const churchIds = Array.from(new Set(data.data
          .map((item: any) => item.church_id)
          .filter((id: number) => id && id !== 9998)));
        const authorIds = Array.from(new Set(data.data
          .map((item: any) => item.author_id)
          .filter(Boolean)));

        // 교회 정보 일괄 조회
        const churchMap = new Map<number, { name: string; address: string }>();
        if (churchIds.length > 0) {
          const { data: churches } = await supabaseApiService.supabase
            .from('churches')
            .select('id, name, address')
            .in('id', churchIds);

          if (churches) {
            churches.forEach(church => {
              churchMap.set(church.id, {
                name: church.name,
                address: church.address
              });
            });
          }
        }

        // 사용자 정보 일괄 조회
        const userMap = new Map<number, string>();
        if (authorIds.length > 0) {
          const { data: users } = await supabaseApiService.supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', authorIds);

          if (users) {
            users.forEach(user => {
              userMap.set(user.id, user.full_name || user.email || '익명');
            });
          }
        }

        // 백엔드 필드명을 프론트엔드 인터페이스에 맞게 변환 (캐시된 정보 활용)
        const transformedData = data.data.map((item: any): RequestItem => {
          // church_id 9998(협력사)인 경우 또는 church_name이 '스마트요람 커뮤니티'인 경우 null 처리
          let churchName: string | null = null;
          let churchAddress = item.location || null;

          if (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') {
            churchName = null;
            churchAddress = '-';
          } else if (item.church_id) {
            const church = churchMap.get(item.church_id);
            if (church) {
              churchName = church.name;
              churchAddress = church.address || church.name || churchAddress;
            } else {
              churchName = item.church_name || item.church || getChurchNameById(item.church_id);
            }
          } else {
            churchName = item.church_name || item.church || getChurchNameById(item.church_id);
          }

          const churchId = (item.church_id === 9998) ? undefined : item.church_id;
          const userName = item.author_id ? (userMap.get(item.author_id) || `사용자${item.author_id}`) : '익명';

          // 위치 정보 포맷팅
          const displayLocation = formatDisplayLocation({
            province: item.province,
            district: item.district,
            deliveryAvailable: item.delivery_available,
            churchAddress: churchAddress,
            location: item.location
          });

          return {
            id: item.id,
            title: item.title,
            description: item.description || item.content,
            category: item.category,
            urgency: item.urgency || 'normal',
            location: displayLocation,
            contactPhone: item.contact_phone || parseContactInfo(item.contact_info || item.contactInfo).phone,
            contactEmail: item.contact_email || parseContactInfo(item.contact_info || item.contactInfo).email,
            contactInfo: item.contact_info || item.contactInfo,
            rewardType: item.reward_type || 'none',
            rewardAmount: item.reward_amount || 0,
            images: parseJsonArray(item.images, []).map((img: string) =>
              typeof img === 'string' && img.startsWith('http') ? img :
              `https://api.surfmind-team.com/static/community/images/${img}`
            ),
            church: churchName,
            church_id: churchId,
            status: item.status,
            createdAt: formatCreatedAt(item.created_at || item.createdAt),
            view_count: item.view_count || 0,
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: userName
          };
        });

        return transformedData;
      }

      // 직접 배열이 반환되는 경우
      if (Array.isArray(data)) {
        // N+1 쿼리 최적화: 모든 church_id와 author_id를 한 번에 조회
        const churchIds = Array.from(new Set(data
          .map((item: any) => item.church_id)
          .filter((id: number) => id && id !== 9998)));
        const authorIds = Array.from(new Set(data
          .map((item: any) => item.author_id)
          .filter(Boolean)));

        // 교회 정보 일괄 조회
        const churchMap = new Map<number, { name: string; address: string }>();
        if (churchIds.length > 0) {
          const { data: churches } = await supabaseApiService.supabase
            .from('churches')
            .select('id, name, address')
            .in('id', churchIds);

          if (churches) {
            churches.forEach(church => {
              churchMap.set(church.id, {
                name: church.name,
                address: church.address
              });
            });
          }
        }

        // 사용자 정보 일괄 조회
        const userMap = new Map<number, string>();
        if (authorIds.length > 0) {
          const { data: users } = await supabaseApiService.supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', authorIds);

          if (users) {
            users.forEach(user => {
              userMap.set(user.id, user.full_name || user.email || '익명');
            });
          }
        }

        const transformedData = data.map((item: any): RequestItem => {
          let churchName: string | null = null;
          let churchAddress = item.location || null;

          if (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') {
            churchName = null;
            churchAddress = '-';
          } else if (item.church_id) {
            const church = churchMap.get(item.church_id);
            if (church) {
              churchName = church.name;
              churchAddress = church.address || church.name || churchAddress;
            } else {
              churchName = item.church_name || item.church || getChurchNameById(item.church_id);
            }
          } else {
            churchName = item.church_name || item.church || getChurchNameById(item.church_id);
          }

          const churchId = (item.church_id === 9998) ? undefined : item.church_id;
          const userName = item.author_id ? (userMap.get(item.author_id) || `사용자${item.author_id}`) : '익명';

          // 위치 정보 포맷팅
          const displayLocation = formatDisplayLocation({
            province: item.province,
            district: item.district,
            deliveryAvailable: item.delivery_available,
            churchAddress: churchAddress,
            location: item.location
          });

          return {
            id: item.id,
            title: item.title,
            description: item.description || item.content,
            category: item.category,
            urgency: item.urgency || 'normal',
            location: displayLocation,
            contactPhone: item.contact_phone || parseContactInfo(item.contact_info || item.contactInfo).phone,
            contactEmail: item.contact_email || parseContactInfo(item.contact_info || item.contactInfo).email,
            contactInfo: item.contact_info || item.contactInfo,
            rewardType: item.reward_type || 'none',
            rewardAmount: item.reward_amount || 0,
            images: parseJsonArray(item.images, []).map((img: string) =>
              typeof img === 'string' && img.startsWith('http') ? img :
              `https://api.surfmind-team.com/static/community/images/${img}`
            ),
            church: churchName,
            church_id: churchId,
            status: item.status,
            createdAt: formatCreatedAt(item.created_at || item.createdAt),
            view_count: item.view_count || 0,
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: userName
          };
        });
        return transformedData;
      }

      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      // console.warn('예상치 못한 Supabase API 응답 구조:', data);
      return [];
    } catch (error: any) {
      console.error('❌ 물품요청 조회 실패 (Supabase API):', error);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  createRequestItem: async (itemData: Partial<RequestItem>): Promise<RequestItem> => {
    try {
      // console.log('📝 물품요청 등록 API 호출 중...', itemData);

      // 현재 사용자 정보 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();

      if (!currentUser || !currentUser.user) {
        throw new Error('사용자 인증이 필요합니다.');
      }

      const userId = currentUser.user.id;
      const churchId = currentUser.profile?.church_id || 9998; // 기본값 9998

      // console.log('👤 현재 사용자 정보:', {
      //   userId,
      //   churchId,
      //   email: currentUser.user.email,
      //   profile: currentUser.profile
      // });

      // author_id는 정수여야 하므로 profile에서 ID를 가져오거나 변환
      let authorId = null;
      if (currentUser.profile?.id) {
        authorId = parseInt(currentUser.profile.id.toString());
      }

      // console.log('🔢 변환된 author_id:', authorId);

      // contact_info 생성: contact_phone과 contact_email 합치기
      const contactPhone = itemData.contactPhone || (itemData as any).contact_phone || '';
      const contactEmail = itemData.contactEmail || (itemData as any).contact_email || '';
      let contactInfo = itemData.contactInfo || '';

      if (!contactInfo && contactPhone) {
        contactInfo = contactPhone;
        if (contactEmail) {
          contactInfo += ` | ${contactEmail}`;
        }
      }

      // 물품요청 특화 데이터 구성
      const backendData = {
        title: itemData.title,
        description: itemData.description,
        category: itemData.category || 'general',
        urgency: itemData.urgency || 'normal',
        location: itemData.location,
        province: itemData.province || (itemData as any).province || null,
        district: itemData.district || (itemData as any).district || null,
        deliveryAvailable: itemData.deliveryAvailable || (itemData as any).deliveryAvailable || false,
        contact_info: contactInfo,
        reward_type: itemData.rewardType || 'none',
        reward_amount: itemData.rewardAmount || 0,
        images: itemData.images || [],
        church_id: churchId,
        author_id: authorId,
        status: 'active'
      };

      // console.log('📤 백엔드로 전송할 물품요청 데이터:', backendData);
      const { data, error } = await supabaseApiService.supabase.functions.invoke('community-requests', {
        method: 'POST',
        body: backendData
      });

      if (error) {
        console.error('❌ 물품요청 등록 실패:', error);
        throw error;
      }

      // console.log('✅ 물품요청 등록 API 응답:', data);
      return data;
    } catch (error: any) {
      console.error('❌ 물품요청 등록 실패:', error);
      throw error;
    }
  },

  updateRequestItem: async (itemId: number, itemData: Partial<RequestItem>): Promise<RequestItem> => {
    try {
      // TODO: Supabase Edge Function에서 UPDATE 지원 시 구현
      const response = await api.put(getApiUrl(`/community/item-request/${itemId}`), itemData);
      return response.data;
    } catch (error: any) {
      console.error('물품 요청 수정 실패:', error);
      throw error;
    }
  },

  deleteRequestItem: async (itemId: number): Promise<void> => {
    try {
      // TODO: Supabase Edge Function에서 DELETE 지원 시 구현
      await api.delete(getApiUrl(`/community/item-request/${itemId}`));
    } catch (error: any) {
      console.error('물품 요청 삭제 실패:', error);
      throw error;
    }
  },

  // 물품 판매
  getOfferItems: async (params?: {
    category?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<OfferItem[]> => {
    try {
      // console.log('💰 물품판매 조회 Supabase Edge Function 호출 중...', params);

      // Supabase Edge Function을 사용하되 is_free=false 필터 추가
      const queryParams = new URLSearchParams();
      queryParams.set('is_free', 'false'); // 물품 판매만 조회
      if (params?.category && params.category !== 'all') queryParams.set('category', params.category);
      // status 필터 제거 - 모든 상태의 아이템 조회
      if (params?.search) queryParams.set('search', params.search);
      if (params?.skip) queryParams.set('skip', params.skip.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());

      // Supabase functions.invoke()가 쿼리 파라미터를 제대로 전달하지 못하므로 fetch 사용
      const functionName = 'community-sharing';
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      const fullUrl = `${supabaseUrl}/functions/v1/${functionName}?${queryParams.toString()}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 물품판매 조회 실패:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.success ? result.data : result;

      // Supabase functions.invoke()는 응답을 직접 파싱하므로
      // data가 배열이면 직접 사용, 객체면 data.data 사용
      let responseData = Array.isArray(data) ? data : (data?.data || []);

      // Edge Function 필터가 작동하지 않을 경우를 대비한 프론트엔드 필터링
      responseData = responseData.filter((item: any) => item.is_free === false);

      // community/sharing function returns object with data array
      if (responseData && Array.isArray(responseData)) {
        // N+1 쿼리 최적화: 모든 church_id와 author_id를 한 번에 조회
        const churchIds = Array.from(new Set(responseData
          .map((item: any) => item.church_id)
          .filter((id: number) => id && id !== 9998)));
        const authorIds = Array.from(new Set(responseData
          .map((item: any) => item.author_id)
          .filter(Boolean)));

        // 교회 정보 일괄 조회
        const churchMap = new Map<number, { name: string; address: string }>();
        if (churchIds.length > 0) {
          const { data: churches } = await supabaseApiService.supabase
            .from('churches')
            .select('id, name, address')
            .in('id', churchIds);

          if (churches) {
            churches.forEach(church => {
              churchMap.set(church.id, {
                name: church.name,
                address: church.address
              });
            });
          }
        }

        // 사용자 정보 일괄 조회
        const userMap = new Map<number, string>();
        if (authorIds.length > 0) {
          const { data: users } = await supabaseApiService.supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', authorIds);

          if (users) {
            users.forEach(user => {
              userMap.set(user.id, user.full_name || user.email || '익명');
            });
          }
        }

        // 데이터 변환 (캐시된 정보 활용)
        const transformedData: OfferItem[] = responseData.map((item: any): OfferItem => {
          // church_id 9998(협력사)인 경우 null 처리
          let churchName: string | null = null;
          let churchAddress = item.location || null;

          if (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') {
            churchName = null;
            churchAddress = '-';
          } else if (item.church_id) {
            const church = churchMap.get(item.church_id);
            if (church) {
              churchName = church.name || null;
              churchAddress = church.address || church.name || churchAddress;
            }
          } else {
            // church_name 필드가 있으면 사용
            churchName = item.church_name || item.church || null;
          }

          // 사용자 정보 캐시에서 조회
          const userName = item.author_id ? (userMap.get(item.author_id) || '익명') : '익명';

          // 위치 정보 포맷팅
          const displayLocation = formatDisplayLocation({
            province: item.province,
            district: item.district,
            deliveryAvailable: item.delivery_available,
            churchAddress: churchAddress,
            location: item.location
          });

          const parsedImages = parseJsonArray(item.images, []);
          const processedImages = parsedImages.map((img: any) =>
            typeof img === 'string' && img.startsWith('http') ? img :
            `https://api.surfmind-team.com/static/community/images/${img}`
          );

          return {
            id: item.id,
            title: item.title,
            description: item.description || item.content,
            category: item.category,
            condition: item.condition || '양호',
            price: item.price || 0,
            itemName: item.item_name || item.itemName || item.title,
            quantity: item.quantity || 1,
            deliveryMethod: item.delivery_method || item.deliveryMethod || '직거래',
            images: processedImages,
            church: churchName,
            location: displayLocation,
            contactPhone: item.contact_phone || parseContactInfo(item.contact_info || item.contactInfo).phone,
            contactEmail: item.contact_email || parseContactInfo(item.contact_info || item.contactInfo).email,
            contactInfo: item.contact_info || item.contactInfo,
            status: item.status,
            createdAt: formatCreatedAt(item.created_at || item.createdAt),
            view_count: item.view_count || 0,
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: userName
          };
        });

        return transformedData;
      }

      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      // console.warn('예상치 못한 Supabase API 응답 구조:', data);
      return [];
    } catch (error: any) {
      console.error('❌ 물품판매 조회 실패 (Supabase API):', error);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  createOfferItem: async (itemData: Partial<OfferItem>): Promise<OfferItem> => {
    try {
      // console.log('📝 물품판매 등록 API 호출 중...', itemData);

      // 현재 사용자 정보 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();

      if (!currentUser || !currentUser.user) {
        throw new Error('사용자 인증이 필요합니다.');
      }

      const userId = currentUser.user.id;
      const churchId = currentUser.profile?.church_id || 9998; // 기본값 9998

      // console.log('👤 현재 사용자 정보:', {
      //   userId,
      //   churchId,
      //   email: currentUser.user.email,
      //   profile: currentUser.profile
      // });

      // author_id는 정수여야 하므로 profile에서 ID를 가져오거나 변환
      let authorId = null;
      if (currentUser.profile?.id) {
        authorId = parseInt(currentUser.profile.id.toString());
      }

      // 물품판매 특화 데이터 구성
      const backendData = {
        title: itemData.title,
        description: itemData.description,
        category: itemData.category || 'general',
        condition: itemData.condition || 'good',
        price: itemData.price || 0,
        is_free: false, // 물품판매는 항상 false
        location: itemData.location,
        province: itemData.province || (itemData as any).province || null,
        district: itemData.district || (itemData as any).district || null,
        deliveryAvailable: itemData.deliveryAvailable || (itemData as any).deliveryAvailable || false,
        contact_info: itemData.contactInfo || '',
        contact_phone: itemData.contactPhone || (itemData as any).contact_phone || '',
        contact_email: itemData.contactEmail || (itemData as any).contact_email || '',
        images: itemData.images || [],
        church_id: churchId,
        author_id: authorId,
        status: 'active'
      };

      const { data, error } = await supabaseApiService.supabase.functions.invoke('community/sharing', {
        method: 'POST',
        body: backendData
      });

      if (error) {
        console.error('❌ 물품판매 등록 실패:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('❌ 물품판매 등록 실패:', error);
      throw error;
    }
  },

  updateOfferItem: async (itemId: number, itemData: Partial<OfferItem>): Promise<OfferItem> => {
    try {
      // TODO: Supabase Edge Function에서 UPDATE 지원 시 구현
      const response = await api.put(getApiUrl(`/community/item-sale/${itemId}`), itemData);
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // 백엔드 필드명을 프론트엔드 인터페이스에 맞게 변환 (FreeSharing과 동일)
        const transformedData = response.data.data.map((item: any): OfferItem => {
          // church_id 9998(협력사)인 경우 또는 church_name이 '스마트요람 커뮤니티'인 경우 null 처리
          const churchName = (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') ? null : (item.church_name || item.church || getChurchNameById(item.church_id));
          
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            condition: item.condition || '양호',
            price: item.price,
            itemName: item.item_name || item.itemName || item.title,
            quantity: item.quantity || 1,
            deliveryMethod: item.delivery_method || item.deliveryMethod || '직거래',
            images: parseJsonArray(item.images, []).map((img: string) =>
              typeof img === 'string' && img.startsWith('http') ? img :
              `https://api.surfmind-team.com/static/community/images/${img}`
            ),
            church: churchName,
            location: item.location,
            contactPhone: item.contact_phone || parseContactInfo(item.contact_info || item.contactInfo).phone,
            contactEmail: item.contact_email || parseContactInfo(item.contact_info || item.contactInfo).email,
            contactInfo: item.contact_info || item.contactInfo, // 기존 필드 (호환성 유지)
            status: item.status,
            createdAt: item.created_at || item.createdAt || null,
            view_count: item.view_count || 0,
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: item.author_name || '익명' // 통일된 필드명 사용
          };
        });
        return transformedData[0]; // 첫 번째 아이템만 반환 (업데이트된 아이템)
      }

      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any): OfferItem => {
          // 교회 9998의 경우 null로 처리
          const churchName = (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            condition: item.condition || '양호',
            price: item.price,
            itemName: item.item_name || item.itemName || item.title,
            quantity: item.quantity || 1,
            deliveryMethod: item.delivery_method || item.deliveryMethod || '직거래',
            images: parseJsonArray(item.images, []).map((img: string) =>
              typeof img === 'string' && img.startsWith('http') ? img :
              `https://api.surfmind-team.com/static/community/images/${img}`
            ),
            church: churchName,
            location: item.location,
            contactPhone: item.contact_phone || parseContactInfo(item.contact_info || item.contactInfo).phone,
            contactEmail: item.contact_email || parseContactInfo(item.contact_info || item.contactInfo).email,
            contactInfo: item.contact_info || item.contactInfo || '', // 기존 필드 (호환성 유지)
            status: item.status,
            createdAt: item.created_at || item.createdAt || null,
            view_count: item.view_count || 0,
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: item.author_name || '익명' // 통일된 필드명 사용
          };
        });
        return transformedData[0]; // 첫 번째 아이템만 반환 (업데이트된 아이템)
      }

      // 예상치 못한 응답 구조인 경우 기본 객체 반환
      // console.warn('예상치 못한 API 응답 구조:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('물품 판매 수정 실패:', error);
      throw error;
    }
  },

  deleteOfferItem: async (itemId: number): Promise<void> => {
    try {
      // TODO: Supabase Edge Function에서 DELETE 지원 시 구현
      await api.delete(getApiUrl(`/community/item-sale/${itemId}`));
    } catch (error: any) {
      console.error('물품 판매 삭제 실패:', error);
      throw error;
    }
  },

  // 물품 판매 상태 변경
  updateOfferItemStatus: async (itemId: number, status: string): Promise<void> => {
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/community_sharing?id=eq.${itemId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey || '',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`상태 변경 실패: ${response.status}`);
      }
    } catch (error: any) {
      console.error('물품 판매 상태 변경 실패:', error);
      throw error;
    }
  },

  // 구인 공고
  getJobPosts: async (params?: {
    position?: string;
    jobType?: string;
    status?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<JobPost[]> => {
    try {
      // console.log('💼 구인공고 조회 Supabase Edge Function 호출 중...', params);

      // Supabase Edge Function 사용
      const queryParams = new URLSearchParams();
      if (params?.jobType) queryParams.set('job_type', params.jobType);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.skip) queryParams.set('skip', params.skip.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());

      const functionUrl = queryParams.toString()
        ? `job-posts?${queryParams.toString()}`
        : 'job-posts';

      const { data, error } = await supabaseApiService.supabase.functions.invoke(functionUrl, {
        method: 'GET'
      });

      if (error) {
        console.error('❌ 구인공고 조회 실패:', error);
        throw error;
      }

      // console.log('✅ 구인공고 Edge Function 응답:', data);

      // job-posts function returns array directly
      if (data && Array.isArray(data)) {
        // 백엔드 필드명을 프론트엔드 인터페이스에 맞게 변환
        const transformedData = await Promise.all(data.map(async (item: any): Promise<JobPost> => {
          // church_id 9998(협력사)인 경우 또는 church_name이 '스마트요람 커뮤니티'인 경우 null 처리
          const churchName = (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') ? null : (item.church_name || item.church || getChurchNameById(item.church_id));
          const rawPosition = item.job_type || item.position || '미정';
          const transformedPosition = rawPosition === '일반' ? '기타' : rawPosition;

          // 사용자 정보를 직접 조회
          let userName = '익명';
          if (item.author_id) {
            try {
              const { data: userData, error } = await supabaseApiService.supabase
                .from('users')
                .select('full_name, email')
                .eq('id', item.author_id)
                .single();

              if (userData && !error) {
                userName = userData.full_name || userData.email || '익명';
                // console.log(`✅ [구인공고] 사용자 ${item.author_id} 조회 성공:`, userName);
              } else {
                // console.log(`❌ [구인공고] 사용자 ${item.author_id} 조회 실패:`, error);
                userName = `사용자${item.author_id}`;
              }
            } catch (error) {
              // console.log(`❌ [구인공고] 사용자 ${item.author_id} 조회 에러:`, error);
              userName = `사용자${item.author_id}`;
            }
          }

          // 교회 주소 정보를 직접 조회
          let churchAddress = item.location || '';
          if (item.church_id === 9998) {
            churchAddress = '-';
            // console.log(`✅ [구인공고] 협력사 주소: "-"`);
          } else if (item.church_id) {
            try {
              const { data: churchData, error } = await supabaseApiService.supabase
                .from('churches')
                .select('address, name')
                .eq('id', item.church_id)
                .single();

              if (churchData && !error) {
                churchAddress = churchData.address || churchData.name || churchAddress;
                // console.log(`✅ [구인공고] 교회 ${item.church_id} 주소 조회 성공:`, churchAddress);
              } else {
                // console.log(`❌ [구인공고] 교회 ${item.church_id} 조회 실패:`, error);
              }
            } catch (error) {
              // console.log(`❌ [구인공고] 교회 ${item.church_id} 조회 에러:`, error);
            }
          }

          return {
            id: item.id,
            title: item.title,
            description: item.description || item.content,
            churchName: churchName,
            churchIntro: item.church_intro || '',
            position: transformedPosition,
            jobType: item.employment_type === 'part_time' ? 'part-time' :
                     item.employment_type === 'volunteer' ? 'volunteer' : 'full-time',
            salary: item.salary_range || item.salary || '협의',
            benefits: parseJsonArray(item.benefits, []),
            qualifications: parseJsonArray(item.requirements, []),
            // responsibilities: parseJsonArray(item.responsibilities, []),
            requiredDocuments: parseJsonArray(item.required_documents, []),
            location: churchAddress,
            contactPhone: item.contact_phone || parseContactInfo(item.contact_info || '').phone,
            contactEmail: item.contact_email || parseContactInfo(item.contact_info || '').email,
            contactInfo: item.contact_info || '',
            applicationDeadline: item.application_deadline,
            createdAt: formatCreatedAt(item.created_at || item.createdAt),
            view_count: item.view_count || 0,
            likes: item.likes || 0,
            comments: item.comments || 0,
            applications: item.applications || 0,
            userName: userName,
            company: item.company_name || churchName || '',
            church: churchName,
            deadline: item.application_deadline,
            status: item.status
          };
        }));

        // console.log('✅ 변환된 구인공고 데이터:', transformedData.length, '개');
        return transformedData;
      }

      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      // console.warn('예상치 못한 Supabase API 응답 구조:', data);
      return [];
    } catch (error: any) {
      console.error('❌ 구인공고 조회 실패 (Supabase API):', error);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  getJobPost: async (jobId: number): Promise<JobPost | null> => {
    try {
      // console.log('💼 구인 공고 상세 조회 API 호출 중...', jobId);
      const response = await api.get(getApiUrl(`/community/job-posting/${jobId}`));
      // console.log('✅ 구인 공고 상세 조회 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: {...} } 형태인 경우 처리
      if (response.data && response.data.success && response.data.data) {
        const item = response.data.data;
        // 교회 9998의 경우 null로 처리
        const churchName = item.church || item.company || getChurchNameById(item.church_id);
        
        return {
          ...item,
          church: churchName,
          churchName: churchName,
          userName: item.author_name || '익명',
          // 백엔드 응답 필드명을 프론트엔드 인터페이스에 맞게 변환
          company: item.company || item.company_name,
          position: item.position || item.job_type,
          salary: item.salary || item.salary_range,
          view_count: item.view_count || 0,
          deadline: item.deadline || item.expires_at,
          createdAt: item.createdAt || item.created_at
        };
      }
      
      // 직접 객체가 반환되는 경우
      if (response.data && typeof response.data === 'object') {
        const item = response.data;
        // 교회 9998의 경우 null로 처리
        const churchName = item.church || item.churchName || getChurchNameById(item.church_id);
        
        return {
          ...item,
          church: churchName,
          churchName: churchName,
          userName: item.author_name || '익명',
          // 백엔드 응답 필드명을 프론트엔드 인터페이스에 맞게 변환
          company: item.company || item.company_name,
          position: item.position || item.job_type,
          salary: item.salary || item.salary_range,
          view_count: item.view_count || 0,
          deadline: item.deadline || item.expires_at,
          createdAt: item.createdAt || item.created_at
        };
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ 구인 공고 상세 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      return null;
    }
  },

  createJobPost: async (postData: any): Promise<JobPost> => {
    try {
      // console.log('💼 구인공고 등록 API 호출 중...', postData);

      // 현재 사용자 정보 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();

      if (!currentUser || !currentUser.user) {
        throw new Error('사용자 인증이 필요합니다.');
      }

      const userId = currentUser.user.id;
      const churchId = currentUser.profile?.church_id || 9998; // 기본값 9998

      // console.log('👤 현재 사용자 정보:', {
      //   userId,
      //   churchId,
      //   email: currentUser.user.email,
      //   profile: currentUser.profile
      // });

      // author_id는 정수여야 하므로 profile에서 ID를 가져오거나 변환
      let authorId = null;
      if (currentUser.profile?.id) {
        authorId = parseInt(currentUser.profile.id.toString());
      }

      // console.log('🔢 변환된 author_id:', authorId);

      // 구인공고 특화 데이터 구성
      const backendData = {
        title: postData.title,
        description: postData.description,
        company_name: postData.company || postData.companyName,
        job_type: postData.position || 'general',
        employment_type: postData.jobType === 'part-time' ? 'part_time' :
                        postData.jobType === 'volunteer' ? 'volunteer' : 'full_time',
        location: postData.location,
        salary_range: postData.salary || postData.salaryRange,
        requirements: Array.isArray(postData.requirements) ?
                     postData.requirements.join(', ') :
                     postData.requirements,
        contact_info: postData.contactInfo || '',
        application_deadline: postData.deadline || postData.applicationDeadline,
        church_id: churchId,
        author_id: authorId,
        status: 'active'
      };

      // console.log('📤 백엔드로 전송할 구인공고 데이터:', backendData);
      const { data, error } = await supabaseApiService.supabase.functions.invoke('job-posts', {
        method: 'POST',
        body: backendData
      });

      if (error) {
        console.error('❌ 구인공고 등록 실패:', error);
        throw error;
      }

      // console.log('✅ 구인공고 등록 API 응답:', data);
      return data;
    } catch (error: any) {
      console.error('❌ 구인공고 등록 실패:', error);
      throw error;
    }
  },

  updateJobPost: async (postId: number, postData: Partial<JobPost>): Promise<JobPost> => {
    try {
      const response = await api.put(getApiUrl(`/community/job-posting/${postId}`), postData);
      return response.data;
    } catch (error: any) {
      console.error('구인 공고 수정 실패:', error);
      throw error;
    }
  },

  deleteJobPost: async (postId: number): Promise<void> => {
    try {
      await api.delete(getApiUrl(`/community/job-posting/${postId}`));
    } catch (error: any) {
      console.error('구인 공고 삭제 실패:', error);
      throw error;
    }
  },

  // 구직 신청
  getJobSeekers: async (params?: {
    ministryField?: string;
    status?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<JobSeeker[]> => {
    try {
      // console.log('👥 구직 신청 API 호출 중...', params);
      const response = await api.get(getApiUrl('/community/job-seeking'), { params });
      // console.log('✅ 구직 신청 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || '익명' // 통일된 필드명 사용
          };
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      // console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    } catch (error: any) {
      console.error('❌ 구직 신청 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  createJobSeeker: async (seekerData: any, resume?: File): Promise<JobSeeker> => {
    try {
      // console.log('👤 구직 신청 등록 API 호출 중...', seekerData);
      
      // 파일이 있는 경우 FormData 사용, 없으면 JSON 전송
      if (resume) {
        const formData = new FormData();
        
        // 백엔드 API 스키마에 맞게 데이터 변환 후 FormData에 추가
        const apiData = {
          title: seekerData.title,
          desired_position: seekerData.ministryField?.join(', ') || seekerData.desired_position,
          employment_type: seekerData.availability || 'full-time',
          desired_location: seekerData.preferredLocation?.join(', ') || seekerData.desired_location,
          salary_expectation: seekerData.salary_expectation,
          experience_summary: seekerData.career || seekerData.introduction || '',
          education_background: seekerData.education,
          skills: Array.isArray(seekerData.certifications) 
            ? seekerData.certifications.join(', ') 
            : seekerData.skills,
          portfolio_url: seekerData.portfolio_url,
          contact_method: "기타",
          contact_info: seekerData.contactInfo || seekerData.contactPhone + (seekerData.contactEmail ? ` | ${seekerData.contactEmail}` : ''),
          available_start_date: seekerData.available_start_date,
          status: seekerData.status || "active"
        };
        
        // FormData에 각 필드 추가
        Object.entries(apiData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });
        
        // 이력서 파일 추가
        formData.append('resume', resume, resume.name);
        
        // console.log('📄 이력서 파일과 함께 FormData 전송');
        
        const response = await api.post(getApiUrl('/community/job-seekers'), formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // console.log('✅ 구직 신청 등록 (파일 포함) API 응답:', response.data);
        return response.data?.data || response.data;
        
      } else {
        // 파일이 없는 경우 JSON 전송
        const apiData = {
          title: seekerData.title,
          desired_position: seekerData.ministryField?.join(', ') || seekerData.desired_position,
          employment_type: seekerData.availability || 'full-time',
          desired_location: seekerData.preferredLocation?.join(', ') || seekerData.desired_location,
          salary_expectation: seekerData.salary_expectation,
          experience_summary: seekerData.career || seekerData.introduction || '',
          education_background: seekerData.education,
          skills: Array.isArray(seekerData.certifications) 
            ? seekerData.certifications.join(', ') 
            : seekerData.skills,
          portfolio_url: seekerData.portfolio_url,
          contact_method: "기타",
          contact_info: seekerData.contactInfo || seekerData.contactPhone + (seekerData.contactEmail ? ` | ${seekerData.contactEmail}` : ''),
          available_start_date: seekerData.available_start_date,
          status: seekerData.status || "active"
        };
        
        // console.log('🔄 변환된 API 데이터:', apiData);
        
        const response = await api.post(getApiUrl('/community/job-seekers'), apiData);
        // console.log('✅ 구직 신청 등록 API 응답:', response.data);
        
        return response.data?.data || response.data;
      }
    } catch (error: any) {
      console.error('❌ 구직 신청 등록 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      throw error;
    }
  },

  updateJobSeeker: async (seekerId: number, seekerData: Partial<JobSeeker>): Promise<JobSeeker> => {
    try {
      const response = await api.put(getApiUrl(`/community/job-seeking/${seekerId}`), seekerData);
      return response.data;
    } catch (error: any) {
      console.error('구직 신청 수정 실패:', error);
      throw error;
    }
  },

  deleteJobSeeker: async (seekerId: number): Promise<void> => {
    try {
      await api.delete(getApiUrl(`/community/job-seeking/${seekerId}`));
    } catch (error: any) {
      console.error('구직 신청 삭제 실패:', error);
      throw error;
    }
  },

  // 음악팀 모집
  getMusicRecruitments: async (params?: {
    recruitment_type?: string; // 행사 유형 필터
    team_types?: string; // 팀 형태 필터
    worship_type?: string; // 예배 형태 필터
    status?: string; // 상태 필터
    search?: string; // 제목/내용 검색
    page?: number; // 페이지 번호
    limit?: number; // 페이지당 항목 수
  }): Promise<MusicRecruitment[]> => {
    try {
      // console.log('🎵 찬양팀모집 조회 Supabase Edge Function 호출 중...', params);

      // Supabase Edge Function 사용
      const queryParams = new URLSearchParams();
      if (params?.worship_type) queryParams.set('worship_type', params.worship_type);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.limit) queryParams.set('limit', params.limit.toString());

      const functionUrl = queryParams.toString()
        ? `music-teams?${queryParams.toString()}`
        : 'music-teams';

      const response = await supabaseApiService.supabase.functions.invoke(functionUrl, {
        method: 'GET'
      });

      if (response.error) {
        console.error('❌ 찬양팀모집 조회 실패:', response.error);
        throw response.error;
      }

      // console.log('✅ 찬양팀모집 Edge Function 응답:', response.data);

      // music-teams function returns array directly
      if (response.data && Array.isArray(response.data)) {
        const transformedData = await Promise.all(response.data.map(async (item: any) => {
          const churchName = (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') ? null : (item.church_name || item.church || getChurchNameById(item.church_id));

          // 사용자 정보를 직접 조회
          let userName = '익명';
          if (item.author_id) {
            try {
              const { data: userData, error } = await supabaseApiService.supabase
                .from('users')
                .select('full_name, email')
                .eq('id', item.author_id)
                .single();

              if (userData && !error) {
                userName = userData.full_name || userData.email || '익명';
                // console.log(`✅ [찬양팀모집] 사용자 ${item.author_id} 조회 성공:`, userName);
              } else {
                // console.log(`❌ [찬양팀모집] 사용자 ${item.author_id} 조회 실패:`, error);
                userName = `사용자${item.author_id}`;
              }
            } catch (error) {
              // console.log(`❌ [찬양팀모집] 사용자 ${item.author_id} 조회 에러:`, error);
              userName = `사용자${item.author_id}`;
            }
          }

          // 교회 주소 정보를 직접 조회
          let churchAddress = item.location || null;
          if (item.church_id === 9998) {
            churchAddress = '-';
            // console.log(`✅ [찬양팀모집] 협력사 주소: "-"`);
          } else if (item.church_id) {
            try {
              const { data: churchData, error } = await supabaseApiService.supabase
                .from('churches')
                .select('address, name')
                .eq('id', item.church_id)
                .single();

              if (churchData && !error) {
                churchAddress = churchData.address || churchData.name || churchAddress;
                // console.log(`✅ [찬양팀모집] 교회 ${item.church_id} 주소 조회 성공:`, churchAddress);
              } else {
                // console.log(`❌ [찬양팀모집] 교회 ${item.church_id} 조회 실패:`, error);
              }
            } catch (error) {
              // console.log(`❌ [찬양팀모집] 교회 ${item.church_id} 조회 에러:`, error);
            }
          }

          return {
            ...item,
            church: churchName,
            churchName: churchName,
            location: churchAddress,
            userName: userName,
            createdAt: formatCreatedAt(item.created_at || item.createdAt)
          };
        }));
        return transformedData;
      }

      const response_data_mock = { data: response.data, success: true };

      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const transformedData = response.data.data.map((item: any) => {
          // 물품 요청과 동일한 교회명 변환 로직 적용
          const step1 = item.church_name;
          const step2 = item.church;
          const step3 = getChurchNameById(item.church_id);

          // church_id 9998(협력사)인 경우 '협력사'로 표시, church_name이 '스마트요람 커뮤니티'인 경우 null 처리
          const churchName = item.church_id === 9998 ? '협력사' :
                            step1 === '스마트요람 커뮤니티' ? null :
                            (step1 || step2 || step3);

          
          // spread operator 사용 후 override 방식으로 중복 키 문제 해결
          const transformed = {
            ...item,
            church: churchName,
            churchName: churchName,
            userName: item.author_name || '익명', // 통일된 필드명 사용
            view_count: item.view_count || 0, // 통일된 필드명 사용
            // 백엔드 스키마 업데이트 후 매핑
            worship_type: item.worship_type || '미정', // 예배 형태
            team_types: (() => {
              // console.log('🔍 team_types 파싱 디버그:', {
              //   raw_team_types: item.team_types,
              //   type: typeof item.team_types,
              //   team_name: item.team_name,
              //   starts_with_bracket: typeof item.team_types === 'string' && item.team_types.startsWith('[')
              // });

              // team_types가 JSON 문자열인 경우 파싱
              if (typeof item.team_types === 'string' && item.team_types.startsWith('[')) {
                try {
                  const parsed = JSON.parse(item.team_types);
                  // console.log('✅ JSON 파싱 성공:', parsed);
                  return parsed;
                } catch (e) {
                  // console.log('❌ JSON 파싱 실패:', e);
                  return [item.team_types];
                }
              }
              return Array.isArray(item.team_types) ? item.team_types :
                     item.team_types ? [item.team_types] :
                     item.team_name ? [item.team_name] : ['미정'];
            })() // 팀 형태 (JSON 파싱 + team_types 우선)
          };
          
          // createdAt 필드 변환 (중복 방지를 위해 마지막에 설정)
          let createdAt = item.created_at || item.createdAt || null;
          // 백엔드에서 timezone 정보 없이 오는 경우 UTC로 명시
          if (createdAt && !createdAt.endsWith('Z') && !createdAt.includes('+')) {
            createdAt = createdAt + 'Z';
          }
          transformed.createdAt = createdAt;
          
          // 디버깅: 변환 결과 확인
          if (item.id === 6) {
            // console.log('🔍 [TRANSFORM_DEBUG] ID 6 변환 결과:', {
            //   original_created_at: item.created_at,
            //   fixed_createdAt: createdAt,
            //   transformed_createdAt: transformed.createdAt,
            //   formatCreatedAt_result: transformed.createdAt ? formatCreatedAt(transformed.createdAt) : 'null'
            // });
          }
          
          return transformed;
        });
        return transformedData;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          // spread operator 사용 후 override 방식으로 중복 키 문제 해결
          const transformed = {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || '익명', // 통일된 필드명 사용
            view_count: item.view_count || 0, // 통일된 필드명 사용
            // 백엔드 스키마 업데이트 후 매핑
            worship_type: item.worship_type || '미정', // 예배 형태
            team_types: (() => {
              // console.log('🔍 team_types 파싱 디버그:', {
              //   raw_team_types: item.team_types,
              //   type: typeof item.team_types,
              //   team_name: item.team_name,
              //   starts_with_bracket: typeof item.team_types === 'string' && item.team_types.startsWith('[')
              // });

              // team_types가 JSON 문자열인 경우 파싱
              if (typeof item.team_types === 'string' && item.team_types.startsWith('[')) {
                try {
                  const parsed = JSON.parse(item.team_types);
                  // console.log('✅ JSON 파싱 성공:', parsed);
                  return parsed;
                } catch (e) {
                  // console.log('❌ JSON 파싱 실패:', e);
                  return [item.team_types];
                }
              }
              return Array.isArray(item.team_types) ? item.team_types :
                     item.team_types ? [item.team_types] :
                     item.team_name ? [item.team_name] : ['미정'];
            })() // 팀 형태 (JSON 파싱 + team_types 우선)
          };
          
          // createdAt 필드 변환 (중복 방지를 위해 마지막에 설정)
          let createdAt = item.created_at || item.createdAt || null;
          // 백엔드에서 timezone 정보 없이 오는 경우 UTC로 명시
          if (createdAt && !createdAt.endsWith('Z') && !createdAt.includes('+')) {
            createdAt = createdAt + 'Z';
          }
          transformed.createdAt = createdAt;
          
          // 디버깅: 변환 결과 확인
          if (item.id === 6) {
            // console.log('🔍 [TRANSFORM_DEBUG] ID 6 변환 결과:', {
            //   original_created_at: item.created_at,
            //   fixed_createdAt: createdAt,
            //   transformed_createdAt: transformed.createdAt,
            //   formatCreatedAt_result: transformed.createdAt ? formatCreatedAt(transformed.createdAt) : 'null'
            // });
          }
          
          return transformed;
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      // console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    } catch (error: any) {
      console.error('❌ 음악팀 모집 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  createMusicRecruitment: async (recruitmentData: any): Promise<MusicRecruitment> => {
    try {
      // console.log('🎵 행사팀 모집 등록 API 호출 중...', recruitmentData);
      // console.log('🔍 teamTypes 확인:', recruitmentData.teamTypes);
      // console.log('🔍 첫 번째 teamType:', recruitmentData.teamTypes?.[0]);
      
      // 실제 백엔드 SQL 스키마에 정확히 맞게 데이터 변환 (community_music_teams 테이블 기준)
      const apiData = {
        // 기본 정보 (필수)
        title: recruitmentData.title,
        team_name: '',
        worship_type: recruitmentData.eventType, // 예배 형태 (주일예배, 수요예배 등)
        team_types: recruitmentData.teamTypes || [], // 팀 형태 JSONB 배열 (찬양팀, 워십팀 등)

        // 모집 상세 - 백엔드 SQL 필드명에 맞춤
        instruments_needed: null, // 기존 필드는 null 처리
        positions_needed: "", // 현재 폼에서 수집하지 않는 필드 (null 대신 빈 문자열)
        experience_required: recruitmentData.requirements || "경험 무관",
        practice_location: recruitmentData.location || "협의",
        practice_schedule: recruitmentData.schedule || "협의",
        commitment: "", // 현재 폼에서 수집하지 않는 필드 (null 대신 빈 문자열)
        
        // 상세 내용 - 백엔드 필드명에 맞춤 (null 대신 빈 문자열)
        description: recruitmentData.description || "",
        requirements: "", // 별도 requirements 필드 (experience_required와 다름, null 대신 빈 문자열)
        benefits: recruitmentData.compensation || "", // compensation → benefits (null 대신 빈 문자열)
        
        // 연락처 정보 (필수)
        contact_method: "전화",
        contact_info: `전화: ${recruitmentData.contactPhone}${recruitmentData.contactEmail ? `, 이메일: ${recruitmentData.contactEmail}` : ''}`,
        
        // 상태 및 기타 필드
        status: recruitmentData.status || "open",
        current_members: 0, // 현재 폼에서 수집하지 않는 필드 (숫자 필드는 0으로)
        target_members: 0, // 현재 폼에서 수집하지 않는 필드 (숫자 필드는 0으로)
        
        // 통계 필드들은 백엔드 테이블에 존재하지 않으므로 제거
        // view_count: 0,
        // likes: 0,
        // applicants_count: recruitmentData.applications || 0
        
        // created_at, updated_at은 백엔드에서 자동 설정되므로 전송하지 않음
        // 사용자 정보는 백엔드에서 JWT 토큰을 통해 자동으로 설정됨
      };
      
      // console.log('🔄 변환된 API 데이터:', apiData);
      
      // 현재 사용자 정보 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();

      if (!currentUser || !currentUser.user) {
        throw new Error('사용자 인증이 필요합니다.');
      }

      const churchId = currentUser.profile?.church_id || 9998;
      let authorId = null;
      if (currentUser.profile?.id) {
        authorId = parseInt(currentUser.profile.id.toString());
      }

      // Supabase 데이터로 변환
      const supabaseData = {
        ...apiData,
        church_id: churchId,
        author_id: authorId,
        status: 'active'
      };

      const response = await supabaseApiService.supabase.functions.invoke('music-teams', {
        method: 'POST',
        body: supabaseData
      });

      if (response.error) {
        console.error('❌ 찬양팀모집 등록 실패:', response.error);
        throw response.error;
      }

      // console.log('✅ [Supabase] 찬양팀 모집 등록 완료:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 행사팀 모집 등록 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      throw error;
    }
  },

  updateMusicRecruitment: async (recruitmentId: number, recruitmentData: Partial<MusicRecruitment>): Promise<MusicRecruitment> => {
    try {
      const response = await api.put(getApiUrl(`/community/music-team-recruitments/${recruitmentId}`), recruitmentData);
      return response.data;
    } catch (error: any) {
      console.error('음악팀 모집 수정 실패:', error);
      throw error;
    }
  },

  deleteMusicRecruitment: async (recruitmentId: number): Promise<void> => {
    try {
      await api.delete(getApiUrl(`/community/music-team-recruitments/${recruitmentId}`));
    } catch (error: any) {
      console.error('음악팀 모집 삭제 실패:', error);
      throw error;
    }
  },

  // 음악팀 참여
  getMusicSeekers: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    instrument?: string;
    location?: string;
    day?: string;
    time?: string;
    search?: string;
  }): Promise<MusicSeeker[]> => {
    try {
      // console.log('🎶 [Supabase] 음악팀 지원자 목록 조회 중...', params);

      // Supabase Edge Function 호출
      const searchParams = new URLSearchParams();

      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.status) searchParams.set('status', params.status);
      if (params?.instrument) searchParams.set('instrument', params.instrument);
      if (params?.location) searchParams.set('location', params.location);
      if (params?.day) searchParams.set('days', params.day);
      if (params?.search) searchParams.set('search', params.search);

      const functionUrl = searchParams.toString()
        ? `music-seekers?${searchParams.toString()}`
        : 'music-seekers';

      const { data, error } = await supabaseApiService.supabase.functions.invoke(functionUrl, {
        method: 'GET'
      });

      if (error) {
        console.error('❌ music-seekers Edge Function 오류:', error);
        return [];
      }

      // console.log('✅ [Supabase] 음악팀 지원자 목록 조회 완료:', data?.data?.length || 0, '건');
      // console.log('🔍 [DEBUG] 원본 데이터 샘플:', data?.data?.[0]);
      // console.log('🔍 [DEBUG] 원본 created_at:', data?.data?.[0]?.created_at);
      // console.log('🔍 [DEBUG] 원본 portfolio_file:', data?.data?.[0]?.portfolio_file);
      // console.log('🔍 [DEBUG] 조인된 users 데이터:', data?.data?.[0]?.users);
      // console.log('🔍 [DEBUG] 조인된 churches 데이터:', data?.data?.[0]?.churches);

      // Edge Function 응답 구조: {data: Array, count: number}
      const musicSeekers = data?.data || [];

      if (!Array.isArray(musicSeekers)) {
        // console.warn('❌ 예상치 못한 응답 구조:', data);
        return [];
      }

      const mappedData = musicSeekers.map((item: any) => {
        // 사용자 이름 추출 - 현재는 조인 없이 author_name 사용
        const userName = item.author_name || '익명';

        // 교회 이름은 church_name 컬럼에서 직접 가져오기
        const churchName = item.church_name;

        return {
          id: item.id,
          title: item.title,
          name: userName,
          teamName: item.team_name,
          instrument: item.instrument,
          experience: item.experience,
          portfolio: item.portfolio,
          portfolioFile: item.portfolio_file,
          preferredLocation: Array.isArray(item.preferred_location) ? item.preferred_location : [],
          availableDays: Array.isArray(item.available_days) ? item.available_days : [],
          availableTime: item.available_time,
          contactPhone: item.contact_phone,
          contactEmail: item.contact_email,
          status: item.status,
          authorName: userName,
          churchName: churchName,
          view_count: item.view_count || 0,
          likes: item.likes || 0,
          matches: item.matches || 0,
          applications: item.applications || 0,
          createdAt: item.created_at || item.createdAt || null,
          created_at: item.created_at, // 백엔드 호환성
          userName: userName,
          content: item.experience || ''
        };
      });

      // console.log('🔍 [DEBUG] 원본 데이터 샘플:', data[0]);
      // console.log('🔍 [DEBUG] 원본 created_at:', data[0]?.created_at);
      // console.log('🔍 [DEBUG] 매핑된 데이터 샘플:', mappedData[0]);
      // console.log('🔍 [DEBUG] 매핑된 createdAt:', mappedData[0]?.createdAt);
      // console.log('🔍 [DEBUG] 매핑된 portfolioFile:', mappedData[0]?.portfolioFile);
      return mappedData;

    } catch (error: any) {
      console.error('❌ 음악팀 지원자 목록 조회 실패:', error);
      return [];
    }
  },

  getMusicSeekerById: async (id: number): Promise<MusicSeeker | null> => {
    try {
      // console.log('🎶 음악팀 지원자 상세 API 호출 중...', id);
      const response = await api.get(getApiUrl(`/music-team-seekers/${id}`));
      // console.log('✅ 음악팀 지원자 상세 API 응답:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return {
          id: response.data.data.id,
          title: response.data.data.title,
          name: response.data.data.author_name || response.data.data.name,
          teamName: response.data.data.team_name,
          instrument: response.data.data.instrument,
          experience: response.data.data.experience,
          portfolio: response.data.data.portfolio,
          preferredLocation: parseJsonArray(response.data.data.preferred_location, []),
          availableDays: parseJsonArray(response.data.data.available_days, []),
          availableTime: response.data.data.available_time,
          contactPhone: response.data.data.contact_phone,
          contactEmail: response.data.data.contact_email,
          status: response.data.data.status,
          authorName: response.data.data.author_name,
          churchName: response.data.data.church_name,
          view_count: response.data.data.view_count || 0,
          likes: response.data.data.likes || 0,
          matches: response.data.data.matches || 0,
          applications: response.data.data.applications || 0,
          createdAt: response.data.data.created_at || '',
          userName: response.data.data.author_name
        };
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ 음악팀 지원자 상세 조회 실패:', error);
      return null;
    }
  },

  createMusicSeeker: async (seekerData: any): Promise<any> => {
    try {
      // console.log('🎶 [Supabase] 음악팀 지원서 등록 중...', seekerData);
      // console.log('🔍 [DEBUG] seekerData.contactPhone:', `'${seekerData.contactPhone}'`, typeof seekerData.contactPhone);

      // 현재 사용자 정보 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      if (!currentUser?.user?.id) {
        throw new Error('로그인이 필요합니다.');
      }

      // Supabase에서 사용자 정보와 교회 정보 조회
      let userInfo = null;
      let churchInfo = null;

      try {
        // 사용자 정보 조회 (church_id 포함) - 이름 필드도 포함
        const { data: userData, error: userError } = await supabaseApiService.supabase
          .from('users')
          .select('id, email, church_id, username, full_name')
          .eq('id', currentUser.user?.id)
          .single();

        if (userError) {
          // console.warn('⚠️ 사용자 정보 조회 실패:', userError);
        } else {
          userInfo = userData;
          // console.log('🔍 [DEBUG] 사용자 정보:', userInfo);

          // 교회 정보 조회
          if (userInfo?.church_id && userInfo.church_id !== 9998) {
            const { data: churchData, error: churchError } = await supabaseApiService.supabase
              .from('churches')
              .select('id, name')
              .eq('id', userInfo.church_id)
              .single();

            if (churchError) {
              // console.warn('⚠️ 교회 정보 조회 실패:', churchError);
            } else {
              churchInfo = churchData;
              // console.log('🔍 [DEBUG] 교회 정보:', churchInfo);
            }
          }
        }
      } catch (dbError) {
        // console.warn('⚠️ 데이터베이스 조회 실패:', dbError);
      }

      // Supabase Edge Function에 전송할 데이터 준비
      const requestData = {
        title: validateAndTrimField(seekerData.title, FIELD_LIMITS.TITLE, '제목'),
        team_name: validateAndTrimField(seekerData.teamName, FIELD_LIMITS.SHORT_TEXT, '팀명') || null,
        instrument: validateAndTrimField(seekerData.instrument || seekerData.teamType, FIELD_LIMITS.SHORT_TEXT, '악기/팀형태'),
        content: validateAndTrimField(seekerData.content || seekerData.experience, FIELD_LIMITS.EXPERIENCE, '경력') || null,
        experience: validateAndTrimField(seekerData.content || seekerData.experience, FIELD_LIMITS.EXPERIENCE, '경력') || null,
        portfolio: validateAndTrimField(seekerData.portfolio, FIELD_LIMITS.PORTFOLIO, '포트폴리오') || null,
        portfolio_file: validateAndTrimField(seekerData.portfolioFile, FIELD_LIMITS.PORTFOLIO_FILE, '포트폴리오 파일') || null,
        portfolioFile: validateAndTrimField(seekerData.portfolioFile, FIELD_LIMITS.PORTFOLIO_FILE, '포트폴리오 파일') || null,
        preferred_location: seekerData.preferredLocation || [],
        preferredLocation: seekerData.preferredLocation || [],
        available_days: seekerData.availableDays || [],
        availableDays: seekerData.availableDays || [],
        available_time: validateAndTrimField(seekerData.availableTime, FIELD_LIMITS.SHORT_TEXT, '활동 가능 시간') || null,
        availableTime: validateAndTrimField(seekerData.availableTime, FIELD_LIMITS.SHORT_TEXT, '활동 가능 시간') || null,
        contact_phone: validateAndTrimField(seekerData.contactPhone, FIELD_LIMITS.PHONE, '연락처 전화번호'),
        contactPhone: validateAndTrimField(seekerData.contactPhone, FIELD_LIMITS.PHONE, '연락처 전화번호'),
        contact_email: validateAndTrimField(seekerData.contactEmail, FIELD_LIMITS.EMAIL, '연락처 이메일') || null,
        contactEmail: validateAndTrimField(seekerData.contactEmail, FIELD_LIMITS.EMAIL, '연락처 이메일') || null,
        author_id: currentUser.user?.id,
        author_name: userInfo?.full_name ||
                    userInfo?.username ||
                    userInfo?.email ||
                    currentUser.user?.email ||
                    '익명',
        church_id: churchInfo?.id || (userInfo?.church_id === 9998 ? null : userInfo?.church_id),
        church_name: churchInfo?.name,
        status: 'active'
      };

      // console.log('🔍 [DEBUG] churchInfo:', churchInfo);
      // console.log('🔍 [DEBUG] church_name 값:', churchInfo?.name);
      // console.log('🔍 [Supabase] 전송할 데이터:', requestData);

      // Use direct fetch instead of Supabase SDK to avoid issues
      const response = await fetch('https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/music-seekers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'temp-token': `temp_token_${currentUser.user?.id}_${Date.now()}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ HTTP Error:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      // console.log('✅ [Supabase] 음악팀 지원서 등록 완료:', data);
      return data;

    } catch (error: any) {
      console.error('❌ 음악팀 지원서 등록 실패:', error);
      throw error;
    }
  },

  updateMusicSeeker: async (seekerId: number, seekerData: any): Promise<any> => {
    try {
      // console.log('🎶 음악팀 지원서 수정 API 호출 중...', seekerId, seekerData);
      
      // Frontend → Backend 데이터 변환
      const backendData = {
        ...(seekerData.title && { title: seekerData.title }),
        ...(seekerData.teamName && { team_name: seekerData.teamName }),
        ...(seekerData.instrument && { instrument: seekerData.instrument }),
        ...(seekerData.experience && { experience: seekerData.experience }),
        ...(seekerData.portfolio && { portfolio: seekerData.portfolio }),
        ...(seekerData.preferredLocation && { preferred_location: seekerData.preferredLocation }),
        ...(seekerData.availableDays && { available_days: seekerData.availableDays }),
        ...(seekerData.availableTime && { available_time: seekerData.availableTime }),
        ...(seekerData.contactPhone && { contact_phone: seekerData.contactPhone }),
        ...(seekerData.contactEmail && { contact_email: seekerData.contactEmail }),
        ...(seekerData.status && { status: seekerData.status })
      };
      
      const response = await api.put(getApiUrl(`/music-team-seekers/${seekerId}`), backendData);
      // console.log('✅ 음악팀 지원서 수정 API 응답:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 음악팀 지원서 수정 실패:', error);
      throw error;
    }
  },

  deleteMusicSeeker: async (seekerId: number): Promise<void> => {
    try {
      // console.log('🎶 음악팀 지원서 삭제 API 호출 중...', seekerId);
      const response = await api.delete(getApiUrl(`/music-team-seekers/${seekerId}`));
      // console.log('✅ 음악팀 지원서 삭제 API 응답:', response.data);
    } catch (error: any) {
      console.error('❌ 음악팀 지원서 삭제 실패:', error);
      throw error;
    }
  },

  // 교회 행사
  getChurchEvents: async (params?: {
    eventType?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    skip?: number;
    limit?: number;
  }): Promise<ChurchEvent[]> => {
    try {
      // console.log('🎪 교회 행사 API 호출 중...', params);
      const response = await api.get(getApiUrl('/community/church-events'), { params });
      // console.log('✅ 교회 행사 API 응답:', response.data);

      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const transformedData = response.data.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));

          return {
            ...item,
            church: churchName,
            churchName: churchName,
            userName: item.author_name || '익명',
            contactPhone: item.contact_phone || parseContactInfo(item.contact).phone,
            contactEmail: item.contact_email || parseContactInfo(item.contact).email,
            contact: item.contact // 기존 필드 (호환성 유지)
          };
        });
        return transformedData;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));

          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || '익명', // 통일된 필드명 사용
            contactPhone: item.contact_phone || parseContactInfo(item.contact).phone,
            contactEmail: item.contact_email || parseContactInfo(item.contact).email,
            contact: item.contact // 기존 필드 (호환성 유지)
          };
        });
        return transformedData;
      }

      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      // console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    } catch (error: any) {
      console.error('❌ 교회 행사 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },


  updateChurchEvent: async (eventId: number, eventData: Partial<ChurchEvent>): Promise<ChurchEvent> => {
    try {
      const response = await api.put(getApiUrl(`/community/church-events/${eventId}`), eventData);
      return response.data;
    } catch (error: any) {
      console.error('교회 행사 수정 실패:', error);
      throw error;
    }
  },

  deleteChurchEvent: async (eventId: number): Promise<void> => {
    try {
      await api.delete(getApiUrl(`/community/church-events/${eventId}`));
    } catch (error: any) {
      console.error('교회 행사 삭제 실패:', error);
      throw error;
    }
  },

  // 기도 요청
  getPrayerRequests: async (params?: {
    category?: string;
    isPublic?: boolean;
    status?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<PrayerRequest[]> => {
    try {
      // console.log('🙏 기도 요청 API 호출 중...', params);
      const response = await api.get(getApiUrl('/community/prayer-requests'), { params });
      // console.log('✅ 기도 요청 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || '익명' // 통일된 필드명 사용
          };
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      // console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    } catch (error: any) {
      console.error('❌ 기도 요청 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  createPrayerRequest: async (requestData: Partial<PrayerRequest>): Promise<PrayerRequest> => {
    try {
      const response = await api.post(getApiUrl('/community/prayer-requests'), requestData);
      return response.data;
    } catch (error: any) {
      console.error('기도 요청 등록 실패:', error);
      throw error;
    }
  },

  updatePrayerRequest: async (requestId: number, requestData: Partial<PrayerRequest>): Promise<PrayerRequest> => {
    try {
      const response = await api.put(getApiUrl(`/community/prayer-requests/${requestId}`), requestData);
      return response.data;
    } catch (error: any) {
      console.error('기도 요청 수정 실패:', error);
      throw error;
    }
  },

  deletePrayerRequest: async (requestId: number): Promise<void> => {
    try {
      await api.delete(getApiUrl(`/community/prayer-requests/${requestId}`));
    } catch (error: any) {
      console.error('기도 요청 삭제 실패:', error);
      throw error;
    }
  },

  // 기도하기 (기도 카운트 증가)
  prayForRequest: async (requestId: number): Promise<void> => {
    try {
      await api.post(getApiUrl(`/community/prayer-requests/${requestId}/pray`));
    } catch (error: any) {
      console.error('기도하기 실패:', error);
      throw error;
    }
  },

  // 공통 기능
  likePost: async (postType: string, postId: number): Promise<void> => {
    try {
      await api.post(getApiUrl(`/community/${postType}/${postId}/like`));
    } catch (error: any) {
      console.error('좋아요 실패:', error);
      throw error;
    }
  },

  unlikePost: async (postType: string, postId: number): Promise<void> => {
    try {
      await api.delete(getApiUrl(`/community/${postType}/${postId}/like`));
    } catch (error: any) {
      console.error('좋아요 취소 실패:', error);
      throw error;
    }
  },

  incrementView: async (postType: string, postId: number): Promise<void> => {
    try {
      await api.post(getApiUrl(`/community/${postType}/${postId}/view`));
    } catch (error: any) {
      console.error('조회수 증가 실패:', error);
      // 조회수 증가는 실패해도 사용자 경험에 큰 영향이 없으므로 에러를 던지지 않음
    }
  },

  // 카테고리 조회
  getCategories: async (): Promise<string[]> => {
    try {
      const response = await api.get(getApiUrl('/community/categories'));
      return response.data;
    } catch (error: any) {
      console.error('카테고리 조회 실패:', error);
      // 기본 카테고리 반환
      return ['가구', '전자제품', '도서', '악기', '기타'];
    }
  },

  // 내가 올린 글 조회 (모든 타입 통합)
  getMyPosts: async (params?: {
    type?: string;
    post_type?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any[]> => {
    try {
      const currentUser = await supabaseAuthService.getCurrentUser();
      if (!currentUser?.user?.id) {
        console.error('❌ 사용자 인증 정보가 없습니다.');
        return [];
      }

      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.append('type', params.type);
      if (params?.post_type) searchParams.append('post_type', params.post_type);
      if (params?.search) searchParams.append('search', params.search);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const functionUrl = searchParams.toString() ? `my-posts?${searchParams.toString()}` : 'my-posts';

      const { data, error } = await supabase.functions.invoke(functionUrl, {
        method: 'GET',
        headers: {
          'temp-token': `temp_token_${currentUser.user.id}_${Date.now()}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('❌ 내 게시글 조회 Edge Function 오류:', error);
        return [];
      }

      if (Array.isArray(data)) {
        const transformedData = data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티') ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));

          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || item.user_name || '익명' // 통일된 필드명 사용
          };
        });
        return transformedData;
      }

      return [];
    } catch (error: any) {
      console.error('❌ 내 게시글 조회 실패:', error);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  // 관리자 전용 기능들
  // 모든 게시글 조회 (수퍼어드민용)
  getAllPostsForAdmin: async (params?: {
    type?: string;
    search?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<any[]> => {
    try {
      // console.log('👨‍💼 관리자 게시글 Supabase Edge Function 호출 중...', params);
      const { supabaseApiService } = await import('./supabaseApiService');

      // 파라미터를 URL 쿼리 스트링으로 생성
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.append('type', params.type);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.search) searchParams.append('search', params.search);
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const queryString = searchParams.toString();
      const endpoint = queryString ? `community/admin/posts?${queryString}` : 'community/admin/posts';

      const { data, error } = await supabaseApiService.supabase.functions.invoke(endpoint, {
        method: 'GET'
      });

      if (error) {
        console.error('❌ 관리자 게시글 조회 실패:', error);
        throw error;
      }

      // console.log('✅ 관리자 게시글 Edge Function 응답:', data);

      // Edge Function 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (data?.success && data?.data) {
        return data.data;
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ 관리자 게시글 조회 실패:', error);
      // Fallback mock data
      return [
        {
          id: 1,
          type: 'free-sharing',
          title: '아이 옷 나눔합니다',
          status: 'active',
          created_at: '2시간 전',
          view_count: 25,
          likes: 5,
          comments: 3,
          church: '소망교회',
          location: '서울 강남구',
          author: '김은혜',
          authorEmail: 'grace@example.com'
        },
        {
          id: 2,
          type: 'item-request',
          title: '책상 하나 구해요',
          status: 'pending',
          created_at: '4시간 전',
          view_count: 15,
          likes: 2,
          comments: 1,
          church: '믿음교회',
          location: '서울 서초구',
          author: '박희망',
          authorEmail: 'hope@example.com'
        }
      ];
    }
  },

  // 게시글 차단 (관리자용)
  blockPost: async (postType: string, postId: number): Promise<void> => {
    try {
      await api.put(getApiUrl(`/community/admin/${postType}/${postId}/block`));
    } catch (error: any) {
      console.error('게시글 차단 실패:', error);
      throw error;
    }
  },

  // 게시글 차단 해제 (관리자용)
  unblockPost: async (postType: string, postId: number): Promise<void> => {
    try {
      await api.put(getApiUrl(`/community/admin/${postType}/${postId}/unblock`));
    } catch (error: any) {
      console.error('게시글 차단 해제 실패:', error);
      throw error;
    }
  },

  // 게시글 강제 삭제 (관리자용)
  forceDeletePost: async (postType: string, postId: number): Promise<void> => {
    try {
      await api.delete(getApiUrl(`/community/admin/${postType}/${postId}`));
    } catch (error: any) {
      console.error('게시글 강제 삭제 실패:', error);
      throw error;
    }
  },

  // 커뮤니티 통계 조회 (관리자용)
  getAdminStats: async (): Promise<any> => {
    try {
      const response = await api.get(getApiUrl('/community/admin/stats'));
      return response.data;
    } catch (error: any) {
      console.error('관리자 통계 조회 실패:', error);
      throw error;
    }
  },

  // 행사 소식 등록
  createChurchEvent: async (eventData: Partial<ChurchEvent>): Promise<ChurchEvent> => {
    try {
      const response = await api.post(getApiUrl('/community/church-events'), eventData);
      return response.data;
    } catch (error: any) {
      console.error('행사 등록 실패:', error);
      throw error;
    }
  },

  // ==================== 교회 행사 소식 관련 ====================

  // 교회 행사 소식 목록 조회
  getChurchNews: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
    event_date_from?: string;
    event_date_to?: string;
  }): Promise<ChurchNews[]> => {
    try {
      // console.log('📰 [Supabase] 교회 소식 목록 조회 중...', params);

      // Supabase Edge Function 호출
      const searchParams = new URLSearchParams();

      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.category && params.category !== 'all') searchParams.set('category', params.category);
      if (params?.priority && params.priority !== 'all') searchParams.set('urgent', params.priority === 'urgent' ? 'true' : 'false');
      if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);

      const functionUrl = searchParams.toString()
        ? `church-news?${searchParams.toString()}`
        : 'church-news';

      const { data, error } = await supabaseApiService.supabase.functions.invoke(functionUrl, {
        method: 'GET'
      });

      if (error) {
        console.error('❌ church-news Edge Function 오류:', error);
        return [];
      }

      // console.log('✅ [Supabase] 교회 소식 목록 조회 완료:', data?.length || 0, '건');

      if (!Array.isArray(data)) {
        // console.warn('❌ 예상치 못한 응답 구조:', data);
        return [];
      }

      // 사용자명들을 병렬로 조회 (Supabase users 테이블에서 full_name)
      const authorIds = data.map((item: any) => item.author_id);
      const uniqueAuthorIds = Array.from(new Set(authorIds));
      // console.log('👥 고유 author_id들:', uniqueAuthorIds);

      const usersData: { [key: number]: string } = {};

      // Supabase에서 users 테이블 직접 조회
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: usersResponse, error } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', uniqueAuthorIds);

        // console.log('👥 Supabase users 테이블 조회 결과:', usersResponse);
        // console.log('👥 Supabase users 조회 에러:', error);

        if (usersResponse && !error) {
          usersResponse.forEach((user: any) => {
            usersData[user.id] = user.full_name || user.email || `사용자${user.id}`;
          });
        }
      } catch (error) {
        console.error('👥 Supabase users 조회 실패:', error);
      }

      // 교회 주소 정보도 병렬로 조회
      const churchIds = data.map((item: any) => item.church_id);
      const uniqueChurchIds = Array.from(new Set(churchIds.filter(id => id && id !== 9998)));
      // console.log('🏛️ 고유 church_id들:', uniqueChurchIds);

      const churchesData: { [key: number]: string } = {};

      if (uniqueChurchIds.length > 0) {
        try {
          const { supabase } = await import('../lib/supabase');
          const { data: churchesResponse, error } = await supabase
            .from('churches')
            .select('serial_id, address, name')
            .in('serial_id', uniqueChurchIds);

          // console.log('🏛️ Supabase churches 테이블 조회 결과:', churchesResponse);

          if (churchesResponse && !error) {
            churchesResponse.forEach((church: any) => {
              churchesData[church.serial_id] = church.address || church.name || null;
            });
          }
        } catch (error) {
          console.error('🏛️ Supabase churches 조회 실패:', error);
        }
      }

      // console.log('👥 매핑된 사용자 데이터:', usersData);

      // 백엔드 형식을 프론트엔드 형식으로 변환
      return data.map((item: any) => {
        // 교회명 매핑 (church_id 9998은 협력사)
        const churchName = (item.church_id === 9998) ? '협력사' : (getChurchNameById(item.church_id) || undefined);

        // 사용자명 매핑 (users 테이블에서 조회한 full_name)
        const authorName = usersData[item.author_id] || `사용자${item.author_id}`;

        // 교회 주소 매핑 (church_id 9998은 "-")
        let churchAddress = item.location;
        if (item.church_id === 9998) {
          churchAddress = '-';
        } else if (item.church_id && churchesData[item.church_id]) {
          churchAddress = churchesData[item.church_id];
        }

        return {
          id: item.id,
          title: item.title,
          content: item.content,
          category: item.category,
          isUrgent: item.is_urgent || false,
          eventDate: item.event_date,
          location: churchAddress,
          attachments: item.attachments || [],
          authorId: item.author_id,
          authorName: authorName,
          author_name: authorName,
          churchId: item.church_id,
          churchName: churchName,
          church_name: churchName,
          status: item.status,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          viewCount: item.view_count || 0,
          view_count: item.view_count || 0,
          likes: item.likes || 0,
          userName: authorName,
          user_name: authorName
        };
      });

    } catch (error: any) {
      console.error('❌ 교회 소식 목록 조회 실패:', error);
      return [];
    }
  },

  // 교회 행사 소식 상세 조회
  getChurchNewsDetail: async (id: number): Promise<ChurchNews | null> => {
    try {
      const response = await api.get(getApiUrl(`/community/church-news/${id}`));
      
      if (response.data.success && response.data.data) {
        return transformChurchNewsFromBackend(response.data.data);
      }
      
      return null;
    } catch (error: any) {
      console.error('교회 소식 상세 조회 실패:', error);
      return null;
    }
  },

  // 교회 행사 소식 등록
  createChurchNews: async (newsData: Partial<ChurchNews>): Promise<ChurchNews> => {
    try {
      // console.log('📰 [Supabase] 교회 소식 등록 중...', newsData);

      // 현재 사용자 정보 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      if (!currentUser?.user?.id) {
        throw new Error('로그인이 필요합니다.');
      }

      // Supabase Edge Function에 전송할 데이터 준비
      const requestData = {
        title: newsData.title,
        content: newsData.content,
        category: newsData.category,
        is_urgent: newsData.isUrgent || false,
        isUrgent: newsData.isUrgent || false,
        event_date: newsData.eventDate,
        eventDate: newsData.eventDate,
        location: newsData.location,
        attachments: newsData.attachments || [],
        author_id: currentUser.user?.id,
        author_name: currentUser.user?.user_metadata?.full_name || currentUser.user?.email || '익명',
        church_id: currentUser.user?.user_metadata?.church_id === 9998 ? null : currentUser.user?.user_metadata?.church_id,
        church_name: currentUser.user?.user_metadata?.church_id === 9998 ? null : currentUser.user?.user_metadata?.church_name,
        status: 'published'
      };

      // console.log('🔍 [Supabase] 전송할 데이터:', requestData);

      const { data, error } = await supabaseApiService.supabase.functions.invoke('church-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'temp-token': `temp_token_${currentUser.user?.id}_${Date.now()}`
        },
        body: requestData
      });

      if (error) {
        console.error('❌ church-news Edge Function 오류:', error);
        throw new Error(error.message || '교회 소식 등록에 실패했습니다.');
      }

      // console.log('✅ [Supabase] 교회 소식 등록 완료:', data);

      // 응답 데이터를 프론트엔드 형식으로 변환
      return {
        id: data.id,
        title: data.title,
        content: data.content,
        category: data.category,
        isUrgent: data.is_urgent || false,
        eventDate: data.event_date,
        location: data.location,
        attachments: data.attachments || [],
        authorId: data.author_id,
        authorName: data.author_name || '익명',
        churchId: data.church_id,
        churchName: data.church_name,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        viewCount: data.view_count || 0,
        userName: data.author_name || '익명',
        user_name: data.author_name || '익명'
      };

    } catch (error: any) {
      console.error('❌ 교회 소식 등록 실패:', error);
      throw error;
    }
  },

  // 교회 행사 소식 수정
  updateChurchNews: async (id: number, newsData: Partial<ChurchNews>): Promise<ChurchNews> => {
    try {
      const backendData = transformChurchNewsToBackend(newsData);
      const response = await api.put(getApiUrl(`/community/church-news/${id}`), backendData);
      
      if (response.data.success) {
        const detailData = await communityService.getChurchNewsDetail(id);
        if (detailData) {
          return detailData;
        }
      }
      
      throw new Error(response.data.message || '수정에 실패했습니다.');
    } catch (error: any) {
      console.error('교회 소식 수정 실패:', error);
      throw error;
    }
  },

  // 교회 행사 소식 삭제
  deleteChurchNews: async (id: number): Promise<boolean> => {
    try {
      const response = await api.delete(getApiUrl(`/community/church-news/${id}`));
      return response.data.success;
    } catch (error: any) {
      console.error('교회 소식 삭제 실패:', error);
      return false;
    }
  },

  // 교회 행사 소식 좋아요 토글
  toggleChurchNewsLike: async (id: number): Promise<{ liked: boolean; likes_count: number }> => {
    try {
      const response = await api.post(getApiUrl(`/community/church-news/${id}/like`));
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || '좋아요 처리에 실패했습니다.');
    } catch (error: any) {
      console.error('교회 소식 좋아요 토글 실패:', error);
      throw error;
    }
  }
};

// ==================== 교회 행사 소식 데이터 변환 함수 ====================

// 백엔드 → 프론트엔드 데이터 변환
function transformChurchNewsFromBackend(backendData: any): ChurchNews {
  // 백엔드에서 timezone 정보 없이 오는 경우 UTC로 명시
  let createdAt = backendData.created_at;
  if (createdAt && !createdAt.endsWith('Z') && !createdAt.includes('+')) {
    createdAt = createdAt + 'Z';
  }

  return {
    id: backendData.id,
    title: backendData.title,
    content: backendData.content,
    category: backendData.category,
    priority: backendData.priority,
    eventDate: backendData.event_date,
    eventTime: backendData.event_time,
    location: backendData.location,
    organizer: backendData.organizer,
    targetAudience: backendData.target_audience,
    participationFee: backendData.participation_fee,
    registrationRequired: backendData.registration_required || false,
    registrationDeadline: backendData.registration_deadline,
    contactPerson: backendData.contact_person,
    contactPhone: backendData.contact_phone,
    contactEmail: backendData.contact_email,
    status: backendData.status,
    view_count: backendData.view_count || 0,
    likes: backendData.likes || 0,
    comments: backendData.comments_count || 0,
    tags: backendData.tags || [],
    images: backendData.images || [],
    createdAt: createdAt,
    updatedAt: backendData.updated_at,
    author: backendData.author_name || '익명',
    author_name: backendData.author_name || '익명',
    authorId: backendData.author_id,
    churchName: backendData.church_name,
    church_name: backendData.church_name,
    churchId: backendData.church_id
  };
}

// 프론트엔드 → 백엔드 데이터 변환
function transformChurchNewsToBackend(frontendData: Partial<ChurchNews>): any {
  const backendData: any = {
    title: frontendData.title,
    content: frontendData.content,
    category: frontendData.category,
    organizer: frontendData.organizer,
    // PostgreSQL 배열 타입을 위해 null 대신 빈 배열 사용
    tags: Array.isArray(frontendData.tags) ? frontendData.tags : [],
    images: Array.isArray(frontendData.images) ? frontendData.images : []
  };

  // 백엔드 API 스키마에 맞게 선택적 필드들 매핑 (null 체크 추가)
  if (frontendData.priority !== undefined && frontendData.priority !== null) {
    backendData.priority = frontendData.priority;
  }
  if (frontendData.eventDate !== undefined && frontendData.eventDate !== null) {
    backendData.event_date = frontendData.eventDate;
  }
  if (frontendData.eventTime !== undefined && frontendData.eventTime !== null) {
    backendData.event_time = frontendData.eventTime;
  }
  if (frontendData.location !== undefined && frontendData.location !== null) {
    backendData.location = frontendData.location;
  }
  if (frontendData.targetAudience !== undefined && frontendData.targetAudience !== null) {
    backendData.target_audience = frontendData.targetAudience;
  }
  if (frontendData.participationFee !== undefined && frontendData.participationFee !== null) {
    backendData.participation_fee = frontendData.participationFee;
  }
  if (frontendData.registrationRequired !== undefined && frontendData.registrationRequired !== null) {
    backendData.registration_required = frontendData.registrationRequired;
  }
  if (frontendData.registrationDeadline !== undefined && frontendData.registrationDeadline !== null) {
    backendData.registration_deadline = frontendData.registrationDeadline;
  }
  if (frontendData.contactPerson !== undefined && frontendData.contactPerson !== null) {
    backendData.contact_person = frontendData.contactPerson;
  }
  if (frontendData.contactPhone !== undefined && frontendData.contactPhone !== null) {
    backendData.contact_phone = frontendData.contactPhone;
  }
  if (frontendData.contactEmail !== undefined && frontendData.contactEmail !== null) {
    backendData.contact_email = frontendData.contactEmail;
  }
  if (frontendData.status !== undefined && frontendData.status !== null) {
    backendData.status = frontendData.status;
  }

  // console.log('🔍 [CHURCH_NEWS] 최종 변환된 백엔드 데이터:', backendData);
  return backendData;
}

export default communityService;