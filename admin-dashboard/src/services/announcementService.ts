import { api, getApiUrl } from './api';

export interface Church {
  id: number;
  name: string;
  pastor_name?: string;
  address?: string;
  member_count?: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  priority: 'urgent' | 'important' | 'normal';
  target_type: 'all' | 'specific' | 'single';
  target_church_ids?: number[];
  church_id?: number;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
  // 백워드 호환성을 위한 필드
  type?: 'system' | 'church';
}

export interface AnnouncementCreate {
  title: string;
  content: string;
  category?: string;
  subcategory?: string;
  priority: 'urgent' | 'important' | 'normal';
  target_type?: 'all' | 'specific' | 'single';
  target_church_ids?: number[];
  church_id?: number;
  start_date: string;
  end_date?: string;
  is_active?: boolean;
  // 백워드 호환성을 위한 필드
  type?: 'system' | 'church';
}

export interface AnnouncementUpdate extends Partial<AnnouncementCreate> {
  is_active?: boolean;
}

export const announcementService = {
  // === 시스템 공지사항 API (시스템 관리자용) ===
  
  // 대상 교회 목록 조회 (시스템 관리자용)
  getChurches: async (): Promise<Church[]> => {
    try {
      const response = await api.get(getApiUrl('/system-announcements/churches'));
      return response.data || [];
    } catch (error: any) {
      console.error('교회 목록 조회 실패:', error);
      return [];
    }
  },

  // 시스템 공지사항 관리 조회 (시스템 관리자용)
  getSystemAnnouncementsAdmin: async (): Promise<Announcement[]> => {
    try {
      const response = await api.get(getApiUrl('/system-announcements/admin'));
      return response.data.announcements || [];
    } catch (error: any) {
      console.error('시스템 공지사항 관리 조회 실패:', error);
      return [];
    }
  },

  // 시스템 공지사항 생성 (시스템 관리자용)
  createSystemAnnouncement: async (announcement: AnnouncementCreate): Promise<Announcement> => {
    // target_church_ids를 JSON 문자열로 변환
    const payload = {
      ...announcement,
      target_churches: announcement.target_church_ids ? JSON.stringify(announcement.target_church_ids) : null
    };
    delete payload.target_church_ids; // 백엔드 필드명과 맞추기
    
    const response = await api.post(getApiUrl('/system-announcements/'), payload);
    return response.data;
  },

  // 시스템 공지사항 수정 (시스템 관리자용)
  updateSystemAnnouncement: async (id: number, announcement: AnnouncementUpdate): Promise<Announcement> => {
    const payload = {
      ...announcement,
      target_churches: announcement.target_church_ids ? JSON.stringify(announcement.target_church_ids) : null
    };
    delete payload.target_church_ids;
    
    const response = await api.put(getApiUrl(`/system-announcements/${id}`), payload);
    return response.data;
  },

  // 시스템 공지사항 삭제 (시스템 관리자용)
  deleteSystemAnnouncement: async (id: number): Promise<void> => {
    await api.delete(getApiUrl(`/system-announcements/${id}`));
  },

  // 시스템 공지사항 읽음 처리
  markSystemAnnouncementAsRead: async (announcementId: number): Promise<void> => {
    try {
      await api.post(getApiUrl(`/system-announcements/${announcementId}/read`));
    } catch (error: any) {
      console.error('시스템 공지사항 읽음 처리 실패:', error);
    }
  },

  // === 활성 공지사항 조회 (모든 사용자용) ===
  
  // 활성 시스템 공지사항 조회 (모든 사용자용)
  getActiveSystemAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const response = await api.get(getApiUrl('/system-announcements/'));
      return response.data || [];
    } catch (error: any) {
      console.error('활성 시스템 공지사항 조회 실패:', error);
      return [];
    }
  },

  // 활성 교회 공지사항 조회 (교회 사용자용)
  getActiveChurchAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const response = await api.get(getApiUrl('/announcements/active'));
      return response.data || [];
    } catch (error: any) {
      console.error('활성 교회 공지사항 조회 실패:', error);
      return [];
    }
  },

  // 모든 활성 공지사항 조회 (시스템 + 교회)
  getActiveAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const [systemAnnouncements, churchAnnouncements] = await Promise.all([
        announcementService.getActiveSystemAnnouncements(),
        announcementService.getActiveChurchAnnouncements()
      ]);
      return [...systemAnnouncements, ...churchAnnouncements];
    } catch (error: any) {
      console.error('활성 공지사항 조회 실패:', error);
      return [];
    }
  },

  // === 교회 공지사항 API (교회 관리자용) ===
  
  // 교회 공지사항 관리 조회 (교회 관리자용)
  getAnnouncementsAdmin: async (): Promise<Announcement[]> => {
    try {
      const response = await api.get(getApiUrl('/announcements/church-admin'));
      return response.data.announcements || [];
    } catch (error: any) {
      console.error('교회 공지사항 관리 조회 실패:', error);
      return [];
    }
  },

  // 교회 공지사항 생성 (교회 관리자용)
  createAnnouncement: async (announcement: AnnouncementCreate): Promise<Announcement> => {
    const response = await api.post(getApiUrl('/announcements/'), announcement);
    return response.data;
  },

  // 교회 공지사항 수정 (교회 관리자용)
  updateAnnouncement: async (id: number, announcement: AnnouncementUpdate): Promise<Announcement> => {
    const response = await api.put(getApiUrl(`/announcements/${id}`), announcement);
    return response.data;
  },

  // 교회 공지사항 삭제 (교회 관리자용)
  deleteAnnouncement: async (id: number): Promise<void> => {
    await api.delete(getApiUrl(`/announcements/${id}`));
  },

  // 교회 공지사항 읽음 처리 (현재 미구현)
  markAsRead: async (announcementId: number): Promise<void> => {
    try {
      await api.post(getApiUrl(`/announcements/${announcementId}/read`));
    } catch (error: any) {
      console.error('교회 공지사항 읽음 처리 실패:', error);
    }
  }
};