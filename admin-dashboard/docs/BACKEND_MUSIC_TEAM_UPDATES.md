# 행사팀 모집 시스템 백엔드 업데이트 요청서

## 개요
행사팀 모집 등록 시스템에서 "모집 악기/포지션" 필드를 "모집 팀 형태"로 변경하여, 보다 포괄적인 팀 유형 관리가 가능하도록 백엔드 API와 데이터베이스 스키마 업데이트가 필요합니다.

## 변경 사항

### 1. 프론트엔드 변경 완료 (2025-09-17)
- `CreateMusicTeamRecruit.tsx` 컴포넌트 업데이트
- `instruments` 필드 → `teamTypes` 필드로 변경
- 새로운 팀 형태 옵션 적용

### 2. 백엔드 API 변경 필요

#### 2.1 데이터베이스 스키마 변경
**테이블**: `music_team_recruitments` (또는 해당하는 행사팀 모집 테이블)

**변경 사항**:
```sql
-- 기존 컬럼명 변경 (만약 instruments 컬럼이 있다면)
ALTER TABLE music_team_recruitments
RENAME COLUMN instruments TO team_types;

-- 또는 새로운 컬럼 추가 후 기존 컬럼 제거
ALTER TABLE music_team_recruitments
ADD COLUMN team_types TEXT[];

-- 기존 데이터 마이그레이션 (필요시)
UPDATE music_team_recruitments
SET team_types = instruments
WHERE instruments IS NOT NULL;

-- 기존 컬럼 제거 (데이터 마이그레이션 완료 후)
-- ALTER TABLE music_team_recruitments DROP COLUMN instruments;
```

#### 2.2 API 엔드포인트 업데이트

**행사팀 모집 생성 엔드포인트**: `POST /api/v1/community/music-team-recruit`

**요청 본문 변경**:
```json
{
  "title": "주일예배 찬양팀 모집",
  "eventType": "주일예배",
  "teamTypes": ["찬양팀", "워십팀"],  // ← instruments에서 변경
  "schedule": "행사일: 2025-09-21, 리허설: 매주 토요일 오후 2시",
  "location": "서울시 강남구",
  "description": "주일예배를 위한 찬양팀을 모집합니다",
  "requirements": "3년 이상 연주 경험, 악보 시창 가능",
  "compensation": "회당 5만원",
  "contactPhone": "010-1234-5678",
  "contactEmail": "example@email.com",
  "status": "open",
  "applications": 0
}
```

**행사팀 모집 목록 조회 엔드포인트**: `GET /api/v1/community/music-team-recruit`

**쿼리 파라미터 변경**:
```
GET /api/v1/community/music-team-recruit?teamTypes=찬양팀&search=워십&limit=20
```
- `instruments` 파라미터 → `teamTypes` 파라미터로 변경

#### 2.3 응답 데이터 형식 변경
**엔드포인트**: `GET /api/v1/community/music-team-recruit`

**응답 본문 변경**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "주일예배 찬양팀 모집",
      "eventType": "주일예배",
      "teamTypes": ["찬양팀", "워십팀"],  // ← instruments에서 변경
      "schedule": "행사일: 2025-09-21, 리허설: 매주 토요일 오후 2시",
      "location": "서울시 강남구",
      "description": "주일예배를 위한 찬양팀을 모집합니다",
      "requirements": "3년 이상 연주 경험, 악보 시창 가능",
      "compensation": "회당 5만원",
      "contactPhone": "010-1234-5678",
      "contactEmail": "example@email.com",
      "status": "open",
      "applications": 2,
      "created_at": "2025-09-17T10:30:00Z",
      "updated_at": "2025-09-17T10:30:00Z",
      "author_id": 54,
      "church_id": 9998
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_count": 1,
    "per_page": 50,
    "has_next": false,
    "has_prev": false
  }
}
```

### 3. 팀 형태 옵션 정의

**표준 팀 형태 목록**:
- `현재 솔로 활동` - 개인 연주자/가수
- `찬양팀` - 일반적인 교회 찬양팀
- `워십팀` - 현대적인 워십 스타일 팀
- `어쿠스틱 팀` - 어쿠스틱 악기 중심 팀
- `밴드` - 일렉트릭 악기 포함 밴드
- `오케스트라` - 클래식 오케스트라
- `합창단` - 보컬 중심 합창단
- `무용팀` - 찬양 무용팀
- `기타` - 기타 유형

### 4. 필터링 및 검색 업데이트

#### 4.1 필터링 파라미터 변경

**행사팀 모집 목록 API**: `GET /api/v1/community/music-team-recruit`
**쿼리 파라미터**:
```
GET /api/v1/community/music-team-recruit?teamTypes=찬양팀&status=open&limit=20
```

- `instruments` 파라미터 → `teamTypes` 파라미터로 변경
- 배열 형태의 `team_types` 컬럼에서 특정 팀 형태를 포함하는 게시글 필터링

**행사팀 지원 목록 API**: `GET /api/v1/community/music-team-seeking`
**쿼리 파라미터**:
```
GET /api/v1/community/music-team-seeking?teamType=찬양팀&status=available&limit=20
```

- `instrument` 파라미터 → `teamType` 파라미터로 변경 (단일 값)

#### 4.2 검색 로직 업데이트
```sql
-- PostgreSQL 예시
SELECT * FROM music_team_recruitments
WHERE
  (teamType IS NULL OR teamType = ANY(team_types)) AND
  (status IS NULL OR status = $status) AND
  (search IS NULL OR title ILIKE '%' || $search || '%' OR description ILIKE '%' || $search || '%')
ORDER BY created_at DESC
LIMIT $limit OFFSET $offset;
```

### 5. 마이그레이션 계획

#### 5.1 데이터 마이그레이션
1. **기존 데이터 백업**
2. **새 컬럼 추가**: `team_types` (TEXT[] 타입)
3. **데이터 변환**: 기존 `instruments` 데이터를 `team_types`로 매핑
4. **검증**: 데이터 무결성 확인
5. **구 컬럼 제거**: `instruments` 컬럼 삭제 (선택사항)

#### 5.2 매핑 규칙 (필요시)
```javascript
// 기존 악기 → 새 팀 형태 매핑 예시
const instrumentToTeamTypeMapping = {
  '피아노': '찬양팀',
  '키보드': '워십팀',
  '기타': '밴드',
  '일렉기타': '밴드',
  '드럼': '밴드',
  '바이올린': '오케스트라',
  '보컬': '합창단',
  '무용': '무용팀'
  // ... 기타 매핑
};
```

#### 5.3 롤백 계획
- 스키마 변경 전 전체 데이터베이스 백업
- 프론트엔드 배포 전 백엔드 API 배포 및 테스트
- 문제 발생시 즉시 이전 버전으로 롤백 가능하도록 준비

### 6. 테스트 요구사항

#### 6.1 API 테스트
- [ ] 행사팀 모집 생성 API 테스트 (`teamTypes` 필드)
- [ ] 행사팀 모집 목록 조회 API 테스트
- [ ] 팀 형태별 필터링 테스트
- [ ] 검색 기능 테스트

#### 6.2 데이터 무결성 테스트
- [ ] 기존 데이터 마이그레이션 검증
- [ ] 새로운 데이터 입력/조회 검증
- [ ] 배열 타입 데이터 처리 검증

### 7. 배포 순서

1. **백엔드 API 업데이트** (기존 `instruments` 필드 호환성 유지)
2. **데이터베이스 마이그레이션 실행**
3. **백엔드 API 완전 전환** (`teamTypes` 필드만 사용)
4. **프론트엔드 배포** (이미 완료)
5. **구버전 호환성 코드 제거** (1주일 후)

### 8. 영향 분석

#### 8.1 기존 기능에 미치는 영향
- **행사팀 모집 등록**: 필드명 변경으로 인한 API 스키마 변경
- **행사팀 모집 목록**: 필터링 로직 변경
- **검색 기능**: `team_types` 배열 검색으로 변경

#### 8.2 호환성 고려사항
- 기존 모바일 앱이나 다른 클라이언트의 API 호출 영향 확인
- API 버전 관리를 통한 점진적 마이그레이션 고려

## 우선순위
**High Priority** - 프론트엔드 변경이 완료되어 백엔드 업데이트가 필요함

## 담당자
- **백엔드 개발**: [담당자명]
- **데이터베이스**: [DBA명]
- **QA 테스트**: [QA담당자명]

## 예상 완료일
- **백엔드 API 개발**: 2025-09-20
- **데이터베이스 마이그레이션**: 2025-09-21
- **통합 테스트**: 2025-09-22
- **프로덕션 배포**: 2025-09-23

---

**작성일**: 2025-09-17
**작성자**: Claude (AI Assistant)
**문서 버전**: 1.0