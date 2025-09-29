# 스마트 요람 교회 관리 시스템 모바일 API 문서

## 개요
이 문서는 스마트 요람 교회 관리 시스템의 Supabase 기반 API를 모바일 개발자를 위해 정리한 것입니다. 모든 API는 한국어를 지원하며, 교회 커뮤니티에 특화된 기능들을 제공합니다.

---

## 📋 목차

1. [인증 및 사용자 관리](#1-인증-및-사용자-관리)
2. [교회 정보 관리](#2-교회-정보-관리)
3. [커뮤니티 기능](#3-커뮤니티-기능)
4. [교회 운영 관리](#4-교회-운영-관리)
5. [AI 상담 시스템](#5-ai-상담-시스템)
6. [통계 및 분석](#6-통계-및-분석)
7. [기타 기능](#7-기타-기능)

---

## 🔐 1. 인증 및 사용자 관리

### 1.1 사용자 인증 (`auth` 서비스)

**로그인**
```typescript
POST /auth/login
{
  email: string;
  password: string;
}
// Response: { user, session, error? }
```

**회원가입**
```typescript
POST /auth/signup
{
  email: string;
  password: string;
  full_name?: string;
  church_id?: string;
}
// Response: { user, session, error? }
```

**사용자 정보 조회**
```typescript
GET /auth/user
// Response: User | null
```

**로그아웃**
```typescript
POST /auth/logout
// Response: { error? }
```

### 1.2 사용자 관리 (`members` Edge Function)

**교인 목록 조회**
```typescript
POST /functions/v1/members
{
  action: "get_members";
  church_id: number;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}
// Response: MemberListResponse
```

**교인 상세 정보**
```typescript
POST /functions/v1/members
{
  action: "get_member";
  member_id: number;
}
// Response: MemberDetailResponse
```

**교인 정보 수정**
```typescript
POST /functions/v1/members
{
  action: "update_member";
  member_id: number;
  member_data: MemberUpdateData;
}
// Response: StandardResponse
```

**교인 초대**
```typescript
POST /functions/v1/members
{
  action: "invite_member";
  email: string;
  church_id: number;
  role?: string;
  full_name?: string;
}
// Response: InviteResponse
```

---

## 🏛️ 2. 교회 정보 관리

### 2.1 교회 정보 (`churches` 테이블)

**교회 정보 조회**
```typescript
supabase
  .from('churches')
  .select(`
    id, name, address, phone, email, website,
    pastor_name, denomination, description, logo_url,
    subscription_status, gpt_licenses_active
  `)
  .eq('id', church_id)
  .single()
```

**교회 목록 조회 (검색용)**
```typescript
supabase
  .from('churches')
  .select('id, name, address, denomination')
  .ilike('name', `%${search}%`)
  .eq('is_active', true)
  .order('name')
  .limit(20)
```

### 2.2 예배 일정 (`worship-services` Edge Function)

**예배 일정 조회**
```typescript
POST /functions/v1/worship-services
{
  action: "get_services";
  church_id: number;
}
// Response: WorshipService[]

interface WorshipService {
  id: number;
  name: string;
  day_of_week: number; // 0=월요일, 6=일요일
  start_time: string;   // "10:30:00"
  end_time?: string;
  location: string;
  service_type: string;
  is_online: boolean;
  is_active: boolean;
}
```

**예배 일정 생성/수정**
```typescript
POST /functions/v1/worship-services
{
  action: "create_service" | "update_service";
  service_data: WorshipServiceData;
}
```

---

## 👥 3. 커뮤니티 기능

### 3.1 무료나눔/물품판매 (`community-sharing` Edge Function)

**게시글 목록 조회**
```typescript
POST /functions/v1/community-sharing
{
  action: "get_posts";
  church_id: number;
  page?: number;
  limit?: number;
  is_free?: boolean;    // true: 무료나눔, false: 물품판매
  search?: string;
  category?: string;
  status?: string;
}
// Response: CommunityPostListResponse

interface CommunityPost {
  id: number;
  title: string;
  description: string;
  category: string;
  condition: string;    // "new" | "like_new" | "good" | "fair"
  price: number;
  is_free: boolean;
  location: string;
  contact_info: string;
  images: string[];
  author_name: string;
  view_count: number;
  likes: number;
  status: string;
  created_at: string;
}
```

**게시글 상세 조회**
```typescript
POST /functions/v1/community-sharing
{
  action: "get_post";
  post_id: number;
}
// Response: CommunityPostDetailResponse
```

**게시글 작성**
```typescript
POST /functions/v1/community-sharing
{
  action: "create_post";
  post_data: {
    title: string;
    description: string;
    category: string;
    condition: string;
    price?: number;
    is_free: boolean;
    location: string;
    contact_info: string;
    images?: string[];
  };
}
```

**게시글 수정/삭제**
```typescript
POST /functions/v1/community-sharing
{
  action: "update_post" | "delete_post";
  post_id: number;
  post_data?: CommunityPostUpdateData;
}
```

### 3.2 물품요청 (`community-requests` Edge Function)

**요청글 목록 조회**
```typescript
POST /functions/v1/community-requests
{
  action: "get_requests";
  church_id: number;
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  urgency?: string;     // "low" | "normal" | "high" | "urgent"
}
// Response: RequestListResponse

interface CommunityRequest {
  id: number;
  title: string;
  description: string;
  category: string;
  urgency: string;
  location: string;
  contact_info: string;
  reward_type: string;  // "none" | "money" | "item" | "service"
  reward_amount?: number;
  images: string[];
  author_name: string;
  view_count: number;
  likes: number;
  status: string;
  created_at: string;
}
```

**요청글 작성/수정**
```typescript
POST /functions/v1/community-requests
{
  action: "create_request" | "update_request";
  request_data: CommunityRequestData;
  request_id?: number; // update시 필요
}
```

### 3.3 채용공고 (Legacy API)

**채용공고 목록**
```typescript
GET /api/job-posts?page=1&limit=20&search=keyword
// Response: JobPostListResponse

interface JobPost {
  id: number;
  title: string;
  company_name: string;
  job_type: string;
  employment_type: string;
  location: string;
  salary_range: string;
  application_deadline: string;
  requirements: string;
  contact_info: string;
  author_name: string;
  view_count: number;
  status: string;
  created_at: string;
}
```

### 3.4 찬양팀 모집 (Legacy API + Edge Function)

**찬양팀 모집글 목록**
```typescript
GET /api/music-team-recruit?page=1&limit=20
// Response: MusicTeamRecruitListResponse

interface MusicTeamRecruit {
  id: number;
  title: string;
  team_name: string;
  worship_type: string;
  instruments_needed: string[];
  positions_needed: string;
  experience_required: string;
  practice_location: string;
  practice_schedule: string;
  contact_info: string;
  current_members: number;
  target_members: number;
  status: string;
  created_at: string;
}
```

**찬양팀 지원자 목록 (`music-seekers` Edge Function)**
```typescript
POST /functions/v1/music-seekers
{
  action: "get_seekers";
  page?: number;
  limit?: number;
  instrument?: string;
  location?: string;
}
// Response: MusicSeekerListResponse

interface MusicSeeker {
  id: number;
  title: string;
  instrument: string;
  experience: string;
  portfolio?: string;
  preferred_location: string[];
  available_days: string[];
  contact_phone: string;
  contact_email?: string;
  author_name: string;
  view_count: number;
  status: string;
  created_at: string;
}
```

### 3.5 찜하기 기능 (`wishlists`)

**찜 목록 조회**
```typescript
POST /functions/v1/wishlists
{
  action: "get_wishlists";
  page?: number;
  limit?: number;
}
// Response: WishlistResponse

interface WishlistItem {
  id: number;
  post_type: string;    // "community-sharing" | "job-posts" | ...
  post_id: number;
  post_title: string;
  post_description: string;
  post_image_url?: string;
  created_at: string;
}
```

**찜 추가/제거**
```typescript
POST /functions/v1/wishlists
{
  action: "add_to_wishlist" | "remove_from_wishlist";
  post_type: string;
  post_id: number;
}
```

---

## 🎯 4. 교회 운영 관리

### 4.1 공지사항 (`announcements`)

**공지사항 목록**
```typescript
supabase
  .from('announcements')
  .select('*')
  .eq('church_id', church_id)
  .eq('is_active', true)
  .order('is_pinned', { ascending: false })
  .order('created_at', { ascending: false })
  .range((page-1)*limit, page*limit-1)

interface Announcement {
  id: number;
  title: string;
  content: string;
  category?: string;
  is_pinned: boolean;
  target_audience?: string;
  author_name: string;
  created_at: string;
}
```

### 4.2 주보 (`bulletins` Edge Function)

**주보 목록 조회**
```typescript
POST /functions/v1/bulletins
{
  action: "get_bulletins";
  church_id: number;
  page?: number;
  limit?: number;
  year?: number;
  month?: number;
}
// Response: BulletinListResponse

interface Bulletin {
  id: number;
  title: string;
  date: string;     // "2025-01-01"
  content?: string;
  file_url?: string;
  created_at: string;
}
```

**주보 업로드**
```typescript
POST /functions/v1/bulletins
{
  action: "create_bulletin";
  bulletin_data: {
    title: string;
    date: string;
    content?: string;
    file_url?: string;
  };
}
```

### 4.3 헌금 관리 (`offerings` Edge Function)

**헌금 목록 조회**
```typescript
POST /functions/v1/offerings
{
  action: "get_offerings";
  church_id: number;
  date_from?: string;   // "2025-01-01"
  date_to?: string;     // "2025-12-31"
  offering_type?: string;
}
// Response: OfferingListResponse

interface Offering {
  id: number;
  offering_date: string;
  offering_type: string;    // "정기헌금" | "감사헌금" | "건축헌금" 등
  amount: number;
  member_name?: string;
  description?: string;
  created_at: string;
}
```

**헌금 기록 추가**
```typescript
POST /functions/v1/offerings
{
  action: "create_offering";
  offering_data: OfferingCreateData;
}
```

---

## 🤖 5. AI 상담 시스템

### 5.1 AI 에이전트 관리 (`ai_agents` 테이블)

**AI 에이전트 목록**
```typescript
supabase
  .from('ai_agents')
  .select('*')
  .eq('church_id', church_id)
  .eq('is_active', true)
  .order('is_default', { ascending: false })

interface AIAgent {
  id: number;
  name: string;
  category: string;     // "상담" | "설교" | "사역" | "교육" | "영성"
  description: string;
  icon: string;
  is_default: boolean;
  usage_count: number;
}
```

### 5.2 채팅 기능 (`chat_histories`, `chat_messages`)

**채팅 기록 목록**
```typescript
supabase
  .from('chat_histories')
  .select(`
    id, title, agent_id, is_bookmarked, created_at,
    ai_agents(name, category, icon)
  `)
  .eq('user_id', user_id)
  .order('updated_at', { ascending: false })

interface ChatHistory {
  id: number;
  title: string;
  agent_id: number;
  agent: {
    name: string;
    category: string;
    icon: string;
  };
  is_bookmarked: boolean;
  created_at: string;
}
```

**채팅 메시지 조회**
```typescript
supabase
  .from('chat_messages')
  .select('*')
  .eq('history_id', history_id)
  .order('created_at', { ascending: true })

interface ChatMessage {
  id: number;
  content: string;
  role: "user" | "assistant" | "system";
  created_at: string;
}
```

### 5.3 GPT 라이센스 관리 (`user_gpt_licenses`)

**사용자 GPT 권한 확인**
```typescript
supabase
  .from('user_gpt_licenses')
  .select('*')
  .eq('user_id', user_id)
  .eq('is_active', true)
  .single()
```

---

## 📊 6. 통계 및 분석

### 6.1 통계 조회 (`statistics` Edge Function)

**대시보드 통계**
```typescript
POST /functions/v1/statistics
{
  action: "get_dashboard_stats";
  church_id: number;
  date_range?: "week" | "month" | "year";
}
// Response: DashboardStats

interface DashboardStats {
  total_members: number;
  active_members: number;
  community_posts: number;
  this_month_offerings: number;
  upcoming_events: number;
  recent_activities: ActivityLog[];
}
```

**커뮤니티 통계**
```typescript
POST /functions/v1/statistics
{
  action: "get_community_stats";
  church_id: number;
}
// Response: CommunityStats

interface CommunityStats {
  total_posts: number;
  active_sharing: number;
  active_requests: number;
  job_posts: number;
  music_teams: number;
  total_views: number;
}
```

### 6.2 출석 관리 (`attendances`)

**출석 기록 조회**
```typescript
supabase
  .from('attendances')
  .select(`
    id, member_id, service_date, service_type,
    members(name, phone)
  `)
  .eq('church_id', church_id)
  .gte('service_date', start_date)
  .lte('service_date', end_date)

interface Attendance {
  id: number;
  member_id: number;
  service_date: string;
  service_type: string;
  member: {
    name: string;
    phone: string;
  };
}
```

---

## 🛠️ 7. 기타 기능

### 7.1 파일 업로드 (Supabase Storage)

**이미지 업로드**
```typescript
// Supabase Storage 직접 업로드
const file = // File object
const fileName = `community/${year}/${month}/${uuid()}.${ext}`
const { data, error } = await supabase.storage
  .from('community-images')
  .upload(fileName, file)

// 공개 URL 생성
const { data: { publicUrl } } = supabase.storage
  .from('community-images')
  .getPublicUrl(fileName)
```

### 7.2 SMS 발송 (`send-sms` Edge Function)

**SMS 발송**
```typescript
POST /functions/v1/send-sms
{
  to: string;           // "010-1234-5678"
  message: string;
  sender_name?: string;
}
// Response: SMSResponse
```

### 7.3 이메일 인증 (`email-verification` Edge Function)

**인증 코드 발송**
```typescript
POST /functions/v1/email-verification
{
  action: "send_code";
  email: string;
}
```

**인증 코드 확인**
```typescript
POST /functions/v1/email-verification
{
  action: "verify_code";
  email: string;
  code: string;
}
```

### 7.4 말씀 카드 (`daily-verses` Edge Function)

**오늘의 말씀**
```typescript
POST /functions/v1/daily-verses
{
  action: "get_daily_verse";
  date?: string;        // "2025-01-01" (옵션, 기본값: 오늘)
}
// Response: DailyVerse

interface DailyVerse {
  date: string;
  verse: string;
  reference: string;    // "요한복음 3:16"
  content: string;
  theme?: string;
}
```

---

## 🔧 기술적 세부사항

### API 기본 설정

**Supabase 클라이언트 초기화**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)
```

**Edge Function 호출**
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: requestData,
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  }
})
```

### 인증 토큰

**임시 토큰 시스템**
```typescript
// Edge Function에서 사용하는 임시 토큰 형식
const tempToken = `temp_token_${user_id}_${Date.now()}`
```

### 에러 처리

**표준 에러 응답**
```typescript
interface ApiError {
  success: false;
  error: string;
  message: string;      // 한국어 사용자 메시지
  details?: any;
}
```

### 페이지네이션

**표준 페이지네이션 응답**
```typescript
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
```

---

## 📱 모바일 개발 가이드

### 1. 인증 플로우
1. 사용자 로그인 → Supabase Auth
2. 세션 토큰 저장 → 로컬 스토리지
3. API 호출 시 토큰 헤더 포함
4. 토큰 만료 시 자동 갱신

### 2. 데이터 캐싱
- 교회 정보: 로컬 캐싱 (24시간)
- 커뮤니티 게시글: 페이지별 캐싱
- 사용자 프로필: 세션 기간 캐싱

### 3. 오프라인 지원
- 읽기 전용 데이터: 로컬 DB 저장
- 작성 데이터: 큐잉 후 온라인 시 동기화

### 4. 푸시 알림
- 새 공지사항, 댓글, 찜한 글 업데이트 등
- FCM 토큰을 profiles 테이블에 저장

### 5. 이미지 최적화
- 업로드: WebP 형식 변환
- 표시: 썸네일 버전 사용
- 캐싱: CDN 활용

---

## 🚀 배포 및 환경

### 개발 환경
- **Frontend**: http://localhost:3000
- **Supabase Local**: http://localhost:54321
- **Edge Functions**: http://localhost:54321/functions/v1/

### 프로덕션 환경
- **Supabase URL**: `YOUR_PRODUCTION_SUPABASE_URL`
- **API Key**: `YOUR_PRODUCTION_ANON_KEY`

---

## 📞 지원 및 문의

이 API 문서에 대한 질문이나 개선 사항이 있다면 개발팀에게 문의해 주세요.

**마지막 업데이트**: 2025-09-29
**API 버전**: v1.0
**문서 버전**: 1.0.0