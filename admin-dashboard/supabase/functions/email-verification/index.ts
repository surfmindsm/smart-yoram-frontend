// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS 헤더 설정
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const requestBody = await req.json();
    const { email, action, code } = requestBody;

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

    // Supabase 클라이언트 생성 (자동 주입되는 환경 변수 사용)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'send') {
      // 인증 코드 생성 (6자리)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`✨ 인증 코드 생성: ${code} for ${email}`);

      // 데이터베이스에 저장 시도 (실패해도 계속 진행 - 개발 중)
      let dbSaved = false;
      try {
        // 이전에 저장된 코드가 있다면 삭제
        await supabaseClient
          .from('verification_codes')
          .delete()
          .eq('email', email);

        // 새 인증 코드를 데이터베이스에 저장 (15분 유효)
        const { error: insertError } = await supabaseClient
          .from('verification_codes')
          .insert({
            email,
            code,
            expires_at: new Date(Date.now() + 15 * 60000).toISOString()
          });

        if (insertError) {
          console.warn('⚠️ DB 저장 실패:', insertError.message);
        } else {
          console.log('✅ 인증 코드 DB 저장 성공');
          dbSaved = true;
        }
      } catch (dbError: any) {
        console.warn('⚠️ DB 작업 중 예외 발생:', dbError.message);
      }

      // Resend API를 사용하여 이메일 전송
      let emailSent = false;
      let emailError = null;
      try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
          throw new Error('Resend API 키가 설정되지 않았습니다');
        }

        // API 키 디버깅 (앞 7자리만)
        console.log(`🔑 Resend API Key (첫 7자): ${resendApiKey.substring(0, 7)}...`);
        console.log(`📧 이메일 발송 시작: ${email}`);
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'noreply@churchround.com',
            to: email,
            subject: 'Church Round 이메일 인증 코드',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">Church Round 이메일 인증</h2>
                <p style="font-size: 16px; color: #555;">안녕하세요,</p>
                <p style="font-size: 16px; color: #555;">요청하신 이메일 인증 코드는 다음과 같습니다:</p>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <h1 style="margin: 0; color: #007bff; letter-spacing: 5px; font-size: 32px;">${code}</h1>
                </div>
                <p style="font-size: 14px; color: #777;">이 코드는 15분 동안만 유효합니다.</p>
                <p style="font-size: 14px; color: #777;">본인이 요청하지 않았다면 이 이메일을 무시하세요.</p>
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

        console.log(`✅ 인증 코드 ${code}가 ${email}에 성공적으로 전송되었습니다`);
        emailSent = true;
      } catch (err: any) {
        console.error('❌ 이메일 전송 오류:', err.message);
        emailError = err.message;
      }

      // 항상 성공 응답 반환 (status 200)
      return new Response(JSON.stringify({
        success: true,
        message: emailSent
          ? '인증 코드가 이메일로 전송되었습니다.'
          : `인증 코드가 생성되었습니다. (이메일 전송 실패: ${emailError})`,
        code: !emailSent ? code : undefined, // 이메일 실패 시에만 코드 포함
        debug: {
          dbSaved,
          emailSent,
          emailError
        }
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } else if (action === 'verify') {
      if (!code) {
        return new Response(JSON.stringify({
          error: '인증 코드가 필요합니다.'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }

      // 데이터베이스에서 인증 코드 확인
      const { data: verificationData, error: verifyError } = await supabaseClient
        .from('verification_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (verifyError) {
        console.error('❌ DB 조회 오류:', verifyError);
        return new Response(JSON.stringify({
          success: false,
          error: '인증 코드 확인 중 오류가 발생했습니다.'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }

      if (!verificationData) {
        console.warn('❌ 유효하지 않은 코드:', code);
        return new Response(JSON.stringify({
          success: false,
          error: '인증 코드가 올바르지 않거나 만료되었습니다.'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }

      // DB 검증 성공 - 사용된 코드 삭제
      await supabaseClient
        .from('verification_codes')
        .delete()
        .eq('email', email)
        .eq('code', code);

      console.log('✅ DB 기반 인증 성공');
      return new Response(JSON.stringify({
        success: true,
        message: '이메일 인증이 완료되었습니다.'
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } else {
      return new Response(JSON.stringify({
        error: '유효하지 않은 액션입니다. send 또는 verify를 사용하세요.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error: any) {
    console.error('❌ 전역 에러:', error.message, error.stack);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
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