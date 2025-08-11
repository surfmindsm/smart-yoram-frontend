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
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
  getAnnouncements: async (params?: { is_active?: boolean; is_pinned?: boolean }) => {
    const response = await api.get(getApiUrl('/announcements/'), { params });
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

export const gptService = {
  getSystemStatus: async () => {
    const response = await api.get(getApiUrl('/church/system-status'));
    return response.data;
  },
  
  getChurchProfile: async () => {
    const response = await api.get(getApiUrl('/church/profile'));
    return response.data;
  },
  
  updateGPTConfig: async (config: {
    api_key: string;
    model: string;
    max_tokens: number;
    temperature: number;
  }) => {
    const response = await api.put(getApiUrl('/church/gpt-config'), config);
    return response.data;
  },
  
  testGPTConnection: async (apiKey: string) => {
    const response = await api.post(getApiUrl('/church/test-gpt'), { api_key: apiKey });
    return response.data;
  }
};

export const chatService = {
  // Get chat histories
  getHistories: async (includeMessages: boolean = false) => {
    const response = await api.get(getApiUrl('/chat/histories'), {
      params: { include_messages: includeMessages }
    });
    return response.data;
  },
  
  // Create new chat history
  createHistory: async (agentId: number | string, title?: string) => {
    const response = await api.post(getApiUrl('/chat/histories'), {
      agent_id: String(agentId),
      title: title || '새 대화'
    });
    return response.data;
  },
  
  // Get messages for a chat history
  getMessages: async (historyId: number | string) => {
    const response = await api.get(getApiUrl(`/chat/histories/${historyId}/messages`));
    return response.data;
  },
  
  // Send message and get AI response
  sendMessage: async (chatHistoryId: number | string, agentId: number | string, content: string) => {
    const response = await api.post(getApiUrl('/chat/messages'), {
      chat_history_id: String(chatHistoryId),
      agent_id: String(agentId),
      content: content
    });
    return response.data;
  },
  
  // Update chat history (title, bookmark)
  updateHistory: async (historyId: number | string, data: { title?: string; is_bookmarked?: boolean }) => {
    const response = await api.put(getApiUrl(`/chat/histories/${historyId}`), data);
    return response.data;
  },
  
  // Delete chat history
  deleteHistory: async (historyId: number | string) => {
    const response = await api.delete(getApiUrl(`/chat/histories/${historyId}`));
    return response.data;
  }
};

export const aiAgentService = {
  // Get all agents
  getAgents: async () => {
    const response = await api.get(getApiUrl('/agents/'));
    return response.data;
  },
  
  // Get agent by ID
  getAgent: async (agentId: number | string) => {
    const response = await api.get(getApiUrl(`/agents/${agentId}`));
    return response.data;
  },
  
  // Create new agent
  createAgent: async (data: {
    name: string;
    category: string;
    system_prompt: string;
    description?: string;
    is_active?: boolean;
  }) => {
    const response = await api.post(getApiUrl('/agents/'), data);
    return response.data;
  },
  
  // Update agent
  updateAgent: async (agentId: number | string, data: any) => {
    const response = await api.put(getApiUrl(`/agents/${agentId}`), data);
    return response.data;
  },
  
  // Delete agent
  deleteAgent: async (agentId: number | string) => {
    const response = await api.delete(getApiUrl(`/agents/${agentId}`));
    return response.data;
  }
};

export { api };
export default api;