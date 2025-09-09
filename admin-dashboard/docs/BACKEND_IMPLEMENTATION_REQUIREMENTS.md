# 🚨 백엔드 구현 요청사항 - 커뮤니티 가입 시스템

## 📋 요약
커뮤니티 가입 시스템에서 사용자가 신청할 때 입력한 **이메일과 비밀번호로 직접 로그인**할 수 있도록 백엔드 로직 변경이 필요합니다.

## 🔧 현재 상황
- ❌ **기존**: 승인 시 임시 비밀번호 자동 생성 → 사용자가 별도 비밀번호로 로그인
- ✅ **변경 필요**: 신청 시 입력한 비밀번호 → 승인 시 그대로 사용

## 📝 구현해야 할 변경사항

### 1. 신청서 승인 API 수정
**현재 승인 로직 변경:**
```python
# 기존 (변경 전)
user_account = {
    "username": "auto_generated_username",
    "temporary_password": "TempPass123!",
    "login_url": "https://admin.smartyoram.com/login"
}

# 새로운 로직 (변경 후)
# 승인 시 users 테이블에 계정 생성
user = create_user(
    email=application.email,  # 신청한 이메일 사용
    password_hash=application.password_hash,  # 신청 시 저장된 해시 사용
    role="church_admin" if application.applicant_type == "church_admin" else "community_user",
    church_id=church_id,  # church_admin인 경우 교회 ID, 아니면 0
    is_active=True
)

# 응답 데이터
user_account = {
    "email": application.email,
    "password_set": True,  # 신청 시 입력한 비밀번호 사용
    "user_role": user.role,
    "login_url": "https://admin.smartyoram.com/login"
}
```

### 2. 로그인 API 확인
**`/auth/login/access-token` 엔드포인트가 이메일로 로그인을 받는지 확인 필요**

현재 프론트엔드에서 보내는 데이터:
```javascript
formData.append('username', email);  // 이메일을 username으로 전송
formData.append('password', password);
```

→ 백엔드에서 `username` 필드에 이메일이 들어와도 정상 인증되는지 확인해주세요.

### 3. 이메일 알림 템플릿 수정

**승인 시 발송되는 이메일 내용 변경:**

```html
<!-- 기존 (변경 전) -->
로그인 정보:
- 아이디: auto_generated_username
- 임시 비밀번호: TempPass123!

<!-- 새로운 내용 (변경 후) -->
로그인 정보:
- 이메일: {신청한_이메일}
- 비밀번호: 신청 시 입력하신 비밀번호를 사용하세요

🔑 중요: 신청할 때 설정하신 비밀번호로 바로 로그인할 수 있습니다.
별도의 임시 비밀번호가 발급되지 않습니다.
```

## ✅ 확인사항

### 필수 확인 항목:
1. **비밀번호 해시**: 신청 시 `password` 필드가 올바르게 해시화되어 `password_hash`에 저장되는가?
2. **로그인 인증**: `/auth/login/access-token`에서 이메일로 사용자 조회가 가능한가?
3. **역할 부여**: `church_admin` 유형은 `church_admin` 역할, 나머지는 `community_user` 역할 부여

### 테스트 시나리오:
```
1. 사용자가 커뮤니티 가입 신청 (이메일: test@example.com, 비밀번호: MyPass123!)
2. 관리자가 신청 승인
3. 사용자가 test@example.com / MyPass123!로 로그인 시도
4. ✅ 로그인 성공해야 함
```

## 📅 구현 우선순위
**🚨 HIGH**: 사용자들이 로그인할 수 없어서 시스템을 사용할 수 없는 상태

---

**작성일**: 2025-09-09  
**요청자**: 프론트엔드 개발팀  
**긴급도**: 🚨 HIGH