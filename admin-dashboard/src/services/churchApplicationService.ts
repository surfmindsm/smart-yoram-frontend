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
  business_no?: string;
  website?: string;
  homepage_url?: string;
  youtube_channel?: string;
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
  business_no?: string;
  website?: string;
  homepage_url?: string;
  youtube_channel?: string;
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
    try {
      // Supabase Edge Function URL
      const SUPABASE_URL = 'https://adzhdsajdamrflvybhxq.supabase.co';
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/church-applications`;

      // JSON 데이터 준비 (파일 제외)
      const requestData = {
        church_name: data.church_name,
        pastor_name: data.pastor_name,
        admin_name: data.admin_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        description: data.description,
        agree_terms: data.agree_terms,
        agree_privacy: data.agree_privacy,
        agree_marketing: data.agree_marketing,
        business_no: data.business_no || null,
        website: data.website || null,
        homepage_url: data.homepage_url || null,
        youtube_channel: data.youtube_channel || null,
        established_year: data.established_year || null,
        denomination: data.denomination || null,
        member_count: data.member_count || null,
      };

      console.log('📤 Supabase Edge Function 전송:', requestData);

      // Supabase anon key 추가
      const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';

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
      const applications = (data || []).map((item: any) => {
        // attachments 필드 안전하게 처리
        let attachments = [];
        if (item.attachments) {
          if (typeof item.attachments === 'string') {
            try {
              attachments = JSON.parse(item.attachments);
            } catch (e) {
              console.warn('Failed to parse attachments:', item.attachments);
              attachments = [];
            }
          } else if (Array.isArray(item.attachments)) {
            attachments = item.attachments;
          }
        }

        return {
          id: item.id,
          church_name: item.church_name,
          pastor_name: item.pastor_name,
          admin_name: item.admin_name,
          email: item.email,
          phone: item.phone,
          address: item.address,
          description: item.description,
          business_no: item.business_no,
          website: item.website,
          homepage_url: item.homepage_url,
          youtube_channel: item.youtube_channel,
          established_year: item.established_year,
          denomination: item.denomination,
          member_count: item.member_count,
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
   * 신청서 승인 (Edge Function 사용)
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

      console.log('✅ [Edge Function] 교회 신청서 승인 처리 중...', applicationId);

      // Edge Function을 통해 Service Role Key로 업데이트 수행
      const SUPABASE_URL = 'https://adzhdsajdamrflvybhxq.supabase.co';
      const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/church-applications`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            applicationId,
            status: 'approved'
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ 상태 업데이트 실패:', result);
        throw new Error(result.message || '상태 업데이트에 실패했습니다.');
      }

      const data = result.data;

      console.log('✅ [Edge Function] 교회 신청서 승인 완료:', data?.id);

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

      // 현재 최대 serial_id 조회 (중복 키 오류 방지)
      const { data: maxSerialData, error: maxSerialError } = await supabase
        .from('churches')
        .select('serial_id')
        .order('serial_id', { ascending: false })
        .limit(1);

      if (maxSerialError) {
        console.error('❌ 최대 serial_id 조회 오류:', maxSerialError);
      }

      const nextSerialId = maxSerialData && maxSerialData.length > 0
        ? maxSerialData[0].serial_id + 1
        : 1;

      console.log('📝 다음 serial_id:', nextSerialId);

      // 교회 정보 생성
      const churchInsertData: any = {
        serial_id: nextSerialId,
        name: data.church_name,
        pastor_name: data.pastor_name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        is_active: true
      };

      // 선택 필드 추가
      if (data.business_no) churchInsertData.business_no = data.business_no;
      if (data.homepage_url) churchInsertData.homepage_url = data.homepage_url;
      if (data.youtube_channel) churchInsertData.youtube_channel = data.youtube_channel;

      const { data: churchData, error: churchError } = await supabase
        .from('churches')
        .insert(churchInsertData)
        .select()
        .single();

      if (churchError) {
        console.error('❌ 교회 생성 오류:', churchError);
        throw new Error('교회 정보 생성에 실패했습니다.');
      }

      console.log('✅ 새로운 교회 생성 완료:', churchData.id, data.church_name);

      // 이메일로 기존 사용자 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', data.email)
        .single();

      let userId: number;

      if (existingUser) {
        console.log('⚠️ 이미 존재하는 사용자:', existingUser.email);
        userId = existingUser.id;

        // 기존 사용자의 church_id를 업데이트
        const { error: updateError } = await supabase
          .from('users')
          .update({
            church_id: churchData.id,
            role: 'church_admin',
            is_active: true
          })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ 사용자 정보 업데이트 오류:', updateError);
        } else {
          console.log('✅ 기존 사용자 정보 업데이트 완료');
        }
      } else {
        // 기존 최대 ID 조회해서 다음 ID 생성
        const { data: maxIdData } = await supabase
          .from('users')
          .select('id')
          .order('id', { ascending: false })
          .limit(1);

        const maxId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id : 0;
        userId = maxId + 1;

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
      }

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
        reviewed_at: data.reviewed_at,
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
   * 신청서 반려 (Edge Function 사용)
   */
  async rejectApplication(applicationId: number, rejectionReason: string, notes?: string): Promise<{
    application_id: number;
    status: string;
    reviewed_at: string;
  }> {
    try {
      console.log('❌ [Edge Function] 교회 신청서 반려 처리 중...', applicationId);

      // Edge Function을 통해 Service Role Key로 업데이트 수행
      const SUPABASE_URL = 'https://adzhdsajdamrflvybhxq.supabase.co';
      const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/church-applications`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            applicationId,
            status: 'rejected'
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ 상태 업데이트 실패:', result);
        throw new Error(result.message || '상태 업데이트에 실패했습니다.');
      }

      const data = result.data;

      console.log('✅ [Edge Function] 교회 신청서 반려 완료:', data?.id);

      return {
        application_id: applicationId,
        status: 'rejected',
        reviewed_at: data.reviewed_at
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
