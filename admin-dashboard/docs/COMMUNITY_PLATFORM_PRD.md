# 📋 교회 커뮤니티 플랫폼 PRD (v2)

## 📌 개요

### 제품명

**스마트 요람 커뮤니티**
(교회 간 자원 공유 및 네트워킹 플랫폼)

### 목적

* 전국 교회들이 서로 소통하며 **자원 공유, 사역자/연주팀 구인구직, 교회 행사 및 사역 소식, 기도 제목 나눔**을 할 수 있는 온라인 커뮤니티 플랫폼 구축

### 핵심 가치

* **상호부조**: 교회 간 자원의 효율적 배분
* **투명성**: 공개적이고 신뢰할 수 있는 정보 공유
* **연대감**: 교회 공동체 간의 유대 강화

---

## 🎯 타겟 사용자

### Primary Users (주 사용자)

* **교회 관리자**: 각 교회의 담당자 (목사, 행정간사, IT담당자)
* **사역자**: 구인구직을 원하는 목사, 전도사, 찬양팀, 연주자

### Secondary Users (부 사용자)

* **교회 신도**: 나눔/행사 게시물 열람 (관리자 승인된 사용자에 한함)
* **사역 단체**: 교회와 협력하는 선교단체, NGO 등

---

## 🔧 핵심 기능

### 1. 게시판 시스템

#### 1.1 무료 나눔 게시판

* **목적**: 교회 간 물품 나눔 및 자원 공유
* **기능**:

  * 물품 등록 (사진 다중 업로드, 상태, 수량, 위치 입력)
  * 카테고리 분류 (가구/전자제품/도서/악기/기타)
  * 나눔 상태 관리 (나눔중 → 예약중 → 완료)
  * 교회 위치 기반 검색
  * 관심 목록 저장 및 알림
  * 댓글/비공개 쪽지 문의
* **필드**:

  * id (PK), title, category, condition, images\[], description, quantity, church\_id, location(lat/lng, 주소), contact\_info, status, start\_date, end\_date, created\_at, updated\_at

#### 1.2 물품 요청 게시판

* **목적**: 필요한 물품을 요청하고 다른 교회/개인에게 도움받기
* **기능**:

  * 요청 등록 (물품명, 사유, 수량, 필요일자)
  * 요청 상태 관리 (요청중/매칭중/완료)
  * 지역/카테고리별 검색
  * 제공자와 비공개 연락 및 매칭 승인
* **필드**:

  * id (PK), title, category, requested\_item, quantity, reason, needed\_date, church\_id, location, contact\_info, status, created\_at, updated\_at

#### 1.3 물품 제공 게시판

* **목적**: 남는 물품을 필요한 교회/개인에게 제공
* **기능**:

  * 제공 물품 등록 (사진, 상태, 수량, 전달 방법)
  * 교회/지역별 검색
  * 제공 상태 관리 (제공 가능/예약중/완료)
  * 수령 신청 및 승인
* **필드**:

  * id (PK), title, category, item\_name, condition, images\[], description, quantity, church\_id, location, contact\_info, delivery\_method, status, created\_at, updated\_at

---

### 2. 사역 연계

#### 2.1 사역자 구인 게시판

* **목적**: 교회에서 사역자를 모집
* **기능**:

  * 채용 공고 등록/수정
  * 분야·지역별 검색/필터
  * 지원자 관리 (비공개)
  * 이력서 열람/다운로드
  * 지원자 알림
* **필드**:

  * id (PK), church\_id, title, church\_name, church\_intro, position, job\_type, salary, benefits, qualifications, required\_documents, location, deadline, status, created\_at, updated\_at

#### 2.2 사역자 구직 게시판

* **목적**: 사역자가 교회 구인 공고에 지원 및 자기소개
* **기능**:

  * 이력서 등록/수정
  * 희망 분야/지역 검색
  * 교회 관리자와 비공개 연락
  * 지원 내역 관리
* **필드**:

  * id (PK), member\_id, title, name, ministry\_field, career, education, certifications, introduction, desired\_location, available\_date, contact\_info, status, created\_at, updated\_at

#### 2.3 연주팀 구인 게시판

* **목적**: 교회가 행사/예배 시 필요한 **찬양·연주팀** 모집
* **기능**:

  * 연주팀 모집 글 등록 (행사 정보, 필요한 파트, 조건)
  * 연주팀 프로필 열람 및 신청 관리
  * 일정·지역 기반 검색
  * 매칭 및 알림 발송
* **필드**:

  * id (PK), church\_id, title, event\_name, event\_date, location, required\_parts\[], conditions, additional\_info, contact\_info, status, created\_at, updated\_at

#### 2.4 연주팀 구직 게시판

* **목적**: 연주팀/찬양팀이 활동할 교회를 찾고 프로필을 홍보
* **기능**:

  * 팀 프로필 등록 (팀 소개, 멤버 구성, 연주 분야)
  * 활동 영상/사진 업로드
  * 희망 지역/가능 일정 등록
  * 교회 관리자와 비공개 연락
* **필드**:

  * id (PK), team\_name, members\[], parts\[], career, portfolio\_url, desired\_region, availability, contact\_info, status, created\_at, updated\_at

---

### 3. 소통/소식

#### 3.1 교회 행사/소식 게시판

* **목적**: 교회 행사, 집회, 사역 관련 소식 공유
* **기능**:

  * 행사 등록 (이미지·배너 포함)
  * 캘린더 뷰 제공
  * 참가 신청/취소
  * 주최/공동주최 교회 연결
  * 행사 후기/사진 공유
* **필드**:

  * id (PK), title, description, event\_date, location, host\_church, co\_hosts\[], participants\_limit, registration\_method, images\[], contact\_info, status, created\_at, updated\_at

#### 3.2 세미나 소식 게시판

* **목적**: 세미나, 컨퍼런스 정보 공유 및 신청
* **기능**:

  * 세미나 등록/수정
  * 주제·강사 정보 표시
  * 참가 신청·취소
  * 자료 업로드 및 공유
* **필드**:

  * id (PK), title, topic, speaker, event\_date, location/online\_link, fee, registration\_deadline, images\[], contact\_info, status, created\_at, updated\_at

#### 3.3 부흥회 소식 게시판

* **목적**: 부흥회 및 특별 집회 홍보·안내
* **기능**:

  * 일정·장소 등록
  * 주제·강사 정보 제공
  * 교회 연합 행사 연결
  * 신청/참석 확인
* **필드**:

  * id (PK), title, theme, speaker, event\_date, location, host\_church, contact\_info, images\[], status, created\_at, updated\_at

---

### 4. 영적 교류

#### 4.1 기도 요청 게시판

* **목적**: 교회 및 성도들의 기도 제목 나눔
* **기능**:

  * 기도 제목 등록 (익명 선택 가능)
  * 댓글 응원/기도 응답 작성
  * “기도했습니다” 버튼 → 참여 카운트
  * 응답 간증 등록
* **필드**:

  * id (PK), title, prayer\_content, is\_anonymous, requester\_id, prayer\_status, prayer\_count, testimony, created\_at, updated\_at

---

### 5. 홍보/후원

#### 5.1 광고/협찬 게시판

* **목적**: 기독교 기업, 단체, 행사 홍보 및 후원 연결
* **기능**:

  * 광고/협찬 등록 (배너, 이미지, 링크, 영상)
  * 노출 위치/기간 설정
  * 후원 교회·단체 표시
* **필드**:

  * id (PK), title, advertiser, description, images/banners\[], link\_url, display\_position, start\_date, end\_date, contact\_info, status, created\_at, updated\_at

---

## 🛡️ 보안 및 승인 시스템

* **교회 인증**: 실제 교회 여부 확인 후 승인

* **담당자 인증**: 각 교회별 공식 관리자 1–2명 지정

* **게시글 승인**: 민감한 게시물은 관리자 검토 후 공개

* **사용자 권한 레벨**

  1. 슈퍼 관리자: 플랫폼 전체 관리
  2. 교회 관리자: 소속 교회 관리 및 게시글 승인
  3. 일반 사용자: 열람 및 댓글 작성 가능
  4. 제한 사용자: 열람만 가능

* **콘텐츠 정책**

  * 금지: 상업 광고, 정치적 내용, 교리 논쟁
  * 신고 시스템 및 관리자 처리
  * 자동 필터링 (비속어, 혐오 표현 탐지)

---

## 🎨 UX 요구사항

* **접근성**: 50–70대도 쉽게 이용 가능 (큰 글씨, 직관적 UI)
* **모바일 최적화**: Flutter 앱 기반, iOS/Android 동시 지원
* **검색 기능**: 지역·카테고리·분야별 직관적 필터
* **이미지/영상 미리보기 지원**
* **심방/교회 인증 단계에서 명확한 안내 제공**

---

## 📊 성공 지표 (KPIs)

* **사용량**: 월간 활성 교회 수(MAU), 게시글 등록 수, 나눔·구인/구직·연주팀 매칭 성사율
* **품질**: 사용자 만족도, 부적절 게시물 신고율, 분쟁 발생률
* **비즈니스**: 가입 교회 수, 지역별 활동 분포, 기능별 사용률

---

## 🚀 로드맵

### Phase 1: MVP (3개월)

* 기본 회원가입/로그인
* 교회 인증 시스템
* 무료 나눔 / 물품 요청 / 물품 제공 게시판
* 관리자 승인 기능

### Phase 2: 확장 (2개월)

* 사역자 구인/구직 게시판
* 연주팀 구인/구직 게시판
* 검색/필터링 고도화
* 알림 시스템
* 모바일 UI 최적화

### Phase 3: 고도화 (3개월)

* 교회 행사/소식, 세미나, 부흥회 게시판
* 기도 요청 게시판
* 참가 신청·후기·기도 응답 기능
* 통계/분석 기능
* API 공개

### Phase 4: 확산 (지속)

* 교단/연합회와 파트너십
* 교회 온보딩 지원
* 프리미엄 기능 (광고 우선 노출, 데이터 리포트, 맞춤형 추천)
* 기능 고도화 및 신규 기능 확장

---