import { authService } from './api';

// API Base URL from guide
const BASE_URL = 'https://api.surfmind-team.com/api/v1';

export interface CommunityApplicationRequest {
  // 필수 필드
  applicant_type: 'company' | 'individual' | 'musician' | 'minister' | 'organization' | 'other';
  organization_name: string;
  contact_person: string;
  email: string;
  phone: string;
  description: string;
  
  // 선택 필드
  business_number?: string;
  address?: string;
  service_area?: string;
  website?: string;
  attachments?: File[];
}

export interface CommunityApplication {
  id: number;
  applicant_type: string;
  organization_name: string;
  contact_person: string;
  email: string;
  phone: string;
  business_number?: string;
  address?: string;
  description: string;
  service_area?: string;
  website?: string;
  attachments: Array<{
    filename: string;
    path: string;
    size: number;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationsResponse {
  applications: CommunityApplication[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
  statistics: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
}

export interface ApplicationsQueryParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  applicant_type?: 'company' | 'individual' | 'musician' | 'minister' | 'organization' | 'other' | 'all';
  search?: string;
  sort_by?: 'submitted_at' | 'reviewed_at' | 'organization_name';
  sort_order?: 'asc' | 'desc';
}

class CommunityApplicationService {
  /**
   * 커뮤니티 회원 신청서 제출 (공개 API)
   */
  async submitApplication(data: CommunityApplicationRequest): Promise<{ application_id: number; status: string; submitted_at: string }> {
    const formData = new FormData();
    
    // 필수 필드 추가
    formData.append('applicant_type', data.applicant_type);
    formData.append('organization_name', data.organization_name);
    formData.append('contact_person', data.contact_person);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('description', data.description);
    
    // 선택 필드 추가 (값이 있을 때만)
    if (data.business_number) {
      formData.append('business_number', data.business_number);
    }
    if (data.address) {
      formData.append('address', data.address);
    }
    if (data.service_area) {
      formData.append('service_area', data.service_area);
    }
    if (data.website) {
      formData.append('website', data.website);
    }
    
    // 파일 첨부 (multiple files)
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    try {
      const response = await fetch(`${BASE_URL}/community/applications`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '신청서 제출에 실패했습니다.');
      }
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('신청서 제출 실패:', error);
      throw error;
    }
  }

  /**
   * 신청서 목록 조회 (슈퍼어드민 전용)
   */
  async getApplications(params: ApplicationsQueryParams = {}): Promise<ApplicationsResponse> {
    const query = new URLSearchParams();
    
    // 기본값 설정
    query.append('page', String(params.page || 1));
    query.append('limit', String(params.limit || 20));
    
    // 선택적 파라미터 추가
    if (params.status && params.status !== 'all') {
      query.append('status', params.status);
    }
    if (params.applicant_type && params.applicant_type !== 'all') {
      query.append('applicant_type', params.applicant_type);
    }
    if (params.search) {
      query.append('search', params.search);
    }
    if (params.sort_by) {
      query.append('sort_by', params.sort_by);
    }
    if (params.sort_order) {
      query.append('sort_order', params.sort_order);
    }
    
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${BASE_URL}/admin/community/applications?${query}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        } else if (response.status === 403) {
          throw new Error('접근 권한이 없습니다.');
        }
        throw new Error('신청서 목록 조회에 실패했습니다.');
      }
      
      return await response.json();
    } catch (error) {
      console.error('신청서 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 신청서 상세 조회 (슈퍼어드민 전용)
   */
  async getApplication(applicationId: number): Promise<CommunityApplication> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${BASE_URL}/admin/community/applications/${applicationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('신청서를 찾을 수 없습니다.');
        }
        throw new Error('신청서 조회에 실패했습니다.');
      }
      
      return await response.json();
    } catch (error) {
      console.error('신청서 상세 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 신청서 승인 (슈퍼어드민 전용)
   */
  async approveApplication(applicationId: number, notes?: string): Promise<{
    application_id: number;
    status: string;
    reviewed_at: string;
    user_account?: {
      username: string;
      temporary_password: string;
      login_url: string;
    };
  }> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${BASE_URL}/admin/community/applications/${applicationId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: notes || ''
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '승인 처리에 실패했습니다.');
      }
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('신청서 승인 실패:', error);
      throw error;
    }
  }

  /**
   * 신청서 반려 (슈퍼어드민 전용)
   */
  async rejectApplication(applicationId: number, rejectionReason: string, notes?: string): Promise<{
    application_id: number;
    status: string;
    reviewed_at: string;
  }> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${BASE_URL}/admin/community/applications/${applicationId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejection_reason: rejectionReason,
          notes: notes || ''
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '반려 처리에 실패했습니다.');
      }
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('신청서 반려 실패:', error);
      throw error;
    }
  }

  /**
   * 첨부파일 다운로드 (슈퍼어드민 전용)
   */
  async downloadAttachment(applicationId: number, filename: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(
        `${BASE_URL}/admin/community/applications/${applicationId}/attachments/${filename}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('파일 다운로드에 실패했습니다.');
      }
      
      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 업로드 유효성 검사
   */
  validateFiles(files: File[]): { isValid: boolean; error?: string } {
    // 파일 개수 체크
    if (files.length > 5) {
      return { isValid: false, error: '최대 5개의 파일만 업로드할 수 있습니다.' };
    }

    // 허용된 확장자
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      // 파일 크기 체크
      if (file.size > maxFileSize) {
        return { isValid: false, error: `파일 크기는 10MB를 초과할 수 없습니다. (${file.name})` };
      }

      // 확장자 체크
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        return { isValid: false, error: `지원하지 않는 파일 형식입니다. (${file.name})` };
      }
    }

    return { isValid: true };
  }
}

export const communityApplicationService = new CommunityApplicationService();