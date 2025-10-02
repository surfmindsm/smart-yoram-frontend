# Church Round 모바일 앱 - 가입 신청 기능 명세서

## 목차
1. [교회 가입 신청](#1-교회-가입-신청)
2. [커뮤니티 가입 신청](#2-커뮤니티-가입-신청)
3. [공통 구성 요소](#3-공통-구성-요소)
4. [API 엔드포인트](#4-api-엔드포인트)

---

## 1. 교회 가입 신청

### 1.1 개요
- **목적**: 교회 관리자가 Church Round 시스템에 가입 신청
- **승인 방식**: 관리자 검토 후 승인 시 로그인 가능
- **화면 구성**: 4개 섹션 (기본 정보, 계정 정보, 추가 정보, 약관 동의)

### 1.2 섹션별 입력 필드

#### 섹션 1: 기본 정보
| 필드명 | 타입 | 필수 여부 | 설명 |
|--------|------|-----------|------|
| 교회명 | Text | 필수 | 교회 이름 (예: ○○교회) |
| 담임 목사명 | Text | 필수 | 담임 목사님 성함 |
| 교단/교파 | Dropdown | 필수 | 40개 교단 중 선택 (아래 참고) |
| 설립연도 | Number | 필수 | 1900~현재년도 범위 |
| 교회 주소 | Text | 필수 | 교회 상세 주소 |
| 교회 대표 번호 | Tel | 필수 | 형식: 02-1234-5678 |

**교단/교파 옵션 (40개)**:
```
기독교대한감리회
기독교대한성결교회
기독교대한하나님의성회(여의도순복음)
기독교대한하나님의성회(서대문)
기독교대한하나님의성회(광명)
기독교대한하나님의성회(순복음)
기독교한국루터회
기독교한국침례회
대한예수교장로회(개혁)
대한예수교장로회(개혁총연)
대한예수교장로회(고신)
대한예수교장로회(대신)
대한예수교장로회(대신수호)
대한예수교장로회(백석)
대한예수교장로회(백석대신)
대한예수교장로회(보수)
대한예수교장로회(서서울)
대한예수교장로회(순장)
대한예수교장로회(에덴)
대한예수교장로회(통합)
대한예수교장로회(합동)
대한예수교장로회(합동보수)
대한예수교장로회(합신)
대한예수교장로회(호헌)
대한예수교장로회(기타)
대한예수교침례회
성결교회(대한성결)
성결교회(예수교성결)
성결교회(나성)
성결교회(기타)
예수교대한하나님의교회
예수교대한성결교회
예수교한국침례회
한국기독교장로회
한국구세군
한국루터회
한국복음교회
한국침례회
독립교회
무교단
```

#### 섹션 2: 계정 정보 (최고 관리자)
| 필드명 | 타입 | 필수 여부 | 설명 |
|--------|------|-----------|------|
| 계정 사용자명 | Text | 필수 | 실제 시스템 관리할 사용자 이름 |
| 계정 사용자 연락처 | Tel | 필수 | 형식: 010-0000-0000 |
| 계정 사용자 이메일 (로그인 ID) | Email | 필수 | 이메일 인증 필요 |
| 이메일 인증 코드 | Text | 필수 | 6자리 숫자 코드 |

**이메일 인증 프로세스**:
1. 이메일 입력
2. "인증코드" 버튼 클릭
3. 이메일 중복 체크
4. 6자리 인증 코드 발송
5. 인증 코드 입력 및 확인
6. 인증 완료 시 필드 비활성화 (녹색 배경)

#### 섹션 3: 추가 정보
| 필드명 | 타입 | 필수 여부 | 설명 |
|--------|------|-----------|------|
| 교인 수 (교적부 등록 예정) | Number | 선택 | 대략적인 교인 수 |
| 홈페이지 | URL | 선택 | 홈페이지 또는 유튜브 주소 가능 |

#### 섹션 4: 첨부파일
- **드래그 앤 드롭 영역**
  - 클릭 또는 드래그로 파일 업로드
  - 최대 5개 파일
  - 각 파일 최대 5MB
  - 허용 형식: .pdf, .jpg, .jpeg, .png, .doc, .docx
  - 업로드된 파일 개별 삭제 가능

#### 섹션 5: 약관 동의
| 항목 | 필수 여부 |
|------|-----------|
| 서비스 이용약관 동의 | 필수 |
| 개인정보처리방침 동의 | 필수 |
| 마케팅 정보 수신 동의 | 선택 |

### 1.3 UI 디자인 가이드
- 각 섹션은 회색 배경(`#F9FAFB`)으로 구분
- 둥근 모서리 적용 (8px)
- 섹션 간 간격: 24px
- 필수 항목은 레이블 뒤에 `*` 표시
- 드래그 앤 드롭 영역:
  - 점선 테두리 (`#D1D5DB`)
  - 드래그 시 Primary 색상으로 변경
  - 5% 확대 효과

### 1.4 폼 검증 규칙
1. **이메일 인증 완료** 필수
2. **모든 필수 필드** 입력 확인
3. **이메일 형식** 검증: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
4. **전화번호 형식** 검증: `^[0-9-+().\s]+$`
5. **필수 약관 동의** 체크 확인
6. **파일 검증**:
   - 개수: 최대 5개
   - 크기: 각 5MB 이하
   - 확장자: pdf, jpg, jpeg, png, doc, docx

### 1.5 성공 화면
```
[체크 아이콘]

신청 완료!

교회 가입 신청이 성공적으로 제출되었습니다.
관리자 검토 후 승인 결과를 이메일로 안내드리겠습니다.

[로그인 페이지로 이동 버튼]
```

---

## 2. 커뮤니티 가입 신청

### 2.1 개요
- **목적**: 업체, 사역자, 개인사업자 등이 커뮤니티 회원으로 가입
- **승인 방식**: 관리자 검토 후 승인 시 로그인 가능
- **화면 구성**: 6개 섹션

### 2.2 섹션별 입력 필드

#### 섹션 1: 기본 정보
| 필드명 | 타입 | 필수 여부 | 설명 |
|--------|------|-----------|------|
| 신청자 유형 | Dropdown | 필수 | 업체/회사, 개인사업자, 연주자/음악가, 사역자, 단체/기관, 기타 |
| 단체/회사명 | Text | 필수 | 조직 이름 |
| 담당자명 | Text | 필수 | 담당자 성함 |
| 연락처 | Tel | 필수 | 형식: 010-0000-0000 |

**신청자 유형 옵션**:
```json
[
  { "value": "company", "label": "업체/회사" },
  { "value": "individual", "label": "개인사업자" },
  { "value": "musician", "label": "연주자/음악가" },
  { "value": "minister", "label": "사역자" },
  { "value": "organization", "label": "단체/기관" },
  { "value": "other", "label": "기타" }
]
```

#### 섹션 2: 계정 정보
| 필드명 | 타입 | 필수 여부 | 설명 |
|--------|------|-----------|------|
| 이메일 (로그인 ID) | Email | 필수 | 이메일 인증 필요 |
| 이메일 인증 코드 | Text | 필수 | 6자리 숫자 코드 |

**이메일 인증 프로세스**: 교회 가입과 동일

#### 섹션 3: 추가 정보
| 필드명 | 타입 | 필수 여부 | 조건 |
|--------|------|-----------|------|
| 사업자등록번호 | Text | 선택 | 개인사업자가 아닌 경우만 표시 |
| 서비스 지역 | Text | 선택 | - |
| 주소 | Text | 선택 | - |
| 웹사이트 | URL | 선택 | - |

#### 섹션 4: 상세 소개
| 필드명 | 타입 | 필수 여부 | 설명 |
|--------|------|-----------|------|
| 상세 소개 및 이용 목적 | Textarea | 필수 | 최소 120px 높이 |

#### 섹션 5: 첨부파일
- **교회 가입과 동일한 방식**
- 파일 안내 메시지: "사업자등록증, 회사소개서, 포트폴리오 등 (최대 5개, 각 5MB 이하)"

#### 섹션 6: 약관 동의
- **교회 가입과 동일**

### 2.3 UI 디자인 가이드
- **교회 가입과 동일한 디자인 시스템 적용**
- 섹션 배경색: `#F9FAFB`
- 드래그 앤 드롭 영역 동일
- 파일 삭제 버튼 호버 시 표시

### 2.4 폼 검증 규칙
1. **이메일 인증 완료** 필수
2. **필수 필드 검증**:
   - 신청자 유형
   - 단체/회사명
   - 담당자명
   - 이메일
   - 연락처
   - 상세 소개
3. **이메일 형식** 검증
4. **전화번호 형식** 검증
5. **필수 약관 동의** 체크
6. **파일 검증** (교회 가입과 동일)

### 2.5 성공 화면
```
[체크 아이콘]

신청 완료!

커뮤니티 이용 신청이 성공적으로 제출되었습니다.
관리자 검토 후 승인 결과를 이메일로 안내드리겠습니다.

[로그인 페이지로 이동 버튼]
```

---

## 3. 공통 구성 요소

### 3.1 헤더
```
[← 로그인으로 돌아가기]

[타이틀 카드]
제목: Church Round 커뮤니티 가입 / 교회 관리자 가입
설명: 해당 가입 유형에 맞는 설명 문구
```

### 3.2 이메일 인증 컴포넌트
**구성**:
- 이메일 입력 필드 + 인증코드 버튼
- 인증코드 입력 필드 + 확인 버튼
- 상태 메시지 (에러/성공)

**상태**:
1. 초기: 이메일 입력 가능, 인증코드 버튼 활성
2. 발송 중: 버튼 텍스트 "발송중...", 버튼 비활성
3. 발송 완료: 인증코드 입력 필드 표시
4. 인증 완료: 이메일 필드 비활성화, 녹색 배경, 체크 아이콘 표시

**에러 처리**:
- 이메일 미입력: "이메일을 먼저 입력해주세요."
- 이메일 형식 오류: "올바른 이메일 형식을 입력해주세요."
- 이메일 중복: "이미 등록된 이메일입니다. 다른 이메일을 사용해주세요."
- 인증 코드 오류: "인증 코드가 올바르지 않습니다."

### 3.3 드래그 앤 드롭 파일 업로드
**구성**:
```
┌─────────────────────────────────┐
│         [Upload 아이콘]          │
│                                 │
│ 파일을 드래그하여 업로드하거나    │
│         클릭하세요               │
│                                 │
│   (안내 메시지)                  │
│   N개 파일 선택됨                │
└─────────────────────────────────┘

선택된 파일:
┌─────────────────────────────────┐
│ [아이콘] filename.pdf  (1.2MB) [X]│
└─────────────────────────────────┘
```

**상태**:
- 기본: 회색 점선 테두리
- 호버: Primary 색상 테두리
- 드래그 중: Primary 색상, 배경색 변경, 5% 확대
- 파일 선택 후: 개수 표시

**파일 목록**:
- 각 파일: 아이콘 + 파일명 + 크기 + 삭제 버튼
- 삭제 버튼: 호버 시에만 표시, 빨간색

### 3.4 섹션 디자인
```css
{
  background: #F9FAFB,
  padding: 24px,
  borderRadius: 8px,
  marginBottom: 24px
}
```

### 3.5 버튼 디자인

**제출 버튼**:
```
전체 너비 버튼
높이: 48px
배경: Primary 색상
텍스트: "가입 신청하기"
로딩 상태: 스피너 + "신청서 제출 중..."
```

**뒤로 가기 버튼**:
```
Ghost 버튼
아이콘: ArrowLeft
텍스트: "로그인으로 돌아가기"
```

### 3.6 에러 표시
```
┌─────────────────────────────────┐
│ [!] 에러 메시지 내용              │
└─────────────────────────────────┘
배경: 빨간색 (#FEF2F2)
테두리: 빨간색
아이콘: AlertCircle
```

---

## 4. API 엔드포인트

### 4.1 이메일 인증 (Supabase Edge Function)

모든 이메일 인증은 Supabase Edge Function을 통해 처리됩니다.

**이메일 인증 코드 발송**:
```typescript
// Supabase Edge Function: email-verification
POST https://<project-ref>.supabase.co/functions/v1/email-verification

{
  "email": "user@example.com",
  "action": "send"
}
```

**Response**:
```json
{
  "success": true,
  "message": "인증 코드가 이메일로 전송되었습니다."
}
```

**이메일 인증 코드 확인**:
```typescript
POST https://<project-ref>.supabase.co/functions/v1/email-verification

{
  "email": "user@example.com",
  "action": "verify",
  "code": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "이메일 인증이 완료되었습니다."
}
```

**이메일 중복 체크**:
```typescript
// Supabase 직접 쿼리 (클라이언트)
const { data } = await supabase
  .from('users')
  .select('email')
  .eq('email', email)
  .single();

// 또는 supabaseApiService 사용
const exists = await supabaseApiService.emailVerification.checkEmailExists(email);
```

---

### 4.2 교회 가입 신청

**신청서 제출**: `POST https://api.surfmind-team.com/api/v1/church/applications`

⚠️ **주의**: 현재 신청서 **제출**만 레거시 API를 사용하고, **조회/승인/반려**는 Supabase를 직접 사용합니다.

**Request (FormData)**:
```javascript
{
  // 필수 필드
  church_name: string,
  pastor_name: string,
  admin_name: string,
  email: string,
  phone: string,
  address: string,
  description: string, // 빈 문자열

  // 약관 동의
  agree_terms: boolean,
  agree_privacy: boolean,
  agree_marketing: boolean,

  // 선택 필드
  website?: string,
  established_year?: number,
  denomination?: string,
  member_count?: number,

  // 파일
  attachments?: File[]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "application_id": 123,
    "status": "pending",
    "submitted_at": "2025-10-02T10:30:00Z"
  }
}
```

**신청서 조회/승인/반려**: Supabase 직접 접근 (`church_applications` 테이블)

```typescript
// 목록 조회
const { data } = await supabase
  .from('church_applications')
  .select('*')
  .eq('status', 'pending');

// 승인
const { data } = await supabase
  .from('church_applications')
  .update({ status: 'approved', reviewed_at: new Date().toISOString() })
  .eq('id', applicationId);

// 반려
const { data } = await supabase
  .from('church_applications')
  .update({
    status: 'rejected',
    reviewed_at: new Date().toISOString(),
    rejection_reason: reason
  })
  .eq('id', applicationId);
```

---

### 4.3 커뮤니티 가입 신청

**신청서 제출**: `POST https://api.surfmind-team.com/api/v1/community/applications`

⚠️ **주의**: 현재 신청서 **제출**만 레거시 API를 사용하고, **조회/승인/반려**는 Supabase를 직접 사용합니다.

**Request (FormData)**:
```javascript
{
  // 필수 필드
  applicant_type: string, // 'company' | 'individual' | 'musician' | 'minister' | 'organization' | 'other'
  organization_name: string,
  contact_person: string,
  email: string,
  phone: string,
  description: string,

  // 약관 동의
  agree_terms: boolean,
  agree_privacy: boolean,
  agree_marketing: boolean,

  // 임시 비밀번호 (승인 후 실제 비밀번호 발송)
  password: string, // 기본값: 'temp_password_will_be_sent_after_approval'

  // 선택 필드
  business_number?: string,
  service_area?: string,
  address?: string,
  website?: string,

  // 파일
  attachments?: File[]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "application_id": 456,
    "status": "pending",
    "submitted_at": "2025-10-02T10:30:00Z"
  }
}
```

**신청서 조회/승인/반려**: Supabase 직접 접근 (`community_applications` 테이블)

```typescript
// 목록 조회
const { data } = await supabase
  .from('community_applications')
  .select('*')
  .eq('status', 'pending');

// 승인
const { data } = await supabase
  .from('community_applications')
  .update({ status: 'approved', reviewed_at: new Date().toISOString() })
  .eq('id', applicationId);

// 반려
const { data } = await supabase
  .from('community_applications')
  .update({
    status: 'rejected',
    reviewed_at: new Date().toISOString(),
    rejection_reason: reason
  })
  .eq('id', applicationId);
```

### 4.4 에러 응답

**422 Validation Error**:
```json
{
  "success": false,
  "message": "입력 데이터 검증에 실패했습니다.",
  "detail": {
    "field": "email",
    "message": "이미 등록된 이메일입니다."
  }
}
```

**413 File Too Large**:
```json
{
  "success": false,
  "message": "첨부파일 크기가 너무 큽니다. 파일 크기를 줄이거나 개수를 줄여주세요."
}
```

---

## 5. 모바일 앱 개발 시 고려사항

### 5.1 UI/UX
1. **반응형 디자인**: 다양한 화면 크기 대응
2. **터치 최적화**: 버튼 최소 크기 44x44pt (iOS), 48x48dp (Android)
3. **키보드 처리**: 입력 필드 포커스 시 자동 스크롤
4. **로딩 상태**: 명확한 로딩 인디케이터 표시
5. **에러 처리**: 사용자 친화적인 에러 메시지

### 5.2 파일 업로드
1. **카메라/갤러리 접근**: 권한 요청 필요
2. **파일 선택**: 네이티브 파일 피커 사용
3. **미리보기**: 이미지 파일 썸네일 표시
4. **진행 상태**: 업로드 진행률 표시

### 5.3 폼 유효성 검사
1. **실시간 검증**: 입력 중 즉시 피드백
2. **포커스 아웃 검증**: 필드 이탈 시 검증
3. **제출 전 최종 검증**: 모든 필드 재검증

### 5.4 데이터 저장
1. **임시 저장**: 작성 중인 내용 자동 저장
2. **복구 기능**: 앱 종료 후 재시작 시 복구
3. **오프라인 지원**: 네트워크 연결 후 자동 제출

### 5.5 보안
1. **HTTPS 통신**: 모든 API 요청 암호화
2. **파일 검증**: 클라이언트 및 서버 양측 검증
3. **인증 토큰**: 이메일 인증 토큰 안전하게 관리

---

## 6. 화면 플로우

### 6.1 교회 가입 신청 플로우
```
로그인 화면
   ↓ [교회 가입 신청 버튼]
교회 가입 신청 화면
   ├─ 기본 정보 입력
   ├─ 계정 정보 입력 (이메일 인증)
   ├─ 추가 정보 입력
   ├─ 첨부파일 업로드
   ├─ 약관 동의
   ↓ [가입 신청하기]
신청 완료 화면
   ↓ [로그인 페이지로 이동]
로그인 화면
```

### 6.2 커뮤니티 가입 신청 플로우
```
로그인 화면
   ↓ [커뮤니티 가입 신청 버튼]
커뮤니티 가입 신청 화면
   ├─ 기본 정보 입력
   ├─ 계정 정보 입력 (이메일 인증)
   ├─ 추가 정보 입력
   ├─ 상세 소개 입력
   ├─ 첨부파일 업로드
   ├─ 약관 동의
   ↓ [가입 신청하기]
신청 완료 화면
   ↓ [로그인 페이지로 이동]
로그인 화면
```

---

## 7. 디자인 시스템

### 7.1 색상
```css
Primary: #3B82F6 (파란색)
Background: #F9FAFB (연한 회색)
Border: #D1D5DB (회색)
Success: #10B981 (녹색)
Error: #EF4444 (빨간색)
Text Primary: #111827 (진한 회색)
Text Secondary: #6B7280 (회색)
```

### 7.2 타이포그래피
```css
제목 (h3): 18px, font-weight: 600
레이블: 14px, font-weight: 500
입력 텍스트: 16px, font-weight: 400
안내 텍스트: 14px, font-weight: 400
작은 텍스트: 12px, font-weight: 400
```

### 7.3 간격
```css
섹션 간격: 24px
필드 간격: 16px
내부 패딩: 24px
버튼 높이: 48px
입력 필드 높이: 40px
```

---

## 8. 체크리스트

### 8.1 개발 체크리스트
- [ ] 교회 가입 신청 화면 구현
- [ ] 커뮤니티 가입 신청 화면 구현
- [ ] 이메일 인증 기능 구현
- [ ] 파일 업로드 기능 구현 (드래그 앤 드롭/클릭)
- [ ] 파일 삭제 기능 구현
- [ ] 폼 유효성 검사 구현
- [ ] 약관 동의 체크박스 구현
- [ ] API 연동
- [ ] 에러 처리
- [ ] 로딩 상태 처리
- [ ] 성공 화면 구현
- [ ] 반응형 디자인 적용

### 8.2 테스트 체크리스트
- [ ] 필수 필드 누락 시 에러 표시
- [ ] 이메일 중복 체크
- [ ] 이메일 인증 플로우
- [ ] 파일 크기/개수 제한
- [ ] 파일 확장자 검증
- [ ] 약관 미동의 시 에러
- [ ] 네트워크 에러 처리
- [ ] 오프라인 상태 처리
- [ ] 다양한 화면 크기 테스트

---

## 9. 참고 사항

### 9.1 기존 웹 구현
- 웹 버전 경로: `/church-signup`, `/community-signup`
- React + TypeScript 구현
- Tailwind CSS 스타일링
- Shadcn UI 컴포넌트 사용

### 9.2 백엔드 구현 (하이브리드)

**Supabase 사용 (Primary)**:
- **이메일 인증**: Supabase Edge Function (`email-verification`)
- **신청서 조회/승인/반려**: Supabase 직접 쿼리
- **데이터베이스**: PostgreSQL (Supabase)
- **파일 스토리지**: Supabase Storage (향후 마이그레이션 예정)

**레거시 API 사용 (현재 유지)**:
- **신청서 제출**: `https://api.surfmind-team.com/api/v1`
  - `POST /church/applications`
  - `POST /community/applications`
- **파일 업로드**: FormData 형식
- **최대 파일 크기**: 5MB
- **최대 파일 개수**: 5개

**인증 방식**:
- 이메일 인증 코드 (6자리)
- 승인 후 임시 비밀번호 이메일 발송

### 9.3 Supabase 데이터베이스 테이블

**`church_applications` (교회 가입 신청)**:
- `id`: 신청 ID
- `church_name`, `pastor_name`, `admin_name`: 교회 정보
- `email`, `phone`, `address`: 연락처
- `denomination`, `established_year`, `member_count`: 추가 정보
- `status`: 'pending' | 'approved' | 'rejected'
- `reviewed_at`, `reviewed_by`: 승인 정보
- `attachments`: JSON 형식의 파일 목록

**`community_applications` (커뮤니티 가입 신청)**:
- `id`: 신청 ID
- `applicant_type`: 신청자 유형
- `organization_name`, `contact_person`: 조직 정보
- `email`, `phone`, `address`: 연락처
- `business_number`, `service_area`, `website`: 추가 정보
- `status`: 'pending' | 'approved' | 'rejected'
- `reviewed_at`, `reviewed_by`: 승인 정보
- `attachments`: JSON 형식의 파일 목록

**`churches` (교회 정보)**:
- `id`: 교회 ID
- `name`, `address`, `phone`, `email`: 교회 정보
- `is_active`: 활성화 상태

**`users` (사용자 계정)**:
- `id`: 사용자 ID
- `username`, `email`, `full_name`: 계정 정보
- `church_id`: 소속 교회 (9998 = 무소속)
- `role`: 'church_admin' | 'community_member'
- `hashed_password`: 암호화된 비밀번호
- `is_active`: 활성화 상태
