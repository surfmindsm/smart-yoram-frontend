import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  console.log('🧪 [Excel Test] 요청 받음:', {
    method: req.method,
    url: req.url,
  });

  // CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('🧪 [Excel Test] OPTIONS 요청 처리');
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    const url = new URL(req.url);
    console.log('🧪 [Excel Test] URL 파싱:', url.pathname);

    // 템플릿 다운로드 테스트
    if (url.pathname.includes('template')) {
      console.log('🧪 [Excel Test] 템플릿 생성 중...');

      const templateContent = [
        '이름,성별,전화번호,이메일,주소,생년월일',
        '홍길동,남성,010-1234-5678,hong@example.com,서울시 강남구,1990-01-15',
        '김영희,여성,010-9876-5432,kim@example.com,서울시 서초구,1985-05-20'
      ].join('\n');

      console.log('🧪 [Excel Test] 템플릿 생성 완료');

      return new Response(templateContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="template.csv"'
        }
      });
    }

    console.log('🧪 [Excel Test] 알 수 없는 경로:', url.pathname);
    return new Response('Not found', {
      status: 404,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('🧪 [Excel Test] 오류:', error);
    return new Response('Internal error', {
      status: 500,
      headers: corsHeaders
    });
  }
})