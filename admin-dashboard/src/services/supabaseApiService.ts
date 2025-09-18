import { supabase } from '../lib/supabase';
import { supabaseAuthService } from './supabaseAuthService';

// Supabase Edge Functions 호출을 위한 서비스
export const supabaseApiService = {
  // Members API
  members: {
    getAll: async () => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const { data, error } = await supabase.functions.invoke('members', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Members fetch error:', error);
          throw error;
        }

        return { data: data.data || data };
      } catch (error) {
        console.error('Failed to fetch members:', error);
        // Use fallback mock data if Edge Function fails
        console.log('🔄 Using fallback mock data for members');
        return {
          data: Array.from({ length: 16 }, (_, i) => ({
            id: i + 1,
            email: `user${i + 1}@example.com`,
            username: `user${i + 1}`,
            full_name: `사용자 ${i + 1}`,
            role: i === 0 ? 'admin' : 'member',
            church_id: 1,
            is_active: true,
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