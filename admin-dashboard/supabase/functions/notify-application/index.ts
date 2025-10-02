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
    const requestBody = await req.json();
    const { type, applicantEmail, applicantName, organizationName, applicationId } = requestBody;

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
    if (type !== 'church' && type !== 'community') {
      return new Response(JSON.stringify({
        error: '유효하지 않은 신청 타입입니다. (church 또는 community)'
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

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'noreply@churchround.com',
        to: 'surfmind.sm@gmail.com',
        subject: `[Church Round] 새로운 ${typeLabel} 신청이 접수되었습니다`,
        html: `
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
