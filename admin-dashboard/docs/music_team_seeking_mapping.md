# 행사팀 지원(Music Team Seeking) API 매핑 문서

## 개요

교회 행사팀(연주팀, 찬양팀 등) 지원 시스템 API가 **이미 구현되어 있습니다**.  
프론트엔드에서 백엔드 API에 매핑하여 사용하면 됩니다.

**✅ 백엔드 구현 완료**: `docs/music_team_seekers.py` 파일 참조

---

## API 엔드포인트 매핑

### 🔍 1. 지원서 목록 조회

**Frontend → Backend 매핑:**
```typescript
// Frontend: communityService.getMusicSeekers()
// Backend: GET /api/v1/music-team-seekers
```

**Query Parameters 매핑:**
| Frontend | Backend | 설명 |
|----------|---------|------|
| `page` | `page` | 페이지 번호 |
| `limit` | `limit` | 페이지당 항목 수 |
| `status` | `status` | 상태 필터 |
| `instrument` | `instrument` | 팀 형태 필터 |
| `location` | `location` | 지역 필터 |
| `day` | `day` | 요일 필터 |
| `time` | `time` | 시간대 필터 |
| `search` | `search` | 제목/경력 검색 |

**Response 구조:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### 🎯 2. 지원서 상세 조회

**Frontend → Backend 매핑:**
```typescript
// Frontend: communityService.getMusicSeekerById(id)
// Backend: GET /api/v1/music-team-seekers/{seeker_id}
```

**특이사항:**
- 조회 시 `views` 카운트 자동 증가
- 모든 필드 반환 (연락처 포함)

### ✍️ 3. 지원서 등록

**Frontend → Backend 매핑:**
```typescript
// Frontend: communityService.createMusicSeeker(data)
// Backend: POST /api/v1/music-team-seekers
```

**Request Body 필드 매핑:**
| Frontend Field | Backend Field | 필수 여부 | 타입 |
|----------------|---------------|-----------|------|
| `title` | `title` | ✅ | string |
| `teamName` | `team_name` | ❌ | string |
| `instrument` | `instrument` | ✅ | string |
| `experience` | `experience` | ❌ | string |
| `portfolio` | `portfolio` | ❌ | string |
| `preferredLocation` | `preferred_location` | ❌ | string[] |
| `availableDays` | `available_days` | ❌ | string[] |
| `availableTime` | `available_time` | ❌ | string |
| `contactPhone` | `contact_phone` | ✅ | string |
| `contactEmail` | `contact_email` | ❌ | string |

**자동 설정 필드 (JWT에서 추출):**
- `author_id`: 현재 사용자 ID
- `author_name`: 현재 사용자 이름 (`current_user.full_name`)
- `church_id`: 사용자 소속 교회 ID
- `church_name`: 사용자 소속 교회명
- `status`: 기본값 "available"

### ✏️ 4. 지원서 수정

**Frontend → Backend 매핑:**
```typescript
// Frontend: communityService.updateMusicSeeker(id, data)
// Backend: PUT /api/v1/music-team-seekers/{seeker_id}
```

**권한 검증:**
- `seeker.author_id == current_user.id` 확인
- 본인 작성 지원서만 수정 가능

### 🗑️ 5. 지원서 삭제

**Frontend → Backend 매핑:**
```typescript
// Frontend: communityService.deleteMusicSeeker(id)
// Backend: DELETE /api/v1/music-team-seekers/{seeker_id}
```

**권한 검증:**
- `seeker.author_id == current_user.id` 확인
- 본인 작성 지원서만 삭제 가능

---

## 데이터 변환 (snake_case ↔ camelCase)

### Backend → Frontend 변환
```typescript
// communityService.ts에서 구현 필요
const transformMusicSeeker = (backendData: any): MusicSeeker => {
  return {
    id: backendData.id,
    title: backendData.title,
    name: backendData.author_name,
    teamName: backendData.team_name,
    instrument: backendData.instrument,
    experience: backendData.experience,
    portfolio: backendData.portfolio,
    preferredLocation: backendData.preferred_location || [],
    availableDays: backendData.available_days || [],
    availableTime: backendData.available_time,
    contactPhone: backendData.contact_phone,
    contactEmail: backendData.contact_email,
    status: backendData.status,
    authorName: backendData.author_name,
    churchName: backendData.church_name,
    views: backendData.views || 0,
    likes: backendData.likes || 0,
    matches: backendData.matches || 0,
    applications: backendData.applications || 0,
    createdAt: backendData.created_at || '',
    userName: backendData.author_name
  };
};
```

### Frontend → Backend 변환
```typescript
// 등록/수정 시 사용
const transformToBackend = (frontendData: any) => {
  return {
    title: frontendData.title,
    team_name: frontendData.teamName,
    instrument: frontendData.instrument,
    experience: frontendData.experience,
    portfolio: frontendData.portfolio,
    preferred_location: frontendData.preferredLocation,
    available_days: frontendData.availableDays,
    available_time: frontendData.availableTime,
    contact_phone: frontendData.contactPhone,
    contact_email: frontendData.contactEmail
  };
};
```

---

## 필수 구현사항

### 1. communityService.ts 업데이트

```typescript
// 추가 구현 필요한 메서드들
export const communityService = {
  // 기존 메서드들...

  // 음악팀 지원자 관련 메서드 추가
  async getMusicSeekers(params?: MusicSeekerQueryParams): Promise<MusicSeeker[]> {
    // GET /api/v1/music-team-seekers 호출
  },

  async getMusicSeekerById(id: number): Promise<MusicSeeker> {
    // GET /api/v1/music-team-seekers/{id} 호출
  },

  async createMusicSeeker(data: CreateMusicSeekerData): Promise<any> {
    // POST /api/v1/music-team-seekers 호출
  },

  async updateMusicSeeker(id: number, data: UpdateMusicSeekerData): Promise<any> {
    // PUT /api/v1/music-team-seekers/{id} 호출
  },

  async deleteMusicSeeker(id: number): Promise<any> {
    // DELETE /api/v1/music-team-seekers/{id} 호출
  }
};
```

### 2. MusicSeeker 인터페이스 업데이트

```typescript
export interface MusicSeeker {
  id: number;
  title: string;
  name: string;                    // author_name 매핑
  teamName?: string;               // team_name 매핑
  instrument: string;              // 팀 형태
  experience?: string;
  portfolio?: string;
  preferredLocation: string[];     // 배열 타입
  availableDays: string[];         // 새로 추가된 필드
  availableTime?: string;          // 새로 추가된 필드
  contactPhone: string;
  contactEmail?: string;
  status: 'available' | 'interviewing' | 'inactive';
  authorName?: string;             // author_name
  churchName?: string;             // church_name
  views: number;
  likes: number;
  matches: number;
  applications: number;
  createdAt: string;
  userName?: string;               // 호환성을 위해 유지
}
```

---

## 구현 우선순위

### ✅ Phase 1: 기본 CRUD 연동
1. `communityService.ts`에 Music Team Seeker 메서드 추가
2. 데이터 변환 로직 구현
3. 기존 컴포넌트들과 API 연결

### ✅ Phase 2: 필터링 및 검색
1. 목록 조회 시 쿼리 파라미터 전달
2. 요일/시간대 필터링 UI 연동
3. 검색 기능 구현

### ✅ Phase 3: 상세 기능
1. 조회수 증가 확인
2. 권한 검증 처리
3. 에러 핸들링 개선

---

## 테스트 방법

1. **백엔드 서버 실행 확인**: `http://localhost:8000`
2. **API 문서 확인**: FastAPI Swagger UI에서 엔드포인트 테스트
3. **프론트엔드 연동**: 개발자 도구에서 네트워크 탭으로 API 호출 확인

---

## 주의사항

### 🔐 인증
- 모든 API 호출 시 JWT 토큰 필요
- 작성자 정보는 JWT에서 자동 추출

### 📅 날짜 처리
- 백엔드에서 `created_at`이 `null`일 수 있음
- 프론트엔드에서 "등록일 없음" 텍스트로 처리

### 🔄 배열 필드
- `preferred_location`, `available_days`는 배열 타입
- 빈 배열 `[]`을 기본값으로 처리

### 🆔 필드 매핑
- `author_name` → `name` (화면 표시용)
- `team_name` → `teamName` (camelCase 변환)
- `available_days`/`available_time` (새로 추가된 필드들)

이제 `communityService.ts`에 위 메서드들을 구현하면 바로 사용할 수 있습니다!