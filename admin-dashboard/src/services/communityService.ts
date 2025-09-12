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
  churchName: string | null;
  recruitmentType: string;
  instruments: string[];
  requirements: string;
  schedule: string;
  location: string;
  contact: string;
  status: 'open' | 'closed';
  createdAt: string;
  views: number;
  likes: number;
  applications: number;
  userName?: string; // 사용자명 필드 추가
}

// 음악팀 참여 관련 인터페이스
export interface MusicSeeker {
  id: number;
  title: string;
  name: string;
  instruments: string[];
  experience: string;
  portfolio: string;
  preferredGenre: string[];
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
            userName: item.user_name || item.userName || '익명' // 사용자명 추가
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
            userName: item.user_name || item.userName || '익명'
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
            userName: item.user_name || item.userName || '익명'
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
            userName: item.user_name || item.userName || '익명'
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
            userName: item.user_name || item.userName || '익명'
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
            userName: item.user_name || item.userName || '익명'
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
            userName: item.user_name || item.userName || '익명'
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

  createJobPost: async (postData: Partial<JobPost>): Promise<JobPost> => {
    try {
      const response = await api.post(getApiUrl('/community/job-posting'), postData);
      return response.data;
    } catch (error: any) {
      console.error('구인 공고 등록 실패:', error);
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
            userName: item.user_name || item.userName || '익명'
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

  createJobSeeker: async (seekerData: Partial<JobSeeker>): Promise<JobSeeker> => {
    try {
      const response = await api.post(getApiUrl('/community/job-seeking'), seekerData);
      return response.data;
    } catch (error: any) {
      console.error('구직 신청 등록 실패:', error);
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
    instrument?: string;
    status?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<MusicRecruitment[]> => {
    try {
      console.log('🎵 음악팀 모집 API 호출 중...', params);
      const response = await api.get(getApiUrl('/community/music-team-recruit'), { params });
      console.log('✅ 음악팀 모집 API 응답:', response.data);
      
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
            userName: item.user_name || item.userName || '익명'
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

  createMusicRecruitment: async (recruitmentData: Partial<MusicRecruitment>): Promise<MusicRecruitment> => {
    try {
      const response = await api.post(getApiUrl('/community/music-team-recruit'), recruitmentData);
      return response.data;
    } catch (error: any) {
      console.error('음악팀 모집 등록 실패:', error);
      throw error;
    }
  },

  updateMusicRecruitment: async (recruitmentId: number, recruitmentData: Partial<MusicRecruitment>): Promise<MusicRecruitment> => {
    try {
      const response = await api.put(getApiUrl(`/community/music-team-recruit/${recruitmentId}`), recruitmentData);
      return response.data;
    } catch (error: any) {
      console.error('음악팀 모집 수정 실패:', error);
      throw error;
    }
  },

  deleteMusicRecruitment: async (recruitmentId: number): Promise<void> => {
    try {
      await api.delete(getApiUrl(`/community/music-team-recruit/${recruitmentId}`));
    } catch (error: any) {
      console.error('음악팀 모집 삭제 실패:', error);
      throw error;
    }
  },

  // 음악팀 참여
  getMusicSeekers: async (params?: {
    instrument?: string;
    genre?: string;
    status?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<MusicSeeker[]> => {
    try {
      console.log('🎶 음악팀 참여 API 호출 중...', params);
      const response = await api.get(getApiUrl('/community/music-team-seeking'), { params });
      console.log('✅ 음악팀 참여 API 응답:', response.data);
      
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
            userName: item.user_name || item.userName || '익명'
          };
        });
        return transformedData;
      }
      
      // 예상치 못한 응답 구조인 경우 빈 배열 반환
      console.warn('예상치 못한 API 응답 구조:', response.data);
      return [];
    } catch (error: any) {
      console.error('❌ 음악팀 참여 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      return []; // 에러 발생 시 빈 배열 반환
    }
  },

  createMusicSeeker: async (seekerData: Partial<MusicSeeker>): Promise<MusicSeeker> => {
    try {
      const response = await api.post(getApiUrl('/community/music-team-seeking'), seekerData);
      return response.data;
    } catch (error: any) {
      console.error('음악팀 참여 등록 실패:', error);
      throw error;
    }
  },

  updateMusicSeeker: async (seekerId: number, seekerData: Partial<MusicSeeker>): Promise<MusicSeeker> => {
    try {
      const response = await api.put(getApiUrl(`/community/music-team-seeking/${seekerId}`), seekerData);
      return response.data;
    } catch (error: any) {
      console.error('음악팀 참여 수정 실패:', error);
      throw error;
    }
  },

  deleteMusicSeeker: async (seekerId: number): Promise<void> => {
    try {
      await api.delete(getApiUrl(`/community/music-team-seeking/${seekerId}`));
    } catch (error: any) {
      console.error('음악팀 참여 삭제 실패:', error);
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
            userName: item.user_name || item.userName || '익명'
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
            userName: item.user_name || item.userName || '익명'
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
            userName: item.user_name || item.userName || '익명'
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