# 백엔드 API 구현 요청사항

## 📋 개요
커뮤니티 회원 신청 및 관리 기능을 위한 백엔드 API 구현 요청입니다.  
프론트엔드 개발이 완료되었으나 백엔드 API 엔드포인트가 구현되지 않아 404 에러가 발생하고 있습니다.

## 🚨 현재 상황
- ✅ 프론트엔드 구현 완료
- ✅ 로그인 기능 정상 작동 (슈퍼어드민 계정 확인됨)
- ❌ 커뮤니티 신청 관리 API 404 에러
- ❌ 관리자 전용 API 엔드포인트 미구현 상태

## 🔧 필요한 API 엔드포인트

### 1. 관리자 전용 - 신청서 목록 조회 (URGENT)
```
GET /api/v1/admin/community/applications
```
**현재 상태**: 404 에러 발생  
**우선순위**: 🚨 HIGH

**Query Parameters**:
- `page`: number (기본값: 1)
- `limit`: number (기본값: 20) 
- `status`: 'pending' | 'approved' | 'rejected' | 'all'
- `applicant_type`: 'company' | 'individual' | 'musician' | 'minister' | 'organization' | 'other' | 'all'
- `search`: string (조직명, 담당자명, 이메일 검색)
- `sort_by`: 'submitted_at' | 'reviewed_at' | 'organization_name'
- `sort_order`: 'asc' | 'desc'

**응답 예시**:
```json
{
  "applications": [
    {
      "id": 1,
      "applicant_type": "company",
      "organization_name": "(주)교회음향시스템",
      "contact_person": "김○○",
      "email": "contact@example.com",
      "phone": "010-1234-5678",
      "business_number": "123-45-67890",
      "address": "서울시 강남구 테헤란로 123",
      "description": "교회 전문 음향장비...",
      "service_area": "전국",
      "website": "https://example.com",
      "attachments": [
        {
          "filename": "사업자등록증.pdf",
          "path": "/uploads/applications/1/file.pdf",
          "size": 245760
        }
      ],
      "status": "pending",
      "submitted_at": "2024-09-07T10:30:00Z",
      "reviewed_at": null,
      "reviewed_by": null,
      "rejection_reason": null,
      "notes": null,
      "created_at": "2024-09-07T10:30:00Z",
      "updated_at": "2024-09-07T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 87,
    "per_page": 20
  },
  "statistics": {
    "pending": 12,
    "approved": 65,
    "rejected": 10,
    "total": 87
  }
}
```

### 2. 관리자 전용 - 신청서 상세 조회
```
GET /api/v1/admin/community/applications/{application_id}
```
**현재 상태**: 미구현  
**우선순위**: 🚨 HIGH

### 3. 관리자 전용 - 신청서 승인
```
PUT /api/v1/admin/community/applications/{application_id}/approve
```
**현재 상태**: 미구현  
**우선순위**: 🚨 HIGH

**요청 Body**:
```json
{
  "notes": "우수한 경력 확인. 승인 처리함."
}
```

**응답 예시**:
```json
{
  "success": true,
  "message": "신청서가 승인되었습니다.",
  "data": {
    "application_id": 1,
    "status": "approved",
    "reviewed_at": "2024-09-08T14:20:00Z",
    "user_account": {
      "username": "churchsound_company",
      "temporary_password": "TempPass123!",
      "login_url": "https://admin.smartyoram.com/login"
    }
  }
}
```

### 4. 관리자 전용 - 신청서 반려
```
PUT /api/v1/admin/community/applications/{application_id}/reject
```
**현재 상태**: 미구현  
**우선순위**: 🚨 HIGH

**요청 Body**:
```json
{
  "rejection_reason": "제출 서류가 불충분합니다. 사업자등록증을 추가 제출해주세요.",
  "notes": "서류 보완 후 재신청 안내함."
}
```

### 5. 관리자 전용 - 첨부파일 다운로드
```
GET /api/v1/admin/community/applications/{application_id}/attachments/{filename}
```
**현재 상태**: 미구현  
**우선순위**: MEDIUM

### 6. 공개 API - 신청서 제출 (구현 확인 필요)
```
POST /api/v1/community/applications
```
**현재 상태**: 구현 여부 불명  
**우선순위**: HIGH

**Content-Type**: `multipart/form-data`

## 🔐 인증 요구사항
- 모든 관리자 API (`/admin/community/*`)는 JWT 토큰 인증 필수
- 슈퍼어드민 권한 체크 (`church_id = 0`)
- Authorization: `Bearer {JWT_TOKEN}` 헤더 사용

## 📊 데이터베이스 스키마 요구사항

### community_applications 테이블
```sql
CREATE TABLE community_applications (
  id SERIAL PRIMARY KEY,
  applicant_type VARCHAR(20) NOT NULL CHECK (applicant_type IN ('company', 'individual', 'musician', 'minister', 'organization', 'other')),
  organization_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  business_number VARCHAR(20),
  address TEXT,
  description TEXT NOT NULL,
  service_area VARCHAR(100),
  website VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### community_application_attachments 테이블
```sql
CREATE TABLE community_application_attachments (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES community_applications(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 테스트 데이터
프론트엔드 테스트를 위해 다음 샘플 데이터를 생성해주세요:

```sql
INSERT INTO community_applications (
  applicant_type, organization_name, contact_person, email, phone, 
  business_number, address, description, service_area, website, status
) VALUES 
('company', '(주)교회음향시스템', '김철수', 'contact@churchsound.co.kr', '010-1234-5678', 
 '123-45-67890', '서울시 강남구 테헤란로 123', '교회 전문 음향장비 설치 및 유지보수 업체입니다', '전국', 'https://churchsound.co.kr', 'pending'),
('musician', '프라이즈 워십팀', '이영희', 'praise@worship.com', '010-9876-5432', 
 NULL, '부산시 해운대구', '전문 워십 연주팀으로 교회 특별집회 연주를 담당합니다', '부산/경남', NULL, 'pending'),
('minister', '김목사 사역팀', '김목사', 'pastor.kim@ministry.org', '010-5555-1234', 
 NULL, '대구시 중구', '청소년 전문 사역자로 수련회 및 특강을 진행합니다', '대구/경북', 'https://youthministry.org', 'approved');
```

## ⚡ 우선순위별 구현 계획

### Phase 1 (URGENT - 1-2일 내)
1. **신청서 목록 조회 API** - 관리 화면 기본 기능
2. **신청서 승인/반려 API** - 핵심 관리 기능

### Phase 2 (HIGH - 3-5일 내)
1. **신청서 상세 조회 API** - 상세 정보 확인
2. **공개 신청서 제출 API** - 외부 사용자 신청

### Phase 3 (MEDIUM - 1주 내)
1. **첨부파일 다운로드 API** - 서류 확인
2. **파일 업로드 처리** - 첨부파일 관리

## 🔍 현재 프론트엔드 에러 상황
```
GET https://api.surfmind-team.com/api/v1/admin/community/applications?page=1&limit=100 404 (Not Found)
```

관리자가 "회원 신청 관리" 페이지에 접근할 때마다 위 API를 호출하고 있으나 404 에러가 발생합니다.

## 📞 문의사항
- API 구현 예상 일정은 언제인가요?
- 임시로 목 데이터를 반환하는 API를 먼저 구현할 수 있나요?
- 파일 업로드 처리 방식에 대한 논의가 필요합니다.

## 📋 체크리스트
- [ ] `/api/v1/admin/community/applications` GET (목록 조회)
- [ ] `/api/v1/admin/community/applications/{id}` GET (상세 조회)  
- [ ] `/api/v1/admin/community/applications/{id}/approve` PUT (승인)
- [ ] `/api/v1/admin/community/applications/{id}/reject` PUT (반려)
- [ ] `/api/v1/admin/community/applications/{id}/attachments/{filename}` GET (파일 다운로드)
- [ ] `/api/v1/community/applications` POST (신청서 제출)
- [ ] 데이터베이스 테이블 생성
- [ ] 샘플 테스트 데이터 생성
- [ ] 슈퍼어드민 권한 체크 로직
- [ ] 파일 업로드/다운로드 처리

---

**작성일**: 2024-09-08  
**작성자**: 프론트엔드 개발팀  
**긴급도**: 🚨 HIGH (프론트엔드 개발 완료, API 대기 상태)