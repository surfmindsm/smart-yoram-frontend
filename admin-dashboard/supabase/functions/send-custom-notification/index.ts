// supabase/functions/send-custom-notification/index.ts
// 관리자 메시지 발송 - 선택된 교인들에게 푸시 알림 발송
// FCM HTTP v1 API 사용

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  church_id: number;
  member_ids: number[];  // 선택된 교인 ID 리스트
  title: string;
  content: string;
  sender_user_id?: string; // 발송자 user ID (UUID)
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
    const { church_id, member_ids, title, content, sender_user_id } = payload;

    console.log('📨 관리자 메시지 발송:', {
      churchId: church_id,
      memberCount: member_ids.length,
      title,
      senderUserId: sender_user_id,
    });

    // 발송자 정보 조회
    let senderName = '관리자';
    let senderId = 1;

    console.log('🔍 발송자 정보 조회 시작:', { sender_user_id, type: typeof sender_user_id });

    if (sender_user_id) {
      try {
        // users 테이블에서 id로 조회
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('id', sender_user_id)
          .maybeSingle();

        console.log('📋 Users 조회 결과:', { user, userError });

        if (user && !userError) {
          senderName = user.full_name || '관리자';
          senderId = user.id;
          console.log('✅ 발송자 정보 조회 성공:', { senderId, senderName });
        }
      } catch (error) {
        console.error('⚠️ 발송자 정보 조회 중 오류:', error);
      }
    } else {
      console.log('⚠️ sender_user_id가 전달되지 않음');
    }

    console.log('🎯 최종 발송자 정보:', { senderId, senderName });

    if (!member_ids || member_ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: '수신자가 선택되지 않았습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. 선택된 교인들의 user_id 조회 (members 테이블 → users 테이블 매핑)
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, user_id')
      .in('id', member_ids)
      .eq('church_id', church_id);

    if (membersError) {
      console.error('❌ 교인 정보 조회 실패:', membersError);
      throw membersError;
    }

    if (!members || members.length === 0) {
      console.log('⚠️ 선택된 교인을 찾을 수 없습니다');
      return new Response(
        JSON.stringify({ success: false, message: '선택된 교인을 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // user_id가 있는 교인만 필터링
    const validMembers = members.filter(m => m.user_id);
    const userIds = validMembers.map(m => m.user_id);

    if (userIds.length === 0) {
      console.log('⚠️ 앱에 가입된 교인이 없습니다');
      return new Response(
        JSON.stringify({ success: true, message: '앱에 가입된 교인이 없어 알림을 발송하지 않았습니다' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 앱 사용자: ${userIds.length}명 (전체 ${members.length}명 중)`);

    // 2. 해당 사용자들의 FCM 토큰 조회
    const { data: deviceTokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('fcm_token, platform, user_id')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (tokensError) {
      console.error('❌ FCM 토큰 조회 실패:', tokensError);
      throw tokensError;
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      console.log('⚠️ 활성 FCM 토큰이 없습니다');
      return new Response(
        JSON.stringify({ success: true, message: '알림 수신 가능한 디바이스가 없습니다' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 알림 발송 대상: ${deviceTokens.length}개 디바이스`);

    // 3. 각 디바이스에 FCM 알림 발송
    const notifications = [];
    const notifiedUserIds = new Set(); // 중복 방지

    for (const device of deviceTokens) {
      const fcmPayload = {
        message: {
          token: device.fcm_token,
          notification: {
            title: title,
            body: content,
          },
          data: {
            type: 'custom_message',
            notification_type: 'custom',
            church_id: church_id.toString(),
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

        // 🆕 Supabase notifications 테이블에 저장 (사용자당 1번만)
        if (!notifiedUserIds.has(device.user_id)) {
          notifiedUserIds.add(device.user_id);
          try {
            await supabase.from('notifications').insert({
              user_id: device.user_id,
              title: title,
              body: content,
              type: 'custom_message',
              is_read: false,
              related_id: null,
              related_type: null,
              data: {
                church_id: church_id,
                sender_id: senderId,
                sender_name: senderName,
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            console.log(`💾 알림 저장 완료 (user_id: ${device.user_id})`);
          } catch (saveError) {
            console.error(`⚠️ 알림 저장 실패 (user_id: ${device.user_id}):`, saveError);
            // 저장 실패해도 FCM은 발송되었으므로 계속 진행
          }
        }
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

    const deviceSuccessCount = notifications.filter(n => n.success).length;
    const deviceFailedCount = notifications.length - deviceSuccessCount;

    // 발송 기록 저장
    try {
      await supabase
        .from('message_send_history')
        .insert({
          church_id: church_id,
          sender_id: senderId,
          sender_name: senderName,
          title: title,
          content: content,
          recipient_member_ids: member_ids,
          recipient_count: members.length,
          app_user_count: userIds.length,
          devices_sent: deviceSuccessCount,
          devices_failed: deviceFailedCount,
        });

      console.log('✅ 발송 기록 저장 완료');
    } catch (historyError) {
      console.error('⚠️ 발송 기록 저장 실패 (알림 발송은 성공):', historyError);
      // 기록 저장 실패해도 알림 발송은 성공했으므로 계속 진행
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${deviceSuccessCount}/${deviceTokens.length}개 디바이스에 알림 발송 완료`,
        notifications,
        stats: {
          totalMembers: members.length,
          appUsers: userIds.length,
          devicesSent: deviceSuccessCount,
          devicesFailed: deviceFailedCount,
        },
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
