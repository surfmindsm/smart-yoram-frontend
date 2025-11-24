# 심방 신청 API 연동 가이드

## 개요
모바일 앱에서 교인들이 심방을 신청할 수 있는 API 엔드포인트입니다.

## 🚀 빠른 시작

가장 중요한 3가지:

1. **두 개의 헤더 필수**:
   ```javascript
   headers: {
     'Authorization': 'Bearer {SUPABASE_ANON_KEY}',      // Supabase 공개 키
     'X-Custom-Auth': 'temp_token_{userId}_{timestamp}', // 사용자 토큰
     'Content-Type': 'application/json'
   }
   ```

2. **Supabase Anon Key 확인**:
   - Supabase Dashboard → Settings → API
   - "Project API keys"에서 `anon` `public` 키 복사
   - 예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **사용자 토큰 생성**:
   ```javascript
   const userToken = `temp_token_${userId}_${Date.now()}`;
   ```

## Base URL
```
https://[YOUR_SUPABASE_PROJECT].supabase.co/functions/v1/pastoral-care
```

## 인증

모든 요청에 **두 개의 헤더가 필요**합니다.

### 필수 헤더
```
Authorization: Bearer {SUPABASE_ANON_KEY}
X-Custom-Auth: temp_token_{user_id}_{timestamp}
Content-Type: application/json
```

⚠️ **매우 중요**:
1. `Authorization` 헤더에는 **Supabase Anon Key**를 넣어야 합니다 (사용자 토큰 ❌)
2. `X-Custom-Auth` 헤더에는 **사용자 인증 토큰**(`temp_token_...`)을 넣어야 합니다
3. 두 헤더 모두 필수입니다!

### Supabase Anon Key 확인 방법
1. Supabase Dashboard → Settings → API
2. "Project API keys" 섹션에서 `anon` `public` 키 복사
3. 이 키는 공개 키이므로 클라이언트에서 사용해도 안전합니다

### 사용자 토큰 형식
- `user_id`: 사용자 ID (숫자)
- `timestamp`: 현재 시간의 밀리초 타임스탬프
- 토큰 유효기간: 24시간

### 토큰 생성 예시 (JavaScript)
```javascript
const userId = 123; // 로그인한 사용자 ID
const timestamp = Date.now();
const userToken = `temp_token_${userId}_${timestamp}`;

// Supabase Anon Key (프로젝트 설정에서 가져옴)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## 1. 심방 신청 생성 (POST)

### 엔드포인트
```
POST /pastoral-care/admin/requests
```

### 요청 본문 (Request Body)

#### 필수 필드
```json
{
  "church_id": 7,                    // 교회 ID
  "requester_name": "홍길동",         // 신청자 이름
  "requester_phone": "010-1234-5678", // 신청자 연락처
  "request_type": "general",          // 심방 유형
  "request_content": "심방 신청 내용",  // 신청 내용
  "priority": "normal",               // 우선순위
  "is_urgent": false                  // 긴급 여부
}
```

#### 선택 필드
```json
{
  "member_id": 456,                           // 교인 ID (members 테이블)
  "preferred_date": "2025-11-25",             // 희망 방문일
  "preferred_time_start": "14:00",            // 희망 시작 시간
  "preferred_time_end": "15:00",              // 희망 종료 시간
  "address": "서울시 강남구 테헤란로 123",      // 방문 주소
  "contact_info": "2층 201호, 초인종 사용",    // 추가 연락처 정보
  "status": "pending"                         // 상태 (기본값: pending)
}
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 | 가능한 값 |
|------|------|------|------|-----------|
| church_id | number | ✅ | 교회 ID | 숫자 |
| member_id | number | ❌ | 교인 ID (등록된 교인인 경우) | members 테이블의 id |
| requester_name | string | ✅ | 신청자 이름 | - |
| requester_phone | string | ✅ | 신청자 연락처 | 전화번호 형식 |
| request_type | string | ✅ | 심방 유형 | general, urgent, hospital, counseling |
| request_content | string | ✅ | 신청 내용 | - |
| preferred_date | string | ❌ | 희망 방문일 | YYYY-MM-DD |
| preferred_time_start | string | ❌ | 희망 시작 시간 | HH:MM |
| preferred_time_end | string | ❌ | 희망 종료 시간 | HH:MM |
| priority | string | ✅ | 우선순위 | urgent, high, normal, low |
| status | string | ❌ | 상태 (기본값: pending) | pending, approved, scheduled, in_progress, completed, cancelled |
| address | string | ❌ | 방문 주소 | - |
| contact_info | string | ❌ | 추가 연락처 정보 | - |
| is_urgent | boolean | ✅ | 긴급 여부 | true, false |

### request_type 값
- `general`: 일반 심방
- `urgent`: 긴급 심방
- `hospital`: 병원 심방
- `counseling`: 상담

### priority 값
- `urgent`: 긴급
- `high`: 높음
- `normal`: 보통 (일반적으로 사용)
- `low`: 낮음

### 응답 예시 (Success - 201)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "church_id": 7,
  "member_id": 456,
  "requester_name": "홍길동",
  "requester_phone": "010-1234-5678",
  "request_type": "general",
  "request_content": "심방 신청 내용",
  "preferred_date": "2025-11-25",
  "preferred_time_start": "14:00",
  "preferred_time_end": "15:00",
  "priority": "normal",
  "status": "pending",
  "address": "서울시 강남구 테헤란로 123",
  "contact_info": "2층 201호, 초인종 사용",
  "is_urgent": false,
  "created_at": "2025-11-22T08:30:00.000Z",
  "updated_at": "2025-11-22T08:30:00.000Z"
}
```

### 에러 응답 예시 (Error - 401)
```json
{
  "error": "Missing authentication"
}
```

### 에러 응답 예시 (Error - 500)
```json
{
  "error": "Failed to create pastoral care request",
  "details": "에러 상세 메시지"
}
```

---

## 2. 내 심방 신청 조회 (GET)

사용자가 자신이 신청한 심방 내역을 조회합니다.

### 엔드포인트
```
GET /pastoral-care/admin/requests?member_id={member_id}
```

### 쿼리 파라미터
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| member_id | number | ✅ | 교인 ID (본인의 ID) |
| status | string | ❌ | 상태 필터 (pending, approved, scheduled, completed, cancelled) |
| priority | string | ❌ | 우선순위 필터 (urgent, high, normal, low) |
| request_type | string | ❌ | 심방 유형 필터 (general, urgent, hospital, counseling) |
| page | number | ❌ | 페이지 번호 (기본값: 1) |
| limit | number | ❌ | 페이지당 항목 수 (기본값: 50) |

### 응답 예시
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "church_id": 7,
      "member_id": 456,
      "requester_name": "홍길동",
      "requester_phone": "010-1234-5678",
      "organization_name": "청년부",
      "department": "예배팀",
      "profile_photo_url": "https://...",
      "request_type": "general",
      "request_content": "심방 신청 내용",
      "preferred_date": "2025-11-25",
      "preferred_time_start": "14:00",
      "preferred_time_end": "15:00",
      "priority": "normal",
      "status": "pending",
      "address": "서울시 강남구 테헤란로 123",
      "contact_info": "2층 201호",
      "is_urgent": false,
      "created_at": "2025-11-22T08:30:00.000Z",
      "updated_at": "2025-11-22T08:30:00.000Z"
    }
  ],
  "count": 10,
  "page": 1,
  "limit": 50,
  "total_pages": 1
}
```

---

## 3. 특정 심방 신청 상세 조회 (GET)

### 엔드포인트
```
GET /pastoral-care/admin/requests/{id}
```

### 응답 예시
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "church_id": 7,
  "member_id": 456,
  "requester_name": "홍길동",
  "requester_phone": "010-1234-5678",
  "organization_name": "청년부",
  "department": "예배팀",
  "profile_photo_url": "https://...",
  "request_type": "general",
  "request_content": "심방 신청 내용",
  "preferred_date": "2025-11-25",
  "preferred_time_start": "14:00",
  "preferred_time_end": "15:00",
  "priority": "normal",
  "status": "scheduled",
  "scheduled_date": "2025-11-25",
  "scheduled_time": "14:00",
  "assigned_pastor_id": 10,
  "address": "서울시 강남구 테헤란로 123",
  "contact_info": "2층 201호",
  "is_urgent": false,
  "created_at": "2025-11-22T08:30:00.000Z",
  "updated_at": "2025-11-22T09:00:00.000Z"
}
```

---

## 상태(Status) 흐름

```
pending (대기중)
  ↓
approved (승인됨)
  ↓
scheduled (예정됨)
  ↓
in_progress (진행중)
  ↓
completed (완료)
```

또는

```
pending (대기중)
  ↓
cancelled (취소)
```

---

## 사용 예시

### JavaScript (Fetch API)
```javascript
// ⚠️ 먼저 Supabase Anon Key를 설정하세요
const SUPABASE_URL = 'https://[YOUR_PROJECT].supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Supabase Dashboard에서 복사

// 심방 신청 생성
async function createPastoralCareRequest(userId, memberData) {
  const timestamp = Date.now();
  const userToken = `temp_token_${userId}_${timestamp}`;

  const requestBody = {
    church_id: memberData.churchId,
    member_id: memberData.memberId,
    requester_name: memberData.name,
    requester_phone: memberData.phone,
    request_type: 'general', // general, urgent, hospital, counseling
    request_content: memberData.content,
    preferred_date: memberData.preferredDate, // "2025-11-25"
    preferred_time_start: memberData.timeStart, // "14:00"
    preferred_time_end: memberData.timeEnd, // "15:00"
    priority: 'normal', // urgent, high, normal, low
    address: memberData.address,
    contact_info: memberData.contactInfo,
    is_urgent: false
  };

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/pastoral-care/admin/requests`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,  // ✅ 필수!
        'X-Custom-Auth': userToken,                      // ✅ 필수!
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '심방 신청에 실패했습니다.');
  }

  return await response.json();
}

// 내 심방 신청 내역 조회
async function getMyPastoralCareRequests(userId, memberId) {
  const timestamp = Date.now();
  const userToken = `temp_token_${userId}_${timestamp}`;

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/pastoral-care/admin/requests?member_id=${memberId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,  // ✅ 필수!
        'X-Custom-Auth': userToken                       // ✅ 필수!
      }
    }
  );

  if (!response.ok) {
    throw new Error('심방 신청 내역 조회에 실패했습니다.');
  }

  return await response.json();
}
```

### curl 예시 (테스트용)
```bash
# ⚠️ YOUR_ANON_KEY를 실제 Supabase Anon Key로 교체하세요!

# 심방 신청 생성
curl -X POST \
  https://[YOUR_PROJECT].supabase.co/functions/v1/pastoral-care/admin/requests \
  -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
  -H 'X-Custom-Auth: temp_token_123_1732258800000' \
  -H 'Content-Type: application/json' \
  -d '{
    "church_id": 7,
    "member_id": 456,
    "requester_name": "홍길동",
    "requester_phone": "010-1234-5678",
    "request_type": "general",
    "request_content": "심방을 신청합니다.",
    "preferred_date": "2025-11-25",
    "preferred_time_start": "14:00",
    "preferred_time_end": "15:00",
    "priority": "normal",
    "address": "서울시 강남구",
    "is_urgent": false
  }'

# 내 심방 신청 내역 조회
curl -X GET \
  'https://[YOUR_PROJECT].supabase.co/functions/v1/pastoral-care/admin/requests?member_id=456' \
  -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
  -H 'X-Custom-Auth: temp_token_123_1732258800000'
```

### React Native 예시
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ 앱 설정 파일이나 환경 변수에 저장
const SUPABASE_URL = 'https://[YOUR_PROJECT].supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const PastoralCareRequestScreen = () => {
  const [requestData, setRequestData] = useState({
    content: '',
    preferredDate: '',
    timeStart: '',
    timeEnd: '',
    address: '',
    contactInfo: '',
    requestType: 'general'
  });

  const submitRequest = async () => {
    try {
      // 저장된 사용자 정보 가져오기
      const userInfo = JSON.parse(await AsyncStorage.getItem('userInfo'));
      const userId = userInfo.id;
      const memberId = userInfo.member_id;
      const churchId = userInfo.church_id;

      // 사용자 토큰 생성
      const timestamp = Date.now();
      const userToken = `temp_token_${userId}_${timestamp}`;

      // API 요청
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/pastoral-care/admin/requests`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,  // ✅ 필수!
            'X-Custom-Auth': userToken,                      // ✅ 필수!
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            church_id: churchId,
            member_id: memberId,
            requester_name: userInfo.name,
            requester_phone: userInfo.phone,
            request_type: requestData.requestType,
            request_content: requestData.content,
            preferred_date: requestData.preferredDate,
            preferred_time_start: requestData.timeStart,
            preferred_time_end: requestData.timeEnd,
            priority: 'normal',
            address: requestData.address,
            contact_info: requestData.contactInfo,
            is_urgent: false
          })
        }
      );

      const result = await response.json();

      if (response.ok) {
        Alert.alert('성공', '심방 신청이 완료되었습니다.');
        // 화면 이동 또는 초기화
      } else {
        Alert.alert('오류', result.error || '심방 신청에 실패했습니다.');
      }
    } catch (error) {
      console.error('심방 신청 오류:', error);
      Alert.alert('오류', '심방 신청 중 문제가 발생했습니다.');
    }
  };

  return (
    // UI 컴포넌트
  );
};
```

---

## 주의사항

1. **인증 헤더 (매우 중요!)**:
   - ✅ **필수**: 두 개의 헤더를 모두 전달해야 합니다
     ```
     Authorization: Bearer {SUPABASE_ANON_KEY}
     X-Custom-Auth: temp_token_{user_id}_{timestamp}
     ```
   - ❌ **잘못된 사용법**:
     - `Authorization: Bearer temp_token_...` → Invalid JWT 에러
     - `X-Custom-Auth`만 사용 → Missing authentication 에러
     - 둘 중 하나라도 빠지면 에러 발생

2. **Supabase Anon Key**:
   - Supabase Dashboard → Settings → API → "anon public" 키
   - 이 키는 공개 키이므로 클라이언트(모바일 앱, 웹)에서 사용 가능
   - 프로젝트마다 다르니 반드시 본인 프로젝트의 키를 사용

3. **토큰 유효기간**: 24시간 (86400000ms). 만료된 토큰 사용 시 "Token expired" 에러 발생

4. **Church ID**: 사용자의 교회 ID를 정확히 전달해야 합니다.

5. **Member ID**: 등록된 교인인 경우 member_id를 전달하면 조직, 부서, 프로필 사진 정보가 자동으로 연동됩니다.

6. **필수 필드**: requester_name, requester_phone, request_content, request_type은 필수입니다.

7. **날짜 형식**: 날짜는 `YYYY-MM-DD`, 시간은 `HH:MM` 형식을 사용합니다.

8. **에러 처리**: API 응답의 status code와 error 메시지를 확인하여 적절히 처리합니다.

---

## CORS 설정

Edge Function은 모든 origin에서 접근 가능하도록 설정되어 있습니다.
```
Access-Control-Allow-Origin: *
```

---

## 트러블슈팅

### 자주 발생하는 에러

#### 1. "Invalid JWT" 에러
```json
{
  "error": "Invalid JWT"
}
```
**원인**: `Authorization: Bearer` 헤더에 사용자 토큰(`temp_token_...`)을 넣었을 때 발생
**해결**: `Authorization` 헤더에는 **Supabase Anon Key**를 넣어야 합니다

**올바른 예시**:
```javascript
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // ✅ Supabase Anon Key
  'X-Custom-Auth': 'temp_token_123_1732258800000',                   // ✅ 사용자 토큰
  'Content-Type': 'application/json'
}
```

**잘못된 예시**:
```javascript
headers: {
  'Authorization': 'Bearer temp_token_123_1732258800000', // ❌ 사용자 토큰 넣으면 에러!
  'Content-Type': 'application/json'
}
```

#### 2. "Missing authentication" 에러
```json
{
  "error": "Missing authentication"
}
```
**원인**: `Authorization` 또는 `X-Custom-Auth` 헤더 중 하나라도 빠진 경우
**해결**: 두 헤더 모두 전송해야 합니다

```javascript
headers: {
  'Authorization': 'Bearer {SUPABASE_ANON_KEY}',  // ✅ 필수!
  'X-Custom-Auth': 'temp_token_{user_id}_{timestamp}', // ✅ 필수!
  'Content-Type': 'application/json'
}
```

#### 3. "Invalid token structure" 에러
```json
{
  "error": "Invalid token structure"
}
```
**원인**: 토큰 형식이 잘못됨 (temp_token_{user_id}_{timestamp} 형식이 아님)
**해결**: 토큰 생성 코드를 확인하세요
```javascript
const token = `temp_token_${userId}_${Date.now()}`; // 올바른 형식
```

#### 4. "Token expired" 에러
```json
{
  "error": "Token expired"
}
```
**원인**: 토큰이 24시간이 지나 만료됨
**해결**: 새로운 타임스탬프로 토큰을 다시 생성하세요

#### 5. CORS 에러
```
Access to fetch has been blocked by CORS policy
```
**원인**: OPTIONS preflight 요청 실패
**해결**:
- Supabase Edge Function이 올바르게 배포되었는지 확인
- 브라우저 개발자 도구 Network 탭에서 OPTIONS 요청 확인
- Edge Function 로그에서 CORS 헤더 확인

---

## 문의

API 연동 중 문제가 발생하면 백엔드 개발팀에 문의하세요.

### 디버깅 팁
1. 브라우저 개발자 도구 → Network 탭에서 요청 헤더 확인
2. Response 탭에서 정확한 에러 메시지 확인
3. Supabase Dashboard → Edge Functions → Logs에서 서버 로그 확인
