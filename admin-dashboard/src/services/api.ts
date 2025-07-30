import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

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
    
    const response = await api.post('/auth/login/access-token', formData);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  }
};

export const userService = {
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },
  
  createUser: async (userData: any) => {
    const response = await api.post('/users/', userData);
    return response.data;
  },
  
  updateUser: async (userId: number, userData: any) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  }
};

export const memberService = {
  getMembers: async () => {
    const response = await api.get('/members/');
    return response.data;
  },
  
  createMember: async (memberData: any) => {
    const response = await api.post('/members/', memberData);
    return response.data;
  },
  
  updateMember: async (memberId: number, memberData: any) => {
    const response = await api.put(`/members/${memberId}`, memberData);
    return response.data;
  },
  
  deleteMember: async (memberId: number) => {
    const response = await api.delete(`/members/${memberId}`);
    return response.data;
  }
};

export const churchService = {
  getMyChurch: async () => {
    const response = await api.get('/churches/my');
    return response.data;
  },
  
  updateChurch: async (churchId: number, churchData: any) => {
    const response = await api.put(`/churches/${churchId}`, churchData);
    return response.data;
  }
};

export const attendanceService = {
  getAttendances: async (params?: { service_date?: string; service_type?: string }) => {
    const response = await api.get('/attendances/', { params });
    return response.data;
  },
  
  createAttendance: async (attendanceData: any) => {
    const response = await api.post('/attendances/', attendanceData);
    return response.data;
  },
  
  createBulkAttendance: async (attendances: any[]) => {
    const response = await api.post('/attendances/bulk', attendances);
    return response.data;
  },
  
  updateAttendance: async (attendanceId: number, attendanceData: any) => {
    const response = await api.put(`/attendances/${attendanceId}`, attendanceData);
    return response.data;
  },
  
  deleteAttendance: async (attendanceId: number) => {
    const response = await api.delete(`/attendances/${attendanceId}`);
    return response.data;
  }
};

export const bulletinService = {
  getBulletins: async () => {
    const response = await api.get('/bulletins/');
    return response.data;
  },
  
  createBulletin: async (bulletinData: any) => {
    const response = await api.post('/bulletins/', bulletinData);
    return response.data;
  },
  
  updateBulletin: async (bulletinId: number, bulletinData: any) => {
    const response = await api.put(`/bulletins/${bulletinId}`, bulletinData);
    return response.data;
  },
  
  deleteBulletin: async (bulletinId: number) => {
    const response = await api.delete(`/bulletins/${bulletinId}`);
    return response.data;
  }
};

export default api;