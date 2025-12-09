// supabase/functions/send-announcement-notification/index.ts
// 공지사항 작성 시 FCM 푸시 알림 발송
// FCM HTTP v1 API 사용

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Announcement {
  id: number;
  church_id: number;
  title: string;
  content: string;
  category?: string;
  author_name?: string;
  is_active: boolean;
  created_at: string;
}

interface NotificationPayload {
  announcement: Announcement;
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

// 카테고리별 알림 제목 생성
function getNotificationTitle(category?: string): string {
  const categoryMap: { [key: string]: string } = {
    'worship': '새 예배 안내',
    'member_news': '새 교우 소식',
    'event': '새 행사 공지',
    'general': '새 공지사항',
  };
  return categoryMap[category || ''] || '새 공지사항';
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
    const { announcement } = payload;

    console.log('📢 새 공지사항 알림 발송:', {
      announcementId: announcement.id,
      churchId: announcement.church_id,
      title: announcement.title,
      isActive: announcement.is_active,
    });

    // 비활성 공지사항은 알림 발송하지 않음
    if (!announcement.is_active) {
      console.log('⚠️ 비활성 공지사항이므로 알림을 발송하지 않습니다');
      return new Response(
        JSON.stringify({ success: true, message: '비활성 공지사항 - 알림 미발송' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. 해당 교회의 활성 사용자 및 FCM 토큰 조회
    // users 테이블과 device_tokens 테이블 조인
    const { data: deviceTokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select(`
        fcm_token,
        platform,
        user_id,
        users!inner (
          id,
          church_id
        )
      `)
      .eq('users.church_id', announcement.church_id)
      .eq('is_active', true);

    if (tokensError) {
      console.error('❌ FCM 토큰 조회 실패:', tokensError);
      throw tokensError;
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      console.log('⚠️ 해당 교회의 활성 FCM 토큰이 없습니다');
      return new Response(
        JSON.stringify({ success: true, message: '알림 수신자 없음' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 알림 발송 대상: ${deviceTokens.length}개 디바이스`);

    // 2. 각 디바이스에 FCM 알림 발송
    const notifications = [];
    const notificationTitle = getNotificationTitle(announcement.category);

    for (const device of deviceTokens) {
      const fcmPayload = {
        message: {
          token: device.fcm_token,
          notification: {
            title: notificationTitle,
            body: announcement.title,
          },
          data: {
            type: 'announcement',
            notification_type: 'announcement',
            announcement_id: announcement.id.toString(),
            church_id: announcement.church_id.toString(),
            category: announcement.category || 'general',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
          android: {
            priority: 'high',
            notification: {
              channel_id: 'announcements',
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
        console.log(`✅ FCM 알림 발송 성공 (user_id: ${device.user_id}, platform: ${device.platform})`);
        notifications.push({
          userId: device.user_id,
          platform: device.platform,
          success: true,
        });
      } else {
        console.error(`❌ FCM 알림 발송 실패 (user_id: ${device.user_id}):`, fcmResult);
        notifications.push({
          userId: device.user_id,
          platform: device.platform,
          success: false,
          error: fcmResult,
        });
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
