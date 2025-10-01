# 음악팀 모집 모바일 API 명세서

**작성일**: 2025-10-01
**대상**: 모바일 개발자
**플랫폼**: iOS / Android

---

## 목차

1. [개요](#1-개요)
2. [인증](#2-인증)
3. [음악팀 모집 글 작성 API](#3-음악팀-모집-글-작성-api)
4. [음악팀 모집 목록 조회 API](#4-음악팀-모집-목록-조회-api)
5. [에러 처리](#5-에러-처리)

---

## 1. 개요

음악팀 모집 기능은 교회에서 예배나 행사를 위한 음악팀 멤버를 모집할 수 있는 커뮤니티 기능입니다.

### 기술 스택
- **백엔드**: Supabase Edge Functions (Deno)
- **데이터베이스**: PostgreSQL (Supabase)
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

## 3. 음악팀 모집 글 작성 API

### 3.1 엔드포인트

```
POST /functions/v1/music-teams
```

**전체 URL**:
```
https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/music-teams
```

### 3.2 요청 본문 (Request Body)

```json
{
  "title": "주일예배 피아니스트 모집",
  "event_type": "sunday-service",
  "team_types": ["acoustic-team"],
  "schedule": "행사일: 2025-12-25, 리허설: 매주 토요일 오후 2시",
  "location": "서울 강남구 성광교회",
  "description": "주일 1부 예배 피아노 반주자를 모집합니다.",
  "requirements": "3년 이상 연주 경험, 악보 시창 가능",
  "compensation": "회당 10만원",
  "contact_phone": "010-1234-5678",
  "contact_email": "worship@church.com",
  "church_id": 1,
  "author_id": 123,
  "status": "open"
}
```

#### 필수 필드

| 필드 | 타입 | 설명 |
|-----|------|------|
| `title` | string | 모집 제목 (최대 100자) |
| `event_type` | string | 행사 유형 (아래 표 참조) |
| `team_types` | string[] | 팀 형태 배열 (아래 표 참조) |
| `contact_phone` | string | 담당자 연락처 |
| `author_id` | number | 작성자 ID |

#### 선택 필드

| 필드 | 타입 | 기본값 | 설명 |
|-----|------|--------|------|
| `schedule` | string | - | 일정 정보 (최대 200자) |
| `location` | string | - | 장소 (최대 100자) |
| `description` | string | - | 상세 설명 (최대 1000자) |
| `requirements` | string | - | 자격 요건 (최대 500자) |
| `compensation` | string | - | 보상/사례비 (최대 100자) |
| `contact_email` | string | - | 담당자 이메일 |
| `church_id` | number | 9998 | 교회 ID |
| `status` | string | "open" | 모집 상태 |
| `applications` | number | 0 | 지원자 수 |

#### 행사 유형 (event_type) 값

| 값 | 한글명 |
|----|--------|
| `sunday-service` | 주일예배 |
| `wednesday-service` | 수요예배 |
| `dawn-service` | 새벽예배 |
| `special-service` | 특별예배 |
| `revival` | 부흥회 |
| `praise-meeting` | 찬양집회 |
| `wedding` | 결혼식 |
| `funeral` | 장례식 |
| `retreat` | 수련회 |
| `concert` | 콘서트 |
| `other` | 기타 |

#### 팀 형태 (team_types) 값

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

#### 모집 상태 (status) 값

| 값 | 한글명 |
|----|--------|
| `open` | 모집 중 |
| `closed` | 마감됨 |
| `active` | 활성 |

### 3.3 응답 (Response)

#### 성공 (201 Created)

```json
{
  "id": 201,
  "title": "주일예배 피아니스트 모집",
  "event_type": "sunday-service",
  "team_types": ["acoustic-team"],
  "schedule": "행사일: 2025-12-25, 리허설: 매주 토요일 오후 2시",
  "location": "서울 강남구 성광교회",
  "description": "주일 1부 예배 피아노 반주자를 모집합니다.",
  "requirements": "3년 이상 연주 경험, 악보 시창 가능",
  "compensation": "회당 10만원",
  "contact_phone": "010-1234-5678",
  "contact_email": "worship@church.com",
  "contact_info": "010-1234-5678 | worship@church.com",
  "church_id": 1,
  "author_id": 123,
  "author_name": "홍길동",
  "user_name": "홍길동",
  "status": "open",
  "applications": 0,
  "view_count": 0,
  "likes": 0,
  "created_at": "2025-10-01T12:34:56.789Z",
  "updated_at": "2025-10-01T12:34:56.789Z"
}
```

### 3.4 요청 예시 코드

#### Swift (iOS)

```swift
struct MusicTeamRecruitRequest: Codable {
    let title: String
    let eventType: String
    let teamTypes: [String]
    let schedule: String?
    let location: String?
    let description: String?
    let requirements: String?
    let compensation: String?
    let contactPhone: String
    let contactEmail: String?
    let churchId: Int
    let authorId: Int
    let status: String

    enum CodingKeys: String, CodingKey {
        case title, schedule, location, description, requirements, compensation, status
        case eventType = "event_type"
        case teamTypes = "team_types"
        case contactPhone = "contact_phone"
        case contactEmail = "contact_email"
        case churchId = "church_id"
        case authorId = "author_id"
    }
}

func createMusicTeamRecruit(request: MusicTeamRecruitRequest) async throws -> MusicTeamRecruitResponse {
    let url = URL(string: "https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/music-teams")!
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
    return try decoder.decode(MusicTeamRecruitResponse.self, from: data)
}
```

#### Kotlin (Android)

```kotlin
data class MusicTeamRecruitRequest(
    val title: String,
    @SerializedName("event_type") val eventType: String,
    @SerializedName("team_types") val teamTypes: List<String>,
    val schedule: String? = null,
    val location: String? = null,
    val description: String? = null,
    val requirements: String? = null,
    val compensation: String? = null,
    @SerializedName("contact_phone") val contactPhone: String,
    @SerializedName("contact_email") val contactEmail: String? = null,
    @SerializedName("church_id") val churchId: Int,
    @SerializedName("author_id") val authorId: Int,
    val status: String = "open"
)

suspend fun createMusicTeamRecruit(request: MusicTeamRecruitRequest): MusicTeamRecruitResponse {
    val url = "https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/music-teams"

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

    return gson.fromJson(response.body?.string(), MusicTeamRecruitResponse::class.java)
}
```

---

## 4. 음악팀 모집 목록 조회 API

### 4.1 엔드포인트

```
GET /functions/v1/music-teams
```

### 4.2 Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `limit` | number | 선택 | 50 | 조회할 게시글 수 |
| `worship_type` | string | 선택 | - | 예배 형태 필터 |
| `instruments` | string | 선택 | - | 악기 필터 |
| `status` | string | 선택 | - | 상태 필터 |
| `search` | string | 선택 | - | 제목/설명 검색 |

### 4.3 응답 (200 OK)

```json
[
  {
    "id": 201,
    "title": "주일예배 피아니스트 모집",
    "event_type": "sunday-service",
    "team_types": ["acoustic-team"],
    "location": "서울 강남구 성광교회",
    "compensation": "회당 10만원",
    "church_id": 1,
    "author_name": "홍길동",
    "status": "open",
    "applications": 2,
    "view_count": 30,
    "likes": 5,
    "created_at": "2025-10-01T12:34:56.789Z"
  }
]
```

---

## 5. 에러 처리

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
| `Failed to create music team recruitment` | 요청 본문 검증 |
| `Failed to fetch music teams data` | 네트워크 상태 확인 |

---

**문서 버전**: 1.0.0
**최종 수정일**: 2025-10-01
**작성자**: 백엔드 개발팀
