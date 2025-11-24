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
    try {
      // Supabase Edge Function URL
      const SUPABASE_URL = 'https://adzhdsajdamrflvybhxq.supabase.co';
      const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/community-applications`;

      // JSON 데이터 준비 (파일 정보 포함)
      const requestData = {
        applicant_type: data.applicant_type,
        organization_name: data.organization_name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        description: data.description,
        agree_terms: data.agree_terms,
        agree_privacy: data.agree_privacy,
        agree_marketing: data.agree_marketing,
        business_number: data.business_number || null,
        address: data.address || null,
        service_area: data.service_area || null,
        website: data.website || null,
        attachments: data.attachments || null, // 파일 정보 포함
      };

      console.log('📤 Supabase Edge Function 전송:', requestData);

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      console.log('🔍 백엔드 응답:', {
        status: response.status,
        ok: response.ok,
        result: result
      });

      if (!response.ok) {
        const errorMessage = result.error || result.message || '신청서 제출에 실패했습니다.';
        console.error('❌ Edge Function 에러 상세:', result);
        throw new Error(errorMessage);
      }

      if (result.success) {
        // 알림 이메일 발송
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/notify-application`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              type: 'community',
              applicantEmail: data.email,
              applicantName: data.contact_person,
              organizationName: data.organization_name,
              applicationId: result.data.application_id
            })
          });
          console.log('✅ 커뮤니티 가입 알림 이메일 발송 완료');
        } catch (emailError) {
          console.error('❌ 알림 이메일 발송 실패:', emailError);
          // 이메일 발송 실패해도 신청은 성공으로 처리
        }

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
      console.log('📋 [Supabase] 조회된 데이터:', data);

      // 데이터 변환
      const applications = (data || []).map((item: any) => {
        // attachments 파싱 - JSONB 타입이지만 문자열로 올 수 있음
        let attachments = [];
        try {
          if (typeof item.attachments === 'string') {
            attachments = JSON.parse(item.attachments);
          } else if (Array.isArray(item.attachments)) {
            attachments = item.attachments;
          }
        } catch (e) {
          console.warn('첨부파일 파싱 실패:', e);
          attachments = [];
        }

        return {
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
          attachments: attachments,
          status: item.status,
          submitted_at: item.submitted_at,
          reviewed_at: item.reviewed_at,
          reviewed_by: item.reviewed_by,
          rejection_reason: item.rejection_reason,
          notes: item.notes,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
      });

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
   * 신청서 승인 (Edge Function 사용)
   */
  async approveApplication(applicationId: number, notes?: string): Promise<{
    application_id: number;
    status: string;
    message?: string;
  }> {
    try {
      const SUPABASE_URL = 'https://adzhdsajdamrflvybhxq.supabase.co';
      const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/community-applications`;

      console.log('✅ [Edge Function] 신청서 승인 처리 중...', applicationId);

      const response = await fetch(edgeFunctionUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          applicationId,
          status: 'approved',
          notes
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Edge Function 승인 오류:', result);
        throw new Error(result.message || '신청서 승인 처리에 실패했습니다.');
      }

      console.log('✅ [Edge Function] 신청서 승인 완료:', result);

      return {
        application_id: applicationId,
        status: 'approved',
        message: '신청서가 승인되었습니다.'
      };

    } catch (error) {
      console.error('신청서 승인 실패:', error);
      throw error;
    }
  }

  /**
   * 신청서 반려 (Edge Function 사용)
   */
  async rejectApplication(applicationId: number, rejectionReason: string, notes?: string): Promise<{
    application_id: number;
    status: string;
    message: string;
  }> {
    try {
      const SUPABASE_URL = 'https://adzhdsajdamrflvybhxq.supabase.co';
      const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/community-applications`;

      console.log('❌ [Edge Function] 신청서 반려 처리 중...', applicationId);

      const response = await fetch(edgeFunctionUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          applicationId,
          status: 'rejected',
          rejectionReason,
          notes
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Edge Function 반려 오류:', result);
        throw new Error(result.message || '신청서 반려 처리에 실패했습니다.');
      }

      console.log('✅ [Edge Function] 신청서 반려 완료:', result);

      return {
        application_id: applicationId,
        status: 'rejected',
        message: '신청서가 반려되었습니다.'
      };

    } catch (error) {
      console.error('신청서 반려 실패:', error);
      throw error;
    }
  }

  /**
   * 첨부파일 다운로드 (Supabase Storage 사용)
   */
  async downloadAttachment(applicationId: number, filename: string): Promise<void> {
    try {
      // Supabase 클라이언트 동적 import
      const { supabase } = await import('../lib/supabase');

      console.log('📥 파일 다운로드 시작:', filename);

      // 신청서 정보를 가져와서 attachments에서 해당 파일 찾기
      const { data: application, error: fetchError } = await supabase
        .from('community_applications')
        .select('attachments')
        .eq('id', applicationId)
        .single();

      if (fetchError || !application) {
        console.error('❌ 신청서 조회 실패:', fetchError);
        throw new Error('신청서를 찾을 수 없습니다.');
      }

      // attachments 파싱
      let attachments = [];
      if (typeof application.attachments === 'string') {
        attachments = JSON.parse(application.attachments || '[]');
      } else if (Array.isArray(application.attachments)) {
        attachments = application.attachments;
      }

      // 파일 정보 찾기
      const fileInfo = attachments.find((att: any) => att.filename === filename);
      if (!fileInfo) {
        throw new Error('파일을 찾을 수 없습니다.');
      }

      console.log('📥 파일 정보:', fileInfo);

      // Supabase Storage에서 파일 다운로드
      const { data, error } = await supabase.storage
        .from('community-application-files')
        .download(fileInfo.path);

      if (error) {
        console.error('❌ Supabase Storage 다운로드 실패:', error);
        throw new Error('파일 다운로드에 실패했습니다.');
      }

      // Blob을 URL로 변환하여 다운로드
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ 파일 다운로드 완료:', filename);
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