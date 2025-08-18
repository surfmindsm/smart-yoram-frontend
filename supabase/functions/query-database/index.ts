import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueryRequest {
  question: string;
  agentType?: string;
}

// 스마트 쿼리 생성 함수
function generateSmartQuery(question: string): { query: string; description: string } {
  const lowerQuestion = question.toLowerCase();
  
  // 교인 수 관련
  if (lowerQuestion.includes('교인') && (lowerQuestion.includes('몇') || lowerQuestion.includes('수') || lowerQuestion.includes('총'))) {
    return {
      query: `
        SELECT 
          COUNT(*) as total_members,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_members,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_members
        FROM users 
        WHERE role = 'member'
      `,
      description: '전체 교인 수와 활성/비활성 상태별 통계'
    };
  }
  
  // 생일 관련
  if (lowerQuestion.includes('생일') || lowerQuestion.includes('birthday')) {
    const month = getCurrentMonth();
    return {
      query: `
        SELECT 
          name,
          phone,
          email,
          date_of_birth,
          EXTRACT(day FROM date_of_birth) as birth_day
        FROM users 
        WHERE EXTRACT(month FROM date_of_birth) = ${month}
        AND role = 'member'
        ORDER BY EXTRACT(day FROM date_of_birth)
      `,
      description: `이번 달(${month}월) 생일인 교인들`
    };
  }
  
  // 가족 관계 관련
  if (lowerQuestion.includes('가족') || lowerQuestion.includes('family')) {
    return {
      query: `
        SELECT 
          f.name as family_name,
          COUNT(fr.id) as member_count,
          STRING_AGG(u.name, ', ') as members
        FROM families f
        LEFT JOIN family_relationships fr ON f.id = fr.family_id
        LEFT JOIN users u ON fr.user_id = u.id
        GROUP BY f.id, f.name
        ORDER BY member_count DESC
      `,
      description: '가족별 구성원 현황'
    };
  }
  
  // 기본 교인 조회
  return {
    query: `
      SELECT 
        name,
        phone,
        email,
        status,
        role,
        created_at
      FROM users 
      WHERE role = 'member'
      ORDER BY created_at DESC
      LIMIT 20
    `,
    description: '최근 등록된 교인 목록'
  };
}

function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { question, agentType }: QueryRequest = await req.json()
    
    console.log('🔍 스마트 쿼리 요청:', { question, agentType });
    
    // 스마트 쿼리 생성
    const queryInfo = generateSmartQuery(question);
    console.log('📝 생성된 쿼리:', queryInfo);
    
    // 데이터베이스 쿼리 실행
    const { data, error } = await supabaseClient.rpc('execute_sql', {
      sql_query: queryInfo.query
    });
    
    if (error) {
      console.error('❌ DB 쿼리 실패:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          query_info: queryInfo
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('✅ DB 쿼리 성공:', data?.length || 0, '개 결과');

    return new Response(
      JSON.stringify({
        success: true,
        data: data,
        query_info: queryInfo,
        metadata: {
          question,
          agentType,
          timestamp: new Date().toISOString(),
          result_count: Array.isArray(data) ? data.length : 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Edge Function 오류:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
