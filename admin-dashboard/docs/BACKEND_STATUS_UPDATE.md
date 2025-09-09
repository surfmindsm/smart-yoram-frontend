# 백엔드 커뮤니티 API 상태 업데이트

## 📋 현재 상황 요약
**일시**: 2025-09-08  
**상태**: 500 Internal Server Error (진행중)  
**우선순위**: 🚨 URGENT

## 🔧 현재 확인된 사항

### ✅ 정상 작동하는 것들
- ✅ 로그인 API (`/auth/login/access-token`) - 정상
- ✅ 인증 및 권한 체크 - 정상 (슈퍼어드민 church_id=0, is_superuser=true)
- ✅ 프론트엔드 구현 - 완료
- ✅ API 경로 수정 - 완료 (`/community/admin/applications`)

### ❌ 현재 문제
- ❌ **500 Internal Server Error** 발생
- ❌ 에러 메시지: "신청서 목록 조회 중 오류가 발생했습니다."

## 🚨 문제 발생 지점

### API 엔드포인트
```
GET https://api.surfmind-team.com/api/v1/community/admin/applications?page=1&limit=100
```

### 예상되는 인증 헤더
```
Authorization: Bearer [JWT_TOKEN]
Content-Type: application/json
```

## 🔍 이전 해결 과정

### 1단계: 404 에러 해결 ✅ (완료)
- **문제**: `/admin/community/applications` 경로로 호출
- **해결**: `/community/admin/applications`로 경로 수정
- **결과**: 404 → 500 으로 진전

### 2단계: 500 에러 디버깅 🔄 (진행중)
- **현재 상태**: 백엔드 내부 서버 오류
- **확인 필요**: 데이터베이스 연결, 테이블 존재 여부, 쿼리 로직

## 🎯 백엔드팀 확인 요청사항

### 즉시 확인 필요 (URGENT)

#### 1. 데이터베이스 테이블 존재 확인
```sql
-- 테이블이 존재하는지 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'community_applications';

-- 테이블 구조 확인
\d community_applications;
```

#### 2. 샘플 데이터 존재 확인
```sql
SELECT COUNT(*) FROM community_applications;
SELECT * FROM community_applications LIMIT 5;
```

#### 3. 서버 로그 확인
- FastAPI 서버 로그에서 500 에러 상세 스택트레이스 확인
- 데이터베이스 쿼리 오류 메시지 확인
- SQL 문법 오류 또는 컬럼명 불일치 확인

#### 4. API 엔드포인트 코드 검토
```python
# 예상 문제점들:
# 1. 테이블명 오타 (community_applications vs community_application)
# 2. 컬럼명 오타 
# 3. JOIN 문제
# 4. 권한 체크 로직 오류
# 5. 페이지네이션 로직 문제
```

## 📊 필요한 데이터베이스 스키마

### community_applications 테이블
```sql
CREATE TABLE community_applications (
  id SERIAL PRIMARY KEY,
  applicant_type VARCHAR(20) NOT NULL,
  organization_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  business_number VARCHAR(20),
  address TEXT,
  description TEXT NOT NULL,
  service_area VARCHAR(100),
  website VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 테스트 데이터
```sql
INSERT INTO community_applications (
  applicant_type, organization_name, contact_person, email, phone, 
  business_number, address, description, service_area, website, status
) VALUES 
('company', '(주)교회음향시스템', '김철수', 'contact@churchsound.co.kr', '010-1234-5678', 
 '123-45-67890', '서울시 강남구 테헤란로 123', '교회 전문 음향장비 설치 및 유지보수', '전국', 'https://churchsound.co.kr', 'pending');
```

## 🔧 임시 해결방안 제안

### Option 1: Mock 데이터 반환 (빠른 임시 해결)
```python
# 실제 DB 조회 대신 임시로 목 데이터 반환
@router.get("/admin/applications")
async def get_applications():
    return {
        "applications": [
            {
                "id": 1,
                "applicant_type": "company",
                "organization_name": "(주)교회음향시스템",
                "contact_person": "김철수",
                "email": "test@example.com",
                "phone": "010-1234-5678",
                "status": "pending",
                "submitted_at": "2024-09-08T10:00:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "total_pages": 1,
            "total_count": 1,
            "per_page": 20
        },
        "statistics": {
            "pending": 1,
            "approved": 0,
            "rejected": 0,
            "total": 1
        }
    }
```

### Option 2: 로그 추가하여 디버깅
```python
import logging

@router.get("/admin/applications")
async def get_applications():
    try:
        logging.info("Community applications API called")
        # DB 쿼리 실행
        logging.info("Database query executed")
        return result
    except Exception as e:
        logging.error(f"Community applications error: {str(e)}")
        logging.error(f"Error type: {type(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
```

## 📞 다음 단계

1. **즉시**: 서버 로그 확인 및 500 에러 원인 파악
2. **1시간 내**: 테이블 존재 및 데이터 확인
3. **2시간 내**: Mock 데이터라도 반환하여 프론트엔드 테스트 가능하게 처리
4. **4시간 내**: 실제 DB 연동 완료

## 🎯 성공 기준

### 최소 기준 (Mock 데이터)
```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://api.surfmind-team.com/api/v1/community/admin/applications?page=1&limit=20"
# Expected: 200 OK with JSON response
```

### 완전 기준 (실제 데이터)
- 실제 DB에서 데이터 조회
- 필터링 및 페이지네이션 정상 작동
- 승인/반려 API도 정상 작동

---

**연락처**: 프론트엔드 개발팀  
**긴급도**: 🚨 HIGH - 프론트엔드 완료, API만 대기중