# 교회 소식 모바일 API 명세서

**작성일**: 2025-10-01
**대상**: 모바일 개발자
**플랫폼**: iOS / Android

---

## 목차

1. [개요](#1-개요)
2. [인증](#2-인증)
3. [이미지 업로드](#3-이미지-업로드)
4. [교회 소식 글 작성 API](#4-교회-소식-글-작성-api)
5. [교회 소식 목록 조회 API](#5-교회-소식-목록-조회-api)
6. [에러 처리](#6-에러-처리)

---

## 1. 개요

교회 소식 기능은 교회에서 다양한 행사, 예배, 공지사항 등을 게시할 수 있는 커뮤니티 기능입니다.

### 기술 스택
- **백엔드**: Supabase Edge Functions (Deno)
- **데이터베이스**: PostgreSQL (Supabase)
- **파일 스토리지**: Supabase Storage
- **인증**: Custom Token (임시 토큰 방식)

### 베이스 URL
```
https://adzhdsajdamrflvybhxq.supabase.co/functions/v1
```

---

## 2. 인증

### Token 형식
```
temp_token_{user_id}_{timestamp}
```

### 헤더 설정
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Custom-Auth: temp_token_123_1696234567890
Content-Type: application/json
```

**Supabase Anon Key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c
```

---

## 3. 이미지 업로드

교회 소식 작성 시 **이미지를 먼저 업로드**한 후, 이미지 URL을 글 작성 API에 전달해야 합니다.

### 3.1 Supabase Storage 직접 업로드

무료나눔 API 문서의 이미지 업로드 섹션과 동일한 방식을 사용합니다.

#### 엔드포인트
```
POST https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/community-images/{file_path}
```

#### 파일 경로 형식
```
church_{church_id}/church_news_{timestamp}_{random_id}.{extension}
```

---

## 4. 교회 소식 글 작성 API

### 4.1 엔드포인트

```
POST /functions/v1/church-news
```

**전체 URL**:
```
https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/church-news
```

### 4.2 요청 본문 (Request Body)

```json
{
  "title": "2025 신년감사예배 안내",
  "content": "새해를 맞이하여 신년감사예배를 드립니다. 많은 참석 부탁드립니다.",
  "category": "특별예배",
  "priority": "important",
  "event_date": "2025-01-01",
  "event_time": "10:30",
  "location": "본당 1층 대예배실",
  "organizer": "예배부",
  "target_audience": "전체",
  "participation_fee": "무료",
  "contact_person": "홍길동",
  "contact_phone": "010-1234-5678",
  "contact_email": "contact@church.com",
  "images": [
    "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/church_1/image1.jpg"
  ],
  "church_id": 1,
  "author_id": 123,
  "status": "active"
}
```

#### 필수 필드

| 필드 | 타입 | 설명 |
|-----|------|------|
| `title` | string | 소식 제목 (최대 100자) |
| `content` | string | 소식 내용 (최대 1000자) |
| `category` | string | 카테고리 (아래 표 참조) |
| `organizer` | string | 주최자/부서 (최대 50자) |
| `author_id` | number | 작성자 ID |

#### 선택 필드

| 필드 | 타입 | 기본값 | 설명 |
|-----|------|--------|------|
| `priority` | string | "normal" | 우선순위 (아래 표 참조) |
| `event_date` | string | - | 행사일 (YYYY-MM-DD) |
| `event_time` | string | - | 행사 시간 (HH:MM) |
| `location` | string | - | 장소 (최대 100자) |
| `target_audience` | string | - | 대상 (최대 50자) |
| `participation_fee` | string | - | 참가비 (최대 50자) |
| `contact_person` | string | - | 담당자 (최대 50자) |
| `contact_phone` | string | - | 연락처 전화번호 |
| `contact_email` | string | - | 연락처 이메일 |
| `images` | string[] | [] | 이미지 URL 배열 (최대 5개) |
| `church_id` | number | 9998 | 교회 ID |
| `status` | string | "active" | 소식 상태 |

#### 카테고리 (category) 값

주요 카테고리:
- **예배/집회**: 특별예배, 부흥회, 기도회, 성례식
- **교육/양육**: 성경공부, 세미나, 수련회, 신앙강좌
- **친교/봉사**: 바자회, 야유회, 지역봉사, 전도행사
- **문화/미디어**: 찬양집회, 연극, 방송, 전시
- **기타**: 창립기념, 절기행사, 예식행사, 리더십

#### 우선순위 (priority) 값

| 값 | 한글명 |
|----|--------|
| `normal` | 일반 |
| `important` | 중요 |
| `urgent` | 긴급 |

#### 상태 (status) 값

| 값 | 한글명 |
|----|--------|
| `active` | 활성 |
| `published` | 게시됨 |
| `completed` | 완료됨 |
| `cancelled` | 취소됨 |

### 4.3 응답 (Response)

#### 성공 (201 Created)

```json
{
  "id": 401,
  "title": "2025 신년감사예배 안내",
  "content": "새해를 맞이하여 신년감사예배를 드립니다. 많은 참석 부탁드립니다.",
  "category": "특별예배",
  "priority": "important",
  "is_urgent": false,
  "event_date": "2025-01-01",
  "event_time": "10:30",
  "location": "본당 1층 대예배실",
  "organizer": "예배부",
  "target_audience": "전체",
  "participation_fee": "무료",
  "contact_person": "홍길동",
  "contact_phone": "010-1234-5678",
  "contact_email": "contact@church.com",
  "images": [
    "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/church_1/image1.jpg"
  ],
  "church_id": 1,
  "author_id": 123,
  "author_name": "홍길동",
  "user_name": "홍길동",
  "status": "published",
  "view_count": 0,
  "likes": 0,
  "comments": 0,
  "created_at": "2025-10-01T12:34:56.789Z",
  "updated_at": "2025-10-01T12:34:56.789Z"
}
```

### 4.4 요청 예시 코드

#### Swift (iOS)

```swift
struct ChurchNewsRequest: Codable {
    let title: String
    let content: String
    let category: String
    let priority: String
    let eventDate: String?
    let eventTime: String?
    let location: String?
    let organizer: String
    let targetAudience: String?
    let participationFee: String?
    let contactPerson: String?
    let contactPhone: String?
    let contactEmail: String?
    let images: [String]
    let churchId: Int
    let authorId: Int
    let status: String

    enum CodingKeys: String, CodingKey {
        case title, content, category, priority, location, organizer, images, status
        case eventDate = "event_date"
        case eventTime = "event_time"
        case targetAudience = "target_audience"
        case participationFee = "participation_fee"
        case contactPerson = "contact_person"
        case contactPhone = "contact_phone"
        case contactEmail = "contact_email"
        case churchId = "church_id"
        case authorId = "author_id"
    }
}

func createChurchNews(request: ChurchNewsRequest) async throws -> ChurchNewsResponse {
    let url = URL(string: "https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/church-news")!
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
    return try decoder.decode(ChurchNewsResponse.self, from: data)
}
```

#### Kotlin (Android)

```kotlin
data class ChurchNewsRequest(
    val title: String,
    val content: String,
    val category: String,
    val priority: String = "normal",
    @SerializedName("event_date") val eventDate: String? = null,
    @SerializedName("event_time") val eventTime: String? = null,
    val location: String? = null,
    val organizer: String,
    @SerializedName("target_audience") val targetAudience: String? = null,
    @SerializedName("participation_fee") val participationFee: String? = null,
    @SerializedName("contact_person") val contactPerson: String? = null,
    @SerializedName("contact_phone") val contactPhone: String? = null,
    @SerializedName("contact_email") val contactEmail: String? = null,
    val images: List<String> = emptyList(),
    @SerializedName("church_id") val churchId: Int,
    @SerializedName("author_id") val authorId: Int,
    val status: String = "active"
)

suspend fun createChurchNews(request: ChurchNewsRequest): ChurchNewsResponse {
    val url = "https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/church-news"

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

    return gson.fromJson(response.body?.string(), ChurchNewsResponse::class.java)
}
```

---

## 5. 교회 소식 목록 조회 API

### 5.1 엔드포인트

```
GET /functions/v1/church-news
```

### 5.2 Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `limit` | number | 선택 | 50 | 조회할 게시글 수 |
| `category` | string | 선택 | - | 카테고리 필터 |
| `urgent` | boolean | 선택 | - | 긴급 여부 필터 |
| `status` | string | 선택 | - | 상태 필터 |
| `search` | string | 선택 | - | 제목/내용 검색 |

### 5.3 응답 (200 OK)

```json
[
  {
    "id": 401,
    "title": "2025 신년감사예배 안내",
    "content": "새해를 맞이하여 신년감사예배를 드립니다.",
    "category": "특별예배",
    "priority": "important",
    "event_date": "2025-01-01",
    "event_time": "10:30",
    "location": "본당 1층 대예배실",
    "organizer": "예배부",
    "church_id": 1,
    "author_name": "홍길동",
    "user_name": "홍길동",
    "status": "published",
    "view_count": 50,
    "likes": 10,
    "created_at": "2025-10-01T12:34:56.789Z"
  }
]
```

---

## 6. 에러 처리

### HTTP 상태 코드

| 상태 코드 | 설명 |
|----------|------|
| `200 OK` | 요청 성공 (목록 조회) |
| `201 Created` | 게시글 생성 성공 |
| `400 Bad Request` | 잘못된 요청 |
| `401 Unauthorized` | 인증 실패 |
| `405 Method Not Allowed` | 지원하지 않는 HTTP 메서드 |
| `500 Internal Server Error` | 서버 오류 |

### 에러 응답 형식

```json
{
  "error": "에러 메시지"
}
```

### 주요 에러 메시지

| 에러 메시지 | 해결 방법 |
|-----------|----------|
| `Missing authentication` | 헤더에 토큰 추가 |
| `Invalid token structure` | 토큰 형식 확인 |
| `Token expired` | 새로운 토큰 생성 |
| `Failed to create church news` | 요청 본문 검증 |
| `Failed to fetch church news data` | 네트워크 상태 확인 |

---

**문서 버전**: 1.0.0
**최종 수정일**: 2025-10-01
**작성자**: 백엔드 개발팀
