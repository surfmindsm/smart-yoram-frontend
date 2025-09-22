import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  phone: string;
  username: string;
  temporaryPassword: string;
  churchName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📱 [SMS API] SMS 발송 요청 시작');

    const { phone, username, temporaryPassword, churchName }: SMSRequest = await req.json();

    if (!phone || !username || !temporaryPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '필수 파라미터가 누락되었습니다.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 네이버 클라우드 SMS API 설정
    const serviceId = 'ncp:sms:kr:358279546766:yoram';
    const accessKey = Deno.env.get('NCP_ACCESS_KEY') || '';
    const secretKey = Deno.env.get('NCP_SECRET_KEY') || '';
    const fromNumber = Deno.env.get('SMS_FROM_NUMBER') || '';

    if (!accessKey || !secretKey || !fromNumber) {
      console.error('❌ SMS API 환경변수가 설정되지 않았습니다.');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SMS 서비스 설정 오류'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // SMS 메시지 내용 생성 (90byte 이내)
    const appDownloadUrl = 'bit.ly/church-app'; // 실제 앱 다운로드 링크로 변경 필요
    const smsContent = `[${churchName}] 앱계정 생성
ID: ${username}
PW: ${temporaryPassword}
앱: ${appDownloadUrl}`;

    console.log('📝 SMS 내용:', smsContent);
    console.log('📊 SMS 길이:', new TextEncoder().encode(smsContent).length, 'bytes');

    // 타임스탬프 생성
    const timestamp = Date.now().toString();

    // 시그니처 생성을 위한 문자열
    const method = 'POST';
    const url = `/sms/v2/services/${serviceId}/messages`;
    const stringToSign = `${method} ${url}\n${timestamp}\n${accessKey}`;

    // HMAC-SHA256 시그니처 생성
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const messageData = encoder.encode(stringToSign);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // SMS API 요청
    const smsApiUrl = `https://sens.apigw.ntruss.com/sms/v2/services/${serviceId}/messages`;

    const smsPayload = {
      type: 'SMS',
      contentType: 'COMM',
      from: fromNumber,
      content: smsContent,
      messages: [
        {
          to: phone,
          content: smsContent
        }
      ]
    };

    console.log('📤 SMS API 요청 시작:', phone);
    console.log('🔑 환경변수 확인:', {
      accessKey: accessKey ? '설정됨' : '누락',
      secretKey: secretKey ? '설정됨' : '누락',
      fromNumber: fromNumber ? fromNumber : '누락'
    });
    console.log('📦 SMS API 페이로드:', JSON.stringify(smsPayload, null, 2));

    const response = await fetch(smsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': accessKey,
        'x-ncp-apigw-signature-v2': signatureBase64,
      },
      body: JSON.stringify(smsPayload)
    });

    console.log('📡 HTTP 응답 상태:', response.status, response.statusText);
    const responseData = await response.json();
    console.log('📊 네이버 클라우드 응답:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('✅ SMS 발송 성공:', responseData);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'SMS가 성공적으로 발송되었습니다.',
          data: responseData
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      console.error('❌ SMS 발송 실패:', responseData);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'SMS 발송에 실패했습니다.',
          details: responseData
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('❌ SMS API 오류:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: '서버 오류가 발생했습니다.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})