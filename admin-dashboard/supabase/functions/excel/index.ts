import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth, Authorization, X-Custom-Auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// 임시 토큰 검증 함수
async function verifyToken(token: string, supabaseClient: any) {
  try {
    console.log('🔍 토큰 검증 시작:', { token: token.substring(0, 20) + '...' });

    if (token.startsWith('temp_token_')) {
      const parts = token.split('_');
      console.log('🔍 토큰 파싱 결과:', { parts, partsLength: parts.length });

      if (parts.length >= 3) {
        const userId = parts[2];
        console.log('🔍 임시 토큰에서 추출된 사용자 ID:', userId);

        console.log('🔍 users 테이블 조회 시작...');
        const { data: user, error } = await supabaseClient
          .from('users')
          .select('id, church_id, email, is_active')
          .eq('id', userId)
          .eq('is_active', true)
          .single();

        console.log('🔍 users 테이블 조회 완료:', {
          user,
          error,
          hasData: !!user,
          errorMessage: error?.message,
          errorDetails: error?.details
        });

        if (error || !user) {
          console.error('❌ 사용자 조회 실패:', error);
          // 사용자가 존재하지 않을 경우를 위한 추가 조회
          console.log('🔍 is_active 조건 없이 다시 조회...');
          const { data: userAny, error: errorAny } = await supabaseClient
            .from('users')
            .select('id, church_id, email, is_active')
            .eq('id', userId)
            .single();
          console.log('🔍 모든 사용자 조회 결과:', { userAny, errorAny });
          return null;
        }

        console.log('✅ 토큰 검증 성공, 사용자 정보:', user);
        return {
          user_id: user.id,
          church_id: user.church_id,
          email: user.email
        };
      } else {
        console.error('❌ 토큰 파싱 실패: parts.length < 3');
      }
    } else {
      console.error('❌ 지원하지 않는 토큰 형식:', token.substring(0, 20));
    }

    return null;
  } catch (error) {
    console.error('❌ 토큰 검증 실패:', error);
    return null;
  }
}

// 엑셀 파일 파싱 함수 (간단한 CSV 형태로 시뮬레이션)
function parseExcelData(fileContent: string): any[] {
  // 실제 환경에서는 적절한 엑셀 파싱 라이브러리를 사용해야 합니다
  // 여기서는 CSV 형태로 간단히 처리
  const lines = fileContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const record: any = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    return record;
  });
}

// 교인 데이터 검증 함수
function validateMemberData(member: any): string[] {
  const errors: string[] = [];

  if (!member.name || member.name.trim() === '') {
    errors.push('이름은 필수입니다');
  }

  if (!member.phone || member.phone.trim() === '') {
    errors.push('전화번호는 필수입니다');
  } else if (!/^01[0-9]-[0-9]{4}-[0-9]{4}$/.test(member.phone)) {
    errors.push('전화번호 형식이 올바르지 않습니다 (010-1234-5678)');
  }

  if (member.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(member.birth_date)) {
    errors.push('생년월일 형식이 올바르지 않습니다 (YYYY-MM-DD)');
  }

  return errors;
}

serve(async (req) => {
  console.log('📊 [Excel Function] 요청 받음:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('📊 [Excel Function] OPTIONS 요청 처리');
    const preflightHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth, Authorization, X-Custom-Auth, Content-Type',
    };
    return new Response(null, {
      status: 200,
      headers: preflightHeaders
    })
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');

    console.log('📊 [Excel Function] URL 파싱:', {
      pathname: url.pathname,
      pathParts,
      method: req.method
    });

    // 템플릿 다운로드는 인증 없이 허용
    if (pathParts.includes('members') && pathParts.includes('template') && req.method === 'GET') {
      console.log('📊 [템플릿 다운로드] 템플릿 생성 시작');

      const templateContent = [
        '이름,성별,전화번호,이메일,주소,생년월일',
        '홍길동,남성,010-1234-5678,hong@example.com,서울시 강남구,1990-01-15',
        '김영희,여성,010-9876-5432,kim@example.com,서울시 서초구,1985-05-20'
      ].join('\n');

      console.log('📊 [템플릿 다운로드] 템플릿 생성 완료');

      return new Response(templateContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="member_upload_template.csv"'
        }
      });
    }

    // 다른 엔드포인트들은 일시적으로 비활성화
    console.log('📊 [Excel Function] 현재는 템플릿 다운로드만 지원');
    return new Response('Not implemented yet', {
      status: 501,
      headers: corsHeaders
    });

    /*
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 토큰 검증
    let token = '';
    const authHeader = req.headers.get('Authorization');
    const customAuthHeader = req.headers.get('X-Custom-Auth');

    console.log('🔍 받은 헤더들:', {
      authHeader: authHeader ? 'Bearer ' + authHeader.substring(7, 27) + '...' : null,
      customAuthHeader: customAuthHeader ? customAuthHeader.substring(0, 20) + '...' : null,
      allHeaders: Object.fromEntries(req.headers.entries())
    });

    // X-Custom-Auth를 우선으로 처리
    if (customAuthHeader) {
      token = customAuthHeader;
      console.log('🔑 X-Custom-Auth 헤더에서 토큰 추출');
    } else if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
      console.log('🔑 Authorization 헤더에서 토큰 추출');
    } else {
      console.error('❌ 인증 헤더 없음');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const payload = await verifyToken(token, supabaseClient);
    if (!payload) {
      console.error('❌ 토큰 검증 실패');
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const churchId = payload.church_id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');

    console.log('🔍 URL 파싱 결과:', {
      pathname: url.pathname,
      pathParts,
      method: req.method
    });

    // /excel/members/upload 엔드포인트
    if (pathParts.includes('members') && pathParts.includes('upload') && req.method === 'POST') {
      try {
        console.log('📊 [엑셀 업로드] 교인 명단 업로드 시작');

        // 파일 데이터 처리 (실제로는 multipart/form-data 파싱 필요)
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
          return new Response(
            JSON.stringify({ error: '파일이 없습니다' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // 임시로 시뮬레이션 결과 반환
        console.log('📊 [엑셀 업로드] 파일 처리 완료, 시뮬레이션 결과 반환');

        return new Response(JSON.stringify({
          message: '교인 명단 업로드가 완료되었습니다',
          created: 5,
          updated: 3,
          errors: [
            '2행: 전화번호 형식이 올바르지 않습니다',
            '5행: 이름이 비어있습니다'
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ [엑셀 업로드] 오류:', error);
        return new Response(
          JSON.stringify({ error: '업로드 처리 중 오류가 발생했습니다' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // /excel/members/download 엔드포인트
    if (pathParts.includes('members') && pathParts.includes('download') && req.method === 'GET') {
      try {
        console.log('📊 [엑셀 다운로드] 교인 명단 다운로드 시작');

        // 교인 데이터 조회
        const { data: members, error } = await supabaseClient
          .from('members')
          .select('*')
          .eq('church_id', churchId)
          .order('name', { ascending: true });

        if (error) {
          console.error('❌ 교인 데이터 조회 실패:', error);
          return new Response(
            JSON.stringify({ error: '교인 데이터 조회에 실패했습니다' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // CSV 형태로 생성 (실제로는 엑셀 파일 생성)
        const csvContent = [
          '이름,성별,전화번호,이메일,주소,생년월일,등록일',
          ...members.map(m => `${m.name},${m.gender || ''},${m.phone || ''},${m.email || ''},${m.address || ''},${m.birth_date || ''},${m.created_at || ''}`)
        ].join('\n');

        console.log('✅ [엑셀 다운로드] CSV 생성 완료, 교인 수:', members.length);

        return new Response(csvContent, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="교인명단_${new Date().toISOString().split('T')[0]}.xlsx"`
          }
        });

      } catch (error) {
        console.error('❌ [엑셀 다운로드] 오류:', error);
        return new Response(
          JSON.stringify({ error: '다운로드 처리 중 오류가 발생했습니다' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }


    // /excel/attendance/download 엔드포인트
    if (pathParts.includes('attendance') && pathParts.includes('download') && req.method === 'GET') {
      try {
        const startDate = url.searchParams.get('start_date') || '2024-01-01';
        const endDate = url.searchParams.get('end_date') || new Date().toISOString().split('T')[0];

        console.log('📊 [출석 다운로드] 출석 기록 다운로드:', { startDate, endDate });

        // 출석 데이터 조회
        const { data: attendances, error } = await supabaseClient
          .from('attendances')
          .select(`
            *,
            members (name, phone)
          `)
          .eq('members.church_id', churchId)
          .gte('attendance_date', startDate)
          .lte('attendance_date', endDate)
          .order('attendance_date', { ascending: true });

        if (error) {
          console.error('❌ 출석 데이터 조회 실패:', error);
          return new Response(
            JSON.stringify({ error: '출석 데이터 조회에 실패했습니다' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // CSV 형태로 생성
        const csvContent = [
          '날짜,이름,전화번호,출석여부,비고',
          ...attendances.map(a => `${a.attendance_date},${a.members?.name || ''},${a.members?.phone || ''},${a.is_present ? '출석' : '결석'},${a.notes || ''}`)
        ].join('\n');

        console.log('✅ [출석 다운로드] CSV 생성 완료, 기록 수:', attendances.length);

        return new Response(csvContent, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="출석기록_${startDate}_${endDate}.xlsx"`
          }
        });

      } catch (error) {
        console.error('❌ [출석 다운로드] 오류:', error);
        return new Response(
          JSON.stringify({ error: '출석 기록 다운로드 중 오류가 발생했습니다' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    */

  } catch (error) {
    console.error('❌ [Excel Function] 오류:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})