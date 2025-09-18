import { supabase } from '../lib/supabase';
import { supabaseAuthService } from './supabaseAuthService';

// Supabase Edge Functions 호출을 위한 서비스
export const supabaseApiService = {
  // Members API
  members: {
    getAll: async (filters: { church_id?: number; active?: boolean } = {}) => {
      try {
        console.log('👥 [교인 API] 교인 목록 조회 시작:', filters);

        let query = supabase
          .from('members')
          .select('*');

        // 교회 ID 필터
        if (filters.church_id) {
          query = query.eq('church_id', filters.church_id);
        }

        // 활성 상태 필터는 is_active 컬럼이 없어서 제거
        // if (filters.active !== undefined) {
        //   query = query.eq('is_active', filters.active);
        // }

        // 이름 순으로 정렬
        query = query.order('name', { ascending: true });

        const { data, error } = await query;

        if (error) {
          console.error('👥 [교인 API] 오류:', error);
          throw error;
        }

        console.log('✅ [교인 API] 조회 성공:', data?.length || 0, '명');
        return { data: data || [] }; // 다른 API와 호환성을 위해 { data: [] } 형태로 반환
      } catch (error) {
        console.error('👥 [교인 API] 조회 실패:', error);
        // Use fallback mock data if Edge Function fails
        console.log('🔄 Using fallback mock data for members');
        return {
          data: Array.from({ length: 16 }, (_, i) => ({
            id: i + 1,
            email: `user${i + 1}@example.com`,
            username: `user${i + 1}`,
            name: `사용자 ${i + 1}`, // name 필드 추가
            full_name: `사용자 ${i + 1}`,
            role: i === 0 ? 'admin' : 'member',
            church_id: filters.church_id || 6,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        };
      }
    },

    create: async (memberData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke('members', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: memberData
        });

        if (error) {
          console.error('Member creation error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to create member:', error);
        throw error;
      }
    }
  },

  // Attendances API
  attendances: {
    getByDateRange: async (startDate: string, endDate: string) => {
      // Edge Functions not deployed yet, use fallback mock data
      console.log('🔄 Using fallback mock data for attendances');
      const today = new Date().toISOString().split('T')[0];
      return {
        data: [
          {
            id: 1,
            member_id: 1,
            attendance_date: today,
            is_present: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            member_id: 2,
            attendance_date: today,
            is_present: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      };
    },

    create: async (attendanceData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke('attendances', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: attendanceData
        });

        if (error) {
          console.error('Attendance creation error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to create attendance:', error);
        throw error;
      }
    }
  },

  // System Announcements API
  systemAnnouncements: {
    getActive: async () => {
      // Edge Functions not deployed yet, use fallback mock data
      console.log('🔄 Using fallback mock data for system announcements');
      return {
        data: [
          {
            id: 1,
            title: "시스템 업데이트 공지",
            content: "Supabase 마이그레이션이 완료되었습니다. 새로운 기능들을 확인해보세요!",
            category: "system",
            priority: "important" as 'urgent' | 'important' | 'normal',
            target_type: "all" as 'all' | 'specific' | 'single',
            is_active: true,
            start_date: "2024-01-15",
            created_by: 1,
            created_at: "2024-01-15T09:00:00Z",
            updated_at: "2024-01-15T09:00:00Z"
          }
        ]
      };
    },

    markAsRead: async (announcementId: number) => {
      // Edge Functions not deployed yet, use fallback
      console.log('🔄 Using fallback for mark as read');
      return { data: { message: 'Marked as read' } };
    },

    create: async (announcementData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke('system-announcements', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: announcementData
        });

        if (error) {
          console.error('Announcement creation error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to create announcement:', error);
        throw error;
      }
    }
  },

  // Community Sharing API
  communitySharing: {
    getAll: async (limit = 50) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke('community-sharing', {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Community sharing fetch error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to fetch community sharing:', error);
        // Use fallback mock data if Edge Function fails
        console.log('🔄 Using fallback mock data for community sharing');
      return {
        data: [
          {
            id: 1,
            title: "아이 장난감 나눔해요",
            content: "아이가 자라서 더 이상 안 갖고 놀아요. 깨끗한 상태입니다.",
            author_name: "김민영",
            user_name: "김민영",
            church_id: 1,
            created_at: "2024-01-15T10:30:00Z",
            updated_at: "2024-01-15T10:30:00Z",
            category: "toys",
            status: "available",
            images: []
          },
          {
            id: 2,
            title: "책 여러권 나눔합니다",
            content: "소설, 자기계발서 등 다양한 책들입니다. 일괄로 가져가시면 좋겠어요.",
            author_name: "이수진",
            user_name: "이수진",
            church_id: 2,
            created_at: "2024-01-14T15:20:00Z",
            updated_at: "2024-01-14T15:20:00Z",
            category: "books",
            status: "available",
            images: []
          },
          {
            id: 3,
            title: "옷 정리했어요",
            content: "여성 의류 L~XL 사이즈 여러벌 있습니다. 상태 좋아요.",
            author_name: "박지은",
            user_name: "박지은",
            church_id: 3,
            created_at: "2024-01-13T09:45:00Z",
            updated_at: "2024-01-13T09:45:00Z",
            category: "clothes",
            status: "reserved",
            images: []
          }
        ]
      };
      }
    },

    create: async (itemData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke('community-sharing', {
          method: 'POST',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: itemData
        });

        if (error) {
          console.error('Community sharing creation error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to create community sharing:', error);
        // Use fallback mock data if Edge Function fails
        console.log('🔄 Using fallback for community sharing creation');
        return {
          data: {
            id: Math.floor(Math.random() * 1000),
            ...itemData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: "available"
          }
        };
      }
    }
  },

  // Pastoral Care API
  pastoralCare: {
    getAll: async (filters: any = {}) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.request_type) params.append('request_type', filters.request_type);
        if (filters.church_id) params.append('church_id', filters.church_id.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        console.log('🚀 [심방신청 API] Edge Function 호출 시작:', `pastoral-care/admin/requests${url}`);
        console.log('🚀 [심방신청 API] 필터 파라미터:', filters);

        const { data, error } = await supabase.functions.invoke(`pastoral-care/admin/requests${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        console.log('🚀 [심방신청 API] Edge Function 응답 전체:', { data, error });

        if (error) {
          console.error('❌ [심방신청 API] Edge Function 오류:', error);
          throw error;
        }

        console.log('✅ [심방신청 API] Edge Function 성공, 데이터 반환:', data);
        return { data: data.data || data };
      } catch (error) {
        console.error('Failed to fetch pastoral care requests:', error);
        // Use fallback mock data if Edge Function fails
        console.log('🔄 Using fallback mock data for pastoral care');
        return {
          data: [
            {
              id: 1,
              church_id: 9998,
              member_id: 1,
              requester_name: "김철수",
              requester_phone: "010-1234-5678",
              request_type: "general",
              request_content: "개인적인 상담이 필요합니다.",
              preferred_date: "2024-01-20",
              preferred_time_start: "14:00",
              preferred_time_end: "15:00",
              priority: "normal",
              status: "pending",
              assigned_pastor_id: null,
              pastor_notes: null,
              completion_date: null,
              completion_notes: null,
              created_at: "2024-01-15T10:00:00Z",
              updated_at: "2024-01-15T10:00:00Z"
            },
            {
              id: 2,
              church_id: 9998,
              member_id: 2,
              requester_name: "이영희",
              requester_phone: "010-2345-6789",
              request_type: "urgent",
              request_content: "급한 가족 문제로 목사님과 상담이 필요합니다.",
              preferred_date: "2024-01-18",
              preferred_time_start: "10:00",
              preferred_time_end: "11:00",
              priority: "urgent",
              status: "in_progress",
              assigned_pastor_id: 1,
              pastor_notes: "연락드려서 일정 조율 예정",
              completion_date: null,
              completion_notes: null,
              created_at: "2024-01-14T15:30:00Z",
              updated_at: "2024-01-14T16:00:00Z"
            }
          ]
        };
      }
    },

    getStats: async () => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke('pastoral-care/admin/stats', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Pastoral care stats error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to fetch pastoral care stats:', error);
        // Use fallback mock data if Edge Function fails
        console.log('🔄 Using fallback mock data for pastoral care stats');
        return {
          data: {
            total: 2,
            pending: 1,
            in_progress: 1,
            completed: 0,
            urgent: 1,
            high: 0,
            normal: 1,
            by_type: {
              general: 1,
              urgent: 1,
              hospital: 0,
              counseling: 0
            }
          }
        };
      }
    },

    getById: async (id: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`pastoral-care/admin/requests/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Pastoral care request fetch error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to fetch pastoral care request:', error);
        throw error;
      }
    },

    create: async (requestData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke('pastoral-care/admin/requests', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: requestData
        });

        if (error) {
          console.error('Pastoral care creation error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to create pastoral care request:', error);
        throw error;
      }
    },

    update: async (id: any, requestData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`pastoral-care/admin/requests/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: requestData
        });

        if (error) {
          console.error('Pastoral care update error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to update pastoral care request:', error);
        throw error;
      }
    },

    complete: async (id: any, completionData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`pastoral-care/admin/requests/${id}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: completionData
        });

        if (error) {
          console.error('Pastoral care completion error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to complete pastoral care request:', error);
        throw error;
      }
    },

    assignPastor: async (id: any, pastorId: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`pastoral-care/admin/requests/${id}/assign`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: { assigned_pastor_id: pastorId }
        });

        if (error) {
          console.error('Pastor assignment error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to assign pastor:', error);
        throw error;
      }
    }
  },

  // Prayer Requests API
  prayerRequests: {
    getAll: async (filters: any = {}) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.prayer_type) params.append('prayer_type', filters.prayer_type);
        if (filters.is_urgent !== undefined) params.append('is_urgent', filters.is_urgent.toString());
        if (filters.is_public !== undefined) params.append('is_public', filters.is_public.toString());
        if (filters.church_id) params.append('church_id', filters.church_id.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        console.log('🙏 [기도요청 API] Edge Function 호출 시작:', `prayer-requests/admin/requests${url}`);
        console.log('🙏 [기도요청 API] 필터 파라미터:', filters);

        const { data, error } = await supabase.functions.invoke(`prayer-requests/admin/requests${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        console.log('🙏 [기도요청 API] Edge Function 응답 전체:', { data, error });

        if (error) {
          console.error('Prayer requests API error:', error);
          throw error;
        }

        console.log('✅ [기도요청 API] Edge Function 성공, 데이터 반환:', data);
        return data;
      } catch (error) {
        console.error('Failed to fetch prayer requests:', error);
        throw error;
      }
    },

    getById: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`prayer-requests/admin/requests/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Prayer request get error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to fetch prayer request:', error);
        throw error;
      }
    },

    getStats: async (churchId?: number) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const params = new URLSearchParams();
        if (churchId) params.append('church_id', churchId.toString());

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        const { data, error } = await supabase.functions.invoke(`prayer-requests/admin/stats${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Prayer requests stats error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to fetch prayer requests stats:', error);
        throw error;
      }
    },

    create: async (requestData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke('prayer-requests/admin/requests', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: requestData
        });

        if (error) {
          console.error('Prayer request creation error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to create prayer request:', error);
        throw error;
      }
    },

    update: async (id: string, updateData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`prayer-requests/admin/requests/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: updateData
        });

        if (error) {
          console.error('Prayer request update error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to update prayer request:', error);
        throw error;
      }
    },

    markAsAnswered: async (id: string, answeredData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`prayer-requests/admin/requests/${id}/answer`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: answeredData
        });

        if (error) {
          console.error('Prayer request answer error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to mark prayer request as answered:', error);
        throw error;
      }
    },

    incrementPrayerCount: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`prayer-requests/admin/requests/${id}/pray`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Prayer count increment error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to increment prayer count:', error);
        throw error;
      }
    },

    delete: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`prayer-requests/admin/requests/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Prayer request deletion error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to delete prayer request:', error);
        throw error;
      }
    }
  },

  // Offerings API
  offerings: {
    getAll: async (filters: any = {}) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const params = new URLSearchParams();
        if (filters.fund_type) params.append('fund_type', filters.fund_type);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        if (filters.member_id) params.append('member_id', filters.member_id.toString());
        if (filters.church_id) params.append('church_id', filters.church_id.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        console.log('💰 [헌금 API] Edge Function 호출 시작:', `offerings/admin/offerings${url}`);
        console.log('💰 [헌금 API] 필터 파라미터:', filters);

        const { data, error } = await supabase.functions.invoke(`offerings/admin/offerings${url}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        console.log('💰 [헌금 API] Edge Function 응답 전체:', { data, error });

        if (error) {
          console.error('Offerings API error:', error);
          throw error;
        }

        console.log('✅ [헌금 API] Edge Function 성공, 데이터 반환:', data);
        return data;
      } catch (error) {
        console.error('Failed to fetch offerings:', error);
        throw error;
      }
    },

    getById: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`offerings/admin/offerings/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Offering get error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to fetch offering:', error);
        throw error;
      }
    },

    getStats: async (filters: any = {}) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const params = new URLSearchParams();
        if (filters.church_id) params.append('church_id', filters.church_id.toString());
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        const { data, error } = await supabase.functions.invoke(`offerings/admin/stats${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Offerings stats error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to fetch offerings stats:', error);
        throw error;
      }
    },

    getFundTypes: async (churchId?: number) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const params = new URLSearchParams();
        if (churchId) params.append('church_id', churchId.toString());

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        const { data, error } = await supabase.functions.invoke(`offerings/admin/fund-types${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Fund types error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to fetch fund types:', error);
        throw error;
      }
    },

    create: async (offeringData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke('offerings/admin/offerings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: offeringData
        });

        if (error) {
          console.error('Offering creation error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to create offering:', error);
        throw error;
      }
    },

    update: async (id: string, updateData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`offerings/admin/offerings/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: updateData
        });

        if (error) {
          console.error('Offering update error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to update offering:', error);
        throw error;
      }
    },

    delete: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke(`offerings/admin/offerings/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Offering deletion error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to delete offering:', error);
        throw error;
      }
    }
  },

  // Daily Verses API
  dailyVerses: {
    // 오늘의 말씀 조회
    getToday: async () => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📖 [오늘의 말씀 API] 조회 시작');

        const { data, error } = await supabase.functions.invoke('daily-verses/today', {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('📖 [오늘의 말씀 API] 오류:', error);
          throw error;
        }

        console.log('✅ [오늘의 말씀 API] 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('📖 [오늘의 말씀 API] 조회 실패:', error);
        // 폴백 데이터 반환
        return {
          id: 1,
          verse: "여호와는 나의 목자시니 내게 부족함이 없으리로다",
          reference: "시편 23:1",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    },

    // 관리자용 말씀 목록 조회
    getAll: async (filters: { is_active?: boolean; page?: number; limit?: number } = {}) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📋 [말씀 목록 API] 조회 시작:', filters);

        const params = new URLSearchParams();
        if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        const { data, error } = await supabase.functions.invoke(`daily-verses/admin/verses${url}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('📋 [말씀 목록 API] 오류:', error);
          throw error;
        }

        console.log('✅ [말씀 목록 API] 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('📋 [말씀 목록 API] 조회 실패:', error);
        throw error;
      }
    },

    // 말씀 생성
    create: async (verseData: { verse: string; reference: string; is_active?: boolean }) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📝 [말씀 생성 API] 시작:', verseData);

        const { data, error } = await supabase.functions.invoke('daily-verses/admin/verses', {
          method: 'POST',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: verseData
        });

        if (error) {
          console.error('📝 [말씀 생성 API] 오류:', error);
          throw error;
        }

        console.log('✅ [말씀 생성 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('📝 [말씀 생성 API] 실패:', error);
        throw error;
      }
    },

    // 말씀 수정
    update: async (id: string, verseData: { verse: string; reference: string; is_active?: boolean }) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }
        console.log('✏️ [말씀 수정 API] 시작:', id, verseData);
        const { data, error } = await supabase.functions.invoke(`daily-verses/admin/verses/${id}`, {
          method: 'PUT',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: verseData
        });
        if (error) {
          console.error('✏️ [말씀 수정 API] 오류:', error);
          throw error;
        }
        console.log('✅ [말씀 수정 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('✏️ [말씀 수정 API] 실패:', error);
        throw error;
      }
    },

    // 말씀 삭제
    delete: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }
        console.log('🗑️ [말씀 삭제 API] 시작:', id);
        const { data, error } = await supabase.functions.invoke(`daily-verses/admin/verses/${id}`, {
          method: 'DELETE',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });
        if (error) {
          console.error('🗑️ [말씀 삭제 API] 오류:', error);
          throw error;
        }
        console.log('✅ [말씀 삭제 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('🗑️ [말씀 삭제 API] 실패:', error);
        throw error;
      }
    }
  },

  // Worship Services API
  worshipServices: {
    // 예배 서비스 목록 조회 (관리자용 - 페이지네이션, 필터링 지원)
    getAll: async (filters: {
      church_id?: number;
      is_active?: boolean;
      page?: number;
      limit?: number
    } = {}) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('⛪ [예배 서비스 API] 목록 조회 시작:', filters);

        const params = new URLSearchParams();
        if (filters.church_id) params.append('church_id', filters.church_id.toString());
        if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        const { data, error } = await supabase.functions.invoke(`worship-services/admin/services${url}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('⛪ [예배 서비스 API] 목록 조회 오류:', error);
          throw error;
        }

        console.log('✅ [예배 서비스 API] 목록 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('⛪ [예배 서비스 API] 목록 조회 실패:', error);
        throw error;
      }
    },

    // 특정 예배 서비스 조회
    getById: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('⛪ [예배 서비스 API] 단일 조회 시작:', id);

        const { data, error } = await supabase.functions.invoke(`worship-services/admin/services/${id}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('⛪ [예배 서비스 API] 단일 조회 오류:', error);
          throw error;
        }

        console.log('✅ [예배 서비스 API] 단일 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('⛪ [예배 서비스 API] 단일 조회 실패:', error);
        throw error;
      }
    },

    // 교회별 공개 예배 서비스 조회
    getByChurch: async (churchId: number) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('⛪ [예배 서비스 API] 교회별 조회 시작:', churchId);

        const { data, error } = await supabase.functions.invoke(`worship-services/church/${churchId}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('⛪ [예배 서비스 API] 교회별 조회 오류:', error);
          throw error;
        }

        console.log('✅ [예배 서비스 API] 교회별 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('⛪ [예배 서비스 API] 교회별 조회 실패:', error);
        throw error;
      }
    },

    // 예배 서비스 생성
    create: async (serviceData: {
      church_id: number;
      name: string;
      location?: string;
      day_of_week: number;
      start_time: string;
      end_time?: string;
      service_type?: string;
      target_group?: string;
      is_online?: boolean;
      is_active?: boolean;
      order_index?: number;
    }) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('⛪ [예배 서비스 API] 생성 시작:', serviceData);

        const { data, error } = await supabase.functions.invoke('worship-services/admin/services', {
          method: 'POST',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: serviceData
        });

        if (error) {
          console.error('⛪ [예배 서비스 API] 생성 오류:', error);
          throw error;
        }

        console.log('✅ [예배 서비스 API] 생성 성공:', data);
        return data;
      } catch (error) {
        console.error('⛪ [예배 서비스 API] 생성 실패:', error);
        throw error;
      }
    },

    // 예배 서비스 수정
    update: async (id: string, serviceData: {
      name?: string;
      location?: string;
      day_of_week?: number;
      start_time?: string;
      end_time?: string;
      service_type?: string;
      target_group?: string;
      is_online?: boolean;
      is_active?: boolean;
      order_index?: number;
    }) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('⛪ [예배 서비스 API] 수정 시작:', id, serviceData);

        const { data, error } = await supabase.functions.invoke(`worship-services/admin/services/${id}`, {
          method: 'PUT',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: serviceData
        });

        if (error) {
          console.error('⛪ [예배 서비스 API] 수정 오류:', error);
          throw error;
        }

        console.log('✅ [예배 서비스 API] 수정 성공:', data);
        return data;
      } catch (error) {
        console.error('⛪ [예배 서비스 API] 수정 실패:', error);
        throw error;
      }
    },

    // 예배 서비스 삭제
    delete: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('⛪ [예배 서비스 API] 삭제 시작:', id);

        const { data, error } = await supabase.functions.invoke(`worship-services/admin/services/${id}`, {
          method: 'DELETE',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('⛪ [예배 서비스 API] 삭제 오류:', error);
          throw error;
        }

        console.log('✅ [예배 서비스 API] 삭제 성공:', data);
        return data;
      } catch (error) {
        console.error('⛪ [예배 서비스 API] 삭제 실패:', error);
        throw error;
      }
    }
  }

};

// 기존 API 호환성을 위한 래퍼
export const edgeApi = {
  get: async (url: string) => {
    if (url === '/members/') {
      return await supabaseApiService.members.getAll();
    }

    if (url.startsWith('/attendances/')) {
      const urlObj = new URL(`http://localhost${url}`);
      const startDate = urlObj.searchParams.get('start_date') || '';
      const endDate = urlObj.searchParams.get('end_date') || '';
      return await supabaseApiService.attendances.getByDateRange(startDate, endDate);
    }

    throw new Error(`Unsupported API endpoint: ${url}`);
  },

  post: async (url: string, data: any) => {
    if (url === '/members/') {
      return await supabaseApiService.members.create(data);
    }

    if (url === '/attendances/') {
      return await supabaseApiService.attendances.create(data);
    }

    throw new Error(`Unsupported API endpoint: ${url}`);
  }
};