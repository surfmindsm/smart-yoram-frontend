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
          subject: '스마트 요람 커뮤니티 가입 승인 및 로그인 정보',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #333; text-align: center;">스마트 요람 커뮤니티 가입 승인</h2>

              <p style="font-size: 16px; color: #555;">안녕하세요, ${contact_person}님!</p>

              <p style="font-size: 16px; color: #555;">
                ${organization_name || '귀하'}의 스마트 요람 커뮤니티 가입 신청이 승인되었습니다.
              </p>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">로그인 정보</h3>
                <p style="margin: 10px 0;"><strong>이메일:</strong> ${email}</p>
                <p style="margin: 10px 0;"><strong>임시 비밀번호:</strong>
                  <span style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">${temporary_password}</span>
                </p>
                <p style="margin: 10px 0;"><strong>로그인 주소:</strong>
                  <a href="https://your-domain.com/login" style="color: #007bff;">https://your-domain.com/login</a>
                </p>
              </div>

              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">⚠️ 보안 안내</h4>
                <ul style="color: #856404; margin: 0; padding-left: 20px;">
                  <li>첫 로그인 후 반드시 비밀번호를 변경해주세요</li>
                  <li>임시 비밀번호는 타인과 공유하지 마세요</li>
                  <li>로그인 시 이메일 인증이 추가로 요구됩니다</li>
                </ul>
              </div>

              <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #155724; margin-top: 0;">📋 다음 단계</h4>
                <ol style="color: #155724; margin: 0; padding-left: 20px;">
                  <li>위 정보로 로그인하기</li>
                  <li>이메일 인증 코드 입력</li>
                  <li>새로운 비밀번호로 변경</li>
                  <li>커뮤니티 서비스 이용 시작</li>
                </ol>
              </div>

              <p style="font-size: 14px; color: #777; margin-top: 30px;">
                문의사항이 있으시면 고객지원팀으로 연락해주세요.
              </p>

              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999; text-align: center;">
                스마트 요람 커뮤니티<br>
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