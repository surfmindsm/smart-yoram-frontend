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

// Chat System Service
export const chatService = {
  getChatHistories: async (params?: { limit?: number; skip?: number }) => {
    const response = await api.get(getApiUrl('/chat/histories'), { params });
    return response.data;
  },
  
  getChatMessages: async (chatId: string) => {
    const response = await api.get(getApiUrl(`/chat/${chatId}/messages`));
    return response.data;
  },
  
  sendMessage: async (chatId: string, message: string, agentId?: string) => {
    const response = await api.post(getApiUrl(`/chat/${chatId}/messages`), {
      content: message,
      agent_id: agentId
    });
    return response.data;
  },
  
  createNewChat: async (agentId?: string, title?: string) => {
    const response = await api.post(getApiUrl('/chat/'), {
      agent_id: agentId,
      title: title
    });
    return response.data;
  },
  
  updateChatTitle: async (chatId: string, title: string) => {
    const response = await api.put(getApiUrl(`/chat/${chatId}`), { title });
    return response.data;
  },
  
  deleteChat: async (chatId: string) => {
    const response = await api.delete(getApiUrl(`/chat/${chatId}`));
    return response.data;
  },
  
  bookmarkChat: async (chatId: string) => {
    const response = await api.put(getApiUrl(`/chat/${chatId}/bookmark`));
    return response.data;
  },
  
  unbookmarkChat: async (chatId: string) => {
    const response = await api.delete(getApiUrl(`/chat/${chatId}/bookmark`));
    return response.data;
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
    const response = await api.get(getApiUrl('/church/gpt-config'));
    return response.data;
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