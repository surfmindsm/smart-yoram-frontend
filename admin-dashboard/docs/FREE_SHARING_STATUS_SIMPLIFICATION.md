# 무료 나눔 상태 단순화 작업

## 목표
무료 나눔(FreeSharing) 시스템의 상태값을 기존의 복잡한 구조에서 2개의 단순한 상태로 변경

## 현재 상태 vs 목표 상태

### 현재 상태 (복잡함)
- `active`, `available`, `requesting`, `open`, `upcoming` → 활성 상태들
- `completed`, `closed`, `inactive`, `answered` → 완료 상태들
- `cancelled`, `reserved`, `matching`, `ongoing` → 기타 상태들

### 목표 상태 (단순함)
- `sharing` - 나눔중
- `completed` - 나눔완료

## API 수정 사항

### 1. 데이터베이스 스키마 수정

```sql
-- 기존 status 컬럼의 값들을 새로운 값으로 변경
UPDATE community_sharing
SET status = CASE
    WHEN status IN ('active', 'available', 'requesting', 'open', 'upcoming') THEN 'sharing'
    WHEN status IN ('completed', 'closed', 'inactive', 'answered', 'cancelled', 'reserved', 'matching', 'ongoing') THEN 'completed'
    ELSE 'sharing'
END;

-- status 컬럼에 CHECK 제약조건 추가 (선택사항)
ALTER TABLE community_sharing
ADD CONSTRAINT chk_sharing_status
CHECK (status IN ('sharing', 'completed'));
```

### 2. API Response 수정

#### GET /api/v1/community/sharing
**기존 응답:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "소파 나눔합니다",
      "status": "active",  // 기존: 다양한 상태값
      "category": "가구"
    }
  ]
}
```

**수정 후 응답:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "소파 나눔합니다",
      "status": "sharing",  // 신규: sharing 또는 completed만
      "category": "가구"
    }
  ]
}
```

#### POST /api/v1/community/sharing
**요청 body에서 status 필드:**
```json
{
  "title": "책상 나눔합니다",
  "status": "sharing",  // 기본값: sharing
  "category": "가구"
}
```

#### PUT /api/v1/community/sharing/{id}
**상태 변경 시:**
```json
{
  "status": "completed"  // sharing → completed로 변경
}
```

### 3. 필터링 API 파라미터

#### GET /api/v1/community/sharing?status={status}
**허용되는 status 값:**
- `sharing` - 나눔중인 게시글만 조회
- `completed` - 나눔완료된 게시글만 조회
- 파라미터 없음 - 전체 조회

**예시:**
```
GET /api/v1/community/sharing?status=sharing&category=가구
GET /api/v1/community/sharing?status=completed
```

## 프론트엔드 수정 사항

### 1. 상태 매핑 함수 수정

**파일: `src/utils/status-mapping.ts`**
```typescript
export const freeSharingStatusMapping = {
  'sharing': {
    label: '나눔중',
    class: 'bg-green-100 text-green-800'
  },
  'completed': {
    label: '나눔완료',
    class: 'bg-gray-100 text-gray-800'
  }
};

export const getFreeSharingStatusLabel = (status: string): string => {
  return freeSharingStatusMapping[status]?.label || status;
};

export const getFreeSharingStatusClass = (status: string): string => {
  return freeSharingStatusMapping[status]?.class || 'bg-blue-100 text-blue-800';
};
```

### 2. 필터 옵션 수정

**파일: `src/components/Community/FreeSharing.tsx`**
```typescript
const statusOptions: SelectOption[] = [
  { value: 'all', label: '전체 상태' },
  { value: 'sharing', label: '나눔중' },
  { value: 'completed', label: '나눔완료' }
];
```

### 3. 테이블 렌더링 수정

```typescript
{
  key: 'status',
  title: '상태',
  render: (value) => TableRenderers.badge(
    getFreeSharingStatusLabel(value),
    getFreeSharingStatusClass(value)
  )
}
```

## 마이그레이션 계획

### 1단계: 백엔드 수정
1. 데이터베이스 마이그레이션 스크립트 작성
2. API 응답 형식 변경
3. 필터링 로직 수정
4. 테스트 코드 업데이트

### 2단계: 프론트엔드 수정
1. 상태 매핑 함수 추가
2. 필터 옵션 단순화
3. 테이블 표시 로직 수정
4. 기존 상태값 호환성 제거

### 3단계: 테스트 및 배포
1. 통합 테스트 실행
2. 스테이징 환경 배포
3. QA 테스트
4. 프로덕션 배포

## 영향 범위

### 백엔드
- `community_sharing` 테이블
- 무료 나눔 관련 모든 API 엔드포인트
- 필터링 및 검색 로직

### 프론트엔드
- `FreeSharing.tsx` 컴포넌트
- `status-mapping.ts` 유틸리티
- 무료 나눔 상세 페이지
- 무료 나눔 생성/수정 폼

## 호환성 고려사항

### 기존 데이터 마이그레이션
```sql
-- 기존 데이터의 상태값 매핑
-- active, available, open → sharing
-- completed, closed, cancelled → completed
```

### API 버전 관리
- 기존 API와의 호환성을 위해 일시적으로 두 형식 모두 지원 가능
- 신규 클라이언트는 새로운 상태값 사용
- 기존 클라이언트는 점진적 마이그레이션

## 테스트 체크리스트

### API 테스트
- [ ] 새로운 상태값으로 게시글 생성
- [ ] 상태별 필터링 동작 확인
- [ ] 상태 변경 API 동작 확인
- [ ] 기존 데이터 마이그레이션 확인

### UI 테스트
- [ ] 필터 드롭다운에 올바른 옵션 표시
- [ ] 테이블에서 상태 배지 정상 표시
- [ ] 상태별 색상 구분 확인
- [ ] 필터링 동작 정상 확인

## 롤백 계획

문제 발생 시 기존 상태 시스템으로 롤백:
1. 데이터베이스 백업에서 복원
2. API 코드 이전 버전으로 복원
3. 프론트엔드 코드 이전 버전으로 복원

## 완료 기준

1. ✅ 무료 나눔 게시글이 2가지 상태로만 표시됨
2. ✅ 필터가 "나눔중", "나눔완료"로 동작함
3. ✅ 테이블에서 상태가 명확하게 구분됨
4. ✅ 기존 데이터가 올바르게 마이그레이션됨
5. ✅ 모든 테스트가 통과함