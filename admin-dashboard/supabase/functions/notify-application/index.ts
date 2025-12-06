// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

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
    const { type, applicantEmail, applicantName, organizationName, applicationId, username, temporaryPassword } = requestBody;

    // 필수 필드 검증
    if (!type || !applicantEmail || !applicantName) {
      return new Response(JSON.stringify({
        error: '필수 필드가 누락되었습니다.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // type 검증
    if (type !== 'church' && type !== 'community' && type !== 'community_approved') {
      return new Response(JSON.stringify({
        error: '유효하지 않은 신청 타입입니다. (church, community, community_approved)'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Resend API를 사용하여 알림 이메일 전송
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Resend API 키가 설정되지 않았습니다');
    }

    const typeLabel = type === 'church' ? '교회 가입' : '커뮤니티 가입';
    const orgDisplay = organizationName || applicantName;

    // 승인 이메일인 경우 신청자에게 발송
    const isApprovalEmail = type === 'community_approved';
    const recipientEmail = isApprovalEmail ? applicantEmail : 'surfmind.sm@gmail.com';
    const emailSubject = isApprovalEmail
      ? `[Church Round] 커뮤니티 가입 신청이 승인되었습니다`
      : `[Church Round] 새로운 ${typeLabel} 신청이 접수되었습니다`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'noreply@churchround.com',
        to: recipientEmail,
        subject: emailSubject,
        html: isApprovalEmail ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #333; margin-bottom: 30px; text-align: center;">
              🎉 커뮤니티 가입 신청이 승인되었습니다
            </h2>

            <p style="color: #555; line-height: 1.6; margin-bottom: 30px; text-align: center;">
              ${applicantName}님, 안녕하세요.<br>
              Church Round 커뮤니티 가입 신청이 승인되었습니다.<br>
              이제 모바일 앱을 통해 Church Round의 모든 기능을 이용하실 수 있습니다.
            </p>

            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 20px; font-size: 16px; text-align: center;">📱 로그인 정보</h3>
              <table style="width: 100%; border-collapse: collapse; max-width: 400px; margin: 0 auto;">
                <tr>
                  <td style="padding: 12px 0; color: #666; width: 140px;">아이디</td>
                  <td style="padding: 12px 0; color: #333; font-family: monospace; font-weight: bold;">${username || applicantEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666;">임시 비밀번호</td>
                  <td style="padding: 12px 0; color: #333; font-family: monospace; font-weight: bold; font-size: 18px;">${temporaryPassword || '(별도 안내 예정)'}</td>
                </tr>
              </table>
              <p style="margin-top: 20px; margin-bottom: 0; font-size: 14px; color: #666; text-align: center;">
                💡 보안을 위해 첫 로그인 후 비밀번호를 변경해주세요.
              </p>
            </div>

            <div style="background-color: #f0f9ff; padding: 30px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #007bff;">
              <h3 style="color: #007bff; margin-top: 0; margin-bottom: 20px; font-size: 18px; text-align: center;">📲 다음 단계</h3>
              <ol style="color: #555; line-height: 2; padding-left: 20px; font-size: 15px;">
                <li>아래 버튼을 눌러 Church Round 앱을 다운로드하세요</li>
                <li>앱을 실행하고 위의 아이디와 임시 비밀번호로 로그인하세요</li>
                <li>로그인 후 비밀번호를 변경하고 서비스를 시작하세요</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="https://churchround.com/download"
                 style="display: inline-block; padding: 16px 50px; background-color: #007bff; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                📱 앱 다운로드하기
              </a>
            </div>

            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                <strong>ℹ️ 안내:</strong><br>
                Church Round는 모바일 전용 서비스입니다.<br>
                iOS 또는 Android 앱을 다운로드하여 이용해주세요.
              </p>
            </div>

            <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">

            <p style="font-size: 13px; color: #999; text-align: center; line-height: 1.6;">
              Church Round<br>
              승인 일시: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
            </p>
          </div>
        ` : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #333; text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
              🔔 새로운 ${typeLabel} 신청 알림
            </h2>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #007bff; margin-top: 0;">신청자 정보</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 140px;">신청 유형:</td>
                  <td style="padding: 8px 0;">${typeLabel}</td>
                </tr>
                ${type === 'church' ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">교회명:</td>
                  <td style="padding: 8px 0;">${organizationName || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">담당자명:</td>
                  <td style="padding: 8px 0;">${applicantName}</td>
                </tr>
                ` : `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">단체/회사명:</td>
                  <td style="padding: 8px 0;">${organizationName || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">담당자명:</td>
                  <td style="padding: 8px 0;">${applicantName}</td>
                </tr>
                `}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">이메일:</td>
                  <td style="padding: 8px 0;">${applicantEmail}</td>
                </tr>
                ${applicationId ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">신청 ID:</td>
                  <td style="padding: 8px 0;">#${applicationId}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ 조치 필요:</strong><br>
                관리자 대시보드에서 신청 내용을 검토하고 승인/반려 처리를 진행해주세요.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://admin.churchround.com/applications"
                 style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                신청서 검토하러 가기
              </a>
            </div>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

            <p style="font-size: 12px; color: #999; text-align: center;">
              Church Round 관리자 알림<br>
              신청 접수 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
            </p>
          </div>
        `
      })
    });

    console.log(`✅ 이메일 발송 완료:`, recipientEmail, isApprovalEmail ? '(승인 알림)' : '(신청 접수 알림)');

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Resend API 응답 오류:', responseData);
      throw new Error(`Resend API 오류: ${JSON.stringify(responseData)}`);
    }

    console.log(`✅ ${typeLabel} 신청 알림 이메일 발송 완료:`, applicantEmail, '→', 'surfmind.sm@gmail.com');

    return new Response(JSON.stringify({
      success: true,
      message: '알림 이메일이 발송되었습니다.',
      emailId: responseData.id
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error: any) {
    console.error('알림 이메일 발송 오류:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '알림 이메일 발송에 실패했습니다.'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
