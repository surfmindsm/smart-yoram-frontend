import { authService } from './api';

// API Base URL from guide
const BASE_URL = 'https://api.surfmind-team.com/api/v1';

export interface ChurchApplicationRequest {
  // 필수 필드
  church_name: string;
  pastor_name: string;
  admin_name: string;
  email: string;
  phone: string;
  address: string;
  description: string;

  // 약관 동의
  agree_terms: boolean;
  agree_privacy: boolean;
  agree_marketing: boolean;

  // 선택 필드
  website?: string;
  established_year?: number;
  denomination?: string;
  member_count?: number;
  attachments?: File[];
}

export interface ChurchApplication {
  id: number;
  church_name: string;
  pastor_name: string;
  admin_name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  website?: string;
  established_year?: number;
  denomination?: string;
  member_count?: number;
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
  applications: ChurchApplication[];
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
  search?: string;
  sort_by?: 'submitted_at' | 'reviewed_at' | 'church_name';
  sort_order?: 'asc' | 'desc';
}

class ChurchApplicationService {
  /**
   * 교회 가입 신청서 제출 (공개 API)
   */
  async submitApplication(data: ChurchApplicationRequest): Promise<{ application_id: number; status: string; submitted_at: string }> {
    const formData = new FormData();

    // 필수 필드 추가
    formData.append('church_name', data.church_name);
    formData.append('pastor_name', data.pastor_name);
    formData.append('admin_name', data.admin_name);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('address', data.address);
    formData.append('description', data.description);

    // 약관 동의 필드
    formData.append('agree_terms', data.agree_terms.toString());
    formData.append('agree_privacy', data.agree_privacy.toString());
    formData.append('agree_marketing', data.agree_marketing.toString());

    // 선택 필드 추가 (값이 있을 때만)
    if (data.website) {
      formData.append('website', data.website);
    }
    if (data.established_year) {
      formData.append('established_year', data.established_year.toString());
    }
    if (data.denomination) {
      formData.append('denomination', data.denomination);
    }
    if (data.member_count) {
      formData.append('member_count', data.member_count.toString());
    }

    // 파일 첨부 (multiple files)
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    try {
      const response = await fetch(`${BASE_URL}/church/applications`, {
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

      console.log('📋 [Supabase] 교회 신청서 목록 조회 중...', params);

      // 베이스 쿼리 시작
      let query = supabase
        .from('church_applications')
        .select('*', { count: 'exact' });

      // 필터링 적용
      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      if (params.search) {
        query = query.or(`church_name.ilike.%${params.search}%,pastor_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }

      // 정렬 적용
      const sortBy = params.sort_by || 'submitted_at';
      const sortOrder = params.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // 페이지네이션 적용
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Supabase 교회 신청서 목록 조회 오류:', error);
        throw new Error('신청서 목록을 불러오는데 실패했습니다.');
      }

      console.log('✅ [Supabase] 교회 신청서 목록 조회 완료:', data?.length || 0, '건');

      // 데이터 변환
      const applications = (data || []).map((item: any) => ({
        id: item.id,
        church_name: item.church_name,
        pastor_name: item.pastor_name,
        admin_name: item.admin_name,
        email: item.email,
        phone: item.phone,
        address: item.address,
        description: item.description,
        website: item.website,
        established_year: item.established_year,
        denomination: item.denomination,
        member_count: item.member_count,
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
        .from('church_applications')
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
      console.error('교회 신청서 목록 조회 실패:', error);
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

      console.log('✅ [Supabase] 교회 신청서 승인 처리 중...', applicationId);

      const reviewedAt = new Date().toISOString();

      const { data, error } = await supabase
        .from('church_applications')
        .update({
          status: 'approved',
          reviewed_at: reviewedAt,
          reviewed_by: 1,
          notes: notes || null
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase 교회 신청서 승인 오류:', error);
        throw new Error('신청서 승인 처리에 실패했습니다.');
      }

      console.log('✅ [Supabase] 교회 신청서 승인 완료:', data?.id);

      // 랜덤 임시 비밀번호 생성
      const generateTempPassword = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };

      const temporaryPassword = generateTempPassword();

      // 교회 정보 생성
      const { data: churchData, error: churchError } = await supabase
        .from('churches')
        .insert({
          name: data.church_name,
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

      console.log('✅ 새로운 교회 생성 완료:', churchData.id, data.church_name);

      // 기존 최대 ID 조회해서 다음 ID 생성
      const { data: maxIdData } = await supabase
        .from('users')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      const maxId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id : 0;
      const userId = maxId + 1;

      // users 테이블에 교회 관리자 계정 추가
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: data.email,
          email: data.email,
          full_name: data.pastor_name,
          church_id: churchData.id,
          role: 'church_admin',
          hashed_password: temporaryPassword,
          is_active: true
        });

      if (userError) {
        console.error('❌ users 테이블 삽입 오류:', userError);
        throw new Error('사용자 계정 생성에 실패했습니다.');
      }

      console.log('✅ [Supabase] users 테이블 데이터 추가 완료, 사용자 ID:', userId);

      // 임시 비밀번호 이메일 발송
      try {
        const { supabaseApiService } = await import('./supabaseApiService');
        await supabaseApiService.sendTempPassword.send(
          data.email,
          temporaryPassword,
          data.pastor_name,
          data.church_name
        );
        console.log('✅ 임시 비밀번호 이메일 발송 완료');
      } catch (emailError) {
        console.error('❌ 임시 비밀번호 이메일 발송 실패:', emailError);
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
      console.error('교회 신청서 승인 실패:', error);
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
      const { supabase } = await import('../lib/supabase');

      console.log('❌ [Supabase] 교회 신청서 반려 처리 중...', applicationId);

      const reviewedAt = new Date().toISOString();

      const { data, error } = await supabase
        .from('church_applications')
        .update({
          status: 'rejected',
          reviewed_at: reviewedAt,
          reviewed_by: 1,
          rejection_reason: rejectionReason,
          notes: notes || null
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase 교회 신청서 반려 오류:', error);
        throw new Error('신청서 반려 처리에 실패했습니다.');
      }

      console.log('✅ [Supabase] 교회 신청서 반려 완료:', data?.id);

      return {
        application_id: applicationId,
        status: 'rejected',
        reviewed_at: reviewedAt
      };

    } catch (error) {
      console.error('교회 신청서 반려 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 업로드 유효성 검사
   */
  validateFiles(files: File[]): { isValid: boolean; error?: string } {
    if (files.length > 5) {
      return { isValid: false, error: '최대 5개의 파일만 업로드할 수 있습니다.' };
    }

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (file.size > maxFileSize) {
        return { isValid: false, error: `파일 크기는 5MB를 초과할 수 없습니다. (${file.name})` };
      }

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        return { isValid: false, error: `지원하지 않는 파일 형식입니다. (${file.name})` };
      }
    }

    return { isValid: true };
  }
}

export const churchApplicationService = new ChurchApplicationService();
