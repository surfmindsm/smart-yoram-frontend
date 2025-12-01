// supabase/functions/send-chat-notification/index.ts
// FCM HTTP v1 API 사용 (레거시 API는 2024년 6월 중단됨)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  message_type: string;
  created_at: string;
}

interface NotificationPayload {
  message: ChatMessage;
  room_info?: {
    post_title?: string;
    other_user_name?: string;
  };
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

// FCM v1 OAuth 2.0 액세스 토큰 생성
async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
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
      new TextEncoder().encode(serviceAccount.private_key),
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
    const { message, room_info } = payload;

    console.log('📩 새 채팅 메시지 알림 발송:', {
      messageId: message.id,
      roomId: message.room_id,
      senderId: message.sender_id,
    });

    // 1. 채팅방 참여자 조회 (발신자 제외)
    const { data: participants, error: participantsError } = await supabase
      .from('p2p_chat_participants')
      .select('user_id, user_name')
      .eq('room_id', message.room_id)
      .neq('user_id', message.sender_id);

    if (participantsError) {
      console.error('❌ 참여자 조회 실패:', participantsError);
      throw participantsError;
    }

    if (!participants || participants.length === 0) {
      console.log('⚠️ 알림 수신자가 없습니다 (발신자 본인만 있음)');
      return new Response(
        JSON.stringify({ success: true, message: '수신자 없음' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 각 수신자의 FCM 토큰 조회 및 알림 발송
    const notifications = [];

    for (const participant of participants) {
      // 수신자의 FCM 토큰 조회 (device_tokens 테이블 사용)
      const { data: devices, error: devicesError } = await supabase
        .from('device_tokens')
        .select('fcm_token, platform')
        .eq('user_id', participant.user_id)
        .eq('is_active', true);

      if (devicesError) {
        console.error(`❌ FCM 토큰 조회 실패 (user_id: ${participant.user_id}):`, devicesError);
        continue;
      }

      if (!devices || devices.length === 0) {
        console.log(`⚠️ FCM 토큰이 없습니다 (user_id: ${participant.user_id})`);
        continue;
      }

      // 3. 각 디바이스에 FCM 알림 발송 (v1 API)
      for (const device of devices) {
        const fcmPayload = {
          message: {
            token: device.fcm_token,
            notification: {
              title: message.sender_name,
              body: message.message_type === 'text'
                ? message.message
                : '[이미지]',
            },
            data: {
              type: 'chat_message',
              notification_type: 'custom',
              room_id: message.room_id.toString(),
              sender_id: message.sender_id.toString(),
              message_id: message.id.toString(),
              post_title: room_info?.post_title || '',
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
              },
            },
            apns: {
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
          console.log(`✅ FCM 알림 발송 성공 (user_id: ${participant.user_id}, platform: ${device.platform})`);
          notifications.push({
            userId: participant.user_id,
            platform: device.platform,
            success: true,
          });
        } else {
          console.error(`❌ FCM 알림 발송 실패 (user_id: ${participant.user_id}):`, fcmResult);
          notifications.push({
            userId: participant.user_id,
            platform: device.platform,
            success: false,
            error: fcmResult,
          });
        }
      }
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
