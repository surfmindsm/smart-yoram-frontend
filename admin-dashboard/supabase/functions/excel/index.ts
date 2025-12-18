import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth, Authorization, X-Custom-Auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// 직분 매핑 (한글 -> 영문 코드)
const POSITION_MAPPING: Record<string, string> = {
  '목사': 'PASTOR',
  '전도사': 'EVANGELIST',
  '교육전도사': 'EDUCATION_EVANGELIST',
  '장로': 'ELDER',
  '은퇴장로': 'RETIRED_ELDER',
  '권사': 'DEACONESS',
  '은퇴권사': 'RETIRED_DEACONESS',
  '집사': 'DEACON',
  '안수집사': 'ORDAINED_DEACON',
  '교사': 'TEACHER',
  '부장': 'DIRECTOR',
  '회장': 'PRESIDENT',
  '성도': 'MEMBER',
  '교역자': 'CLERGY',
};

// 역방향 매핑 (영문 -> 한글)
const POSITION_REVERSE_MAPPING: Record<string, string> = Object.entries(POSITION_MAPPING)
  .reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});

// 퍼지 매칭 함수 (Levenshtein distance 사용)
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// 퍼지 매칭으로 가장 유사한 값 찾기
function findBestMatch(input: string, validValues: string[]): { match: string | null, confidence: number } {
  if (!input || !input.trim()) {
    return { match: null, confidence: 0 };
  }

  const inputClean = input.trim().toLowerCase();

  // 정확히 일치하는 경우
  for (const value of validValues) {
    if (value.toLowerCase() === inputClean) {
      return { match: value, confidence: 1.0 };
    }
  }

  // 부분 일치 확인
  for (const value of validValues) {
    if (value.toLowerCase().includes(inputClean) || inputClean.includes(value.toLowerCase())) {
      return { match: value, confidence: 0.8 };
    }
  }

  // Levenshtein distance로 유사도 계산
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const value of validValues) {
    const distance = levenshteinDistance(inputClean, value.toLowerCase());
    const maxLen = Math.max(inputClean.length, value.length);
    const similarity = 1 - (distance / maxLen);

    if (similarity > 0.6 && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = value;
    }
  }

  if (bestMatch) {
    const maxLen = Math.max(inputClean.length, bestMatch.length);
    const confidence = 1 - (bestDistance / maxLen);
    return { match: bestMatch, confidence };
  }

  return { match: null, confidence: 0 };
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

        const { data: user, error } = await supabaseClient
          .from('users')
          .select('id, church_id, email, is_active')
          .eq('id', userId)
          .eq('is_active', true)
          .single();

        if (error || !user) {
          console.error('❌ 사용자 조회 실패:', error);
          return null;
        }

        console.log('✅ 토큰 검증 성공, 사용자 정보:', user);
        return {
          user_id: user.id,
          church_id: user.church_id,
          email: user.email
        };
      }
    }

    return null;
  } catch (error) {
    console.error('❌ 토큰 검증 실패:', error);
    return null;
  }
}

serve(async (req) => {
  console.log('📊 [Excel Function] 요청 받음:', {
    method: req.method,
    url: req.url,
  });

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth, Authorization, X-Custom-Auth, Content-Type',
      }
    })
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');

    // 템플릿 다운로드 (인증 불필요)
    if (pathParts.includes('members') && pathParts.includes('template') && req.method === 'GET') {
      console.log('📊 [템플릿 다운로드] 시작');

      const templateContent = [
        '이름*,영문명,이메일,전화번호*,성별,생년월일,직분,조직,부서,임명일,안수교회,결혼상태,배우자이름,결혼일,우편번호,주소,지역1,지역2,지역3,교인구분,입교일,소구역,나이그룹,신급,마지막연락일,직업분류,구체적업무,직책직위,직업명,직장명,직장전화번호,사역시작일,이웃교회,직분결정,인도자ID,일상활동,자유필드1,자유필드2,자유필드3,자유필드4,자유필드5,자유필드6,자유필드7,자유필드8,자유필드9,자유필드10,자유필드11,자유필드12,특별사항',
        '홍길동,Hong Gil Dong,hong@example.com,010-1234-5678,남,1990-01-15,장로,청년부,청년1부,2020-01-01,서울중앙교회,기혼,김영희,2015-05-20,06234,서울시 강남구 테헤란로 123,서울시,강남구,역삼동,정교인,2010-06-01,1구역,청년,A급,2024-12-01,사무직,소프트웨어 개발,팀장,회사원,삼성전자,02-2255-0114,2018-01-01,은혜교회,장로 추천,,새벽기도 참석,특기사항1,,,,,,,,,,,,건강상 주의사항 없음',
        '김영희,Kim Young Hee,kim@example.com,010-9876-5432,여,1985-05-20,집사,여전도회,여전도1부,2019-03-15,부산온누리교회,기혼,홍길동,2015-05-20,06235,서울시 서초구 서초대로 456,서울시,서초구,서초동,정교인,2008-03-10,2구역,성인,B급,2024-11-28,교육직,초등학교 교사,교사,교사,서울초등학교,02-3456-7890,2017-06-01,사랑교회,집사 임명,,구역모임 리더,,,,,,,,,,,,알레르기: 새우'
      ].join('\n');

      return new Response(templateContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="member_upload_template.csv"'
        }
      });
    }

    // 인증 필요한 엔드포인트
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 토큰 검증
    let token = '';
    const authHeader = req.headers.get('Authorization');
    const customAuthHeader = req.headers.get('X-Custom-Auth');

    if (customAuthHeader) {
      token = customAuthHeader;
    } else if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }

    const payload = await verifyToken(token, supabaseClient);
    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }

    const churchId = payload.church_id;

    // 직분/구역 목록 조회 API
    if (pathParts.includes('valid-values') && req.method === 'GET') {
      console.log('📊 [유효값 조회] 직분/구역 목록 조회');

      // 직분 목록 (한글)
      const positions = Object.keys(POSITION_MAPPING);

      // 구역 목록 조회
      const { data: organizations } = await supabaseClient
        .from('church_organizations')
        .select('name')
        .eq('church_id', churchId)
        .eq('is_active', true)
        .in('organization_type', ['district', 'sub_district']);

      const districts = organizations?.map((org: any) => org.name) || [];

      // members 테이블에서 실제 사용 중인 sub_district 값도 포함
      const { data: members } = await supabaseClient
        .from('members')
        .select('sub_district')
        .eq('church_id', churchId)
        .not('sub_district', 'is', null);

      const memberDistricts = [...new Set(members?.map((m: any) => m.sub_district).filter(Boolean))] as string[];
      const allDistricts = [...new Set([...districts, ...memberDistricts])];

      return new Response(JSON.stringify({
        positions,
        districts: allDistricts
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 엑셀 업로드 - 파싱 및 검증만
    if (pathParts.includes('members') && pathParts.includes('parse') && req.method === 'POST') {
      console.log('📊 [엑셀 파싱] 시작');

      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return new Response(
          JSON.stringify({ error: '파일이 없습니다' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
      }

      // 파일 읽기
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

      console.log('📊 파싱된 행 수:', jsonData.length);

      // 유효값 조회
      const positions = Object.keys(POSITION_MAPPING);
      const { data: organizations } = await supabaseClient
        .from('church_organizations')
        .select('name')
        .eq('church_id', churchId)
        .eq('is_active', true);
      const districts = organizations?.map((org: any) => org.name) || [];

      // 각 행 검증
      const parsedRows = jsonData.map((row: any, index: number) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const suggestions: any = {};

        // 필수 필드 검증
        if (!row['이름*'] || !row['이름*'].trim()) {
          errors.push('이름은 필수입니다');
        }
        if (!row['전화번호*'] || !row['전화번호*'].trim()) {
          errors.push('전화번호는 필수입니다');
        } else if (!/^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(row['전화번호*'])) {
          warnings.push('전화번호 형식을 확인하세요 (010-1234-5678)');
        }

        // 직분 검증 및 매칭
        if (row['직분'] && row['직분'].trim()) {
          const positionInput = row['직분'].trim();
          const match = findBestMatch(positionInput, positions);

          if (match.match) {
            if (match.confidence < 1.0) {
              warnings.push(`직분 "${positionInput}"이(가) "${match.match}"로 자동 매칭되었습니다`);
              suggestions.position = match.match;
            }
          } else {
            errors.push(`유효하지 않은 직분: ${positionInput}. 사용 가능한 값: ${positions.join(', ')}`);
          }
        }

        // 구역 검증 및 매칭
        if (row['소구역'] && row['소구역'].trim() && districts.length > 0) {
          const districtInput = row['소구역'].trim();
          const match = findBestMatch(districtInput, districts);

          if (match.match) {
            if (match.confidence < 1.0) {
              warnings.push(`구역 "${districtInput}"이(가) "${match.match}"로 자동 매칭되었습니다`);
              suggestions.sub_district = match.match;
            }
          } else {
            warnings.push(`구역 "${districtInput}"이(가) 등록된 구역 목록에 없습니다. 새로운 구역으로 등록됩니다.`);
          }
        }

        return {
          rowNumber: index + 2, // Excel 행 번호 (헤더 포함)
          data: row,
          errors,
          warnings,
          suggestions,
          isValid: errors.length === 0
        };
      });

      const validCount = parsedRows.filter(r => r.isValid).length;
      const errorCount = parsedRows.filter(r => !r.isValid).length;

      return new Response(JSON.stringify({
        success: true,
        totalRows: parsedRows.length,
        validRows: validCount,
        errorRows: errorCount,
        rows: parsedRows
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 엑셀 업로드 - 최종 저장
    if (pathParts.includes('members') && pathParts.includes('upload') && req.method === 'POST') {
      console.log('📊 [엑셀 저장] 시작');

      const body = await req.json();
      const { rows } = body;

      if (!rows || !Array.isArray(rows)) {
        return new Response(
          JSON.stringify({ error: '유효하지 않은 데이터입니다' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
      }

      let created = 0;
      let updated = 0;
      const errors: string[] = [];

      for (const rowData of rows) {
        try {
          const row = rowData.data;

          // 데이터 변환
          const memberData: any = {
            church_id: churchId,
            name: row['이름*'],
            name_eng: row['영문명'] || null,
            email: row['이메일'] || null,
            phone: row['전화번호*'],
            gender: row['성별'] || null,
            birthdate: row['생년월일'] || null,
            position: row['직분'] ? (POSITION_MAPPING[row['직분']] || 'MEMBER') : 'MEMBER',
            department: row['부서'] || null,
            appointed_on: row['임명일'] || null,
            ordination_church: row['안수교회'] || null,
            marital_status: row['결혼상태'] || null,
            spouse_name: row['배우자이름'] || null,
            married_on: row['결혼일'] || null,
            postal_code: row['우편번호'] || null,
            address: row['주소'] || null,
            region_1: row['지역1'] || null,
            region_2: row['지역2'] || null,
            region_3: row['지역3'] || null,
            member_type: row['교인구분'] || null,
            confirmation_date: row['입교일'] || null,
            sub_district: rowData.suggestions?.sub_district || row['소구역'] || null,
            age_group: row['나이그룹'] || null,
            spiritual_grade: row['신급'] || null,
            last_contact_date: row['마지막연락일'] || null,
            job_category: row['직업분류'] || null,
            job_detail: row['구체적업무'] || null,
            job_position: row['직책직위'] || null,
            job_title: row['직업명'] || null,
            workplace: row['직장명'] || null,
            workplace_phone: row['직장전화번호'] || null,
            ministry_start_date: row['사역시작일'] || null,
            neighboring_church: row['이웃교회'] || null,
            position_decision: row['직분결정'] || null,
            daily_activity: row['일상활동'] || null,
            custom_field_1: row['자유필드1'] || null,
            custom_field_2: row['자유필드2'] || null,
            custom_field_3: row['자유필드3'] || null,
            custom_field_4: row['자유필드4'] || null,
            custom_field_5: row['자유필드5'] || null,
            custom_field_6: row['자유필드6'] || null,
            custom_field_7: row['자유필드7'] || null,
            custom_field_8: row['자유필드8'] || null,
            custom_field_9: row['자유필드9'] || null,
            custom_field_10: row['자유필드10'] || null,
            custom_field_11: row['자유필드11'] || null,
            custom_field_12: row['자유필드12'] || null,
            special_notes: row['특별사항'] || null,
          };

          // 전화번호로 기존 교인 확인
          const { data: existing } = await supabaseClient
            .from('members')
            .select('id')
            .eq('church_id', churchId)
            .eq('phone', memberData.phone)
            .single();

          if (existing) {
            // 업데이트
            const { error } = await supabaseClient
              .from('members')
              .update(memberData)
              .eq('id', existing.id);

            if (error) throw error;
            updated++;
          } else {
            // 신규 생성
            const { error } = await supabaseClient
              .from('members')
              .insert(memberData);

            if (error) throw error;
            created++;
          }
        } catch (error: any) {
          errors.push(`${rowData.rowNumber}행: ${error.message}`);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: '교인 명단 업로드가 완료되었습니다',
        created,
        updated,
        errors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 교인 명단 다운로드
    if (pathParts.includes('members') && pathParts.includes('download') && req.method === 'GET') {
      console.log('📊 [엑셀 다운로드] 교인 명단 다운로드 시작');

      const { data: members, error } = await supabaseClient
        .from('members')
        .select('*')
        .eq('church_id', churchId)
        .order('name', { ascending: true });

      if (error) {
        return new Response(
          JSON.stringify({ error: '교인 데이터 조회에 실패했습니다' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
      }

      // CSV 생성
      const headers = [
        '이름', '영문명', '이메일', '전화번호', '성별', '생년월일', '직분', '조직', '부서', '임명일', '안수교회',
        '결혼상태', '배우자이름', '결혼일', '우편번호', '주소', '지역1', '지역2', '지역3',
        '교인구분', '입교일', '소구역', '나이그룹', '신급', '마지막연락일',
        '직업분류', '구체적업무', '직책직위', '직업명', '직장명', '직장전화번호',
        '사역시작일', '이웃교회', '직분결정', '인도자ID', '일상활동',
        '자유필드1', '자유필드2', '자유필드3', '자유필드4', '자유필드5', '자유필드6',
        '자유필드7', '자유필드8', '자유필드9', '자유필드10', '자유필드11', '자유필드12',
        '특별사항'
      ];

      const rows = members.map(m => [
        m.name || '',
        m.name_eng || '',
        m.email || '',
        m.phone || '',
        m.gender || '',
        m.birthdate || '',
        POSITION_REVERSE_MAPPING[m.position] || m.position || '',
        m.organization_id || '',
        m.department || '',
        m.appointed_on || '',
        m.ordination_church || '',
        m.marital_status || '',
        m.spouse_name || '',
        m.married_on || '',
        m.postal_code || '',
        m.address || '',
        m.region_1 || '',
        m.region_2 || '',
        m.region_3 || '',
        m.member_type || '',
        m.confirmation_date || '',
        m.sub_district || '',
        m.age_group || '',
        m.spiritual_grade || '',
        m.last_contact_date || '',
        m.job_category || '',
        m.job_detail || '',
        m.job_position || '',
        m.job_title || '',
        m.workplace || '',
        m.workplace_phone || '',
        m.ministry_start_date || '',
        m.neighboring_church || '',
        m.position_decision || '',
        m.inviter3_member_id || '',
        m.daily_activity || '',
        m.custom_field_1 || '',
        m.custom_field_2 || '',
        m.custom_field_3 || '',
        m.custom_field_4 || '',
        m.custom_field_5 || '',
        m.custom_field_6 || '',
        m.custom_field_7 || '',
        m.custom_field_8 || '',
        m.custom_field_9 || '',
        m.custom_field_10 || '',
        m.custom_field_11 || '',
        m.custom_field_12 || '',
        m.special_notes || '',
      ].map(field => {
        const str = String(field);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');

      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="교인명단_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // 지원하지 않는 엔드포인트
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )

  } catch (error: any) {
    console.error('❌ [Excel Function] 오류:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
})
