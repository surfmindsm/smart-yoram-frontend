# 백엔드 수정 요청사항

## 개요
프론트엔드에서 발견된 백엔드 관련 이슈들에 대한 수정 요청입니다.

## 1. 행사팀 모집 API - 데이터베이스 스키마 오류

### 🚨 긴급도: 높음

**API 엔드포인트**: `POST /api/v1/community/music-team-recruitments`

**오류 내용**:
```sql
(psycopg2.errors.UndefinedColumn) column "views" of relation "community_music_teams" does not exist
LINE 1: ...nt_members, target_members, author_id, church_id, views, lik...
```

**문제**:
- `community_music_teams` 테이블에 다음 컬럼들이 누락되어 있음:
  - `views` (조회수)
  - `likes` (좋아요 수)
  - `applicants_count` (지원자 수)

**해결 방안 (택 1)**:

#### 방안 1: 테이블에 누락된 컬럼 추가 (권장)
```sql
ALTER TABLE community_music_teams
ADD COLUMN views INTEGER DEFAULT 0,
ADD COLUMN likes INTEGER DEFAULT 0,
ADD COLUMN applicants_count INTEGER DEFAULT 0;
```

#### 방안 2: API에서 해당 필드들 제거
- 백엔드 코드에서 INSERT 쿼리에서 `views`, `likes`, `applicants_count` 필드 제거
- 향후 필요시 별도 API로 통계 관리

**현재 상태**: 임시로 프론트엔드에서 해당 필드들을 전송하지 않도록 수정함

---

## 2. 사역자 모집 API - 사용자 정보 매핑 오류

### 🚨 긴급도: 중간

**API 엔드포인트**: `POST /api/v1/community/job-posting`

**문제**:
- 등록된 데이터에서 `church_id`가 사용자의 실제 church_id와 다름
- 사용자 실제 church_id: `6`
- 저장된 church_id: `9998`

**예상 원인**:
- JWT 토큰에서 사용자 정보 추출 시 church_id를 잘못 처리
- 또는 기본값으로 9998이 설정되어 있음

**요청사항**:
1. JWT 토큰 파싱 로직 확인
2. 사용자의 실제 church_id가 올바르게 저장되도록 수정
3. 디버깅용 로그 추가

---

## 3. 사역자 모집 API - 마감일 필드 누락

### 🚨 긴급도: 중간

**API 엔드포인트**: `GET /api/v1/community/job-posting`

**문제**:
- 등록 시 `expires_at` 필드로 마감일 전송
- 조회 시 응답에 마감일 필드가 포함되지 않음

**현재 응답에 없는 필드**:
```json
{
  "expires_at": "2025-09-20T23:59:59Z"  // 또는 "deadline"
}
```

**요청사항**:
1. `GET /api/v1/community/job-posting` 응답에 `expires_at` 필드 추가
2. 날짜 형식: ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)

---

## 4. 공통 - API 응답 일관성 개선

### 🚨 긴급도: 낮음

**문제**:
- 일부 API는 `{ success: true, data: [...] }` 형태
- 일부 API는 직접 배열 반환
- 오류 응답 형식이 일관되지 않음

**요청사항**:
모든 커뮤니티 API 응답을 다음 형식으로 통일:

**성공 응답**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 55,
    "per_page": 20
  }
}
```

**오류 응답**:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "상세 오류 메시지",
  "details": {
    "field": "title",
    "code": "REQUIRED"
  }
}
```

---

## 5. 교회명 처리 개선

### 🚨 긴급도: 낮음

**현재 상황**:
- 프론트엔드에서 등록 폼의 교회명 입력 필드 제거함
- 사용자의 `church_id`를 기반으로 백엔드에서 자동 처리하도록 변경

**요청사항**:
1. 모든 커뮤니티 등록 API에서 사용자의 `church_id`를 기반으로 교회명 자동 설정
2. `church_id: 9998`인 경우 "협력사" 또는 null로 처리
3. 등록 API에서 `company`, `church_name` 필드 무시하고 JWT에서 추출한 church_id 사용

---

## 검증 방법

각 수정사항 완료 후 다음과 같이 테스트해주세요:

### 1. 행사팀 모집 등록 테스트
```bash
curl -X POST /api/v1/community/music-team-recruitments \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "테스트 모집",
    "team_name": "테스트팀",
    "team_type": "주일예배"
  }'
```

### 2. 사역자 모집 church_id 확인
```bash
curl -X POST /api/v1/community/job-posting \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title": "테스트", "position": "목사"}'

# 응답에서 church_id가 사용자의 실제 church_id와 일치하는지 확인
```

### 3. 마감일 필드 확인
```bash
curl -X GET /api/v1/community/job-posting \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 응답에 expires_at 또는 deadline 필드가 포함되는지 확인
```

---

## 6. 행사팀 지원 API - 데이터베이스 스키마 오류 (신규 추가)

### 🚨 긴급도: 최우선

**API 엔드포인트**: `POST /api/v1/music-team-seekers` (또는 유사한 경로)

**오류 내용**:
```
지원서 등록 중 오류가 발생했습니다: (psycopg2.errors.UndefinedColumn)
```

**현재 전송 중인 데이터**:
```json
{
  "title": "지원 제목",
  "team_name": "팀명",
  "instrument": "워십팀",
  "experience": null,
  "portfolio": null,
  "preferred_location": "[]",
  "available_days": "[\"월요일\",\"수요일\"]",
  "available_time": "오후 (13:00-18:00)",
  "contact_phone": "010-1234-5678",
  "contact_email": null
}
```

**요청사항**:
1. 음악팀 지원 테이블의 정확한 컬럼명과 데이터 타입 확인
2. 누락된 컬럼 추가 또는 불필요한 필드 제거
3. 배열 필드 처리 방식 확인 (JSON vs TEXT[] vs VARCHAR)

**현재 상태**: 행사팀 지원 등록이 완전 차단됨 (DB INSERT 실패)

---

## 7. church_id 9998 교회명 처리 개선

### 🚨 긴급도: 중간

**문제**:
- `church_id: 9998` 사용자의 경우 `church_name: '스마트요람 커뮤니티'`가 반환됨
- 프론트엔드에서 이를 "협력사"로 표시해야 함

**현재 임시 처리**:
```javascript
// 프론트엔드에서 강제 변환 중
const churchName = (item.church_id === 9998 || item.church_name === '스마트요람 커뮤니티')
  ? null : (item.church_name || item.church || getChurchNameById(item.church_id));
```

**요청사항**:
`church_id: 9998`인 경우 모든 API에서 `church_name: null`로 반환해주세요.

---

## 업데이트된 우선순위

1. **🚨 최우선**: 행사팀 지원 데이터베이스 스키마 오류 (서비스 완전 중단)
2. **🚨 최우선**: 행사팀 모집 데이터베이스 스키마 오류 (해결됨 ✅)
3. **2순위**: 사역자 모집 church_id 오류 (데이터 정합성 문제)
4. **2순위**: church_id 9998 교회명 처리 개선
5. **3순위**: 마감일 필드 누락 (기능 부분 동작 안함)
6. **4순위**: API 응답 일관성 개선 (개발자 경험)

---

## 완료된 수정사항

✅ **행사팀 모집 스키마 오류**: `views`, `likes`, `applicants_count` 컬럼 추가 완료 (2025-09-15)

---

**문의사항이 있으시면 언제든지 연락주세요.**

작성일: 2025-09-15 (최종 업데이트)
작성자: 프론트엔드 팀