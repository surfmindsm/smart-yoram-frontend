import { api, getApiUrl, userService } from './api';
import { formatCreatedAt } from '../utils/dateUtils';

// 교회 ID를 교회명으로 매핑하는 함수 (백엔드에서 church_name이 없는 경우 사용)
const getChurchNameById = (churchId: number): string | null => {
  if (churchId === 9998) return null; // 협력사

  // 기본 매핑 - 향후 필요시 더 추가 가능
  const churchMapping: { [key: number]: string } = {
    6: '성광교회',
  };

  return churchMapping[churchId] || `교회 ${churchId}`;
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
      const user = usersCache.find(u => u.id === authorId);
      return user ? (user.full_name || user.name || user.username || `사용자${authorId}`) : null;
    }

    // 캐시가 없거나 만료되었으면 API 호출
    console.log('👥 사용자 목록 API 호출 중...');
    const users = await userService.getUsers();
    usersCache = users;
    usersCacheTime = now;

    const user = users.find((u: any) => u.id === authorId);
    return user ? (user.full_name || user.name || user.username || `사용자${authorId}`) : null;
  } catch (error) {
    console.error('👥 사용자 조회 실패:', error);
    return null;
  }
};


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
  priority: 'urgent' | 'important' | 'normal';
  eventDate?: string;
  eventTime?: string;
  location?: string;
  organizer: string;
  targetAudience?: string;
  participationFee?: string;
  registrationMethod?: string;
  registrationRequired?: boolean;
  registrationDeadline?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  additionalInfo?: string;
  status: 'active' | 'completed' | 'cancelled';
  views: number;
  likes: number;
  comments: number;
  tags?: string[];
  imageUrls?: string[];
  images?: string[];
  userName?: string;
  author?: string;
  authorId?: number;
  churchName?: string;
  churchId?: number;
  createdAt: string;
  updatedAt?: string;
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
  location: string;
  contactInfo: string;
  status: 'available' | 'reserved' | 'completed';
  createdAt: string;
  views: number;
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
  requestedItem: string;
  quantity: number;
  reason: string;
  neededDate: string;
  church: string | null;
  location: string;
  contactInfo: string;
  status: 'requesting' | 'matching' | 'completed';
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  urgency: 'low' | 'medium' | 'high' | 'normal'; // 백엔드 호환성을 위해 normal 추가
  userName?: string; // 사용자명 필드 추가
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
  deliveryMethod: string;
  status: 'available' | 'reserved' | 'completed';
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  userName?: string; // 사용자명 필드 추가
  images?: string[]; // 이미지 필드 추가
  contactInfo?: string; // 연락처 정보 필드 추가
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
  status: 'open' | 'closed';
  createdAt: string;
  views: number;
  likes: number;
  applications: number;
  contactInfo?: string; // 연락처 정보 필드 추가
  userName?: string; // 사용자명 필드 추가
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
  views: number;
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
  instruments: string[];
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
  views: number;
  likes: number;
  created_at: string;
  createdAt: string; // camelCase 변환용 - component compatibility
  updated_at?: string;
  author_id: number;
  user_name: string;
  church_id: number;
  author_name?: string; // 백엔드에서 새로 추가된 작성자 이름 필드
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
  preferredGenre?: string[];       // 제거되었지만 호환성을 위해 optional로 유지
  preferredLocation: string[];     // 배열 타입
  availability?: string;           // 기존 호환성
  availableDays: string[];         // 새로 추가된 필드
  availableTime?: string;          // 새로 추가된 필드
  contactPhone: string;            // contact_phone 매핑
  contactEmail?: string;           // contact_email 매핑
  status: 'available' | 'interviewing' | 'inactive';
  createdAt: string;
  created_at?: string;             // 백엔드 호환성
  views: number;
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
  contact: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  views: number;
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
  createdAt: string;
  prayerCount: number;
  views: number;
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
    preferredLocation: backendData.preferred_location || [],
    availability: '', // 호환성
    availableDays: backendData.available_days || [],
    availableTime: backendData.available_time,
    contactPhone: backendData.contact_phone,
    contactEmail: backendData.contact_email,
    status: backendData.status || 'available',
    createdAt: backendData.created_at || '',
    views: backendData.views || 0,
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
      console.log('🏠 커뮤니티 통계 API 호출 중...');
      const response = await api.get(getApiUrl('/community/stats'));
      console.log('✅ 커뮤니티 통계 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: {...} } 형태인 경우 처리
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 커뮤니티 통계 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      throw error;
    }
  },

  getRecentPosts: async (limit: number = 10): Promise<RecentPost[]> => {
    try {
      console.log('📄 최근 게시글 API 호출 중...');
      const response = await api.get(getApiUrl('/community/recent-posts'), {
        params: { limit }
      });
      console.log('✅ 최근 게시글 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 최근 게시글 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      throw error;
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
      console.log('📦 무료 나눔 API 호출 중...', params);
      const response = await api.get(getApiUrl('/community/sharing'), { params });
      console.log('✅ 무료 나눔 API 응답:', response.data);
      console.log('✅ 무료 나눔 데이터 상세:', response.data?.data);
      console.log('✅ 첫 번째 아이템 구조:', response.data?.data?.[0]);
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // 백엔드 필드명을 프론트엔드 인터페이스에 맞게 변환
        const transformedData = response.data.data.map((item: any): SharingItem => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || getChurchNameById(item.church_id));
          
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            condition: item.condition || '양호',
            quantity: item.quantity || 1,
            images: (() => {
              if (!item.images) return [];
              
              let imageArray: string[];
              if (typeof item.images === 'string') {
                // 백엔드에서 문자열로 저장된 JSON 배열을 파싱
                try {
                  imageArray = JSON.parse(item.images);
                } catch (e) {
                  console.warn('이미지 JSON 파싱 실패:', item.images);
                  return [];
                }
              } else {
                imageArray = Array.isArray(item.images) ? item.images : [];
              }
              
              return imageArray.map((img: string) => 
                img.startsWith('http') ? img : `https://api.surfmind-team.com/static/community/images/${img}`
              );
            })(),
            church: churchName,
            location: item.location,
            contactInfo: item.contact_info || item.contactInfo, // snake_case를 camelCase로 변환
            status: item.status,
            createdAt: item.created_at || item.createdAt || null, // snake_case를 camelCase로 변환, null인 경우 null 유지
            views: item.view_count || item.views || 0, // snake_case를 camelCase로 변환
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: item.author_name || item.user_name || item.userName || '익명' // author_name 우선 사용
          };
        });
        console.log('🔄 변환된 데이터:', transformedData);
        return transformedData;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || item.user_name || item.userName || '익명' // author_name 우선 사용
          };
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    } catch (error: any) {
      console.error('❌ 무료 나눔 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  createSharingItem: async (itemData: Partial<SharingItem>): Promise<SharingItem> => {
    try {
      console.log('📝 무료 나눔 등록 API 호출 중...', itemData);
      const response = await api.post(getApiUrl('/community/sharing'), itemData);
      console.log('✅ 무료 나눔 등록 API 응답:', response.data);
      console.log('✅ 등록된 아이템 데이터:', response.data?.data);
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('❌ 무료 나눔 등록 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
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
      // 사용자 캐시 로드 (author_id -> 사용자명 매핑용)
      const now = Date.now();
      if (!usersCache || (now - usersCacheTime) >= CACHE_DURATION) {
        try {
          console.log('👥 사용자 목록 로드 중...');
          const users = await userService.getUsers();
          usersCache = users;
          usersCacheTime = now;
          console.log('👥 사용자 캐시 로드 완료:', users.length, '명');
        } catch (error) {
          console.error('👥 사용자 캐시 로드 실패:', error);
        }
      }

      console.log('📝 물품 요청 API 호출:', params);
      const response = await api.get(getApiUrl('/community/item-request'), { params });
      console.log('✅ 물품 요청 API 응답:', response.data);
      console.log('✅ 물품 요청 데이터 상세:', response.data?.data);
      console.log('✅ 첫 번째 아이템 구조:', response.data?.data?.[0]);

      // DB에서 온 원본 데이터 상세 분석
      if (response.data?.data?.[0]) {
        const firstItem = response.data.data[0];
        console.log('🔍 DB 원본 데이터 분석:');
        console.log('📊 사용자 관련 필드들:', {
          author_id: firstItem.author_id,
          author_name: firstItem.author_name,
          user_name: firstItem.user_name,
          userName: firstItem.userName
        });
        console.log('🏛️ 교회 관련 필드들:', {
          church_id: firstItem.church_id,
          church_name: firstItem.church_name,
          church: firstItem.church
        });
        console.log('📅 날짜 관련 필드들:', {
          created_at: firstItem.created_at,
          updated_at: firstItem.updated_at,
          createdAt: firstItem.createdAt
        });
        console.log('📋 전체 필드 목록:', Object.keys(firstItem));
      }

      // 현재 로그인한 사용자 정보 확인
      try {
        const currentUserStr = localStorage.getItem('user');
        const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
        console.log('👤 현재 로그인한 사용자:', {
          id: currentUser?.id,
          name: currentUser?.name || currentUser?.username || currentUser?.full_name,
          church_id: currentUser?.church_id
        });
      } catch (e) {
        console.log('👤 현재 사용자 정보 없음');
      }

      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // 백엔드 필드명을 프론트엔드 인터페이스에 맞게 변환 (무료나눔과 동일한 방식)
        const transformedData = response.data.data.map((item: any, index: number): RequestItem => {
          // 교회명 처리 과정 로깅
          console.log(`🔄 아이템 ${index + 1} 변환 과정:`);

          const step1 = item.church_name;
          const step2 = item.church;
          const step3 = getChurchNameById(item.church_id);
          // church_id 9998(협력사)인 경우 백엔드 church_name 무시하고 null 처리
          const finalChurchName = item.church_id === 9998 ? null : (step1 || step2 || step3);

          console.log('🏛️ 교회명 변환 단계:', {
            '1단계_church_name': step1,
            '2단계_church': step2,
            '3단계_getChurchNameById결과': step3,
            '최종_churchName': finalChurchName
          });

          // author_id로 사용자명 조회 (author_name이 없는 경우)
          let finalUserName = item.author_name || item.user_name || item.userName;

          // author_name이 없으면 사용자 캐시에서 조회
          if (!finalUserName && item.author_id) {
            if (usersCache) {
              const user = usersCache.find(u => u.id === item.author_id);
              finalUserName = user ? (user.full_name || user.name || user.username || `사용자${item.author_id}`) : null;
            }
          }

          finalUserName = finalUserName || '익명';
          console.log('👤 사용자명 변환:', {
            'author_id': item.author_id,
            'author_name': item.author_name,
            'user_name': item.user_name,
            'userName': item.userName,
            '최종_userName': finalUserName
          });

          const finalCreatedAt = item.created_at || item.createdAt || null;
          console.log('📅 등록일 변환:', {
            'created_at': item.created_at,
            'createdAt': item.createdAt,
            '최종_createdAt': finalCreatedAt
          });

          return {
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            requestedItem: item.requested_item || item.requestedItem || item.title,
            quantity: item.quantity || 1,
            reason: item.reason || item.description || '요청 사유 없음',
            urgency: item.urgency || item.urgency_level || 'medium',
            neededDate: item.needed_date || item.neededDate || '',
            church: finalChurchName,
            location: item.location,
            contactInfo: item.contact_info || item.contactInfo || '',
            status: item.status,
            createdAt: finalCreatedAt,
            views: item.view_count || item.views || 0,
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: finalUserName
          };
        });

        console.log('🎯 최종 변환된 데이터:', transformedData);
        console.log('📤 프론트엔드로 전달되는 첫 번째 아이템:', transformedData[0]);
        return transformedData;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));

          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || item.user_name || item.userName || '익명' // author_name 우선 사용
          };
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    } catch (error: any) {
      console.error('물품 요청 조회 실패:', error);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  createRequestItem: async (itemData: Partial<RequestItem>): Promise<RequestItem> => {
    try {
      
      // 백엔드 필드명에 맞게 변환
      const transformedData = {
        ...itemData,
        urgency_level: (itemData as any).urgency,
        contact_info: itemData.contactInfo,
        needed_date: (itemData as any).neededDate,
        requested_item: (itemData as any).requestedItem,
        max_budget: (itemData as any).maxBudget,
        contact_phone: (itemData as any).contactPhone,
        contact_email: (itemData as any).contactEmail
      };
      
      // 프론트엔드 전용 필드 제거
      delete (transformedData as any).urgency;
      delete (transformedData as any).contactInfo;
      delete (transformedData as any).neededDate;
      delete (transformedData as any).requestedItem;
      delete (transformedData as any).maxBudget;
      delete (transformedData as any).contactPhone;
      delete (transformedData as any).contactEmail;
      
      const response = await api.post(getApiUrl('/community/item-request'), transformedData);
      
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('물품 요청 등록 실패:', error);
      throw error;
    }
  },

  updateRequestItem: async (itemId: number, itemData: Partial<RequestItem>): Promise<RequestItem> => {
    try {
      const response = await api.put(getApiUrl(`/community/item-request/${itemId}`), itemData);
      return response.data;
    } catch (error: any) {
      console.error('물품 요청 수정 실패:', error);
      throw error;
    }
  },

  deleteRequestItem: async (itemId: number): Promise<void> => {
    try {
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
      const response = await api.get(getApiUrl('/community/item-sale'), { params });
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // 백엔드 필드명을 프론트엔드 인터페이스에 맞게 변환 (FreeSharing과 동일)
        const transformedData = response.data.data.map((item: any): OfferItem => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || getChurchNameById(item.church_id));
          
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
            images: (() => {
              if (!item.images) return [];
              
              let imageArray: string[];
              if (typeof item.images === 'string') {
                // 백엔드에서 문자열로 저장된 JSON 배열을 파싱
                try {
                  imageArray = JSON.parse(item.images);
                } catch (e) {
                  console.warn('이미지 JSON 파싱 실패:', item.images);
                  return [];
                }
              } else {
                imageArray = Array.isArray(item.images) ? item.images : [];
              }
              
              return imageArray.map((img: string) => 
                img.startsWith('http') ? img : `https://api.surfmind-team.com/static/community/images/${img}`
              );
            })(),
            church: churchName,
            location: item.location,
            contactInfo: item.contact_info || item.contactInfo,
            status: item.status,
            createdAt: item.created_at || item.createdAt || null,
            views: item.view_count || item.views || 0,
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: item.author_name || item.user_name || item.userName || '익명' // author_name 우선 사용
          };
        });
        return transformedData;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any): OfferItem => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
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
            images: (() => {
              if (!item.images) return [];
              let imageArray: string[];
              if (typeof item.images === 'string') {
                try {
                  imageArray = JSON.parse(item.images);
                } catch (e) {
                  console.warn('이미지 JSON 파싱 실패:', item.images);
                  return [];
                }
              } else {
                imageArray = Array.isArray(item.images) ? item.images : [];
              }
              return imageArray.map((img: string) => 
                img.startsWith('http') ? img : `https://api.surfmind-team.com/static/community/images/${img}`
              );
            })(),
            church: churchName,
            location: item.location,
            contactInfo: item.contact_info || item.contactInfo || '',
            status: item.status,
            createdAt: item.created_at || item.createdAt || null,
            views: item.view_count || item.views || 0,
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: item.author_name || item.user_name || item.userName || '익명' // author_name 우선 사용
          };
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    } catch (error: any) {
      console.error('물품 판매 조회 실패:', error);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  createOfferItem: async (itemData: Partial<OfferItem>): Promise<OfferItem> => {
    try {
      const response = await api.post(getApiUrl('/community/item-sale'), itemData);
      return response.data;
    } catch (error: any) {
      console.error('물품 판매 등록 실패:', error);
      throw error;
    }
  },

  updateOfferItem: async (itemId: number, itemData: Partial<OfferItem>): Promise<OfferItem> => {
    try {
      const response = await api.put(getApiUrl(`/community/item-sale/${itemId}`), itemData);
      return response.data;
    } catch (error: any) {
      console.error('물품 판매 수정 실패:', error);
      throw error;
    }
  },

  deleteOfferItem: async (itemId: number): Promise<void> => {
    try {
      await api.delete(getApiUrl(`/community/item-sale/${itemId}`));
    } catch (error: any) {
      console.error('물품 판매 삭제 실패:', error);
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
      console.log('💼 구인 공고 API 호출 중...', params);
      const response = await api.get(getApiUrl('/community/job-posting'), { params });
      console.log('✅ 구인 공고 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const transformedData = response.data.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_name || item.church || item.company || getChurchNameById(item.church_id);
          
          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || item.user_name || item.userName || '익명', // author_name 우선 사용
            // 백엔드 응답 필드명을 프론트엔드 인터페이스에 맞게 변환
            company: item.company || item.company_name,
            position: item.position || item.job_type,
            salary: item.salary || item.salary_range,
            views: item.views || item.view_count || 0,
            deadline: item.deadline || item.expires_at,
            createdAt: item.createdAt || item.created_at,
            description: item.description,
            contactInfo: item.contact_info || item.contactInfo
          };
        });
        return transformedData;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || item.user_name || item.userName || '익명', // author_name 우선 사용
            // 백엔드 응답 필드명을 프론트엔드 인터페이스에 맞게 변환
            company: item.company || item.company_name,
            position: item.position || item.job_type,
            salary: item.salary || item.salary_range,
            views: item.views || item.view_count || 0,
            deadline: item.deadline || item.expires_at,
            createdAt: item.createdAt || item.created_at,
            description: item.description,
            contactInfo: item.contact_info || item.contactInfo
          };
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    } catch (error: any) {
      console.error('❌ 구인 공고 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  getJobPost: async (jobId: number): Promise<JobPost | null> => {
    try {
      console.log('💼 구인 공고 상세 조회 API 호출 중...', jobId);
      const response = await api.get(getApiUrl(`/community/job-posting/${jobId}`));
      console.log('✅ 구인 공고 상세 조회 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: {...} } 형태인 경우 처리
      if (response.data && response.data.success && response.data.data) {
        const item = response.data.data;
        // 교회 9998의 경우 null로 처리
        const churchName = item.church || item.company || getChurchNameById(item.church_id);
        
        return {
          ...item,
          church: churchName,
          churchName: churchName,
          userName: item.user_name || item.userName || '익명',
          // 백엔드 응답 필드명을 프론트엔드 인터페이스에 맞게 변환
          company: item.company || item.company_name,
          position: item.position || item.job_type,
          salary: item.salary || item.salary_range,
          views: item.views || item.view_count || 0,
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
          userName: item.user_name || item.userName || '익명',
          // 백엔드 응답 필드명을 프론트엔드 인터페이스에 맞게 변환
          company: item.company || item.company_name,
          position: item.position || item.job_type,
          salary: item.salary || item.salary_range,
          views: item.views || item.view_count || 0,
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
      console.log('💼 구인 공고 등록 API 호출 중...', postData);
      
      // 백엔드 API 스키마에 맞게 데이터 변환
      const apiData = {
        title: postData.title,
        company: postData.churchName, // 교회명을 company 필드로 전송
        position: postData.position,
        employment_type: postData.jobType,
        location: postData.location,
        salary_range: postData.salary,
        description: postData.description,
        requirements: Array.isArray(postData.requirements) 
          ? postData.requirements.join(', ')  // 배열을 쉼표로 구분된 문자열로 변환
          : postData.requirements,
        benefits: Array.isArray(postData.benefits)
          ? postData.benefits.join(', ')      // 배열을 쉼표로 구분된 문자열로 변환
          : postData.benefits,
        contact_method: "기타", // 기본값
        contact_info: postData.contactInfo || postData.contactPhone + (postData.contactEmail ? ` | ${postData.contactEmail}` : ''),
        expires_at: postData.deadline,
        status: postData.status || "open"
      };
      
      console.log('🔄 변환된 API 데이터:', apiData);
      
      const response = await api.post(getApiUrl('/community/job-posting'), apiData);
      console.log('✅ 구인 공고 등록 API 응답:', response.data);
      
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('❌ 구인 공고 등록 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
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
      console.log('👥 구직 신청 API 호출 중...', params);
      const response = await api.get(getApiUrl('/community/job-seeking'), { params });
      console.log('✅ 구직 신청 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || item.user_name || item.userName || '익명' // author_name 우선 사용
          };
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      console.warn('예상치 못한 API 응답 구조:', response.data);
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
      console.log('👤 구직 신청 등록 API 호출 중...', seekerData);
      
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
        
        console.log('📄 이력서 파일과 함께 FormData 전송');
        
        const response = await api.post(getApiUrl('/community/job-seekers'), formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log('✅ 구직 신청 등록 (파일 포함) API 응답:', response.data);
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
        
        console.log('🔄 변환된 API 데이터:', apiData);
        
        const response = await api.post(getApiUrl('/community/job-seekers'), apiData);
        console.log('✅ 구직 신청 등록 API 응답:', response.data);
        
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
    instruments?: string; // 악기 필터
    status?: string; // 상태 필터
    search?: string; // 제목/내용 검색
    page?: number; // 페이지 번호
    limit?: number; // 페이지당 항목 수
  }): Promise<MusicRecruitment[]> => {
    try {
      console.log('🎵 음악팀 모집 API 호출 중...', params);
      const apiUrl = getApiUrl('/community/music-team-recruitments');
      console.log('🔗 API URL:', apiUrl);
      const response = await api.get(apiUrl, { params });
      console.log('✅ 음악팀 모집 API 응답:', response.data);
      
      // 디버깅: formatCreatedAt 함수 테스트
      const testDate = '2024-09-13T05:00:00.000Z';
      const formattedResult = formatCreatedAt(testDate);
      console.log('🔍 [DEBUG] formatCreatedAt 테스트:', {
        input: testDate,
        output: formattedResult,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      // 첫 번째 아이템의 created_at 값 상세 로그
      if (response.data?.data?.[0]) {
        const firstItem = response.data.data[0];
        console.log('🕐 첫 번째 아이템 created_at 분석:', {
          created_at: firstItem.created_at,
          createdAt: firstItem.createdAt,
          updated_at: firstItem.updated_at,
          id: firstItem.id,
          title: firstItem.title,
          'Object.keys': Object.keys(firstItem)
        });
      }
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const transformedData = response.data.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          // spread operator 사용 후 override 방식으로 중복 키 문제 해결
          const transformed = {
            ...item,
            church: churchName,
            churchName: churchName,
            userName: item.author_name || item.user_name || item.userName || '익명', // author_name 우선 사용
            views: item.view_count || item.views || 0 // view_count를 views로 통일
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
            console.log('🔍 [TRANSFORM_DEBUG] ID 6 변환 결과:', {
              original_created_at: item.created_at,
              fixed_createdAt: createdAt,
              transformed_createdAt: transformed.createdAt,
              formatCreatedAt_result: transformed.createdAt ? formatCreatedAt(transformed.createdAt) : 'null'
            });
          }
          
          return transformed;
        });
        return transformedData;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          // spread operator 사용 후 override 방식으로 중복 키 문제 해결
          const transformed = {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || item.user_name || item.userName || '익명', // author_name 우선 사용
            views: item.view_count || item.views || 0 // view_count를 views로 통일
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
            console.log('🔍 [TRANSFORM_DEBUG] ID 6 변환 결과:', {
              original_created_at: item.created_at,
              fixed_createdAt: createdAt,
              transformed_createdAt: transformed.createdAt,
              formatCreatedAt_result: transformed.createdAt ? formatCreatedAt(transformed.createdAt) : 'null'
            });
          }
          
          return transformed;
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      console.warn('예상치 못한 API 응답 구조:', response.data);
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
      console.log('🎵 행사팀 모집 등록 API 호출 중...', recruitmentData);
      
      // 실제 백엔드 SQL 스키마에 정확히 맞게 데이터 변환 (community_music_teams 테이블 기준)
      const apiData = {
        // 기본 정보 (필수)
        title: recruitmentData.title,
        team_name: recruitmentData.churchName,
        team_type: recruitmentData.eventType,
        
        // 모집 상세 - 백엔드 SQL 필드명에 맞춤
        instruments_needed: recruitmentData.instruments || [], // JSON 배열로 직접 전송
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
        
        // 통계 필드들 (백엔드에서 자동 설정될 것으로 예상되지만 명시적으로 포함)
        views: 0,
        likes: 0,
        applicants_count: recruitmentData.applications || 0
        
        // created_at, updated_at은 백엔드에서 자동 설정되므로 전송하지 않음
        // 사용자 정보는 백엔드에서 JWT 토큰을 통해 자동으로 설정됨
      };
      
      console.log('🔄 변환된 API 데이터:', apiData);
      
      const response = await api.post(getApiUrl('/community/music-team-recruitments'), apiData);
      console.log('✅ 행사팀 모집 등록 API 응답:', response);
      console.log('📊 응답 상태 코드:', response.status);
      console.log('📋 응답 헤더:', response.headers);
      console.log('📄 응답 데이터:', response.data);
      
      // 성공적인 등록인지 확인
      if (response.status === 200 || response.status === 201) {
        console.log('✅ API 호출 성공 - 상태 코드:', response.status);
        
        // 응답 데이터 확인
        const result = response.data?.data || response.data;
        
        // success 필드가 false인 경우 (백엔드 에러)
        if (result && result.success === false) {
          console.error('🚫 백엔드에서 에러 발생:', result.message);
          throw new Error(result.message || '서버에서 등록 처리 중 오류가 발생했습니다.');
        }
        
        // ID 확인
        if (result && result.id) {
          console.log('🆔 생성된 ID:', result.id);
          return result;
        } else {
          console.warn('⚠️ 응답에 ID가 없습니다. DB 저장 실패 가능성');
          return result;
        }
      } else {
        console.error('❌ 예상치 못한 응답 코드:', response.status);
        throw new Error(`예상치 못한 응답 코드: ${response.status}`);
      }
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
      console.log('🎶 음악팀 지원자 목록 API 호출 중...', params);
      
      // Query parameters 준비
      const queryParams = {
        page: params?.page || 1,
        limit: params?.limit || 20,
        ...(params?.status && { status: params.status }),
        ...(params?.instrument && { instrument: params.instrument }),
        ...(params?.location && { location: params.location }),
        ...(params?.day && { day: params.day }),
        ...(params?.time && { time: params.time }),
        ...(params?.search && { search: params.search })
      };
      
      const response = await api.get(getApiUrl('/music-team-seekers'), { params: queryParams });
      console.log('✅ 음악팀 지원자 목록 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: { items: [...] } } 형태
      if (response.data?.success && response.data?.data?.items) {
        const items = response.data.data.items;
        return items.map((item: any) => {
          return {
            id: item.id,
            title: item.title,
            name: item.author_name || item.name,
            teamName: item.team_name,
            instrument: item.instrument,
            experience: item.experience,
            portfolio: item.portfolio,
            preferredLocation: item.preferred_location || [],
            availableDays: item.available_days || [],
            availableTime: item.available_time,
            contactPhone: item.contact_phone,
            contactEmail: item.contact_email,
            status: item.status,
            authorName: item.author_name,
            churchName: item.church_name,
            views: item.views || 0,
            likes: item.likes || 0,
            matches: item.matches || 0,
            applications: item.applications || 0,
            createdAt: item.created_at || '',
            userName: item.author_name
          };
        });
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    } catch (error: any) {
      console.error('❌ 음악팀 지원자 목록 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  getMusicSeekerById: async (id: number): Promise<MusicSeeker | null> => {
    try {
      console.log('🎶 음악팀 지원자 상세 API 호출 중...', id);
      const response = await api.get(getApiUrl(`/music-team-seekers/${id}`));
      console.log('✅ 음악팀 지원자 상세 API 응답:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return {
          id: response.data.data.id,
          title: response.data.data.title,
          name: response.data.data.author_name || response.data.data.name,
          teamName: response.data.data.team_name,
          instrument: response.data.data.instrument,
          experience: response.data.data.experience,
          portfolio: response.data.data.portfolio,
          preferredLocation: response.data.data.preferred_location || [],
          availableDays: response.data.data.available_days || [],
          availableTime: response.data.data.available_time,
          contactPhone: response.data.data.contact_phone,
          contactEmail: response.data.data.contact_email,
          status: response.data.data.status,
          authorName: response.data.data.author_name,
          churchName: response.data.data.church_name,
          views: response.data.data.views || 0,
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
      console.log('🎶 음악팀 지원서 등록 API 호출 중...', seekerData);
      
      // Frontend → Backend 데이터 변환
      // 백엔드 PostgreSQL 스키마에 맞게 배열 처리
      const backendData = {
        title: seekerData.title,
        team_name: seekerData.teamName || null,
        instrument: seekerData.instrument,
        experience: seekerData.experience || null,
        portfolio: seekerData.portfolio || null,
        preferred_location: seekerData.preferredLocation || [],
        available_days: seekerData.availableDays || [],
        available_time: seekerData.availableTime || null,
        contact_phone: seekerData.contactPhone,
        contact_email: seekerData.contactEmail || null
      };
      
      console.log('🔍 전송할 백엔드 데이터:', JSON.stringify(backendData, null, 2));
      
      const response = await api.post(getApiUrl('/music-team-seekers'), backendData);
      console.log('✅ 음악팀 지원서 등록 API 응답:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 음악팀 지원서 등록 실패:', error);
      throw error;
    }
  },

  updateMusicSeeker: async (seekerId: number, seekerData: any): Promise<any> => {
    try {
      console.log('🎶 음악팀 지원서 수정 API 호출 중...', seekerId, seekerData);
      
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
      console.log('✅ 음악팀 지원서 수정 API 응답:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 음악팀 지원서 수정 실패:', error);
      throw error;
    }
  },

  deleteMusicSeeker: async (seekerId: number): Promise<void> => {
    try {
      console.log('🎶 음악팀 지원서 삭제 API 호출 중...', seekerId);
      const response = await api.delete(getApiUrl(`/music-team-seekers/${seekerId}`));
      console.log('✅ 음악팀 지원서 삭제 API 응답:', response.data);
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
      console.log('🎪 교회 행사 API 호출 중...', params);
      const response = await api.get(getApiUrl('/community/church-events'), { params });
      console.log('✅ 교회 행사 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || item.user_name || item.userName || '익명' // author_name 우선 사용
          };
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      console.warn('예상치 못한 API 응답 구조:', response.data);
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
      console.log('🙏 기도 요청 API 호출 중...', params);
      const response = await api.get(getApiUrl('/community/prayer-requests'), { params });
      console.log('✅ 기도 요청 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || item.user_name || item.userName || '익명' // author_name 우선 사용
          };
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      console.warn('예상치 못한 API 응답 구조:', response.data);
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
      const response = await api.get(getApiUrl('/community/my-posts'), { params });
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church_name || item.church || item.churchName || getChurchNameById(item.church_id));
          
          return {
            ...item,
            church: churchName,
            churchName: churchName, // JobPost의 경우 churchName 필드 사용
            userName: item.author_name || item.user_name || item.userName || '익명' // author_name 우선 사용
          };
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    } catch (error: any) {
      console.error('❌ 내 게시글 조회 실패:', error);

      if (error.response) {
        console.error('📊 API 응답 에러:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url
        });

        if (error.response.status === 403) {
          console.error('🚫 JWT 인증 오류 - abc.md 문서의 "인증 오류 해결 방법" 참고');
          console.error('💡 해결 방법:');
          console.error('  1. localStorage에서 access_token 확인');
          console.error('  2. 토큰 형식 확인: Bearer ${token}');
          console.error('  3. 토큰 만료 여부 확인');
          console.error('  4. 재로그인 시도');
        }
      } else if (error.request) {
        console.error('📡 네트워크 요청 실패:', error.request);
      } else {
        console.error('⚠️ 기타 오류:', error.message);
      }

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
      const response = await api.get(getApiUrl('/community/admin/posts'), { params });
      return response.data;
    } catch (error: any) {
      console.error('관리자 게시글 조회 실패:', error);
      throw error;
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
      console.log('🔍 [CHURCH_NEWS] API 호출:', params);
      
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.category && params.category !== 'all') queryParams.append('category', params.category);
      if (params?.priority && params.priority !== 'all') queryParams.append('priority', params.priority);
      if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.event_date_from) queryParams.append('event_date_from', params.event_date_from);
      if (params?.event_date_to) queryParams.append('event_date_to', params.event_date_to);

      const url = getApiUrl(`/community/church-news${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
      console.log('🔍 [CHURCH_NEWS] 요청 URL:', url);

      const response = await api.get(url);
      console.log('🔍 [CHURCH_NEWS] API 응답:', response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data.map((item: any) => transformChurchNewsFromBackend(item));
      }
      
      return [];
    } catch (error: any) {
      console.error('교회 소식 목록 조회 실패:', error);
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
      console.log('🔍 [CHURCH_NEWS] 등록 데이터:', newsData);
      
      // 프론트엔드 → 백엔드 형식 변환
      const backendData = transformChurchNewsToBackend(newsData);
      console.log('🔍 [CHURCH_NEWS] 백엔드 전송 데이터:', backendData);
      
      console.log('🔍 [CHURCH_NEWS] API 요청 URL:', getApiUrl('/community/church-news'));
      console.log('🔍 [CHURCH_NEWS] API 요청 전송 시작...');

      const response = await api.post(getApiUrl('/community/church-news'), backendData);
      console.log('🔍 [CHURCH_NEWS] 등록 응답:', response.data);
      console.log('🔍 [CHURCH_NEWS] Response Status:', response.status);
      
      if (response.data.success) {
        // 등록 후 상세 조회로 전체 데이터 반환
        const detailData = await communityService.getChurchNewsDetail(response.data.data.id);
        if (detailData) {
          return detailData;
        }
      }
      
      throw new Error(response.data.message || '등록에 실패했습니다.');
    } catch (error: any) {
      console.error('교회 소식 등록 실패:', error);
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
    views: backendData.view_count || 0,
    likes: backendData.likes || 0,
    comments: backendData.comments_count || 0,
    tags: backendData.tags || [],
    images: backendData.images || [],
    createdAt: createdAt,
    updatedAt: backendData.updated_at,
    author: backendData.author_name || '익명',
    authorId: backendData.author_id,
    churchName: backendData.church_name,
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

  console.log('🔍 [CHURCH_NEWS] 최종 변환된 백엔드 데이터:', backendData);
  return backendData;
}

export default communityService;