# Handoff: Church Round — Direction C ("Focused Workspace") 리디자인

## Overview
스마트 요람(Church Round) 어드민 대시보드를 **Direction C — Focused Workspace** 비주얼로 전면 통일하는 작업입니다.
다크 네이비 사이드바 + 밝은 콘텐츠 영역 + 높은 정보 밀도 + 절제된 단일 브랜드 블루를 핵심으로 합니다.

이 문서 하나만으로 대화에 없던 개발자도 구현할 수 있도록 작성되었습니다. 실제 코드베이스
`surfmindsm/smart-yoram-frontend` (`admin-dashboard/`, **React 19 + TypeScript + Tailwind + Radix/shadcn**)에 매핑됩니다.

## About the Design Files
이 번들과 프로젝트 루트의 `*.html` 파일들은 **HTML로 만든 디자인 레퍼런스(프로토타입)**입니다. 그대로 가져다 쓰는 프로덕션 코드가 아니라, **의도한 모양·동작을 보여주는 시안**입니다.
작업의 목표는 이 시안들을 **기존 코드베이스의 환경(React + Tailwind + shadcn)과 패턴으로 재현**하는 것입니다. HTML/inline 스타일을 그대로 옮기지 말고, 아래 토큰과 컴포넌트 규칙을 기존 shadcn 컴포넌트(`src/components/ui/*`)에 반영하세요.

## Fidelity
**High-fidelity (hifi).** 색·타이포·간격·반경이 최종값입니다. 픽셀 기준으로 재현하되, 데이터/로직은 기존 코드를 유지하고 **표현 계층만** 교체합니다. 더미 데이터(교인명·수치 등)는 디자인 표현용이며 실제 데이터로 대체됩니다.

---

## 적용 순서 (권장)

### 1단계 — 디자인 토큰 교체  ⭐ 가장 먼저
`design-system/tokens.css`의 `:root` 블록으로 **`src/index.css`의 `:root`를 교체**합니다.
핵심 변경: shadcn HSL 변수 + Church Round 전용 사이드바/상태 토큰 추가.

가장 중요한 한 가지: **`--primary`를 로고 블루로 통일** — 현재 `199 89% 48%`(시안)를 **`215 100% 56%` (`#1C7CFF`, 로고 색)**로 변경. 로고(`logo_type4_white.png`)의 파란색과 CSS primary가 어긋나 있던 문제를 해결합니다.

```css
--primary: 215 100% 56%;        /* #1C7CFF — 브랜드/액션 단일 색 */
--background: 216 33% 96%;       /* #F1F4F9 — 앱 캔버스 */
--card: 0 0% 100%;               /* #FFFFFF */
--foreground: 222 48% 11%;       /* #0E1729 — 잉크 */
--muted-foreground: 215 16% 47%; /* #64748B */
--border: 214 30% 92%;           /* #E3E8F0 */
--radius: 0.75rem;               /* 카드 12px (컨트롤은 8px) */
/* 다크 사이드바(시그니처) */
--sidebar: 222 48% 11%;          /* #0E1729 */
--sidebar-foreground: 217 28% 82%;
--sidebar-accent: 215 100% 56%;  /* 활성 메뉴 */
--sidebar-border: 220 41% 18%;
```
(전체 값은 `tokens.css` 참고.)

### 2단계 — Tailwind 설정에 사이드바 토큰 노출
`admin-dashboard/tailwind.config.js`의 `theme.extend.colors`에 추가:
```js
sidebar: {
  DEFAULT: 'hsl(var(--sidebar))',
  foreground: 'hsl(var(--sidebar-foreground))',
  border: 'hsl(var(--sidebar-border))',
  accent: 'hsl(var(--sidebar-accent))',
  chip: 'hsl(var(--sidebar-chip))',
},
success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
```

### 3단계 — Layout.tsx 다크 사이드바 전환  ⭐ 전 화면 공통
`src/components/Layout.tsx`. 가장 큰 변경이자 전 화면에 즉시 반영되는 부분.

| 요소 | 현재 | 변경(Direction C) |
|---|---|---|
| 사이드바 배경 | `bg-white border-r border-slate-200` | `bg-sidebar` (#0E1729), `border-sidebar-border` |
| 너비 | `w-64` (256px) | `w-[236px]` |
| 헤더 | 흰 헤더 + 로고 이미지 | 사이드바 상단에 워드마크(아래 참고), 콘텐츠 상단은 별도 흰 탑바(58px, breadcrumb/검색/액션) |
| 그룹 라벨 | `text-slate-400 uppercase` | `text-[#54627E] text-[10.5px] font-bold uppercase tracking-[.09em]` |
| 메뉴 항목 | `text-slate-600 hover:bg-slate-50` | `text-[#AEBACE] hover:bg-[#172033]` |
| 활성 항목 | `bg-primary/10 text-primary` | `bg-primary text-white` (꽉 찬 블루) |
| 카운트 배지 | 없음 | 우측 pill `bg-sidebar-chip text-[#9DB0CC]` (예: 교인 842, 심방 5) |
| 워드마크 | 로고 이미지 | `church`(Newsreader italic, primary) + `round`(800, white) — 다크 배경용 |
| ⌘K 검색 | 헤더 | 사이드바 상단 `#172033` 입력 박스 |

**IA 정리**: 기존 8개 그룹 → **3개**로 통합:
- **운영**: 대시보드 · 교인 관리 · 조직·목장 · 심방 신청 · 중보 기도
- **살림**: 헌금 관리 · 오늘의 말씀 · 예배 시간표 · 주보·공지 · 푸시 알림
- **도구**: 통계 분석 · SMS 발송 · 엑셀 관리 · 보안 로그 · 설정

> 참고 구현: `screens/c-shell.jsx`의 `CShell` 컴포넌트가 위 사이드바+탑바의 완성형입니다. 마크업/클래스 구조를 그대로 참고하세요.

### 4단계 — 공통 컴포넌트(shadcn) 스타일 정렬
`src/components/ui/*`를 아래 스펙으로 맞추면 모든 화면이 자동 정렬됩니다.

- **Card**: `bg-white border border-[#E3E8F0] rounded-[12px]`. 헤더 `px-[18px] py-[14px] border-b border-[#EEF1F6]`, 제목 14px/700.
- **Table**: th `text-[11px] font-bold uppercase tracking-[.04em] text-[#94A3B8] bg-[#FAFBFD]`; td `py-3 px-[18px] border-b border-[#F1F4F9]`; row hover `#FAFBFD`. 좁은 폭 대비 `min-width` + 래퍼 `overflow-x:auto`.
- **Badge / 상태칩**: `text-[11px] font-bold rounded-full px-[10px] py-[3px]`. 상태 색 쌍(아래 토큰).
- **Segmented control**(탭): `bg-[#F1F4F9] rounded-[8px] p-[3px]`, 활성 `bg-white shadow-sm`.
- **Button(primary)**: `bg-primary text-white rounded-[8px] h-[34px] font-semibold`. ghost: `bg-white border border-[#E3E8F0] text-[#334155]`.
- **Input/Select**: `h-[38–40px] border border-[#E3E8F0] rounded-[8px]`.
- **KPI 카드**: 라벨 12px/#64748B, 값 24–26px/750, 델타 11.5px (상승 #16A34A / 하락 #DC2626).
- **빈/플레이스홀더 이미지**: 줄무늬 배경 + 모노스페이스 라벨(스크린샷 참고).

---

## Design Tokens

### 색상
| 역할 | HSL (shadcn var) | HEX |
|---|---|---|
| primary (브랜드/액션) | `215 100% 56%` | `#1C7CFF` |
| 앱 배경 | `216 33% 96%` | `#F1F4F9` |
| 카드 | `0 0% 100%` | `#FFFFFF` |
| 잉크/본문 | `222 48% 11%` | `#0E1729` |
| 보조 텍스트 | `215 16% 47%` | `#64748B` |
| 흐린 텍스트 | — | `#94A3B8` |
| 보더 | `214 30% 92%` | `#E3E8F0` |
| 표 헤더 배경 | — | `#FAFBFD` |
| 행 구분선 | — | `#F1F4F9` |
| 사이드바 배경 | `222 48% 11%` | `#0E1729` |
| 사이드바 텍스트 | — | `#AEBACE` |
| 사이드바 그룹라벨 | — | `#54627E` |
| 사이드바 보더 | — | `#1B2740` |
| 사이드바 칩 | — | `#233149` |

### 상태 색 쌍 (배경 / 텍스트)
| 상태 | 배경 | 텍스트 |
|---|---|---|
| info(파랑) | `#EAF1FE` | `#2563EB` |
| success(초록) | `#E7F6EC` | `#16A34A` |
| warning(주황) | `#FBF1E3` | `#B45309` |
| danger(빨강) | `#FCEBEB` | `#DC2626` |
| neutral(회색) | `#F1F4F9` | `#64748B` |
| accent(보라) | `#F0E6EF` | `#8A5A86` |

### 타이포그래피
- **본문/UI**: Pretendard (Variable). 한글 어드민 최적. CDN: `cdn.jsdelivr.net/gh/orioncactus/pretendard`.
- **워드마크 "church"**: Newsreader italic 500 (로고의 이탤릭 세리프 느낌). "round": Pretendard 800.
- 스케일: 페이지 타이틀 23px/750 · 카드 제목 14px/700 · 본문 13px · 표 12.5px · 메타 11–12px · 대문자 라벨 11px/700.
- 반경: 카드 12px · 컨트롤 8px · 칩 999px. 숫자는 `tnum`(tabular).

---

## Screens / Views (화면 → 실제 컴포넌트 매핑)

각 시안 HTML은 프로젝트 루트에, 컴포넌트 소스는 `screens/*.jsx`에 있습니다. "구현 신호" 분석에 따라 **AI 교역자/AI Tools/QR 출석/출석/커뮤니티는 제외**(미연결·미구현·폐기)했습니다.

| 시안 HTML | 실제 컴포넌트 (admin-dashboard/src) | 핵심 변경 |
|---|---|---|
| `교인 관리.html` | `components/MemberManagement.tsx` (캐노니컬, `/member-management`) | 테이블 아키타입: 아바타+영문명, 직분/구역 칩, 상태칩, 필터바, 페이지네이션 |
| `교인 상세.html` | `MemberManagement.tsx` 상세 모달 → 프로필 페이지 | 프로필 밴드 + 그룹 카드(기본/교회/가족/직업/주소) + 관계(연락처·성례·전입전출·차량) |
| `교인 등록.html` | `components/AddMemberModal.tsx` (캐노니컬; `AddMemberWizard`는 미사용) | 접이식 섹션 모달, 기본·교회 기본 열림 |
| `심방 신청 관리.html` | `components/PastoralCareManagement.tsx` | 카드 리스트, status/priority/type 칩, 승인·일정·완료 액션 |
| `중보 기도 요청.html` | `components/PrayerRequests.tsx` (`PrayerRequestManagement`=old, 폐기 후보) | 카드, 기도수·응답 간증, 기도하기/응답처리 |
| `헌금 관리.html` | `components/DonationManagement.tsx` (캐노니컬; `OfferingsManagement`=호환변환용) | 통계 KPI + 종류별 분포(스택바) + 내역 테이블 + 영수증 탭 |
| `주보 공지.html` | `components/AnnouncementManagement.tsx` + `Bulletins.tsx` | 공지 카드(고정/카테고리/우선순위/대상/활성토글), 탭 공지/주보 |
| `SMS 발송.html` | `components/SMSManagement.tsx` | 수신자 선택 + 작성(글자수/차감/잔여) |
| `오늘의 말씀.html` | `components/DailyVerse.tsx` | 다크 히어로 말씀 카드 + 목록 |
| `보안 로그.html` | `components/SecurityLogs.tsx` | KPI + 로그인 기록 테이블 + 보안 팁 |
| `교회 설정.html` | `components/ChurchSettings.tsx` | 언더라인 탭(교회 정보/AI 연동/DB) + 폼 + 앱표시 토글 |
| `예배 시간표.html` | `components/worship/WorshipScheduleManagement.tsx` | 유형별 그룹 + 시간블록 카드 + 온라인 중계 |
| `조직 관리.html` | `components/OrganizationManagement.tsx` | 조직 트리(유형칩/인원/리더) + 부서 탭 |
| `관리자 권한 관리.html` | `components/AdminRoleManagement.tsx` | 관리자 테이블 + 역할 배지 + 역할 변경/해제 |
| `통계 분석.html` | `components/AnalyticsDashboard.tsx` | KPI + 출석 라인 + 성별 도넛 + 연령/구역 바 + 증가 콤보 (Recharts로 구현) |
| `푸시 알림.html` | `components/PushNotifications.tsx` | 작성(대상/유형/예약) + 앱 미리보기 + 발송 기록 |
| `엑셀 관리.html` | `components/ExcelManagement.tsx` | 내보내기/가져오기 카드 + 드롭존 + 가져오기 기록 |
| `로그인.html` | `components/Login.tsx` | 분할형: 좌 다크 브랜드 패널 / 우 폼 |
| `랜딩 페이지.html` | `components/Landing/LandingPage.tsx` | 히어로 + 기능 그리드 + CTA |
| `Church Round 대시보드 개선 시안.html` | `components/Dashboard.tsx` | 3방향 비교 시안(A/B/C). C가 채택안 |

> 차트는 시안에서 inline SVG로 그렸지만, 실제 구현은 기존 **Recharts**(이미 의존성에 있음)로 토큰 색상(`--chart-1`=primary 등)을 적용해 재현하세요.

## Interactions & Behavior
- 사이드바 활성 항목 = 현재 라우트(꽉 찬 primary). hover `#172033`(다크)/`#F6F8FB`(라이트).
- 탭/세그먼트: 활성 흰 배경+그림자. 테이블 행 hover `#FAFBFD`.
- 상태 전이(심방 pending→approved→scheduled→completed, 기도 active→answered, 공지 활성토글 등)는 **기존 로직 유지**, 표현만 칩/스위치로.
- 반응형: 데스크탑 어드민 기준. 콘텐츠가 좁아지면 테이블은 가로 스크롤(min-width 유지).
- Tweaks(시안 전용): primary 색·사이드바 다크/라이트·밀도·반경. 실제 구현엔 불필요하나, "라이트 사이드바"를 옵션으로 두고 싶으면 `--cr-*` 변수 패턴 참고.

## Files (이 대화에서 만든 디자인 소스)
- 토큰: `design-system/tokens.css`
- 공통 셸/유틸: `screens/c-shell.jsx`(사이드바+탑바), `screens/cr-app.jsx`(Tweaks 마운트), `directions/icons.jsx`(lucide형 아이콘)
- 화면별 컴포넌트: `screens/members.jsx`, `member-detail.jsx`, `member-add.jsx`, `pastoral-care.jsx`, `prayer.jsx`, `donations.jsx`, `announcements.jsx`, `sms.jsx`, `verse.jsx`, `security.jsx`, `church-settings.jsx`, `worship.jsx`, `org.jsx`, `roles.jsx`, `analytics.jsx`, `push.jsx`, `excel.jsx`, `auth.jsx`
- 각 화면 진입점: 프로젝트 루트의 `*.html` (위 표 참고)
- 3방향 비교 시안: `directions/refined-sky.jsx`, `warm-sanctuary.jsx`, `focused-workspace.jsx`

## Assets
- 로고: `admin-dashboard/public/logo_type4_white.png`(워드마크), `logo_yoram.png`(cr 마크). 다크 사이드바에는 텍스트 워드마크(church round) 사용 권장.
- 아이콘: lucide-react (이미 의존성). 시안의 inline SVG는 lucide와 동일 계열.
- 이미지(커뮤니티 등 사용자 콘텐츠): 줄무늬 플레이스홀더로 표기 — 실제 업로드 이미지로 대체.

## 제외/정리 메모
- **제외**: AI 교역자/에이전트/AI Tools/설교자료(AI 백엔드 미연결), QR 출석·출석 관리(미운영), **커뮤니티 전체(제품에서 제거됨)**.
- **중복 정리 권고**: `Layout.tsx.backup` 삭제, `prayer-requests-old`(PrayerRequestManagement) 폐기, `AddMemberWizard` 미사용, 행사 작성 3종(`CreateChurchEvent*`)·re-export 스텁 통합.

---

## Claude Code 사용법 (개발자/사용자용)

**넘길 자료 (2가지면 충분)**
1. **이 핸드오프 폴더** (`README.md` + `tokens.css`) — 적용 규칙과 토큰
2. **디자인 시안 HTML/JSX** — 정확한 모양 참고용 (루트 `*.html`, `screens/*.jsx`, `directions/icons.jsx`)
   - 보는 법: 시안 `.html`을 브라우저로 열어 픽셀·색·간격을 직접 확인

**진행 순서**
1. IDE에서 실제 저장소(`admin-dashboard`)를 연다 (Claude Code가 작업할 곳).
2. 이 핸드오프 폴더와 시안 파일들을 저장소 안 임시 폴더(예: `_design_handoff/`)에 복사해 둔다.
3. Claude Code에 아래 프롬프트를 준다.
4. **토큰 → Layout → 공통 컴포넌트 → 화면** 순으로 PR 단위로 적용·검토.

**복붙용 프롬프트 (Claude Code)**
```
첨부한 _design_handoff/README.md 는 우리 admin-dashboard(React+TS+Tailwind+shadcn)
어드민을 "Direction C"로 리디자인하는 가이드야. _design_handoff 안의 시안 HTML이
목표 모양이고, 그대로 복붙하지 말고 우리 기존 컴포넌트/패턴으로 재현해줘.

순서대로 작업해줘 (각 단계 끝나면 멈추고 보여줘):
1) src/index.css 의 :root 를 _design_handoff/tokens.css 값으로 교체.
   특히 --primary 를 로고 블루(215 100% 56% / #1C7CFF)로 통일.
2) tailwind.config.js 에 sidebar/success/warning 컬러 토큰 추가.
3) Layout.tsx 를 다크 네이비 사이드바로 전환하고 IA를 3그룹(운영/살림/도구)으로 정리.
   (README의 Layout 표 + 시안 screens/c-shell.jsx 참고)
4) ui/* 공통 컴포넌트(Card·Table·Badge·Button·Input·Select·Tabs)를 README 스펙으로 정렬.
5) 그 다음 화면별로 README의 "화면 → 컴포넌트 매핑표" 순서대로 적용.
   - 차트는 기존 Recharts 사용, 색은 토큰(--chart-*)
   - 데이터/로직은 건드리지 말고 표현 계층만 교체
제외: AI 교역자/AI Tools, QR/출석, 커뮤니티 (README 참고).
```

> 팁: 한 번에 전 화면을 시키지 말고 1~4단계(토대)를 먼저 끝낸 뒤, 화면을 2~3개씩 끊어 적용하면 리뷰가 쉽습니다.

---

## ⚡ 적극적 재구성 모드 (레이아웃까지 시안대로)

> 앞 단계가 "기존 화면에 C 테마만 입히기"였다면, 이 모드는 **각 화면의 구성(레이아웃) 자체를 시안과 동일하게 다시 짜는** 것입니다. 단, **실제 데이터 필드·API·상태 로직은 그대로 유지**하고 그 데이터를 시안의 새 레이아웃에 매핑합니다.

**원칙**
- 시안(`screens/*.jsx`, 브라우저로 `*.html` 열어 확인)이 **목표 레이아웃**입니다. 색만 참고하는 게 아니라 **카드 구성·배치·순서·여백·정보 위계**를 그대로 재현하세요.
- 실제 화면이 시안보다 **필드가 많으면 그 필드는 유지**하되, 시안의 시각 언어(칩·KPI 스트립·프로필 밴드·테이블 컬럼 스타일)에 맞춰 재배치합니다.
- 데이터 패칭/상태/이벤트 핸들러는 **유지**하고, 마크업(표현)만 시안 구조로 교체합니다. 더미 데이터는 만들지 마세요.

**복붙용 프롬프트 (Claude Code — 적극적 재구성)**
```
이전에 C 테마(토큰·다크 사이드바)는 적용됐어. 이번엔 색만이 아니라 각 화면의
"레이아웃 구성"을 _design_handoff 의 시안과 동일하게 다시 만들어줘.

규칙:
- 시안 screens/<화면>.jsx (그리고 *.html 을 브라우저로 연 모습)이 목표 레이아웃이야.
  카드 구성/배치/순서/여백/정보 위계를 그대로 재현해줘. (색만 입히지 말 것)
- 단, 실제 데이터 필드·API 호출·상태/핸들러는 유지하고, 그 데이터를 새 레이아웃에 매핑해.
  실제 화면에 시안보다 필드가 많으면 그 필드는 살리되 시안의 시각 스타일(칩/KPI/프로필밴드 등)로 재배치.
- 더미 데이터 만들지 말고 기존 데이터 소스를 그대로 연결.

화면별 목표 (시안 파일 = 목표):
- Dashboard.tsx ← screens/dashboard.jsx : KPI 스트립(전체교인/주일출석/새가족/주간헌금)
  + 빠른 작업 카드 + "오늘 할 일" + 출석·교인 추이 차트 구성으로 재배치.
  (기존 캘린더 중심 구성을 이 구성으로 교체하되, 캘린더가 꼭 필요하면 하단 카드로 유지)
- MemberManagement.tsx ← screens/members.jsx : 아바타+이름(영문 보조), 직분 칩,
  구역·목장, 상태 칩, 필터바(드롭다운), 페이지네이션. 실제 컬럼(성별/직분 대분류·세부/
  조직/부서/초대상태)은 유지하되 시안의 칩/밀도 스타일로.
- MemberManagement 상세 ← screens/member-detail.jsx : 프로필 밴드 + 그룹 카드.
- DonationManagement.tsx ← screens/donations.jsx : KPI + 종류별 분포 스택바 + 내역 테이블.
- PastoralCareManagement / PrayerRequests / AnnouncementManagement / SMSManagement /
  DailyVerse / SecurityLogs / ChurchSettings / WorshipScheduleManagement /
  OrganizationManagement / AdminRoleManagement / AnalyticsDashboard / PushNotifications /
  ExcelManagement / Login / Landing ← 각 동명 screens/*.jsx 구성 그대로.

한 번에 다 하지 말고 Dashboard → MemberManagement 순으로 하나씩, 적용 후 멈추고 보여줘.
차트는 기존 Recharts 사용(색은 토큰). 데이터 0건일 때 빈 상태 카드도 시안처럼 처리.
```

**현재 발견된 버그 (같이 고치기)**
- 대시보드 "출석 추이" 차트가 막대 1개 + 비정상 곡선으로 깨져 보임 → Recharts 데이터 매핑/축 설정 점검.
- 교인 목록 아바타 대비가 약함 → 아바타 배경 `#EEF3FC` / 글자 `var(--primary)`로(시안 `.mb-av` 참고).
