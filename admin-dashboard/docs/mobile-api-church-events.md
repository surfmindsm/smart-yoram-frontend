# 교회 행사 모바일 API 명세서

**작성일**: 2025-10-01
**대상**: 모바일 개발자
**플랫폼**: iOS / Android

---

## 목차

1. [개요](#1-개요)
2. [인증](#2-인증)
3. [이미지 업로드](#3-이미지-업로드)
4. [교회 행사 등록 API](#4-교회-행사-등록-api)
5. [교회 행사 목록 조회 API](#5-교회-행사-목록-조회-api)
6. [에러 처리](#6-에러-처리)

---

## 1. 개요

교회 행사 기능은 교회에서 주최하는 다양한 행사를 등록하고 참가자를 모집할 수 있는 커뮤니티 기능입니다. 사전 신청이 필요한 행사의 경우 참가자 수를 제한할 수 있습니다.

### 기술 스택
- **백엔드**: 레거시 REST API (FastAPI/Django)
- **데이터베이스**: PostgreSQL
- **파일 스토리지**: Supabase Storage
- **인증**: JWT Token 방식

### 베이스 URL
```
Production: https://adzhdsajdamrflvybhxq.supabase.co
Legacy API: https://adzhdsajdamrflvybhxq.supabase.co/api/v1
```

---

## 2. 인증

### 2.1 인증 방식

**JWT Token 방식**을 사용합니다.

#### Token 형식
```
Bearer {JWT_TOKEN}
```

#### Token 획득 방법

로그인 API를 통해 JWT 토큰을 획득합니다:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

응답:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 123
}
```

### 2.2 헤더 설정

```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

---

## 3. 이미지 업로드

교회 행사 등록 시 **이미지를 먼저 업로드**한 후, 이미지 URL을 행사 등록 API에 전달해야 합니다.

### 3.1 Supabase Storage 직접 업로드

무료나눔 API 문서의 이미지 업로드 섹션과 동일한 방식을 사용합니다.

#### 파일 경로 형식
```
church_{church_id}/church_event_{timestamp}_{random_id}.{extension}
```

---

## 4. 교회 행사 등록 API

### 4.1 엔드포인트

```
POST /api/v1/community/church-events
```

**전체 URL**:
```
https://adzhdsajdamrflvybhxq.supabase.co/api/v1/community/church-events
```

### 4.2 요청 본문 (Request Body)

```json
{
  "title": "2025 청년 겨울 수련회",
  "content": "겨울을 맞이하여 청년부 수련회를 개최합니다. 은혜로운 시간 되시길 바랍니다.",
  "category": "retreat",
  "event_date": "2025-12-20",
  "event_time": "09:00",
  "location": "강원도 속초 청년수련원",
  "fee": 150000,
  "age_restriction": "young-adult",
  "registration_required": true,
  "registration_deadline": "2025-12-10",
  "max_participants": 100,
  "special_notes": "준비물: 세면도구, 편한 옷, 성경",
  "contact_phone": "010-1234-5678",
  "contact_email": "youth@church.com",
  "images": [
    "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/church_1/event1.jpg"
  ],
  "church_id": 1,
  "author_id": 123,
  "status": "upcoming"
}
```

#### 필수 필드

| 필드 | 타입 | 설명 |
|-----|------|------|
| `title` | string | 행사 제목 (최대 100자) |
| `content` | string | 행사 상세 내용 (최대 1000자) |
| `category` | string | 행사 카테고리 (아래 표 참조) |
| `event_date` | string | 행사 날짜 (YYYY-MM-DD) |
| `contact_phone` | string | 담당자 연락처 |
| `author_id` | number | 작성자 ID |

#### 선택 필드

| 필드 | 타입 | 기본값 | 설명 |
|-----|------|--------|------|
| `event_time` | string | - | 행사 시간 (HH:MM) |
| `location` | string | - | 행사 장소 (최대 100자) |
| `fee` | number | 0 | 참가비 (원) |
| `age_restriction` | string | "none" | 연령 제한 (아래 표 참조) |
| `registration_required` | boolean | false | 사전 신청 필요 여부 |
| `registration_deadline` | string | - | 신청 마감일 (YYYY-MM-DD) |
| `max_participants` | number | null | 최대 참가자 수 |
| `special_notes` | string | - | 특이사항 (최대 500자) |
| `contact_email` | string | - | 담당자 이메일 |
| `images` | string[] | [] | 이미지 URL 배열 (최대 5개) |
| `church_id` | number | 9998 | 교회 ID |
| `status` | string | "upcoming" | 행사 상태 |

#### 카테고리 (category) 값

| 값 | 한글명 |
|----|--------|
| `worship` | 예배/집회 |
| `education` | 교육/세미나 |
| `volunteer` | 봉사활동 |
| `cultural` | 문화행사 |
| `outdoor` | 야외활동 |
| `mission` | 선교활동 |
| `retreat` | 수련회 |
| `other` | 기타 |

#### 연령 제한 (age_restriction) 값

| 값 | 한글명 |
|----|--------|
| `none` | 제한없음 |
| `infant` | 유아 (0-7세) |
| `child` | 아동 (8-13세) |
| `teenager` | 청소년 (14-19세) |
| `young-adult` | 청년 (20-35세) |
| `middle-age` | 중년 (36-55세) |
| `senior` | 장년 (56세 이상) |

#### 상태 (status) 값

| 값 | 한글명 |
|----|--------|
| `upcoming` | 예정 |
| `ongoing` | 진행중 |
| `completed` | 완료 |
| `cancelled` | 취소 |

### 4.3 응답 (Response)

#### 성공 (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 501,
    "title": "2025 청년 겨울 수련회",
    "content": "겨울을 맞이하여 청년부 수련회를 개최합니다.",
    "category": "retreat",
    "event_date": "2025-12-20",
    "event_time": "09:00",
    "location": "강원도 속초 청년수련원",
    "fee": 150000,
    "age_restriction": "young-adult",
    "registration_required": true,
    "registration_deadline": "2025-12-10",
    "max_participants": 100,
    "current_participants": 0,
    "special_notes": "준비물: 세면도구, 편한 옷, 성경",
    "contact_phone": "010-1234-5678",
    "contact_email": "youth@church.com",
    "contact_info": "010-1234-5678 | youth@church.com",
    "images": [
      "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/church_1/event1.jpg"
    ],
    "church_id": 1,
    "church_name": "성광교회",
    "author_id": 123,
    "author_name": "홍길동",
    "user_name": "홍길동",
    "status": "upcoming",
    "view_count": 0,
    "likes": 0,
    "comments": 0,
    "created_at": "2025-10-01T12:34:56.789Z",
    "updated_at": "2025-10-01T12:34:56.789Z"
  }
}
```

### 4.4 요청 예시 코드

#### Swift (iOS)

```swift
struct ChurchEventRequest: Codable {
    let title: String
    let content: String
    let category: String
    let eventDate: String
    let eventTime: String?
    let location: String?
    let fee: Int
    let ageRestriction: String
    let registrationRequired: Bool
    let registrationDeadline: String?
    let maxParticipants: Int?
    let specialNotes: String?
    let contactPhone: String
    let contactEmail: String?
    let images: [String]
    let churchId: Int
    let authorId: Int
    let status: String

    enum CodingKeys: String, CodingKey {
        case title, content, category, location, fee, images, status
        case eventDate = "event_date"
        case eventTime = "event_time"
        case ageRestriction = "age_restriction"
        case registrationRequired = "registration_required"
        case registrationDeadline = "registration_deadline"
        case maxParticipants = "max_participants"
        case specialNotes = "special_notes"
        case contactPhone = "contact_phone"
        case contactEmail = "contact_email"
        case churchId = "church_id"
        case authorId = "author_id"
    }
}

func createChurchEvent(request: ChurchEventRequest) async throws -> ChurchEventResponse {
    let url = URL(string: "https://adzhdsajdamrflvybhxq.supabase.co/api/v1/community/church-events")!
    var urlRequest = URLRequest(url: url)
    urlRequest.httpMethod = "POST"
    urlRequest.setValue("Bearer \(jwtToken)", forHTTPHeaderField: "Authorization")
    urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let encoder = JSONEncoder()
    urlRequest.httpBody = try encoder.encode(request)

    let (data, response) = try await URLSession.shared.data(for: urlRequest)

    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 201 else {
        throw NetworkError.requestFailed
    }

    let decoder = JSONDecoder()
    let apiResponse = try decoder.decode(APIResponse<ChurchEventResponse>.self, from: data)

    guard apiResponse.success, let event = apiResponse.data else {
        throw NetworkError.invalidResponse
    }

    return event
}
```

#### Kotlin (Android)

```kotlin
data class ChurchEventRequest(
    val title: String,
    val content: String,
    val category: String,
    @SerializedName("event_date") val eventDate: String,
    @SerializedName("event_time") val eventTime: String? = null,
    val location: String? = null,
    val fee: Int = 0,
    @SerializedName("age_restriction") val ageRestriction: String = "none",
    @SerializedName("registration_required") val registrationRequired: Boolean = false,
    @SerializedName("registration_deadline") val registrationDeadline: String? = null,
    @SerializedName("max_participants") val maxParticipants: Int? = null,
    @SerializedName("special_notes") val specialNotes: String? = null,
    @SerializedName("contact_phone") val contactPhone: String,
    @SerializedName("contact_email") val contactEmail: String? = null,
    val images: List<String> = emptyList(),
    @SerializedName("church_id") val churchId: Int,
    @SerializedName("author_id") val authorId: Int,
    val status: String = "upcoming"
)

suspend fun createChurchEvent(request: ChurchEventRequest): ChurchEventResponse {
    val url = "https://adzhdsajdamrflvybhxq.supabase.co/api/v1/community/church-events"

    val json = gson.toJson(request)
    val requestBody = json.toRequestBody("application/json".toMediaType())

    val httpRequest = Request.Builder()
        .url(url)
        .post(requestBody)
        .addHeader("Authorization", "Bearer $jwtToken")
        .addHeader("Content-Type", "application/json")
        .build()

    val response = okHttpClient.newCall(httpRequest).execute()

    if (!response.isSuccessful) {
        throw IOException("행사 등록 실패: ${response.code}")
    }

    val apiResponse = gson.fromJson(response.body?.string(),
        object : TypeToken<APIResponse<ChurchEventResponse>>() {}.type) as APIResponse<ChurchEventResponse>

    if (!apiResponse.success || apiResponse.data == null) {
        throw IOException("잘못된 응답 형식")
    }

    return apiResponse.data
}
```

---

## 5. 교회 행사 목록 조회 API

### 5.1 엔드포인트

```
GET /api/v1/community/church-events
```

### 5.2 Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `page` | number | 선택 | 1 | 페이지 번호 |
| `per_page` | number | 선택 | 20 | 페이지당 게시글 수 |
| `category` | string | 선택 | - | 카테고리 필터 |
| `status` | string | 선택 | - | 상태 필터 |
| `search` | string | 선택 | - | 제목/내용 검색 |

### 5.3 응답 (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 501,
      "title": "2025 청년 겨울 수련회",
      "category": "retreat",
      "event_date": "2025-12-20",
      "event_time": "09:00",
      "location": "강원도 속초 청년수련원",
      "fee": 150000,
      "registration_required": true,
      "registration_deadline": "2025-12-10",
      "max_participants": 100,
      "current_participants": 25,
      "church_id": 1,
      "church_name": "성광교회",
      "author_name": "홍길동",
      "status": "upcoming",
      "view_count": 120,
      "likes": 15,
      "created_at": "2025-10-01T12:34:56.789Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 55,
    "per_page": 20,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 6. 에러 처리

### HTTP 상태 코드

| 상태 코드 | 설명 |
|----------|------|
| `200 OK` | 요청 성공 (목록 조회) |
| `201 Created` | 행사 등록 성공 |
| `400 Bad Request` | 잘못된 요청 |
| `401 Unauthorized` | 인증 실패 |
| `403 Forbidden` | 권한 없음 |
| `422 Unprocessable Entity` | 유효성 검증 실패 |
| `500 Internal Server Error` | 서버 오류 |

### 에러 응답 형식

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "에러 메시지",
  "details": {}
}
```

### 주요 에러 코드

| 에러 코드 | 설명 | 해결 방법 |
|----------|------|----------|
| `UNAUTHORIZED` | 인증 실패 | JWT 토큰 확인 |
| `VALIDATION_ERROR` | 유효성 검증 실패 | 요청 본문 필드 확인 |
| `RESOURCE_NOT_FOUND` | 리소스를 찾을 수 없음 | ID 확인 |
| `INTERNAL_ERROR` | 서버 내부 오류 | 관리자에게 문의 |

---

**문서 버전**: 1.0.0
**최종 수정일**: 2025-10-01
**작성자**: 백엔드 개발팀
