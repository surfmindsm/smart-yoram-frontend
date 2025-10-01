# 물품 요청 모바일 API 명세서

**작성일**: 2025-10-01
**대상**: 모바일 개발자
**플랫폼**: iOS / Android

---

## 목차

1. [개요](#1-개요)
2. [인증](#2-인증)
3. [물품 요청 글 작성 API](#3-물품-요청-글-작성-api)
4. [물품 요청 목록 조회 API](#4-물품-요청-목록-조회-api)
5. [에러 처리](#5-에러-처리)
6. [테스트 정보](#6-테스트-정보)

---

## 1. 개요

물품 요청 기능은 교회 교인들이 필요한 물품을 요청할 수 있는 커뮤니티 기능입니다.

### 기술 스택
- **백엔드**: Supabase Edge Functions (Deno)
- **데이터베이스**: PostgreSQL (Supabase)
- **파일 스토리지**: Supabase Storage (선택사항)
- **인증**: Custom Token (임시 토큰 방식)

### 베이스 URL
```
Production: https://adzhdsajdamrflvybhxq.supabase.co
Edge Functions: https://adzhdsajdamrflvybhxq.supabase.co/functions/v1
```

---

## 2. 인증

### 2.1 인증 방식

**Custom Token 방식**을 사용합니다.

#### Token 형식
```
temp_token_{user_id}_{timestamp}
```

**예시**:
```
temp_token_123_1696234567890
```

- `user_id`: 사용자 ID (숫자)
- `timestamp`: 토큰 생성 시간 (Unix timestamp, milliseconds)

#### Token 생성 방법

```swift
// Swift 예시
let userId = 123
let timestamp = Int(Date().timeIntervalSince1970 * 1000)
let token = "temp_token_\(userId)_\(timestamp)"
```

```kotlin
// Kotlin 예시
val userId = 123
val timestamp = System.currentTimeMillis()
val token = "temp_token_${userId}_$timestamp"
```

#### Token 유효기간
- **24시간** (86,400,000 밀리초)
- 24시간 이후 토큰 사용 시 `401 Unauthorized` 에러 발생

### 2.2 헤더 설정

모든 API 요청에 다음 헤더를 포함해야 합니다:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Custom-Auth: temp_token_123_1696234567890
Content-Type: application/json
```

| 헤더 | 설명 | 필수 |
|-----|------|------|
| `Authorization` | Supabase Anon Key (Bearer 형식) | ✅ |
| `X-Custom-Auth` | Custom Token (임시 토큰) | ✅ |
| `Content-Type` | 요청 본문 형식 (application/json) | ✅ |

**Supabase Anon Key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c
```

---

## 3. 물품 요청 글 작성 API

### 3.1 엔드포인트

```
POST /functions/v1/community-requests
```

**전체 URL**:
```
https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-requests
```

### 3.2 요청 헤더

```http
Authorization: Bearer {SUPABASE_ANON_KEY}
X-Custom-Auth: temp_token_{user_id}_{timestamp}
Content-Type: application/json
```

### 3.3 요청 본문 (Request Body)

```json
{
  "title": "유아용 침대 필요합니다",
  "description": "신생아를 위한 유아용 침대가 필요합니다. 안전하고 깨끗한 제품이면 좋겠습니다.",
  "requested_item": "유아용 침대",
  "category": "furniture",
  "quantity": 1,
  "reason": "출산 준비",
  "needed_date": "2025-11-01",
  "urgency": "high",
  "max_budget": "200000",
  "location": "서울 강남구",
  "contact_phone": "010-1234-5678",
  "contact_email": "user@example.com",
  "images": [],
  "church_id": 1,
  "author_id": 123,
  "status": "active"
}
```

#### 필수 필드

| 필드 | 타입 | 제약사항 | 설명 |
|-----|------|---------|------|
| `title` | string | 최대 100자 | 게시글 제목 |
| `description` | string | 최대 1000자 | 게시글 상세 설명 |
| `requested_item` | string | 최대 100자 | 요청하는 물품명 |
| `category` | string | 선택값 | 카테고리 (아래 표 참조) |
| `needed_date` | string | ISO 8601 날짜 | 필요한 날짜 (YYYY-MM-DD) |
| `contact_phone` | string | 전화번호 형식 | 연락처 전화번호 |
| `author_id` | number | 양수 | 작성자 ID |

#### 선택 필드

| 필드 | 타입 | 기본값 | 설명 |
|-----|------|--------|------|
| `quantity` | number | 1 | 요청 수량 |
| `reason` | string | - | 필요한 이유 (최대 500자) |
| `urgency` | string | "medium" | 우선순위 (아래 표 참조) |
| `max_budget` | string | - | 최대 예산 |
| `location` | string | - | 거래 희망 지역 (최대 100자) |
| `contact_email` | string | - | 연락처 이메일 |
| `images` | string[] | [] | 참고 이미지 URL 배열 (최대 5개) |
| `church_id` | number | 9998 | 교회 ID (없으면 9998) |
| `status` | string | "active" | 게시글 상태 |
| `reward_type` | string | "none" | 보상 타입 |
| `reward_amount` | number | 0 | 보상 금액 |

#### 카테고리 (category) 값

| 값 | 한글명 |
|----|--------|
| `furniture` | 가구 |
| `electronics` | 전자제품 |
| `books` | 도서 |
| `instruments` | 악기 |
| `sports` | 스포츠용품 |
| `household` | 생활용품 |
| `other` | 기타 |

#### 우선순위 (urgency) 값

| 값 | 한글명 |
|----|--------|
| `low` | 여유 |
| `medium` | 보통 |
| `high` | 긴급 |

#### 상태 (status) 값

| 값 | 한글명 |
|----|--------|
| `active` | 요청 중 |
| `requesting` | 요청 중 |
| `matching` | 매칭 중 |
| `completed` | 완료됨 |

### 3.4 응답 (Response)

#### 성공 (201 Created)

```json
{
  "id": 789,
  "title": "유아용 침대 필요합니다",
  "description": "신생아를 위한 유아용 침대가 필요합니다. 안전하고 깨끗한 제품이면 좋겠습니다.",
  "content": "신생아를 위한 유아용 침대가 필요합니다. 안전하고 깨끗한 제품이면 좋겠습니다.",
  "requested_item": "유아용 침대",
  "category": "furniture",
  "quantity": 1,
  "reason": "출산 준비",
  "needed_date": "2025-11-01",
  "urgency": "high",
  "max_budget": "200000",
  "location": "서울 강남구",
  "contact_info": null,
  "images": [],
  "church_id": 1,
  "author_id": 123,
  "author_name": "홍길동",
  "user_name": "홍길동",
  "status": "active",
  "view_count": 0,
  "likes": 0,
  "comments": 0,
  "reward_type": "none",
  "reward_amount": 0,
  "created_at": "2025-10-01T12:34:56.789Z",
  "updated_at": "2025-10-01T12:34:56.789Z"
}
```

#### 실패 (400 Bad Request)

```json
{
  "error": "Missing required fields"
}
```

#### 실패 (401 Unauthorized)

```json
{
  "error": "Missing authentication"
}
```

#### 실패 (500 Internal Server Error)

```json
{
  "error": "Failed to create community request item"
}
```

### 3.5 요청 예시 코드

#### Swift (iOS)

```swift
struct ItemRequestRequest: Codable {
    let title: String
    let description: String
    let requestedItem: String
    let category: String
    let quantity: Int
    let reason: String?
    let neededDate: String
    let urgency: String
    let maxBudget: String?
    let location: String
    let contactPhone: String
    let contactEmail: String?
    let images: [String]
    let churchId: Int
    let authorId: Int
    let status: String

    enum CodingKeys: String, CodingKey {
        case title, description, category, quantity, reason, urgency, location, images, status
        case requestedItem = "requested_item"
        case neededDate = "needed_date"
        case maxBudget = "max_budget"
        case contactPhone = "contact_phone"
        case contactEmail = "contact_email"
        case churchId = "church_id"
        case authorId = "author_id"
    }
}

func createItemRequest(request: ItemRequestRequest) async throws -> ItemRequestResponse {
    let url = URL(string: "https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-requests")!
    var urlRequest = URLRequest(url: url)
    urlRequest.httpMethod = "POST"
    urlRequest.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
    urlRequest.setValue(customToken, forHTTPHeaderField: "X-Custom-Auth")
    urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let encoder = JSONEncoder()
    urlRequest.httpBody = try encoder.encode(request)

    let (data, response) = try await URLSession.shared.data(for: urlRequest)

    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 201 else {
        throw NetworkError.requestFailed
    }

    let decoder = JSONDecoder()
    return try decoder.decode(ItemRequestResponse.self, from: data)
}
```

#### Kotlin (Android)

```kotlin
data class ItemRequestRequest(
    val title: String,
    val description: String,
    @SerializedName("requested_item") val requestedItem: String,
    val category: String,
    val quantity: Int = 1,
    val reason: String? = null,
    @SerializedName("needed_date") val neededDate: String,
    val urgency: String = "medium",
    @SerializedName("max_budget") val maxBudget: String? = null,
    val location: String,
    @SerializedName("contact_phone") val contactPhone: String,
    @SerializedName("contact_email") val contactEmail: String? = null,
    val images: List<String> = emptyList(),
    @SerializedName("church_id") val churchId: Int,
    @SerializedName("author_id") val authorId: Int,
    val status: String = "active"
)

suspend fun createItemRequest(request: ItemRequestRequest): ItemRequestResponse {
    val url = "https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-requests"

    val json = gson.toJson(request)
    val requestBody = json.toRequestBody("application/json".toMediaType())

    val httpRequest = Request.Builder()
        .url(url)
        .post(requestBody)
        .addHeader("Authorization", "Bearer $supabaseAnonKey")
        .addHeader("X-Custom-Auth", customToken)
        .addHeader("Content-Type", "application/json")
        .build()

    val response = okHttpClient.newCall(httpRequest).execute()

    if (!response.isSuccessful) {
        throw IOException("글 작성 실패: ${response.code}")
    }

    return gson.fromJson(response.body?.string(), ItemRequestResponse::class.java)
}
```

---

## 4. 물품 요청 목록 조회 API

### 4.1 엔드포인트

```
GET /functions/v1/community-requests
```

**전체 URL**:
```
https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-requests
```

### 4.2 Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `limit` | number | 선택 | 50 | 조회할 게시글 수 |
| `category` | string | 선택 | - | 카테고리 필터 |
| `urgency` | string | 선택 | - | 우선순위 필터 |
| `status` | string | 선택 | - | 상태 필터 |
| `search` | string | 선택 | - | 제목/설명 검색 |

### 4.3 요청 예시

```http
GET /functions/v1/community-requests?limit=20&category=furniture&urgency=high
Host: adzhdsajdamrflvybhxq.supabase.co
Authorization: Bearer {SUPABASE_ANON_KEY}
X-Custom-Auth: temp_token_123_1696234567890
```

### 4.4 응답 (200 OK)

```json
[
  {
    "id": 789,
    "title": "유아용 침대 필요합니다",
    "description": "신생아를 위한 유아용 침대가 필요합니다.",
    "content": "신생아를 위한 유아용 침대가 필요합니다.",
    "requested_item": "유아용 침대",
    "category": "furniture",
    "quantity": 1,
    "urgency": "high",
    "needed_date": "2025-11-01",
    "location": "서울 강남구",
    "images": [],
    "church_id": 1,
    "author_id": 123,
    "author_name": "홍길동",
    "user_name": "홍길동",
    "status": "active",
    "view_count": 10,
    "likes": 2,
    "comments": 1,
    "created_at": "2025-10-01T12:34:56.789Z",
    "updated_at": "2025-10-01T12:34:56.789Z"
  }
]
```

---

## 5. 에러 처리

### 5.1 HTTP 상태 코드

| 상태 코드 | 설명 |
|----------|------|
| `200 OK` | 요청 성공 (목록 조회) |
| `201 Created` | 게시글 생성 성공 |
| `400 Bad Request` | 잘못된 요청 (필수 필드 누락, 형식 오류) |
| `401 Unauthorized` | 인증 실패 (토큰 없음, 만료, 형식 오류) |
| `405 Method Not Allowed` | 지원하지 않는 HTTP 메서드 |
| `500 Internal Server Error` | 서버 오류 |

### 5.2 에러 응답 형식

```json
{
  "error": "에러 메시지"
}
```

### 5.3 주요 에러 메시지

| 에러 메시지 | 원인 | 해결 방법 |
|-----------|------|----------|
| `Missing authentication` | Authorization 헤더 또는 X-Custom-Auth 헤더 누락 | 헤더에 토큰 추가 |
| `Invalid token structure` | 토큰 형식이 잘못됨 | `temp_token_{user_id}_{timestamp}` 형식 확인 |
| `Invalid user ID in token` | 토큰의 user_id가 잘못됨 | user_id가 양수인지 확인 |
| `Token expired` | 토큰이 24시간 초과 | 새로운 토큰 생성 |
| `Failed to create community request item` | 데이터베이스 삽입 실패 | 요청 본문 형식 및 필드 검증 |
| `Failed to fetch community requests data` | 데이터베이스 조회 실패 | 네트워크 상태 확인 |

---

## 6. 테스트 정보

### 6.1 테스트 환경

- **Supabase URL**: `https://adzhdsajdamrflvybhxq.supabase.co`
- **Supabase Anon Key**: (위 문서 참조)
- **테스트 사용자 ID**: `123`
- **테스트 교회 ID**: `1`

### 6.2 Postman / Insomnia 테스트

#### 1. 물품 요청 글 작성 테스트

**요청**:
```http
POST https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Custom-Auth: temp_token_123_1696234567890
Content-Type: application/json

{
  "title": "테스트 물품 요청",
  "description": "테스트용 게시글입니다.",
  "requested_item": "테스트 물품",
  "category": "other",
  "needed_date": "2025-12-31",
  "urgency": "medium",
  "contact_phone": "010-1234-5678",
  "author_id": 123,
  "church_id": 1
}
```

**응답**:
```json
{
  "id": 999,
  "title": "테스트 물품 요청",
  ...
}
```

#### 2. 물품 요청 목록 조회 테스트

**요청**:
```http
GET https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-requests?limit=5
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Custom-Auth: temp_token_123_1696234567890
```

**응답**:
```json
[
  {
    "id": 999,
    "title": "테스트 물품 요청",
    ...
  }
]
```

---

**문서 버전**: 1.0.0
**최종 수정일**: 2025-10-01
**작성자**: 백엔드 개발팀
