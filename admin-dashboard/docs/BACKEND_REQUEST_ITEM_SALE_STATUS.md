# 백엔드 요청사항: 물품 판매 상태 단순화

## 🎯 요청 목적
물품 판매 시스템의 사용성 개선을 위해 복잡한 상태값을 2개로 단순화

## 📋 현재 상황
- **프론트엔드**: 이미 "판매중/판매완료" 2가지 상태로 표시 완료
- **백엔드**: 아직 기존 상태값(`available`, `reserved`, `completed`) 사용 중

## 🔄 변경 요청사항

### 1. 데이터베이스 상태값 변경
**현재 상태값들:**
```
available, reserved, completed
```

**변경할 상태값:**
```
sharing    → 판매중
completed  → 판매완료
```

### 2. 데이터 마이그레이션 스크립트
```sql
-- 기존 데이터 마이그레이션
UPDATE community_item_sale
SET status = CASE
    WHEN status IN ('available', 'reserved') THEN 'sharing'
    WHEN status = 'completed' THEN 'completed'
    ELSE 'sharing'
END;
```

### 3. API 응답 변경

#### 현재 API 응답:
```json
{
  "data": [
    {
      "id": 1,
      "title": "책상 판매합니다",
      "status": "available",
      "price": 50000,
      "category": "가구"
    }
  ]
}
```

#### 변경 후 API 응답:
```json
{
  "data": [
    {
      "id": 1,
      "title": "책상 판매합니다",
      "status": "sharing",
      "price": 50000,
      "category": "가구"
    }
  ]
}
```

### 4. 필터링 API 파라미터
```
GET /api/v1/community/item-sale?status=sharing   (판매중인 게시글)
GET /api/v1/community/item-sale?status=completed (판매완료된 게시글)
```

## 🔧 구현 우선순위

### High Priority (즉시 필요)
1. **데이터베이스 상태값 마이그레이션**
2. **GET API 응답 변경** (`/api/v1/community/item-sale`)
3. **필터링 API 수정** (status 파라미터)

### Medium Priority (다음 업데이트)
1. **POST/PUT API 수정** (새 게시글 생성/수정 시)
2. **상태 변경 API 수정**

## 💡 호환성 고려사항

### 단계별 배포 방안
1. **1단계**: 백엔드에서 새로운 상태값 지원 + 기존 상태값 호환
2. **2단계**: 프론트엔드 확인 후 기존 상태값 완전 제거

### 임시 호환성 코드 (선택사항)
```javascript
// 백엔드에서 임시로 두 형식 모두 지원 가능
const mapLegacyStatus = (status) => {
  if (status === 'available' || status === 'reserved') return 'sharing';
  if (status === 'completed') return 'completed';
  return status;
};
```

## ✅ 완료 확인 방법

### 테스트 체크리스트
- [ ] 물품 판매 목록 API에서 `sharing`/`completed` 상태 반환
- [ ] 상태별 필터링 정상 동작
- [ ] 기존 데이터가 올바른 상태로 마이그레이션
- [ ] 새 게시글 생성 시 기본값 `sharing`로 설정

### API 테스트 명령어
```bash
# 전체 목록 조회
curl -X GET "https://api.surfmind-team.com/api/v1/community/item-sale"

# 판매중 필터링
curl -X GET "https://api.surfmind-team.com/api/v1/community/item-sale?status=sharing"

# 판매완료 필터링
curl -X GET "https://api.surfmind-team.com/api/v1/community/item-sale?status=completed"
```

## 📞 연락처
- **프론트엔드 담당**: 기존 상태값과 새 상태값 모두 호환되도록 구현 완료
- **문의사항**: 프론트엔드 코드 확인 필요 시 `SharingOffer.tsx` 참고

## 🚀 예상 효과
1. **사용자 경험 개선**: 복잡한 상태가 명확한 2가지로 단순화
2. **유지보수성 향상**: 상태 관리 로직 단순화
3. **개발 효율성**: 새로운 기능 추가 시 상태 처리 간소화

---
**완료 예정일**: 백엔드 팀 스케줄에 따라 조정
**우선순위**: Medium (사용성 개선)