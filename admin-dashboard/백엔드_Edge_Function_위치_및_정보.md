# 백엔드 Edge Function 위치 및 정보

## 1. Edge Function 위치

### 프로젝트 구조
```
/Users/admin/Desktop/workspace/smart-yoram-frontend/admin-dashboard/
├── supabase/
│   └── functions/
│       └── send-custom-notification/
│           └── index.ts  ← 관리자 메시지 발송 Edge Function
```

### 절대 경로
```
/Users/admin/Desktop/workspace/smart-yoram-frontend/admin-dashboard/supabase/functions/send-custom-notification/index.ts
```

---

## 2. Edge Function 정보

### 함수 이름
`send-custom-notification`

### Supabase 프로젝트
- **프로젝트 ID**: `adzhdsajdamrflvybhxq`
- **대시보드 URL**: https://supabase.com/dashboard/project/adzhdsajdamrflvybhxq/functions

### 배포 상태
✅ 이미 배포됨 (최근 업데이트: 2025-12-12)

---

## 3. Edge Function 엔드포인트

### 호출 URL
```
https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/send-custom-notification
```

### 인증 방식
- **Supabase 함수 호출** (프론트엔드에서)
  ```typescript
  const { data, error } = await supabaseApiService.supabase.functions.invoke(
    'send-custom-notification',
    {
      body: {
        church_id: 7,
        member_ids: [1, 2, 3],
        title: "제목",
        content: "내용",
        sender_user_id: 56
      }
    }
  );
  ```

---

## 4. 요청/응답 스펙

### 요청 Body
```typescript
{
  church_id: number;           // 교회 ID
  member_ids: number[];        // 발송 대상 교인 ID 배열
  title: string;               // 메시지 제목
  content: string;             // 메시지 내용
  sender_user_id?: number;     // 발송자 user ID (선택)
}
```

### 응답 예시 (성공)
```json
{
  "success": true,
  "message": "4/5개 디바이스에 알림 발송 완료",
  "notifications": [
    {
      "userId": "user-uuid-1",
      "platform": "ios",
      "success": true
    },
    {
      "userId": "user-uuid-2",
      "platform": "android",
      "success": true
    }
  ],
  "stats": {
    "totalMembers": 150,        // 선택된 총 교인 수
    "appUsers": 120,            // 앱에 가입한 교인 수
    "devicesSent": 200,         // 발송 성공한 디바이스 수
    "devicesFailed": 5          // 발송 실패한 디바이스 수
  }
}
```

---

## 5. FCM 발송 프로세스

### 단계별 흐름
1. **교인 정보 조회** (`members` 테이블)
   - `member_ids`로 교인 정보 조회
   - `user_id`가 있는 교인만 필터링

2. **FCM 토큰 조회** (`device_tokens` 테이블)
   - 앱에 가입한 사용자의 활성 토큰만 조회
   - `is_active = true` 필터링

3. **FCM 발송** (각 디바이스별)
   - FCM HTTP v1 API 사용
   - OAuth 2.0 액세스 토큰 자동 생성
   - 각 토큰에 개별 발송

4. **발송 기록 저장** (`message_send_history` 테이블)
   - 발송자 정보 (users.id, full_name)
   - 수신자 정보 (member_ids, recipient_count)
   - 발송 통계 (devices_sent, devices_failed)

---

## 6. 데이터베이스 테이블

### 사용하는 테이블
1. **members** - 교인 정보
2. **users** - 앱 사용자 정보 (발송자 이름 조회)
3. **device_tokens** - FCM 토큰 저장
4. **message_send_history** - 발송 기록

### device_tokens 테이블 구조
```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,          -- auth.users.id
  fcm_token TEXT NOT NULL,         -- FCM 등록 토큰
  platform VARCHAR(20),            -- 'ios' | 'android'
  is_active BOOLEAN DEFAULT true,  -- 토큰 활성 상태
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### message_send_history 테이블 구조
```sql
CREATE TABLE message_send_history (
  id UUID PRIMARY KEY,
  church_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,           -- users.id
  sender_name VARCHAR(255),             -- users.full_name
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  recipient_member_ids INTEGER[] NOT NULL,
  recipient_count INTEGER NOT NULL,
  app_user_count INTEGER DEFAULT 0,
  devices_sent INTEGER DEFAULT 0,
  devices_failed INTEGER DEFAULT 0,
  sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. 환경 변수

Edge Function에서 사용하는 환경 변수:

```bash
SUPABASE_URL=https://adzhdsajdamrflvybhxq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Service Role Key
FCM_SERVICE_ACCOUNT_JSON={...}         # Firebase Service Account JSON
```

**FCM_SERVICE_ACCOUNT_JSON** 형식:
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

## 8. 로그 확인 방법

### Supabase Dashboard에서 확인
1. https://supabase.com/dashboard/project/adzhdsajdamrflvybhxq/functions
2. `send-custom-notification` 클릭
3. "Logs" 탭 선택
4. 실시간 로그 확인

### 주요 로그 포인트
```
📨 관리자 메시지 발송: {churchId, memberCount, title, senderUserId}
🔍 발송자 정보 조회 시작: {sender_user_id, type}
📋 Users 조회 결과: {user, userError}
✅ 발송자 정보 조회 성공: {senderId, senderName}
📱 앱 사용자: X명 (전체 Y명 중)
📱 알림 발송 대상: Z개 디바이스
✅ FCM 알림 발송 성공 (user_id: ..., platform: ...)
✅ 발송 기록 저장 완료
```

---

## 9. 로컬 개발 (선택사항)

### Edge Function 로컬 실행
```bash
# 관리자 대시보드 프로젝트 위치에서
cd /Users/admin/Desktop/workspace/smart-yoram-frontend/admin-dashboard

# Supabase Functions 로컬 서버 시작
supabase functions serve send-custom-notification

# 테스트 호출
curl -X POST http://localhost:54321/functions/v1/send-custom-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "church_id": 7,
    "member_ids": [1, 2, 3],
    "title": "테스트 메시지",
    "content": "테스트 내용",
    "sender_user_id": 56
  }'
```

---

## 10. 문제 해결

### 1. FCM 토큰이 없는 경우
**증상**: "알림 수신 가능한 디바이스가 없습니다" 메시지
**원인**: `device_tokens` 테이블에 활성 토큰이 없음
**해결**:
- 앱에서 FCM 토큰 등록 확인
- `device_tokens` 테이블에 토큰이 저장되었는지 확인
- `is_active = true` 상태 확인

### 2. 발송자 이름이 "관리자"로 표시
**증상**: 발송 기록에 실제 이름 대신 "관리자"로 표시
**원인**: `users` 테이블에서 `sender_user_id`로 조회 실패
**해결**:
- `users` 테이블에 해당 ID의 레코드 존재 확인
- `full_name` 필드에 값이 있는지 확인

### 3. FCM 발송 실패
**증상**: 개별 디바이스 발송 실패
**원인**:
- 잘못된 FCM 토큰
- 만료된 토큰
- FCM 서비스 계정 권한 문제

**해결**:
- Edge Function 로그에서 FCM 오류 메시지 확인
- 토큰 갱신 필요 시 앱에서 재등록

---

## 11. 앱 개발자 액션 아이템

### 필수 구현
- [ ] FCM 토큰을 `device_tokens` 테이블에 저장하는 로직 구현
- [ ] 토큰 갱신 시 `device_tokens` 업데이트
- [ ] 앱 삭제 시 토큰 비활성화 (`is_active = false`)
- [ ] 푸시 알림 수신 핸들러 구현 (`notification_type: "custom"` 처리)

### 토큰 저장 예시
```dart
// FCM 토큰 가져오기
String? fcmToken = await FirebaseMessaging.instance.getToken();

// Supabase에 저장
await supabase.from('device_tokens').upsert({
  'user_id': currentUser.id,  // auth.users.id (UUID)
  'fcm_token': fcmToken,
  'platform': Platform.isIOS ? 'ios' : 'android',
  'is_active': true,
  'updated_at': DateTime.now().toIso8601String(),
});

// 토큰 갱신 리스너
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
  // DB에 새 토큰 업데이트
  supabase.from('device_tokens').update({
    'fcm_token': newToken,
    'updated_at': DateTime.now().toIso8601String(),
  }).eq('user_id', currentUser.id);
});
```

---

## 12. 연락처

문제 발생 시:
- 백엔드 Edge Function 파일 확인: `/Users/admin/Desktop/workspace/smart-yoram-frontend/admin-dashboard/supabase/functions/send-custom-notification/index.ts`
- Supabase 대시보드 로그 확인
- 프론트엔드 코드: `/Users/admin/Desktop/workspace/smart-yoram-frontend/admin-dashboard/src/components/MessageSending.tsx`
