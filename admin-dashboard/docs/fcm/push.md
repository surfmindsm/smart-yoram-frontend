# P2P 채팅 푸시 알림 설정 가이드

## 개요
P2P 채팅에서 새 메시지가 도착했을 때 자동으로 푸시 알림을 보내는 기능입니다.
Supabase Edge Function과 Database Trigger를 사용하여 서버 측에서 FCM 푸시 알림을 발송합니다.

## 아키텍처

```
새 메시지 INSERT
    ↓
Database Trigger 발동
    ↓
Edge Function 호출
    ↓
수신자 FCM 토큰 조회
    ↓
FCM API로 푸시 발송
    ↓
앱에서 알림 수신 (채팅방으로 이동)
```

---

## 1단계: Edge Function 생성

### 1-1. Edge Function 파일 생성

Supabase 프로젝트의 `supabase/functions/send-chat-notification/index.ts` 파일을 생성합니다.

```typescript
// supabase/functions/send-chat-notification/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')!;

    if (!fcmServerKey) {
      throw new Error('FCM_SERVER_KEY 환경변수가 설정되지 않았습니다');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      // 수신자의 FCM 토큰 조회 (device_tokens 또는 fcm_tokens 테이블 사용)
      // 주의: 실제 테이블명은 프로젝트에 맞게 수정해야 합니다
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

      // 3. 각 디바이스에 FCM 알림 발송
      for (const device of devices) {
        const fcmPayload = {
          to: device.fcm_token,
          notification: {
            title: message.sender_name,
            body: message.message_type === 'text'
              ? message.message
              : '[이미지]',
            sound: 'default',
            badge: '1',
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
          priority: 'high',
        };

        // FCM API 호출
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${fcmServerKey}`,
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
```

### 1-2. Edge Function 배포

```bash
# Supabase CLI 설치 (아직 안 했다면)
npm install -g supabase

# Supabase 프로젝트 링크
supabase link --project-ref YOUR_PROJECT_REF

# Edge Function 배포
supabase functions deploy send-chat-notification

# 환경변수 설정
supabase secrets set FCM_SERVER_KEY=your_fcm_server_key_here
```

**FCM Server Key 확인 방법:**
1. Firebase Console 접속 (https://console.firebase.google.com/)
2. 프로젝트 선택 → ⚙️ 프로젝트 설정 → 클라우드 메시징
3. "Cloud Messaging API (레거시)" 섹션에서 서버 키 복사

---

## 2단계: Database Trigger 생성

### 2-1. Trigger Function 생성

Supabase SQL Editor에서 아래 SQL을 실행합니다.

```sql
-- ============================================================
-- Edge Function 호출용 Trigger Function
-- ============================================================
CREATE OR REPLACE FUNCTION notify_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  room_info JSONB;
  function_url TEXT;
BEGIN
  -- Edge Function URL 설정
  -- 주의: YOUR_PROJECT_REF를 실제 프로젝트 ID로 변경
  function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-chat-notification';

  -- 채팅방 정보 조회
  SELECT jsonb_build_object(
    'post_title', post_title,
    'post_id', post_id,
    'post_table', post_table
  ) INTO room_info
  FROM p2p_chat_rooms
  WHERE id = NEW.room_id;

  -- Edge Function 비동기 호출 (pg_net 확장 사용)
  -- 주의: pg_net 확장이 설치되어 있어야 합니다
  PERFORM
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'message', jsonb_build_object(
          'id', NEW.id,
          'room_id', NEW.room_id,
          'sender_id', NEW.sender_id,
          'sender_name', NEW.sender_name,
          'message', NEW.message,
          'message_type', NEW.message_type,
          'created_at', NEW.created_at
        ),
        'room_info', room_info
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2-2. Trigger 생성

```sql
-- ============================================================
-- 새 메시지 INSERT 시 Trigger 발동
-- ============================================================
DROP TRIGGER IF EXISTS on_chat_message_created ON p2p_chat_messages;

CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON p2p_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_chat_message();
```

### 2-3. pg_net 확장 설치 (필요시)

```sql
-- pg_net 확장 활성화 (HTTP 요청용)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2-4. Service Role Key 설정

Supabase SQL Editor에서 실행:

```sql
-- Service Role Key를 데이터베이스 설정에 저장
-- 주의: YOUR_SERVICE_ROLE_KEY를 실제 키로 변경
ALTER DATABASE postgres SET app.settings.service_role_key TO 'YOUR_SERVICE_ROLE_KEY';
```

**Service Role Key 확인 방법:**
1. Supabase Dashboard → Settings → API
2. "Project API keys" 섹션에서 `service_role` 키 복사 (secret 키)

---

## 3단계: device_tokens 테이블 확인

Edge Function이 FCM 토큰을 조회하려면 `device_tokens` 테이블이 필요합니다.

### 3-1. 테이블이 없다면 생성

```sql
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    platform TEXT NOT NULL,  -- 'android' 또는 'ios'
    device_id TEXT,
    app_version TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, fcm_token)
);

CREATE INDEX idx_device_tokens_user ON public.device_tokens(user_id);
CREATE INDEX idx_device_tokens_active ON public.device_tokens(user_id, is_active);
```

### 3-2. 기존 테이블명이 다르다면

Edge Function 코드의 테이블명을 실제 테이블명으로 수정:

```typescript
// 예: fcm_tokens 테이블을 사용한다면
const { data: devices, error: devicesError } = await supabase
  .from('fcm_tokens')  // 실제 테이블명으로 변경
  .select('fcm_token, platform')
  .eq('user_id', participant.user_id)
  .eq('is_active', true);
```

---

## 4단계: Flutter 앱에서 알림 처리

### 4-1. FCM 토큰 등록 확인

앱에서 FCM 토큰이 Supabase에 저장되는지 확인합니다.

`lib/services/fcm_service.dart`에서 토큰 등록 부분:

```dart
// FCM 토큰 저장 로직이 이미 구현되어 있는지 확인
Future<void> _saveTokenToDatabase(String token) async {
  final user = await _authService.getCurrentUser();
  if (user.data == null) return;

  // Supabase에 토큰 저장
  await Supabase.instance.client.from('device_tokens').upsert({
    'user_id': user.data!.id,
    'fcm_token': token,
    'platform': Platform.isAndroid ? 'android' : 'ios',
    'is_active': true,
    'updated_at': DateTime.now().toIso8601String(),
  });
}
```

### 4-2. 알림 탭 처리

알림을 탭했을 때 채팅방으로 이동하도록 처리합니다.

`lib/services/fcm_service.dart`에 추가:

```dart
// 알림 탭 처리
void _handleNotificationTap(RemoteMessage message) {
  final data = message.data;
  final type = data['type'];

  if (type == 'chat_message') {
    final roomId = int.tryParse(data['room_id'] ?? '');
    if (roomId != null) {
      // 채팅방으로 이동
      navigatorKey.currentState?.pushNamed(
        '/chat-room',
        arguments: {'room_id': roomId},
      );
    }
  }
}

// FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
```

---

## 설정 완료 확인

### 1. Edge Function 테스트

Supabase Dashboard → Edge Functions → send-chat-notification → Logs에서 로그 확인

### 2. Trigger 테스트

SQL Editor에서 테스트 메시지 삽입:

```sql
-- 테스트용 메시지 삽입 (room_id는 실제 존재하는 채팅방 ID 사용)
INSERT INTO p2p_chat_messages (room_id, sender_id, sender_name, message, message_type)
VALUES (1, 123, '테스트 사용자', '테스트 메시지입니다', 'text');
```

Edge Function Logs에서 실행 로그 확인

### 3. 앱에서 실제 테스트

1. 두 개의 디바이스 준비 (또는 하나는 시뮬레이터)
2. 각각 다른 사용자로 로그인
3. 한 쪽에서 채팅 메시지 전송
4. 다른 쪽에서 푸시 알림 수신 확인

---

## 문제 해결

### 알림이 발송되지 않는 경우

1. **Edge Function Logs 확인**
   - Supabase Dashboard → Edge Functions → Logs
   - 오류 메시지 확인

2. **FCM Server Key 확인**
   ```bash
   supabase secrets list
   ```
   - FCM_SERVER_KEY가 올바르게 설정되었는지 확인

3. **pg_net 확장 확인**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```
   - 결과가 없으면 `CREATE EXTENSION pg_net;` 실행

4. **Service Role Key 확인**
   ```sql
   SHOW app.settings.service_role_key;
   ```
   - 올바른 키가 설정되었는지 확인

5. **device_tokens 테이블 확인**
   ```sql
   SELECT * FROM device_tokens WHERE user_id = YOUR_USER_ID;
   ```
   - FCM 토큰이 저장되어 있는지 확인

### Trigger가 실행되지 않는 경우

```sql
-- Trigger 목록 확인
SELECT * FROM pg_trigger WHERE tgname = 'on_chat_message_created';

-- Trigger 재생성
DROP TRIGGER IF EXISTS on_chat_message_created ON p2p_chat_messages;
CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON p2p_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_chat_message();
```

### FCM API 오류가 발생하는 경우

- **InvalidRegistration**: FCM 토큰이 잘못됨 → 앱에서 토큰 재등록 필요
- **NotRegistered**: FCM 토큰이 만료됨 → device_tokens에서 해당 토큰 삭제 필요
- **MismatchSenderId**: FCM 프로젝트가 일치하지 않음 → Firebase 프로젝트 설정 확인

---

## 보안 고려사항

1. **Service Role Key 보안**
   - Service Role Key는 절대 클라이언트 앱에 포함하지 말 것
   - Edge Function과 Database에서만 사용

2. **FCM Server Key 보안**
   - Supabase Secrets로만 관리
   - 코드에 직접 포함하지 말 것

3. **알림 내용 검증**
   - Edge Function에서 발신자와 수신자 관계 검증
   - 참여하지 않은 채팅방의 메시지는 알림 발송하지 않음

---

## 관련 파일

### Backend (Supabase)
- `supabase/functions/send-chat-notification/index.ts` - Edge Function
- Database Trigger: `notify_new_chat_message()`
- 테이블: `device_tokens`, `p2p_chat_messages`, `p2p_chat_participants`

### Frontend (Flutter)
- `lib/services/fcm_service.dart` - FCM 토큰 관리 및 알림 처리
- `lib/services/notification_service.dart` - 디바이스 토큰 등록
- `lib/services/chat_service.dart` - 채팅 메시지 전송

---

## 참고 자료

- [Supabase Edge Functions 문서](https://supabase.com/docs/guides/functions)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Firebase Cloud Messaging 문서](https://firebase.google.com/docs/cloud-messaging)
- [pg_net 확장](https://github.com/supabase/pg_net)
