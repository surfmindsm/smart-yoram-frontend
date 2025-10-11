# 모바일 앱 회원가입 API 가이드

> 📱 **모바일 개발자를 위한 회원가입 API 완벽 가이드**
>
> 스마트요람 앱에서 교회 관리자 가입과 커뮤니티 회원 가입을 구현하는 방법을 설명합니다.

## ⚡ 핵심 요약 (바쁜 분들을 위해)

**모바일 앱에서 호출해야 할 API:**

1. **교회 가입**: `POST /functions/v1/church-applications`
2. **커뮤니티 가입**: `POST /functions/v1/community-applications`
3. **로그인**: Supabase Auth `signInWithPassword`

**이메일 알림 (`notify-application`):**
- ✅ `community-applications`에서 **자동 호출** (이미 구현됨)
- ⚠️ `church-applications`에서 **미구현** (추가 예정)
- 📧 관리자(`surfmind.sm@gmail.com`)에게 자동 발송
- 🔔 **모바일 앱에서 직접 호출하지 않음**

---

## 📑 목차

1. [개요](#개요)
2. [📌 빠른 시작: 사용할 Edge Function 엔드포인트](#-빠른-시작-사용할-edge-function-엔드포인트)
   - [1️⃣ 교회 관리자 가입](#1️⃣-교회-관리자-가입)
   - [2️⃣ 커뮤니티 회원 가입](#2️⃣-커뮤니티-회원-가입)
   - [3️⃣ 로그인 (승인 후)](#3️⃣-로그인-승인-후)
   - [🔔 이메일 알림은 어떻게 발송되나요?](#-이메일-알림은-어떻게-발송되나요)
3. [1. 교회 관리자 가입 상세](#1-교회-관리자-가입)
4. [2. 커뮤니티 회원 가입 상세](#2-커뮤니티-회원-가입)
5. [3. 공통 사항](#3-공통-사항)
6. [4. 테스트 방법](#4-테스트-방법)
7. [5. 승인 후 로그인 프로세스](#5-승인-후-로그인-프로세스)
8. [6. FAQ](#6-faq)
9. [7. 이메일 알림 시스템 상세](#7-이메일-알림-시스템-상세)

---

## 개요

스마트요람 모바일 앱에서 사용할 수 있는 두 가지 회원가입 방식을 제공합니다:

1. **교회 관리자 가입** - 교회를 등록하고 관리자 계정을 생성
2. **커뮤니티 회원 가입** - 일반 사용자, 사업자, 기관 등이 커뮤니티 기능만 사용

## 기술 스택

- **백엔드**: Supabase Edge Functions (Deno runtime)
- **데이터베이스**: PostgreSQL with Row Level Security (RLS)
- **인증**: Supabase Auth
- **배포**: Supabase Functions

---

## 📌 빠른 시작: 사용할 Edge Function 엔드포인트

모바일 앱에서 회원가입 구현 시 다음 Edge Function을 사용하세요:

### 1️⃣ 교회 관리자 가입

```
POST https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/church-applications
```

**사용 시나리오:**
- 교회 담당자가 교회를 등록하고 관리자 계정을 만들 때
- 교회 관리 기능 + 커뮤니티 기능 모두 필요한 경우

**필수 필드:** `church_name`, `pastor_name`, `admin_name`, `email`, `phone`, `address`, `description`, `agree_terms`, `agree_privacy`

**결과:**
1. 신청서가 `church_applications` 테이블에 저장됨
2. 관리자(`surfmind.sm@gmail.com`)에게 알림 이메일 발송
3. 관리자 승인 후 교회 계정 생성 및 로그인 정보 이메일 발송

---

### 2️⃣ 커뮤니티 회원 가입

```
POST https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-applications
```

**사용 시나리오:**
- 개인 사용자, 기업, 음악사역자, 비영리단체 등이 가입할 때
- 커뮤니티 기능(무료나눔, 구인구직 등)만 필요한 경우
- 교회 소속 없이 서비스 이용

**필수 필드:** `applicant_type`, `organization_name`, `contact_person`, `email`, `phone`, `description`, `agree_terms`, `agree_privacy`

**결과:**
1. 신청서가 `community_applications` 테이블에 저장됨
2. 관리자(`surfmind.sm@gmail.com`)에게 알림 이메일 발송 (자동)
3. 관리자 승인 후 커뮤니티 회원 계정 생성 및 로그인 정보 이메일 발송 (자동)

---

### 3️⃣ 로그인 (승인 후)

```typescript
// Supabase Auth 사용
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://adzhdsajdamrflvybhxq.supabase.co',
  'YOUR_SUPABASE_ANON_KEY'
)

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: '임시비밀번호'
})
```

**승인 후 프로세스:**
1. 신청자 이메일로 로그인 정보 수신
2. 이메일 주소와 임시 비밀번호로 로그인
3. 첫 로그인 후 비밀번호 변경 권장

---

### 💡 어떤 Edge Function을 사용해야 할까?

| 구분 | Edge Function | 사용 대상 |
|------|--------------|----------|
| 교회 관리자 | `church-applications` | 교회 담당자, 목회자, 교회 관리 필요 |
| 일반 사용자 | `community-applications` | 개인, 기업, 음악사역자, 비영리단체 |
| 이메일 알림 | `notify-application` | 🔔 **자동 호출됨** - 직접 호출 불필요 |
| 로그인 | Supabase Auth | 승인 후 모든 사용자 |

---

### 🔔 이메일 알림은 어떻게 발송되나요?

#### `notify-application` Edge Function

```
POST https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/notify-application
```

**⚠️ 중요:** 이 Edge Function은 **모바일 앱에서 직접 호출하지 않습니다!**

**작동 방식:**
1. **커뮤니티 가입** (`community-applications`): 신청서 제출 시 **자동으로** `notify-application` 호출하여 관리자에게 알림 이메일 발송
2. **교회 가입** (`church-applications`): 현재는 이메일 알림 미구현 (추가 예정)

**이메일 발송 대상:**
- 📧 **관리자 알림**: `surfmind.sm@gmail.com` (신청 접수 시)
- 📧 **신청자 알림**: 신청자 이메일 (승인 완료 시)

**모바일 개발자가 할 일:**
- `church-applications` 또는 `community-applications`만 호출하면 됨
- `notify-application`은 백엔드에서 자동으로 호출됨

---

## 1. 교회 관리자 가입

### 1.1 개요

교회를 등록하고 관리자 계정을 생성하는 프로세스입니다. 신청서가 제출되면 관리자의 승인을 거쳐 교회와 관리자 계정이 생성됩니다.

### 1.2 API 엔드포인트

```
POST https://your-project.supabase.co/functions/v1/church-applications
```

### 1.3 요청 헤더

```http
Content-Type: application/json
apikey: YOUR_SUPABASE_ANON_KEY
```

### 1.4 요청 본문 (JSON)

```json
{
  // 필수 필드
  "church_name": "서울중앙교회",
  "pastor_name": "김목사",
  "admin_name": "이관리자",
  "email": "admin@church.org",
  "phone": "010-1234-5678",
  "address": "서울시 강남구 테헤란로 123",
  "description": "우리 교회는...",

  // 약관 동의 (필수)
  "agree_terms": true,
  "agree_privacy": true,
  "agree_marketing": false,  // 선택

  // 선택 필드
  "business_no": "123-45-67890",
  "website": "https://church.org",
  "homepage_url": "https://church.org",
  "youtube_channel": "https://youtube.com/@church",
  "established_year": 1990,
  "denomination": "예장통합",
  "member_count": 500
}
```

### 1.5 필드 상세 설명

#### 필수 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `church_name` | string | 교회명 | "서울중앙교회" |
| `pastor_name` | string | 담임목사 이름 | "김목사" |
| `admin_name` | string | 관리자 이름 | "이관리자" |
| `email` | string | 관리자 이메일 (로그인 ID로 사용) | "admin@church.org" |
| `phone` | string | 연락처 | "010-1234-5678" |
| `address` | string | 교회 주소 | "서울시 강남구..." |
| `description` | string | 교회 소개 | "우리 교회는..." |
| `agree_terms` | boolean | 이용약관 동의 (필수) | true |
| `agree_privacy` | boolean | 개인정보처리방침 동의 (필수) | true |

#### 선택 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `agree_marketing` | boolean | 마케팅 수신 동의 | false |
| `business_no` | string | 사업자등록번호 | "123-45-67890" |
| `website` | string | 웹사이트 URL | "https://church.org" |
| `homepage_url` | string | 홈페이지 URL | "https://church.org" |
| `youtube_channel` | string | 유튜브 채널 URL | "https://youtube.com/@church" |
| `established_year` | integer | 설립년도 | 1990 |
| `denomination` | string | 교단 | "예장통합" |
| `member_count` | integer | 교인 수 | 500 |

### 1.6 응답

#### 성공 응답 (201 Created)

```json
{
  "success": true,
  "data": {
    "application_id": 123,
    "status": "pending",
    "submitted_at": "2025-10-11T08:00:00Z"
  },
  "message": "신청서가 성공적으로 제출되었습니다."
}
```

#### 실패 응답 (400 Bad Request)

```json
{
  "success": false,
  "message": "필수 필드가 누락되었습니다."
}
```

```json
{
  "success": false,
  "message": "필수 약관에 동의해주세요."
}
```

#### 서버 오류 (500 Internal Server Error)

```json
{
  "success": false,
  "message": "신청서 저장에 실패했습니다.",
  "error": "에러 메시지"
}
```

### 1.7 이메일 알림 시스템

#### 1.7.1 신청 접수 알림 (관리자에게)

신청서가 제출되면 즉시 관리자(`surfmind.sm@gmail.com`)에게 알림 이메일이 발송됩니다.

**알림 이메일 내용:**
- 신청 유형: 교회 가입
- 교회명
- 담당자명 (관리자 이름)
- 이메일
- 신청 ID
- 검토 버튼 (관리자 대시보드 링크)

**구현 방법:**

신청서 저장 후 `notify-application` Edge Function을 호출합니다:

```typescript
// church-applications Edge Function 내부
const { data, error } = await supabaseClient
  .from('church_applications')
  .insert([insertData])
  .select()
  .single()

if (error) {
  // 에러 처리
}

// 알림 이메일 발송
try {
  const notifyResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-application`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        type: 'church',
        applicantEmail: email,
        applicantName: admin_name,
        organizationName: church_name,
        applicationId: data.id
      })
    }
  )

  if (notifyResponse.ok) {
    console.log('✅ 관리자 알림 이메일 발송 완료')
  } else {
    console.error('❌ 관리자 알림 이메일 발송 실패')
  }
} catch (emailError) {
  console.error('❌ 이메일 발송 오류:', emailError)
  // 이메일 발송 실패해도 신청은 완료
}
```

#### 1.7.2 이메일 발송 API 스펙

**엔드포인트:**
```
POST https://your-project.supabase.co/functions/v1/notify-application
```

**요청 본문:**
```json
{
  "type": "church",
  "applicantEmail": "admin@church.org",
  "applicantName": "이관리자",
  "organizationName": "서울중앙교회",
  "applicationId": 123
}
```

**필드 설명:**
- `type`: `"church"` (교회 가입) 또는 `"community"` (커뮤니티 가입)
- `applicantEmail`: 신청자 이메일
- `applicantName`: 신청자 이름
- `organizationName`: 교회명 또는 단체명
- `applicationId`: 신청서 ID

### 1.8 승인 프로세스

1. **신청서 제출**: 모바일 앱에서 POST 요청으로 신청서 제출
2. **관리자 알림**: 즉시 `surfmind.sm@gmail.com`으로 알림 이메일 발송
3. **관리자 검토**: 관리자 대시보드에서 신청서 확인 및 승인/반려
4. **승인 처리**:
   - 교회 계정 생성 (`churches` 테이블에 삽입)
   - 관리자 계정 생성 (이메일을 username으로 사용)
   - 임시 비밀번호 발급 (8자리 영문+숫자)
   - 신청자에게 로그인 정보 이메일 발송
5. **로그인**: 사용자는 이메일과 임시 비밀번호로 로그인

### 1.8 데이터베이스 스키마

신청서는 `church_applications` 테이블에 저장됩니다.

```sql
-- 주요 필드
id BIGSERIAL PRIMARY KEY
church_name TEXT NOT NULL
pastor_name TEXT NOT NULL
admin_name TEXT NOT NULL
email TEXT NOT NULL
phone TEXT NOT NULL
address TEXT NOT NULL
status TEXT DEFAULT 'pending'  -- pending, approved, rejected
submitted_at TIMESTAMP
reviewed_at TIMESTAMP
reviewed_by INTEGER
```

---

## 2. 커뮤니티 회원 가입

### 2.1 개요

교회 관리 기능 없이 커뮤니티 기능(무료나눔, 물품판매, 구인구직 등)만 사용하는 회원 가입입니다.

### 2.2 API 엔드포인트

```
POST https://your-project.supabase.co/functions/v1/community-applications
```

### 2.3 요청 헤더

```http
Content-Type: application/json
apikey: YOUR_SUPABASE_ANON_KEY
```

### 2.4 요청 본문 (JSON)

```json
{
  // 필수 필드
  "applicant_type": "individual",
  "organization_name": "개인사용자 또는 단체명",
  "contact_person": "홍길동",
  "email": "user@example.com",
  "phone": "010-9876-5432",
  "description": "가입 목적 및 소개",

  // 약관 동의 (필수)
  "agree_terms": true,
  "agree_privacy": true,
  "agree_marketing": false,  // 선택

  // 선택 필드
  "business_number": "123-45-67890",
  "address": "서울시 강남구...",
  "service_area": "전국",
  "website": "https://example.com"
}
```

### 2.5 필드 상세 설명

#### 필수 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `applicant_type` | string | 신청자 유형 (아래 참고) | "individual" |
| `organization_name` | string | 단체명 또는 이름 | "홍길동" 또는 "ABC회사" |
| `contact_person` | string | 담당자 이름 | "홍길동" |
| `email` | string | 이메일 (로그인 ID로 사용) | "user@example.com" |
| `phone` | string | 연락처 | "010-9876-5432" |
| `description` | string | 가입 목적 및 소개 | "무료나눔 활동을 위해..." |
| `agree_terms` | boolean | 이용약관 동의 (필수) | true |
| `agree_privacy` | boolean | 개인정보처리방침 동의 (필수) | true |

#### 신청자 유형 (`applicant_type`)

| 값 | 설명 |
|----|------|
| `individual` | 개인 사용자 |
| `company` | 기업/회사 |
| `musician` | 음악사역자 |
| `minister` | 목회자/전도사 |
| `organization` | 비영리단체 |
| `church_admin` | 교회 관계자 |
| `other` | 기타 |

#### 선택 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `agree_marketing` | boolean | 마케팅 수신 동의 | false |
| `business_number` | string | 사업자등록번호 | "123-45-67890" |
| `address` | string | 주소 | "서울시 강남구..." |
| `service_area` | string | 활동 지역 | "전국", "서울/경기" |
| `website` | string | 웹사이트 URL | "https://example.com" |

### 2.6 응답

#### 성공 응답 (201 Created)

```json
{
  "success": true,
  "data": {
    "application_id": 456,
    "status": "pending",
    "submitted_at": "2025-10-11T08:00:00Z"
  },
  "message": "신청서가 성공적으로 제출되었습니다."
}
```

#### 실패 응답 (400 Bad Request)

```json
{
  "success": false,
  "message": "필수 필드가 누락되었습니다."
}
```

```json
{
  "success": false,
  "message": "필수 약관에 동의해주세요."
}
```

### 2.7 이메일 알림 시스템

#### 2.7.1 신청 접수 알림 (관리자에게)

커뮤니티 가입 신청서가 제출되면 즉시 관리자(`surfmind.sm@gmail.com`)에게 알림 이메일이 발송됩니다.

**알림 이메일 내용:**
- 신청 유형: 커뮤니티 가입
- 신청자 유형 (개인, 기업, 음악사역자 등)
- 단체/회사명
- 담당자명
- 이메일
- 신청 ID
- 검토 버튼 (관리자 대시보드 링크)

**참고:** `community-applications` Edge Function은 이미 알림 기능이 구현되어 있습니다. 신청서 저장 후 자동으로 관리자에게 이메일이 발송됩니다.

#### 2.7.2 승인 알림 (신청자에게)

관리자가 신청을 승인하면 신청자에게 로그인 정보가 포함된 이메일이 발송됩니다.

**승인 이메일 내용:**
- 승인 축하 메시지
- 로그인 ID (이메일)
- 임시 비밀번호 (8자리 영문+숫자)
- 로그인 링크
- 비밀번호 변경 안내

### 2.8 승인 프로세스

1. **신청서 제출**: 모바일 앱에서 POST 요청으로 신청서 제출
2. **관리자 알림**: 즉시 `surfmind.sm@gmail.com`으로 알림 이메일 발송
3. **관리자 검토**: 관리자 대시보드에서 신청서 확인 및 승인/반려
4. **승인 처리**:
   - 커뮤니티 회원 계정 생성
   - 교회 ID는 9998 (무소속)로 자동 설정
   - 임시 비밀번호 발급 (8자리 영문+숫자)
   - 신청자에게 로그인 정보 이메일 발송
5. **로그인**: 사용자는 이메일과 임시 비밀번호로 로그인

### 2.8 데이터베이스 스키마

신청서는 `community_applications` 테이블에 저장됩니다.

```sql
-- 주요 필드
id BIGSERIAL PRIMARY KEY
applicant_type TEXT NOT NULL
organization_name TEXT NOT NULL
contact_person TEXT NOT NULL
email TEXT NOT NULL
phone TEXT NOT NULL
description TEXT NOT NULL
status TEXT DEFAULT 'pending'  -- pending, approved, rejected
submitted_at TIMESTAMP
reviewed_at TIMESTAMP
reviewed_by INTEGER
```

---

## 3. 공통 사항

### 3.1 인증 방식

- **API Key**: Supabase Anon Key를 `apikey` 헤더에 포함
- **CORS**: 모든 도메인에서 요청 가능 (`Access-Control-Allow-Origin: *`)

### 3.2 에러 핸들링

모든 API는 다음 형식의 에러 응답을 반환합니다:

```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "상세 에러 내용 (선택)"
}
```

### 3.3 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 (GET 요청) |
| 201 | 생성 완료 (POST 요청) |
| 400 | 잘못된 요청 (필수 필드 누락, 유효성 검증 실패) |
| 401 | 인증 실패 |
| 405 | 허용되지 않는 HTTP 메서드 |
| 500 | 서버 내부 오류 |

### 3.4 보안 고려사항

1. **RLS (Row Level Security)**:
   - `church_applications`, `community_applications` 테이블은 RLS 활성화
   - 누구나 INSERT 가능 (익명 사용자 포함)
   - SELECT/UPDATE는 인증된 사용자만 가능

2. **Service Role Key**:
   - Edge Function 내부에서만 Service Role Key 사용
   - 클라이언트에는 절대 노출 금지

3. **입력 검증**:
   - 필수 필드 누락 체크
   - 이메일 형식 검증 (클라이언트에서 처리 권장)
   - 약관 동의 여부 확인

### 3.5 환경 변수

Edge Function에서 사용하는 환경 변수:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 4. 테스트 방법

### 4.1 cURL 예제 - 교회 관리자 가입

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/church-applications \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "church_name": "테스트교회",
    "pastor_name": "김목사",
    "admin_name": "이관리자",
    "email": "test@church.org",
    "phone": "010-1234-5678",
    "address": "서울시 강남구 테헤란로 123",
    "description": "테스트 교회입니다",
    "agree_terms": true,
    "agree_privacy": true,
    "agree_marketing": false
  }'
```

### 4.2 cURL 예제 - 커뮤니티 회원 가입

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/community-applications \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "applicant_type": "individual",
    "organization_name": "홍길동",
    "contact_person": "홍길동",
    "email": "user@example.com",
    "phone": "010-9876-5432",
    "description": "무료나눔 활동을 위해 가입합니다",
    "agree_terms": true,
    "agree_privacy": true,
    "agree_marketing": false
  }'
```

### 4.3 JavaScript/TypeScript 예제

```typescript
// 교회 관리자 가입
async function registerChurch(data: ChurchApplicationData) {
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/church-applications',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'YOUR_SUPABASE_ANON_KEY'
      },
      body: JSON.stringify(data)
    }
  );

  const result = await response.json();

  if (result.success) {
    console.log('신청 완료:', result.data.application_id);
  } else {
    console.error('신청 실패:', result.message);
  }

  return result;
}

// 커뮤니티 회원 가입
async function registerCommunityMember(data: CommunityApplicationData) {
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/community-applications',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'YOUR_SUPABASE_ANON_KEY'
      },
      body: JSON.stringify(data)
    }
  );

  const result = await response.json();

  if (result.success) {
    console.log('신청 완료:', result.data.application_id);
  } else {
    console.error('신청 실패:', result.message);
  }

  return result;
}
```

---

## 5. 승인 후 로그인 프로세스

### 5.1 승인 완료 이메일

승인이 완료되면 신청자에게 다음 정보가 포함된 이메일이 발송됩니다:

- 로그인 ID (이메일)
- 임시 비밀번호 (8자리 영문+숫자)
- 로그인 URL

### 5.2 로그인 API

로그인은 Supabase Auth를 사용합니다:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'YOUR_SUPABASE_ANON_KEY'
)

// 로그인
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'temporaryPassword123'
})

if (error) {
  console.error('로그인 실패:', error.message)
} else {
  console.log('로그인 성공:', data.user)
  console.log('액세스 토큰:', data.session.access_token)
}
```

### 5.3 비밀번호 변경

첫 로그인 후 비밀번호 변경을 권장합니다:

```typescript
const { data, error } = await supabase.auth.updateUser({
  password: 'newSecurePassword123!'
})
```

---

## 6. FAQ

### Q1. 신청서 제출 후 언제 승인되나요?
A1. 관리자가 수동으로 검토하고 승인합니다. 승인 시 이메일로 알림이 발송됩니다.

### Q2. 이메일이 중복되면 어떻게 되나요?
A2. 이메일 중복 체크는 승인 단계에서 수행됩니다. 중복 시 승인이 거부됩니다.

### Q3. 교회 관리자와 커뮤니티 회원의 차이는?
A3.
- **교회 관리자**: 교회 관리 기능 + 커뮤니티 기능 모두 사용 가능
- **커뮤니티 회원**: 커뮤니티 기능(무료나눔, 구인구직 등)만 사용 가능

### Q4. 신청서를 수정하거나 취소할 수 있나요?
A4. 현재는 지원하지 않습니다. 수정이 필요하면 관리자에게 문의해야 합니다.

### Q5. 임시 비밀번호를 분실했어요.
A5. Supabase Auth의 비밀번호 재설정 기능을 사용하세요:

```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com'
)
```

---

## 7. 이메일 알림 시스템 상세

### 7.1 개요

회원가입 프로세스에서 두 가지 유형의 이메일이 발송됩니다:

1. **신청 접수 알림** - 신청서 제출 시 관리자에게 발송
2. **승인 알림** - 관리자가 승인 시 신청자에게 발송

### 7.2 이메일 발송 서비스

- **서비스**: Resend (https://resend.com)
- **발신자**: noreply@churchround.com
- **관리자 수신자**: surfmind.sm@gmail.com

### 7.3 신청 접수 알림 (관리자용)

#### 7.3.1 발송 조건

- 교회 가입 신청서 제출 시
- 커뮤니티 가입 신청서 제출 시

#### 7.3.2 이메일 템플릿

**제목:**
```
[Church Round] 새로운 교회 가입 신청이 접수되었습니다
[Church Round] 새로운 커뮤니티 가입 신청이 접수되었습니다
```

**본문 내용:**
- 🔔 새로운 신청 알림 헤더
- 신청자 정보 (신청 유형, 조직명, 담당자명, 이메일, 신청 ID)
- ⚠️ 조치 필요 알림 박스
- "신청서 검토하러 가기" 버튼 (관리자 대시보드 링크)
- 신청 접수 시각

#### 7.3.3 구현 위치

**현재 구현 상태:**
- ✅ `community-applications` - 이미 구현됨
- ⚠️ `church-applications` - 구현 필요

**구현 코드 예시:**

```typescript
// church-applications/index.ts에 추가 필요
console.log('✅ 교회 신청서 저장 완료:', data.id)

// 관리자에게 알림 이메일 발송
try {
  console.log('📧 관리자 알림 이메일 발송 중...')

  const notifyResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-application`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        type: 'church',
        applicantEmail: email,
        applicantName: admin_name,
        organizationName: church_name,
        applicationId: data.id
      })
    }
  )

  if (notifyResponse.ok) {
    console.log('✅ 관리자 알림 이메일 발송 완료')
  } else {
    console.error('❌ 관리자 알림 이메일 발송 실패:', await notifyResponse.text())
  }
} catch (emailError) {
  console.error('❌ 이메일 발송 오류:', emailError)
  // 이메일 발송 실패해도 신청은 완료
}

return new Response(
  JSON.stringify({
    success: true,
    data: {
      application_id: data.id,
      status: data.status,
      submitted_at: data.submitted_at,
    },
    message: '신청서가 성공적으로 제출되었습니다.',
  }),
  {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  }
)
```

### 7.4 승인 알림 (신청자용)

#### 7.4.1 발송 조건

- 관리자가 커뮤니티 가입 신청을 승인할 때
- (교회 가입 승인 시에도 동일한 방식 적용 가능)

#### 7.4.2 이메일 템플릿

**제목:**
```
[Church Round] 커뮤니티 가입 신청이 승인되었습니다
```

**본문 내용:**
- 승인 축하 메시지
- 로그인 정보 박스:
  - 아이디: 신청 시 입력한 이메일
  - 임시 비밀번호: 자동 생성된 8자리 영문+숫자
  - 보안 안내 (첫 로그인 후 비밀번호 변경 필수)
- 다음 단계 안내:
  1. 위의 아이디와 임시 비밀번호로 로그인하세요
  2. 로그인 후 비밀번호를 변경해주세요
  3. 프로필을 완성하고 서비스를 시작하세요
- "로그인하기" 버튼
- 승인 일시

#### 7.4.3 구현 위치

**현재 구현 상태:**
- ✅ `community-applications` - 이미 구현됨 (PUT 메서드, 승인 처리 시)

**구현 코드 (community-applications/index.ts 209-254줄):**

```typescript
// 승인 시 임시 비밀번호 생성 및 이메일 알림 발송
if (status === 'approved') {
  try {
    console.log('🔑 임시 비밀번호 생성 중...')

    // 임시 비밀번호 생성 (8자리: 대문자, 소문자, 숫자 조합)
    const generateTempPassword = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const temporaryPassword = generateTempPassword();
    const username = updatedApplication.email; // 이메일을 username으로 사용

    console.log('📧 승인 이메일 발송 중...')

    const notifyResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-application`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          type: 'community_approved',
          applicantEmail: updatedApplication.email,
          applicantName: updatedApplication.contact_person,
          organizationName: updatedApplication.organization_name,
          applicationId: applicationId,
          username: username,
          temporaryPassword: temporaryPassword
        })
      }
    )

    if (notifyResponse.ok) {
      console.log('✅ 승인 이메일 발송 완료 (아이디:', username, ')')
    } else {
      console.error('❌ 승인 이메일 발송 실패:', await notifyResponse.text())
    }
  } catch (emailError) {
    console.error('❌ 이메일 발송 오류:', emailError)
    // 이메일 발송 실패해도 승인은 완료
  }
}
```

### 7.5 notify-application Edge Function

#### 7.5.1 엔드포인트

```
POST https://your-project.supabase.co/functions/v1/notify-application
```

#### 7.5.2 요청 파라미터

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `type` | string | ✅ | 알림 유형 | `"church"`, `"community"`, `"community_approved"` |
| `applicantEmail` | string | ✅ | 신청자 이메일 | "user@example.com" |
| `applicantName` | string | ✅ | 신청자 이름 | "홍길동" |
| `organizationName` | string | ❌ | 조직명 | "서울중앙교회" |
| `applicationId` | number | ❌ | 신청서 ID | 123 |
| `username` | string | ❌ | 로그인 ID (승인 시) | "user@example.com" |
| `temporaryPassword` | string | ❌ | 임시 비밀번호 (승인 시) | "Abc12345" |

#### 7.5.3 알림 유형 (type)

| 값 | 설명 | 수신자 | 용도 |
|----|------|--------|------|
| `church` | 교회 가입 신청 접수 | 관리자 | 새 신청 알림 |
| `community` | 커뮤니티 가입 신청 접수 | 관리자 | 새 신청 알림 |
| `community_approved` | 커뮤니티 가입 승인 | 신청자 | 로그인 정보 전달 |

#### 7.5.4 응답

**성공:**
```json
{
  "success": true,
  "message": "알림 이메일이 발송되었습니다.",
  "emailId": "resend-email-id"
}
```

**실패:**
```json
{
  "success": false,
  "error": "에러 메시지"
}
```

### 7.6 환경 변수 설정

이메일 발송을 위해 다음 환경 변수가 필요합니다:

```bash
# Supabase Dashboard > Edge Functions > Settings
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

Resend API 키는 [Resend 대시보드](https://resend.com/api-keys)에서 생성할 수 있습니다.

### 7.7 이메일 발송 실패 처리

이메일 발송이 실패해도 신청서 제출이나 승인 처리는 정상적으로 완료됩니다.

```typescript
try {
  // 이메일 발송 시도
  const notifyResponse = await fetch(...)

  if (notifyResponse.ok) {
    console.log('✅ 이메일 발송 완료')
  } else {
    console.error('❌ 이메일 발송 실패')
  }
} catch (emailError) {
  console.error('❌ 이메일 발송 오류:', emailError)
  // 이메일 발송 실패해도 메인 프로세스는 계속 진행
}

// 신청서 제출/승인 응답은 정상 반환
return new Response(JSON.stringify({ success: true, ... }))
```

### 7.8 테스트 방법

#### 7.8.1 신청 접수 알림 테스트

```bash
# 1. 교회 가입 신청서 제출
curl -X POST \
  https://your-project.supabase.co/functions/v1/church-applications \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{ "church_name": "테스트교회", ... }'

# 2. surfmind.sm@gmail.com 확인
# 제목: [Church Round] 새로운 교회 가입 신청이 접수되었습니다
```

#### 7.8.2 승인 알림 테스트

```bash
# 1. 관리자 대시보드에서 신청서 승인
# 또는 직접 Edge Function 호출:

curl -X POST \
  https://your-project.supabase.co/functions/v1/notify-application \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "type": "community_approved",
    "applicantEmail": "test@example.com",
    "applicantName": "테스트",
    "organizationName": "테스트조직",
    "username": "test@example.com",
    "temporaryPassword": "Test1234"
  }'

# 2. test@example.com 확인
# 제목: [Church Round] 커뮤니티 가입 신청이 승인되었습니다
```

### 7.9 이메일 템플릿 커스터마이징

이메일 템플릿은 `notify-application/index.ts` 파일의 74-192줄에서 수정할 수 있습니다.

**주요 커스터마이징 포인트:**
- 이메일 발신자: `from: 'noreply@churchround.com'`
- 제목: `subject` 필드
- HTML 본문: `html` 필드
- 로그인 URL: `https://churchround.com/login`
- 관리자 대시보드 URL: `https://admin.churchround.com/applications`

- [Resend API 문서](https://resend.com/docs/introduction)

---

## 8. 문의

기술 지원이 필요하면 다음으로 문의하세요:

- **이메일**: support@smartyoram.com
- **GitHub Issues**: [링크]
- **개발자 문서**: [링크]
