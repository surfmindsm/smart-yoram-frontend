import axios from 'axios';

// API 기본 URL (환경변수 사용)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.surfmind-team.com/api/v1';

// Vercel 프록시를 사용하는 경우 처리
const isProxyMode = API_BASE_URL.startsWith('/api/proxy');
const getApiUrl = (path: string) => {
  if (isProxyMode) {
    // 프록시 모드에서는 /api/v1 제거 (프록시에서 추가함)
    return path.startsWith('/') ? path.substring(1) : path;
  }
  return path;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  
  // 설교 자료 API 호출 시에만 토큰 상태 로깅
  if (config.url?.includes('sermon-materials')) {
    console.log('🔐 토큰 상태 확인:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      url: config.url
    });
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.url?.includes('sermon-materials')) {
    console.warn('⚠️ 토큰이 없습니다! localStorage에 access_token이 저장되어 있는지 확인하세요.');
  }
  
  // Content-Type 헤더 확실히 설정
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 422 에러 상세 정보 로깅
    if (error.response?.status === 422) {
      console.error('🚨 422 Validation Error Details:');
      console.error('URL:', error.config?.url);
      console.error('Method:', error.config?.method);
      console.error('Request Data:', JSON.parse(error.config?.data || '{}'));
      console.error('Response Error:', error.response?.data);
      
      // detail 배열 내용 상세 출력
      if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
        console.error('🔍 Validation Error Details:');
        error.response.data.detail.forEach((detailItem: any, index: number) => {
          console.error(`${index + 1}.`, detailItem);
          // 누락된 필드나 타입 에러 상세 정보
          if (detailItem.loc) {
            console.error(`   📍 Location: ${detailItem.loc.join('.')}`);
          }
          if (detailItem.type) {
            console.error(`   🔍 Error Type: ${detailItem.type}`);
          }
          if (detailItem.msg) {
            console.error(`   💬 Message: ${detailItem.msg}`);
          }
        });
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username: string, password: string) => {
    // 정확한 관리자 로그인 엔드포인트 사용
    // application/x-www-form-urlencoded 형식으로 변경
    
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post(getApiUrl('/auth/member/login'), formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, user } = response.data;
    localStorage.setItem('access_token', access_token);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: async () => {
    const response = await api.get(getApiUrl('/users/me'));
    return response.data;
  }
};

export const userService = {
  getUsers: async () => {
    const response = await api.get(getApiUrl('/users/'));
    return response.data;
  },
  
  createUser: async (userData: any) => {
    const response = await api.post(getApiUrl('/users/'), userData);
    return response.data;
  },
  
  updateUser: async (userId: number, userData: any) => {
    const response = await api.put(getApiUrl(`/users/${userId}`), userData);
    return response.data;
  }
};

export const memberService = {
  getMembers: async () => {
    const response = await api.get(getApiUrl('/members/'));
    return response.data;
  },
  
  createMember: async (memberData: any) => {
    const response = await api.post(getApiUrl('/members/'), memberData);
    return response.data;
  },
  
  updateMember: async (memberId: number, memberData: any) => {
    const response = await api.put(getApiUrl(`/members/${memberId}`), memberData);
    return response.data;
  },
  
  deleteMember: async (memberId: number) => {
    const response = await api.delete(getApiUrl(`/members/${memberId}`));
    return response.data;
  }
};

export const churchService = {
  getMyChurch: async () => {
    const response = await api.get(getApiUrl('/churches/my'));
    return response.data;
  },
  
  updateChurch: async (churchId: number, churchData: any) => {
    const response = await api.put(getApiUrl(`/churches/${churchId}`), churchData);
    return response.data;
  }
};

export const attendanceService = {
  getAttendances: async (params?: { service_date?: string; service_type?: string }) => {
    const response = await api.get(getApiUrl('/attendances/'), { params });
    return response.data;
  },
  
  createAttendance: async (attendanceData: any) => {
    const response = await api.post(getApiUrl('/attendances/'), attendanceData);
    return response.data;
  },
  
  createBulkAttendance: async (attendances: any[]) => {
    const response = await api.post(getApiUrl('/attendances/bulk'), attendances);
    return response.data;
  },
  
  updateAttendance: async (attendanceId: number, attendanceData: any) => {
    const response = await api.put(getApiUrl(`/attendances/${attendanceId}`), attendanceData);
    return response.data;
  },
  
  deleteAttendance: async (attendanceId: number) => {
    const response = await api.delete(getApiUrl(`/attendances/${attendanceId}`));
    return response.data;
  }
};

export const bulletinService = {
  getBulletins: async () => {
    const response = await api.get(getApiUrl('/bulletins/'));
    return response.data;
  },
  
  createBulletin: async (bulletinData: any) => {
    const response = await api.post(getApiUrl('/bulletins/'), bulletinData);
    return response.data;
  },
  
  updateBulletin: async (bulletinId: number, bulletinData: any) => {
    const response = await api.put(getApiUrl(`/bulletins/${bulletinId}`), bulletinData);
    return response.data;
  },
  
  deleteBulletin: async (bulletinId: number) => {
    const response = await api.delete(getApiUrl(`/bulletins/${bulletinId}`));
    return response.data;
  }
};

export const announcementService = {
  getAnnouncements: async (params?: { is_active?: boolean; is_pinned?: boolean; category?: string; subcategory?: string; skip?: number; limit?: number }) => {
    const response = await api.get(getApiUrl('/announcements/'), { params });
    return response.data;
  },
  
  getCategories: async () => {
    const response = await api.get(getApiUrl('/announcements/categories'));
    return response.data;
  },
  
  getAnnouncement: async (announcementId: number) => {
    const response = await api.get(getApiUrl(`/announcements/${announcementId}`));
    return response.data;
  },
  
  createAnnouncement: async (announcementData: any) => {
    const response = await api.post(getApiUrl('/announcements/'), announcementData);
    return response.data;
  },
  
  updateAnnouncement: async (announcementId: number, announcementData: any) => {
    const response = await api.put(getApiUrl(`/announcements/${announcementId}`), announcementData);
    return response.data;
  },
  
  deleteAnnouncement: async (announcementId: number) => {
    const response = await api.delete(getApiUrl(`/announcements/${announcementId}`));
    return response.data;
  },
  
  togglePin: async (announcementId: number) => {
    const response = await api.put(getApiUrl(`/announcements/${announcementId}/toggle-pin`));
    return response.data;
  }
};

// AI Agent Management Service
export const agentService = {
  getAgents: async () => {
    try {
      const response = await api.get(getApiUrl('/agents/'));
      return response.data;
    } catch (error: any) {
      console.error('Failed to get agents:', error);
      if (error.response?.status === 422) {
        }
      return [];
    }
  },
  
  createAgent: async (agentData: any) => {
    try {
      const response = await api.post(getApiUrl('/agents/'), agentData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  },
  
  updateAgent: async (agentId: string, agentData: any) => {
    const response = await api.put(getApiUrl(`/agents/${agentId}`), agentData);
    return response.data;
  },
  
  deleteAgent: async (agentId: string) => {
    const response = await api.delete(getApiUrl(`/agents/${agentId}`));
    return response.data;
  },
  
  getAgentTemplates: async () => {
    try {
      const response = await api.get(getApiUrl('/agents/templates'));
      
      // 백엔드 보고서에 따른 새로운 응답 형식: { success: true, templates: [...] }
      if (response.data.success && Array.isArray(response.data.templates)) {
        return response.data.templates;
      }
      
      // 이전 응답 형식도 지원 (호환성 유지)
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('Failed to get agent templates:', error);
      
      // 422 에러 등으로 템플릿 로드 실패 시 빈 배열 반환 (백엔드 수정 전까지 유지)
      if (error.response?.status === 422) {
        return [];
      }
      
      // 다른 에러의 경우에도 빈 배열 반환하여 화면이 정상 작동하도록 함
      return [];
    }
  },
  
  activateAgent: async (agentId: string) => {
    try {
      const response = await api.put(getApiUrl(`/agents/${agentId}`), {
        is_active: true
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to activate agent:', error);
      throw error;
    }
  },
  
  deactivateAgent: async (agentId: string) => {
    try {
      const response = await api.put(getApiUrl(`/agents/${agentId}`), {
        is_active: false
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to deactivate agent:', error);
      throw error;
    }
  }
};

// Supabase Edge Function 설정
const SUPABASE_PROJECT_URL = 'https://adzhdsajdamrflvybhxq.supabase.co';

// Chat System Service (백엔드 API 완료)
export const chatService = {
  // 채팅 히스토리 목록 조회
  getChatHistories: async (params?: { include_messages?: boolean; limit?: number; skip?: number }) => {
    try {
      
      const response = await api.get(getApiUrl('/chat/histories'), { params });
      
      
      return response.data;
    } catch (error: any) {
      console.error('❌ 채팅 히스토리 API 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: getApiUrl('/chat/histories')
      });
      
      if (error.response?.status === 422) {
      }
      return [];
    }
  },
  
  // 특정 채팅의 메시지 목록 조회
  getChatMessages: async (historyId: string) => {
    // chat_ 접두어 제거하여 정수 ID만 사용
    const cleanId = historyId.toString().replace('chat_', '');
    const response = await api.get(getApiUrl(`/chat/histories/${cleanId}/messages`));
    return response.data;
  },
  
  // AI 메시지 전송 및 응답 생성
  sendMessage: async (messageData: {
    chat_history_id?: number | null;
    content: string;
    role: string;
    agent_id: string | number;
    messages: Array<{ role: string; content: string }>;
    optimize_speed?: boolean;
    create_history_if_needed?: boolean;
    agent_name?: string;
    // 🎯 비서 에이전트 균형 파라미터들
    church_data_context?: string;
    secretary_mode?: boolean;
    prioritize_church_data?: boolean;
    fallback_to_general?: boolean;
    // 호환성을 위해 기존 파라미터 유지 (사용하지 않음)
    force_church_data_only?: boolean;
    force_church_context?: boolean;
    no_external_knowledge?: boolean;
    church_only_response?: boolean;
  }) => {
    try {
      const response = await api.post(getApiUrl('/chat/messages'), messageData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('Chat messages endpoint not available yet, using fallback');
        throw new Error('ENDPOINT_NOT_AVAILABLE');
      }
      if (error.response?.status === 422) {
        console.warn('Chat messages endpoint validation error - likely backend needs to handle null chat_history_id');
        throw new Error('VALIDATION_ERROR');
      }
      if (error.response?.status === 500) {
        console.warn('Chat messages endpoint internal server error');
        throw new Error('SERVER_ERROR');
      }
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.warn('CORS or network error - backend CORS not properly configured for localhost:3000');
        throw new Error('CORS_ERROR');
      }
      throw error;
    }
  },
  
  // 새 채팅 생성
  createChatHistory: async (agentId?: string | number, title?: string) => {
    try {
      const payload: any = {
        title: title || '새 대화'
      };
      
      // 로그인한 사용자 정보 추가
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.id) {
            payload.user_id = user.id;
          }
          if (user.church_id) {
            payload.church_id = user.church_id;
          }
        }
      } catch (error) {
        console.warn('사용자 정보 파싱 실패:', error);
      }
      
      // agent_id 추가 (백엔드가 정수를 기대함)
      if (agentId) {
        // 숫자 또는 문자열 모두 처리
        payload.agent_id = typeof agentId === 'string' ? parseInt(agentId) : agentId;
      } else {
        // agent_id가 없으면 기본값 1 사용 (또는 필드 자체를 제외)
        payload.agent_id = 1; // 기본 에이전트 ID
      }
      
      const response = await api.post(getApiUrl('/chat/histories'), payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('Chat histories endpoint not available yet, using fallback');
        // 백엔드 구현 전까지 로컬 ID 생성
        throw new Error('ENDPOINT_NOT_AVAILABLE');
      }
      throw error;
    }
  },
  
  // 채팅 제목 수정
  updateChatTitle: async (historyId: string, title: string) => {
    const response = await api.put(getApiUrl(`/chat/histories/${historyId}`), { 
      title 
    });
    return response.data;
  },
  
  // 채팅 히스토리 삭제
  deleteChat: async (historyId: string) => {
    const response = await api.delete(getApiUrl(`/chat/histories/${historyId}`));
    return response.data;
  },
  
  // 북마크 토글
  bookmarkChat: async (historyId: string, isBookmarked: boolean) => {
    const url = getApiUrl(`/chat/histories/${historyId}`);
    const payload = { is_bookmarked: isBookmarked }; // 백엔드 필드명에 맞춤
    
    try {
      const response = await api.put(url, payload);
      return response.data;
    } catch (error: any) {
      console.error('❌ BookmarkChat API 실패:', {
        historyId,
        payload,
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      throw error;
    }
  },
  
  // 북마크 해제
  unbookmarkChat: async (historyId: string) => {
    return chatService.bookmarkChat(historyId, false);
  },

  // 채팅 내용을 기반으로 GPT 활용 제목 자동 생성 (전용 Edge Function 사용)
  generateChatTitle: async (messages: Array<{content: string, role: string}>) => {
    try {
      // 첫 4개의 메시지만 사용하여 제목 생성
      const relevantMessages = messages.slice(0, 4).map(msg => ({
        content: msg.content.slice(0, 200), // 내용 길이 제한
        role: msg.role
      }));

      // 새로 배포한 generate-title Edge Function 사용
      const response = await fetch('https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c`
        },
        body: JSON.stringify({
          messages: relevantMessages
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.title && data.title.length > 2) {
          return data.title;
        }
      }
      
      throw new Error('Edge Function 제목 생성 실패');
      
    } catch (error) {
      console.warn('Edge Function 제목 생성 실패, 폴백 사용:', error);
      
      // 폴백: 첫 번째 사용자 메시지 기반으로 간단한 제목 생성
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        let title = firstUserMessage.content
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/작성해줘|작성해주세요|만들어줘|만들어주세요|해줘|해주세요/g, '')
          .trim();
        
        if (title.length > 30) {
          title = title.slice(0, 30) + '...';
        }
        
        if (title.length < 5) {
          return `대화 ${new Date().toLocaleDateString()}`;
        }
        
        return title;
      }
      
      return `대화 ${new Date().toLocaleDateString()}`;
    }
  }
};

// Church Database Integration Service
export const churchDbService = {
  getDbConnections: async () => {
    const response = await api.get(getApiUrl('/church/database/connections'));
    return response.data;
  },
  
  createDbConnection: async (connectionData: any) => {
    const response = await api.post(getApiUrl('/church/database/connections'), connectionData);
    return response.data;
  },
  
  testDbConnection: async (connectionId: string) => {
    const response = await api.post(getApiUrl(`/church/database/connections/${connectionId}/test`));
    return response.data;
  },
  
  getDbTables: async (connectionId: string) => {
    const response = await api.get(getApiUrl(`/church/database/connections/${connectionId}/tables`));
    return response.data;
  },
  
  queryDatabase: async (connectionId: string, query: string) => {
    const response = await api.post(getApiUrl(`/church/database/connections/${connectionId}/query`), {
      query
    });
    return response.data;
  },
  
  getPrebuiltQueries: async () => {
    const response = await api.get(getApiUrl('/church/database/queries'));
    return response.data;
  }
};

// Church Profile & GPT Config Service
export const churchConfigService = {
  getGptConfig: async () => {
    try {
      // 백엔드 보고서에 따르면 수정되었다고 하지만, 실제로는 아직 405 에러 발생중
      // 일단 시도해보고 405 에러면 즉시 fallback 사용
      const response = await api.get(getApiUrl('/church/gpt-config'));
      
      // 백엔드 보고서에 따른 새로운 응답 형식: { success: true, data: {...} }
      if (response.data.success && response.data.data) {
        const config = response.data.data;
        return {
          api_key: config.api_key || null,
          database_connected: config.database_connected || false,
          last_sync: config.last_sync || null,
          model: config.model || 'gpt-4o-mini',
          max_tokens: config.max_tokens || 2000,
          temperature: config.temperature || 0.7,
          is_active: config.is_active || false
        };
      }
      
      // 이전 응답 형식도 지원 (호환성 유지)
      return {
        api_key: response.data.api_key || null,
        database_connected: response.data.database_connected || false,
        last_sync: response.data.last_sync || null,
        model: response.data.model || 'gpt-4o-mini',
        max_tokens: response.data.max_tokens || 2000,
        temperature: response.data.temperature || 0.7,
        is_active: response.data.is_active || false
      };
    } catch (error: any) {
      console.error('GPT config endpoint failed:', error.response?.status, error.message);
      
      // 405 에러면 즉시 church/profile fallback 시도 (백엔드 배포 전까지)
      if (error.response?.status === 405) {
        try {
          const fallbackResponse = await api.get(getApiUrl('/church/profile'));
          const profile = fallbackResponse.data;
          
          return {
            api_key: profile.gpt_api_key || profile.api_key || null,
            database_connected: profile.database_connected || false,
            last_sync: profile.last_sync || null,
            model: profile.gpt_model || 'gpt-4o-mini',
            max_tokens: profile.max_tokens || 2000,
            temperature: profile.temperature || 0.7,
            is_active: profile.gpt_is_active || false
          };
        } catch (fallbackError) {
          console.error('Church profile fallback also failed:', fallbackError);
        }
      }
      
      // 최종 fallback - 기본값 반환하여 화면이 정상 작동하도록 함
      return {
        api_key: null,
        database_connected: false,
        last_sync: null,
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        temperature: 0.7,
        is_active: false
      };
    }
  },
  
  updateGptConfig: async (configData: any) => {
    const response = await api.put(getApiUrl('/church/gpt-config'), configData);
    return response.data;
  },
  
  testGptConnection: async () => {
    const response = await api.post(getApiUrl('/church/gpt-config/test'));
    return response.data;
  },
  
  getChurchProfile: async () => {
    const response = await api.get(getApiUrl('/church/profile'));
    return response.data;
  },
  
  updateChurchProfile: async (profileData: any) => {
    try {
      const response = await api.put(getApiUrl('/church/profile'), profileData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update church profile:', error);
      throw error;
    }
  }
};

// Analytics Service
export const analyticsService = {
  getUsageStats: async (params?: { period?: string; agent_id?: string }) => {
  try {
    const response = await api.get(getApiUrl('/analytics/usage'), { params });
    
    // 백엔드 보고서에 따른 새로운 응답 형식: { success: true, data: {...} }
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    // 이전 응답 형식도 지원 (호환성 유지)
    if (response.data.total_requests !== undefined) {
      return response.data;
    }
    
    console.warn('Unexpected usage stats response format, returning default stats');
    return {
      total_requests: 0,
      total_tokens: 0,
      total_cost: 0,
      active_agents: 0,
      period_growth: {
        requests: 0,
        tokens: 0,
        cost: 0
      },
      daily_stats: [],
      period: params?.period || 'current_month'
    };
  } catch (error: any) {
    console.error('Failed to get usage stats:', error);
    
    // 422 에러 등으로 사용량 통계 로드 실패 시 기본값 반환 (백엔드 수정 전까지 유지)
    if (error.response?.status === 422) {
      console.warn('Usage stats endpoint still returns 422, using fallback');
    }
    
    // 기본 사용량 통계 반환하여 화면이 정상 작동하도록 함
    return {
      total_requests: 0,
      total_tokens: 0,
      total_cost: 0,
      active_agents: 0,
      period_growth: {
        requests: 0,
        tokens: 0,
        cost: 0
      },
      daily_stats: [],
      period: params?.period || 'current_month'
    };
  }
  },
  
  getTokenUsage: async (params?: { start_date?: string; end_date?: string }) => {
    try {
      const response = await api.get(getApiUrl('/analytics/tokens'), { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get token usage:', error);
      if (error.response?.status === 422) {
        console.warn('Token usage endpoint returned 422, returning default data');
      }
      return { usage_data: [], total_tokens: 0 };
    }
  },
  
  getCostAnalysis: async (params?: { period?: string }) => {
    try {
      const response = await api.get(getApiUrl('/analytics/costs'), { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get cost analysis:', error);
      if (error.response?.status === 422) {
        console.warn('Cost analysis endpoint returned 422, returning default data');
      }
      return {
        total_cost: 0,
        cost_breakdown: [],
        period: params?.period || 'current_month'
      };
    }
  },
  
  getAgentPerformance: async () => {
    try {
      const response = await api.get(getApiUrl('/analytics/agents/performance'));
      return response.data;
    } catch (error: any) {
      console.error('Failed to get agent performance:', error);
      if (error.response?.status === 422) {
        console.warn('Agent performance endpoint returned 422, returning default data');
      }
      // Return empty array to match component expectation
      return [];
    }
  },
  
  getTopQueries: async (params?: { limit?: number; period?: string }) => {
    try {
      const response = await api.get(getApiUrl('/analytics/queries/top'), { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get top queries:', error);
      if (error.response?.status === 422) {
        console.warn('Top queries endpoint returned 422, returning default data');
      }
      // Return empty array to match component expectation
      return [];
    }
  },
  
  getTrendAnalysis: async (params?: { metric?: string; period?: string }) => {
    try {
      const response = await api.get(getApiUrl('/analytics/trends'), { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get trend analysis:', error);
      if (error.response?.status === 422) {
        console.warn('Trend analysis endpoint returned 422, returning default data');
      }
      // Return empty array to match component expectation
      return [];
    }
  }
};

// 시스템 프롬프트 생성 서비스
export const promptService = {
  generateSystemPrompt: async (agentInfo: { 
    name: string; 
    category: string; 
    description: string; 
    detailedDescription: string; 
  }) => {
    try {
      const response = await fetch('https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/generate-system-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c`,
        },
        body: JSON.stringify(agentInfo),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '시스템 프롬프트 생성에 실패했습니다.');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '시스템 프롬프트 생성에 실패했습니다.');
      }

      return {
        systemPrompt: data.systemPrompt,
        tokensUsed: data.tokensUsed
      };
    } catch (error: any) {
      console.error('Failed to generate system prompt:', error);
      throw error;
    }
  }
};

// 심방 신청 관리 서비스
export const pastoralCareService = {
  // 관리자용 API
  getRequests: async (params?: { 
    status?: string; 
    priority?: string; 
    request_type?: string; 
    skip?: number; 
    limit?: number; 
  }) => {
    const response = await api.get(getApiUrl('/pastoral-care/admin/requests'), { params });
    return response.data;
  },

  getRequest: async (requestId: string) => {
    const response = await api.get(getApiUrl(`/pastoral-care/admin/requests/${requestId}`));
    return response.data;
  },

  updateRequest: async (requestId: string, updateData: any) => {
    const response = await api.put(getApiUrl(`/pastoral-care/admin/requests/${requestId}`), updateData);
    return response.data;
  },

  assignPastor: async (requestId: string, pastorId: string) => {
    const response = await api.put(getApiUrl(`/pastoral-care/admin/requests/${requestId}/assign`), {
      assigned_pastor_id: pastorId
    });
    return response.data;
  },

  completeRequest: async (requestId: string, completionData: any) => {
    const response = await api.post(getApiUrl(`/pastoral-care/admin/requests/${requestId}/complete`), completionData);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get(getApiUrl('/pastoral-care/admin/stats'));
    return response.data;
  },

  // 관리자용 심방 신청 등록
  createRequest: async (requestData: any) => {
    const response = await api.post(getApiUrl('/pastoral-care/admin/requests'), requestData);
    return response.data;
  },

  // 모바일용 API (필요시)
  createUserRequest: async (requestData: any) => {
    const response = await api.post(getApiUrl('/pastoral-care/requests'), requestData);
    return response.data;
  },

  getMyRequests: async () => {
    const response = await api.get(getApiUrl('/pastoral-care/requests/my'));
    return response.data;
  }
};

// 중보 기도 요청 관리 서비스
export const prayerRequestService = {
  // 관리자용 API
  getRequests: async (params?: { 
    status?: string; 
    prayer_type?: string; 
    is_public?: boolean; 
    skip?: number; 
    limit?: number; 
  }) => {
    const response = await api.get(getApiUrl('/prayer-requests/admin/all'), { params });
    return response.data;
  },

  getRequest: async (requestId: string) => {
    const response = await api.get(getApiUrl(`/prayer-requests/admin/${requestId}`));
    return response.data;
  },

  updateRequest: async (requestId: string, updateData: any) => {
    const response = await api.put(getApiUrl(`/prayer-requests/admin/${requestId}`), updateData);
    return response.data;
  },

  moderateRequest: async (requestId: string, moderationData: any) => {
    const response = await api.put(getApiUrl(`/prayer-requests/admin/${requestId}/moderate`), moderationData);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get(getApiUrl('/prayer-requests/admin/stats'));
    return response.data;
  },

  getBulletinRequests: async () => {
    const response = await api.get(getApiUrl('/prayer-requests/admin/bulletin'));
    return response.data;
  },

  // 모바일용 API (필요시)
  createRequest: async (requestData: any) => {
    const response = await api.post(getApiUrl('/prayer-requests'), requestData);
    return response.data;
  },

  getPublicRequests: async (params?: { skip?: number; limit?: number }) => {
    const response = await api.get(getApiUrl('/prayer-requests'), { params });
    return response.data;
  },

  getMyRequests: async () => {
    const response = await api.get(getApiUrl('/prayer-requests/my'));
    return response.data;
  },

  participateInPrayer: async (requestId: string) => {
    const response = await api.post(getApiUrl(`/prayer-requests/${requestId}/pray`));
    return response.data;
  },

  addTestimony: async (requestId: string, testimonyData: any) => {
    const response = await api.put(getApiUrl(`/prayer-requests/${requestId}/testimony`), testimonyData);
    return response.data;
  },

  deleteRequest: async (requestId: string) => {
    const response = await api.delete(getApiUrl(`/prayer-requests/${requestId}`));
    return response.data;
  }
};

// 재정관리 API 서비스
export const financialService = {
  // 헌금 관리
  getOfferings: async (params?: { 
    skip?: number; 
    limit?: number; 
    church_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    const url = getApiUrl('/financial/offerings');
    const response = await api.get(url, { params });
    return response.data;
  },

  createOffering: async (offeringData: any) => {
    const response = await api.post(getApiUrl('/financial/offerings'), offeringData);
    return response.data;
  },

  createBulkOfferings: async (offeringsData: any[]) => {
    const response = await api.post(getApiUrl('/financial/offerings/bulk'), { offerings: offeringsData });
    return response.data;
  },

  updateOffering: async (offeringId: number, offeringData: any) => {
    const response = await api.put(getApiUrl(`/financial/offerings/${offeringId}`), offeringData);
    return response.data;
  },

  deleteOffering: async (offeringId: number) => {
    const response = await api.delete(getApiUrl(`/financial/offerings/${offeringId}`));
    return response.data;
  },

  // 영수증 관리
  getReceipts: async (params?: { 
    skip?: number; 
    limit?: number; 
    member_id?: number;
    tax_year?: number;
  }) => {
    const response = await api.get(getApiUrl('/financial/receipts'), { params });
    return response.data;
  },

  createReceipt: async (receiptData: any) => {
    const response = await api.post(getApiUrl('/financial/receipts'), receiptData);
    return response.data;
  },

  updateReceipt: async (receiptId: number, receiptData: any) => {
    const response = await api.put(getApiUrl(`/financial/receipts/${receiptId}`), receiptData);
    return response.data;
  },

  deleteReceipt: async (receiptId: number) => {
    const response = await api.delete(getApiUrl(`/financial/receipts/${receiptId}`));
    return response.data;
  },

  // 헌금 유형 관리
  getFundTypes: async () => {
    const response = await api.get(getApiUrl('/financial/fund-types'));
    return response.data;
  },

  createFundType: async (fundTypeData: any) => {
    const response = await api.post(getApiUrl('/financial/fund-types'), fundTypeData);
    return response.data;
  },

  updateFundType: async (fundTypeId: number, fundTypeData: any) => {
    const response = await api.put(getApiUrl(`/financial/fund-types/${fundTypeId}`), fundTypeData);
    return response.data;
  },

  deleteFundType: async (fundTypeId: number) => {
    const response = await api.delete(getApiUrl(`/financial/fund-types/${fundTypeId}`));
    return response.data;
  },

  // 통계
  getStatistics: async (params?: { 
    start_date?: string; 
    end_date?: string; 
    fund_type?: string;
  }) => {
    const response = await api.get(getApiUrl('/financial/statistics'), { params });
    return response.data;
  },

  getMonthlyStatistics: async (year: number) => {
    const response = await api.get(getApiUrl(`/financial/statistics/monthly/${year}`));
    return response.data;
  },

  getYearlyStatistics: async (startYear: number, endYear: number) => {
    const response = await api.get(getApiUrl('/financial/statistics/yearly'), { 
      params: { start_year: startYear, end_year: endYear }
    });
    return response.data;
  }
};

// 설교 자료 관리 서비스
export const sermonLibraryService = {
  // 설교 자료 조회
  getSermonMaterials: async (params?: { 
    q?: string;
    category?: string;
    author?: string;
    file_type?: string;
    public_only?: boolean;
    page?: number;
    size?: number;
  }) => {
    try {
      // 페이지네이션 변환: page/size → skip/limit
      const queryParams: any = {};
      if (params?.page && params?.size) {
        queryParams.skip = (params.page - 1) * params.size;
        queryParams.limit = params.size;
      }
      if (params?.q) queryParams.q = params.q;
      if (params?.category) queryParams.category = params.category;
      if (params?.author) queryParams.author = params.author;
      if (params?.file_type) queryParams.file_type = params.file_type;
      if (params?.public_only) queryParams.public_only = params.public_only;
      
      console.log('🔍 API 호출 시작:', getApiUrl('/sermon-materials/'), queryParams);
      const response = await api.get(getApiUrl('/sermon-materials/'), { params: queryParams });
      console.log('✅ API 응답 받음:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 설교 자료 조회 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: getApiUrl('/sermon-materials/')
      });
      throw error;
    }
  },

  // 카테고리 조회
  getCategories: async () => {
    try {
      console.log('🔍 카테고리 API 호출:', getApiUrl('/sermon-materials/categories/'));
      const response = await api.get(getApiUrl('/sermon-materials/categories/'));
      console.log('✅ 카테고리 API 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 카테고리 조회 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // 설교자 목록 조회
  getAuthors: async () => {
    try {
      console.log('🔍 설교자 API 호출:', getApiUrl('/sermon-materials/authors/'));
      const response = await api.get(getApiUrl('/sermon-materials/authors/'));
      console.log('✅ 설교자 API 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 설교자 목록 조회 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // 태그 목록 조회
  getTags: async () => {
    try {
      console.log('🔍 태그 API 호출:', getApiUrl('/sermon-materials/tags/'));
      const response = await api.get(getApiUrl('/sermon-materials/tags/'));
      console.log('✅ 태그 API 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 태그 목록 조회 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // 통계 조회
  getStats: async () => {
    try {
      console.log('🔍 통계 API 호출:', getApiUrl('/sermon-materials/stats/'));
      const response = await api.get(getApiUrl('/sermon-materials/stats/'));
      console.log('✅ 통계 API 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 통계 조회 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // 파일 다운로드
  downloadFile: async (fileUrl: string) => {
    try {
      console.log('🔍 파일 다운로드 API 호출:', getApiUrl(`/sermon-materials/files/${fileUrl}`));
      const response = await api.get(getApiUrl(`/sermon-materials/files/${fileUrl}`), {
        responseType: 'blob'
      });
      console.log('✅ 파일 다운로드 성공');
      return response;
    } catch (error: any) {
      console.error('❌ 파일 다운로드 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // 새 자료 등록
  createMaterial: async (materialData: any) => {
    try {
      console.log('🔍 자료 등록 API 호출:', getApiUrl('/sermon-materials/'), materialData);
      const response = await api.post(getApiUrl('/sermon-materials/'), materialData);
      console.log('✅ 자료 등록 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 자료 등록 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // 자료 수정
  updateMaterial: async (materialId: number, materialData: any) => {
    try {
      console.log('🔍 자료 수정 API 호출:', getApiUrl(`/sermon-materials/${materialId}`), materialData);
      const response = await api.put(getApiUrl(`/sermon-materials/${materialId}`), materialData);
      console.log('✅ 자료 수정 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 자료 수정 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // 자료 삭제
  deleteMaterial: async (materialId: number) => {
    try {
      console.log('🔍 자료 삭제 API 호출:', getApiUrl(`/sermon-materials/${materialId}`));
      const response = await api.delete(getApiUrl(`/sermon-materials/${materialId}`));
      console.log('✅ 자료 삭제 성공');
      return response.data;
    } catch (error: any) {
      console.error('❌ 자료 삭제 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // 파일 업로드
  uploadFile: async (formData: FormData) => {
    try {
      console.log('🔍 파일 업로드 API 호출:', getApiUrl('/sermon-materials/upload'));
      const response = await api.post(getApiUrl('/sermon-materials/upload'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ 파일 업로드 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 파일 업로드 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
};

export { api };
export default api;