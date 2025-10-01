# 물품 판매 모바일 API 명세서

**작성일**: 2025-10-01
**대상**: 모바일 개발자
**플랫폼**: iOS / Android

---

## 목차

1. [개요](#1-개요)
2. [인증](#2-인증)
3. [이미지 업로드](#3-이미지-업로드)
4. [물품 판매 글 작성 API](#4-물품-판매-글-작성-api)
5. [물품 판매 목록 조회 API](#5-물품-판매-목록-조회-api)
6. [에러 처리](#6-에러-처리)
7. [테스트 정보](#7-테스트-정보)

---

## 1. 개요

물품 판매 기능은 교회 교인들이 중고 물품을 유료로 판매할 수 있는 커뮤니티 기능입니다. 무료나눔과 동일한 API를 사용하지만 `is_free` 필드를 `false`로 설정하고 `price` 필드를 추가합니다.

### 기술 스택
- **백엔드**: Supabase Edge Functions (Deno)
- **데이터베이스**: PostgreSQL (Supabase)
- **파일 스토리지**: Supabase Storage
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

## 3. 이미지 업로드

물품 판매 글 작성 시 **이미지를 먼저 업로드**한 후, 이미지 URL을 글 작성 API에 전달해야 합니다.

### 3.1 Supabase Storage 직접 업로드

#### 엔드포인트
```
POST https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/community-images/{file_path}
```

#### 헤더
```http
Authorization: Bearer {SUPABASE_ANON_KEY}
Content-Type: image/jpeg (또는 image/png, image/gif)
```

#### 파일 경로 형식
```
church_{church_id}/community_church_{timestamp}_{random_id}.{extension}
```

**예시**:
```
church_1/community_church_20251001123045_a7b3c9d2.jpg
```

#### 요청 예시 (curl)

```bash
curl -X POST \
  'https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/community-images/church_1/community_church_20251001123045_a7b3c9d2.jpg' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: image/jpeg' \
  --data-binary '@/path/to/image.jpg'
```

#### 응답 (200 OK)

```json
{
  "Key": "church_1/community_church_20251001123045_a7b3c9d2.jpg"
}
```

### 3.2 공개 URL 생성

업로드 후 공개 URL을 생성해야 합니다.

#### 공개 URL 형식
```
https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/{file_path}
```

**예시**:
```
https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/church_1/community_church_20251001123045_a7b3c9d2.jpg
```

### 3.3 이미지 업로드 제약사항

| 항목 | 제약 |
|-----|------|
| **최대 개수** | 5장 |
| **지원 형식** | JPG, PNG, GIF |
| **개별 파일 크기** | 최대 10MB |
| **전체 파일 크기** | 최대 15MB |

### 3.4 이미지 업로드 예시 코드

#### Swift (iOS)

```swift
func uploadImageToSupabase(image: UIImage, churchId: Int) async throws -> String {
    // 1. 이미지를 Data로 변환
    guard let imageData = image.jpegData(compressionQuality: 0.8) else {
        throw ImageUploadError.conversionFailed
    }

    // 2. 파일 경로 생성
    let timestamp = Int(Date().timeIntervalSince1970 * 1000)
    let randomId = UUID().uuidString.prefix(8)
    let fileName = "community_church_\(timestamp)_\(randomId).jpg"
    let filePath = "church_\(churchId)/\(fileName)"

    // 3. Supabase Storage에 업로드
    let url = URL(string: "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/community-images/\(filePath)")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
    request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
    request.httpBody = imageData

    let (_, response) = try await URLSession.shared.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw ImageUploadError.uploadFailed
    }

    // 4. 공개 URL 생성
    let publicUrl = "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/\(filePath)"
    return publicUrl
}
```

#### Kotlin (Android)

```kotlin
suspend fun uploadImageToSupabase(imageFile: File, churchId: Int): String {
    // 1. 파일 경로 생성
    val timestamp = System.currentTimeMillis()
    val randomId = UUID.randomUUID().toString().substring(0, 8)
    val fileName = "community_church_${timestamp}_${randomId}.jpg"
    val filePath = "church_${churchId}/${fileName}"

    // 2. Supabase Storage에 업로드
    val url = "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/community-images/$filePath"
    val requestBody = imageFile.asRequestBody("image/jpeg".toMediaType())

    val request = Request.Builder()
        .url(url)
        .post(requestBody)
        .addHeader("Authorization", "Bearer $supabaseAnonKey")
        .addHeader("Content-Type", "image/jpeg")
        .build()

    val response = okHttpClient.newCall(request).execute()

    if (!response.isSuccessful) {
        throw IOException("이미지 업로드 실패: ${response.code}")
    }

    // 3. 공개 URL 생성
    return "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/$filePath"
}
```

---

## 4. 물품 판매 글 작성 API

### 4.1 엔드포인트

```
POST /functions/v1/community-sharing
```

**전체 URL**:
```
https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-sharing
```

### 4.2 요청 헤더

```http
Authorization: Bearer {SUPABASE_ANON_KEY}
X-Custom-Auth: temp_token_{user_id}_{timestamp}
Content-Type: application/json
```

### 4.3 요청 본문 (Request Body)

```json
{
  "title": "중고 의자 판매",
  "description": "사용감 있지만 튼튼한 의자입니다. 필요하신 분 연락주세요.",
  "category": "furniture",
  "condition": "used",
  "quantity": 2,
  "price": 50000,
  "location": "서울 강남구",
  "contact_phone": "010-1234-5678",
  "contact_email": "user@example.com",
  "images": [
    "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/church_1/image1.jpg",
    "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/church_1/image2.jpg"
  ],
  "church_id": 1,
  "author_id": 123,
  "is_free": false,
  "status": "active"
}
```

#### 필수 필드

| 필드 | 타입 | 제약사항 | 설명 |
|-----|------|---------|------|
| `title` | string | 최대 100자 | 게시글 제목 |
| `description` | string | 최대 1000자 | 게시글 상세 설명 |
| `category` | string | 선택값 | 카테고리 (아래 표 참조) |
| `condition` | string | 선택값 | 상품 상태 (아래 표 참조) |
| `price` | number | 양수 | 판매 가격 (원) |
| `contact_phone` | string | 전화번호 형식 | 연락처 전화번호 |
| `author_id` | number | 양수 | 작성자 ID |
| `is_free` | boolean | false 고정 | 판매 여부 (물품판매는 항상 false) |

#### 선택 필드

| 필드 | 타입 | 기본값 | 설명 |
|-----|------|--------|------|
| `quantity` | number | 1 | 판매 수량 |
| `location` | string | - | 거래 희망 지역 |
| `contact_email` | string | - | 연락처 이메일 |
| `images` | string[] | [] | 이미지 URL 배열 (최대 5개) |
| `church_id` | number | 9998 | 교회 ID (없으면 9998) |
| `status` | string | "active" | 게시글 상태 |

#### 카테고리 (category) 값

| 값 | 한글명 |
|----|--------|
| `furniture` | 가구 |
| `electronics` | 전자제품 |
| `books` | 도서 |
| `clothing` | 의류 |
| `toys` | 장난감 |
| `household` | 생활용품 |
| `instruments` | 악기 |
| `other` | 기타 |

#### 상품 상태 (condition) 값

| 값 | 한글명 |
|----|--------|
| `new` | 새 상품 |
| `like_new` | 거의 새것 |
| `used` | 사용감 있음 |
| `repair_needed` | 수리 필요 |

#### 상태 (status) 값

| 값 | 한글명 |
|----|--------|
| `active` | 판매 중 |
| `reserved` | 예약됨 |
| `completed` | 판매 완료 |

### 4.4 응답 (Response)

#### 성공 (201 Created)

```json
{
  "id": 456,
  "title": "중고 의자 판매",
  "description": "사용감 있지만 튼튼한 의자입니다. 필요하신 분 연락주세요.",
  "content": "사용감 있지만 튼튼한 의자입니다. 필요하신 분 연락주세요.",
  "category": "furniture",
  "condition": "used",
  "quantity": 2,
  "price": 50000,
  "location": "서울 강남구",
  "contact_info": null,
  "images": [
    "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/church_1/image1.jpg",
    "https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/public/community-images/church_1/image2.jpg"
  ],
  "church_id": 1,
  "author_id": 123,
  "author_name": "홍길동",
  "user_name": "홍길동",
  "is_free": false,
  "status": "active",
  "view_count": 0,
  "likes": 0,
  "comments": 0,
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
  "error": "Failed to create community sharing item"
}
```

### 4.5 요청 예시 코드

#### Swift (iOS)

```swift
struct SharingOfferRequest: Codable {
    let title: String
    let description: String
    let category: String
    let condition: String
    let quantity: Int
    let price: Int
    let location: String
    let contactPhone: String
    let contactEmail: String?
    let images: [String]
    let churchId: Int
    let authorId: Int
    let isFree: Bool
    let status: String

    enum CodingKeys: String, CodingKey {
        case title, description, category, condition, quantity, price, location
        case contactPhone = "contact_phone"
        case contactEmail = "contact_email"
        case images
        case churchId = "church_id"
        case authorId = "author_id"
        case isFree = "is_free"
        case status
    }
}

func createSharingOffer(request: SharingOfferRequest) async throws -> SharingOfferResponse {
    let url = URL(string: "https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-sharing")!
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
    return try decoder.decode(SharingOfferResponse.self, from: data)
}
```

#### Kotlin (Android)

```kotlin
data class SharingOfferRequest(
    val title: String,
    val description: String,
    val category: String,
    val condition: String,
    val quantity: Int,
    val price: Int,
    val location: String,
    @SerializedName("contact_phone") val contactPhone: String,
    @SerializedName("contact_email") val contactEmail: String? = null,
    val images: List<String>,
    @SerializedName("church_id") val churchId: Int,
    @SerializedName("author_id") val authorId: Int,
    @SerializedName("is_free") val isFree: Boolean = false,
    val status: String = "active"
)

suspend fun createSharingOffer(request: SharingOfferRequest): SharingOfferResponse {
    val url = "https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-sharing"

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

    return gson.fromJson(response.body?.string(), SharingOfferResponse::class.java)
}
```

---

## 5. 물품 판매 목록 조회 API

### 5.1 엔드포인트

```
GET /functions/v1/community-sharing
```

**전체 URL**:
```
https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-sharing
```

### 5.2 Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `limit` | number | 선택 | 50 | 조회할 게시글 수 |
| `category` | string | 선택 | - | 카테고리 필터 |
| `status` | string | 선택 | - | 상태 필터 |
| `search` | string | 선택 | - | 제목/설명 검색 |

**참고**: 물품 판매만 필터링하려면 클라이언트에서 `is_free: false` 항목만 필터링해야 합니다.

### 5.3 요청 예시

```http
GET /functions/v1/community-sharing?limit=20&category=furniture&status=active
Host: adzhdsajdamrflvybhxq.supabase.co
Authorization: Bearer {SUPABASE_ANON_KEY}
X-Custom-Auth: temp_token_123_1696234567890
```

### 5.4 응답 (200 OK)

```json
[
  {
    "id": 456,
    "title": "중고 의자 판매",
    "description": "사용감 있지만 튼튼한 의자입니다.",
    "content": "사용감 있지만 튼튼한 의자입니다.",
    "category": "furniture",
    "condition": "used",
    "quantity": 2,
    "price": 50000,
    "location": "서울 강남구",
    "images": [
      "https://...image1.jpg",
      "https://...image2.jpg"
    ],
    "church_id": 1,
    "author_id": 123,
    "author_name": "홍길동",
    "user_name": "홍길동",
    "is_free": false,
    "status": "active",
    "view_count": 15,
    "likes": 3,
    "comments": 2,
    "created_at": "2025-10-01T12:34:56.789Z",
    "updated_at": "2025-10-01T12:34:56.789Z"
  }
]
```

---

## 6. 에러 처리

### 6.1 HTTP 상태 코드

| 상태 코드 | 설명 |
|----------|------|
| `200 OK` | 요청 성공 (목록 조회) |
| `201 Created` | 게시글 생성 성공 |
| `400 Bad Request` | 잘못된 요청 (필수 필드 누락, 형식 오류) |
| `401 Unauthorized` | 인증 실패 (토큰 없음, 만료, 형식 오류) |
| `405 Method Not Allowed` | 지원하지 않는 HTTP 메서드 |
| `500 Internal Server Error` | 서버 오류 |

### 6.2 에러 응답 형식

```json
{
  "error": "에러 메시지"
}
```

### 6.3 주요 에러 메시지

| 에러 메시지 | 원인 | 해결 방법 |
|-----------|------|----------|
| `Missing authentication` | Authorization 헤더 또는 X-Custom-Auth 헤더 누락 | 헤더에 토큰 추가 |
| `Invalid token structure` | 토큰 형식이 잘못됨 | `temp_token_{user_id}_{timestamp}` 형식 확인 |
| `Invalid user ID in token` | 토큰의 user_id가 잘못됨 | user_id가 양수인지 확인 |
| `Token expired` | 토큰이 24시간 초과 | 새로운 토큰 생성 |
| `Failed to create community sharing item` | 데이터베이스 삽입 실패 | 요청 본문 형식 및 필드 검증 |
| `Failed to fetch community sharing data` | 데이터베이스 조회 실패 | 네트워크 상태 확인 |

---

## 7. 테스트 정보

### 7.1 테스트 환경

- **Supabase URL**: `https://adzhdsajdamrflvybhxq.supabase.co`
- **Supabase Anon Key**: (위 문서 참조)
- **테스트 사용자 ID**: `123`
- **테스트 교회 ID**: `1`

### 7.2 Postman / Insomnia 테스트

#### 1. 이미지 업로드 테스트

**요청**:
```http
POST https://adzhdsajdamrflvybhxq.supabase.co/storage/v1/object/community-images/church_1/test_image.jpg
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: image/jpeg

[Binary Image Data]
```

**응답**:
```json
{
  "Key": "church_1/test_image.jpg"
}
```

#### 2. 물품 판매 글 작성 테스트

**요청**:
```http
POST https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-sharing
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Custom-Auth: temp_token_123_1696234567890
Content-Type: application/json

{
  "title": "테스트 물품 판매",
  "description": "테스트용 게시글입니다.",
  "category": "other",
  "condition": "used",
  "price": 30000,
  "contact_phone": "010-1234-5678",
  "author_id": 123,
  "church_id": 1,
  "is_free": false
}
```

**응답**:
```json
{
  "id": 999,
  "title": "테스트 물품 판매",
  "price": 30000,
  "is_free": false,
  ...
}
```

#### 3. 물품 판매 목록 조회 테스트

**요청**:
```http
GET https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/community-sharing?limit=5
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Custom-Auth: temp_token_123_1696234567890
```

**응답**:
```json
[
  {
    "id": 999,
    "title": "테스트 물품 판매",
    "price": 30000,
    "is_free": false,
    ...
  }
]
```

---

## 부록: 무료나눔과의 차이점

| 항목 | 무료나눔 | 물품 판매 |
|-----|---------|----------|
| `is_free` | `true` | `false` |
| `price` | 0 또는 null | 양수 (필수) |
| API 엔드포인트 | 동일 | 동일 |
| 데이터베이스 테이블 | `community_sharing` | `community_sharing` |
| 필터링 방법 | 클라이언트에서 `is_free: true` 필터 | 클라이언트에서 `is_free: false` 필터 |

---

**문서 버전**: 1.0.0
**최종 수정일**: 2025-10-01
**작성자**: 백엔드 개발팀
