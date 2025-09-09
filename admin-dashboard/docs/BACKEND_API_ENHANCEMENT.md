# 백엔드 API 개선 요청사항

## 📋 개요
새로운 커뮤니티 가입 시스템에 맞춰 백엔드 API 구조를 개선해야 합니다.
현재 단순한 신청서 시스템에서 **완전한 회원가입 + 승인 시스템**으로 확장됩니다.

## 🚨 주요 변경사항

### 1. CommunityApplicationRequest 스키마 수정

**기존 스키마:**
```typescript
interface CommunityApplicationRequest {
  applicant_type: string;
  organization_name: string;
  contact_person: string;
  email: string;
  phone: string;
  description: string;
  business_number?: string;
  address?: string;
  service_area?: string;
  website?: string;
  attachments?: File[];
}
```

**새로운 스키마:**
```typescript
interface CommunityApplicationRequest {
  // 기존 필드들
  applicant_type: 'company' | 'individual' | 'musician' | 'minister' | 'organization' | 'church_admin' | 'other';
  organization_name: string;
  contact_person: string;
  email: string;
  phone: string;
  description: string;
  business_number?: string;
  address?: string;
  service_area?: string;
  website?: string;
  attachments?: File[];
  
  // 새로 추가된 필드들
  password: string;              // 새로 추가: 사용자 비밀번호
  agree_terms: boolean;          // 새로 추가: 이용약관 동의
  agree_privacy: boolean;        // 새로 추가: 개인정보처리방침 동의
  agree_marketing: boolean;      // 새로 추가: 마케팅 수신 동의
}
```

### 2. 데이터베이스 테이블 수정

**community_applications 테이블에 컬럼 추가:**
```sql
ALTER TABLE community_applications 
ADD COLUMN password_hash VARCHAR(255) NOT NULL,
ADD COLUMN agree_terms BOOLEAN DEFAULT FALSE,
ADD COLUMN agree_privacy BOOLEAN DEFAULT FALSE,
ADD COLUMN agree_marketing BOOLEAN DEFAULT FALSE;
```

### 3. 신청자 유형 확장

**기존:**
- 'company', 'individual', 'musician', 'minister', 'organization', 'other'

**추가:**
- **'church_admin'**: 교회 관리자 (새로 추가)

### 4. 승인 시 자동 계정 생성 로직

**현재 승인 API 응답:**
```json
{
  "application_id": 1,
  "status": "approved",
  "reviewed_at": "2024-09-08T14:20:00Z",
  "user_account": {
    "username": "auto_generated_username",
    "temporary_password": "TempPass123!",
    "login_url": "https://admin.smartyoram.com/login"
  }
}
```

**새로운 승인 API 로직:**
```json
{
  "application_id": 1,
  "status": "approved",
  "reviewed_at": "2024-09-08T14:20:00Z",
  "user_account": {
    "email": "user@example.com",           // 신청 시 입력한 이메일 사용
    "password_set": true,                  // 신청 시 입력한 비밀번호 사용
    "user_role": "community_user",         // 또는 church_admin인 경우 "church_admin"
    "login_url": "https://admin.smartyoram.com/login"
  }
}
```

## 🔧 구현해야 할 기능

### 1. 비밀번호 처리
- **신청 시**: 비밀번호를 해시화하여 `password_hash` 컬럼에 저장
- **승인 시**: 기존 password_hash를 사용해서 users 테이블에 계정 생성
- **보안**: bcrypt 등 안전한 해시 알고리즘 사용

### 2. 약관 동의 저장
- 각 약관별 동의 여부를 별도 컬럼에 저장
- 필수 약관 미동의 시 신청 거부

### 3. 교회 관리자 특별 처리
```python
if application.applicant_type == 'church_admin':
    # 교회 관리자는 별도 권한 부여
    user_role = 'church_admin'
    # 새 교회(church_id) 생성 또는 기존 교회 연결
    church_id = create_or_assign_church(application.organization_name)
else:
    # 일반 커뮤니티 사용자
    user_role = 'community_user'
    church_id = 0  # 커뮤니티 전용
```

### 4. 이메일 알림 개선
**승인 시 이메일 내용:**
```html
안녕하세요, {contact_person}님!

스마트 요람 커뮤니티 가입 신청이 승인되었습니다.

▶ 로그인 정보
- 이메일: {email}
- 비밀번호: 신청 시 입력하신 비밀번호를 사용하세요

🔑 **중요**: 신청할 때 설정하신 비밀번호로 바로 로그인할 수 있습니다.
별도의 임시 비밀번호가 발급되지 않습니다.

▶ 로그인 페이지
https://admin.smartyoram.com/login

감사합니다!
```

## 📊 예상 데이터 흐름

### 1. 신청 프로세스
```
사용자 입력 → 폼 유효성 검사 → 비밀번호 해시화 → DB 저장
```

### 2. 승인 프로세스  
```
관리자 승인 → 사용자 계정 생성 → 권한 부여 → 이메일 발송
```

### 3. 로그인 프로세스
```
이메일 + 비밀번호 → 인증 → JWT 토큰 → 역할별 리다이렉션
```

## 🎯 우선순위

### Phase 1 (즉시 구현 필요)
1. ✅ **password 필드 추가**: DB 스키마 및 API 스키마 수정
2. ✅ **약관 동의 필드 추가**: agree_terms, agree_privacy, agree_marketing
3. ✅ **church_admin 유형 추가**: applicant_type enum 확장

### Phase 2 (1-2일 내)
1. **승인 시 자동 계정 생성 로직** 구현
2. **교회 관리자 특별 처리** 로직
3. **이메일 템플릿 업데이트**

### Phase 3 (추후)
1. 비밀번호 재설정 기능
2. 승인 대기 상태 알림
3. 관리자 대시보드 개선

## 🧪 테스트 케이스

### 1. 일반 업체 신청
```json
{
  "applicant_type": "company",
  "organization_name": "테스트 업체",
  "email": "test@company.com",
  "password": "TestPass123!",
  "agree_terms": true,
  "agree_privacy": true
}
```

### 2. 교회 관리자 신청
```json
{
  "applicant_type": "church_admin", 
  "organization_name": "새한교회",
  "email": "pastor@church.com",
  "password": "ChurchPass123!",
  "agree_terms": true,
  "agree_privacy": true
}
```

## 🔑 로그인 시스템 통합

### 백엔드 요구사항
1. **로그인 API**: `/auth/login/access-token` 엔드포인트가 이메일을 username으로 받도록 설정
2. **사용자 계정 생성**: 승인 시 `users` 테이블에 다음 정보로 계정 생성
   ```sql
   INSERT INTO users (email, password_hash, role, church_id, is_active)
   VALUES (
       application.email,
       application.password_hash,  -- 신청 시 저장된 해시
       CASE application.applicant_type 
           WHEN 'church_admin' THEN 'church_admin'
           ELSE 'community_user'
       END,
       church_id,  -- church_admin인 경우 생성된/매칭된 church_id, 아니면 0
       TRUE
   );
   ```

### 로그인 프로세스
```
사용자 입력: 신청한 이메일 + 신청한 비밀번호
↓
백엔드 인증: users 테이블에서 email로 사용자 조회 후 비밀번호 검증
↓  
JWT 토큰 발급: 역할(community_user/church_admin)에 따른 권한 설정
↓
프론트엔드: 역할에 따라 적절한 메뉴/기능 접근 제한
```

## 📞 질문사항

1. **교회 관리자 승인 시**: 새로운 church_id를 생성할지, 기존 교회와 매칭할지?
2. **비밀번호 정책**: 최소 길이, 복잡도 요구사항은?
3. **로그인 API**: 현재 `/auth/login/access-token`이 이메일을 username으로 받는지 확인 필요

---

**작성일**: 2025-09-09  
**작성자**: 프론트엔드 개발팀  
**긴급도**: 🚨 HIGH