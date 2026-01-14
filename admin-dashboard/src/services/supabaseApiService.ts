import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { supabaseAuthService } from './supabaseAuthService';

// Supabase Edge Functions 호출을 위한 서비스
export const supabaseApiService = {
  // Supabase 클라이언트 접근
  supabase,


  // Members API
  members: {
    getAll: async (filters: { page?: number; limit?: number; search?: string; position?: string; department?: string; status?: string; church_id?: number } = {}) => {
      try {
        // console.log('👥 [교인 API] 교인 목록 조회 시작:', filters);

        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const params = new URLSearchParams();
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.position) params.append('position', filters.position);
        if (filters.department) params.append('department', filters.department);
        if (filters.status) params.append('status', filters.status);

        // Use direct fetch instead of supabase.functions.invoke for GET requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/members?${params.toString()}`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // Edge Function이 배열을 직접 반환하므로 data 자체가 배열
        const members = Array.isArray(data) ? data : (data?.data || []);

        // console.log('✅ [교인 API] 조회 성공:', members.length, '명');
        return { data: members };
      } catch (error) {
        console.error('👥 [교인 API] 조회 실패:', error);
        // Use fallback mock data if Edge Function fails
        // console.log('🔄 Using fallback mock data for members');
        return {
          data: Array.from({ length: 16 }, (_, i) => ({
            id: i + 1,
            email: `user${i + 1}@example.com`,
            username: `user${i + 1}`,
            name: `사용자 ${i + 1}`,
            full_name: `사용자 ${i + 1}`,
            role: i === 0 ? 'admin' : 'member',
            church_id: 9998,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        };
      }
    },

    create: async (memberData: any) => {
      try {
        // console.log('👥 [교인 생성 API] 시작:', memberData);

        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        // Use direct fetch instead of supabase.functions.invoke for POST requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/members`;

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(memberData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('👥 [교인 생성 API] 에러 응답:', errorText);
          console.error('👥 [교인 생성 API] 에러 상태 코드:', response.status);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const error = null;

        if (error) {
          console.error('👥 [교인 생성 API] 오류:', error);
          throw error;
        }

        // console.log('✅ [교인 생성 API] 성공:', data);
        return { data };
      } catch (error) {
        console.error('👥 [교인 생성 API] 실패:', error);
        throw error;
      }
    },

    update: async (memberData: any) => {
      try {
        // console.log('👥 [교인 수정 API] 시작:', memberData);

        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        // Extract member ID from memberData
        const memberId = memberData.id;
        if (!memberId) {
          throw new Error('Member ID is required for update');
        }

        // Remove id from the data to be sent (should not be in the update payload)
        const { id, ...updateData } = memberData;

        // Use direct fetch instead of supabase.functions.invoke for PUT requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/members/${memberId}`;

        // console.log('👥 [교인 수정 API] URL:', functionsUrl);
        // console.log('👥 [교인 수정 API] 수정 데이터:', updateData);

        const response = await fetch(functionsUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('👥 [교인 수정 API] HTTP 오류:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const error = null;

        if (error) {
          console.error('👥 [교인 수정 API] 오류:', error);
          throw error;
        }

        // console.log('✅ [교인 수정 API] 성공:', data);
        return { data };
      } catch (error: any) {
        console.error('👥 [교인 수정 API] 실패:', error);
        console.error('👥 [교인 수정 API] 에러 상세:', error.message);
        throw error;
      }
    },

    delete: async (memberId: number) => {
      try {
        // console.log('👥 [교인 삭제 API] 시작:', memberId);

        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        // Use direct fetch instead of supabase.functions.invoke for DELETE requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/members?id=${memberId}`;

        const response = await fetch(functionsUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const error = null;

        if (error) {
          console.error('👥 [교인 삭제 API] 오류:', error);
          throw error;
        }

        // console.log('✅ [교인 삭제 API] 성공:', data);
        return { data };
      } catch (error) {
        console.error('👥 [교인 삭제 API] 실패:', error);
        throw error;
      }
    }
  },

  // Attendances API
  attendances: {
    getByDateRange: async (startDate: string, endDate: string) => {
      // Edge Functions not deployed yet, use fallback mock data
      // console.log('🔄 Using fallback mock data for attendances');
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
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/system-announcements`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Active announcements fetch error:', error);
          throw new Error(error.error || 'Failed to fetch active announcements');
        }

        const data = await response.json();
        return { data: data || [] };
      } catch (error) {
        console.error('Failed to fetch active announcements:', error);
        return { data: [] };
      }
    },

    // 시스템 공지사항 관리 조회 (시스템 관리자용) - Edge Function 사용
    getAdmin: async () => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/system-announcements?admin=true`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Admin announcements fetch error:', error);
          throw new Error(error.error || 'Failed to fetch admin announcements');
        }

        const data = await response.json();
        return { data: data || [] };
      } catch (error) {
        console.error('Failed to fetch admin announcements:', error);
        return { data: [] };
      }
    },

    // 교회 목록 조회 - Supabase 직접 쿼리 사용
    getChurches: async () => {
      try {
        // console.log('🏛️ [교회 목록] 조회 시작');

        const { data, error } = await supabase
          .from('churches')
          .select('id, name, pastor_name, address')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('🏛️ [교회 목록] 조회 오류:', error);
          throw error;
        }

        // console.log('✅ [교회 목록] 조회 성공:', data?.length || 0, '개');
        return { data: data || [] };
      } catch (error) {
        console.error('🏛️ [교회 목록] 조회 실패:', error);
        // 폴백 데이터 제공
        return {
          data: [
            {
              id: 9998,
              name: "테스트 교회",
              pastor_name: "김목사",
              address: "서울시 강남구"
            }
          ]
        };
      }
    },

    markAsRead: async (announcementId: number) => {
      // Edge Functions not deployed yet, use fallback
      // console.log('🔄 Using fallback for mark as read');
      return { data: { message: 'Marked as read' } };
    },

    create: async (announcementData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/system-announcements`;

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(announcementData),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Announcement creation error:', error);
          throw new Error(error.error || 'Failed to create announcement');
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('Failed to create announcement:', error);
        throw error;
      }
    },

    update: async (id: number, announcementData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        // Use Supabase client directly for update
        const { data, error } = await supabase
          .from('system_announcements')
          .update(announcementData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Announcement update error:', error);
          throw error;
        }

        return { data };
      } catch (error) {
        console.error('Failed to update announcement:', error);
        throw error;
      }
    },

    delete: async (id: number) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        // Use Supabase client directly for delete
        const { error } = await supabase
          .from('system_announcements')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Announcement deletion error:', error);
          throw error;
        }

        return { data: { message: 'Announcement deleted successfully' } };
      } catch (error) {
        console.error('Failed to delete announcement:', error);
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
        // console.log('🔄 Using fallback mock data for community sharing');
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
        // console.log('🔄 Using fallback for community sharing creation');
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
        if (filters.exclude_completed) params.append('exclude_completed', 'true');
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        // Use fetch directly for GET request
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/pastoral-care/admin/requests${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        const responseText = await response.text();
        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: responseText };
          }
          console.error('❌ [심방신청 API] Edge Function 오류:', errorData);
          throw new Error(errorData.error || 'Failed to fetch pastoral care requests');
        }

        const data = JSON.parse(responseText);
        return { data: data.data || data };
      } catch (error) {
        console.error('Failed to fetch pastoral care requests:', error);
        // Use fallback mock data if Edge Function fails
        // console.log('🔄 Using fallback mock data for pastoral care');
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

        // Use fetch directly for GET request
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/pastoral-care/admin/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        const responseText = await response.text();
        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: responseText };
          }
          console.error('Pastoral care stats error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch stats');
        }

        const data = JSON.parse(responseText);
        return { data };
      } catch (error) {
        console.error('Failed to fetch pastoral care stats:', error);
        // Use fallback mock data if Edge Function fails
        // console.log('🔄 Using fallback mock data for pastoral care stats');
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

        // Use fetch directly for GET request
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/pastoral-care/admin/requests/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        const responseText = await response.text();
        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: responseText };
          }
          console.error('Pastoral care request fetch error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch request');
        }

        const data = JSON.parse(responseText);
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

        // Use fetch directly to get better error details
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/pastoral-care/admin/requests`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        const responseText = await response.text();

        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: responseText };
          }
          console.error('Server error:', errorData);
          throw new Error(errorData.error || errorData.details || 'Failed to create pastoral care request');
        }

        const data = JSON.parse(responseText);
        return { data };
      } catch (error) {
        console.error('Failed to create pastoral care request:', error);
        throw error;
      }
    },

    update: async (id: any, requestData: any) => {
      try {
        // Use Supabase client directly instead of Edge Function
        const { data, error } = await supabase
          .from('pastoral_care_requests')
          .update(requestData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Database update error:', error);
          throw new Error(error.message || 'Failed to update pastoral care request');
        }

        return { data };
      } catch (error) {
        console.error('Failed to update pastoral care request:', error);
        throw error;
      }
    },

    complete: async (id: any, completionData: any) => {
      try {
        // Use Supabase client directly instead of Edge Function
        const updateData = {
          status: 'completed',
          completed_at: new Date().toISOString(),
          ...completionData
        };

        const { data, error } = await supabase
          .from('pastoral_care_requests')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Database update error:', error);
          throw new Error(error.message || 'Failed to complete pastoral care request');
        }

        return { data };
      } catch (error) {
        console.error('Failed to complete pastoral care request:', error);
        throw error;
      }
    },

    assignPastor: async (id: any, pastorId: any) => {
      try {
        // Use Supabase client directly instead of Edge Function
        const updateData: any = {
          assigned_pastor_id: pastorId || null
        };

        const { data, error } = await supabase
          .from('pastoral_care_requests')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Database update error:', error);
          throw new Error(error.message || 'Failed to assign pastor');
        }

        return { data };
      } catch (error) {
        console.error('Failed to assign pastor:', error);
        throw error;
      }
    },

    delete: async (id: any) => {
      try {
        const { data, error } = await supabase
          .from('pastoral_care_requests')
          .delete()
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Database delete error:', error);
          throw new Error(error.message || 'Failed to delete pastoral care request');
        }

        return { data };
      } catch (error) {
        console.error('Failed to delete pastoral care request:', error);
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

        // console.log('🙏 [기도요청 API] Edge Function 호출 시작:', `prayer-requests/admin/requests${url}`);
        // console.log('🙏 [기도요청 API] 필터 파라미터:', filters);

        const { data, error } = await supabase.functions.invoke(`prayer-requests/admin/requests${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        // console.log('🙏 [기도요청 API] Edge Function 응답 전체:', { data, error });

        if (error) {
          console.error('Prayer requests API error:', error);
          throw error;
        }

        // console.log('✅ [기도요청 API] Edge Function 성공, 데이터 반환:', data);
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

        // 직접 fetch 사용
        const functionUrl = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/prayer-requests`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...requestData, action: 'create' })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🙏 [기도요청 생성] 응답 오류:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const data = await response.json();

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

        const { data, error } = await supabase.functions.invoke('prayer-requests', {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: { ...updateData, requestId: id }
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

        const { data, error } = await supabase.functions.invoke('prayer-requests', {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: { ...answeredData, requestId: id, action: 'answer' }
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

        const { data, error } = await supabase.functions.invoke('prayer-requests', {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: { requestId: id, action: 'pray' }
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

        const { data, error } = await supabase.functions.invoke('prayer-requests', {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: { requestId: id }
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

        // console.log('💰 [헌금 API] Edge Function 호출 시작:', `offerings/admin/offerings${url}`);
        // console.log('💰 [헌금 API] 필터 파라미터:', filters);

        const { data, error } = await supabase.functions.invoke(`offerings/admin/offerings${url}`, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        // console.log('💰 [헌금 API] Edge Function 응답 전체:', { data, error });

        if (error) {
          console.error('Offerings API error:', error);
          throw error;
        }

        // console.log('✅ [헌금 API] Edge Function 성공, 데이터 반환:', data);
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


        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/offerings/admin/offerings`;

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(offeringData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Offering creation error:', errorText);
          throw new Error(`Failed to create offering: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to create offering:', error);
        throw error;
      }
    },

    update: async (id: string, updateData: any) => {
      try {
        // console.log('🔍 Updating offering:', id, updateData);

        // 1. 기존 헌금 데이터 조회 (accounting_transaction_id 포함)
        const { data: existingOffering, error: fetchError } = await supabase
          .from('offerings')
          .select('accounting_transaction_id, church_id, member_id')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('Failed to fetch existing offering:', fetchError);
          throw fetchError;
        }

        // 2. 헌금 데이터 업데이트
        const { data, error } = await supabase
          .from('offerings')
          .update({
            offered_on: updateData.offered_on,
            fund_type: updateData.fund_type,
            amount: updateData.amount,
            note: updateData.note,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select(`
            *,
            members:member_id(id, name, email)
          `)
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }

        // console.log('✅ Offering updated successfully:', data);

        // 3. 연동된 회계 거래가 있으면 업데이트
        if (existingOffering?.accounting_transaction_id) {
          // console.log('🔍 Updating linked accounting transaction:', existingOffering.accounting_transaction_id);

          // 기부자 이름 조회
          let donorName = '무명';
          const memberId = data.member_id;
          if (memberId) {
            const { data: memberData } = await supabase
              .from('members')
              .select('name')
              .eq('id', memberId)
              .single();

            if (memberData) {
              donorName = memberData.name;
            }
          }

          // 회계 거래 업데이트
          const accountingUpdateData: any = {
            transaction_date: updateData.offered_on,
            amount: updateData.amount,
            description: `헌금 - ${donorName}${data.note ? ` (${data.note})` : ''}`,
            updated_at: new Date().toISOString()
          };

          // 헌금 유형이 변경되었으면 계정과목도 업데이트
          if (updateData.fund_type) {
            // 헌금 유형을 회계 계정과목명으로 매핑
            const fundTypeMapping: { [key: string]: string } = {
              '십일조': '십일조',
              '주일헌금': '주일헌금',
              '감사헌금': '감사헌금',
              '선교헌금': '선교헌금',
              '건축헌금': '건축헌금',
              '절기헌금': '절기헌금',
              '특별헌금': '특별헌금',
              '기타': '기타헌금',
            };
            const categoryName = fundTypeMapping[updateData.fund_type] || '기타헌금';

            const { data: categoryData } = await supabase
              .from('account_categories')
              .select('id')
              .eq('church_id', existingOffering.church_id)
              .eq('name', categoryName)
              .eq('type', 'income')
              .single();

            if (categoryData) {
              accountingUpdateData.category_id = categoryData.id;
            }
          }

          const { error: accountingUpdateError } = await supabase
            .from('accounting_transactions')
            .update(accountingUpdateData)
            .eq('id', existingOffering.accounting_transaction_id);

          if (accountingUpdateError) {
            // console.warn('⚠️ 회계 거래 업데이트 실패:', accountingUpdateError);
          } else {
            // console.log('✅ 회계 거래 동기화 완료');
          }
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

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/offerings/admin/offerings/${id}`;

        const response = await fetch(functionsUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Offering deletion error:', errorText);
          throw new Error(`Failed to delete offering: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to delete offering:', error);
        throw error;
      }
    }
  },

  // Receipts API
  receipts: {
    getAll: async (filters: any = {}) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const params = new URLSearchParams();
        if (filters.member_id) params.append('member_id', filters.member_id.toString());
        if (filters.tax_year) params.append('tax_year', filters.tax_year.toString());
        if (filters.church_id) params.append('church_id', filters.church_id.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const url = queryString ? `?${queryString}` : '';

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/receipts${url}`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to fetch receipts:', error);
        throw error;
      }
    },

    create: async (receiptData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/receipts`;

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(receiptData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Receipt creation error:', errorText);
          throw new Error(`Failed to create receipt: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to create receipt:', error);
        throw error;
      }
    },

    update: async (id: string, updateData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/receipts/${id}`;

        const response = await fetch(functionsUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Receipt update error:', errorText);
          throw new Error(`Failed to update receipt: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to update receipt:', error);
        throw error;
      }
    },

    delete: async (id: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/receipts/${id}`;

        const response = await fetch(functionsUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Receipt deletion error:', errorText);
          throw new Error(`Failed to delete receipt: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to delete receipt:', error);
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

        // Use direct fetch for GET requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const functionsUrl = `${supabaseUrl}/functions/v1/daily-verses/today`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // console.log('✅ [오늘의 말씀 API] 조회 성공:', data);
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

        const params = new URLSearchParams();
        if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();

        // Use direct fetch for GET requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const functionsUrl = `${supabaseUrl}/functions/v1/daily-verses/admin/verses${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey || '',
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('📋 [말씀 목록 API] 오류 응답:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
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

        // Use direct fetch for POST requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const functionsUrl = `${supabaseUrl}/functions/v1/daily-verses/admin/verses`;

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey || '',
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verseData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
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

        // Use direct fetch for PUT requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const functionsUrl = `${supabaseUrl}/functions/v1/daily-verses/admin/verses/${id}`;

        const response = await fetch(functionsUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey || '',
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verseData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
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

        // Use direct fetch for DELETE requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const functionsUrl = `${supabaseUrl}/functions/v1/daily-verses/admin/verses/${id}`;

        const response = await fetch(functionsUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey || '',
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🗑️ [말씀 삭제 API] 오류 응답:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
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

        // console.log('⛪ [예배 서비스 API] 목록 조회 시작:', filters);

        const params = new URLSearchParams();
        if (filters.church_id) params.append('church_id', filters.church_id.toString());
        if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        // Use direct fetch instead of supabase.functions.invoke for GET requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/worship-services/admin/services?${params.toString()}`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('⛪ [예배 서비스 API] 목록 조회 오류:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        // console.log('✅ [예배 서비스 API] 목록 조회 성공:', data);
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

        // console.log('⛪ [예배 서비스 API] 단일 조회 시작:', id);

        // Use direct fetch instead of supabase.functions.invoke for GET requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/worship-services/admin/services/${id}`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('⛪ [예배 서비스 API] 단일 조회 오류:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        // console.log('✅ [예배 서비스 API] 단일 조회 성공:', data);
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

        // console.log('⛪ [예배 서비스 API] 교회별 조회 시작:', churchId);

        // Use direct fetch instead of supabase.functions.invoke for GET requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/worship-services/church/${churchId}`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('⛪ [예배 서비스 API] 교회별 조회 오류:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        // console.log('✅ [예배 서비스 API] 교회별 조회 성공:', data);
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


        // Use direct fetch instead of supabase.functions.invoke for POST requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/worship-services/admin/services`;

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serviceData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('⛪ [예배 서비스 API] 생성 오류:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error: any) {
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


        // Use direct fetch instead of supabase.functions.invoke for PUT requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/worship-services/admin/services/${id}`;

        const response = await fetch(functionsUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serviceData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('⛪ [예배 서비스 API] 수정 오류:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
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


        // Use direct fetch instead of supabase.functions.invoke for DELETE requests
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/worship-services/admin/services/${id}`;


        const response = await fetch(functionsUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('⛪ [예배 서비스 API] 삭제 오류:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('⛪ [예배 서비스 API] 삭제 실패:', error);
        throw error;
      }
    },

    // 카테고리 관리
    categories: {
      // 카테고리 목록 조회
      getAll: async (churchId: number) => {
        try {
          const token = await supabaseAuthService.getToken();
          if (!token) {
            throw new Error('No authentication token available');
          }

          const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
          const functionsUrl = `${supabaseUrl}/functions/v1/worship-services/categories?church_id=${churchId}`;

          const response = await fetch(functionsUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'X-Custom-Auth': token,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('📂 [카테고리 API] 목록 조회 오류:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const result = await response.json();
          return result.data || [];
        } catch (error) {
          console.error('📂 [카테고리 API] 목록 조회 실패:', error);
          throw error;
        }
      },

      // 카테고리 생성
      create: async (categoryData: {
        church_id: number;
        name: string;
        description?: string;
        order_index?: number;
      }) => {
        try {
          const token = await supabaseAuthService.getToken();
          if (!token) {
            throw new Error('No authentication token available');
          }

          const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
          const functionsUrl = `${supabaseUrl}/functions/v1/worship-services/categories`;

          const response = await fetch(functionsUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'X-Custom-Auth': token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('📂 [카테고리 API] 생성 오류:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          return data;
        } catch (error) {
          console.error('📂 [카테고리 API] 생성 실패:', error);
          throw error;
        }
      },

      // 카테고리 수정
      update: async (id: number, categoryData: {
        name?: string;
        description?: string;
        order_index?: number;
      }) => {
        try {
          const token = await supabaseAuthService.getToken();
          if (!token) {
            throw new Error('No authentication token available');
          }

          const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
          const functionsUrl = `${supabaseUrl}/functions/v1/worship-services/categories/${id}`;

          const response = await fetch(functionsUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'X-Custom-Auth': token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('📂 [카테고리 API] 수정 오류:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          return data;
        } catch (error) {
          console.error('📂 [카테고리 API] 수정 실패:', error);
          throw error;
        }
      },

      // 카테고리 삭제
      delete: async (id: number) => {
        try {
          const token = await supabaseAuthService.getToken();
          if (!token) {
            throw new Error('No authentication token available');
          }

          const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
          const functionsUrl = `${supabaseUrl}/functions/v1/worship-services/categories/${id}`;

          const response = await fetch(functionsUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'X-Custom-Auth': token,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('📂 [카테고리 API] 삭제 오류:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          return data;
        } catch (error) {
          console.error('📂 [카테고리 API] 삭제 실패:', error);
          throw error;
        }
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

        // console.log('📰 [주보 API] 목록 조회 시작:', filters);

        const params = new URLSearchParams();
        if (filters.church_id) params.append('church_id', filters.church_id.toString());
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();

        // Use direct fetch instead of supabase.functions.invoke to support custom paths
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const url = `${supabaseUrl}/functions/v1/bulletins/admin/bulletins${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('📰 [주보 API] 목록 조회 오류:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // console.log('✅ [주보 API] 목록 조회 성공:', data);
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

        // console.log('📰 [주보 API] 단일 조회 시작:', id);

        // Use direct fetch instead of supabase.functions.invoke to support custom paths
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const url = `${supabaseUrl}/functions/v1/bulletins/admin/bulletins/${id}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('📰 [주보 API] 단일 조회 오류:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // console.log('✅ [주보 API] 단일 조회 성공:', data);
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

        // console.log('📰 [주보 API] 교회별 조회 시작:', churchId);

        // Use direct fetch instead of supabase.functions.invoke to support custom paths
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const url = `${supabaseUrl}/functions/v1/bulletins/church/${churchId}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('📰 [주보 API] 교회별 조회 오류:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // console.log('✅ [주보 API] 교회별 조회 성공:', data);
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

        // console.log('📰 [주보 API] 생성 시작:', bulletinData);

        // Use direct fetch instead of supabase.functions.invoke to support custom paths
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        const url = `${supabaseUrl}/functions/v1/bulletins/admin/bulletins`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(bulletinData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('📰 [주보 API] 생성 오류:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // console.log('✅ [주보 API] 생성 성공:', data);
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


        // Directly query the database instead of using Edge Function for PUT
        const { data, error } = await supabase
          .from('bulletins')
          .update({
            title: bulletinData.title,
            date: bulletinData.date,
            content: bulletinData.content,
            file_url: bulletinData.file_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('📰 [주보 API] 수정 오류:', error);
          throw error;
        }

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

        // Directly query the database instead of using Edge Function for DELETE
        // This avoids CORS preflight issues with DELETE requests
        const { error } = await supabase
          .from('bulletins')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('📰 [주보 API] 삭제 오류:', error);
          throw error;
        }

        console.log('✅ [주보 API] 삭제 성공:', id);
        return { message: 'Bulletin deleted successfully' };
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

        // console.log('📢 [공지사항 API] 목록 조회 시작:', filters);

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

        // console.log('✅ [공지사항 API] 목록 조회 성공:', data);
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

        // console.log('📢 [공지사항 API] 단일 조회 시작:', id);

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

        // console.log('✅ [공지사항 API] 단일 조회 성공:', data);
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

        // console.log('📢 [공지사항 API] 교회별 조회 시작:', churchId);

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

        // console.log('✅ [공지사항 API] 교회별 조회 성공:', data);
        return data;
      } catch (error) {
        console.error('📢 [공지사항 API] 교회별 조회 실패:', error);
        throw error;
      }
    },

    // 공지사항 생성
    create: async (announcementData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }


        // Filter out fields that don't exist in the announcements table
        // Note: author_id removed due to foreign key constraint with users table
        const allowedFields = [
          'title', 'content', 'author_name', 'church_id',
          'is_active', 'is_pinned', 'target_audience', 'category', 'subcategory'
        ];

        const filteredData: any = {};
        for (const key of allowedFields) {
          if (announcementData[key] !== undefined) {
            filteredData[key] = announcementData[key];
          }
        }


        // Directly query the database instead of using Edge Function for POST
        const { data, error } = await supabase
          .from('announcements')
          .insert([filteredData])
          .select()
          .single();

        if (error) {
          console.error('📢 [공지사항 API] 생성 오류:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('📢 [공지사항 API] 생성 실패:', error);
        throw error;
      }
    },

    // 공지사항 수정
    update: async (id: string, announcementData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }


        // Filter out fields that don't exist in the announcements table
        // Note: author_id removed due to foreign key constraint with users table
        const allowedFields = [
          'title', 'content', 'author_name', 'church_id',
          'is_active', 'is_pinned', 'target_audience', 'category', 'subcategory'
        ];

        const filteredData: any = {};
        for (const key of allowedFields) {
          if (announcementData[key] !== undefined) {
            filteredData[key] = announcementData[key];
          }
        }

        filteredData.updated_at = new Date().toISOString();


        // Directly query the database instead of using Edge Function for PUT
        const { data, error } = await supabase
          .from('announcements')
          .update(filteredData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('📢 [공지사항 API] 수정 오류:', error);
          throw error;
        }

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


        // Directly query the database instead of using Edge Function for DELETE
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('📢 [공지사항 API] 삭제 오류:', error);
          throw error;
        }

        return { message: 'Announcement deleted successfully' };
      } catch (error) {
        console.error('📢 [공지사항 API] 삭제 실패:', error);
        throw error;
      }
    }
  },

  // Churches API
  churches: {
    // Get all churches with subscription info
    getAllWithSubscription: async () => {
      try {
        // console.log('🏛️ [교회 구독 정보] 전체 교회 조회 시작');

        const { data, error } = await supabase
          .from('churches')
          .select(`
            id,
            serial_id,
            name,
            address,
            phone,
            email,
            pastor_name,
            denomination,
            subscription_plan,
            subscription_status,
            subscription_end_date,
            member_limit,
            created_at,
            updated_at,
            is_active,
            business_no,
            homepage_url,
            youtube_channel,
            account
          `)
          .order('serial_id', { ascending: true });

        if (error) {
          console.error('🏛️ [교회 구독 정보] 오류:', error);
          throw error;
        }

        // console.log('✅ [교회 구독 정보] 조회 성공:', data?.length, '개 교회');
        return { data };
      } catch (error) {
        console.error('🏛️ [교회 구독 정보] 조회 실패:', error);
        throw error;
      }
    },

    getById: async (churchId: number) => {
      try {
        // console.log('🏛️ [교회 정보 API] 교회 정보 조회 시작:', churchId);

        const { data, error } = await supabase
          .from('churches')
          .select('*')
          .eq('id', churchId);

        if (error) {
          console.error('🏛️ [교회 정보 API] 오류:', error);
          throw error;
        }

        // 결과가 없는 경우 처리
        if (!data || data.length === 0) {
          // console.warn('🏛️ [교회 정보 API] 교회 정보 없음:', churchId);
          return { data: null };
        }

        const churchData = data[0];
        // console.log('✅ [교회 정보 API] 조회 성공:', churchData);
        return { data: churchData };
      } catch (error) {
        console.error('🏛️ [교회 정보 API] 조회 실패:', error);
        throw error;
      }
    },

    checkMemberLimit: async (churchId: number) => {
      try {
        // console.log('👥 [교인 제한 확인 API] 시작:', churchId);

        // 교회 정보 조회
        const { data: church } = await supabaseApiService.churches.getById(churchId);

        // 교회 정보가 없으면 기본값으로 처리
        if (!church) {
          // console.warn('👥 [교인 제한 확인 API] 교회 정보 없음, 기본 제한 적용:', churchId);

          // 현재 교인 수 조회
          const { data: members } = await supabase
            .from('members')
            .select('id', { count: 'exact' })
            .eq('church_id', churchId);

          const currentMemberCount = members?.length || 0;
          const memberLimit = 500; // 기본 제한
          const canAddMember = currentMemberCount < memberLimit;

          return {
            data: {
              canAddMember,
              currentMemberCount,
              memberLimit,
              subscriptionPlan: null,
              subscriptionStatus: null
            }
          };
        }

        // 현재 교인 수 조회
        const { data: members } = await supabase
          .from('members')
          .select('id', { count: 'exact' })
          .eq('church_id', churchId);

        const currentMemberCount = members?.length || 0;

        // 구독 상태에 따른 제한 확인
        let memberLimit = church.member_limit;

        // 기본 정책: subscription_plan이 null이거나 'trial'이면 무료 (500명), 그 외는 유료 (무제한)
        if (!church.subscription_plan || church.subscription_plan === 'trial' || church.subscription_status !== 'active') {
          memberLimit = 500; // 무료 교회 제한
        } else {
          memberLimit = null; // 유료 교회는 무제한
        }

        const canAddMember = memberLimit === null || currentMemberCount < memberLimit;

        // console.log('✅ [교인 제한 확인 API] 결과:', {
        // currentMemberCount,
        // memberLimit,
        // canAddMember,
        // subscriptionPlan: church.subscription_plan,
        // subscriptionStatus: church.subscription_status
        // });

        return {
          data: {
            canAddMember,
            currentMemberCount,
            memberLimit,
            subscriptionPlan: church.subscription_plan,
            subscriptionStatus: church.subscription_status
          }
        };
      } catch (error) {
        console.error('👥 [교인 제한 확인 API] 실패:', error);
        throw error;
      }
    },

    // Update church subscription and member limit
    updateSubscriptionAndLimit: async (churchId: number, subscriptionPlan: string, subscriptionStatus: string) => {
      try {
        // console.log('💳 [구독 업데이트] 시작:', { churchId, subscriptionPlan, subscriptionStatus });

        // 구독 상태에 따른 member_limit 결정
        let memberLimit;
        if (!subscriptionPlan || subscriptionPlan === 'trial' || subscriptionStatus !== 'active') {
          memberLimit = 500; // 무료 플랜 제한
        } else {
          memberLimit = null; // 유료 플랜 무제한
        }

        const { data, error } = await supabase
          .from('churches')
          .update({
            subscription_plan: subscriptionPlan,
            subscription_status: subscriptionStatus,
            member_limit: memberLimit,
            updated_at: new Date().toISOString()
          })
          .eq('id', churchId)
          .select();

        if (error) {
          console.error('💳 [구독 업데이트] 오류:', error);
          throw error;
        }

        // console.log('✅ [구독 업데이트] 성공:', data);
        return { data: data[0] };
      } catch (error) {
        console.error('💳 [구독 업데이트] 실패:', error);
        throw error;
      }
    },

    // 내 교회 정보 조회 (동적 데이터 관리)
    getMyChurch: async () => {
      try {
        // console.log('🏛️ [교회 정보 API] 내 교회 조회 시작');

        // 1. 현재 사용자 정보 가져오기
        const currentUser = await supabaseAuthService.getCurrentUser();
        const churchId = currentUser?.user?.church_id || currentUser?.profile?.church_id;
        // console.log('📍 현재 사용자의 교회 ID:', churchId);
        // console.log('📍 현재 사용자 전체 정보:', currentUser);

        if (!churchId || churchId === 0) {
          // super_admin의 경우 기본 교회 정보 반환
          // console.log('🔑 super_admin 사용자 - fallback 데이터 사용');
          const fallbackChurch = supabaseApiService.churches._generateFallbackData(6);
          return fallbackChurch;
        }

        // 2. Supabase 직접 쿼리로 교회 정보 조회
        // console.log('🔍 Supabase에서 교회 정보 조회 중... (church_id:', churchId, ')');
        const { data, error } = await supabase
          .from('churches')
          .select('*')
          .eq('id', churchId)
          .single();

        if (error) {
          console.error('🏛️ [교회 정보 API] 조회 오류:', error);
          console.error('🏛️ [교회 정보 API] 에러 상세:', JSON.stringify(error, null, 2));
          // fallback 데이터 사용하지 않고 에러 던지기
          throw new Error(`교회 정보 조회 실패: ${error.message}`);
        }

        // console.log('✅ [교회 정보 API] 조회 성공:', data);

        // 캐시에 저장
        localStorage.setItem(`church_${churchId}`, JSON.stringify(data));
        return data;

      } catch (error) {
        console.error('🏛️ [교회 정보 API] 조회 실패:', error);
        // 에러를 다시 던져서 UI에서 처리하도록 함
        throw error;
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
          name: 'Church Round 교회',
          address: '서울특별시 강남구 테헤란로 123',
          phone: '02-1234-5678',
          email: 'admin@churchround.church',
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
        // console.log('🏛️ [교회 정보 API] 교회 정보 수정 시작:', churchId, updateData);

        // 1. 현재 사용자 정보 가져오기
        const currentUser = await supabaseAuthService.getCurrentUser();
        const userChurchId = currentUser?.user?.church_id || currentUser?.profile?.church_id;
        const userRole = currentUser?.user?.role || currentUser?.profile?.role;
        // console.log('📍 현재 사용자의 교회 ID:', userChurchId, '권한:', userRole);

        // 2. 권한 검증: super_admin이거나 사용자가 속한 교회만 수정 가능

        if (userRole !== 'super_admin' && (!userChurchId || userChurchId !== churchId)) {
          throw new Error('해당 교회 정보를 수정할 권한이 없습니다.');
        }

        // super_admin의 경우 churchId를 그대로 사용, 일반 사용자는 userChurchId 사용
        const targetChurchId = userRole === 'super_admin' ? churchId : userChurchId;
        // console.log('🎯 대상 교회 ID:', targetChurchId);

        // 3. Supabase 직접 쿼리로 교회 정보 수정
        // console.log('💾 Supabase 업데이트 실행 중...');
        const { data, error } = await supabase
          .from('churches')
          .update({
            name: updateData.name,
            address: updateData.address,
            phone: updateData.phone,
            email: updateData.email,
            pastor_name: updateData.pastor_name,
            homepage_url: updateData.homepage_url,
            youtube_channel: updateData.youtube_channel,
            business_no: updateData.business_no,
            district_scheme: updateData.district_scheme,
            account: updateData.account,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetChurchId)
          .select()
          .single();

        if (error) {
          console.error('🏛️ [교회 정보 API] 수정 오류:', error);
          console.error('🏛️ [교회 정보 API] 에러 상세:', JSON.stringify(error, null, 2));
          throw new Error(error.message);
        }

        // console.log('✅ [교회 정보 API] 수정 성공:', data);

        // 캐시 삭제
        localStorage.removeItem(`church_${targetChurchId}`);

        return data;
      } catch (error) {
        console.error('🏛️ [교회 정보 API] 수정 실패:', error);
        throw error;
      }
    },

    // 교회 프로필 조회 (현재는 fallback)
    getProfile: async () => {
      // console.log('🏛️ [교회 프로필 API] 조회 시작 - fallback 사용');
      // getMyChurch와 동일한 데이터 반환
      return await supabaseApiService.churches.getMyChurch();
    },

    // 교회 프로필 수정 (현재는 로컬 시뮬레이션)
    updateProfile: async (updateData: any) => {
      // console.log('🏛️ [교회 프로필 API] 수정 시작 - 로컬 시뮬레이션:', updateData);
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

        // console.log('📊 [엑셀 업로드 API] 교인 명단 업로드 시작');

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

        // console.log('✅ [엑셀 업로드 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('❌ [엑셀 업로드 API] 실패:', error);
        // Use fallback mock data if Edge Function fails
        // console.log('🔄 엑셀 업로드 fallback 데이터 사용');
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

        // console.log('📊 [교인 명단 다운로드 API] 시작');

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

        // console.log('✅ [교인 명단 다운로드 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('❌ [교인 명단 다운로드 API] 실패:', error);
        // Use fallback mock data if Edge Function fails
        // console.log('🔄 교인 명단 다운로드 fallback 데이터 사용');

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

        // console.log('📊 [템플릿 다운로드 API] 시작');
        // console.log('🔑 사용할 토큰:', token.substring(0, 20) + '...');
        // console.log('🔑 Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
        // console.log('🔑 API Key:', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

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

        // console.log('✅ [템플릿 다운로드 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('❌ [템플릿 다운로드 API] 실패:', error);
        // Use fallback mock data if Edge Function fails
        // console.log('🔄 템플릿 다운로드 fallback 데이터 사용');

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

    // 유효값 조회 (직분, 구역)
    getValidValues: async () => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/excel/valid-values`, {
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

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('❌ [유효값 조회 API] 실패:', error);
        return { positions: [], districts: [] };
      }
    },

    // 엑셀 파싱 (미리보기용)
    parseMembers: async (file: File) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/excel/members/parse`, {
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
        return data;
      } catch (error) {
        console.error('❌ [엑셀 파싱 API] 실패:', error);
        throw error;
      }
    },

    // 엑셀 업로드 (최종 저장) - 기존 uploadMembers 대체
    saveParsedMembers: async (rows: any[]) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/excel/members/upload`, {
          method: 'POST',
          headers: {
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({ rows })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('❌ [엑셀 저장 API] 실패:', error);
        throw error;
      }
    },

    // 출석 기록 다운로드
    downloadAttendance: async (startDate: string, endDate: string) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        // console.log('📊 [출석 기록 다운로드 API] 시작:', { startDate, endDate });

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

        // console.log('✅ [출석 기록 다운로드 API] 성공:', data);
        return data;
      } catch (error) {
        console.error('❌ [출석 기록 다운로드 API] 실패:', error);
        // Use fallback mock data if Edge Function fails
        // console.log('🔄 출석 기록 다운로드 fallback 데이터 사용');

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

        // console.log('📋 [찜한 글 목록 API] 조회 시작');

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
        // console.log('✅ [찜한 글 목록 API] 성공:', data);
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

        // console.log('❤️ [찜하기 추가 API] 시작:', wishlistData);

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
        // console.log('✅ [찜하기 추가 API] 성공:', data);
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

        // console.log('💔 [찜하기 제거 API] 시작:', removeData);

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
        // console.log('✅ [찜하기 제거 API] 성공:', data);
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

        // console.log('🔍 [찜 상태 확인 API] 시작:', { post_type, post_id });

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

        // console.log('✅ [찜 상태 확인 API] 결과:', isWishlisted);
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
        // console.log('📁 [파일 업로드] 포트폴리오 파일 업로드 시작:', file.name);

        // 파일 확장자 확인
        const allowedTypes = ['pdf', 'mp3', 'mp4', 'doc', 'docx'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowedTypes.includes(fileExtension)) {
          throw new Error('지원하지 않는 파일 형식입니다. PDF, MP3, MP4, DOC, DOCX 파일만 업로드 가능합니다.');
        }

        // 파일을 Base64로 변환
        // console.log('📁 [파일 업로드] 파일을 Base64로 변환 중...');
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const result = reader.result as string;
              // console.log('📁 [파일 업로드] FileReader 결과 타입:', typeof result);
              // console.log('📁 [파일 업로드] FileReader 결과 길이:', result?.length);

              if (!result) {
                throw new Error('파일 읽기 결과가 없습니다.');
              }

              // data:application/pdf;base64, 부분 제거
              const base64Data = result.split(',')[1];
              // console.log('📁 [파일 업로드] Base64 데이터 길이:', base64Data?.length);

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
        // console.log('📁 [파일 업로드] 원본 파일명:', file.name);
        const safeFileName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
        // console.log('📁 [파일 업로드] 안전한 파일명:', safeFileName);

        // 임시로 파일 정보를 문자열로 반환 (실제 업로드는 백엔드에서 처리)
        const fileInfo = {
          fileName: safeFileName,
          fileBase64: fileBase64,
          fileSize: file.size,
          mimeType: file.type,
          originalName: file.name
        };
        // console.log('📁 [파일 업로드] 파일 정보 객체 생성:', {
        // fileName: fileInfo.fileName,
        // fileSize: fileInfo.fileSize,
        // mimeType: fileInfo.mimeType,
        // originalName: fileInfo.originalName,
        // base64Length: fileInfo.fileBase64?.length
        // });

        try {
          // Base64 데이터가 너무 큰 경우 chunked 처리
          const CHUNK_SIZE = 1000000; // 1MB 청크
          const base64Length = fileBase64.length;

          if (base64Length > CHUNK_SIZE) {
            // console.log('📁 [파일 업로드] 대용량 파일 감지, 청크 방식으로 처리:', base64Length);

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
            // console.log('✅ [파일 업로드] 청크 방식으로 성공:', dataUrl.substring(0, 100) + '...');

            return dataUrl;
          } else {
            // 작은 파일은 기존 방식 사용
            // console.log('📁 [파일 업로드] 소형 파일, 기존 방식 사용');
            const fileUrl = `data:${file.type};base64,${fileBase64}`;
            // console.log('✅ [파일 업로드] 성공 (직접 저장):', fileUrl.substring(0, 100) + '...');

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
        // console.log('🗑️ [파일 삭제] 시작:', filePath);

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

        // console.log('✅ [파일 삭제] 성공');
        return true;
      } catch (error) {
        console.error('❌ [파일 삭제] 실패:', error);
        return false;
      }
    }
  },

  // Email Verification API
  emailVerification: {
    // 이메일 중복 체크
    checkEmailExists: async (email: string) => {
      try {
        // console.log('📧 [이메일 중복 체크] 시작:', email);

        // 1. users 테이블에서 이메일 확인 (이미 가입된 사용자)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('email', email)
          .limit(1);

        if (userError) {
          console.error('📧 [사용자 테이블 체크] 오류:', userError);
          throw userError;
        }

        if (userData && userData.length > 0) {
          // console.log('✅ [이메일 중복 체크] users 테이블에서 발견:', email);
          return true;
        }

        // 2. community_applications 테이블에서 이메일 확인
        const { data: communityData, error: communityError } = await supabase
          .from('community_applications')
          .select('email')
          .eq('email', email)
          .limit(1);

        if (communityError) {
          console.error('📧 [커뮤니티 신청 체크] 오류:', communityError);
          throw communityError;
        }

        if (communityData && communityData.length > 0) {
          // console.log('✅ [이메일 중복 체크] community_applications 테이블에서 발견:', email);
          return true;
        }

        // 3. church_applications 테이블에서 이메일 확인
        const { data: churchData, error: churchError } = await supabase
          .from('church_applications')
          .select('email')
          .eq('email', email)
          .limit(1);

        if (churchError) {
          console.error('📧 [교회 신청 체크] 오류:', churchError);
          throw churchError;
        }

        if (churchData && churchData.length > 0) {
          // console.log('✅ [이메일 중복 체크] church_applications 테이블에서 발견:', email);
          return true;
        }

        // console.log('✅ [이메일 중복 체크] 사용 가능한 이메일:', email);
        return false;
      } catch (error: any) {
        console.error('📧 [이메일 중복 체크] 실패:', error);
        throw new Error(error.message || '이메일 중복 체크에 실패했습니다.');
      }
    },

    sendCode: async (email: string) => {
      try {
        const response = await supabase.functions.invoke('email-verification', {
          body: {
            email,
            action: 'send'
          }
        });

        // 에러가 있으면 Response 객체에서 실제 응답 읽기
        if (response.error) {
          console.error('📧 [이메일 인증] FunctionsError:', {
            name: response.error.name,
            message: response.error.message,
            context: response.error.context,
          });

          // Response 객체에서 실제 본문 읽기
          if (response.error.context && response.error.context instanceof Response) {
            try {
              const errorText = await response.error.context.text();
              console.error('📧 [이메일 인증] 실제 응답 본문:', errorText);
              try {
                const errorJson = JSON.parse(errorText);
                console.error('📧 [이메일 인증] 응답 JSON:', errorJson);
              } catch (e) {
                // JSON 파싱 실패
              }
            } catch (e) {
              console.error('📧 [이메일 인증] 응답 본문 읽기 실패:', e);
            }
          }

          throw new Error(`Edge Function 오류: ${response.error.message}`);
        }

        // 응답 데이터에 에러가 포함되어 있는지 확인
        if (response.data?.error) {
          console.error('📧 [이메일 인증] 데이터 내 오류:', response.data);
          throw new Error(response.data.error);
        }

        return { data: response.data };
      } catch (error: any) {
        console.error('📧 [이메일 인증] 발송 실패 - 전체 에러:', error);
        throw new Error(error.message || '이메일 인증 코드 발송에 실패했습니다.');
      }
    },

    verifyCode: async (email: string, code: string) => {
      try {
        // console.log('🔍 [이메일 인증] 코드 확인 시작:', { email, code: '***' });

        const { data, error } = await supabase.functions.invoke('email-verification', {
          body: {
            email,
            code,
            action: 'verify'
          }
        });

        if (error) {
          console.error('🔍 [이메일 인증] 확인 오류:', error);
          throw error;
        }

        // console.log('✅ [이메일 인증] 코드 확인 성공:', data);
        return { data };
      } catch (error: any) {
        console.error('🔍 [이메일 인증] 확인 실패:', error);
        throw new Error(error.message || '인증 코드가 올바르지 않습니다.');
      }
    }
  },

  // Application Notification API
  notifyApplication: {
    send: async (type: 'church' | 'community', applicantEmail: string, applicantName: string, organizationName?: string, applicationId?: number) => {
      try {
        // console.log('🔔 [신청 알림] 이메일 발송 시작:', { type, applicantEmail, applicantName });

        const { data, error } = await supabase.functions.invoke('notify-application', {
          body: {
            type,
            applicantEmail,
            applicantName,
            organizationName,
            applicationId
          }
        });

        if (error) {
          console.error('🔔 [신청 알림] 오류:', error);
          throw error;
        }

        // console.log('✅ [신청 알림] 이메일 발송 성공:', data);
        return { data };
      } catch (error: any) {
        console.error('🔔 [신청 알림] 발송 실패:', error);
        throw new Error(error.message || '신청 알림 이메일 발송에 실패했습니다.');
      }
    }
  },

  // Temporary Password Email API
  sendTempPassword: {
    send: async (email: string, temporaryPassword: string, contactPerson: string, organizationName?: string) => {
      try {
        // console.log('📧 [임시 비밀번호] 이메일 발송 시작:', { email, contactPerson });

        const { data, error } = await supabase.functions.invoke('send-temp-password', {
          body: {
            email,
            temporary_password: temporaryPassword,
            contact_person: contactPerson,
            organization_name: organizationName
          }
        });

        if (error) {
          console.error('📧 [임시 비밀번호] 오류:', error);
          throw error;
        }

        // console.log('✅ [임시 비밀번호] 이메일 발송 성공:', data);
        return { data };
      } catch (error: any) {
        console.error('📧 [임시 비밀번호] 발송 실패:', error);
        throw new Error(error.message || '임시 비밀번호 이메일 발송에 실패했습니다.');
      }
    }
  },

  // SMS Invitation API
  smsInvitation: {
    send: async (memberId: number, phone: string, username: string, email?: string, churchName: string = '요람교회') => {
      try {
        console.log('📱📧 [초대] 발송 시작:', { memberId, phone, username, email });

        // 임시 비밀번호 생성 (8자리: 대소문자 + 숫자)
        const generateTempPassword = (): string => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let password = '';
          for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return password;
        };

        const temporaryPassword = generateTempPassword();
        let isExistingUser = false;

        // 1. 먼저 invite-user Edge Function 호출하여 기존 사용자 여부 확인
        if (email) {
          try {
            // 먼저 member 정보 조회
            const { data: memberData } = await supabase
              .from('members')
              .select('name, email, church_id, phone')
              .eq('id', memberId)
              .single();

            if (memberData) {
              console.log('👤 [invite-user] Edge Function 호출');
              // invite-user Edge Function 호출
              const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-user', {
                body: {
                  email: email,
                  temporaryPassword: temporaryPassword,
                  memberData: {
                    name: memberData.name || username,
                    church_id: memberData.church_id || 0,
                    member_id: memberId,
                    phone: memberData.phone
                  }
                }
              });

              if (inviteError) {
                console.error('👤 [invite-user] 실패:', inviteError);
                throw new Error('사용자 계정 생성 실패: ' + inviteError.message);
              }

              console.log('✅ [invite-user] 성공:', inviteData);

              // 기존 사용자 여부 확인
              if (inviteData?.is_existing_user === true) {
                console.log('⚠️ 기존 사용자 감지 - SMS/이메일 발송 건너뛰기');
                isExistingUser = true;

                // DB 업데이트 (기존 사용자는 이미 연결됨)
                await supabase
                  .from('members')
                  .update({
                    invitation_status: 'active', // 기존 사용자이므로 즉시 활성
                    invited_at: new Date().toISOString()
                  })
                  .eq('id', memberId);

                return {
                  temporaryPassword: null,
                  success: true,
                  smsSuccess: false,
                  emailSuccess: false,
                  isExistingUser: true,
                  message: '기존 사용자 계정과 연결되었습니다. 사용자는 기존 비밀번호로 로그인할 수 있습니다.'
                };
              }
            }
          } catch (userCreateError: any) {
            console.error('👤 [사용자 생성] 실패:', userCreateError);
            throw new Error('사용자 계정 생성 실패: ' + userCreateError.message);
          }
        }

        // 2. 신규 사용자인 경우에만 SMS와 이메일 발송
        let smsSuccess = false;
        let emailSuccess = false;

        console.log('📤 신규 사용자 - SMS/이메일 발송 진행');

        // SMS 발송
        if (phone) {
          try {
            const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms', {
              body: {
                phone,
                username,
                temporaryPassword,
                churchName
              }
            });

            if (smsError) {
              console.error('📱 [SMS 초대] 발송 오류:', smsError);
            } else {
              console.log('✅ [SMS 초대] 발송 성공');
              smsSuccess = true;
            }
          } catch (error) {
            console.error('📱 [SMS 초대] 발송 실패:', error);
          }
        }

        // 이메일 발송 (신규 사용자인 경우에만)
        if (email) {
          try {
            const { data: emailData, error: emailError } = await supabase.functions.invoke('send-temp-password', {
              body: {
                email,
                temporary_password: temporaryPassword,
                contact_person: username,
                organization_name: churchName
              }
            });

            if (emailError) {
              console.error('📧 [이메일 초대] 발송 오류:', emailError);
            } else {
              console.log('✅ [이메일 초대] 발송 성공');
              emailSuccess = true;
            }
          } catch (error) {
            console.error('📧 [이메일 초대] 발송 실패:', error);
          }
        }

        // 최소 하나는 성공해야 함
        if (!smsSuccess && !emailSuccess) {
          // DB에 실패 상태 업데이트
          await supabase
            .from('members')
            .update({
              invitation_status: 'failed',
              invited_at: new Date().toISOString()
            })
            .eq('id', memberId);

          throw new Error('SMS와 이메일 발송 모두 실패했습니다.');
        }

        // 성공 시 DB 업데이트
        const { error: updateError } = await supabase
          .from('members')
          .update({
            invitation_status: 'sent',
            invited_at: new Date().toISOString(),
            temporary_password: temporaryPassword
          })
          .eq('id', memberId);

        if (updateError) {
          console.error('📱📧 [초대] DB 업데이트 오류:', updateError);
        }

        const successMessage = [];
        if (smsSuccess) successMessage.push('SMS');
        if (emailSuccess) successMessage.push('이메일');

        console.log(`✅ [초대] ${successMessage.join(', ')} 발송 및 DB 업데이트 성공`);
        return {
          temporaryPassword,
          success: true,
          smsSuccess,
          emailSuccess,
          isExistingUser: false,
          message: `${successMessage.join(', ')} 발송 완료`
        };

      } catch (error: any) {
        console.error('📱📧 [초대] 발송 실패:', error);
        throw new Error(error.message || '초대 발송에 실패했습니다.');
      }
    },

    // 초대 상태 조회
    getInvitationStatus: async (memberId: number) => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('invitation_status, invited_at, temporary_password')
          .eq('id', memberId)
          .single();

        if (error) throw error;
        return { data };
      } catch (error: any) {
        console.error('📱 [SMS 초대] 상태 조회 실패:', error);
        throw error;
      }
    }
  },

  // Users API (Role Management)
  users: {
    // 기존 초대된 교인을 users 테이블에 생성하는 유틸리티 함수
    createFromMember: async (email: string) => {
      try {
        // console.log('👤 [사용자 생성] 교인 정보로부터 사용자 생성 시작:', { email });

        // 1. members 테이블에서 교인 정보 조회
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('id, name, email, church_id, temporary_password')
          .eq('email', email)
          .single();

        if (memberError || !member) {
          throw new Error(`교인 정보를 찾을 수 없습니다: ${memberError?.message}`);
        }

        // 2. users 테이블에 이미 존재하는지 확인
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (existingUser) {
          // console.log('ℹ️ [사용자 생성] 이미 users 테이블에 존재:', email);
          return { data: existingUser, alreadyExists: true };
        }

        // 3. users 테이블에 새 사용자 생성
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            email: member.email,
            username: member.email.split('@')[0], // 이메일의 @ 앞부분을 username으로 사용
            full_name: member.name,
            hashed_password: member.temporary_password || 'changeme123', // 임시 비밀번호
            church_id: member.church_id || 0,
            role: 'member',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`사용자 생성 실패: ${insertError.message}`);
        }

        // console.log('✅ [사용자 생성] users 테이블에 사용자 생성 성공:', newUser);
        return { data: newUser, alreadyExists: false };
      } catch (error: any) {
        console.error('👤 [사용자 생성] 실패:', error);
        throw error;
      }
    },

    // 교회 관리자들만 조회 (church_super_admin, church_admin)
    getChurchAdmins: async (church_id: number) => {
      try {
        // console.log('👤 [사용자 API] 교회 관리자 목록 조회 시작:', { church_id });

        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, role, church_id, created_at, updated_at')
          .eq('church_id', church_id)
          .in('role', ['church_super_admin', 'church_admin'])
          .eq('is_active', true)
          .order('role', { ascending: false }) // church_super_admin 먼저
          .order('full_name', { ascending: true }); // 그다음 이름순

        if (error) {
          console.error('👤 [사용자 API] 교회 관리자 조회 오류:', error);
          throw error;
        }

        // console.log('✅ [사용자 API] 교회 관리자 조회 성공:', data?.length || 0, '명');
        return { data: data || [] };
      } catch (error) {
        console.error('👤 [사용자 API] 교회 관리자 조회 실패:', error);
        return { data: [] };
      }
    },

    getAll: async (filters: { church_id?: number } = {}) => {
      try {
        // console.log('👤 [사용자 API] 사용자 목록 조회 시작:', filters);

        let query = supabase
          .from('users')
          .select('id, email, name, role, church_id, created_at');

        // 교회 ID 필터
        if (filters.church_id) {
          query = query.eq('church_id', filters.church_id);
        }

        // 이메일 순으로 정렬
        query = query.order('email', { ascending: true });

        const { data, error } = await query;

        if (error) {
          console.error('👤 [사용자 API] 오류:', error);
          throw error;
        }

        // console.log('✅ [사용자 API] 조회 성공:', data?.length || 0, '명');
        return { data: data || [] };
      } catch (error) {
        console.error('👤 [사용자 API] 조회 실패:', error);
        // Use fallback mock data
        // console.log('🔄 Using fallback mock data for users');
        return {
          data: [
            {
              id: '1',
              email: 'admin@example.com',
              name: '관리자',
              role: 'church_super_admin',
              church_id: filters.church_id || 1,
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              email: 'pastor@example.com',
              name: '목사님',
              role: 'church_admin',
              church_id: filters.church_id || 1,
              created_at: new Date().toISOString()
            }
          ]
        };
      }
    },

    updateRole: async (userId: string, newRole: string) => {
      try {
        // console.log('👤 [사용자 API] 역할 변경 시작:', { userId, newRole });

        const { data, error } = await supabase
          .from('users')
          .update({ role: newRole })
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          console.error('👤 [사용자 API] 역할 변경 오류:', error);
          throw error;
        }

        // console.log('✅ [사용자 API] 역할 변경 성공:', data);
        return { data };
      } catch (error) {
        console.error('👤 [사용자 API] 역할 변경 실패:', error);
        throw error;
      }
    },

    // 이메일로 사용자를 찾아 역할 변경
    updateRoleByEmail: async (email: string, newRole: string) => {
      try {
        // console.log('👤 [사용자 API] 이메일로 역할 변경 시작:', { email, newRole });

        // 1. 먼저 이메일로 users 테이블에서 사용자 찾기
        const { data: users, error: findError } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .eq('email', email)
          .limit(1);

        if (findError || !users || users.length === 0) {
          console.error('👤 [사용자 API] 사용자 조회 실패:', findError);
          throw new Error(`해당 이메일의 사용자를 찾을 수 없습니다: ${email}`);
        }

        const user = users[0];
        // console.log('✅ [사용자 API] 사용자 찾음:', user);

        // 2. 역할 업데이트
        const { data, error } = await supabase
          .from('users')
          .update({ role: newRole })
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          console.error('👤 [사용자 API] 역할 변경 오류:', error);
          throw error;
        }

        // console.log('✅ [사용자 API] 이메일 기반 역할 변경 성공:', data);
        return { data };
      } catch (error) {
        console.error('👤 [사용자 API] 이메일 기반 역할 변경 실패:', error);
        throw error;
      }
    },

    getById: async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return { data };
      } catch (error) {
        console.error('👤 [사용자 API] 사용자 조회 실패:', error);
        throw error;
      }
    }
  },

  // Security Logs API
  securityLogs: {
    // 로그인 기록 조회
    getLoginRecords: async (options: {
      start_date?: string;
      end_date?: string;
      user_id?: string;
      page?: number;
      limit?: number;
    } = {}) => {
      try {
        // console.log('🛡️ [로그인 기록] 조회 시작:', options);

        // 현재 사용자 권한 확인
        const { supabaseAuthService } = await import('./supabaseAuthService');
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (!currentUser?.user) {
          throw new Error('인증되지 않은 사용자입니다.');
        }

        // 실제 security_logs 테이블 조회
        let query = supabase
          .from('security_logs')
          .select('*')
          .in('action', ['login', 'logout', 'failed_login']);

        // 권한별 필터링
        if (currentUser.user.role === 'church_super_admin') {
          // 교회 수퍼어드민: 자신의 로그 + 같은 교회의 church_admin 활동 조회
          const { data: churchAdmins } = await supabase
            .from('users')
            .select('id')
            .eq('church_id', currentUser.user.church_id)
            .eq('role', 'church_admin');

          const adminIds = churchAdmins?.map(admin => admin.id) || [];

          // 자신의 ID도 포함
          const allowedIds = [currentUser.user.id, ...adminIds];
          query = query.in('user_id', allowedIds);
        } else if (currentUser.user.role === 'church_admin') {
          // 교회 어드민: 자신의 로그만
          query = query.eq('user_id', currentUser.user.id);
        } else if (currentUser.user.role === 'super_admin') {
          // 수퍼어드민: 모든 로그 접근 가능 (필터 없음)
        } else {
          // 기타: 자신의 로그만
          query = query.eq('user_id', currentUser.user.id);
        }

        // 필터 적용 (날짜 범위를 하루 전체로 확장)
        if (options.start_date) {
          query = query.gte('timestamp', `${options.start_date}T00:00:00.000Z`);
        }
        if (options.end_date) {
          query = query.lte('timestamp', `${options.end_date}T23:59:59.999Z`);
        }
        if (options.user_id) {
          query = query.eq('user_id', options.user_id);
        }

        // 페이지네이션
        const limit = options.limit || 50;
        const offset = ((options.page || 1) - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        // 정렬
        query = query.order('timestamp', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
          console.error('🛡️ [로그인 기록] 데이터베이스 오류:', error);
          throw error;
        }

        // console.log('✅ [로그인 기록] 조회 성공:', data?.length || 0, '건');
        return {
          data: data || [],
          total: count || 0,
          page: options.page || 1,
          limit
        };
      } catch (error) {
        console.error('🛡️ [로그인 기록] 조회 실패:', error);
        // 테이블이 없거나 오류 발생 시 빈 데이터 반환
        return {
          data: [],
          total: 0,
          page: options.page || 1,
          limit: options.limit || 50
        };
      }
    },

    // 활동 로그 조회
    getActivityLogs: async (options: {
      start_date?: string;
      end_date?: string;
      action?: string;
      user_id?: string;
      page?: number;
      limit?: number;
    } = {}) => {
      try {
        // console.log('🛡️ [활동 로그] 조회 시작:', options);

        // 현재 사용자 권한 확인
        const { supabaseAuthService } = await import('./supabaseAuthService');
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (!currentUser?.user) {
          throw new Error('인증되지 않은 사용자입니다.');
        }

        // 실제 activity_logs 테이블 조회
        let query = supabase
          .from('activity_logs')
          .select('*');

        // 권한별 필터링
        if (currentUser.user.role === 'church_super_admin') {
          // 교회 수퍼어드민: 자신의 로그 + 같은 교회의 church_admin 활동 조회
          const { data: churchAdmins } = await supabase
            .from('users')
            .select('id')
            .eq('church_id', currentUser.user.church_id)
            .eq('role', 'church_admin');

          const adminIds = churchAdmins?.map(admin => admin.id) || [];

          // 자신의 ID도 포함
          const allowedIds = [currentUser.user.id, ...adminIds];
          query = query.in('user_id', allowedIds);
        } else if (currentUser.user.role === 'church_admin') {
          // 교회 어드민: 자신의 활동 로그만
          query = query.eq('user_id', currentUser.user.id);
        } else if (currentUser.user.role === 'super_admin') {
          // 수퍼어드민: 모든 활동 로그 접근 가능 (필터 없음)
        } else {
          // 기타: 자신의 활동 로그만
          query = query.eq('user_id', currentUser.user.id);
        }

        // 필터 적용 (날짜 범위를 하루 전체로 확장)
        if (options.start_date) {
          query = query.gte('timestamp', `${options.start_date}T00:00:00.000Z`);
        }
        if (options.end_date) {
          query = query.lte('timestamp', `${options.end_date}T23:59:59.999Z`);
        }
        if (options.action) {
          query = query.eq('action', options.action);
        }
        if (options.user_id) {
          query = query.eq('user_id', options.user_id);
        }

        // 페이지네이션
        const limit = options.limit || 50;
        const offset = ((options.page || 1) - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        // 정렬
        query = query.order('timestamp', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
          console.error('🛡️ [활동 로그] 데이터베이스 오류:', error);
          throw error;
        }

        // console.log('✅ [활동 로그] 조회 성공:', data?.length || 0, '건');
        return {
          data: data || [],
          total: count || 0,
          page: options.page || 1,
          limit
        };
      } catch (error) {
        console.error('🛡️ [활동 로그] 조회 실패:', error);
        // 테이블이 없거나 오류 발생 시 빈 데이터 반환
        return {
          data: [],
          total: 0,
          page: options.page || 1,
          limit: options.limit || 50
        };
      }
    },

    // 보안 로그 통계 조회
    getStats: async (options: {
      start_date?: string;
      end_date?: string;
    } = {}) => {
      try {
        // console.log('📊 [보안 로그 통계] 조회 시작:', options);

        // 실제 security_logs 테이블에서 통계 계산
        let baseQuery = supabase.from('security_logs').select('*');

        // 날짜 필터 적용
        if (options.start_date) {
          baseQuery = baseQuery.gte('timestamp', options.start_date);
        }
        if (options.end_date) {
          baseQuery = baseQuery.lte('timestamp', options.end_date);
        }

        // 총 로그인 수
        let totalLoginsQuery = supabase.from('security_logs').select('*', { count: 'exact', head: true });
        if (options.start_date) totalLoginsQuery = totalLoginsQuery.gte('timestamp', `${options.start_date}T00:00:00.000Z`);
        if (options.end_date) totalLoginsQuery = totalLoginsQuery.lte('timestamp', `${options.end_date}T23:59:59.999Z`);
        const { count: totalLogins } = await totalLoginsQuery.in('action', ['login', 'logout']);

        // 성공한 로그인 수
        let successfulLoginsQuery = supabase.from('security_logs').select('*', { count: 'exact', head: true });
        if (options.start_date) successfulLoginsQuery = successfulLoginsQuery.gte('timestamp', `${options.start_date}T00:00:00.000Z`);
        if (options.end_date) successfulLoginsQuery = successfulLoginsQuery.lte('timestamp', `${options.end_date}T23:59:59.999Z`);
        const { count: successfulLogins } = await successfulLoginsQuery
          .eq('action', 'login')
          .eq('success', true);

        // 실패한 로그인 수
        let failedLoginsQuery = supabase.from('security_logs').select('*', { count: 'exact', head: true });
        if (options.start_date) failedLoginsQuery = failedLoginsQuery.gte('timestamp', `${options.start_date}T00:00:00.000Z`);
        if (options.end_date) failedLoginsQuery = failedLoginsQuery.lte('timestamp', `${options.end_date}T23:59:59.999Z`);
        const { count: failedLogins } = await failedLoginsQuery.eq('action', 'failed_login');

        // 고유 사용자 수
        let uniqueUsersQuery = supabase.from('security_logs').select('user_id');
        if (options.start_date) uniqueUsersQuery = uniqueUsersQuery.gte('timestamp', `${options.start_date}T00:00:00.000Z`);
        if (options.end_date) uniqueUsersQuery = uniqueUsersQuery.lte('timestamp', `${options.end_date}T23:59:59.999Z`);
        const { data: uniqueUsersData } = await uniqueUsersQuery.in('action', ['login']);

        const uniqueUsers = new Set(uniqueUsersData?.map((log: any) => log.user_id) || []).size;

        // 위치별 통계
        let locationQuery = supabase.from('security_logs').select('location');
        if (options.start_date) locationQuery = locationQuery.gte('timestamp', `${options.start_date}T00:00:00.000Z`);
        if (options.end_date) locationQuery = locationQuery.lte('timestamp', `${options.end_date}T23:59:59.999Z`);
        const { data: locationData } = await locationQuery.eq('action', 'login');

        const locationStats = locationData?.reduce((acc: any, log: any) => {
          if (log.location) {
            acc[log.location] = (acc[log.location] || 0) + 1;
          }
          return acc;
        }, {}) || {};

        const topLocations = Object.entries(locationStats)
          .map(([location, count]) => ({ location, count }))
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 5);

        const stats = {
          total_logins: totalLogins || 0,
          successful_logins: successfulLogins || 0,
          failed_logins: failedLogins || 0,
          unique_users: uniqueUsers,
          top_locations: topLocations,
          hourly_distribution: [] // 시간별 분포는 추후 구현
        };

        // console.log('✅ [보안 로그 통계] 조회 성공:', stats);
        return { data: stats };
      } catch (error) {
        console.error('📊 [보안 로그 통계] 조회 실패:', error);
        // 테이블이 없거나 오류 발생 시 기본값 반환
        return {
          data: {
            total_logins: 0,
            successful_logins: 0,
            failed_logins: 0,
            unique_users: 0,
            top_locations: [],
            hourly_distribution: []
          }
        };
      }
    },

    // 로그인 세션 조회 (활성 세션)
    getSessions: async (userId?: string) => {
      try {
        // console.log('🔐 [로그인 세션] 조회 시작:', { userId });

        // 실제 auth.sessions 테이블 또는 security_logs에서 활성 세션 조회
        let query = supabase
          .from('security_logs')
          .select(`
            id,
            user_id,
            user_name,
            timestamp,
            ip_address,
            location,
            user_agent,
            details
          `)
          .eq('action', 'login')
          .eq('success', true);

        if (userId) {
          query = query.eq('user_id', userId);
        }

        // 최근 24시간 이내 로그인만 활성 세션으로 간주
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('timestamp', oneDayAgo);

        query = query.order('timestamp', { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error('🔐 [로그인 세션] 데이터베이스 오류:', error);
          throw error;
        }

        // 세션 데이터 변환
        const sessions = (data || []).map(log => ({
          id: log.id,
          user_id: log.user_id,
          user_name: log.user_name || '알 수 없음',
          login_time: log.timestamp,
          last_activity: log.timestamp,
          ip_address: log.ip_address || 'N/A',
          browser: log.user_agent ? log.user_agent.split(' ')[0] : 'Unknown',
          is_active: true, // 24시간 이내면 활성으로 간주
          location: log.location || 'N/A'
        }));

        // console.log('✅ [로그인 세션] 조회 성공:', sessions.length, '건');
        return { data: sessions };
      } catch (error) {
        console.error('🔐 [로그인 세션] 조회 실패:', error);
        // 테이블이 없거나 오류 발생 시 빈 데이터 반환
        return { data: [] };
      }
    },

    // 로그인/로그아웃 로그 기록
    recordLogin: async (loginData: {
      user_id: string | null;
      user_name: string | null;
      user_email: string;
      success: boolean;
      church_id: number | null;
      ip_address: string;
      user_agent: string;
      location: string;
      action?: 'login' | 'logout' | 'failed_login'; // action을 직접 지정 가능
      details?: any;
    }) => {
      try {
        // action이 details에 있으면 사용, 없으면 success 기반으로 결정
        let actionType: string;
        if (loginData.action) {
          actionType = loginData.action;
        } else if (loginData.details?.action === 'logout') {
          actionType = 'logout';
        } else {
          actionType = loginData.success ? 'login' : 'failed_login';
        }

        const { data, error } = await supabase
          .from('security_logs')
          .insert({
            user_id: loginData.user_id,
            user_name: loginData.user_name,
            user_email: loginData.user_email,
            action: actionType,
            success: loginData.success,
            church_id: loginData.church_id,
            ip_address: loginData.ip_address,
            user_agent: loginData.user_agent,
            location: loginData.location,
            details: loginData.details ? JSON.stringify(loginData.details) : null,
            timestamp: new Date().toISOString()
          });

        if (error) {
          console.error('📝 [보안 로그] 기록 오류:', error);
          throw error;
        }

        return { success: true, data };
      } catch (error) {
        console.error('📝 [보안 로그] 기록 실패:', error);
        throw error;
      }
    },

    // 테스트용 로그인 로그 생성
    createTestLoginLog: async () => {
      try {
        // console.log('🧪 [테스트 로그인 로그] 생성 시작');

        // 먼저 테이블 존재 확인
        const { data: tableCheck, error: tableError } = await supabase
          .from('security_logs')
          .select('id')
          .limit(1);

        if (tableError) {
          console.error('❌ security_logs 테이블 존재하지 않음:', tableError);
          throw new Error(`security_logs 테이블이 존재하지 않습니다: ${tableError.message}`);
        }

        // console.log('✅ security_logs 테이블 확인됨');

        const testLog = {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          user_name: '이선민',
          user_email: 'composm@naver.com',
          action: 'login',
          success: true,
          church_id: 7,
          ip_address: '127.0.0.1',
          user_agent: navigator.userAgent,
          location: '서울, 대한민국',
          details: JSON.stringify({ test: true, browser: 'Chrome' }),
          timestamp: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('security_logs')
          .insert(testLog);

        if (error) {
          console.error('🧪 [테스트 로그인 로그] 생성 오류:', error);
          throw error;
        }

        // console.log('✅ [테스트 로그인 로그] 생성 성공:', data);
        return { success: true, data };
      } catch (error) {
        console.error('🧪 [테스트 로그인 로그] 생성 실패:', error);
        throw error;
      }
    },

    // 테이블 존재 확인 및 생성
    checkAndCreateTables: async () => {
      try {
        // console.log('🔍 [보안 로그 테이블] 존재 확인 시작');

        // security_logs 테이블 확인
        const { error: securityError } = await supabase
          .from('security_logs')
          .select('id')
          .limit(1);

        // activity_logs 테이블 확인
        const { error: activityError } = await supabase
          .from('activity_logs')
          .select('id')
          .limit(1);

        const results = {
          security_logs_exists: !securityError,
          activity_logs_exists: !activityError,
          security_error: securityError?.message,
          activity_error: activityError?.message
        };

        if (securityError) {
          console.error('❌ security_logs 테이블:', securityError.message);
        } else {
          // console.log('✅ security_logs 테이블 존재함');
        }

        if (activityError) {
          console.error('❌ activity_logs 테이블:', activityError.message);
        } else {
          // console.log('✅ activity_logs 테이블 존재함');
        }

        return { success: true, data: results };
      } catch (error) {
        console.error('🔍 [보안 로그 테이블] 확인 실패:', error);
        return { success: false, error };
      }
    },

    // 테스트용 활동 로그 생성
    createTestActivityLog: async () => {
      try {
        // console.log('🧪 [테스트 활동 로그] 생성 시작');

        const testLog = {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          user_name: '이선민',
          user_email: 'composm@naver.com',
          action: 'view',
          resource: 'member',
          resource_id: '123',
          church_id: 7,
          ip_address: '127.0.0.1',
          user_agent: navigator.userAgent,
          details: {
            page_name: '교인 관리',
            target_name: '김철수',
            sensitive_data_count: 3,
            page_path: '/member-management',
            session_id: 'test-session-' + Date.now(),
            sensitive_data: ['name', 'phone', 'email']
          },
          timestamp: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('activity_logs')
          .insert(testLog);

        if (error) {
          console.error('🧪 [테스트 활동 로그] 생성 오류:', error);
          throw error;
        }

        // console.log('✅ [테스트 활동 로그] 생성 성공:', data);
        return { success: true, data };
      } catch (error) {
        console.error('🧪 [테스트 활동 로그] 생성 실패:', error);
        throw error;
      }
    },

    // 테스트용 교회 데이터 생성 (Church ID 7)
    createTestChurchData: async () => {
      try {
        // console.log('🏛️ [테스트 교회 데이터] 생성 시작 - Church ID 7');

        // 이미 존재하는지 확인
        const { data: existing } = await supabase
          .from('churches')
          .select('id')
          .eq('id', 7)
          .single();

        if (existing) {
          // console.log('✅ Church ID 7이 이미 존재합니다.');
          return { success: true, message: 'Church ID 7이 이미 존재합니다.' };
        }

        const testChurch = {
          id: 7,
          name: '테스트 교회',
          address: '서울시 강남구 테스트로 123',
          contact: '02-1234-5678',
          pastor_name: '김목사',
          email: 'test@church.com',
          is_active: true,
          member_limit: 500,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('churches')
          .insert(testChurch);

        if (error) {
          console.error('🏛️ [테스트 교회 데이터] 생성 오류:', error);
          throw error;
        }

        // console.log('✅ [테스트 교회 데이터] 생성 성공 - Church ID 7:', data);
        return { success: true, data };
      } catch (error) {
        console.error('🏛️ [테스트 교회 데이터] 생성 실패:', error);
        throw error;
      }
    }
  },

  // AI Chat API
  aiChat: {
    // 채팅 히스토리 조회
    getChatHistories: async (params?: { include_messages?: boolean; limit?: number; skip?: number }) => {
      try {
        // console.log('🔍 [AI Chat] 채팅 히스토리 조회 시작:', params);

        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.skip) searchParams.append('skip', params.skip.toString());

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/ai-chat/histories?${searchParams.toString()}`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        // console.log('✅ [AI Chat] 채팅 히스토리 조회 성공:', data);
        return data;
      } catch (error: any) {
        console.error('❌ [AI Chat] 채팅 히스토리 조회 실패:', error);
        throw error;
      }
    },

    // AI 에이전트 목록 조회
    getAgents: async () => {
      try {
        // console.log('🤖 [AI Chat] AI 에이전트 조회 시작');

        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/ai-chat/agents`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        // console.log('✅ [AI Chat] AI 에이전트 조회 성공:', data);
        return data;
      } catch (error: any) {
        console.error('❌ [AI Chat] AI 에이전트 조회 실패:', error);
        throw error;
      }
    },

    // 새 채팅 히스토리 생성
    createChatHistory: async (title: string, agentId?: string | number) => {
      try {
        // console.log('📝 [AI Chat] 채팅 히스토리 생성 시작:', { title, agentId });

        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/ai-chat/histories`;

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            agent_id: agentId
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        // console.log('✅ [AI Chat] 채팅 히스토리 생성 성공:', data);
        return data;
      } catch (error: any) {
        console.error('❌ [AI Chat] 채팅 히스토리 생성 실패:', error);
        throw error;
      }
    },

    // 채팅 히스토리 삭제
    deleteChatHistory: async (historyId: string | number) => {
      try {
        // console.log('🗑️ [AI Chat] 채팅 히스토리 삭제 시작:', historyId);

        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/ai-chat/histories/${historyId}`;

        const response = await fetch(functionsUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        // console.log('✅ [AI Chat] 채팅 히스토리 삭제 성공:', data);
        return data;
      } catch (error: any) {
        console.error('❌ [AI Chat] 채팅 히스토리 삭제 실패:', error);
        throw error;
      }
    },

    // 새 메시지 전송
    sendMessage: async (historyId: string | number, content: string, agentId?: string | number) => {
      try {
        // console.log('💬 [AI Chat] 메시지 전송 시작:', { historyId, content, agentId });

        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/ai-chat/messages`;

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            history_id: historyId,
            content,
            agent_id: agentId
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        // console.log('✅ [AI Chat] 메시지 전송 성공:', data);
        return data;
      } catch (error: any) {
        console.error('❌ [AI Chat] 메시지 전송 실패:', error);
        throw error;
      }
    }
  },

  // GPT License Management API
  gptLicenses: {
    // Get church GPT license statistics
    getChurchStats: async (churchId?: number) => {
      try {
        // console.log('🔍 GPT License Stats - Direct DB Query:', { churchId });

        let query = supabase
          .from('churches')
          .select(`
            serial_id,
            name,
            gpt_licenses_purchased,
            gpt_licenses_active
          `);

        // If churchId is specified, filter by it
        if (churchId) {
          query = query.eq('id', churchId);
        }

        const { data: churches, error } = await query;

        if (error) {
          throw error;
        }

        // Get license assignments for each church from user_gpt_licenses table
        const stats = await Promise.all(churches.map(async (church) => {
          // 타입 안전성을 위한 명시적 타입 캐스팅
          const churchData = church as {
            serial_id: number;
            name: string;
            gpt_licenses_purchased?: number;
            gpt_licenses_active?: number;
          };

          const licensesPurchased = churchData.gpt_licenses_purchased || 0;
          const licensesActive = churchData.gpt_licenses_active || 0;

          // Query user_gpt_licenses table to get actual assigned licenses count
          let licensesAssigned = 0;
          try {
            const { data: licenseData, error: licenseError } = await supabase
              .from('user_gpt_licenses')
              .select('id')
              .eq('church_id', churchData.serial_id)
              .eq('is_active', true);

            if (licenseError && licenseError.code !== '42P01') {
              // 42P01 = relation does not exist, 이 경우는 테이블이 없는 것이므로 경고만 출력
              // console.warn('Failed to fetch license assignments for church', churchData.serial_id, licenseError);
            }

            if (!licenseError && licenseData) {
              licensesAssigned = licenseData.length;
            }
          } catch (error) {
            // user_gpt_licenses 테이블이 없는 경우 0으로 설정
            // console.info('user_gpt_licenses 테이블이 아직 생성되지 않았습니다. 라이선스 할당 수를 0으로 설정합니다.');
            licensesAssigned = 0;
          }
          const licensesAvailable = Math.max(0, licensesPurchased - licensesAssigned);

          return {
            church_id: churchData.serial_id,
            church_name: churchData.name,
            licenses_purchased: licensesPurchased,
            licenses_active: licensesActive,
            licenses_assigned: licensesAssigned,
            licenses_available: licensesAvailable
          };
        }));

        // console.log('📊 Church stats result:', stats);
        return { success: true, data: stats };
      } catch (error) {
        console.error('Get Church Stats Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    // Update church license count
    updateChurchLicenseCount: async (churchId: number, licenseCount: number) => {
      try {
        // console.log('📝 Updating church license count:', { churchId, licenseCount });

        const { data, error } = await supabase
          .from('churches')
          .update({
            gpt_licenses_purchased: licenseCount
          })
          .eq('id', churchId)
          .select();

        if (error) {
          throw error;
        }

        // console.log('✅ License count updated:', data);
        return { success: true, data };
      } catch (error) {
        console.error('Update Church License Count Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    // Get church licenses
    getChurchLicenses: async (churchId: number) => {
      try {
        // console.log('🔍 Get Church Licenses - Direct DB Query:', { churchId });

        const { data: licenses, error } = await supabase
          .from('user_gpt_licenses')
          .select(`
            id,
            user_id,
            church_id,
            assigned_by,
            assigned_at,
            is_active,
            users!user_gpt_licenses_user_id_fkey (
              full_name,
              email
            ),
            assigned_by_user:users!user_gpt_licenses_assigned_by_fkey (
              full_name
            )
          `)
          .eq('church_id', churchId)
          .order('assigned_at', { ascending: false });

        if (error) {
          if (error.code === '42P01') {
            // 테이블이 없는 경우 빈 배열 반환
            // console.info('user_gpt_licenses 테이블이 아직 생성되지 않았습니다.');
            return { success: true, data: [] };
          }
          throw error;
        }

        // Transform data to match expected format
        const transformedLicenses = licenses.map((license) => {
          // TypeScript 타입 안전성을 위한 타입 단언
          const user = license.users as { full_name?: string; email?: string } | null;
          const assignedByUser = license.assigned_by_user as { full_name?: string } | null;

          return {
            id: license.id,
            user_id: license.user_id.toString(),
            church_id: license.church_id,
            user_name: user?.full_name || '알 수 없음',
            user_email: user?.email || '알 수 없음',
            assigned_by: assignedByUser?.full_name || '알 수 없음',
            assigned_at: license.assigned_at,
            is_active: license.is_active
          };
        });

        // console.log('📄 Church licenses result:', transformedLicenses);
        return { success: true, data: transformedLicenses };
      } catch (error) {
        console.error('Get Church Licenses Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    // Get church admins for license assignment
    getChurchAdmins: async (churchId: number) => {
      try {
        // console.log('🔍 Get Church Admins - Simple users query:', { churchId });

        // Simple direct query to users table
        const { data: admins, error: adminsError } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .eq('church_id', churchId)
          .in('role', ['admin', 'church_super_admin'])
          .eq('is_active', true)
          .order('full_name');

        if (adminsError) {
          console.error('Users query error:', adminsError);
          throw adminsError;
        }

        // console.log('📋 Raw users data:', admins);

        // 라이선스 정보는 나중에 처리하고, 일단 기본 사용자 정보만 반환
        const transformedAdmins = (admins || []).map((admin) => ({
          id: admin.id?.toString() || 'unknown',
          name: admin.full_name || '이름 없음',
          email: admin.email || '이메일 없음',
          role: admin.role || 'unknown',
          has_gpt_license: false, // 일단 기본값으로 설정
          license_assigned_at: null as string | null
        }));

        // console.log('👥 Church admins result:', transformedAdmins);
        return { success: true, data: transformedAdmins };
      } catch (error) {
        console.error('Get Church Admins Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    // Assign license to user
    assignLicense: async (userId: string, churchId: number) => {
      try {
        // console.log('🔍 Assign License - Direct DB Query:', { userId, churchId });

        // Get current user to set as assigned_by
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (!currentUser?.user?.id) {
          throw new Error('Current user not found');
        }

        // Check if license already exists for this user in this church
        const { data: existingLicense, error: checkError } = await supabase
          .from('user_gpt_licenses')
          .select('id')
          .eq('user_id', parseInt(userId))
          .eq('church_id', churchId)
          .eq('is_active', true)
          .single();

        if (checkError && checkError.code === '42P01') {
          throw new Error('라이선스 관리 기능을 사용하기 위해 먼저 데이터베이스 테이블을 생성해야 합니다.');
        }

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw checkError;
        }

        if (existingLicense) {
          throw new Error('이 사용자는 이미 GPT 라이선스를 보유하고 있습니다.');
        }

        // Insert new license
        const { data: newLicense, error: insertError } = await supabase
          .from('user_gpt_licenses')
          .insert({
            user_id: parseInt(userId),
            church_id: churchId,
            assigned_by: currentUser.user.id,
            is_active: true
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // console.log('✅ License assigned successfully:', newLicense);
        return { success: true, data: newLicense };
      } catch (error) {
        console.error('Assign License Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    // Revoke license by license ID
    revokeLicense: async (licenseId: string) => {
      try {
        // console.log('🔍 Revoke License - Direct DB Query:', { licenseId });

        const { data: revokedLicense, error } = await supabase
          .from('user_gpt_licenses')
          .update({ is_active: false, updated_at: 'now()' })
          .eq('id', licenseId)
          .eq('is_active', true)
          .select()
          .single();

        if (error) {
          if (error.code === '42P01') {
            throw new Error('라이선스 관리 기능을 사용하기 위해 먼저 데이터베이스 테이블을 생성해야 합니다.');
          }
          if (error.code === 'PGRST116') {
            throw new Error('라이선스를 찾을 수 없거나 이미 취소되었습니다.');
          }
          throw error;
        }

        // console.log('✅ License revoked successfully:', revokedLicense);
        return { success: true, data: revokedLicense };
      } catch (error) {
        console.error('Revoke License Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    // Revoke license by user ID
    revokeLicenseByUser: async (userId: string) => {
      try {
        // console.log('🔍 Revoke License by User - Direct DB Query:', { userId });

        const { data: revokedLicenses, error } = await supabase
          .from('user_gpt_licenses')
          .update({ is_active: false, updated_at: 'now()' })
          .eq('user_id', parseInt(userId))
          .eq('is_active', true)
          .select();

        if (error) {
          if (error.code === '42P01') {
            throw new Error('라이선스 관리 기능을 사용하기 위해 먼저 데이터베이스 테이블을 생성해야 합니다.');
          }
          throw error;
        }

        if (!revokedLicenses || revokedLicenses.length === 0) {
          throw new Error('해당 사용자의 활성 라이선스를 찾을 수 없습니다.');
        }

        // console.log('✅ User licenses revoked successfully:', revokedLicenses);
        return { success: true, data: revokedLicenses };
      } catch (error) {
        console.error('Revoke License by User Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    // Get user license status
    getUserLicenseStatus: async (userId: string, churchId: number) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/gpt-licenses/user-status?user_id=${userId}&church_id=${churchId}`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { success: true, data: data.data };
      } catch (error) {
        console.error('Get User License Status API Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  },

  // Accounting API
  accounting: {
    // Categories
    getCategories: async (type?: 'income' | 'expense') => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const params = new URLSearchParams();
        if (type) params.append('type', type);

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/accounting/admin/categories?${params.toString()}`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('계정과목 조회 실패:', error);
        throw error;
      }
    },

    createCategory: async (categoryData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/accounting/admin/categories`;

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('계정과목 생성 실패:', error);
        throw error;
      }
    },

    updateCategory: async (categoryId: number, categoryData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/accounting/admin/categories/${categoryId}`;

        const response = await fetch(functionsUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('계정과목 수정 실패:', error);
        throw error;
      }
    },

    deleteCategory: async (categoryId: number) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/accounting/admin/categories/${categoryId}`;

        const response = await fetch(functionsUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('계정과목 삭제 실패:', error);
        throw error;
      }
    },

    // Transactions
    getTransactions: async (filters: {
      page?: number;
      limit?: number;
      start_date?: string;
      end_date?: string;
      type?: 'income' | 'expense';
      category_id?: number;
      keyword?: string;
    } = {}) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const params = new URLSearchParams();
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.type) params.append('type', filters.type);
        if (filters.category_id) params.append('category_id', filters.category_id.toString());
        if (filters.keyword) params.append('keyword', filters.keyword);

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/accounting/admin/transactions?${params.toString()}`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('거래 내역 조회 실패:', error);
        throw error;
      }
    },

    getSummary: async (filters: {
      start_date?: string;
      end_date?: string;
      type?: 'income' | 'expense';
    } = {}) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const params = new URLSearchParams();
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.type) params.append('type', filters.type);

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/accounting/admin/transactions/summary?${params.toString()}`;

        const response = await fetch(functionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('통계 조회 실패:', error);
        throw error;
      }
    },

    createTransaction: async (transactionData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/accounting/admin/transactions`;

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('거래 생성 실패:', error);
        throw error;
      }
    },

    updateTransaction: async (transactionId: number, transactionData: any) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/accounting/admin/transactions/${transactionId}`;

        const response = await fetch(functionsUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('거래 수정 실패:', error);
        throw error;
      }
    },

    deleteTransaction: async (transactionId: number) => {
      try {
        const token = await supabaseAuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/accounting/admin/transactions/${transactionId}`;

        const response = await fetch(functionsUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('거래 삭제 실패:', error);
        throw error;
      }
    },
  },

  // Contact Management (랜딩 페이지 문의)
  contact: {
    sendEmail: async (contactData: {
      name: string;
      email: string;
      phone: string;
      message: string;
      type: 'email' | 'phone';
    }) => {
      try {
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const functionsUrl = `${supabaseUrl}/functions/v1/send-contact-email`;

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contactData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('이메일 전송 실패:', error);
        throw error;
      }
    },
  },

  // Birthday Management (생일 관리)
  birthdays: {
    // 특정 월의 모든 생일자 조회
    getByMonth: async (year: number, month: number) => {
      try {
        // 현재 사용자 정보 가져오기 (JWT 토큰 기반)
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (!currentUser?.user) {
          throw new Error('인증되지 않은 사용자입니다');
        }

        const churchId = currentUser.user.church_id;
        if (!churchId) {
          throw new Error('사용자의 교회 정보를 찾을 수 없습니다');
        }

        // 해당 교회의 모든 멤버 조회 (church_id 필터링)
        const { data: members, error } = await supabase
          .from('members')
          .select(`
            id,
            name,
            phone,
            birthdate,
            position_main,
            position_detail,
            department,
            organization_id,
            church_organizations:organization_id (
              id,
              name
            )
          `)
          .eq('church_id', churchId)
          .not('birthdate', 'is', null);

        if (error) {
          console.error('생일자 조회 실패:', error);
          throw error;
        }

        // 클라이언트에서 월별로 필터링 및 데이터 변환
        const filteredMembers = members?.filter(member => {
          if (!member.birthdate) return false;
          const birthDate = new Date(member.birthdate);
          const birthMonth = birthDate.getMonth() + 1; // 0-based to 1-based
          return birthMonth === month;
        }).map(member => ({
          ...member,
          // church_organizations 배열을 단일 객체로 변환
          church_organizations: Array.isArray(member.church_organizations)
            ? member.church_organizations[0]
            : member.church_organizations
        })) || [];

        return { data: filteredMembers };
      } catch (error) {
        console.error('월별 생일자 조회 실패:', error);
        throw error;
      }
    },
  },

  // 일정 관리
  importantDates: {
    // 월별 일정 조회
    getByMonth: async (year: number, month: number): Promise<{ data: any[] }> => {
      try {
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (!currentUser?.user) {
          throw new Error('인증되지 않은 사용자입니다');
        }

        const churchId = currentUser.user.church_id;
        if (!churchId) {
          throw new Error('사용자의 교회 정보를 찾을 수 없습니다');
        }

        // 해당 월의 시작일과 마지막일 계산
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const { data: dates, error } = await supabase
          .from('important_dates')
          .select(`
            id, title, event_date, description,
            enable_dday_alert, alert_days_before,
            is_active, is_completed, notes,
            member_id,
            members:member_id (id, name, phone)
          `)
          .eq('church_id', churchId)
          .eq('is_active', true)
          .or(`event_date.gte.${startDate.toISOString().split('T')[0]},event_date.lte.${endDate.toISOString().split('T')[0]},event_date.is.null`);

        if (error) throw error;

        // members 배열을 단일 객체로 변환
        const transformedDates = (dates || []).map((date: any) => ({
          id: date.id,
          title: date.title,
          event_date: date.event_date,
          description: date.description,
          enable_dday_alert: date.enable_dday_alert,
          alert_days_before: date.alert_days_before,
          is_active: date.is_active,
          is_completed: date.is_completed,
          notes: date.notes,
          member_id: date.member_id,
          members: Array.isArray(date.members) && date.members.length > 0
            ? date.members[0]
            : undefined
        }));

        return { data: transformedDates };
      } catch (error) {
        console.error('월별 일정 조회 실패:', error);
        throw error;
      }
    },

    // 일정 완료/미완료 토글
    toggleComplete: async (id: number, isCompleted: boolean) => {
      try {
        const token = await supabaseAuthService.getToken();
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

        const response = await fetch(`${supabaseUrl}/functions/v1/important-dates/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_completed: isCompleted })
        });

        if (!response.ok) throw new Error('일정 상태 변경 실패');

        const data = await response.json();
        return { data };
      } catch (error) {
        console.error('일정 상태 변경 실패:', error);
        throw error;
      }
    },
  },

};

// 기존 API 호환성을 위한 래퍼
export const edgeApi = {
  get: async (url: string) => {
    if (url === '/members/' || url.startsWith('/members/?')) {
      // Parse church_id from URL parameters
      const urlObj = new URL(`http://localhost${url}`);
      const churchId = urlObj.searchParams.get('church_id');
      const filters = churchId ? { church_id: parseInt(churchId) } : {};
      return await supabaseApiService.members.getAll(filters);
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
