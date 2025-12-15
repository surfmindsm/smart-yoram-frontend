import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

// CORS 헤더 설정
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const { email, temporary_password, contact_person, organization_name } = await req.json();

    if (!email || !temporary_password || !contact_person) {
      return new Response(JSON.stringify({
        error: '이메일, 임시 비밀번호, 담당자명이 필요합니다.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

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
          from: 'noreply@churchround.com',
          to: email,
          subject: 'Church Round 앱 초대 - 로그인 정보',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #333; text-align: center;">Church Round 앱 초대</h2>

              <p style="font-size: 16px; color: #555;">안녕하세요, ${contact_person}님!</p>

              <p style="font-size: 16px; color: #555;">
                ${organization_name || '귀하'}의 Church Round 앱에 초대되셨습니다.
              </p>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">📱 앱 다운로드</h3>
                <p style="margin: 10px 0;"><strong>iOS:</strong> App Store에서 "Church Round" 검색</p>
                <p style="margin: 10px 0;"><strong>Android:</strong> Google Play에서 "Church Round" 검색</p>
                <p style="margin: 15px 0;">
                  <a href="https://churchround.com/download"
                     style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    앱 다운로드하기
                  </a>
                </p>
              </div>

              <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">🔑 로그인 정보</h3>
                <p style="margin: 10px 0;"><strong>이메일:</strong> ${email}</p>
                <p style="margin: 10px 0;"><strong>임시 비밀번호:</strong>
                  <span style="background-color: #fff; padding: 6px 12px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold; border: 1px solid #ddd;">${temporary_password}</span>
                </p>
              </div>

              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">⚠️ 보안 안내</h4>
                <ul style="color: #856404; margin: 0; padding-left: 20px;">
                  <li>앱을 다운로드한 후 위의 이메일과 임시 비밀번호로 로그인하세요</li>
                  <li>첫 로그인 후 반드시 비밀번호를 변경해주세요</li>
                  <li>임시 비밀번호는 타인과 공유하지 마세요</li>
                </ul>
              </div>

              <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #155724; margin-top: 0;">📋 다음 단계</h4>
                <ol style="color: #155724; margin: 0; padding-left: 20px;">
                  <li>App Store 또는 Google Play에서 "Church Round" 앱 다운로드</li>
                  <li>앱 실행 후 이메일과 임시 비밀번호로 로그인</li>
                  <li>새로운 비밀번호로 변경</li>
                  <li>Church Round 앱 사용 시작!</li>
                </ol>
              </div>

              <p style="font-size: 14px; color: #777; margin-top: 30px;">
                문의사항이 있으시면 담당자에게 연락해주세요.
              </p>

              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999; text-align: center;">
                Church Round<br>
                이 이메일은 자동으로 발송되었습니다.
              </p>
            </div>
          `
        })
      });

      const responseData = await response.json();
      if (!response.ok) {
        console.error('Resend API 응답:', responseData);
        throw new Error(`Resend API 오류: ${JSON.stringify(responseData)}`);
      }

      console.log(`임시 비밀번호가 ${email}에 성공적으로 전송되었습니다`);
      return new Response(JSON.stringify({
        success: true,
        message: '임시 비밀번호가 이메일로 전송되었습니다.'
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } catch (emailError: any) {
      console.error('이메일 전송 오류:', emailError.message);
      return new Response(JSON.stringify({
        success: false,
        error: '이메일 전송에 실패했습니다: ' + emailError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error: any) {
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