# 중보기도 신청 API 연동 가이드

## 개요
모바일 앱에서 교인들이 중보기도를 신청하고 조회할 수 있는 API 엔드포인트입니다.

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
https://[YOUR_SUPABASE_PROJECT].supabase.co/functions/v1/prayer-requests
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

## 1. 기도 요청 생성 (POST)

### 엔드포인트
```
POST /prayer-requests/admin/requests
```

### 요청 본문 (Request Body)

#### 필수 필드
```json
{
  "church_id": 7,                    // 교회 ID
  "requester_name": "홍길동",         // 신청자 이름
  "requester_phone": "010-1234-5678", // 신청자 연락처
  "prayer_type": "general",          // 기도 유형
  "prayer_content": "기도 제목 내용",  // 기도 내용
  "is_anonymous": false,             // 익명 여부
  "is_urgent": false,                // 긴급 여부
  "is_public": true                  // 공개 여부
}
```

#### 선택 필드
```json
{
  "member_id": 456,                  // 교인 ID (members 테이블)
  "status": "active",                // 상태 (기본값: active)
  "expires_at": "2025-12-22T00:00:00Z" // 만료일 (기본값: 30일 후)
}
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 | 가능한 값 |
|------|------|------|------|-----------|
| church_id | number | ✅ | 교회 ID | 숫자 |
| member_id | number | ❌ | 교인 ID (등록된 교인인 경우) | members 테이블의 id |
| requester_name | string | ✅ | 신청자 이름 | - |
| requester_phone | string | ✅ | 신청자 연락처 | 전화번호 형식 |
| prayer_type | string | ✅ | 기도 유형 | general, healing, family, work, ministry |
| prayer_content | string | ✅ | 기도 내용 | - |
| is_anonymous | boolean | ✅ | 익명 여부 | true, false |
| is_urgent | boolean | ✅ | 긴급 여부 | true, false |
| is_public | boolean | ✅ | 공개 여부 (다른 교인들에게 보이기) | true, false |
| status | string | ❌ | 상태 (기본값: active) | active, answered, closed |
| expires_at | string | ❌ | 만료일 (기본값: 30일 후) | ISO 8601 형식 |

### prayer_type 값
- `general`: 일반 기도
- `healing`: 치유 기도
- `family`: 가정 기도
- `work`: 직장/사업 기도
- `ministry`: 사역 기도

### status 값
- `active`: 활성 (기본값)
- `answered`: 응답됨 (기도 응답됨)
- `closed`: 종료됨

### 응답 예시 (Success - 201)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "church_id": 7,
  "member_id": 456,
  "requester_name": "홍길동",
  "requester_phone": "010-1234-5678",
  "prayer_type": "healing",
  "prayer_content": "아버지의 건강 회복을 위해 기도 부탁드립니다.",
  "is_anonymous": false,
  "is_urgent": true,
  "is_public": true,
  "status": "active",
  "prayer_count": 0,
  "expires_at": "2025-12-22T00:00:00.000Z",
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
  "error": "Failed to create prayer request",
  "details": "에러 상세 메시지"
}
```

---

## 2. 내 기도 요청 조회 (GET)

사용자가 자신이 신청한 기도 요청을 조회합니다.

### 엔드포인트
```
GET /prayer-requests/admin/requests?member_id={member_id}
```

### 쿼리 파라미터
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| member_id | number | ❌ | 교인 ID (본인의 ID로 필터링) |
| church_id | number | ❌ | 교회 ID로 필터링 |
| status | string | ❌ | 상태 필터 (active, answered, closed) |
| prayer_type | string | ❌ | 기도 유형 필터 (general, healing, family, work, ministry) |
| is_urgent | boolean | ❌ | 긴급 여부 필터 |
| is_public | boolean | ❌ | 공개 여부 필터 |
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
      "prayer_type": "healing",
      "prayer_content": "아버지의 건강 회복을 위해 기도 부탁드립니다.",
      "is_anonymous": false,
      "is_urgent": true,
      "is_public": true,
      "status": "active",
      "prayer_count": 15,
      "answered_testimony": null,
      "admin_notes": null,
      "expires_at": "2025-12-22T00:00:00.000Z",
      "created_at": "2025-11-22T08:30:00.000Z",
      "updated_at": "2025-11-22T08:30:00.000Z",
      "closed_at": null
    }
  ],
  "count": 10,
  "page": 1,
  "limit": 50,
  "total_pages": 1
}
```

---

## 3. 공개 기도 요청 목록 조회 (GET)

모든 교인이 볼 수 있는 공개 기도 요청 목록을 조회합니다.

### 엔드포인트
```
GET /prayer-requests/admin/requests?church_id={church_id}&is_public=true&status=active
```

### 쿼리 파라미터
```
church_id: 교회 ID (필수)
is_public: true (공개 기도만 조회)
status: active (활성 기도만 조회)
```

### 응답 예시
```json
{
  "data": [
    {
      "id": "...",
      "requester_name": "홍길동",
      "prayer_type": "healing",
      "prayer_content": "...",
      "is_urgent": true,
      "prayer_count": 25,
      "created_at": "2025-11-20T00:00:00.000Z"
    }
  ],
  "count": 50,
  "page": 1,
  "limit": 50,
  "total_pages": 1
}
```

---

## 4. 특정 기도 요청 상세 조회 (GET)

### 엔드포인트
```
GET /prayer-requests/admin/requests/{id}
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
  "prayer_type": "healing",
  "prayer_content": "아버지의 건강 회복을 위해 기도 부탁드립니다.",
  "is_anonymous": false,
  "is_urgent": true,
  "is_public": true,
  "status": "answered",
  "prayer_count": 45,
  "answered_testimony": "하나님께 감사합니다. 아버지께서 건강을 회복하셨습니다!",
  "admin_notes": null,
  "expires_at": "2025-12-22T00:00:00.000Z",
  "created_at": "2025-11-22T08:30:00.000Z",
  "updated_at": "2025-11-25T10:00:00.000Z",
  "closed_at": "2025-11-25T10:00:00.000Z"
}
```

---

## 5. 기도 요청 수정 (PUT)

본인이 등록한 기도 요청을 수정합니다.

### 엔드포인트
```
PUT /prayer-requests/admin/requests
```

### 요청 본문
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "prayer_content": "수정된 기도 내용",
  "is_public": false,
  "is_urgent": false
}
```

### 응답 예시
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "prayer_content": "수정된 기도 내용",
  "is_public": false,
  "is_urgent": false,
  "updated_at": "2025-11-22T09:00:00.000Z"
}
```

---

## 6. 기도 요청 삭제 (DELETE)

본인이 등록한 기도 요청을 삭제합니다.

### 엔드포인트
```
DELETE /prayer-requests/admin/requests
```

### 요청 본문
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 응답 예시
```json
{
  "message": "Prayer request deleted successfully"
}
```

---

## 7. 기도했습니다 (기도 카운트 증가)

다른 교인의 기도 요청에 "기도했습니다" 버튼을 누를 때 사용합니다.

### 엔드포인트
```
POST /prayer-requests/admin/requests
```

### 요청 본문
```json
{
  "action": "pray",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 응답 예시
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "prayer_count": 16,
  "updated_at": "2025-11-22T09:30:00.000Z"
}
```

---

## 8. 기도 응답 간증 등록

본인의 기도 요청이 응답되었을 때 간증을 등록합니다.

### 엔드포인트
```
POST /prayer-requests/admin/requests
```

### 요청 본문
```json
{
  "action": "answer",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "answered_testimony": "하나님께 감사합니다. 아버지께서 건강을 회복하셨습니다!"
}
```

### 응답 예시
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "answered",
  "answered_testimony": "하나님께 감사합니다. 아버지께서 건강을 회복하셨습니다!",
  "closed_at": "2025-11-25T10:00:00.000Z",
  "updated_at": "2025-11-25T10:00:00.000Z"
}
```

---

## 사용 예시

### JavaScript (Fetch API)
```javascript
// ⚠️ 먼저 Supabase Anon Key를 설정하세요
const SUPABASE_URL = 'https://[YOUR_PROJECT].supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Supabase Dashboard에서 복사

// 기도 요청 생성
async function createPrayerRequest(userId, prayerData) {
  const timestamp = Date.now();
  const userToken = `temp_token_${userId}_${timestamp}`;

  const requestBody = {
    church_id: prayerData.churchId,
    member_id: prayerData.memberId,
    requester_name: prayerData.name,
    requester_phone: prayerData.phone,
    prayer_type: prayerData.prayerType,  // general, healing, family, work, ministry
    prayer_content: prayerData.content,
    is_anonymous: prayerData.isAnonymous || false,
    is_urgent: prayerData.isUrgent || false,
    is_public: prayerData.isPublic !== undefined ? prayerData.isPublic : true
  };

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/prayer-requests/admin/requests`,
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
    throw new Error(error.error || '기도 요청 등록에 실패했습니다.');
  }

  return await response.json();
}

// 공개 기도 요청 목록 조회
async function getPublicPrayerRequests(userId, churchId) {
  const timestamp = Date.now();
  const userToken = `temp_token_${userId}_${timestamp}`;

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/prayer-requests/admin/requests?church_id=${churchId}&is_public=true&status=active`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,  // ✅ 필수!
        'X-Custom-Auth': userToken                       // ✅ 필수!
      }
    }
  );

  if (!response.ok) {
    throw new Error('기도 요청 목록 조회에 실패했습니다.');
  }

  return await response.json();
}

// 기도했습니다 (기도 카운트 증가)
async function prayForRequest(userId, requestId) {
  const timestamp = Date.now();
  const userToken = `temp_token_${userId}_${timestamp}`;

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/prayer-requests/admin/requests`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,  // ✅ 필수!
        'X-Custom-Auth': userToken,                      // ✅ 필수!
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'pray',
        request_id: requestId
      })
    }
  );

  if (!response.ok) {
    throw new Error('기도 카운트 증가에 실패했습니다.');
  }

  return await response.json();
}

// 기도 응답 간증 등록
async function submitTestimony(userId, requestId, testimony) {
  const timestamp = Date.now();
  const userToken = `temp_token_${userId}_${timestamp}`;

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/prayer-requests/admin/requests`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,  // ✅ 필수!
        'X-Custom-Auth': userToken,                      // ✅ 필수!
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'answer',
        request_id: requestId,
        answered_testimony: testimony
      })
    }
  );

  if (!response.ok) {
    throw new Error('간증 등록에 실패했습니다.');
  }

  return await response.json();
}
```

### React Native 예시
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// ⚠️ 앱 설정 파일이나 환경 변수에 저장
const SUPABASE_URL = 'https://[YOUR_PROJECT].supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const PrayerRequestScreen = () => {
  const [prayerData, setPrayerData] = useState({
    content: '',
    prayerType: 'general',
    isAnonymous: false,
    isUrgent: false,
    isPublic: true
  });

  const submitPrayerRequest = async () => {
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
        `${SUPABASE_URL}/functions/v1/prayer-requests/admin/requests`,
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
            prayer_type: prayerData.prayerType,
            prayer_content: prayerData.content,
            is_anonymous: prayerData.isAnonymous,
            is_urgent: prayerData.isUrgent,
            is_public: prayerData.isPublic
          })
        }
      );

      const result = await response.json();

      if (response.ok) {
        Alert.alert('성공', '기도 요청이 등록되었습니다.');
        // 화면 이동 또는 초기화
      } else {
        Alert.alert('오류', result.error || '기도 요청 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('기도 요청 오류:', error);
      Alert.alert('오류', '기도 요청 등록 중 문제가 발생했습니다.');
    }
  };

  const handlePray = async (requestId) => {
    try {
      const userInfo = JSON.parse(await AsyncStorage.getItem('userInfo'));
      const userId = userInfo.id;
      const timestamp = Date.now();
      const userToken = `temp_token_${userId}_${timestamp}`;

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/prayer-requests/admin/requests`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': userToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'pray',
            request_id: requestId
          })
        }
      );

      if (response.ok) {
        Alert.alert('감사합니다', '기도했습니다.');
      }
    } catch (error) {
      console.error('기도 카운트 오류:', error);
    }
  };

  return (
    // UI 컴포넌트
  );
};
```

### curl 예시 (테스트용)
```bash
# ⚠️ YOUR_ANON_KEY를 실제 Supabase Anon Key로 교체하세요!

# 기도 요청 생성
curl -X POST \
  https://[YOUR_PROJECT].supabase.co/functions/v1/prayer-requests/admin/requests \
  -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
  -H 'X-Custom-Auth: temp_token_123_1732258800000' \
  -H 'Content-Type: application/json' \
  -d '{
    "church_id": 7,
    "member_id": 456,
    "requester_name": "홍길동",
    "requester_phone": "010-1234-5678",
    "prayer_type": "healing",
    "prayer_content": "아버지의 건강 회복을 위해 기도 부탁드립니다.",
    "is_anonymous": false,
    "is_urgent": true,
    "is_public": true
  }'

# 공개 기도 요청 목록 조회
curl -X GET \
  'https://[YOUR_PROJECT].supabase.co/functions/v1/prayer-requests/admin/requests?church_id=7&is_public=true&status=active' \
  -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
  -H 'X-Custom-Auth: temp_token_123_1732258800000'

# 기도했습니다
curl -X POST \
  https://[YOUR_PROJECT].supabase.co/functions/v1/prayer-requests/admin/requests \
  -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
  -H 'X-Custom-Auth: temp_token_123_1732258800000' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "pray",
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
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

6. **필수 필드**: requester_name, requester_phone, prayer_content, prayer_type은 필수입니다.

7. **공개 여부 (is_public)**:
   - `true`: 모든 교인에게 보임 (기본값)
   - `false`: 본인과 관리자만 볼 수 있음

8. **익명 여부 (is_anonymous)**:
   - `true`: 이름이 숨겨짐 (익명으로 표시)
   - `false`: 이름이 공개됨 (기본값)

9. **만료일 (expires_at)**:
   - 기본값: 등록일로부터 30일 후
   - 만료된 기도 요청은 자동으로 목록에서 제외됨

10. **기도 카운트**:
    - 한 사용자가 같은 기도 요청에 여러 번 "기도했습니다"를 누를 수 있음
    - 중복 방지가 필요한 경우 클라이언트에서 처리 필요

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
