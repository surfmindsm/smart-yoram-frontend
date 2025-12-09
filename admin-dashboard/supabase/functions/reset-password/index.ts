// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// CORS 헤더 설정
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// 임시 비밀번호 생성 함수 (8자리 영숫자)
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

Deno.serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const requestBody = await req.json();
    const { email, phone } = requestBody;

    if (!email || !phone) {
      return new Response(JSON.stringify({
        error: '이메일과 전화번호가 필요합니다.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Supabase 클라이언트 생성
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. 사용자 정보 조회 (이메일 + 전화번호 일치 확인)
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, name, phone')
      .eq('email', email)
      .eq('phone', phone)
      .single();

    if (userError || !userData) {
      console.error('❌ 사용자 조회 실패:', userError);
      return new Response(JSON.stringify({
        error: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    console.log(`✅ 사용자 확인: ${userData.email} (ID: ${userData.id})`);

    // 2. 임시 비밀번호 생성
    const temporaryPassword = generateTemporaryPassword();
    console.log(`🔑 임시 비밀번호 생성: ${temporaryPassword}`);

    // 3. 비밀번호 해시 생성
    const hashedPassword = await bcrypt.hash(temporaryPassword);
    console.log('🔒 비밀번호 해시 생성 완료');

    // 4. 사용자 테이블 업데이트 (비밀번호 + is_first_login)
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        password_hash: hashedPassword,
        is_first_login: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('❌ 비밀번호 업데이트 실패:', updateError);
      return new Response(JSON.stringify({
        error: '비밀번호 재설정 중 오류가 발생했습니다.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    console.log('✅ 비밀번호 및 is_first_login 업데이트 완료');

    // 5. 이메일로 임시 비밀번호 발송
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        throw new Error('Resend API 키가 설정되지 않았습니다');
      }

      console.log(`📧 임시 비밀번호 이메일 발송 시작: ${email}`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'noreply@churchround.com',
          to: email,
          subject: 'Church Round 임시 비밀번호 발급',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #333; text-align: center;">Church Round 임시 비밀번호</h2>
              <p style="font-size: 16px; color: #555;">안녕하세요, ${userData.name || '사용자'}님</p>
              <p style="font-size: 16px; color: #555;">요청하신 임시 비밀번호는 다음과 같습니다:</p>
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <h1 style="margin: 0; color: #007bff; letter-spacing: 3px; font-size: 28px; font-family: monospace;">${temporaryPassword}</h1>
              </div>
              <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>⚠️ 보안을 위해 로그인 후 반드시 비밀번호를 변경해주세요.</strong>
                </p>
              </div>
              <p style="font-size: 14px; color: #777;">로그인 시 자동으로 비밀번호 변경 화면이 표시됩니다.</p>
              <p style="font-size: 14px; color: #777;">본인이 요청하지 않았다면 즉시 관리자에게 문의하세요.</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999; text-align: center;">Church Round 커뮤니티</p>
            </div>
          `
        })
      });

      const responseData = await response.json();
      if (!response.ok) {
        console.error('❌ Resend API 응답 오류:', responseData);
        throw new Error(`Resend API 오류: ${JSON.stringify(responseData)}`);
      }

      console.log(`✅ 임시 비밀번호가 ${email}에 성공적으로 전송되었습니다`);
    } catch (emailError: any) {
      console.error('❌ 이메일 전송 오류:', emailError.message);
      // 이메일 전송 실패해도 계속 진행 (비밀번호는 이미 변경됨)
    }

    return new Response(JSON.stringify({
      success: true,
      message: '임시 비밀번호가 발급되었습니다. 이메일을 확인해주세요.'
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error: any) {
    console.error('❌ 전역 에러:', error.message, error.stack);
    return new Response(JSON.stringify({
      error: error.message || '비밀번호 재설정 중 오류가 발생했습니다.',
      success: false
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
