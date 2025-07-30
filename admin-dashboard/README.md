# 스마트 요람 관리자 대시보드

교회 교적 관리를 위한 관리자 웹 애플리케이션입니다.

## 시작하기

### 필수 사항

- Node.js 16.x 이상
- 백엔드 서버가 http://localhost:8000 에서 실행 중이어야 함

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm start
```

브라우저에서 http://localhost:3000 접속

### 빌드

```bash
npm run build
```

## 주요 기능

- **로그인**: JWT 기반 인증
- **대시보드**: 교회 현황 한눈에 보기
- **교인 관리**: 교인 정보 등록/수정/삭제
- **출석 관리**: 예배 출석 체크 및 통계
- **주보 관리**: 주보 업로드 및 관리
- **교회 정보**: 교회 기본 정보 관리

## 기본 로그인 정보

- 사용자명: admin
- 비밀번호: changeme

## 기술 스택

- React 19 with TypeScript
- Tailwind CSS
- React Router v7
- Axios

## 프로젝트 구조

```
src/
├── components/
│   ├── Login.tsx         # 로그인 페이지
│   ├── Layout.tsx        # 레이아웃 컴포넌트
│   ├── Dashboard.tsx     # 대시보드
│   ├── Members.tsx       # 교인 관리
│   └── PrivateRoute.tsx  # 인증 라우트
├── services/
│   └── api.ts           # API 서비스
└── App.tsx              # 메인 앱
```
