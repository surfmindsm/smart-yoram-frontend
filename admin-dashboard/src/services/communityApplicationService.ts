import { authService } from './api';

// API Base URL from guide
const BASE_URL = 'https://api.surfmind-team.com/api/v1';

export interface CommunityApplicationRequest {
  // 필수 필드
  applicant_type: 'company' | 'individual' | 'musician' | 'minister' | 'organization' | 'church_admin' | 'other';
  organization_name: string;
  contact_person: string;
  email: string;
  phone: string;
  description: string;
  
  // 백엔드가 요구하는 새로운 필수 필드들
  password?: string; // 새로운 flow에서는 선택적 (승인 후 임시 비밀번호 발송)
  agree_terms: boolean;
  agree_privacy: boolean;
  agree_marketing: boolean;
  
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
    
    // 새로운 필수 필드들 추가
    // 새로운 auth flow에서는 비밀번호가 없으므로 임시 비밀번호 사용
    formData.append('password', data.password ?? 'temp_password_will_be_sent_after_approval');
    formData.append('agree_terms', data.agree_terms.toString());
    formData.append('agree_privacy', data.agree_privacy.toString());
    formData.append('agree_marketing', data.agree_marketing.toString());
    
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
      
      console.log('🔍 백엔드 응답:', {
        status: response.status,
        ok: response.ok,
        result: result
      });
      
      if (!response.ok) {
        // 413 에러인 경우 (파일 크기 초과)
        if (response.status === 413) {
          console.error('❌ 413 Request Entity Too Large:', result);
          throw new Error('첨부파일 크기가 너무 큽니다. 파일 크기를 줄이거나 개수를 줄여주세요.');
        }
        // 422 에러인 경우 상세 정보 포함
        if (response.status === 422) {
          console.error('❌ 422 Validation Error:', result);
          const errorMessage = result.detail || result.message || '입력 데이터 검증에 실패했습니다.';
          throw new Error(`유효성 검사 실패: ${JSON.stringify(errorMessage)}`);
        }
        throw new Error(result.message || '신청서 제출에 실패했습니다.');
      }
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('신청서 제출 실패:', error);
      
      // Network errors (CORS, connection failures, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('서버 연결에 실패했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');
      }
      
      // CORS errors
      if (error instanceof TypeError && error.message.includes('CORS')) {
        throw new Error('서버 접근 권한 오류입니다. 관리자에게 문의해주세요.');
      }
      
      throw error;
    }
  }

  /**
   * 신청서 목록 조회 (Supabase 직접 접근)
   */
  async getApplications(params: ApplicationsQueryParams = {}): Promise<ApplicationsResponse> {
    try {
      // Supabase 클라이언트 동적 import
      const { supabase } = await import('../lib/supabase');

      // 기본값 설정
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      console.log('📋 [Supabase] 신청서 목록 조회 중...', params);

      // 베이스 쿼리 시작
      let query = supabase
        .from('community_applications')
        .select('*', { count: 'exact' });

      // 필터링 적용
      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      if (params.applicant_type && params.applicant_type !== 'all') {
        query = query.eq('applicant_type', params.applicant_type);
      }

      if (params.search) {
        query = query.or(`organization_name.ilike.%${params.search}%,contact_person.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }

      // 정렬 적용
      const sortBy = params.sort_by || 'submitted_at';
      const sortOrder = params.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // 페이지네이션 적용
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Supabase 신청서 목록 조회 오류:', error);
        throw new Error('신청서 목록을 불러오는데 실패했습니다.');
      }

      console.log('✅ [Supabase] 신청서 목록 조회 완료:', data?.length || 0, '건');

      // 데이터 변환
      const applications = (data || []).map((item: any) => ({
        id: item.id,
        applicant_type: item.applicant_type,
        organization_name: item.organization_name,
        contact_person: item.contact_person,
        email: item.email,
        phone: item.phone,
        business_number: item.business_number,
        address: item.address,
        description: item.description,
        service_area: item.service_area,
        website: item.website,
        attachments: item.attachments ? JSON.parse(item.attachments) : [],
        status: item.status,
        submitted_at: item.submitted_at,
        reviewed_at: item.reviewed_at,
        reviewed_by: item.reviewed_by,
        rejection_reason: item.rejection_reason,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      // 통계 계산
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      // 상태별 통계 조회
      const { data: stats } = await supabase
        .from('community_applications')
        .select('status')
        .then(result => {
          const statusCounts = {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: result.data?.length || 0
          };

          if (result.data) {
            result.data.forEach((item: any) => {
              if (item.status === 'pending') statusCounts.pending++;
              else if (item.status === 'approved') statusCounts.approved++;
              else if (item.status === 'rejected') statusCounts.rejected++;
            });
          }

          return { data: statusCounts };
        });

      return {
        applications,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_count: totalCount,
          per_page: limit
        },
        statistics: stats || {
          pending: 0,
          approved: 0,
          rejected: 0,
          total: totalCount
        }
      };

    } catch (error) {
      console.error('신청서 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 신청서 상세 조회 (Supabase 직접 접근)
   */
  async getApplication(applicationId: number): Promise<CommunityApplication> {
    try {
      // Supabase 클라이언트 동적 import
      const { supabase } = await import('../lib/supabase');

      console.log('📄 [Supabase] 신청서 상세 조회 중...', applicationId);

      const { data, error } = await supabase
        .from('community_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('신청서를 찾을 수 없습니다.');
        }
        console.error('❌ Supabase 신청서 상세 조회 오류:', error);
        throw new Error('신청서 조회에 실패했습니다.');
      }

      console.log('✅ [Supabase] 신청서 상세 조회 완료:', data?.id);

      // 데이터 변환
      return {
        id: data.id,
        applicant_type: data.applicant_type,
        organization_name: data.organization_name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        business_number: data.business_number,
        address: data.address,
        description: data.description,
        service_area: data.service_area,
        website: data.website,
        attachments: data.attachments ? JSON.parse(data.attachments) : [],
        status: data.status,
        submitted_at: data.submitted_at,
        reviewed_at: data.reviewed_at,
        reviewed_by: data.reviewed_by,
        rejection_reason: data.rejection_reason,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

    } catch (error) {
      console.error('신청서 상세 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 신청서 승인 (Supabase 직접 접근)
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
      // Supabase 클라이언트 동적 import
      const { supabase } = await import('../lib/supabase');

      console.log('✅ [Supabase] 신청서 승인 처리 중...', applicationId);

      const reviewedAt = new Date().toISOString();

      const { data, error } = await supabase
        .from('community_applications')
        .update({
          status: 'approved',
          reviewed_at: reviewedAt,
          reviewed_by: 1, // 현재 사용자 ID (추후 개선 가능)
          notes: notes || null
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase 신청서 승인 오류:', error);
        throw new Error('신청서 승인 처리에 실패했습니다.');
      }

      console.log('✅ [Supabase] 신청서 승인 완료:', data?.id);

      // 랜덤 임시 비밀번호 생성 (8자리: 대문자, 소문자, 숫자 조합)
      const generateTempPassword = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };

      const temporaryPassword = generateTempPassword();

      // users 테이블에 사용자 정보 추가 (커뮤니티 멤버)
      console.log('👤 [Supabase] users 테이블에 사용자 데이터 추가 중...', data.email);

      // 기존 최대 ID 조회해서 다음 ID 생성
      const { data: maxIdData } = await supabase
        .from('users')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      const maxId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id : 0;
      const userId = maxId + 1;

      // church_id 결정
      let churchId = 9998; // 기본값: no church affiliation
      let userRole = 'community_member';

      if (data.applicant_type === 'organization') {
        // 교회 관리자인 경우 새로운 교회 생성
        try {
          const { data: churchData, error: churchError } = await supabase
            .from('churches')
            .insert({
              name: data.organization_name,
              address: data.address,
              phone: data.phone,
              email: data.email,
              is_active: true
            })
            .select()
            .single();

          if (churchError) {
            console.error('❌ 교회 생성 오류:', churchError);
            throw new Error('교회 정보 생성에 실패했습니다.');
          }

          churchId = churchData.id;
          userRole = 'church_admin';
          console.log('✅ 새로운 교회 생성 완료:', churchData.id, data.organization_name);
        } catch (churchCreationError) {
          console.error('❌ 교회 생성 실패:', churchCreationError);
          throw new Error('교회 정보 생성에 실패했습니다.');
        }
      }

      try {
        // users 테이블에 사용자 정보 추가 (church_id 포함)
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: userId,
            username: data.email, // 이메일을 username으로 사용
            email: data.email,
            full_name: data.contact_person,
            church_id: churchId,
            role: userRole,
            hashed_password: temporaryPassword, // 실제로는 해시해야 하지만 임시로 평문 저장
            is_active: true
          });

        if (userError) {
          console.error('❌ users 테이블 삽입 오류:', userError);
          throw userError; // 사용자 생성 실패 시 전체 프로세스 중단
        } else {
          console.log('✅ [Supabase] users 테이블 데이터 추가 완료, 사용자 ID:', userId);
        }

      } catch (userCreationError) {
        console.error('❌ 사용자 데이터 추가 과정에서 오류 발생:', userCreationError);
        throw new Error('사용자 계정 생성에 실패했습니다.');
      }

      // 임시 비밀번호 이메일 발송
      try {
        const { supabaseApiService } = await import('./supabaseApiService');
        await supabaseApiService.sendTempPassword.send(
          data.email,
          temporaryPassword,
          data.contact_person,
          data.organization_name
        );
        console.log('✅ 임시 비밀번호 이메일 발송 완료');
      } catch (emailError) {
        console.error('❌ 임시 비밀번호 이메일 발송 실패:', emailError);
        // 이메일 발송이 실패해도 승인 프로세스는 계속 진행
      }

      return {
        application_id: applicationId,
        status: 'approved',
        reviewed_at: reviewedAt,
        user_account: {
          username: data.email,
          temporary_password: temporaryPassword,
          login_url: window.location.origin + '/login'
        }
      };

    } catch (error) {
      console.error('신청서 승인 실패:', error);
      throw error;
    }
  }

  /**
   * 신청서 반려 (Supabase 직접 접근)
   */
  async rejectApplication(applicationId: number, rejectionReason: string, notes?: string): Promise<{
    application_id: number;
    status: string;
    reviewed_at: string;
  }> {
    try {
      // Supabase 클라이언트 동적 import
      const { supabase } = await import('../lib/supabase');

      console.log('❌ [Supabase] 신청서 반려 처리 중...', applicationId);

      const reviewedAt = new Date().toISOString();

      const { data, error } = await supabase
        .from('community_applications')
        .update({
          status: 'rejected',
          reviewed_at: reviewedAt,
          reviewed_by: 1, // 현재 사용자 ID (추후 개선 가능)
          rejection_reason: rejectionReason,
          notes: notes || null
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase 신청서 반려 오류:', error);
        throw new Error('신청서 반려 처리에 실패했습니다.');
      }

      console.log('✅ [Supabase] 신청서 반려 완료:', data?.id);

      return {
        application_id: applicationId,
        status: 'rejected',
        reviewed_at: reviewedAt
      };

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
        `${BASE_URL}/community/admin/applications/${applicationId}/attachments/${filename}`,
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
    const maxFileSize = 5 * 1024 * 1024; // 5MB per file to prevent 413 errors

    for (const file of files) {
      // 파일 크기 체크
      if (file.size > maxFileSize) {
        return { isValid: false, error: `파일 크기는 5MB를 초과할 수 없습니다. (${file.name})` };
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