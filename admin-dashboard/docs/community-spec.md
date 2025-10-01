# 웹 커뮤니티 기능 명세 문서

## 1. 커뮤니티 기능 개요

스마트요람 관리자 대시보드의 커뮤니티 기능은 전국 교회들이 서로 물품을 나누고, 구인/구직, 음악팀 모집 등을 할 수 있는 종합 플랫폼입니다. React 19 + TypeScript로 구현되었으며, Supabase Edge Functions와 PostgreSQL을 백엔드로 사용합니다.

### 주요 특징
- **이중 API 아키텍처**: Supabase Edge Functions (신규) + REST API (레거시)
- **이미지 업로드**: Supabase Storage를 통한 직접 클라이언트 업로드
- **한국어 지원**: 모든 UI, 에러 메시지, 상태값이 한국어로 제공
- **반응형 디자인**: 그리드/리스트 뷰 전환 지원
- **실시간 통계**: 커뮤니티 활동 통계 대시보드

---

## 2. 커뮤니티 카테고리

### 2.1 나눔/거래 관련 (Sharing & Trading)

#### 무료 나눔 (Free Sharing)
- **용도**: 사용하지 않는 물품을 무료로 나눔
- **테이블**: `community_sharing` (is_free = true)
- **Edge Function**: `community-sharing`
- **경로**: `/community/free-sharing`

#### 물품 판매 (Item Sale)
- **용도**: 물품을 유료로 판매
- **테이블**: `community_sharing` (is_free = false)
- **Edge Function**: `community-sharing`
- **경로**: `/community/item-sale`

#### 물품 요청 (Item Request)
- **용도**: 필요한 물품을 요청
- **테이블**: `community_requests`
- **Edge Function**: `community-requests`
- **경로**: `/community/item-request`

### 2.2 구인/구직 (Job Posting & Seeking)

#### 구인 공고 (Job Posting)
- **용도**: 교회나 기독교 기관의 채용 공고
- **테이블**: `job_posts`
- **Edge Function**: `job-posts` (레거시 API)
- **경로**: `/community/job-posting`

#### 구직 신청 (Job Seeking)
- **용도**: 사역자나 직원 구직 신청
- **테이블**: `job_seekers`
- **API**: 레거시 REST API
- **경로**: `/community/job-seeking`

### 2.3 음악팀 (Music Team)

#### 음악팀 모집 (Music Team Recruitment)
- **용도**: 찬양팀, 워십팀 등의 팀원 모집
- **테이블**: `community_music_teams`
- **Edge Function**: `music-teams`
- **경로**: `/community/music-team-recruit`

#### 음악팀 참여 신청 (Music Team Seeking)
- **용도**: 음악팀에 참여하고자 하는 지원자 등록
- **테이블**: `music_team_seekers`
- **Edge Function**: `music-seekers`
- **경로**: `/community/music-team-seeking`

### 2.4 교회 소식 (Church News & Events)

#### 교회 소식 (Church News)
- **용도**: 교회 행사, 특별 집회 등의 소식 공유
- **테이블**: `church_news`
- **Edge Function**: `church-news`
- **경로**: `/community/church-news`

#### 교회 행사 (Church Events)
- **용도**: 교회 행사 일정 등록 및 관리
- **테이블**: `church_events`
- **API**: 레거시 REST API
- **경로**: `/community/church-events`

#### 기도 요청 (Prayer Requests)
- **용도**: 기도 제목 공유
- **테이블**: `prayer_requests`
- **API**: 레거시 REST API
- **경로**: `/community/prayer-requests`

---

## 3. 각 카테고리별 기능 명세

### 3.1 무료 나눔 (Free Sharing)

#### 데이터 구조
```typescript
interface SharingItem {
  id: number;
  title: string;              // 제목 (최대 100자)
  description: string;        // 설명 (최대 1000자)
  category: string;           // 카테고리 (가구, 전자제품, 도서, 악기, 기타)
  condition: string;          // 상태 (양호, 보통, 사용감있음)
  quantity: number;           // 수량
  images: string[];           // 이미지 URL 배열 (최대 12장)
  church: string | null;      // 교회명 (9998이면 null)
  church_id: number;          // 교회 ID
  location: string;           // 지역 (최대 100자)
  contactPhone: string;       // 연락처 전화번호
  contactEmail?: string;      // 연락처 이메일 (선택)
  status: 'available' | 'reserved' | 'completed';
  is_free: boolean;           // 무료 여부 (true)
  createdAt: string;          // 생성일시
  view_count: number;         // 조회수
  likes: number;              // 좋아요 수
  comments: number;           // 댓글 수
  userName?: string;          // 작성자명
  author_id: number;          // 작성자 ID
}
```

#### API 엔드포인트

**목록 조회**
```
GET /community-sharing
Query Parameters:
  - limit: number (기본값: 50)
  - category: string (선택)
  - status: string (선택)
  - search: string (선택)
  - is_free: true (무료 나눔 필터)
```

**상세 조회**
```
GET /community/sharing/:id
```

**게시글 작성**
```
POST /community-sharing
Body:
  - title: string (필수)
  - description: string (필수)
  - category: string (필수)
  - condition: string (필수)
  - images: string[] (필수, Supabase Storage URL)
  - location: string (필수)
  - contact_phone: string (필수)
  - contact_email: string (선택)
  - is_free: true
```

**게시글 수정**
```
PUT /community/sharing/:id
```

**게시글 삭제**
```
DELETE /community/sharing/:id
```

**조회수 증가**
```
POST /community/sharing/:id/increment-view
```

#### UI 플로우

1. **목록 페이지** (`/community/free-sharing`)
   - 검색바: 제목/설명 검색
   - 필터: 카테고리, 상태 선택
   - 뷰 모드: 그리드/리스트 전환
   - 테이블 컬럼: 제목(이미지), 카테고리, 가격(무료), 지역, 상태, 작성자, 등록일, 조회수

2. **등록 페이지** (`/community/free-sharing/create`)
   - 이미지 업로드 (최대 12장, 각 10MB, 총 15MB 제한)
   - 카테고리 선택
   - 제목 입력 (최대 100자)
   - 설명 입력 (최대 1000자)
   - 상태 선택 (양호/보통/사용감있음)
   - 연락처 입력 (전화번호 필수, 이메일 선택)

3. **상세 페이지** (`/community/free-sharing/:id`)
   - 이미지 갤러리 (확대, 좌우 이동)
   - 게시글 정보 (제목, 카테고리, 상태, 지역, 작성자, 등록일)
   - 설명 내용
   - 연락처 정보
   - 수정/삭제 버튼 (작성자만)

---

### 3.2 물품 요청 (Item Request)

#### 데이터 구조
```typescript
interface RequestItem {
  id: number;
  title: string;              // 제목 (최대 100자)
  description: string;        // 설명 (최대 1000자)
  category: string;           // 카테고리
  requestedItem?: string;     // 요청 물품명
  quantity?: number;          // 수량
  reason?: string;            // 요청 사유 (최대 500자)
  neededDate?: string;        // 필요일
  church: string | null;      // 교회명
  church_id?: number;         // 교회 ID
  location: string;           // 거래 희망 지역
  priceRange?: string;        // 희망 가격대 (최대 50자)
  contactPhone?: string;      // 연락처 전화번호
  contactEmail?: string;      // 연락처 이메일
  status: 'requesting' | 'matching' | 'completed' | 'active';
  urgency: 'low' | 'medium' | 'high' | 'normal';
  createdAt: string;
  view_count: number;
  likes: number;
  comments: number;
  userName?: string;
  images?: string[];          // 참고 이미지 (선택)
  rewardType?: string;        // 보상 타입
  rewardAmount?: number;      // 보상 금액
}
```

#### API 엔드포인트

**목록 조회**
```
GET /community-requests
Query Parameters:
  - limit: number
  - category: string (선택)
  - urgency: string (선택)
  - status: string (선택)
  - search: string (선택)
```

**게시글 작성**
```
POST /community-requests
Body:
  - title: string (필수)
  - description: string (필수)
  - category: string (필수)
  - location: string (필수)
  - price_range: string (필수)
  - needed_date: string (선택)
  - contact_phone: string (필수)
  - contact_email: string (선택)
  - urgency: string (기본값: 'normal')
  - images: string[] (선택)
```

#### 주요 필드

- **카테고리**: 가구, 의류, 도서, 전자제품, 생활용품, 기타
- **긴급도**:
  - high (긴급) - 빨간색 배지
  - medium (보통) - 주황색 배지
  - low (여유) - 초록색 배지
  - normal (기본값)
- **상태 매핑**:
  - active/requesting → "요청중" (파란색)
  - completed → "요청완료" (회색)
  - cancelled → "요청취소" (빨간색)

---

### 3.3 물품 판매 (Item Sale)

#### 데이터 구조
```typescript
interface OfferItem {
  id: number;
  title: string;
  itemName: string;
  category: string;
  condition: string;          // 새상품, 양호, 보통, 사용감있음
  quantity: number;
  price?: number;             // 판매가격
  description: string;
  church: string | null;
  location: string;
  deliveryMethod: string;     // 직거래, 택배발송, 픽업, 협의
  purchaseDate?: string;      // 구매 시기
  status: 'available' | 'reserved' | 'completed';
  createdAt: string;
  view_count: number;
  likes: number;
  comments: number;
  userName?: string;
  images?: string[];
  contactPhone?: string;
  contactEmail?: string;
  is_free: false;             // 무료 나눔 구분
}
```

#### API 엔드포인트
무료 나눔과 동일한 `community-sharing` Edge Function 사용하며, `is_free: false`로 구분

---

### 3.4 구인 공고 (Job Posting)

#### 데이터 구조
```typescript
interface JobPost {
  id: number;
  title: string;
  description?: string;
  churchName: string | null;
  company?: string;           // 회사명
  churchIntro: string;        // 교회/회사 소개
  position: string;           // 직책
  jobType: 'full-time' | 'part-time' | 'volunteer';
  salary: string;             // 급여
  benefits: string[];         // 복리후생
  qualifications: string[];   // 지원 자격
  requiredDocuments: string[]; // 제출 서류
  location: string;
  deadline: string;           // 마감일
  applicationDeadline?: string;
  status: 'open' | 'closed';
  createdAt: string;
  view_count: number;
  likes: number;
  comments?: number;
  applications: number;       // 지원 건수
  contactPhone?: string;
  contactEmail?: string;
  userName?: string;
}
```

#### 주요 필드

- **직종 (JobType)**: 사무직, 교육, 사역, 음악, 디자인, 기술, 서비스, 기타
- **근무형태**: 정규직, 계약직, 파트타임, 프리랜서
- **상태**:
  - open → "모집중"
  - closed → "모집완료"

---

### 3.5 음악팀 모집 (Music Team Recruitment)

#### 데이터 구조
```typescript
interface MusicRecruitment {
  id: number;
  title: string;
  church_name: string;
  recruitment_type: string;
  worship_type: string;       // 예배 형태 (주일예배, 수요예배 등)
  team_types: string[];       // 팀 형태 (찬양팀, 워십팀 등)
  instruments_needed: string[]; // 필요 악기/파트
  schedule?: string;          // 연습 일정
  location?: string;          // 연습 장소
  description?: string;
  requirements?: string;      // 지원 자격
  compensation?: string;      // 보상/사례
  contact_phone: string;
  contact_email?: string;
  status: string;
  applications: number;
  view_count: number;
  likes: number;
  created_at: string;
  author_id: number;
  author_name: string;
  church_id: number;
}
```

#### 주요 필드

- **악기/파트**: 보컬, 리드보컬, 서브보컬, 코러스, 피아노, 키보드, 오르간, 어쿠스틱 기타, 일렉트릭 기타, 베이스, 드럼, 퍼커션, 바이올린, 첼로, 플루트, 색소폰, 트럼펫, 지휘, 작곡/편곡, 음향, 기타
- **팀 형태**: 찬양팀, 워십팀, 어쿠스틱 팀, 밴드, 오케스트라, 합창단, 무용팀, 현재 솔로 활동, 기타
- **모집 유형**: new_member (신규), substitute (대타), project (프로젝트), permanent (정규)
- **경력 레벨**: 입문, 초급, 중급, 고급, 전문가, 무관

---

### 3.6 음악팀 참여 신청 (Music Team Seeking)

#### 데이터 구조
```typescript
interface MusicSeeker {
  id: number;
  title: string;
  name: string;               // 작성자명
  teamName?: string;          // 팀명
  instrument: string;         // 전공 파트 (단일 선택)
  instruments?: string[];     // 호환성
  experience: string;         // 경력
  portfolio: string;          // 포트폴리오
  portfolioFile?: string;     // 포트폴리오 파일
  preferredLocation: string[]; // 선호 지역 (배열)
  availableDays: string[];    // 가능 요일
  availableTime?: string;     // 가능 시간대
  contactPhone: string;
  contactEmail?: string;
  introduction?: string;      // 자기소개
  status: 'available' | 'interviewing' | 'inactive';
  createdAt: string | null;
  view_count: number;
  likes: number;
  matches: number;
  applications?: number;
  userName?: string;
  church?: string | null;
  location?: string;
}
```

#### 주요 필드

- **가능 요일**: 월요일, 화요일, 수요일, 목요일, 금요일, 토요일, 일요일
- **가능 시간대**: 오전, 오후, 저녁, 야간, 상시, 협의
- **상태**:
  - available → "활동 가능"
  - interviewing → "면접 중"
  - inactive → "비활성"

---

### 3.7 교회 소식 (Church News)

#### 데이터 구조
```typescript
interface ChurchNews {
  id: number;
  title: string;              // 제목 (최대 100자)
  content: string;            // 내용 (최대 1000자)
  category: string;           // 카테고리 (20+ 종류)
  priority?: 'urgent' | 'important' | 'normal';
  isUrgent?: boolean;
  eventDate?: string;         // 행사일
  eventTime?: string;         // 행사 시간
  location?: string;          // 장소 (최대 100자)
  organizer?: string;         // 주최자/부서 (최대 50자)
  targetAudience?: string;    // 대상 (최대 50자)
  participationFee?: string;  // 참가비 (최대 50자)
  contactPerson?: string;     // 담당자 (최대 50자)
  contactPhone?: string;      // 연락처
  contactEmail?: string;      // 이메일
  images?: string[];          // 이미지 배열
  status?: 'active' | 'completed' | 'cancelled';
  view_count?: number;
  likes?: number;
  comments?: number;
  tags?: string[];
  authorId?: number;
  authorName?: string;
  churchId?: number;
  churchName?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

#### 카테고리 (22종)

**예배/집회 관련**
- 특별예배/연합예배
- 부흥회/말씀집회
- 기도회/철야기도회
- 성찬식/세례식

**교육/양육 행사**
- 성경공부/제자훈련
- 세미나/워크숍
- 수련회/성경학교
- 신앙강좌/성경퀴즈

**친교/봉사 행사**
- 바자회/플리마켓
- 야유회/체육대회
- 지역봉사/선교행사
- 전도집회/노방전도

**문화/미디어 행사**
- 찬양집회/음악회
- 연극/뮤지컬
- 방송/음향 박람회
- 영상/사진 전시

**기타 공동체 행사**
- 창립기념행사
- 절기행사(성탄/부활절)
- 결혼예배/장례예배
- 리더십수련회/임직식
- 기타

#### 우선순위 색상

- **urgent (긴급)**: 빨간색 배지, 벨 아이콘
- **important (중요)**: 주황색 배지, 별 아이콘
- **normal (일반)**: 파란색 배지, 메가폰 아이콘

---

## 4. 공통 기능 명세

### 4.1 이미지 업로드

#### Supabase Storage 구조
```
Bucket: community-images
Path: church_{church_id}/{filename}
Filename: community_church_{timestamp}_{randomId}.{ext}
```

#### 제약사항
- **최대 이미지 수**: 12장
- **개별 파일 크기**: 10MB
- **전체 파일 크기**: 15MB
- **지원 형식**: JPG, PNG, GIF

#### 업로드 프로세스
1. 클라이언트에서 파일 선택 및 유효성 검사
2. Supabase Storage에 직접 업로드
3. 공개 URL 생성
4. URL 배열을 백엔드 API에 전송

### 4.2 검색 및 필터링

#### 공통 검색 파라미터
```typescript
interface SearchParams {
  search?: string;        // 제목/설명 전체 텍스트 검색
  category?: string;      // 카테고리 필터
  status?: string;        // 상태 필터
  limit?: number;         // 결과 개수 제한 (기본값: 50)
  page?: number;          // 페이지 번호
  sort?: 'latest' | 'oldest' | 'most_viewed' | 'most_liked';
}
```

#### 카테고리별 추가 필터

**무료 나눔/물품 판매**
- condition: 상품 상태
- price_min, price_max: 가격 범위
- is_free: 무료 여부

**물품 요청**
- urgency: 긴급도
- needed_date: 필요일

**구인 공고**
- job_type: 직종
- employment_type: 근무형태
- salary_range: 급여 범위

**음악팀 모집**
- worship_type: 예배 형태
- instruments: 악기/파트
- experience: 경력 레벨

**교회 소식**
- priority: 우선순위
- event_date: 행사일

### 4.3 상태 관리

#### 표준 상태 매핑
```typescript
type StandardStatus = 'active' | 'completed' | 'cancelled' | 'paused';

// 레거시 → 표준 상태 매핑
const statusMapping = {
  // Active 상태
  'active': 'active',
  'available': 'active',
  'open': 'active',
  'requesting': 'active',
  'sharing': 'active',

  // Completed 상태
  'completed': 'completed',
  'closed': 'completed',
  'inactive': 'completed',
  'reserved': 'completed',

  // Cancelled 상태
  'cancelled': 'cancelled',

  // Paused 상태
  'paused': 'paused'
};
```

#### 상태별 표시 색상
- **active**: 초록색/파란색 (진행중, 모집중, 나눔중, 요청중)
- **completed**: 회색 (완료, 마감, 나눔완료, 요청완료)
- **cancelled**: 빨간색 (취소)
- **paused**: 주황색 (일시중지)

### 4.4 조회수 관리

#### 조회수 증가 API
```
POST /community/{category}/{id}/increment-view
Response:
{
  data: {
    previous_view_count: number,
    new_view_count: number
  }
}
```

#### 구현 방식
- 상세 페이지 진입 시 백그라운드에서 API 호출
- 목록에서 해당 아이템의 조회수 실시간 업데이트
- 중복 증가 방지 로직 (세션 기반)

### 4.5 권한 및 접근 제어

#### 인증 방식

**Supabase Edge Functions**
- Custom Token: `temp_token_{user_id}_{timestamp}`
- Header: `X-Custom-Auth` 또는 `Authorization: Bearer {token}`
- 토큰 유효기간: 24시간

**레거시 API**
- JWT Token in localStorage
- Header: `Authorization: Bearer {jwt_token}`

#### 권한 레벨
- **작성자**: 자신의 게시글 수정/삭제 가능
- **관리자**: 모든 게시글 관리 가능
- **일반 사용자**: 조회 및 새 게시글 작성 가능

#### Church ID 특별 처리
- **9998**: "협력사" 또는 "무소속"으로 표시
- 교회명 필드가 null이면 "교회 정보 없음" 표시

---

## 5. 데이터 타입 정의

### 5.1 공통 타입 (`community-common.ts`)

```typescript
// 표준 상태
export type CommunityStatus = "active" | "completed" | "cancelled" | "paused";

// 표준 페이지네이션
export interface StandardPagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// 표준 목록 응답
export interface StandardListResponse<T> {
  success: boolean;
  data: T[];
  pagination: StandardPagination;
}

// 기본 게시글
export interface CommunityBasePost {
  id: number;
  title: string;
  description?: string;
  status: CommunityStatus;
  author_id: number;
  author_name: string;
  church_id?: number;
  church_name?: string | null;
  view_count: number;
  likes: number;
  comments?: number;
  created_at: string;
  updated_at?: string;
}

// 연락처 정보
export interface ContactInfo {
  contact_phone: string;
  contact_email?: string;
  contact_method?: "phone" | "email" | "both";
}

// 위치 정보
export interface LocationInfo {
  location: string;
  detailed_location?: string;
}

// 이미지 정보
export interface ImageInfo {
  images: string[];
  thumbnail?: string;
}
```

### 5.2 나눔/거래 타입 (`community-sharing.ts`)

```typescript
// 무료 나눔
export interface SharingItem extends CommunityBasePost, ContactInfo, LocationInfo, ImageInfo {
  condition: string;
  quantity: number;
  is_free: boolean;
  delivery_method?: string;
  pickup_location?: string;
}

// 물품 요청
export interface RequestItem extends CommunityBasePost, ContactInfo, LocationInfo {
  requested_item: string;
  quantity: number;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'normal';
  needed_date?: string;
  max_budget?: number;
}

// 물품 판매
export interface OfferItem extends CommunityBasePost, ContactInfo, LocationInfo, ImageInfo {
  item_name: string;
  condition: string;
  quantity: number;
  price?: number;
  delivery_method: string;
  negotiable: boolean;
  purchase_date?: string;
}
```

### 5.3 음악팀 타입 (`music-team.ts`)

```typescript
// 악기/파트
export type InstrumentType =
  | '보컬' | '리드보컬' | '서브보컬' | '코러스'
  | '피아노' | '키보드' | '오르간'
  | '어쿠스틱 기타' | '일렉트릭 기타' | '베이스'
  | '드럼' | '퍼커션'
  | '바이올린' | '첼로' | '플루트' | '색소폰' | '트럼펫'
  | '지휘' | '작곡/편곡' | '음향'
  | '기타';

// 팀 형태
export type TeamType =
  | '찬양팀' | '워십팀' | '어쿠스틱 팀' | '밴드'
  | '오케스트라' | '합창단' | '무용팀'
  | '현재 솔로 활동' | '기타';

// 음악팀 모집
export interface MusicTeamRecruitment extends CommunityBasePost, ContactInfo, LocationInfo {
  church_name: string;
  recruitment_type: 'new_member' | 'substitute' | 'project' | 'permanent';
  instruments_needed: InstrumentType[];
  team_type: TeamType;
  schedule?: string;
  requirements?: string;
  compensation?: string;
  experience_required?: '입문' | '초급' | '중급' | '고급' | '전문가' | '무관';
  applications?: number;
}

// 음악팀 참여
export interface MusicTeamSeeker extends CommunityBasePost, ContactInfo, LocationInfo {
  name: string;
  team_name?: string;
  instrument: InstrumentType;
  experience: string;
  portfolio: string;
  preferred_location: string[];
  available_days: string[];
  available_time?: string;
  introduction?: string;
  matches?: number;
}
```

### 5.4 구인/구직 타입 (`job-posts.ts`)

```typescript
// 직무 타입
export type JobType =
  | '담임목사' | '부목사' | '전도사' | '선교사'
  | '찬양사역자' | '교육사역자' | '청소년사역자' | '어린이사역자'
  | '행정사역자' | '재정사역자' | '시설관리자'
  | '사회복지사' | '상담사역자' | '기타';

// 고용 형태
export type EmploymentType = 'full-time' | 'part-time' | 'volunteer' | 'contract' | 'internship';

// 구인 공고
export interface JobPost extends CommunityBasePost, ContactInfo, LocationInfo {
  company_name: string;
  church_name?: string;
  position: string;
  job_type: JobType;
  employment_type: EmploymentType;
  salary_range?: string;
  requirements?: string;
  benefits?: string;
  application_deadline?: string;
  applications?: number;
}

// 구직 신청
export interface JobSeeker extends CommunityBasePost, ContactInfo, LocationInfo {
  name: string;
  ministry_field: string[];
  career: string;
  education: string;
  certifications: string[];
  introduction: string;
  preferred_location: string[];
  availability: string;
  matches?: number;
}
```

---

## 6. API 엔드포인트 전체 목록

### 6.1 Supabase Edge Functions

| 기능 | 메서드 | 엔드포인트 | 파라미터 |
|-----|--------|-----------|---------|
| **무료 나눔/물품 판매** |
| 목록 조회 | GET | `/community-sharing` | limit, category, status, search, is_free |
| 상세 조회 | GET | `/community-sharing/:id` | - |
| 게시글 작성 | POST | `/community-sharing` | title, description, category, images 등 |
| 게시글 수정 | PUT | `/community-sharing/:id` | - |
| 게시글 삭제 | DELETE | `/community-sharing/:id` | - |
| **물품 요청** |
| 목록 조회 | GET | `/community-requests` | limit, category, urgency, status, search |
| 상세 조회 | GET | `/community-requests/:id` | - |
| 게시글 작성 | POST | `/community-requests` | title, description, category 등 |
| 게시글 수정 | PUT | `/community-requests/:id` | - |
| 게시글 삭제 | DELETE | `/community-requests/:id` | - |
| **음악팀 모집** |
| 목록 조회 | GET | `/music-teams` | limit, worship_type, instruments, status, search |
| 상세 조회 | GET | `/music-teams/:id` | - |
| 게시글 작성 | POST | `/music-teams` | title, team_name, instruments_needed 등 |
| **음악팀 참여** |
| 목록 조회 | GET | `/music-seekers` | limit, instrument, location, status |
| 상세 조회 | GET | `/music-seekers/:id` | - |
| 게시글 작성 | POST | `/music-seekers` | title, instrument, experience 등 |
| **내 게시글** |
| 전체 조회 | GET | `/my-posts` | type, post_type, status, search (Header: temp-token) |
| **커뮤니티 통계** |
| 통계 조회 | GET | `/community/stats` | - |
| 최근 게시글 | GET | `/community/recent-posts` | limit |

### 6.2 레거시 REST API

| 기능 | 메서드 | 엔드포인트 |
|-----|--------|-----------|
| **구인 공고** |
| 목록 조회 | GET | `/api/v1/community/job-posting` |
| 상세 조회 | GET | `/api/v1/community/job-posting/:id` |
| 게시글 작성 | POST | `/api/v1/community/job-posting` |
| **구직 신청** |
| 목록 조회 | GET | `/api/v1/community/job-seeking` |
| 상세 조회 | GET | `/api/v1/community/job-seeking/:id` |
| 게시글 작성 | POST | `/api/v1/community/job-seeking` |
| **교회 행사** |
| 목록 조회 | GET | `/api/v1/community/events` |
| 상세 조회 | GET | `/api/v1/community/events/:id` |
| 게시글 작성 | POST | `/api/v1/community/events` |
| **기도 요청** |
| 목록 조회 | GET | `/api/v1/community/prayer-requests` |
| 상세 조회 | GET | `/api/v1/community/prayer-requests/:id` |
| 게시글 작성 | POST | `/api/v1/community/prayer-requests` |
| **교회 소식** |
| 목록 조회 | GET | `/api/v1/community/church-news` |
| 상세 조회 | GET | `/api/v1/community/church-news/:id` |
| 게시글 작성 | POST | `/api/v1/community/church-news` |

### 6.3 조회수 증가 API

| 카테고리 | 엔드포인트 |
|---------|-----------|
| 무료 나눔 | `POST /api/v1/community/sharing/:id/increment-view` |
| 물품 요청 | `POST /api/v1/community/item-request/:id/increment-view` |
| 교회 소식 | `POST /api/v1/community/church-news/:id/increment-view` |

---

## 7. UI/UX 플로우

### 7.1 커뮤니티 홈

**경로**: `/community`

**구성 요소**
1. **통계 카드 (7개)**
   - 전체 게시글
   - 진행 중인 나눔
   - 활성 요청
   - 구인 공고
   - 음악팀
   - 이달의 행사
   - 전체 회원

2. **빠른 시작 카드**
   - 무료 나눔
   - 물품 요청
   - 나눔 제공 (물품 판매)

3. **최근 활동**
   - 최근 5개 게시글
   - 카테고리별 아이콘 및 색상
   - 교회명, 지역, 등록일 표시

### 7.2 게시글 목록 페이지

**공통 레이아웃**
```
┌─────────────────────────────────────┐
│ [헤더] 카테고리명                    │
│                                     │
│ [검색바] 🔍                         │
│                                     │
│ [필터] 카테고리 | 상태 | [뷰 모드]  │
│                                     │
│ [등록 버튼] + 새 게시글 등록         │
│                                     │
│ [테이블/그리드]                     │
│  - 제목 (이미지)                    │
│  - 카테고리                         │
│  - 지역                             │
│  - 상태                             │
│  - 작성자                           │
│  - 등록일                           │
│  - 조회수                           │
│                                     │
│ [페이지네이션]                      │
└─────────────────────────────────────┘
```

### 7.3 게시글 작성 페이지

**공통 폼 구조**
```
┌─────────────────────────────────────┐
│ [← 뒤로 가기]                       │
│                                     │
│ [제목] 게시글 등록                  │
│                                     │
│ [이미지 업로드 영역]                │
│  - 드래그 앤 드롭 또는 클릭         │
│  - 미리보기 썸네일                  │
│  - 메인 이미지 선택                 │
│  - 삭제 버튼                        │
│                                     │
│ [카테고리 선택] ▼                   │
│                                     │
│ [제목 입력] ___________________    │
│                                     │
│ [설명 입력] (멀티라인)              │
│  ┌───────────────────────────┐     │
│  │                           │     │
│  │                           │     │
│  └───────────────────────────┘     │
│                                     │
│ [추가 필드들...]                    │
│  - 카테고리별 맞춤 필드             │
│                                     │
│ [연락처]                            │
│  - 전화번호 (필수)                  │
│  - 이메일 (선택)                    │
│                                     │
│ [취소] [등록]                       │
└─────────────────────────────────────┘
```

### 7.4 게시글 상세 페이지

**공통 레이아웃**
```
┌─────────────────────────────────────┐
│ [← 목록으로]                        │
│                                     │
│ [이미지 갤러리]                     │
│  ┌───────────────────────────┐     │
│  │                           │     │
│  │    메인 이미지             │     │
│  │                           │     │
│  └───────────────────────────┘     │
│  [◄] [썸네일...] [►]               │
│                                     │
│ [카테고리 배지] [상태 배지]         │
│                                     │
│ [제목]                              │
│                                     │
│ [메타 정보]                         │
│  👤 작성자 | 🏛 교회명             │
│  📍 지역 | 📅 등록일               │
│  👁 조회수 | ❤️ 좋아요             │
│                                     │
│ [구분선]                            │
│                                     │
│ [상세 내용]                         │
│  - 설명                             │
│  - 추가 정보 (카테고리별)           │
│                                     │
│ [연락처 정보]                       │
│  📞 전화번호                        │
│  📧 이메일                          │
│                                     │
│ [수정] [삭제] (작성자만)            │
└─────────────────────────────────────┘
```

### 7.5 내 게시글 관리

**경로**: `/community/my-posts`

**기능**
- 모든 카테고리의 내 게시글 통합 조회
- 카테고리 필터 (무료나눔, 물품판매, 물품요청, 구인공고, 음악팀모집 등)
- 상태 필터 (진행중, 완료, 취소)
- 검색 기능
- 일괄 수정/삭제

---

## 8. 데이터 변환 규칙

### 8.1 필드명 변환 (Camel ↔ Snake Case)

**프론트엔드 → 백엔드**
```typescript
const toBackend = {
  contactInfo: 'contact_info',
  contactPhone: 'contact_phone',
  contactEmail: 'contact_email',
  authorId: 'author_id',
  authorName: 'author_name',
  churchId: 'church_id',
  churchName: 'church_name',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  viewCount: 'view_count',
  isFree: 'is_free',
  neededDate: 'needed_date',
  priceRange: 'price_range',
  rewardType: 'reward_type',
  rewardAmount: 'reward_amount'
}
```

**백엔드 → 프론트엔드**
```typescript
const toFrontend = {
  contact_info: 'contactInfo',
  contact_phone: 'contactPhone',
  contact_email: 'contactEmail',
  author_id: 'authorId',
  author_name: 'authorName',
  church_id: 'churchId',
  church_name: 'churchName',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  view_count: 'viewCount',
  is_free: 'isFree'
}
```

### 8.2 날짜 포맷팅

**한국어 상대 시간 표시**
```typescript
function formatCreatedAt(dateString: string | null): string {
  if (!dateString) return '등록일 없음';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
```

### 8.3 교회 ID 변환

```typescript
function getChurchName(churchId: number, churchName?: string): string | null {
  if (churchId === 9998) return null; // "협력사" 또는 "무소속"
  return churchName || `교회 ${churchId}`;
}
```

### 8.4 배열 필드 파싱

```typescript
function parseJsonArray(value: any, fallback: any[] = []): any[] {
  // 이미 배열인 경우
  if (Array.isArray(value)) return value;

  // JSON 문자열인 경우
  if (typeof value === 'string') {
    if (!value || value === 'null' || value === 'undefined') {
      return fallback;
    }
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      // 파싱 실패 시 쉼표로 분할
      const splitResult = value.split(',').map(item => item.trim()).filter(item => item);
      return splitResult.length > 0 ? splitResult : fallback;
    }
  }

  // null/undefined
  if (value === null || value === undefined) return fallback;

  // 기타 타입
  return [value];
}
```

---

## 9. 에러 처리

### 9.1 표준 에러 응답

```typescript
interface ApiErrorResponse {
  success: false;
  error: string;          // 에러 코드
  message: string;        // 한국어 에러 메시지
  details?: any;          // 추가 정보
}
```

### 9.2 주요 에러 코드

| 코드 | 메시지 | 설명 |
|-----|--------|------|
| UNAUTHORIZED | 인증이 필요합니다 | 토큰 없음 또는 만료 |
| INVALID_TOKEN | 유효하지 않은 토큰입니다 | 토큰 형식 오류 |
| TOKEN_EXPIRED | 토큰이 만료되었습니다 | 24시간 초과 |
| FORBIDDEN | 권한이 없습니다 | 접근 권한 부족 |
| NOT_FOUND | 게시글을 찾을 수 없습니다 | 존재하지 않는 ID |
| VALIDATION_ERROR | 입력값이 올바르지 않습니다 | 필수 필드 누락 또는 형식 오류 |
| IMAGE_TOO_LARGE | 이미지 크기가 너무 큽니다 | 파일 크기 초과 |
| TOO_MANY_IMAGES | 이미지 개수가 너무 많습니다 | 12장 초과 |
| INTERNAL_ERROR | 서버 오류가 발생했습니다 | 예상치 못한 오류 |

### 9.3 클라이언트 에러 처리

```typescript
try {
  const result = await communityService.createSharingItem(data);
  alert('게시글이 등록되었습니다.');
  navigate('/community/free-sharing');
} catch (error: any) {
  if (error.response?.data?.message) {
    alert(error.response.data.message); // 서버 에러 메시지 표시
  } else {
    alert('게시글 등록에 실패했습니다.');
  }
  console.error('등록 실패:', error);
}
```

---

## 10. 성능 최적화

### 10.1 코드 스플리팅

- React.lazy를 통한 컴포넌트 지연 로딩
- 라우트별 청크 분리
- 공통 컴포넌트 번들링

### 10.2 이미지 최적화

- Supabase Storage의 CDN 활용
- 썸네일 자동 생성 (향후 구현 예정)
- Lazy Loading 적용

### 10.3 캐싱 전략

**사용자 데이터 캐시**
```typescript
let usersCache: any[] | null = null;
let usersCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분
```

**Supabase Storage 캐시**
- Cache-Control: 3600 (1시간)

### 10.4 데이터베이스 최적화

- 인덱스: created_at, status, author_id, church_id
- 쿼리 제한: 기본 50개, 최대 100개
- 정렬: created_at DESC (최신순)

---

## 11. 보안 고려사항

### 11.1 인증 및 권한

- 모든 API 요청에 인증 토큰 필요
- 작성자 본인만 수정/삭제 가능
- 관리자 권한으로 모든 게시글 관리 가능

### 11.2 입력 검증

**클라이언트 검증**
- 필수 필드 체크
- 최대 길이 체크
- 이메일 형식 검증
- 이미지 크기 및 형식 검증

**서버 검증**
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (HTML 이스케이프)
- CSRF 방지 (CORS 헤더)

### 11.3 민감 정보 보호

- 연락처 정보는 인증된 사용자만 조회
- Church ID 9998 처리 (협력사 비공개)
- 개인정보는 암호화 저장 (향후 구현)

---

## 12. 마이그레이션 상태

### 12.1 완료된 마이그레이션

✅ **무료 나눔** - `community-sharing` Edge Function
✅ **물품 판매** - `community-sharing` Edge Function
✅ **물품 요청** - `community-requests` Edge Function
✅ **음악팀 모집** - `music-teams` Edge Function
✅ **음악팀 참여** - `music-seekers` Edge Function
✅ **내 게시글** - `my-posts` Edge Function

### 12.2 부분 마이그레이션

🟡 **교회 소식** - `church-news` Edge Function (일부 기능)
🟡 **공지사항** - `announcements` Edge Function (일부 기능)

### 12.3 미완료 마이그레이션

❌ **구인 공고** - 레거시 REST API 사용 중
❌ **구직 신청** - 레거시 REST API 사용 중
❌ **교회 행사** - 레거시 REST API 사용 중
❌ **기도 요청** - 레거시 REST API 사용 중

---

## 13. 향후 개선 계획

### 13.1 기능 개선

- [ ] 댓글 기능 구현
- [ ] 좋아요 기능 구현
- [ ] 게시글 북마크 기능
- [ ] 알림 기능 (새 댓글, 좋아요 등)
- [ ] 실시간 채팅 (문의)
- [ ] 이미지 자동 리사이징 및 썸네일 생성
- [ ] 게시글 공유 기능 (SNS, 링크 복사)

### 13.2 UI/UX 개선

- [ ] 무한 스크롤 페이지네이션
- [ ] 필터 프리셋 저장
- [ ] 다크 모드 지원
- [ ] 모바일 앱 반응형 최적화
- [ ] 접근성 개선 (ARIA 속성)

### 13.3 성능 개선

- [ ] 이미지 지연 로딩 최적화
- [ ] 서버사이드 렌더링 (SSR)
- [ ] Progressive Web App (PWA) 지원
- [ ] 오프라인 모드 지원

### 13.4 보안 강화

- [ ] Rate Limiting 구현
- [ ] CAPTCHA 추가 (스팸 방지)
- [ ] 2단계 인증 (2FA)
- [ ] 개인정보 암호화

---

## 14. 참고 자료

### 14.1 주요 파일 경로

**프론트엔드**
- 컴포넌트: `/admin-dashboard/src/components/Community/`
- 서비스: `/admin-dashboard/src/services/communityService.ts`
- 타입: `/admin-dashboard/src/types/`
- 설정: `/admin-dashboard/src/components/Community/postConfigs.ts`

**백엔드**
- Edge Functions: `/admin-dashboard/supabase/functions/`
- 마이그레이션: `/admin-dashboard/supabase/migrations/`

### 14.2 관련 문서

- Supabase 공식 문서: https://supabase.com/docs
- React 19 문서: https://react.dev/
- TypeScript 문서: https://www.typescriptlang.org/docs/

### 14.3 코딩 컨벤션

- TypeScript Strict 모드 사용
- ESLint + Prettier 적용
- 컴포넌트명: PascalCase
- 함수명/변수명: camelCase
- 상수: UPPER_SNAKE_CASE
- 타입/인터페이스: PascalCase

---

## 15. 문의 및 지원

문제 발생 시:
1. 브라우저 콘솔 확인 (F12)
2. 네트워크 탭에서 API 응답 확인
3. Supabase 대시보드에서 Edge Function 로그 확인
4. 개발팀에 문의

---

**문서 버전**: 1.0.0
**최종 수정일**: 2025-10-01
**작성자**: Claude Code Assistant
