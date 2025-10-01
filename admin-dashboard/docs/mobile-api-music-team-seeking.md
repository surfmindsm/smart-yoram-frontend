# 음악팀 참여 모바일 API 명세서

**작성일**: 2025-10-01
**대상**: 모바일 개발자
**플랫폼**: iOS / Android

---

## 목차

1. [개요](#1-개요)
2. [인증](#2-인증)
3. [파일 업로드](#3-파일-업로드)
4. [음악팀 참여 신청 API](#4-음악팀-참여-신청-api)
5. [음악팀 참여 목록 조회 API](#5-음악팀-참여-목록-조회-api)
6. [에러 처리](#6-에러-처리)

---

## 1. 개요

음악팀 참여 기능은 음악 사역자들이 자신의 연주 경력과 가능한 시간을 등록하여 교회의 음악팀 모집에 지원할 수 있는 커뮤니티 기능입니다.

### 기술 스택
- **백엔드**: Supabase Edge Functions (Deno)
- **데이터베이스**: PostgreSQL (Supabase)
- **파일 스토리지**: Supabase Storage (포트폴리오 파일)
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

## 3. 파일 업로드

포트폴리오 파일(PDF, MP3, MP4, DOC 등)을 업로드할 수 있습니다.

### 3.1 Supabase Storage 업로드

#### 엔드포인트
```
POST https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/portfolio-files/{file_path}
```

#### 헤더
```http
Authorization: Bearer {SUPABASE_ANON_KEY}
Content-Type: application/pdf (또는 audio/mpeg, video/mp4 등)
```

#### 파일 경로 형식
```
user_{user_id}/portfolio_{timestamp}_{random}.{extension}
```

**예시**:
```
user_123/portfolio_20251001123045_a7b3c9d2.pdf
```

#### 공개 URL 생성
```
https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/portfolio-files/{file_path}
```

#### 파일 제약사항

| 항목 | 제약 |
|-----|------|
| **지원 형식** | PDF, MP3, MP4, DOC, DOCX |
| **최대 파일 크기** | 10MB |

---

## 4. 음악팀 참여 신청 API

### 4.1 엔드포인트

```
POST /functions/v1/music-seekers
```

**전체 URL**:
```
https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/music-seekers
```

### 4.2 요청 본문 (Request Body)

```json
{
  "title": "피아노 반주 가능한 연주자입니다",
  "team_name": "찬양팀",
  "team_type": "praise-team",
  "experience": "10년 이상 피아노 연주 경력이 있으며, 주일예배와 특별 예배에서 반주 경험이 많습니다.",
  "portfolio": "https://youtube.com/watch?v=example",
  "portfolio_file": "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/portfolio-files/user_123/portfolio.pdf",
  "preferred_location": ["서울", "경기도 분당"],
  "available_days": ["월요일", "화요일", "수요일", "일요일"],
  "available_time": "evening",
  "contact_phone": "010-1234-5678",
  "contact_email": "musician@example.com",
  "author_id": 123,
  "status": "active"
}
```

#### 필수 필드

| 필드 | 타입 | 설명 |
|-----|------|------|
| `title` | string | 지원서 제목 (최대 100자) |
| `team_type` | string | 팀 형태 (아래 표 참조) |
| `contact_phone` | string | 연락처 전화번호 |
| `author_id` | number | 작성자 ID |

#### 선택 필드

| 필드 | 타입 | 기본값 | 설명 |
|-----|------|--------|------|
| `team_name` | string | - | 현재 활동 팀명 (최대 100자) |
| `experience` | string | - | 연주 경력 (최대 1000자) |
| `portfolio` | string | - | YouTube 링크 등 (최대 500자) |
| `portfolio_file` | string | - | 포트폴리오 파일 URL |
| `preferred_location` | string[] | [] | 활동 가능 지역 배열 |
| `available_days` | string[] | [] | 활동 가능 요일 배열 |
| `available_time` | string | - | 활동 가능 시간대 |
| `contact_email` | string | - | 연락처 이메일 |
| `church_id` | number | null | 소속 교회 ID |
| `status` | string | "active" | 지원서 상태 |

#### 팀 형태 (team_type) 값

| 값 | 한글명 |
|----|--------|
| `solo` | 현재 솔로 활동 |
| `praise-team` | 찬양팀 |
| `worship-team` | 워십팀 |
| `acoustic-team` | 어쿠스틱 팀 |
| `band` | 밴드 |
| `orchestra` | 오케스트라 |
| `choir` | 합창단 |
| `dance-team` | 무용팀 |
| `other` | 기타 |

#### 활동 가능 시간대 (available_time) 값

| 값 | 한글명 |
|----|--------|
| `morning` | 오전 (9:00-12:00) |
| `afternoon` | 오후 (13:00-18:00) |
| `evening` | 저녁 (18:00-21:00) |
| `night` | 야간 (21:00-23:00) |
| `anytime` | 상시 가능 |
| `negotiate` | 협의 후 결정 |

### 4.3 응답 (Response)

#### 성공 (201 Created)

```json
{
  "message": "Music seeker created successfully",
  "data": {
    "id": 301,
    "title": "피아노 반주 가능한 연주자입니다",
    "team_name": "찬양팀",
    "instrument": "praise-team",
    "experience": "10년 이상 피아노 연주 경력이 있으며...",
    "portfolio": "https://youtube.com/watch?v=example",
    "portfolio_file": "https://.../portfolio.pdf",
    "preferred_location": ["서울", "경기도 분당"],
    "available_days": ["월요일", "화요일", "수요일", "일요일"],
    "available_time": "evening",
    "contact_phone": "010-1234-5678",
    "contact_email": "musician@example.com",
    "author_id": 123,
    "author_name": "홍길동",
    "church_id": null,
    "church_name": null,
    "status": "active",
    "created_at": "2025-10-01T12:34:56.789Z",
    "updated_at": "2025-10-01T12:34:56.789Z"
  }
}
```

### 4.4 요청 예시 코드

#### Swift (iOS)

```swift
struct MusicTeamSeekingRequest: Codable {
    let title: String
    let teamName: String?
    let teamType: String
    let experience: String?
    let portfolio: String?
    let portfolioFile: String?
    let preferredLocation: [String]
    let availableDays: [String]
    let availableTime: String?
    let contactPhone: String
    let contactEmail: String?
    let authorId: Int
    let status: String

    enum CodingKeys: String, CodingKey {
        case title, experience, portfolio, status
        case teamName = "team_name"
        case teamType = "team_type"
        case portfolioFile = "portfolio_file"
        case preferredLocation = "preferred_location"
        case availableDays = "available_days"
        case availableTime = "available_time"
        case contactPhone = "contact_phone"
        case contactEmail = "contact_email"
        case authorId = "author_id"
    }
}

func createMusicTeamSeeking(request: MusicTeamSeekingRequest) async throws -> MusicTeamSeekingResponse {
    let url = URL(string: "https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/music-seekers")!
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
    return try decoder.decode(MusicTeamSeekingResponse.self, from: data)
}
```

#### Kotlin (Android)

```kotlin
data class MusicTeamSeekingRequest(
    val title: String,
    @SerializedName("team_name") val teamName: String? = null,
    @SerializedName("team_type") val teamType: String,
    val experience: String? = null,
    val portfolio: String? = null,
    @SerializedName("portfolio_file") val portfolioFile: String? = null,
    @SerializedName("preferred_location") val preferredLocation: List<String> = emptyList(),
    @SerializedName("available_days") val availableDays: List<String> = emptyList(),
    @SerializedName("available_time") val availableTime: String? = null,
    @SerializedName("contact_phone") val contactPhone: String,
    @SerializedName("contact_email") val contactEmail: String? = null,
    @SerializedName("author_id") val authorId: Int,
    val status: String = "active"
)

suspend fun createMusicTeamSeeking(request: MusicTeamSeekingRequest): MusicTeamSeekingResponse {
    val url = "https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/music-seekers"

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
        throw IOException("지원서 제출 실패: ${response.code}")
    }

    return gson.fromJson(response.body?.string(), MusicTeamSeekingResponse::class.java)
}
```

---

## 5. 음악팀 참여 목록 조회 API

### 5.1 엔드포인트

```
GET /functions/v1/music-seekers
```

### 5.2 Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `limit` | number | 선택 | 50 | 조회할 게시글 수 |
| `offset` | number | 선택 | 0 | 조회 시작 위치 |
| `status` | string | 선택 | "active" | 상태 필터 |

### 5.3 응답 (200 OK)

```json
{
  "data": [
    {
      "id": 301,
      "title": "피아노 반주 가능한 연주자입니다",
      "team_name": "찬양팀",
      "instrument": "praise-team",
      "preferred_location": ["서울", "경기도 분당"],
      "available_days": ["월요일", "화요일", "수요일", "일요일"],
      "available_time": "evening",
      "contact_phone": "010-1234-5678",
      "author_id": 123,
      "author_name": "홍길동",
      "status": "active",
      "created_at": "2025-10-01T12:34:56.789Z"
    }
  ],
  "count": 1
}
```

---

## 6. 에러 처리

### HTTP 상태 코드

| 상태 코드 | 설명 |
|----------|------|
| `200 OK` | 요청 성공 (목록 조회) |
| `201 Created` | 지원서 제출 성공 |
| `400 Bad Request` | 잘못된 요청 |
| `401 Unauthorized` | 인증 실패 |
| `500 Internal Server Error` | 서버 오류 |

### 에러 응답 형식

```json
{
  "error": "에러 메시지",
  "details": "상세 정보"
}
```

### 주요 에러 메시지

| 에러 메시지 | 해결 방법 |
|-----------|----------|
| `Missing authentication` | 헤더에 토큰 추가 |
| `Invalid JSON` | 요청 본문 JSON 형식 확인 |
| `Database insert failed` | 요청 본문 필드 검증 |
| `Database query failed` | 네트워크 상태 확인 |

---

**문서 버전**: 1.0.0
**최종 수정일**: 2025-10-01
**작성자**: 백엔드 개발팀
