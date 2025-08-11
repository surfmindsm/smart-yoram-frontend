import axios from 'axios';

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
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post(getApiUrl('/auth/login/access-token'), formData);
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
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
    const response = await api.get(getApiUrl('/agents/'));
    return response.data;
  },
  
  createAgent: async (agentData: any) => {
    const response = await api.post(getApiUrl('/agents/'), agentData);
    return response.data;
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
    const response = await api.get(getApiUrl('/agents/templates'));
    return response.data;
  },
  
  activateAgent: async (agentId: string) => {
    const response = await api.put(getApiUrl(`/agents/${agentId}/activate`));
    return response.data;
  },
  
  deactivateAgent: async (agentId: string) => {
    const response = await api.put(getApiUrl(`/agents/${agentId}/deactivate`));
    return response.data;
  }
};

// Supabase Edge Function 설정
const SUPABASE_PROJECT_URL = 'https://adzhdsajdamrflvybhxq.supabase.co';

// Chat System Service (백엔드 API 완료)
export const chatService = {
  // 채팅 히스토리 목록 조회
  getChatHistories: async (params?: { include_messages?: boolean; limit?: number; skip?: number }) => {
    const response = await api.get(getApiUrl('/chat/histories'), { params });
    return response.data;
  },
  
  // 특정 채팅의 메시지 목록 조회
  getChatMessages: async (historyId: string) => {
    const response = await api.get(getApiUrl(`/chat/histories/${historyId}/messages`));
    return response.data;
  },
  
  // 메시지 전송 및 AI 응답 생성
  sendMessage: async (chatHistoryId: string, message: string, agentId?: string) => {
    const payload: any = {
      chat_history_id: parseInt(chatHistoryId), // 백엔드가 정수 ID를 기대
      content: message.trim(),
      agent_id: agentId ? parseInt(agentId) : 1 // 백엔드가 정수를 기대 (기본값 1)
    };
    
    console.log('📤 Sending message with payload:', payload);
    const response = await api.post(getApiUrl('/chat/messages'), payload);
    return response.data;
  },
  
  // 새 채팅 생성
  createChatHistory: async (agentId?: string, title?: string) => {
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
    if (agentId && agentId.trim() !== '') {
      payload.agent_id = parseInt(agentId); // 문자열을 정수로 변환
    } else {
      // agent_id가 없으면 기본값 1 사용 (또는 필드 자체를 제외)
      payload.agent_id = 1; // 기본 에이전트 ID
    }
    
    console.log('📤 Creating chat with payload:', payload);
    const response = await api.post(getApiUrl('/chat/histories'), payload);
    return response.data;
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
    const response = await api.put(getApiUrl(`/chat/histories/${historyId}`), {
      isBookmarked
    });
    return response.data;
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
      // /church/gpt-config가 405 에러를 계속 발생시키므로 
      // church/profile에서 GPT 설정을 가져오도록 시도
      const response = await api.get(getApiUrl('/church/profile'));
      const profile = response.data;
      
      // church profile에서 GPT 관련 정보 추출 (GptConfig 타입에 맞게 완전한 객체 반환)
      return {
        api_key: profile.gpt_api_key || profile.api_key || null,
        database_connected: profile.database_connected || false,
        last_sync: profile.last_sync || null,
        model: profile.gpt_model || 'gpt-3.5-turbo',
        max_tokens: profile.max_tokens || 1000,
        temperature: profile.temperature || 0.7,
        is_active: profile.gpt_is_active || false
      };
    } catch (error: any) {
      console.error('Failed to load GPT config from church profile:', error);
      // API 호출 실패 시 기본값 반환하여 화면이 정상 작동하도록 함
      return {
        api_key: null,
        database_connected: false,
        last_sync: null,
        model: 'gpt-3.5-turbo',
        max_tokens: 1000,
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
    const response = await api.put(getApiUrl('/church/profile'), profileData);
    return response.data;
  }
};

// Analytics Service
export const analyticsService = {
  getUsageStats: async (params?: { period?: string; agent_id?: string }) => {
    const response = await api.get(getApiUrl('/analytics/usage'), { params });
    return response.data;
  },
  
  getTokenUsage: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await api.get(getApiUrl('/analytics/tokens'), { params });
    return response.data;
  },
  
  getCostAnalysis: async (params?: { period?: string }) => {
    const response = await api.get(getApiUrl('/analytics/costs'), { params });
    return response.data;
  },
  
  getAgentPerformance: async () => {
    const response = await api.get(getApiUrl('/analytics/agents'));
    return response.data;
  },
  
  getTopQueries: async (params?: { limit?: number; period?: string }) => {
    const response = await api.get(getApiUrl('/analytics/queries'), { params });
    return response.data;
  },
  
  getTrendAnalysis: async (params?: { metric?: string; period?: string }) => {
    const response = await api.get(getApiUrl('/analytics/trends'), { params });
    return response.data;
  }
};

export { api };
export default api;