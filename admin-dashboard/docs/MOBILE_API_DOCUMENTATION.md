# 교회 통합 관리 시스템 - 모바일 API 문서
## Mobile Application API Documentation

**버전**: 1.0.0
**최종 수정일**: 2025-09-30
**Base URL**: `https://api.smart-yoram.com`
**Supabase URL**: `https://your-project.supabase.co`

---

## 목차
1. [인증 (Authentication)](#1-인증-authentication)
2. [교인 관리 (Member Management)](#2-교인-관리-member-management)
3. [출석 관리 (Attendance)](#3-출석-관리-attendance)
4. [헌금 관리 (Offerings)](#4-헌금-관리-offerings)
5. [커뮤니티 (Community)](#5-커뮤니티-community)
6. [교회 행사 (Church Events)](#6-교회-행사-church-events)
7. [알림 (Notifications)](#7-알림-notifications)
8. [파일 업로드 (File Upload)](#8-파일-업로드-file-upload)

---

## 공통 사항

### Headers
모든 API 요청에는 다음 헤더가 필요합니다:

```http
Content-Type: application/json
Authorization: Bearer {access_token}
X-Church-ID: {church_id}
X-App-Version: {app_version}
X-Platform: ios|android
```

### Response Format
모든 응답은 다음 형식을 따릅니다:

**성공 응답**
```json
{
  "success": true,
  "data": {
    // 응답 데이터
  },
  "message": "Success message",
  "timestamp": "2025-09-30T10:00:00Z"
}
```

**에러 응답**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message in Korean",
    "details": {}
  },
  "timestamp": "2025-09-30T10:00:00Z"
}
```

### Error Codes
| 코드 | 설명 | HTTP Status |
|------|------|-------------|
| AUTH_FAILED | 인증 실패 | 401 |
| PERMISSION_DENIED | 권한 없음 | 403 |
| NOT_FOUND | 리소스를 찾을 수 없음 | 404 |
| VALIDATION_ERROR | 유효성 검사 실패 | 400 |
| SERVER_ERROR | 서버 내부 오류 | 500 |
| RATE_LIMIT_EXCEEDED | 요청 한도 초과 | 429 |

---

## 1. 인증 (Authentication)

### 1.1 로그인
교인 계정으로 로그인합니다.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "member@church.com",
  "password": "password123",
  "device_token": "fcm_token_for_push_notification"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600,
    "user": {
      "id": 123,
      "email": "member@church.com",
      "name": "김교인",
      "church_id": 7,
      "church_name": "스마트요람교회",
      "role": "member",
      "profile_image": "https://storage.supabase.co/..."
    }
  }
}
```

### 1.2 소셜 로그인
카카오, 네이버, 구글 계정으로 로그인합니다.

**Endpoint:** `POST /api/v1/auth/social`

**Request Body:**
```json
{
  "provider": "kakao|naver|google",
  "access_token": "social_provider_token",
  "device_token": "fcm_token"
}
```

### 1.3 로그아웃
현재 세션을 종료합니다.

**Endpoint:** `POST /api/v1/auth/logout`

**Headers Required:** `Authorization: Bearer {token}`

### 1.4 토큰 갱신
만료된 액세스 토큰을 갱신합니다.

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 1.5 비밀번호 재설정
이메일로 비밀번호 재설정 링크를 발송합니다.

**Endpoint:** `POST /api/v1/auth/reset-password`

**Request Body:**
```json
{
  "email": "member@church.com"
}
```

---

## 2. 교인 관리 (Member Management)

### 2.1 내 정보 조회
현재 로그인한 교인의 정보를 조회합니다.

**Endpoint:** `GET /api/v1/members/me`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "김교인",
    "email": "member@church.com",
    "phone": "010-1234-5678",
    "address": "서울시 강남구",
    "birth_date": "1990-01-01",
    "gender": "M",
    "church_id": 7,
    "church_name": "스마트요람교회",
    "registration_date": "2020-01-01",
    "baptism_date": "2021-01-01",
    "position": "집사",
    "department": ["청년부", "찬양팀"],
    "district": "강남1구역",
    "family_members": [
      {
        "id": 124,
        "name": "김배우자",
        "relationship": "배우자"
      }
    ],
    "profile_image": "https://storage.supabase.co/...",
    "qr_code": "data:image/png;base64,..."
  }
}
```

### 2.2 내 정보 수정
교인 본인의 정보를 수정합니다.

**Endpoint:** `PUT /api/v1/members/me`

**Request Body:**
```json
{
  "phone": "010-9876-5432",
  "address": "서울시 서초구",
  "profile_image": "base64_encoded_image"
}
```

### 2.3 교인 검색
교회 내 다른 교인을 검색합니다 (권한에 따라 제한).

**Endpoint:** `GET /api/v1/members/search`

**Query Parameters:**
- `q`: 검색어 (이름, 전화번호)
- `district`: 구역 필터
- `department`: 부서 필터
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 결과 수 (기본값: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 125,
        "name": "이교인",
        "phone": "010-****-5678",
        "district": "강남2구역",
        "profile_image": "https://..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

### 2.4 가족 구성원 등록
가족 관계를 등록합니다.

**Endpoint:** `POST /api/v1/members/family`

**Request Body:**
```json
{
  "member_id": 124,
  "relationship": "배우자|자녀|부모|형제"
}
```

---

## 3. 출석 관리 (Attendance)

### 3.1 QR 체크인
QR 코드를 스캔하여 출석을 체크합니다.

**Endpoint:** `POST /api/v1/attendance/checkin`

**Request Body:**
```json
{
  "qr_data": "encrypted_qr_string",
  "service_type": "주일예배|수요예배|새벽예배|특별예배",
  "location": {
    "latitude": 37.123456,
    "longitude": 127.123456
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attendance_id": 789,
    "member_name": "김교인",
    "service_type": "주일예배",
    "check_in_time": "2025-09-30T09:30:00Z",
    "message": "출석이 완료되었습니다!"
  }
}
```

### 3.2 내 출석 기록
본인의 출석 기록을 조회합니다.

**Endpoint:** `GET /api/v1/attendance/my-history`

**Query Parameters:**
- `start_date`: 시작일 (YYYY-MM-DD)
- `end_date`: 종료일 (YYYY-MM-DD)
- `service_type`: 예배 유형 필터

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_services": 52,
      "attended": 48,
      "attendance_rate": 92.3,
      "consecutive_weeks": 12
    },
    "records": [
      {
        "id": 789,
        "date": "2025-09-30",
        "service_type": "주일예배",
        "check_in_time": "09:30:00",
        "status": "present"
      }
    ]
  }
}
```

### 3.3 온라인 예배 출석
온라인 예배 시청을 출석으로 기록합니다.

**Endpoint:** `POST /api/v1/attendance/online`

**Request Body:**
```json
{
  "service_id": "sunday_20250930",
  "watch_duration": 3600,
  "platform": "youtube|zoom"
}
```

---

## 4. 헌금 관리 (Offerings)

### 4.1 내 헌금 기록
본인의 헌금 기록을 조회합니다.

**Endpoint:** `GET /api/v1/offerings/my-records`

**Query Parameters:**
- `year`: 연도 (기본값: 현재 연도)
- `month`: 월 (선택)
- `fund_type`: 헌금 종류

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "year": 2025,
      "total_amount": 1200000,
      "by_type": {
        "십일조": 1000000,
        "감사헌금": 100000,
        "선교헌금": 100000
      }
    },
    "records": [
      {
        "id": 456,
        "date": "2025-09-30",
        "fund_type": "십일조",
        "amount": 100000,
        "note": "9월 십일조"
      }
    ]
  }
}
```

### 4.2 기부금 영수증 요청
연말정산용 기부금 영수증을 요청합니다.

**Endpoint:** `POST /api/v1/offerings/receipt-request`

**Request Body:**
```json
{
  "year": 2024,
  "personal_info": {
    "name": "김교인",
    "resident_number": "900101-1",
    "address": "서울시 강남구"
  },
  "delivery_method": "email|sms|print"
}
```

### 4.3 온라인 헌금
온라인으로 헌금을 합니다 (결제 연동).

**Endpoint:** `POST /api/v1/offerings/online`

**Request Body:**
```json
{
  "fund_type": "십일조|감사헌금|선교헌금|건축헌금",
  "amount": 100000,
  "payment_method": "card|bank_transfer|kakao_pay",
  "note": "감사합니다"
}
```

---

## 5. 커뮤니티 (Community)

### 5.1 나눔 물품 목록
무료나눔 및 중고판매 물품을 조회합니다.

**Endpoint:** `GET /api/v1/community/sharing`

**Query Parameters:**
- `is_free`: true(무료나눔) | false(판매)
- `category`: 카테고리 필터
- `status`: available|reserved|completed
- `search`: 검색어
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 101,
        "title": "아기 옷 나눔합니다",
        "description": "깨끗한 아기옷입니다",
        "category": "의류",
        "is_free": true,
        "price": 0,
        "status": "available",
        "images": ["https://..."],
        "author": {
          "id": 123,
          "name": "김교인",
          "district": "강남1구역"
        },
        "created_at": "2025-09-30T10:00:00Z",
        "view_count": 45,
        "interested_count": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

### 5.2 물품 등록
나눔이나 판매할 물품을 등록합니다.

**Endpoint:** `POST /api/v1/community/sharing`

**Request Body (multipart/form-data):**
```json
{
  "title": "아기 옷 나눔합니다",
  "description": "6개월~12개월 아기옷 10벌입니다",
  "category": "의류",
  "is_free": true,
  "price": 0,
  "images": ["image_file_1", "image_file_2"],
  "contact_info": "010-1234-5678",
  "location": "강남구 역삼동"
}
```

### 5.3 관심 표시
물품에 관심을 표시합니다.

**Endpoint:** `POST /api/v1/community/sharing/{item_id}/interest`

### 5.4 댓글 작성
물품에 댓글을 작성합니다.

**Endpoint:** `POST /api/v1/community/sharing/{item_id}/comments`

**Request Body:**
```json
{
  "content": "아직 있나요? 관심있습니다.",
  "is_private": false
}
```

### 5.5 물품 요청 등록
필요한 물품을 요청합니다.

**Endpoint:** `POST /api/v1/community/requests`

**Request Body:**
```json
{
  "title": "유모차 구합니다",
  "description": "신생아용 유모차를 찾고 있습니다",
  "category": "육아용품",
  "urgency": "high|medium|low",
  "budget": 50000
}
```

---

## 6. 교회 행사 (Church Events)

### 6.1 행사 목록
교회 행사 목록을 조회합니다.

**Endpoint:** `GET /api/v1/events`

**Query Parameters:**
- `start_date`: 시작일
- `end_date`: 종료일
- `category`: 행사 카테고리
- `status`: upcoming|ongoing|completed

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 201,
        "title": "가을 수련회",
        "description": "2025년 가을 수련회",
        "category": "수련회",
        "start_date": "2025-10-15",
        "end_date": "2025-10-17",
        "location": "강원도 평창",
        "max_participants": 100,
        "current_participants": 45,
        "registration_deadline": "2025-10-10",
        "fee": 50000,
        "image": "https://...",
        "is_registered": false
      }
    ]
  }
}
```

### 6.2 행사 상세
특정 행사의 상세 정보를 조회합니다.

**Endpoint:** `GET /api/v1/events/{event_id}`

### 6.3 행사 참가 신청
행사에 참가 신청을 합니다.

**Endpoint:** `POST /api/v1/events/{event_id}/register`

**Request Body:**
```json
{
  "participants": [
    {
      "member_id": 123,
      "name": "김교인"
    },
    {
      "member_id": 124,
      "name": "김배우자"
    }
  ],
  "notes": "채식주의자 1명 포함"
}
```

### 6.4 참가 취소
행사 참가를 취소합니다.

**Endpoint:** `DELETE /api/v1/events/{event_id}/register`

---

## 7. 알림 (Notifications)

### 7.1 알림 목록
사용자의 알림 목록을 조회합니다.

**Endpoint:** `GET /api/v1/notifications`

**Query Parameters:**
- `status`: unread|read|all
- `type`: 알림 유형 필터
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 301,
        "type": "event|community|announcement",
        "title": "가을 수련회 신청 마감 임박",
        "message": "수련회 신청이 3일 후 마감됩니다",
        "data": {
          "event_id": 201,
          "action": "register"
        },
        "is_read": false,
        "created_at": "2025-09-30T10:00:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

### 7.2 알림 읽음 처리
알림을 읽음으로 표시합니다.

**Endpoint:** `PUT /api/v1/notifications/{notification_id}/read`

### 7.3 알림 설정
푸시 알림 설정을 관리합니다.

**Endpoint:** `PUT /api/v1/notifications/settings`

**Request Body:**
```json
{
  "push_enabled": true,
  "types": {
    "worship": true,
    "events": true,
    "community": true,
    "announcement": true,
    "offerings": false
  },
  "quiet_hours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}
```

---

## 8. 파일 업로드 (File Upload)

### 8.1 이미지 업로드
프로필 사진, 물품 사진 등을 업로드합니다.

**Endpoint:** `POST /api/v1/upload/image`

**Request Body (multipart/form-data):**
- `file`: 이미지 파일 (최대 5MB)
- `type`: profile|community|event
- `resize`: true|false (자동 리사이즈 여부)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.supabase.co/v1/object/public/...",
    "thumbnail": "https://storage.supabase.co/v1/object/public/...",
    "size": 1234567,
    "mime_type": "image/jpeg",
    "width": 1920,
    "height": 1080
  }
}
```

### 8.2 문서 업로드
문서 파일을 업로드합니다.

**Endpoint:** `POST /api/v1/upload/document`

**Request Body (multipart/form-data):**
- `file`: 문서 파일 (PDF, DOC, XLSX 등, 최대 10MB)
- `type`: receipt|report|etc

---

## 웹소켓 이벤트 (WebSocket Events)

### 연결
```javascript
const ws = new WebSocket('wss://api.smart-yoram.com/ws');
ws.send(JSON.stringify({
  type: 'auth',
  token: 'Bearer {access_token}'
}));
```

### 실시간 이벤트
```javascript
// 새 알림
{
  "type": "notification",
  "data": {
    "id": 302,
    "title": "새 공지사항",
    "message": "내일 청년부 모임이 있습니다"
  }
}

// 출석 체크 알림
{
  "type": "attendance",
  "data": {
    "member_name": "김교인",
    "service_type": "주일예배",
    "check_in_time": "09:30:00"
  }
}

// 커뮤니티 업데이트
{
  "type": "community",
  "data": {
    "action": "new_item",
    "item_id": 102,
    "title": "새로운 나눔 물품이 등록되었습니다"
  }
}
```

---

## Rate Limiting

API 요청 제한:
- 일반 API: 분당 60회
- 인증 API: 분당 10회
- 파일 업로드: 시간당 100회

헤더에서 확인:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1696075200
```

---

## 에러 처리 가이드

### 네트워크 에러
```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
} catch (error) {
  if (error.message.includes('NetworkError')) {
    // 네트워크 연결 확인
    showOfflineMessage();
  }
}
```

### 토큰 만료
```javascript
if (response.status === 401) {
  // 리프레시 토큰으로 갱신 시도
  const newToken = await refreshAccessToken();
  // 원래 요청 재시도
  return retryRequest(originalRequest, newToken);
}
```

### 재시도 로직
```javascript
async function requestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status < 500) break; // 4xx 에러는 재시도하지 않음
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await wait(Math.pow(2, i) * 1000); // 지수 백오프
    }
  }
}
```

---

## SDK 예제

### React Native
```javascript
import { ChurchAPI } from '@smart-yoram/mobile-sdk';

const api = new ChurchAPI({
  baseURL: 'https://api.smart-yoram.com',
  timeout: 10000
});

// 로그인
const { user, token } = await api.auth.login({
  email: 'member@church.com',
  password: 'password123'
});

// 출석 체크
await api.attendance.checkIn({
  qrData: scannedQR,
  serviceType: '주일예배'
});

// 나눔 물품 조회
const items = await api.community.getSharing({
  isFree: true,
  page: 1
});
```

### Flutter
```dart
import 'package:smart_yoram/api.dart';

final api = ChurchAPI(
  baseUrl: 'https://api.smart-yoram.com',
);

// 로그인
final response = await api.auth.login(
  email: 'member@church.com',
  password: 'password123',
);

// 내 정보 조회
final myInfo = await api.members.getMyInfo();

// 알림 수신
api.notifications.onNewNotification.listen((notification) {
  showNotification(notification);
});
```

---

## 변경 로그

### v1.0.0 (2025-09-30)
- 초기 API 문서 작성
- 인증, 교인관리, 출석, 헌금, 커뮤니티 API 정의
- WebSocket 실시간 이벤트 추가
- Rate Limiting 정책 수립

---

## 문의 및 지원

**API 문의**: api@smart-yoram.com
**기술 지원**: support@smart-yoram.com
**긴급 연락처**: 010-0000-0000

**개발자 포털**: https://developers.smart-yoram.com
**API Status**: https://status.smart-yoram.com