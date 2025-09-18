/**
 * 교회 행사/소식 API 서비스
 *
 * @description 교회 행사와 소식 관련 API 호출 함수들을 제공합니다.
 * @version 2.0.0
 * @since 2025-09-15
 * @reference FRONTEND_API_MIGRATION_GUIDE.md - 백엔드 API 스키마 통일화 반영
 */

import {
  CommunityAPI,
  COMMUNITY_ENDPOINTS,
  handleApiResponse,
  handleApiError,
  buildQueryParams
} from './community-common';

import {
  StandardListResponse,
  StandardSingleResponse
} from '../types';

import {
  ChurchEvent,
  ChurchNews
} from '../types/church-events';

// 임시 타입 정의 (호환성을 위해)
interface ChurchEventListOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  priority?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  event_date_from?: string;
  event_date_to?: string;
  [key: string]: any; // 추가 필드 허용
}

interface ChurchNewsListOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  priority?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: any; // 추가 필드 허용
}

// =============================================================================
// API 엔드포인트 정의
// =============================================================================
const CHURCH_EVENTS_ENDPOINTS = {
  // 교회 행사
  EVENTS: '/community/church-events',
  EVENT_DETAIL: (id: number) => `/community/church-events/${id}`,
  EVENT_REGISTER: (id: number) => `/community/church-events/${id}/register`,
  EVENT_CANCEL: (id: number) => `/community/church-events/${id}/cancel`,
  EVENT_STATS: '/community/church-events/stats',

  // 교회 소식
  NEWS: '/community/church-news',
  NEWS_DETAIL: (id: number) => `/community/church-news/${id}`,
  NEWS_STATS: '/community/church-news/stats',

  // 공통
  CATEGORIES: '/community/church-events/categories',
  PRIORITIES: '/community/church-events/priorities'
} as const;

// =============================================================================
// 교회 행사 API 클래스
// =============================================================================
class ChurchEventAPI {
  /**
   * 교회 행사 목록 조회
   */
  static async getList(options: ChurchEventListOptions = {}): Promise<StandardListResponse<ChurchEvent>> {
    try {
      const response = await CommunityAPI.getList<ChurchEvent>('church-event', options as any);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 교회 행사 상세 조회
   */
  static async getDetail(id: number): Promise<StandardSingleResponse<ChurchEvent>> {
    try {
      return await CommunityAPI.getDetail<ChurchEvent>('church-event', id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 교회 행사 생성
   */
  static async create(data: any): Promise<StandardSingleResponse<ChurchEvent>> {
    try {
      return await CommunityAPI.create<ChurchEvent>('church-event', data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 교회 행사 수정
   */
  static async update(id: number, data: any): Promise<StandardSingleResponse<ChurchEvent>> {
    try {
      return await CommunityAPI.update<ChurchEvent>('church-event', id, data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 교회 행사 삭제
   */
  static async delete(id: number): Promise<void> {
    try {
      await CommunityAPI.delete('church-event', id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 교회 행사 참가 신청
   */
  static async register(eventId: number, registrationData: {
    participant_name: string;
    participant_email: string;
    participant_phone: string;
    participant_count?: number;
    additional_requests?: string;
  }): Promise<StandardSingleResponse<any>> {
    try {
      const response = await fetch(CHURCH_EVENTS_ENDPOINTS.EVENT_REGISTER(eventId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 교회 행사 참가 취소
   */
  static async cancelRegistration(eventId: number, registrationId: number): Promise<StandardSingleResponse<null>> {
    try {
      const response = await fetch(CHURCH_EVENTS_ENDPOINTS.EVENT_CANCEL(eventId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registration_id: registrationId })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 교회 행사 통계 조회
   */
  static async getStats(): Promise<StandardSingleResponse<any>> {
    try {
      const response = await fetch(CHURCH_EVENTS_ENDPOINTS.EVENT_STATS);
      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 즐겨찾기 추가/제거
   */
  static async toggleFavorite(eventId: number): Promise<StandardSingleResponse<{ is_favorite: boolean }>> {
    try {
      const response = await fetch(`${CHURCH_EVENTS_ENDPOINTS.EVENTS}/${eventId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 내가 참가한 행사 목록 조회
   */
  static async getMyEvents(options: ChurchEventListOptions = {}): Promise<StandardListResponse<ChurchEvent>> {
    try {
      const response = await fetch(`${CHURCH_EVENTS_ENDPOINTS.EVENTS}/my-events?${buildQueryParams(options as any)}`);
      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }
}

// =============================================================================
// 교회 소식 API 클래스
// =============================================================================
class ChurchNewsAPI {
  /**
   * 교회 소식 목록 조회
   */
  static async getList(options: ChurchNewsListOptions = {}): Promise<StandardListResponse<ChurchNews>> {
    try {
      return await CommunityAPI.getList<ChurchNews>('church-news', options as any);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 교회 소식 상세 조회
   */
  static async getDetail(id: number): Promise<StandardSingleResponse<ChurchNews>> {
    try {
      return await CommunityAPI.getDetail<ChurchNews>('church-news', id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 교회 소식 생성
   */
  static async create(data: any): Promise<StandardSingleResponse<ChurchNews>> {
    try {
      return await CommunityAPI.create<ChurchNews>('church-news', data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 교회 소식 수정
   */
  static async update(id: number, data: any): Promise<StandardSingleResponse<ChurchNews>> {
    try {
      return await CommunityAPI.update<ChurchNews>('church-news', id, data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 교회 소식 삭제
   */
  static async delete(id: number): Promise<void> {
    try {
      await CommunityAPI.delete('church-news', id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 중요 소식 목록 조회 (우선순위 높은 소식들)
   */
  static async getImportantNews(limit: number = 5): Promise<StandardListResponse<ChurchNews>> {
    try {
      const options: ChurchNewsListOptions = {
        priority: 'urgent',
        limit,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      return await this.getList(options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 행사 관련 소식 목록 조회
   */
  static async getEventRelatedNews(eventId?: number): Promise<StandardListResponse<ChurchNews>> {
    try {
      const options: ChurchNewsListOptions = {
        ...(eventId && { search: `event_id:${eventId}` }),
        sort_by: 'effective_date',
        sort_order: 'desc'
      };

      return await this.getList(options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 소식 통계 조회
   */
  static async getStats(): Promise<StandardSingleResponse<any>> {
    try {
      const response = await fetch(CHURCH_EVENTS_ENDPOINTS.NEWS_STATS);
      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }
}

// =============================================================================
// 통합 교회 행사/소식 API 클래스
// =============================================================================
class ChurchIntegratedAPI {
  /**
   * 교회 행사와 소식을 통합 검색
   */
  static async searchAll(query: string, options: {
    includeEvents?: boolean;
    includeNews?: boolean;
    limit?: number;
  } = {}): Promise<{
    events: StandardListResponse<ChurchEvent>;
    news: StandardListResponse<ChurchNews>;
  }> {
    try {
      const { includeEvents = true, includeNews = true, limit = 10 } = options;

      const promises: Promise<any>[] = [];

      if (includeEvents) {
        promises.push(ChurchEventAPI.getList({ search: query, limit }));
      }

      if (includeNews) {
        promises.push(ChurchNewsAPI.getList({ search: query, limit }));
      }

      const results = await Promise.all(promises);

      return {
        events: includeEvents ? results[0] : { success: true, data: [], pagination: {} as any },
        news: includeNews ? results[includeEvents ? 1 : 0] : { success: true, data: [], pagination: {} as any }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 카테고리 목록 조회
   */
  static async getCategories(): Promise<StandardSingleResponse<any[]>> {
    try {
      const response = await fetch(CHURCH_EVENTS_ENDPOINTS.CATEGORIES);
      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 우선순위 목록 조회
   */
  static async getPriorities(): Promise<StandardSingleResponse<any[]>> {
    try {
      const response = await fetch(CHURCH_EVENTS_ENDPOINTS.PRIORITIES);
      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 대시보드용 요약 정보 조회
   */
  static async getDashboardSummary(): Promise<StandardSingleResponse<{
    upcoming_events: ChurchEvent[];
    recent_news: ChurchNews[];
    popular_events: ChurchEvent[];
    urgent_news: ChurchNews[];
    stats: {
      total_events: number;
      total_news: number;
      monthly_events: number;
      monthly_news: number;
    };
  }>> {
    try {
      const [upcomingEvents, recentNews, importantNews, eventStats, newsStats] = await Promise.all([
        ChurchEventAPI.getList({ limit: 5, sort_by: 'event_date', sort_order: 'asc' }),
        ChurchNewsAPI.getList({ limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
        ChurchNewsAPI.getImportantNews(3),
        ChurchEventAPI.getStats(),
        ChurchNewsAPI.getStats()
      ]);

      return {
        success: true,
        data: {
          upcoming_events: upcomingEvents.data,
          recent_news: recentNews.data,
          popular_events: upcomingEvents.data, // 임시로 같은 데이터 사용
          urgent_news: importantNews.data,
          stats: {
            total_events: eventStats.data?.total_events || 0,
            total_news: newsStats.data?.total_news || 0,
            monthly_events: eventStats.data?.monthly_events || 0,
            monthly_news: newsStats.data?.monthly_news || 0
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 캘린더용 행사 목록 조회
   */
  static async getCalendarEvents(month: string): Promise<StandardListResponse<ChurchEvent>> {
    try {
      const startOfMonth = `${month}-01`;
      const endOfMonth = `${month}-31`;

      return await ChurchEventAPI.getList({
        event_date_from: startOfMonth,
        event_date_to: endOfMonth,
        sort_by: 'event_date',
        sort_order: 'asc',
        limit: 100
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 피드 스타일 통합 목록 조회 (행사 + 소식)
   */
  static async getFeed(options: {
    page?: number;
    limit?: number;
    type?: 'all' | 'events' | 'news';
  } = {}): Promise<{
    success: boolean;
    data: Array<(ChurchEvent | ChurchNews) & { content_type: 'event' | 'news' }>;
    pagination: any;
  }> {
    try {
      const { page = 1, limit = 20, type = 'all' } = options;

      let allItems: Array<(ChurchEvent | ChurchNews) & { content_type: 'event' | 'news' }> = [];

      if (type === 'all' || type === 'events') {
        const events = await ChurchEventAPI.getList({ page, limit: Math.ceil(limit / 2) });
        allItems.push(...events.data.map(event => ({ ...event, content_type: 'event' as const })));
      }

      if (type === 'all' || type === 'news') {
        const news = await ChurchNewsAPI.getList({ page, limit: Math.ceil(limit / 2) });
        allItems.push(...news.data.map(item => ({ ...item, content_type: 'news' as const })));
      }

      // 생성일 기준으로 정렬
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return {
        success: true,
        data: allItems.slice(0, limit),
        pagination: {
          current_page: page,
          total_pages: Math.ceil(allItems.length / limit),
          total_count: allItems.length,
          per_page: limit,
          has_next: page * limit < allItems.length,
          has_prev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

// 기본 내보내기
export {
  ChurchEventAPI,
  ChurchNewsAPI,
  ChurchIntegratedAPI,
  CHURCH_EVENTS_ENDPOINTS
};

export default ChurchEventAPI;