// supabase/functions/send-pastoral-care-notification/index.ts
// 심방 신청 승인 시 FCM 푸시 알림 발송
// FCM HTTP v1 API 사용

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PastoralCareRequest {
  id: string;
  church_id: number;
  member_id?: number;
  requester_name: string;
  request_type: string;
  status: string;
  preferred_date?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  created_at: string;
}

interface NotificationPayload {
  record: PastoralCareRequest;
  old_record?: PastoralCareRequest;
}

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// PEM 형식의 private key를 DER 형식으로 변환
function pemToDer(pem: string): Uint8Array {
  // PEM 헤더/푸터 제거 및 base64 디코딩
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  // base64 디코딩
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// FCM v1 OAuth 2.0 액세스 토큰 생성
async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  // PEM 형식의 private key를 DER로 변환
  const privateKeyDer = pemToDer(serviceAccount.private_key);

  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: getNumericDate(60 * 60), // 1시간 후 만료
      iat: getNumericDate(0),
    },
    await crypto.subtle.importKey(
      "pkcs8",
      privateKeyDer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    )
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await response.json();
  return data.access_token;
}

// 상태별 알림 메시지 생성
function getNotificationMessage(record: PastoralCareRequest): { title: string; body: string } {
  const requesterName = record.requester_name || '신청자';

  switch (record.status) {
    case 'approved':
      return {
        title: '심방 신청이 승인되었습니다',
        body: `${requesterName}님의 심방 신청이 승인되었습니다. 곧 일정을 안내드리겠습니다.`,
      };
    case 'scheduled':
      const date = record.scheduled_date || record.preferred_date || '미정';
      const time = record.scheduled_time || '미정';
      return {
        title: '심방 일정이 확정되었습니다',
        body: `${requesterName}님, 심방 일정이 ${date} ${time}로 확정되었습니다.`,
      };
    case 'completed':
      return {
        title: '심방이 완료되었습니다',
        body: `${requesterName}님, 심방이 완료되었습니다. 감사합니다.`,
      };
    case 'cancelled':
      return {
        title: '심방 신청이 취소되었습니다',
        body: `${requesterName}님의 심방 신청이 취소되었습니다.`,
      };
    default:
      return {
        title: '심방 신청 상태가 변경되었습니다',
        body: `${requesterName}님의 심방 신청 상태가 업데이트되었습니다.`,
      };
  }
}

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServiceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON')!;

    if (!fcmServiceAccountJson) {
      throw new Error('FCM_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다');
    }

    const serviceAccount: ServiceAccount = JSON.parse(fcmServiceAccountJson);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // FCM v1 API용 액세스 토큰 생성
    const accessToken = await getAccessToken(serviceAccount);

    // 요청 본문 파싱
    const payload: NotificationPayload = await req.json();
    const { record, old_record } = payload;

    console.log('🏥 심방 신청 상태 변경 알림:', {
      requestId: record.id,
      memberId: record.member_id,
      churchId: record.church_id,
      oldStatus: old_record?.status,
      newStatus: record.status,
    });

    // member_id가 없으면 알림을 발송하지 않음
    if (!record.member_id) {
      console.log('⚠️ member_id가 없어 알림을 발송하지 않습니다');
      return new Response(
        JSON.stringify({ success: true, message: 'member_id 없음 - 알림 미발송' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. member_id로 user_id 조회
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('user_id')
      .eq('id', record.member_id)
      .maybeSingle();

    if (memberError) {
      console.error('❌ 교인 정보 조회 실패:', memberError);
      throw memberError;
    }

    if (!memberData || !memberData.user_id) {
      console.log('⚠️ 해당 교인의 user_id가 없습니다 (앱 미가입 사용자)');
      return new Response(
        JSON.stringify({ success: true, message: '앱 미가입 사용자 - 알림 미발송' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 해당 사용자의 활성 FCM 토큰 조회
    const { data: deviceTokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('fcm_token, platform')
      .eq('user_id', memberData.user_id)
      .eq('is_active', true);

    if (tokensError) {
      console.error('❌ FCM 토큰 조회 실패:', tokensError);
      throw tokensError;
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      console.log('⚠️ 해당 사용자의 활성 FCM 토큰이 없습니다');
      return new Response(
        JSON.stringify({ success: true, message: '알림 수신자 없음' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 알림 발송 대상: ${deviceTokens.length}개 디바이스`);

    // 3. 각 디바이스에 FCM 알림 발송
    const notifications = [];
    const { title, body } = getNotificationMessage(record);

    for (const device of deviceTokens) {
      const fcmPayload = {
        message: {
          token: device.fcm_token,
          notification: {
            title,
            body,
          },
          data: {
            type: 'pastoral_care',
            notification_type: 'pastoral_care',
            request_id: record.id.toString(),
            church_id: record.church_id.toString(),
            status: record.status,
            request_type: record.request_type,
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
          android: {
            priority: 'high',
            notification: {
              channel_id: 'pastoral_care',
              sound: 'default',
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
          apns: {
            headers: { 'apns-priority': '10' },
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        },
      };

      // FCM v1 API 호출
      const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;
      const fcmResponse = await fetch(fcmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(fcmPayload),
      });

      const fcmResult = await fcmResponse.json();

      if (fcmResponse.ok) {
        console.log(`✅ FCM 알림 발송 성공 (user_id: ${memberData.user_id}, platform: ${device.platform})`);
        notifications.push({
          userId: memberData.user_id,
          platform: device.platform,
          success: true,
        });
      } else {
        console.error(`❌ FCM 알림 발송 실패 (user_id: ${memberData.user_id}):`, fcmResult);
        notifications.push({
          userId: memberData.user_id,
          platform: device.platform,
          success: false,
          error: fcmResult,
        });
      }
    }

    // 4. notifications 테이블에 알림 저장 (앱 내 알림 목록용)
    console.log('💾 알림 테이블에 저장 중...');
    const { error: notificationInsertError } = await supabase
      .from('notifications')
      .insert({
        user_id: memberData.user_id,
        title,
        body,
        type: 'pastoral_care',
        related_id: null,
        related_type: 'pastoral_care_request',
        data: {
          request_id: record.id,
          status: record.status,
          request_type: record.request_type,
          scheduled_date: record.scheduled_date,
          scheduled_time: record.scheduled_time,
          church_id: record.church_id,
        },
        is_read: false,
      });

    if (notificationInsertError) {
      console.error('❌ 알림 테이블 저장 실패:', notificationInsertError);
      // 푸시 알림은 성공했으므로 계속 진행
    } else {
      console.log('✅ 알림 테이블에 저장 완료');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${notifications.length}개 디바이스에 알림 발송`,
        notifications,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Edge Function 실행 오류:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
