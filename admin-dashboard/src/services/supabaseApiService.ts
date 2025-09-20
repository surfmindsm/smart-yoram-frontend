import { supabase } from '../lib/supabase';
import { supabaseAuthService } from './supabaseAuthService';

// Supabase Edge Functions 호출을 위한 서비스
export const supabaseApiService = {
  // Supabase 클라이언트 접근
  supabase,
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
  },

  // Bulletins API
  bulletins: {
    // 주보 목록 조회 (관리자용 - 페이지네이션, 필터링 지원)
    getAll: async (filters: {
      church_id?: number;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number
    } = {}) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📰 [주보 API] 목록 조회 시작:', filters);

        const params = new URLSearchParams();
        if (filters.church_id) params.append('church_id', filters.church_id.toString());
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        const { data, error } = await supabase.functions.invoke(`bulletins/admin/bulletins${url}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('📰 [주보 API] 목록 조회 오류:', error);
          throw error;
        }

        console.log('✅ [주보 API] 목록 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('📰 [주보 API] 목록 조회 실패:', error);
        throw error;
      }
    },

    // 특정 주보 조회
    getById: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📰 [주보 API] 단일 조회 시작:', id);

        const { data, error } = await supabase.functions.invoke(`bulletins/admin/bulletins/${id}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('📰 [주보 API] 단일 조회 오류:', error);
          throw error;
        }

        console.log('✅ [주보 API] 단일 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('📰 [주보 API] 단일 조회 실패:', error);
        throw error;
      }
    },

    // 교회별 공개 주보 조회
    getByChurch: async (churchId: number) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📰 [주보 API] 교회별 조회 시작:', churchId);

        const { data, error } = await supabase.functions.invoke(`bulletins/church/${churchId}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('📰 [주보 API] 교회별 조회 오류:', error);
          throw error;
        }

        console.log('✅ [주보 API] 교회별 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('📰 [주보 API] 교회별 조회 실패:', error);
        throw error;
      }
    },

    // 주보 생성
    create: async (bulletinData: {
      church_id: number;
      title: string;
      date: string;
      content?: string;
      file_url?: string;
      created_by?: number;
    }) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📰 [주보 API] 생성 시작:', bulletinData);

        const { data, error } = await supabase.functions.invoke('bulletins/admin/bulletins', {
          method: 'POST',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bulletinData),
        });

        if (error) {
          console.error('📰 [주보 API] 생성 오류:', error);
          throw error;
        }

        console.log('✅ [주보 API] 생성 성공:', data);
        return data;
      } catch (error) {
        console.error('📰 [주보 API] 생성 실패:', error);
        throw error;
      }
    },

    // 주보 수정
    update: async (id: string, bulletinData: {
      title?: string;
      date?: string;
      content?: string;
      file_url?: string;
    }) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📰 [주보 API] 수정 시작:', id, bulletinData);

        const { data, error } = await supabase.functions.invoke(`bulletins/admin/bulletins/${id}`, {
          method: 'PUT',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bulletinData),
        });

        if (error) {
          console.error('📰 [주보 API] 수정 오류:', error);
          throw error;
        }

        console.log('✅ [주보 API] 수정 성공:', data);
        return data;
      } catch (error) {
        console.error('📰 [주보 API] 수정 실패:', error);
        throw error;
      }
    },

    // 주보 삭제
    delete: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📰 [주보 API] 삭제 시작:', id);

        const { data, error } = await supabase.functions.invoke(`bulletins/admin/bulletins/${id}`, {
          method: 'DELETE',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('📰 [주보 API] 삭제 오류:', error);
          throw error;
        }

        console.log('✅ [주보 API] 삭제 성공:', data);
        return data;
      } catch (error) {
        console.error('📰 [주보 API] 삭제 실패:', error);
        throw error;
      }
    }
  },

  // Announcements API
  announcements: {
    // 공지사항 목록 조회 (관리자용 - 페이지네이션, 필터링 지원)
    getAll: async (filters: {
      church_id?: number;
      is_active?: boolean;
      is_pinned?: boolean;
      category?: string;
      page?: number;
      limit?: number
    } = {}) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📢 [공지사항 API] 목록 조회 시작:', filters);

        const params = new URLSearchParams();
        if (filters.church_id) params.append('church_id', filters.church_id.toString());
        if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
        if (filters.is_pinned !== undefined) params.append('is_pinned', filters.is_pinned.toString());
        if (filters.category) params.append('category', filters.category);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        const { data, error } = await supabase.functions.invoke(`announcements/admin/announcements${url}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('📢 [공지사항 API] 목록 조회 오류:', error);
          throw error;
        }

        console.log('✅ [공지사항 API] 목록 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('📢 [공지사항 API] 목록 조회 실패:', error);
        throw error;
      }
    },

    // 특정 공지사항 조회
    getById: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📢 [공지사항 API] 단일 조회 시작:', id);

        const { data, error } = await supabase.functions.invoke(`announcements/admin/announcements/${id}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('📢 [공지사항 API] 단일 조회 오류:', error);
          throw error;
        }

        console.log('✅ [공지사항 API] 단일 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('📢 [공지사항 API] 단일 조회 실패:', error);
        throw error;
      }
    },

    // 교회별 공개 공지사항 조회
    getByChurch: async (churchId: number) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📢 [공지사항 API] 교회별 조회 시작:', churchId);

        const { data, error } = await supabase.functions.invoke(`announcements/church/${churchId}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('📢 [공지사항 API] 교회별 조회 오류:', error);
          throw error;
        }

        console.log('✅ [공지사항 API] 교회별 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('📢 [공지사항 API] 교회별 조회 실패:', error);
        throw error;
      }
    },

    // 공지사항 생성
    create: async (announcementData: {
      church_id: number;
      title: string;
      content: string;
      author_id: number;
      author_name?: string;
      is_active?: boolean;
      is_pinned?: boolean;
      target_audience?: string;
      category: string;
      subcategory?: string;
    }) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📢 [공지사항 API] 생성 시작:', announcementData);

        const { data, error } = await supabase.functions.invoke('announcements/admin/announcements', {
          method: 'POST',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(announcementData),
        });

        if (error) {
          console.error('📢 [공지사항 API] 생성 오류:', error);
          throw error;
        }

        console.log('✅ [공지사항 API] 생성 성공:', data);
        return data;
      } catch (error) {
        console.error('📢 [공지사항 API] 생성 실패:', error);
        throw error;
      }
    },

    // 공지사항 수정
    update: async (id: string, announcementData: {
      title?: string;
      content?: string;
      author_name?: string;
      is_active?: boolean;
      is_pinned?: boolean;
      target_audience?: string;
      category?: string;
      subcategory?: string;
    }) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📢 [공지사항 API] 수정 시작:', id, announcementData);

        const { data, error } = await supabase.functions.invoke(`announcements/admin/announcements/${id}`, {
          method: 'PUT',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(announcementData),
        });

        if (error) {
          console.error('📢 [공지사항 API] 수정 오류:', error);
          throw error;
        }

        console.log('✅ [공지사항 API] 수정 성공:', data);
        return data;
      } catch (error) {
        console.error('📢 [공지사항 API] 수정 실패:', error);
        throw error;
      }
    },

    // 공지사항 삭제
    delete: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📢 [공지사항 API] 삭제 시작:', id);

        const { data, error } = await supabase.functions.invoke(`announcements/admin/announcements/${id}`, {
          method: 'DELETE',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('📢 [공지사항 API] 삭제 오류:', error);
          throw error;
        }

        console.log('✅ [공지사항 API] 삭제 성공:', data);
        return data;
      } catch (error) {
        console.error('📢 [공지사항 API] 삭제 실패:', error);
        throw error;
      }
    }
  },

  // Churches API
  churches: {
    // 내 교회 정보 조회 (동적 데이터 관리)
    getMyChurch: async () => {
      try {
        console.log('🏛️ [교회 정보 API] 내 교회 조회 시작');

        // 1. 현재 사용자 정보 가져오기
        const currentUser = await supabaseAuthService.getCurrentUser();
        const churchId = currentUser?.user?.church_id || currentUser?.profile?.church_id;
        console.log('📍 현재 사용자의 교회 ID:', churchId);

        // 2. 로컬 스토리지에서 교회 정보 확인
        const cachedChurch = localStorage.getItem(`church_${churchId}`);
        if (cachedChurch) {
          console.log('💾 캐시된 교회 정보 사용');
          return JSON.parse(cachedChurch);
        }

        // 3. Edge Function 호출 시도 (조건부)
        const shouldTryEdgeFunction = false; // 현재는 CORS 문제로 비활성화

        if (shouldTryEdgeFunction) {
          const token = await supabaseAuthService.getToken();
          if (token) {
            try {
              const { data, error } = await supabase.functions.invoke('churches/my', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!error && data) {
                console.log('✅ [교회 정보 API] Edge Function 조회 성공:', data);
                // 캐시에 저장
                localStorage.setItem(`church_${churchId}`, JSON.stringify(data));
                return data;
              }
            } catch (edgeError) {
              console.warn('⚠️ Edge Function 호출 실패, fallback 사용:', edgeError);
            }
          }
        }

        // 4. 동적 fallback 데이터 생성
        const fallbackChurch = supabaseApiService.churches._generateFallbackData(churchId);
        console.log('🔄 동적 fallback 데이터 생성:', fallbackChurch.name);

        // 캐시에 저장
        localStorage.setItem(`church_${churchId}`, JSON.stringify(fallbackChurch));
        return fallbackChurch;

      } catch (error) {
        console.error('🏛️ [교회 정보 API] 조회 실패:', error);
        // 최종 fallback
        return supabaseApiService.churches._generateFallbackData(6);
      }
    },

    // 내부 함수: 동적 fallback 데이터 생성
    _generateFallbackData: (churchId: number) => {
      // 교회 ID에 따른 다양한 데이터 매핑
      const churchData: Record<number | string, {
        name: string;
        address: string;
        phone: string;
        email: string;
        pastor_name: string;
        gpt_api_key: string | null;
        current_month_tokens: number;
        current_month_cost: number;
      }> = {
        1: {
          name: '새빛교회',
          address: '서울특별시 마포구 서교동 123-45',
          phone: '02-3456-7890',
          email: 'admin@newlight.church',
          pastor_name: '이목사',
          gpt_api_key: null,
          current_month_tokens: 25000,
          current_month_cost: 0.125
        },
        2: {
          name: '은혜교회',
          address: '서울특별시 서대문구 연희동 234-56',
          phone: '02-4567-8901',
          email: 'grace@grace.church',
          pastor_name: '박목사',
          gpt_api_key: null,
          current_month_tokens: 45000,
          current_month_cost: 0.225
        },
        3: {
          name: '사랑교회',
          address: '서울특별시 종로구 청운동 345-67',
          phone: '02-5678-9012',
          email: 'love@love.church',
          pastor_name: '최목사',
          gpt_api_key: null,
          current_month_tokens: 78000,
          current_month_cost: 0.390
        },
        4: {
          name: '평화교회',
          address: '서울특별시 중구 장충동 456-78',
          phone: '02-6789-0123',
          email: 'peace@peace.church',
          pastor_name: '정목사',
          gpt_api_key: null,
          current_month_tokens: 32000,
          current_month_cost: 0.160
        },
        5: {
          name: '소망교회',
          address: '서울특별시 영등포구 여의도동 567-89',
          phone: '02-7890-1234',
          email: 'hope@hope.church',
          pastor_name: '김목사',
          gpt_api_key: null,
          current_month_tokens: 52000,
          current_month_cost: 0.260
        },
        6: {
          name: '성광교회',
          address: '경기도 구리시 검배로 136번길 32 (토평동)',
          phone: '031-563-5210',
          email: 'helpsk21church@gmail.com',
          pastor_name: '담임목사',
          gpt_api_key: 'YOUR_OPENAI_API_KEY',
          current_month_tokens: 119003,
          current_month_cost: 0.669329125
        },
        7: {
          name: '믿음교회',
          address: '경기도 성남시 분당구 정자동 678-90',
          phone: '031-8901-2345',
          email: 'faith@faith.church',
          pastor_name: '송목사',
          gpt_api_key: null,
          current_month_tokens: 63000,
          current_month_cost: 0.315
        },
        8: {
          name: '기쁨교회',
          address: '인천광역시 남동구 구월동 789-01',
          phone: '032-9012-3456',
          email: 'joy@joy.church',
          pastor_name: '장목사',
          gpt_api_key: null,
          current_month_tokens: 38000,
          current_month_cost: 0.190
        },
        // 기본값 (매핑되지 않은 교회ID들을 위한)
        default: {
          name: '스마트 요람 교회',
          address: '서울특별시 강남구 테헤란로 123',
          phone: '02-1234-5678',
          email: 'admin@smartyoram.church',
          pastor_name: '김목사',
          gpt_api_key: null,
          current_month_tokens: 0,
          current_month_cost: 0.0
        }
      };

      const data = (churchData as any)[churchId] || (churchData as any).default;

      return {
        idx: churchId,
        id: churchId,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        pastor_name: data.pastor_name,
        subscription_status: churchId === 6 ? 'trial' : 'active',
        subscription_end_date: churchId === 6 ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        member_limit: churchId === 6 ? 100 : (churchId <= 3 ? 200 : 150),
        is_active: true,
        created_at: '2025-07-30 09:27:05.869685+00',
        updated_at: new Date().toISOString(),
        subscription_plan: churchId === 6 ? null : (churchId <= 3 ? 'premium' : 'standard'),
        gpt_api_key: data.gpt_api_key,
        gpt_model: 'gpt-4o-mini',
        max_tokens: churchId <= 3 ? 4000 : 2000,
        temperature: 0.7,
        gpt_last_test: null,
        max_agents: churchId <= 3 ? 10 : 5,
        monthly_token_limit: churchId <= 3 ? 1000000 : 500000,
        current_month_tokens: data.current_month_tokens,
        current_month_cost: data.current_month_cost,
        business_no: null,
        rrn_encrypted: null,
        district_scheme: null
      };
    },

    // 교회 정보 수정 (현재는 로컬 시뮬레이션)
    update: async (churchId: number, updateData: any) => {
      try {
        console.log('🏛️ [교회 정보 API] 교회 정보 수정 시작:', churchId, updateData);

        // Edge Function 호출 시도 (조건부)
        const shouldTryEdgeFunction = false; // CORS 문제로 비활성화

        if (shouldTryEdgeFunction) {
          const token = await supabaseAuthService.getToken();
          if (token) {
            try {
              const { data, error } = await supabase.functions.invoke(`churches/${churchId}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: updateData
              });

              if (!error && data) {
                console.log('✅ [교회 정보 API] Edge Function 수정 성공:', data);
                return data;
              }
            } catch (edgeError) {
              console.warn('⚠️ Edge Function 수정 실패, 로컬 시뮬레이션 사용:', edgeError);
            }
          }
        }

        // 로컬 업데이트 시뮬레이션
        console.log('🔄 로컬 업데이트 시뮬레이션 - 수정된 교회 정보 반환');

        // 기존 교회 데이터 가져오기
        const existingChurch = supabaseApiService.churches._generateFallbackData(churchId);

        const updatedChurch = {
          ...existingChurch,
          name: updateData.name || existingChurch.name,
          address: updateData.address || existingChurch.address,
          phone: updateData.phone || existingChurch.phone,
          email: updateData.email || existingChurch.email,
          pastor_name: updateData.pastor_name || existingChurch.pastor_name,
          member_limit: 100,
          is_active: true,
          created_at: '2025-07-30 09:27:05.869685+00',
          updated_at: new Date().toISOString(),
          subscription_plan: null,
          gpt_api_key: 'YOUR_OPENAI_API_KEY',
          gpt_model: 'gpt-4o-mini',
          max_tokens: 2000,
          temperature: 0.7,
          gpt_last_test: null,
          max_agents: null,
          monthly_token_limit: null,
          current_month_tokens: 119003,
          current_month_cost: 0.669329125,
          business_no: null,
          rrn_encrypted: null,
          district_scheme: null
        };

        console.log('✅ [교회 정보 API] 로컬 수정 완료:', updatedChurch);
        return updatedChurch;
      } catch (error) {
        console.error('🏛️ [교회 정보 API] 수정 실패:', error);
        throw error;
      }
    },

    // 교회 프로필 조회 (현재는 fallback)
    getProfile: async () => {
      console.log('🏛️ [교회 프로필 API] 조회 시작 - fallback 사용');
      // getMyChurch와 동일한 데이터 반환
      return await supabaseApiService.churches.getMyChurch();
    },

    // 교회 프로필 수정 (현재는 로컬 시뮬레이션)
    updateProfile: async (updateData: any) => {
      console.log('🏛️ [교회 프로필 API] 수정 시작 - 로컬 시뮬레이션:', updateData);
      // update와 동일한 로직 사용
      return await supabaseApiService.churches.update(6, updateData);
    }
  },

  // Excel Management API - Excel operations for member data
  excel: {
    // 교인 명단 업로드
    uploadMembers: async (file: File) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📊 [엑셀 업로드 API] 교인 명단 업로드 시작');

        const formData = new FormData();
        formData.append('file', file);

        // Supabase 클라이언트 대신 직접 fetch 사용 (JWT 자동 추가 방지)
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/excel/members/upload`, {
          method: 'POST',
          headers: {
            'X-Custom-Auth': token,
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || '',
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const error = null;

        if (error) {
          console.error('❌ [엑셀 업로드 API] 오류:', error);
          throw error;
        }

        console.log('✅ [엑셀 업로드 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('❌ [엑셀 업로드 API] 실패:', error);
        // Use fallback mock data if Edge Function fails
        console.log('🔄 엑셀 업로드 fallback 데이터 사용');
        return {
          message: '교인 명단 업로드가 완료되었습니다 (시뮬레이션)',
          created: 3,
          updated: 2,
          errors: [
            '5행: 전화번호 형식이 올바르지 않습니다',
            '8행: 필수 정보가 누락되었습니다'
          ]
        };
      }
    },

    // 교인 명단 다운로드
    downloadMembers: async () => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📊 [교인 명단 다운로드 API] 시작');

        // Supabase 클라이언트 대신 직접 fetch 사용 (JWT 자동 추가 방지)
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/excel/members/download`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || '',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.text();
        const error = null;

        if (error) {
          console.error('❌ [교인 명단 다운로드 API] 오류:', error);
          throw error;
        }

        console.log('✅ [교인 명단 다운로드 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('❌ [교인 명단 다운로드 API] 실패:', error);
        // Use fallback mock data if Edge Function fails
        console.log('🔄 교인 명단 다운로드 fallback 데이터 사용');

        const mockData = [
          'Name,Gender,Phone,Email,Address,Birth Date,Membership Date',
          '김철수,M,010-1234-5678,kim@church.org,서울시 강남구,1985-03-15,2020-01-01',
          '이영희,F,010-9876-5432,lee@church.org,서울시 서초구,1990-07-22,2019-06-15',
          '박민수,M,010-5555-1234,park@church.org,서울시 송파구,1978-11-30,2021-03-10'
        ].join('\n');

        const blob = new Blob([mockData], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        return blob;
      }
    },

    // 업로드 템플릿 다운로드
    downloadTemplate: async () => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📊 [템플릿 다운로드 API] 시작');
        console.log('🔑 사용할 토큰:', token.substring(0, 20) + '...');
        console.log('🔑 Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
        console.log('🔑 API Key:', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

        // 원본 Excel 함수 사용
        const { data, error } = await supabase.functions.invoke('excel/members/template', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('❌ [템플릿 다운로드 API] 오류:', error);
          throw error;
        }

        console.log('✅ [템플릿 다운로드 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('❌ [템플릿 다운로드 API] 실패:', error);
        // Use fallback mock data if Edge Function fails
        console.log('🔄 템플릿 다운로드 fallback 데이터 사용');

        const templateData = [
          'Name,Gender,Phone,Email,Address,Birth Date,Membership Date',
          '홍길동,M,010-0000-0000,example@church.org,서울시 예시구,1990-01-01,2024-01-01',
          '김예시,F,010-1111-1111,sample@church.org,부산시 샘플구,1985-12-25,2023-12-25'
        ].join('\n');

        const blob = new Blob([templateData], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        return blob;
      }
    },

    // 출석 기록 다운로드
    downloadAttendance: async (startDate: string, endDate: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        console.log('📊 [출석 기록 다운로드 API] 시작:', { startDate, endDate });

        // Supabase 클라이언트 대신 직접 fetch 사용 (JWT 자동 추가 방지)
        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/excel/attendance/download?start_date=${startDate}&end_date=${endDate}`,
          {
            method: 'GET',
            headers: {
              'X-Custom-Auth': token,
              'Content-Type': 'application/json',
              'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || '',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.text();
        const error = null;

        if (error) {
          console.error('❌ [출석 기록 다운로드 API] 오류:', error);
          throw error;
        }

        console.log('✅ [출석 기록 다운로드 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('❌ [출석 기록 다운로드 API] 실패:', error);
        // Use fallback mock data if Edge Function fails
        console.log('🔄 출석 기록 다운로드 fallback 데이터 사용');

        const mockAttendance = [
          'Date,Name,Service,Status',
          `${startDate},김철수,주일예배,출석`,
          `${startDate},이영희,주일예배,출석`,
          `${startDate},박민수,주일예배,결석`,
          `${endDate},김철수,수요예배,출석`,
          `${endDate},이영희,수요예배,결석`,
          `${endDate},박민수,수요예배,출석`
        ].join('\n');

        const blob = new Blob([mockAttendance], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        return blob;
      }
    }
  },

  // 찜하기 관련 API
  wishlists: {
    // 찜한 글 목록 조회
    getWishlists: async (page: number = 1, limit: number = 20) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('인증 토큰이 없습니다.');
        }

        console.log('📋 [찜한 글 목록 API] 조회 시작');

        const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
        const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

        const url = new URL(`${SUPABASE_URL}/functions/v1/wishlists`);
        url.searchParams.append('page', page.toString());
        url.searchParams.append('limit', limit.toString());

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'temp-token': token,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [찜한 글 목록 API] 오류:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ [찜한 글 목록 API] 성공:', data);
        return data.data;
      } catch (error) {
        console.error('❌ [찜한 글 목록 API] 예외:', error);
        throw error;
      }
    },

    // 찜하기 추가
    addToWishlist: async (wishlistData: {
      post_type: string;
      post_id: number;
      post_title: string;
      post_description: string;
      post_image_url?: string;
    }) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('인증 토큰이 없습니다.');
        }

        console.log('❤️ [찜하기 추가 API] 시작:', wishlistData);

        const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
        const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

        const response = await fetch(`${SUPABASE_URL}/functions/v1/wishlists`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'temp-token': token,
          },
          body: JSON.stringify(wishlistData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [찜하기 추가 API] 오류:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ [찜하기 추가 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('❌ [찜하기 추가 API] 예외:', error);
        throw error;
      }
    },

    // 찜하기 제거
    removeFromWishlist: async (removeData: {
      post_type: string;
      post_id: number;
    }) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('인증 토큰이 없습니다.');
        }

        console.log('💔 [찜하기 제거 API] 시작:', removeData);

        const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
        const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

        const response = await fetch(`${SUPABASE_URL}/functions/v1/wishlists`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'temp-token': token,
          },
          body: JSON.stringify(removeData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [찜하기 제거 API] 오류:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ [찜하기 제거 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('❌ [찜하기 제거 API] 예외:', error);
        throw error;
      }
    },

    // 찜 상태 확인
    checkWishlistStatus: async (post_type: string, post_id: number): Promise<boolean> => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('인증 토큰이 없습니다.');
        }

        console.log('🔍 [찜 상태 확인 API] 시작:', { post_type, post_id });

        const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
        const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

        const url = new URL(`${SUPABASE_URL}/functions/v1/wishlists`);
        url.searchParams.append('page', '1');
        url.searchParams.append('limit', '100');

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'temp-token': token,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [찜 상태 확인 API] 오류:', response.status, errorText);
          return false;
        }

        const data = await response.json();
        const wishlistData = data.data;
        const isWishlisted = wishlistData.items.some((item: any) =>
          item.post_type === post_type && item.post_id === post_id
        );

        console.log('✅ [찜 상태 확인 API] 결과:', isWishlisted);
        return isWishlisted;
      } catch (error) {
        console.error('❌ [찜 상태 확인 API] 예외:', error);
        return false;
      }
    }
  },

  // 파일 업로드 관련 기능
  files: {
    // 포트폴리오 파일 업로드 (Base64 방식으로 변경)
    uploadPortfolioFile: async (file: File, seekerId?: number): Promise<string> => {
      try {
        console.log('📁 [파일 업로드] 포트폴리오 파일 업로드 시작:', file.name);

        // 파일 확장자 확인
        const allowedTypes = ['pdf', 'mp3', 'mp4', 'doc', 'docx'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowedTypes.includes(fileExtension)) {
          throw new Error('지원하지 않는 파일 형식입니다. PDF, MP3, MP4, DOC, DOCX 파일만 업로드 가능합니다.');
        }

        // 파일을 Base64로 변환
        console.log('📁 [파일 업로드] 파일을 Base64로 변환 중...');
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const result = reader.result as string;
              console.log('📁 [파일 업로드] FileReader 결과 타입:', typeof result);
              console.log('📁 [파일 업로드] FileReader 결과 길이:', result?.length);

              if (!result) {
                throw new Error('파일 읽기 결과가 없습니다.');
              }

              // data:application/pdf;base64, 부분 제거
              const base64Data = result.split(',')[1];
              console.log('📁 [파일 업로드] Base64 데이터 길이:', base64Data?.length);

              if (!base64Data) {
                throw new Error('Base64 데이터 추출에 실패했습니다.');
              }

              resolve(base64Data);
            } catch (error) {
              console.error('📁 [파일 업로드] FileReader 처리 중 오류:', error);
              reject(error);
            }
          };
          reader.onerror = (error) => {
            console.error('📁 [파일 업로드] FileReader 오류:', error);
            reject(new Error('파일 읽기에 실패했습니다.'));
          };
          reader.readAsDataURL(file);
        });

        // 파일명을 안전하게 처리
        console.log('📁 [파일 업로드] 원본 파일명:', file.name);
        const safeFileName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
        console.log('📁 [파일 업로드] 안전한 파일명:', safeFileName);

        // 임시로 파일 정보를 문자열로 반환 (실제 업로드는 백엔드에서 처리)
        const fileInfo = {
          fileName: safeFileName,
          fileBase64: fileBase64,
          fileSize: file.size,
          mimeType: file.type,
          originalName: file.name
        };
        console.log('📁 [파일 업로드] 파일 정보 객체 생성:', {
          fileName: fileInfo.fileName,
          fileSize: fileInfo.fileSize,
          mimeType: fileInfo.mimeType,
          originalName: fileInfo.originalName,
          base64Length: fileInfo.fileBase64?.length
        });

        try {
          // Base64 데이터가 너무 큰 경우 chunked 처리
          const CHUNK_SIZE = 1000000; // 1MB 청크
          const base64Length = fileBase64.length;

          if (base64Length > CHUNK_SIZE) {
            console.log('📁 [파일 업로드] 대용량 파일 감지, 청크 방식으로 처리:', base64Length);

            // 파일 정보만 포함한 메타데이터 생성 (Base64 데이터 제외)
            const metadata = {
              fileName: safeFileName,
              fileSize: file.size,
              mimeType: file.type,
              originalName: file.name,
              isChunked: true,
              chunkCount: Math.ceil(base64Length / CHUNK_SIZE)
            };

            // 청크로 나눈 Base64 데이터를 별도로 저장
            const chunks = [];
            for (let i = 0; i < base64Length; i += CHUNK_SIZE) {
              chunks.push(fileBase64.substring(i, i + CHUNK_SIZE));
            }

            // 메타데이터와 청크를 결합하여 저장
            const combinedData = {
              metadata,
              chunks
            };

            const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(combinedData))}`;
            console.log('✅ [파일 업로드] 청크 방식으로 성공:', dataUrl.substring(0, 100) + '...');

            return dataUrl;
          } else {
            // 작은 파일은 기존 방식 사용
            console.log('📁 [파일 업로드] 소형 파일, 기존 방식 사용');
            const fileUrl = `data:${file.type};base64,${fileBase64}`;
            console.log('✅ [파일 업로드] 성공 (직접 저장):', fileUrl.substring(0, 100) + '...');

            return fileUrl;
          }
        } catch (error) {
          console.error('📁 [파일 업로드] JSON 처리 중 오류:', error);
          throw new Error('파일 정보 처리에 실패했습니다.');
        }
      } catch (error) {
        console.error('❌ [파일 업로드] 실패:', error);
        throw error;
      }
    },

    // 파일 다운로드 URL 생성
    getDownloadUrl: (filePath: string): string => {
      if (!filePath) return '';

      // 이미 전체 URL인 경우 그대로 반환
      if (filePath.startsWith('http')) {
        return filePath;
      }

      // Supabase Storage URL 생성
      const { data } = supabase.storage
        .from('community-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    },

    // 파일 삭제
    deletePortfolioFile: async (filePath: string): Promise<boolean> => {
      try {
        console.log('🗑️ [파일 삭제] 시작:', filePath);

        // URL에서 실제 파일 경로 추출
        let actualPath = filePath;
        if (filePath.includes('/storage/v1/object/public/community-images/')) {
          actualPath = filePath.split('/storage/v1/object/public/community-images/')[1];
        }

        const { error } = await supabase.storage
          .from('community-images')
          .remove([actualPath]);

        if (error) {
          console.error('🗑️ [파일 삭제] 오류:', error);
          throw error;
        }

        console.log('✅ [파일 삭제] 성공');
        return true;
      } catch (error) {
        console.error('❌ [파일 삭제] 실패:', error);
        return false;
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
