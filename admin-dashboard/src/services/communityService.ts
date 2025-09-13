import { api, getApiUrl } from './api';

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
  createdAt: string; // camelCase 변환용
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
    created_at: backendData.created_at,
    views: backendData.views || 0,
    likes: backendData.likes || 0,
    matches: backendData.matches || 0,
    applications: backendData.applications || 0,
    userName: backendData.author_name || '익명',
    author_name: backendData.author_name,
    authorName: backendData.author_name,
    church: backendData.church_id === 9998 ? null : backendData.church_name,
    church_name: backendData.church_name,
    churchName: backendData.church_name,
    location: backendData.location,
    contact_phone: backendData.contact_phone,
    introduction: backendData.introduction
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
          const churchName = item.church_id === 9998 ? null : (item.church || `교회 ${item.church_id}`);
          
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
            createdAt: item.created_at || item.createdAt, // snake_case를 camelCase로 변환
            views: item.view_count || item.views || 0, // snake_case를 camelCase로 변환
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: item.author_name || item.user_name || item.userName || '익명' // author_name 우선 사용 // 사용자명 추가
          };
        });
        console.log('🔄 변환된 데이터:', transformedData);
        return transformedData;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church || item.churchName || `교회 ${item.church_id}`);
          
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
      console.log('물품 요청 API 호출:', params);
      console.log('🌐 API URL:', getApiUrl('/community/item-requests'));
      
      // 다른 가능한 엔드포인트들도 시도해보자
      let response;
      const possibleEndpoints = [
        '/community/item-requests',
        '/community/item-request', 
        '/community/requests',
        '/community/request-items'
      ];
      
      console.log('🔄 시도할 엔드포인트들:', possibleEndpoints);
      
      // 먼저 파라미터 없이 전체 데이터 요청해보기
      console.log('🔍 파라미터 없이 전체 데이터 요청 중...');
      const responseAll = await api.get(getApiUrl('/community/item-request'));
      console.log('📊 전체 데이터 응답:', responseAll.data);
      console.log('📊 전체 데이터 길이:', responseAll.data?.data?.length || 0);
      
      // 원래 파라미터로 요청
      console.log('🔍 파라미터와 함께 요청 중...');
      // 500 에러 발생하는 엔드포인트 대신 다른 것 시도
      response = await api.get(getApiUrl('/community/item-request'), { params });
      console.log('물품 요청 API 응답:', response.data);
      console.log('📊 응답 상세:', { 
        status: response.status, 
        dataType: typeof response.data, 
        isArray: Array.isArray(response.data),
        isSuccess: response.data?.success,
        dataLength: response.data?.data?.length,
        directArrayLength: Array.isArray(response.data) ? response.data.length : null
      });
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log('✅ 첫 번째 조건 매칭: success 래핑된 응답');
        const transformedData = response.data.data.map((item: any): RequestItem => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church || `교회 ${item.church_id}`);
          
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            requestedItem: item.requested_item || item.requestedItem || item.title, // 없으면 제목 사용
            quantity: item.quantity || 1,
            reason: item.reason || item.description || '요청 사유 없음', // reason이 없으면 description 사용
            urgency: item.urgency || item.urgency_level || 'medium', // normal 값도 그대로 허용
            neededDate: item.needed_date || item.neededDate || '',
            church: churchName,
            location: item.location,
            contactInfo: item.contact_info || item.contactInfo || '',
            status: item.status,
            createdAt: item.created_at || item.createdAt,
            views: item.view_count || item.views || 0,
            likes: item.likes || 0,
            comments: item.comments || 0,
            userName: item.author_name || item.user_name || item.userName || '익명' // author_name 우선 사용
          };
        });
        console.log('변환된 물품 요청 데이터:', transformedData.length, '개');
        return transformedData;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        console.log('✅ 두 번째 조건 매칭: 직접 배열 응답, 길이:', response.data.length);
        console.log('🔍 첫 번째 아이템:', response.data[0]);
        const transformedData = response.data.map((item: any): RequestItem => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church || item.churchName || `교회 ${item.church_id}`);
          
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            requestedItem: item.requested_item || item.requestedItem || item.title, // 없으면 제목 사용
            quantity: item.quantity || 1,
            reason: item.reason || item.description || '요청 사유 없음', // reason이 없으면 description 사용
            urgency: item.urgency || item.urgency_level || 'medium', // normal 값도 그대로 허용
            neededDate: item.needed_date || item.neededDate || '',
            church: churchName,
            location: item.location,
            contactInfo: item.contact_info || item.contactInfo || '',
            status: item.status,
            createdAt: item.created_at || item.createdAt,
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
      
      const response = await api.post(getApiUrl('/community/item-requests'), transformedData);
      
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
          const churchName = item.church_id === 9998 ? null : (item.church || `교회 ${item.church_id}`);
          
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
            createdAt: item.created_at || item.createdAt,
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
          const churchName = item.church_id === 9998 ? null : (item.church || item.churchName || `교회 ${item.church_id}`);
          
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
            createdAt: item.created_at || item.createdAt,
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
          const churchName = item.church_id === 9998 ? null : (item.church || item.company || `교회 ${item.church_id}`);
          
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
          const churchName = item.church_id === 9998 ? null : (item.church || item.churchName || `교회 ${item.church_id}`);
          
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
        const churchName = item.church_id === 9998 ? null : (item.church || item.company || `교회 ${item.church_id}`);
        
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
        const churchName = item.church_id === 9998 ? null : (item.church || item.churchName || `교회 ${item.church_id}`);
        
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
          const churchName = item.church_id === 9998 ? null : (item.church || item.churchName || `교회 ${item.church_id}`);
          
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
      const response = await api.get(getApiUrl('/community/music-team-recruitments'), { params });
      console.log('✅ 음악팀 모집 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const transformedData = response.data.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church || item.churchName || `교회 ${item.church_id}`);
          
          return {
            ...item,
            church: churchName,
            churchName: churchName,
            userName: item.author_name || item.user_name || item.userName || '익명', // author_name 우선 사용
            createdAt: item.created_at || item.createdAt || new Date().toISOString() // 날짜 필드 변환, null인 경우 현재 시간
          };
        });
        return transformedData;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church || item.churchName || `교회 ${item.church_id}`);
          
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
        positions_needed: null, // 현재 폼에서 수집하지 않는 필드
        experience_required: recruitmentData.requirements || "경험 무관",
        practice_location: recruitmentData.location || "협의",
        practice_schedule: recruitmentData.schedule || "협의",
        commitment: null, // 현재 폼에서 수집하지 않는 필드
        
        // 상세 내용 - 백엔드 필드명에 맞춤
        description: recruitmentData.description || null,
        requirements: null, // 별도 requirements 필드 (experience_required와 다름)
        benefits: recruitmentData.compensation || null, // compensation → benefits
        
        // 연락처 정보 (필수)
        contact_method: "전화",
        contact_info: `전화: ${recruitmentData.contactPhone}${recruitmentData.contactEmail ? `, 이메일: ${recruitmentData.contactEmail}` : ''}`,
        
        // 상태 및 기타 필드
        status: recruitmentData.status || "open",
        current_members: null, // 현재 폼에서 수집하지 않는 필드
        target_members: null, // 현재 폼에서 수집하지 않는 필드
        
        // 통계 필드들 (백엔드에서 자동 설정될 것으로 예상되지만 명시적으로 포함)
        views: 0,
        likes: 0,
        applicants_count: recruitmentData.applications || 0,
        
        // 시간 필드들 (백엔드에서 자동 설정될 것으로 예상)
        created_at: null,
        updated_at: null
        
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
          const churchName = item.church_id === 9998 ? null : (item.church || item.churchName || `교회 ${item.church_id}`);
          
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
          const churchName = item.church_id === 9998 ? null : (item.church || item.churchName || `교회 ${item.church_id}`);
          
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
    search?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<any[]> => {
    try {
      console.log('📝 내 게시글 API 호출 중...', params);
      const response = await api.get(getApiUrl('/community/my-posts'), { params });
      console.log('✅ 내 게시글 API 응답:', response.data);
      
      // API 응답 구조가 { success: true, data: [...] } 형태인 경우 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // 직접 배열이 반환되는 경우
      if (Array.isArray(response.data)) {
        const transformedData = response.data.map((item: any) => {
          // 교회 9998의 경우 null로 처리
          const churchName = item.church_id === 9998 ? null : (item.church || item.churchName || `교회 ${item.church_id}`);
          
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
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
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
  }
};

export default communityService;