import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// CORS 헤더 설정
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({
        error: '이메일 주소가 필요합니다.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // 인증 코드 생성 (6자리)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Supabase 클라이언트 생성
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SERVICE_ROLE_KEY') ?? '');
    // 이전에 저장된 코드가 있다면 삭제
    await supabaseClient.from('verification_codes').delete().eq('email', email);
    // 새 인증 코드를 데이터베이스에 저장 (15분 유효)
    await supabaseClient.from('verification_codes').insert({
      email,
      code,
      expires_at: new Date(Date.now() + 15 * 60000).toISOString()
    });
    // Resend API를 사용하여 이메일 전송
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        throw new Error('Resend API 키가 설정되지 않았습니다');
      }
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'noreply@our-check.com',
          to: email,
          subject: '인증 코드 안내',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
              <h2 style="color: #333;">인증 코드 안내</h2>
              <p style="font-size: 16px; color: #555;">안녕하세요,</p>
              <p style="font-size: 16px; color: #555;">회원님의 인증 코드는 다음과 같습니다:</p>
              <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                <h1 style="margin: 0; color: #333; letter-spacing: 5px;">${code}</h1>
              </div>
              <p style="font-size: 14px; color: #777;">이 코드는 3분 동안만 유효합니다.</p>
              <p style="font-size: 14px; color: #777;">감사합니다.</p>
            </div>
          `
        })
      });
      const responseData = await response.json();
      if (!response.ok) {
        console.error('Resend API 응답:', responseData);
        throw new Error(`Resend API 오류: ${JSON.stringify(responseData)}`);
      }
      console.log(`인증 코드 ${code}가 ${email}에 성공적으로 전송되었습니다`);
      return new Response(JSON.stringify({
        success: true,
        message: '인증 코드가 이메일로 전송되었습니다.'
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } catch (emailError) {
      console.error('이메일 전송 오류:', emailError.message);
      // 이메일 전송 실패 시에도 코드는 저장되었으므로 테스트를 위해 코드 포함
      return new Response(JSON.stringify({
        success: true,
        message: '인증 코드가 생성되었습니다만, 이메일 전송에 실패했습니다: ' + emailError.message,
        code: code // 테스트용 코드 (실제 운영 시 제거)
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
