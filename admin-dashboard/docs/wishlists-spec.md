# 내가 찜한 글 (Wishlists) 명세 문서

## 1. 기능 개요

"내가 찜한 글"은 사용자가 관심있는 커뮤니티 게시물을 북마크하여 나중에 쉽게 찾아볼 수 있도록 하는 기능입니다. 모든 커뮤니티 카테고리의 게시물을 하나의 목록에서 통합 관리할 수 있습니다.

### 주요 특징
- **통합 관리**: 모든 카테고리의 찜한 글을 한 곳에서 관리
- **필터링**: 카테고리별 필터 및 검색 기능
- **실시간 동기화**: 찜하기 추가/제거 시 즉시 반영
- **빠른 이동**: 찜한 글 클릭 시 해당 게시물 상세 페이지로 이동

---

## 2. 데이터 구조

### 2.1 Wishlist Item 타입

```typescript
interface WishlistItem {
  id: number;                    // 찜하기 레코드 ID
  post_type: string;             // 게시물 타입 (카테고리 식별자)
  post_id: number;               // 게시물 ID
  post_title: string;            // 게시물 제목
  post_description: string;      // 게시물 설명
  post_image_url: string | null; // 게시물 대표 이미지 URL (없을 수 있음)
  created_at: string;            // 찜한 날짜 (ISO 8601)
}
```

### 2.2 Wishlist Data 구조

```typescript
interface WishlistData {
  items: WishlistItem[];         // 찜한 글 목록
  pagination: {
    page: number;                // 현재 페이지 번호
    limit: number;               // 페이지당 아이템 수
    total: number;               // 전체 아이템 수
    totalPages: number;          // 전체 페이지 수
  };
}
```

---

## 3. 게시물 타입 (Post Type)

### 3.1 지원 게시물 타입

| Post Type | 한글명 | 경로 | 설명 |
|-----------|--------|------|------|
| `community-sharing` | 무료나눔 | `/community/free-sharing` | 무료로 나눔하는 물품 |
| `sharing-offer` | 물품판매 | `/community/sharing-offer` | 유료로 판매하는 물품 |
| `item-request` | 물품요청 | `/community/item-request` | 필요한 물품 요청 |
| `job-posting` | 사역자모집 | `/community/job-posting` | 교회/기독교 기관 채용 공고 |
| `music-team-recruit` | 행사팀모집 | `/community/music-team-recruit` | 음악팀/찬양팀 모집 |
| `music-team-seeking` | 행사팀지원 | `/community/music-team-seeking` | 음악팀 참여 신청 |
| `church-events` | 행사소식 | `/community/church-events` | 교회 행사 및 일정 |

### 3.2 Post Type 변환 함수

```typescript
const getPostTypeName = (postType: string): string => {
  const typeMap: { [key: string]: string } = {
    'community-sharing': '무료나눔',
    'sharing-offer': '물품판매',
    'item-request': '물품요청',
    'job-posting': '사역자모집',
    'music-team-recruit': '행사팀모집',
    'music-team-seeking': '행사팀지원',
    'church-events': '행사소식'
  };
  return typeMap[postType] || postType;
};
```

### 3.3 Post Type별 라우트 매핑

```typescript
const routeMap: { [key: string]: string } = {
  'community-sharing': '/community/free-sharing',
  'sharing-offer': '/community/sharing-offer',
  'item-request': '/community/item-request',
  'job-posting': '/community/job-posting',
  'music-team-recruit': '/community/music-team-recruit',
  'music-team-seeking': '/community/music-team-seeking',
  'church-events': '/community/church-events'
};
```

---

## 4. API 명세

### 4.1 Supabase Edge Function

**엔드포인트**: `/functions/v1/wishlists`
**인증**: `temp-token` 헤더 필요

#### 4.1.1 찜한 글 목록 조회

**메서드**: `GET`

**Query Parameters**:
- `page` (number, 선택): 페이지 번호 (기본값: 1)
- `limit` (number, 선택): 페이지당 아이템 수 (기본값: 20)

**Headers**:
```
Authorization: Bearer {SUPABASE_ANON_KEY}
temp-token: temp_token_{user_id}_{timestamp}
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "post_type": "community-sharing",
        "post_id": 123,
        "post_title": "중고 의자 무료나눔",
        "post_description": "사용감 있지만 튼튼한 의자입니다",
        "post_image_url": "https://...jpg",
        "created_at": "2025-10-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": "유효하지 않은 인증 토큰입니다."
}
```

---

#### 4.1.2 찜하기 추가

**메서드**: `POST`

**Headers**:
```
Authorization: Bearer {SUPABASE_ANON_KEY}
temp-token: temp_token_{user_id}_{timestamp}
Content-Type: application/json
```

**Request Body**:
```json
{
  "post_type": "community-sharing",
  "post_id": 123,
  "post_title": "중고 의자 무료나눔",
  "post_description": "사용감 있지만 튼튼한 의자입니다",
  "post_image_url": "https://...jpg"
}
```

**필수 필드**:
- `post_type` (string): 게시물 타입
- `post_id` (number): 게시물 ID

**선택 필드**:
- `post_title` (string): 게시물 제목 (기본값: 빈 문자열)
- `post_description` (string): 게시물 설명 (기본값: 빈 문자열)
- `post_image_url` (string): 게시물 이미지 URL (기본값: null)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "찜하기에 추가되었습니다.",
  "data": {
    "id": 1,
    "user_id": 100,
    "church_id": 1,
    "post_type": "community-sharing",
    "post_id": 123,
    "post_title": "중고 의자 무료나눔",
    "post_description": "사용감 있지만 튼튼한 의자입니다",
    "post_image_url": "https://...jpg",
    "created_at": "2025-10-01T12:00:00Z"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "이미 찜한 글입니다."
}
```

---

#### 4.1.3 찜하기 제거

**메서드**: `DELETE`

**Headers**:
```
Authorization: Bearer {SUPABASE_ANON_KEY}
temp-token: temp_token_{user_id}_{timestamp}
Content-Type: application/json
```

**Request Body**:
```json
{
  "post_type": "community-sharing",
  "post_id": 123
}
```

**필수 필드**:
- `post_type` (string): 게시물 타입
- `post_id` (number): 게시물 ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "찜하기에서 제거되었습니다."
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "서버 오류가 발생했습니다."
}
```

---

#### 4.1.4 찜 상태 확인

**메서드**: `GET` (내부적으로 목록 조회 API 사용)

**Parameters**:
- `post_type` (string): 게시물 타입
- `post_id` (number): 게시물 ID

**Returns**: `boolean` (찜한 상태면 true, 아니면 false)

**구현**:
```typescript
const checkWishlistStatus = async (post_type: string, post_id: number): Promise<boolean> => {
  // 전체 찜한 글 목록을 조회하여 해당 게시물이 포함되어 있는지 확인
  const wishlists = await getWishlists(1, 100);
  return wishlists.items.some((item: WishlistItem) =>
    item.post_type === post_type && item.post_id === post_id
  );
};
```

---

### 4.2 Service Layer API

**파일**: `/src/services/supabaseApiService.ts`

#### 4.2.1 getWishlists

```typescript
wishlists.getWishlists(page: number = 1, limit: number = 20): Promise<WishlistData>
```

**설명**: 찜한 글 목록을 조회합니다.

**Parameters**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 아이템 수 (기본값: 20)

**Returns**: `WishlistData` 객체

**사용 예시**:
```typescript
const wishlists = await supabaseApiService.wishlists.getWishlists(1, 20);
console.log(wishlists.items);
```

---

#### 4.2.2 addToWishlist

```typescript
wishlists.addToWishlist(wishlistData: {
  post_type: string;
  post_id: number;
  post_title: string;
  post_description: string;
  post_image_url?: string;
}): Promise<any>
```

**설명**: 게시물을 찜하기 목록에 추가합니다.

**Parameters**:
- `post_type`: 게시물 타입
- `post_id`: 게시물 ID
- `post_title`: 게시물 제목
- `post_description`: 게시물 설명
- `post_image_url`: 게시물 이미지 URL (선택)

**Returns**: 추가된 찜하기 레코드

**사용 예시**:
```typescript
await supabaseApiService.wishlists.addToWishlist({
  post_type: 'community-sharing',
  post_id: 123,
  post_title: '중고 의자 무료나눔',
  post_description: '사용감 있지만 튼튼한 의자입니다',
  post_image_url: 'https://...jpg'
});
```

---

#### 4.2.3 removeFromWishlist

```typescript
wishlists.removeFromWishlist(removeData: {
  post_type: string;
  post_id: number;
}): Promise<any>
```

**설명**: 찜하기 목록에서 게시물을 제거합니다.

**Parameters**:
- `post_type`: 게시물 타입
- `post_id`: 게시물 ID

**Returns**: 제거 결과

**사용 예시**:
```typescript
await supabaseApiService.wishlists.removeFromWishlist({
  post_type: 'community-sharing',
  post_id: 123
});
```

---

#### 4.2.4 checkWishlistStatus

```typescript
wishlists.checkWishlistStatus(post_type: string, post_id: number): Promise<boolean>
```

**설명**: 특정 게시물이 찜한 상태인지 확인합니다.

**Parameters**:
- `post_type`: 게시물 타입
- `post_id`: 게시물 ID

**Returns**: `true` (찜한 상태) 또는 `false` (찜하지 않은 상태)

**사용 예시**:
```typescript
const isWishlisted = await supabaseApiService.wishlists.checkWishlistStatus(
  'community-sharing',
  123
);
if (isWishlisted) {
  console.log('이미 찜한 글입니다');
}
```

---

## 5. 데이터베이스 스키마

### 5.1 wishlists 테이블

```sql
CREATE TABLE wishlists (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,              -- 사용자 ID
  church_id INTEGER NOT NULL,            -- 교회 ID
  post_type VARCHAR(50) NOT NULL,        -- 게시물 타입
  post_id INTEGER NOT NULL,              -- 게시물 ID
  post_title TEXT NOT NULL DEFAULT '',   -- 게시물 제목
  post_description TEXT NOT NULL DEFAULT '', -- 게시물 설명
  post_image_url TEXT,                   -- 게시물 이미지 URL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, church_id, post_type, post_id) -- 중복 방지
);
```

### 5.2 인덱스

```sql
-- 사용자별 조회 최적화
CREATE INDEX idx_wishlists_user_church ON wishlists(user_id, church_id);

-- 생성일 정렬 최적화
CREATE INDEX idx_wishlists_created_at ON wishlists(created_at DESC);

-- 게시물 타입별 조회 최적화
CREATE INDEX idx_wishlists_post_type ON wishlists(post_type);
```

---

## 6. UI/UX 명세

### 6.1 찜한 글 목록 페이지

**경로**: `/community/wishlists`

**레이아웃**:
```
┌─────────────────────────────────────────────────────┐
│ [헤더]                                              │
│ 내가 찜한 글                                         │
│ 관심있는 게시물들을 한 곳에서 확인하세요             │
│                                                     │
│ [검색바] 🔍  [카테고리 필터 ▼]                    │
│                                                     │
│ [테이블]                                            │
│ ┌──────────────────────────────────────────────┐   │
│ │ 제목(이미지) │ 카테고리 │ 설명 │ 날짜 │ 작업 │   │
│ ├──────────────────────────────────────────────┤   │
│ │ [📷] 중고..  │ 무료나눔 │ ... │ 1일전│ ❤️  │   │
│ │ [📷] 악기..  │ 물품요청 │ ... │ 2일전│ ❤️  │   │
│ │ ...                                          │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ [페이지네이션] ◀ 1 2 3 ▶                          │
└─────────────────────────────────────────────────────┘
```

### 6.2 UI 컴포넌트

#### 6.2.1 헤더 영역

**구성**:
- **제목**: "내가 찜한 글" (text-xl font-semibold)
- **설명**: "관심있는 게시물들을 한 곳에서 확인하세요" (text-sm text-gray-600)

#### 6.2.2 필터 및 검색 영역

**검색바**:
- 실시간 제목/설명 검색
- Placeholder: "Search"
- 아이콘: 🔍 (Search 아이콘)

**카테고리 필터**:
- 전체 타입
- 무료나눔
- 물품판매
- 물품요청
- 사역자모집
- 행사팀모집
- 행사팀지원
- 행사소식

#### 6.2.3 테이블

**컬럼**:
1. **제목** (post_title)
   - 이미지가 있는 타입: 썸네일 + 제목
   - 이미지가 없는 타입: 제목만 (물품요청, 사역자모집, 행사팀모집)
   - 클릭 시 해당 게시물 상세 페이지로 이동

2. **카테고리** (post_type)
   - 배지 형태로 표시
   - 한글 카테고리명

3. **설명** (post_description)
   - 2줄 말줄임 (line-clamp-2)
   - text-sm text-gray-600

4. **찜한 날짜** (created_at)
   - 상대 시간 표시 (예: "1일 전", "3시간 전")
   - `formatCreatedAt()` 함수 사용

5. **작업** (actions)
   - ❤️ (Heart) 아이콘 버튼
   - 클릭 시 찜하기 제거
   - fill-current 스타일 (채워진 하트)

#### 6.2.4 빈 상태

**조건**: 찜한 글이 없을 때

**표시**:
- 아이콘: 큰 회색 하트 (Heart, h-12 w-12)
- 메시지: "찜한 글이 없습니다"

### 6.3 이미지 처리 규칙

**이미지가 필요 없는 타입**:
- `item-request` (물품요청)
- `job-posting` (사역자모집)
- `music-team-recruit` (행사팀모집)

**이미지가 있는 타입**:
- `community-sharing` (무료나눔)
- `sharing-offer` (물품판매)
- `music-team-seeking` (행사팀지원)
- `church-events` (행사소식)

**이미지 표시 로직**:
```typescript
if (noImagePostTypes.includes(item.post_type)) {
  // 이미지 없이 제목만 표시
  return TableRenderers.title(item.post_title);
} else {
  // 이미지와 함께 제목 표시
  return TableRenderers.titleWithImage(
    item.post_title,
    item.post_image_url,
    <ImageIcon className="h-6 w-6 text-gray-400" /> // 기본 아이콘
  );
}
```

---

## 7. 사용자 플로우

### 7.1 찜하기 추가 플로우

1. **게시물 상세 페이지에서 하트 버튼 클릭**
   - 빈 하트 → 채워진 하트로 변경
   - 토스트 메시지: "찜하기에 추가되었습니다." (success)

2. **API 호출**
   - `supabaseApiService.wishlists.addToWishlist()` 호출
   - 게시물 정보 (post_type, post_id, post_title, post_description, post_image_url) 전송

3. **데이터베이스 저장**
   - `wishlists` 테이블에 레코드 추가
   - user_id, church_id 자동 설정

4. **찜한 글 목록에 즉시 반영**

---

### 7.2 찜하기 제거 플로우

1. **찜한 글 목록에서 하트 버튼 클릭** 또는 **게시물 상세 페이지에서 채워진 하트 클릭**
   - 채워진 하트 → 빈 하트로 변경
   - 토스트 메시지: "찜하기에서 제거되었습니다." (success)

2. **API 호출**
   - `supabaseApiService.wishlists.removeFromWishlist()` 호출
   - 게시물 식별 정보 (post_type, post_id) 전송

3. **데이터베이스 삭제**
   - `wishlists` 테이블에서 해당 레코드 삭제

4. **찜한 글 목록에서 즉시 제거**

---

### 7.3 찜한 글 조회 플로우

1. **메뉴에서 "내가 찜한 글" 클릭**
   - `/community/wishlists` 페이지로 이동

2. **API 호출**
   - `supabaseApiService.wishlists.getWishlists(page, limit)` 호출
   - 기본값: page=1, limit=20

3. **목록 표시**
   - 테이블 형태로 찜한 글 목록 표시
   - 페이지네이션 적용

4. **필터링**
   - 검색어 입력 시 제목/설명 필터링
   - 카테고리 선택 시 해당 타입만 표시

5. **게시물 이동**
   - 목록의 행 클릭 시 해당 게시물 상세 페이지로 이동

---

## 8. 에러 처리

### 8.1 클라이언트 에러

**인증 토큰 없음**:
```
에러: "인증 토큰이 없습니다."
처리: 로그인 페이지로 리다이렉트
```

**이미 찜한 글**:
```
에러: "이미 찜한 글입니다."
토스트: "이미 찜한 글입니다." (error)
```

**필수 필드 누락**:
```
에러: "post_type과 post_id는 필수입니다."
토스트: "요청 데이터가 올바르지 않습니다." (error)
```

### 8.2 서버 에러

**데이터베이스 오류**:
```
에러: "서버 오류가 발생했습니다."
토스트: "찜하기 처리에 실패했습니다." (error)
로그: console.error로 상세 에러 출력
```

**네트워크 오류**:
```
에러: "HTTP {status}: {error_text}"
토스트: "네트워크 오류가 발생했습니다." (error)
재시도 버튼 표시
```

---

## 9. 성능 최적화

### 9.1 페이지네이션

- 기본 페이지 크기: 20개
- 무한 스크롤 대신 페이지 번호 방식 사용
- 총 페이지 수 계산: `Math.ceil(total / limit)`

### 9.2 캐싱

**찜 상태 확인 최적화**:
- 찜 상태는 최대 100개까지 조회하여 메모리에 캐싱
- 게시물 상세 페이지 진입 시 한 번만 조회

### 9.3 데이터베이스 쿼리 최적화

**인덱스 활용**:
- `idx_wishlists_user_church`: user_id + church_id 조합 인덱스
- `idx_wishlists_created_at`: 생성일 역순 정렬 인덱스
- `idx_wishlists_post_type`: 게시물 타입 필터링 인덱스

**UNIQUE 제약조건**:
- (user_id, church_id, post_type, post_id) 조합으로 중복 방지
- INSERT 시 자동으로 중복 체크

---

## 10. 보안 고려사항

### 10.1 인증 및 권한

**인증 방식**:
- Supabase 임시 토큰 사용 (`temp_token_{user_id}_{timestamp}`)
- 토큰 유효성 검증 후 user_id 추출
- 사용자 활성 상태 확인 (`is_active = true`)

**권한 검증**:
- 찜한 글 조회: 본인의 user_id + church_id 조합만 조회 가능
- 찜하기 추가: 인증된 사용자만 가능
- 찜하기 제거: 본인이 추가한 항목만 제거 가능

### 10.2 데이터 무결성

**중복 방지**:
- UNIQUE 제약조건으로 동일 게시물 중복 찜하기 방지
- 클라이언트에서도 찜 상태 확인 후 UI 업데이트

**Church ID 일관성**:
- 찜하기 추가 시 사용자의 church_id 자동 설정
- 교회 간 데이터 격리 보장

---

## 11. 테스트 시나리오

### 11.1 기능 테스트

**찜하기 추가**:
1. 게시물 상세 페이지에서 빈 하트 클릭
2. 하트가 채워지는지 확인
3. 찜한 글 목록에서 해당 게시물이 표시되는지 확인

**찜하기 제거**:
1. 찜한 글 목록에서 하트 버튼 클릭
2. 목록에서 해당 게시물이 제거되는지 확인
3. 게시물 상세 페이지에서 하트가 비워지는지 확인

**필터링**:
1. 검색어 입력 시 제목/설명 필터링 확인
2. 카테고리 선택 시 해당 타입만 표시되는지 확인

**페이지네이션**:
1. 다음 페이지 클릭 시 새로운 항목 로드 확인
2. 전체 페이지 수 계산 정확성 확인

### 11.2 에러 처리 테스트

**중복 찜하기**:
1. 이미 찜한 게시물을 다시 찜하기 시도
2. "이미 찜한 글입니다." 메시지 확인

**인증 실패**:
1. 토큰 없이 API 호출
2. 401 Unauthorized 에러 확인

**네트워크 오류**:
1. 네트워크 연결 끊기
2. 에러 메시지 및 재시도 버튼 확인

---

## 12. 향후 개선 계획

### 12.1 기능 개선

- [ ] 찜한 글 정렬 옵션 (최신순, 오래된순, 카테고리별)
- [ ] 찜한 글 일괄 삭제 기능
- [ ] 찜한 글 공유 기능 (URL 생성)
- [ ] 찜한 글 개수 배지 표시 (내비게이션 메뉴)
- [ ] 찜한 글 알림 기능 (게시물 수정/삭제 시)

### 12.2 UI/UX 개선

- [ ] 그리드 뷰 옵션 추가
- [ ] 찜한 글 드래그 앤 드롭으로 순서 변경
- [ ] 찜한 글 그룹화 기능 (폴더/태그)
- [ ] 찜한 글 메모 기능 (개인 메모 추가)

### 12.3 성능 개선

- [ ] 무한 스크롤 페이지네이션 옵션
- [ ] 이미지 지연 로딩 최적화
- [ ] 찜 상태 로컬 캐싱 (IndexedDB)

---

## 13. 관련 파일

### 13.1 프론트엔드

**컴포넌트**:
- `/src/components/Community/Wishlists.tsx` - 찜한 글 목록 페이지

**서비스**:
- `/src/services/supabaseApiService.ts` - wishlists API 서비스 레이어

**타입**:
- 타입 정의는 컴포넌트 내부에 로컬로 선언

### 13.2 백엔드

**Edge Functions**:
- `/supabase/functions/wishlists/index.ts` - 찜하기 Edge Function

**데이터베이스**:
- `wishlists` 테이블 (마이그레이션 파일 위치 확인 필요)

---

## 14. 참고 사항

### 14.1 Post Type 일관성

- 모든 API 호출 시 post_type을 정확히 전달
- 라우트 매핑과 동일한 post_type 사용
- 오타나 대소문자 주의 (예: `community-sharing`, `item-request`)

### 14.2 이미지 URL 처리

- 이미지 URL은 Supabase Storage의 공개 URL
- null 값 허용 (이미지 없는 게시물)
- 기본 아이콘으로 대체: `<ImageIcon className="h-6 w-6 text-gray-400" />`

### 14.3 날짜 포맷팅

- `formatCreatedAt()` 함수 사용
- 상대 시간 표시 (1분 전, 1시간 전, 1일 전 등)
- 7일 이상 지난 경우 전체 날짜 표시

---

**문서 버전**: 1.0.0
**최종 수정일**: 2025-10-01
**작성자**: Claude Code Assistant
