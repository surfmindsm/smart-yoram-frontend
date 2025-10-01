# 구인 공고 모바일 API 명세서

**작성일**: 2025-10-01
**대상**: 모바일 개발자
**플랫폼**: iOS / Android

---

## 목차

1. [개요](#1-개요)
2. [인증](#2-인증)
3. [이미지 업로드](#3-이미지-업로드)
4. [구인 공고 글 작성 API](#4-구인-공고-글-작성-api)
5. [구인 공고 목록 조회 API](#5-구인-공고-목록-조회-api)
6. [에러 처리](#6-에러-처리)
7. [테스트 정보](#7-테스트-정보)

---

## 1. 개요

구인 공고 기능은 교회나 기독교 단체에서 사역자나 직원을 모집할 수 있는 커뮤니티 기능입니다.

### 기술 스택
- **백엔드**: 레거시 REST API (FastAPI/Django)
- **데이터베이스**: PostgreSQL
- **파일 스토리지**: Supabase Storage (선택사항)
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

**예시**:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjMsImV4cCI6MTcwNjIzNDU2N30...
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

모든 API 요청에 다음 헤더를 포함해야 합니다:

```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

| 헤더 | 설명 | 필수 |
|-----|------|------|
| `Authorization` | JWT Token (Bearer 형식) | ✅ |
| `Content-Type` | 요청 본문 형식 (application/json) | ✅ |

---

## 3. 이미지 업로드

구인 공고 작성 시 **이미지를 먼저 업로드**한 후, 이미지 URL을 글 작성 API에 전달해야 합니다.

### 3.1 Supabase Storage 직접 업로드

무료나눔 API 문서의 이미지 업로드 섹션과 동일한 방식을 사용합니다.

#### 엔드포인트
```
POST https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/community-images/{file_path}
```

#### 헤더
```http
Authorization: Bearer {SUPABASE_ANON_KEY}
Content-Type: image/jpeg
```

#### 파일 경로 형식
```
church_{church_id}/job_posting_{timestamp}_{random_id}.{extension}
```

**예시**:
```
church_1/job_posting_20251001123045_a7b3c9d2.jpg
```

#### 공개 URL 생성
```
https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/{file_path}
```

---

## 4. 구인 공고 글 작성 API

### 4.1 엔드포인트

```
POST /api/v1/community/job-postings
```

**전체 URL**:
```
https://adzhdsajdamrflvybhxq.supabase.co/api/v1/community/job-postings
```

### 4.2 요청 헤더

```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### 4.3 요청 본문 (Request Body)

```json
{
  "title": "청년부 담당 전도사 모집",
  "description": "대학청년부를 담당할 열정있는 전도사를 모집합니다.",
  "position": "evangelist",
  "job_type": "full-time",
  "salary": "월 300만원 (협의 가능)",
  "location": "서울 강남구",
  "deadline": "2025-11-30",
  "requirements": ["신학대 졸업", "청년 사역 경험 우대", "찬양 가능자 우대"],
  "qualifications": ["전도사 자격증 소지", "운전 가능"],
  "benefits": ["4대보험", "연차", "사택 제공"],
  "contact_phone": "010-1234-5678",
  "contact_email": "hr@church.com",
  "images": [
    "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/church_1/image1.jpg"
  ],
  "church_id": 1,
  "author_id": 123,
  "status": "open"
}
```

#### 필수 필드

| 필드 | 타입 | 제약사항 | 설명 |
|-----|------|---------|------|
| `title` | string | 최대 100자 | 게시글 제목 |
| `description` | string | 최대 1000자 | 상세 업무 내용 |
| `position` | string | 선택값 | 직책 (아래 표 참조) |
| `job_type` | string | 선택값 | 고용 형태 (아래 표 참조) |
| `deadline` | string | ISO 8601 날짜 | 지원 마감일 (YYYY-MM-DD) |
| `contact_phone` | string | 전화번호 형식 | 담당자 연락처 |
| `author_id` | number | 양수 | 작성자 ID |

#### 선택 필드

| 필드 | 타입 | 기본값 | 설명 |
|-----|------|--------|------|
| `salary` | string | - | 급여 조건 (최대 100자) |
| `location` | string | - | 근무 지역 (최대 100자) |
| `requirements` | string[] | [] | 우대 사항 배열 |
| `qualifications` | string[] | [] | 자격 요건 배열 |
| `benefits` | string[] | [] | 복리후생 배열 |
| `contact_email` | string | - | 담당자 이메일 |
| `images` | string[] | [] | 이미지 URL 배열 (최대 5개) |
| `church_id` | number | 9998 | 교회 ID |
| `status` | string | "open" | 게시글 상태 |
| `applications` | number | 0 | 지원자 수 |

#### 직책 (position) 값

| 값 | 한글명 |
|----|--------|
| `pastor` | 목사 |
| `evangelist` | 전도사 |
| `education_evangelist` | 교육전도사 |
| `worship_leader` | 찬양팀 리더 |
| `teacher` | 교육부 교사 |
| `admin` | 행정간사 |
| `youth_manager` | 청년부 담당 |
| `infant_teacher` | 유아부 교사 |
| `other` | 기타 |

#### 고용 형태 (job_type) 값

| 값 | 한글명 |
|----|--------|
| `full-time` | 상근직 |
| `part-time` | 비상근직 |
| `volunteer` | 봉사직 |

#### 상태 (status) 값

| 값 | 한글명 |
|----|--------|
| `open` | 모집 중 |
| `closed` | 마감됨 |

### 4.4 응답 (Response)

#### 성공 (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 101,
    "title": "청년부 담당 전도사 모집",
    "description": "대학청년부를 담당할 열정있는 전도사를 모집합니다.",
    "position": "evangelist",
    "job_type": "full-time",
    "salary": "월 300만원 (협의 가능)",
    "location": "서울 강남구",
    "deadline": "2025-11-30",
    "requirements": ["신학대 졸업", "청년 사역 경험 우대", "찬양 가능자 우대"],
    "qualifications": ["전도사 자격증 소지", "운전 가능"],
    "benefits": ["4대보험", "연차", "사택 제공"],
    "contact_phone": "010-1234-5678",
    "contact_email": "hr@church.com",
    "contact_info": "010-1234-5678 | hr@church.com",
    "images": [
      "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/church_1/image1.jpg"
    ],
    "church_id": 1,
    "church_name": "성광교회",
    "author_id": 123,
    "author_name": "홍길동",
    "user_name": "홍길동",
    "status": "open",
    "applications": 0,
    "view_count": 0,
    "likes": 0,
    "comments": 0,
    "created_at": "2025-10-01T12:34:56.789Z",
    "updated_at": "2025-10-01T12:34:56.789Z"
  }
}
```

#### 실패 (400 Bad Request)

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "필수 필드가 누락되었습니다.",
  "details": {
    "missing_fields": ["title", "position"]
  }
}
```

#### 실패 (401 Unauthorized)

```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "인증이 필요합니다."
}
```

#### 실패 (500 Internal Server Error)

```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "서버 오류가 발생했습니다."
}
```

### 4.5 요청 예시 코드

#### Swift (iOS)

```swift
struct JobPostingRequest: Codable {
    let title: String
    let description: String
    let position: String
    let jobType: String
    let salary: String?
    let location: String
    let deadline: String
    let requirements: [String]
    let qualifications: [String]
    let benefits: [String]
    let contactPhone: String
    let contactEmail: String?
    let images: [String]
    let churchId: Int
    let authorId: Int
    let status: String

    enum CodingKeys: String, CodingKey {
        case title, description, position, salary, location, deadline
        case requirements, qualifications, benefits, images, status
        case jobType = "job_type"
        case contactPhone = "contact_phone"
        case contactEmail = "contact_email"
        case churchId = "church_id"
        case authorId = "author_id"
    }
}

func createJobPosting(request: JobPostingRequest) async throws -> JobPostingResponse {
    let url = URL(string: "https://adzhdsajdamrflvybhxq.supabase.co/api/v1/community/job-postings")!
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
    let apiResponse = try decoder.decode(APIResponse<JobPostingResponse>.self, from: data)

    guard apiResponse.success, let jobPosting = apiResponse.data else {
        throw NetworkError.invalidResponse
    }

    return jobPosting
}
```

#### Kotlin (Android)

```kotlin
data class JobPostingRequest(
    val title: String,
    val description: String,
    val position: String,
    @SerializedName("job_type") val jobType: String,
    val salary: String? = null,
    val location: String,
    val deadline: String,
    val requirements: List<String> = emptyList(),
    val qualifications: List<String> = emptyList(),
    val benefits: List<String> = emptyList(),
    @SerializedName("contact_phone") val contactPhone: String,
    @SerializedName("contact_email") val contactEmail: String? = null,
    val images: List<String> = emptyList(),
    @SerializedName("church_id") val churchId: Int,
    @SerializedName("author_id") val authorId: Int,
    val status: String = "open"
)

suspend fun createJobPosting(request: JobPostingRequest): JobPostingResponse {
    val url = "https://adzhdsajdamrflvybhxq.supabase.co/api/v1/community/job-postings"

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
        throw IOException("글 작성 실패: ${response.code}")
    }

    val apiResponse = gson.fromJson(response.body?.string(),
        object : TypeToken<APIResponse<JobPostingResponse>>() {}.type) as APIResponse<JobPostingResponse>

    if (!apiResponse.success || apiResponse.data == null) {
        throw IOException("잘못된 응답 형식")
    }

    return apiResponse.data
}
```

---

## 5. 구인 공고 목록 조회 API

### 5.1 엔드포인트

```
GET /api/v1/community/job-postings
```

**전체 URL**:
```
https://adzhdsajdamrflvybhxq.supabase.co/api/v1/community/job-postings
```

### 5.2 Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `page` | number | 선택 | 1 | 페이지 번호 |
| `per_page` | number | 선택 | 20 | 페이지당 게시글 수 |
| `position` | string | 선택 | - | 직책 필터 |
| `job_type` | string | 선택 | - | 고용 형태 필터 |
| `status` | string | 선택 | - | 상태 필터 |
| `search` | string | 선택 | - | 제목/설명 검색 |

### 5.3 요청 예시

```http
GET /api/v1/community/job-postings?page=1&per_page=20&position=evangelist&status=open
Host: adzhdsajdamrflvybhxq.supabase.co
Authorization: Bearer {JWT_TOKEN}
```

### 5.4 응답 (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "title": "청년부 담당 전도사 모집",
      "description": "대학청년부를 담당할 열정있는 전도사를 모집합니다.",
      "position": "evangelist",
      "job_type": "full-time",
      "salary": "월 300만원 (협의 가능)",
      "location": "서울 강남구",
      "deadline": "2025-11-30",
      "church_id": 1,
      "church_name": "성광교회",
      "author_id": 123,
      "author_name": "홍길동",
      "status": "open",
      "applications": 3,
      "view_count": 50,
      "likes": 5,
      "created_at": "2025-10-01T12:34:56.789Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 95,
    "per_page": 20,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 6. 에러 처리

### 6.1 HTTP 상태 코드

| 상태 코드 | 설명 |
|----------|------|
| `200 OK` | 요청 성공 (목록 조회) |
| `201 Created` | 게시글 생성 성공 |
| `400 Bad Request` | 잘못된 요청 |
| `401 Unauthorized` | 인증 실패 |
| `403 Forbidden` | 권한 없음 |
| `404 Not Found` | 리소스를 찾을 수 없음 |
| `422 Unprocessable Entity` | 유효성 검증 실패 |
| `500 Internal Server Error` | 서버 오류 |

### 6.2 에러 응답 형식

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "에러 메시지",
  "details": {}
}
```

### 6.3 주요 에러 코드

| 에러 코드 | 설명 | 해결 방법 |
|----------|------|----------|
| `UNAUTHORIZED` | 인증 실패 | JWT 토큰 확인 |
| `VALIDATION_ERROR` | 유효성 검증 실패 | 요청 본문 필드 확인 |
| `RESOURCE_NOT_FOUND` | 리소스를 찾을 수 없음 | ID 확인 |
| `INTERNAL_ERROR` | 서버 내부 오류 | 관리자에게 문의 |

---

## 7. 테스트 정보

### 7.1 테스트 환경

- **API URL**: `https://adzhdsajdamrflvybhxq.supabase.co/api/v1`
- **테스트 계정**: `test@church.com` / `testpassword`
- **테스트 사용자 ID**: `123`
- **테스트 교회 ID**: `1`

### 7.2 Postman / Insomnia 테스트

#### 1. 로그인 테스트

**요청**:
```http
POST https://adzhdsajdamrflvybhxq.supabase.co/api/v1/auth/login
Content-Type: application/json

{
  "username": "test@church.com",
  "password": "testpassword"
}
```

**응답**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 123
}
```

#### 2. 구인 공고 작성 테스트

**요청**:
```http
POST https://adzhdsajdamrflvybhxq.supabase.co/api/v1/community/job-postings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "테스트 구인 공고",
  "description": "테스트용 게시글입니다.",
  "position": "admin",
  "job_type": "full-time",
  "deadline": "2025-12-31",
  "contact_phone": "010-1234-5678",
  "author_id": 123,
  "church_id": 1
}
```

#### 3. 구인 공고 목록 조회 테스트

**요청**:
```http
GET https://adzhdsajdamrflvybhxq.supabase.co/api/v1/community/job-postings?page=1&per_page=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

**문서 버전**: 1.0.0
**최종 수정일**: 2025-10-01
**작성자**: 백엔드 개발팀
