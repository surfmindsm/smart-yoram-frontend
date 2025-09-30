# Supabase Edge Functions API Reference
## 현재 구현된 API 엔드포인트 명세

**기준일**: 2025-09-30
**Supabase Project URL**: `https://your-project.supabase.co`
**Edge Function Base URL**: `https://your-project.supabase.co/functions/v1`

---

## 목차

1. [인증 및 사용자 관리](#1-인증-및-사용자-관리)
2. [교인 관리](#2-교인-관리)
3. [출석 관리](#3-출석-관리)
4. [헌금 관리](#4-헌금-관리)
5. [커뮤니티](#5-커뮤니티)
6. [교회 소식 및 공지](#6-교회-소식-및-공지)
7. [예배 및 목회](#7-예배-및-목회)
8. [통계 및 분석](#8-통계-및-분석)
9. [기타 기능](#9-기타-기능)

---

## 공통 헤더

모든 Edge Function 호출 시 필요한 헤더:

```http
Content-Type: application/json
Authorization: Bearer {supabase_anon_key}
X-Church-ID: {church_id}
X-User-ID: {user_id}
```

---

## 1. 인증 및 사용자 관리

### 1.1 사용자 목록 조회
**Function**: `users`
**Method**: `GET`

```typescript
// Request
GET /functions/v1/users
Query: {
  church_id?: number,
  role?: string,
  is_active?: boolean
}

// Response
{
  success: true,
  data: User[],
  total: number
}
```

### 1.2 사용자 생성/수정
**Function**: `users`
**Method**: `POST`

```typescript
// Request
POST /functions/v1/users
{
  action: "create" | "update",
  user: {
    email: string,
    username: string,
    full_name: string,
    church_id: number,
    role: "admin" | "member" | "staff"
  }
}
```

### 1.3 이메일 인증
**Function**: `email-verification`
**Method**: `POST`

```typescript
// Request
POST /functions/v1/email-verification
{
  email: string,
  action: "send" | "verify",
  code?: string
}
```

### 1.4 임시 비밀번호 발송
**Function**: `send-temp-password`
**Method**: `POST`

```typescript
// Request
POST /functions/v1/send-temp-password
{
  email: string,
  phone?: string
}
```

### 1.5 사용자 초대
**Function**: `invite-user`
**Method**: `POST`

```typescript
// Request
POST /functions/v1/invite-user
{
  email: string,
  name: string,
  church_id: number,
  role: string
}
```

---

## 2. 교인 관리

### 2.1 교인 목록 조회
**Function**: `members`
**Method**: `GET`

```typescript
// Request
GET /functions/v1/members
Query: {
  church_id: number,
  page?: number,
  per_page?: number,
  search?: string,
  district?: string,
  is_active?: boolean
}

// Response
{
  success: true,
  data: Member[],
  pagination: {
    page: number,
    per_page: number,
    total: number,
    total_pages: number
  }
}
```

### 2.2 교인 생성
**Function**: `members`
**Method**: `POST`

```typescript
// Request
POST /functions/v1/members
{
  action: "create",
  member: {
    name: string,
    email?: string,
    phone: string,
    address?: string,
    birth_date?: string,
    gender?: "M" | "F",
    church_id: number,
    district?: string,
    position?: string,
    baptism_date?: string,
    profile_photo_url?: string
  }
}
```

### 2.3 교인 수정
**Function**: `members`
**Method**: `PUT`

```typescript
// Request
PUT /functions/v1/members
{
  action: "update",
  id: number,
  member: {
    // 수정할 필드들
  }
}
```

### 2.4 교인 삭제
**Function**: `members`
**Method**: `DELETE`

```typescript
// Request
DELETE /functions/v1/members
{
  action: "delete",
  id: number
}
```

### 2.5 교인 일괄 업로드 (엑셀)
**Function**: `excel`
**Method**: `POST`

```typescript
// Request
POST /functions/v1/excel
{
  action: "upload_members",
  data: [
    {
      name: string,
      phone: string,
      email?: string,
      // ...
    }
  ]
}
```

---

## 3. 출석 관리

### 3.1 출석 체크
**Function**: `attendances`
**Method**: `POST`

```typescript
// Request
POST /functions/v1/attendances
{
  action: "checkin",
  member_id: number,
  service_date: string,
  service_type: "주일예배" | "수요예배" | "새벽예배",
  check_in_time?: string
}
```

### 3.2 출석 조회
**Function**: `attendances`
**Method**: `GET`

```typescript
// Request
GET /functions/v1/attendances
Query: {
  church_id: number,
  start_date?: string,
  end_date?: string,
  member_id?: number,
  service_type?: string
}

// Response
{
  success: true,
  data: Attendance[],
  summary: {
    total_services: number,
    total_attended: number,
    attendance_rate: number
  }
}
```

### 3.3 출석 수정/삭제
**Function**: `attendances`
**Method**: `PUT` | `DELETE`

```typescript
// Update
PUT /functions/v1/attendances
{
  action: "update",
  id: number,
  status: "present" | "absent" | "late"
}

// Delete
DELETE /functions/v1/attendances
{
  action: "delete",
  id: number
}
```

---

## 4. 헌금 관리

### 4.1 헌금 기록 조회
**Function**: `offerings`
**Method**: `GET`

```typescript
// Request
GET /functions/v1/offerings
Query: {
  church_id: number,
  member_id?: number,
  start_date?: string,
  end_date?: string,
  fund_type?: string
}

// Response
{
  success: true,
  data: Offering[],
  total_amount: number,
  by_type: {
    [type: string]: number
  }
}
```

### 4.2 헌금 기록 생성
**Function**: `offerings`
**Method**: `POST`

```typescript
// Request
POST /functions/v1/offerings
{
  action: "create",
  offering: {
    member_id?: number,
    amount: number,
    fund_type: string,
    offered_on: string,
    note?: string,
    is_anonymous: boolean
  }
}
```

### 4.3 헌금 일괄 입력
**Function**: `offerings`
**Method**: `POST`

```typescript
// Request
POST /functions/v1/offerings
{
  action: "bulk_create",
  offerings: [
    {
      member_id: number,
      amount: number,
      fund_type: string,
      offered_on: string
    }
  ]
}
```

---

## 5. 커뮤니티

### 5.1 무료나눔/물품판매
**Function**: `community-sharing`
**Method**: `GET` | `POST`

```typescript
// 목록 조회
GET /functions/v1/community-sharing
Query: {
  church_id?: number,
  is_free?: boolean,
  category?: string,
  status?: string,
  author_id?: number
}

// 물품 등록
POST /functions/v1/community-sharing
{
  action: "create",
  item: {
    title: string,
    description: string,
    category: string,
    is_free: boolean,
    price?: number,
    images?: string[],
    contact_info: string
  }
}

// 상태 변경
PUT /functions/v1/community-sharing
{
  action: "update_status",
  id: number,
  status: "available" | "reserved" | "completed"
}
```

### 5.2 물품 요청
**Function**: `community-requests`
**Method**: `GET` | `POST`

```typescript
// 요청 목록
GET /functions/v1/community-requests
Query: {
  church_id?: number,
  status?: string,
  urgency?: string
}

// 요청 등록
POST /functions/v1/community-requests
{
  action: "create",
  request: {
    title: string,
    description: string,
    category: string,
    urgency: "high" | "medium" | "low",
    budget?: number
  }
}
```

### 5.3 구인구직
**Function**: `job-posts`
**Method**: `GET` | `POST`

```typescript
// 구인 목록
GET /functions/v1/job-posts
Query: {
  church_id?: number,
  type?: "구인" | "구직",
  category?: string
}

// 구인/구직 등록
POST /functions/v1/job-posts
{
  action: "create",
  post: {
    type: "구인" | "구직",
    title: string,
    company?: string,
    position: string,
    description: string,
    salary?: string,
    location: string,
    requirements?: string[]
  }
}
```

### 5.4 찬양팀 모집
**Function**: `music-teams`
**Method**: `GET` | `POST`

```typescript
// 모집 공고 목록
GET /functions/v1/music-teams
Query: {
  church_id?: number,
  status?: "recruiting" | "closed"
}

// 모집 공고 등록
POST /functions/v1/music-teams
{
  action: "create",
  team: {
    name: string,
    description: string,
    parts_needed: string[],
    practice_schedule: string,
    contact: string
  }
}
```

### 5.5 찬양팀 지원자
**Function**: `music-seekers`
**Method**: `GET` | `POST`

```typescript
// 지원자 목록
GET /functions/v1/music-seekers
Query: {
  church_id?: number,
  instrument?: string
}

// 지원 등록
POST /functions/v1/music-seekers
{
  action: "create",
  seeker: {
    name: string,
    instruments: string[],
    experience: string,
    available_times: string,
    contact: string
  }
}
```

---

## 6. 교회 소식 및 공지

### 6.1 교회 소식
**Function**: `church-news`
**Method**: `GET` | `POST`

```typescript
// 소식 목록
GET /functions/v1/church-news
Query: {
  church_id: number,
  category?: string,
  is_pinned?: boolean
}

// 소식 등록
POST /functions/v1/church-news
{
  action: "create",
  news: {
    title: string,
    content: string,
    category: string,
    is_pinned: boolean,
    images?: string[]
  }
}
```

### 6.2 공지사항
**Function**: `announcements`
**Method**: `GET` | `POST`

```typescript
// 공지 목록
GET /functions/v1/announcements
Query: {
  church_id: number,
  is_active?: boolean
}

// 공지 등록
POST /functions/v1/announcements
{
  action: "create",
  announcement: {
    title: string,
    content: string,
    type: "일반" | "긴급",
    start_date: string,
    end_date?: string
  }
}
```

### 6.3 주보
**Function**: `bulletins`
**Method**: `GET` | `POST`

```typescript
// 주보 목록
GET /functions/v1/bulletins
Query: {
  church_id: number,
  year?: number,
  month?: number
}

// 주보 등록
POST /functions/v1/bulletins
{
  action: "create",
  bulletin: {
    title: string,
    date: string,
    content: string,
    attachments?: string[]
  }
}
```

### 6.4 시스템 공지
**Function**: `system-announcements`
**Method**: `GET`

```typescript
// 시스템 공지 조회
GET /functions/v1/system-announcements
Query: {
  target?: "all" | "admin" | "member"
}
```

---

## 7. 예배 및 목회

### 7.1 예배 일정
**Function**: `worship-services`
**Method**: `GET` | `POST`

```typescript
// 예배 일정 조회
GET /functions/v1/worship-services
Query: {
  church_id: number,
  start_date?: string,
  end_date?: string,
  type?: string
}

// 예배 일정 등록
POST /functions/v1/worship-services
{
  action: "create",
  service: {
    name: string,
    type: string,
    date: string,
    time: string,
    preacher?: string,
    title?: string,
    scripture?: string
  }
}
```

### 7.2 목회 돌봄
**Function**: `pastoral-care`
**Method**: `GET` | `POST`

```typescript
// 돌봄 기록 조회
GET /functions/v1/pastoral-care
Query: {
  church_id: number,
  member_id?: number,
  pastor_id?: number
}

// 돌봄 기록 등록
POST /functions/v1/pastoral-care
{
  action: "create",
  care: {
    member_id: number,
    type: "심방" | "상담" | "기도",
    date: string,
    notes: string,
    follow_up?: string
  }
}
```

### 7.3 기도 제목
**Function**: `prayer-requests`
**Method**: `GET` | `POST`

```typescript
// 기도 제목 목록
GET /functions/v1/prayer-requests
Query: {
  church_id: number,
  is_public?: boolean,
  status?: "active" | "answered"
}

// 기도 제목 등록
POST /functions/v1/prayer-requests
{
  action: "create",
  request: {
    title: string,
    content: string,
    is_public: boolean,
    is_urgent: boolean,
    category?: string
  }
}
```

### 7.4 오늘의 말씀
**Function**: `daily-verses`
**Method**: `GET` | `POST`

```typescript
// 오늘의 말씀 조회
GET /functions/v1/daily-verses
Query: {
  date?: string,
  church_id?: number
}

// 오늘의 말씀 등록
POST /functions/v1/daily-verses
{
  action: "create",
  verse: {
    date: string,
    scripture: string,
    content: string,
    meditation?: string
  }
}
```

---

## 8. 통계 및 분석

### 8.1 교회 통계
**Function**: `statistics`
**Method**: `GET`

```typescript
// Request
GET /functions/v1/statistics
Query: {
  church_id: number,
  type: "overview" | "attendance" | "offering" | "growth",
  period: "week" | "month" | "quarter" | "year",
  start_date?: string,
  end_date?: string
}

// Response
{
  success: true,
  data: {
    overview?: {
      total_members: number,
      active_members: number,
      new_members_this_month: number,
      average_attendance: number
    },
    attendance?: {
      by_service: Object,
      by_date: Array,
      trends: Object
    },
    offering?: {
      total: number,
      by_type: Object,
      by_month: Array
    },
    growth?: {
      member_growth: Array,
      attendance_growth: Array,
      offering_growth: Array
    }
  }
}
```

---

## 9. 기타 기능

### 9.1 SMS 발송
**Function**: `send-sms`
**Method**: `POST`

```typescript
// Request
POST /functions/v1/send-sms
{
  to: string | string[],
  message: string,
  type?: "invitation" | "notification" | "reminder"
}
```

### 9.2 AI 챗봇
**Function**: `ai-chat`
**Method**: `POST`

```typescript
// Request
POST /functions/v1/ai-chat
{
  message: string,
  context?: string,
  session_id?: string
}

// Response
{
  success: true,
  data: {
    response: string,
    session_id: string
  }
}
```

### 9.3 GPT 라이선스 관리
**Function**: `gpt-licenses`
**Method**: `GET` | `POST`

```typescript
// 라이선스 조회
GET /functions/v1/gpt-licenses
Query: {
  church_id: number
}

// 라이선스 활성화
POST /functions/v1/gpt-licenses
{
  action: "activate" | "deactivate",
  license_key: string
}
```

### 9.4 위시리스트
**Function**: `wishlists`
**Method**: `GET` | `POST`

```typescript
// 위시리스트 조회
GET /functions/v1/wishlists
Query: {
  user_id: number
}

// 위시리스트 추가
POST /functions/v1/wishlists
{
  action: "add" | "remove",
  item_id: number,
  item_type: "sharing" | "event" | "news"
}
```

### 9.5 내 게시글 관리
**Function**: `my-posts`
**Method**: `GET`

```typescript
// 내가 작성한 게시글 조회
GET /functions/v1/my-posts
Query: {
  user_id: number,
  type?: "sharing" | "request" | "job" | "prayer"
}
```

---

## 데이터베이스 테이블 구조

### 주요 테이블

```sql
-- users (사용자)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  full_name VARCHAR(100),
  hashed_password VARCHAR(255),
  church_id INTEGER,
  role VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- members (교인)
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  birth_date DATE,
  gender CHAR(1),
  church_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id),
  district VARCHAR(100),
  position VARCHAR(50),
  baptism_date DATE,
  profile_photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- churches (교회)
CREATE TABLE churches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  pastor_name VARCHAR(100),
  business_no VARCHAR(20),
  subscription_status VARCHAR(50),
  member_limit INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

-- attendances (출석)
CREATE TABLE attendances (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id),
  service_date DATE NOT NULL,
  service_type VARCHAR(50),
  check_in_time TIME,
  status VARCHAR(20) DEFAULT 'present',
  church_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- offerings (헌금)
CREATE TABLE offerings (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id),
  amount DECIMAL(10, 0) NOT NULL,
  fund_type VARCHAR(50) NOT NULL,
  offered_on DATE NOT NULL,
  note TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  church_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- community_sharing (나눔/판매)
CREATE TABLE community_sharing (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10, 0),
  status VARCHAR(20) DEFAULT 'available',
  images JSONB,
  author_id INTEGER REFERENCES members(id),
  church_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- community_requests (물품 요청)
CREATE TABLE community_requests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  urgency VARCHAR(20),
  budget DECIMAL(10, 0),
  status VARCHAR(20) DEFAULT 'active',
  author_id INTEGER REFERENCES members(id),
  church_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Row Level Security (RLS) 정책

```sql
-- members 테이블 RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 자신의 교회 교인만 조회 가능
CREATE POLICY "Users can view members of their church"
  ON members FOR SELECT
  USING (church_id = auth.jwt() ->> 'church_id'::integer);

-- 관리자만 교인 정보 수정 가능
CREATE POLICY "Admins can update members"
  ON members FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND church_id = auth.jwt() ->> 'church_id'::integer
  );
```

---

## 에러 코드

| 코드 | 설명 | HTTP Status |
|------|------|-------------|
| E001 | 인증 실패 | 401 |
| E002 | 권한 없음 | 403 |
| E003 | 리소스를 찾을 수 없음 | 404 |
| E004 | 유효성 검사 실패 | 400 |
| E005 | 중복된 데이터 | 409 |
| E006 | 서버 내부 오류 | 500 |
| E007 | 데이터베이스 오류 | 500 |
| E008 | 외부 서비스 오류 | 503 |

---

## 개발 및 테스트

### 로컬 개발
```bash
# Supabase 로컬 시작
supabase start

# Edge Function 로컬 실행
supabase functions serve members --env-file .env.local

# 테스트
curl -X POST http://localhost:54321/functions/v1/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {anon_key}" \
  -d '{"action":"get","church_id":7}'
```

### 배포
```bash
# 단일 함수 배포
supabase functions deploy members

# 모든 함수 배포
supabase functions deploy

# 환경 변수 설정
supabase secrets set SMS_API_KEY=your_key
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2025-09-30 | 초기 문서 작성 |

---

## 지원 및 문의

- **기술 지원**: tech@smart-yoram.com
- **API 문의**: api@smart-yoram.com
- **Supabase Dashboard**: https://app.supabase.com
- **GitHub**: https://github.com/smart-yoram