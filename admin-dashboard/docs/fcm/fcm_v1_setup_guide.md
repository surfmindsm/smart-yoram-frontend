# FCM HTTP v1 API 설정 가이드

## 중요: 레거시 API 중단

**Cloud Messaging API (레거시)는 2024년 6월 20일부로 완전히 중단되었습니다.**
반드시 **FCM HTTP v1 API**를 사용해야 합니다.

---

## Firebase Service Account JSON 파일 다운로드

### 1단계: Firebase Console 접속

1. https://console.firebase.google.com/ 접속
2. 프로젝트 선택

### 2단계: Service Account 키 생성

1. **⚙️ 프로젝트 설정** 클릭
2. **서비스 계정** 탭 선택
3. **새 비공개 키 생성** 버튼 클릭
4. **키 생성** 확인
5. JSON 파일이 자동으로 다운로드됩니다

**파일명 예시:** `your-project-id-firebase-adminsdk-xxxxx.json`

### 3단계: JSON 파일 내용 확인

다운로드한 JSON 파일은 다음과 같은 구조입니다:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

---

## Supabase Secrets 설정

### Service Account JSON 등록

터미널에서 실행:

```bash
cd admin-dashboard

# JSON 파일을 한 줄로 변환하여 설정
# macOS/Linux:
supabase secrets set FCM_SERVICE_ACCOUNT_JSON="$(cat path/to/your-firebase-service-account.json | tr -d '\n')"

# 또는 직접 복사-붙여넣기:
supabase secrets set FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-id",...}'
```

### 설정 확인

```bash
supabase secrets list
```

출력 예시:
```
FCM_SERVICE_ACCOUNT_JSON
```

---

## SQL 실행

### 1단계: Supabase SQL Editor에서 실행

`admin-dashboard/docs/sql/chat_push_notification_setup.sql` 파일의 전체 내용을 복사하여 Supabase SQL Editor에서 실행합니다.

이 SQL은 다음을 자동으로 설정합니다:
- pg_net 확장 설치
- device_tokens 테이블 생성
- Database Trigger Function 생성
- Trigger 생성

### 2단계: 설정 확인

```sql
-- pg_net 확장 확인
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Trigger 확인
SELECT * FROM pg_trigger WHERE tgname = 'on_chat_message_created';

-- device_tokens 테이블 확인
\d device_tokens;
```

---

## 테스트

### 1. 테스트 메시지 전송

실제 존재하는 채팅방 ID와 사용자 ID로 테스트:

```sql
INSERT INTO p2p_chat_messages
(room_id, sender_id, sender_name, message, message_type)
VALUES (1, 123, '테스트 사용자', '푸시 알림 테스트', 'text');
```

### 2. Edge Function Logs 확인

Supabase Dashboard → Edge Functions → send-chat-notification → Logs

성공 로그 예시:
```
📩 새 채팅 메시지 알림 발송: { messageId: 1, roomId: 1, senderId: 123 }
✅ FCM 알림 발송 성공 (user_id: 456, platform: android)
```

실패 시 확인사항:
- FCM_SERVICE_ACCOUNT_JSON이 올바르게 설정되었는지
- Service Account JSON의 project_id가 정확한지
- FCM 토큰이 device_tokens 테이블에 저장되어 있는지

---

## Flutter 앱 연동

### FCM 토큰 저장

Flutter 앱에서 FCM 토큰을 Supabase에 저장해야 합니다.

`lib/services/fcm_service.dart` 예시:

```dart
Future<void> _saveTokenToDatabase(String token) async {
  final user = await _authService.getCurrentUser();
  if (user.data == null) return;

  await Supabase.instance.client.from('device_tokens').upsert({
    'user_id': user.data!.id,
    'fcm_token': token,
    'platform': Platform.isAndroid ? 'android' : 'ios',
    'is_active': true,
    'updated_at': DateTime.now().toIso8601String(),
  });
}
```

### 알림 탭 처리

```dart
void _handleNotificationTap(RemoteMessage message) {
  final data = message.data;
  final type = data['type'];

  if (type == 'chat_message') {
    final roomId = int.tryParse(data['room_id'] ?? '');
    if (roomId != null) {
      navigatorKey.currentState?.pushNamed(
        '/chat-room',
        arguments: {'room_id': roomId},
      );
    }
  }
}
```

---

## 문제 해결

### 1. "FCM_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다"

```bash
# Secrets 확인
supabase secrets list

# 재설정
supabase secrets set FCM_SERVICE_ACCOUNT_JSON='...'
```

### 2. "Invalid JWT Signature"

- Service Account JSON의 `private_key`가 올바른지 확인
- JSON 문자열이 손상되지 않았는지 확인 (줄바꿈 제거 필요)

### 3. "Permission denied"

- Firebase 프로젝트에서 Cloud Messaging API가 활성화되었는지 확인
- Service Account에 "Firebase Cloud Messaging API Admin" 권한이 있는지 확인

### 4. FCM 토큰이 만료됨

Flutter 앱에서 토큰 갱신 로직 추가:

```dart
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
  _saveTokenToDatabase(newToken);
});
```

---

## 보안 참고사항

### ✅ 안전한 방법

- Service Account JSON을 Supabase Secrets에 저장
- Edge Function에서만 사용
- SECURITY DEFINER로 Database Function 보호

### ❌ 위험한 방법

- Service Account JSON을 코드에 직접 포함
- GitHub 저장소에 커밋
- 클라이언트 앱에 포함

---

## 관련 링크

- [FCM HTTP v1 API 문서](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Firebase Service Account](https://firebase.google.com/docs/admin/setup#initialize-sdk)

---

## 요약

1. ✅ Firebase Console에서 Service Account JSON 다운로드
2. ✅ `supabase secrets set FCM_SERVICE_ACCOUNT_JSON='...'` 실행
3. ✅ SQL 스크립트 실행 (`chat_push_notification_setup.sql`)
4. ✅ Flutter 앱에서 FCM 토큰 저장 로직 구현
5. ✅ 테스트 메시지로 동작 확인

완료! 🎉
