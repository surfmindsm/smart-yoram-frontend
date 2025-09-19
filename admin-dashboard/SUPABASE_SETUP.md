# Supabase CLI 구성 완료

## 📋 개요

교회 관리 시스템에 Supabase CLI가 성공적으로 구성되었습니다. 이 문서는 Supabase를 사용한 로컬 개발 환경 설정과 사용법을 안내합니다.

## 🛠 설치된 구성 요소

### 1. Supabase CLI
- **버전**: 2.40.7 (최신 버전)
- **설치 위치**: Homebrew를 통해 글로벌 설치
- **상태**: ✅ 설치 완료

### 2. JavaScript 클라이언트
- **패키지**: `@supabase/supabase-js` v2.57.4
- **설정 파일**: `src/lib/supabase.ts`
- **상태**: ✅ 구성 완료

### 3. 데이터베이스 스키마
- **마이그레이션 파일**: `supabase/migrations/20250918000001_initial_schema.sql`
- **시드 데이터**: `supabase/seed.sql`
- **상태**: ✅ 준비 완료

## 🚀 사용법

### 로컬 개발 환경 시작 (Docker 필요)

```bash
# Supabase 로컬 환경 시작
npm run supabase:start

# 또는 직접 명령어
supabase start
```

**⚠️ 주의**: Docker Desktop이 설치되고 실행 중이어야 합니다.

### 상태 확인

```bash
# Supabase 서비스 상태 확인
npm run supabase:status

# 로컬 URL 정보 출력
supabase status
```

### 데이터베이스 관리

```bash
# 데이터베이스 리셋 (마이그레이션과 시드 데이터 적용)
npm run supabase:reset

# 마이그레이션 푸시
npm run supabase:migrate

# TypeScript 타입 생성
npm run supabase:generate-types
```

### 환경 중지

```bash
# Supabase 로컬 환경 중지
npm run supabase:stop
```

## 📁 프로젝트 구조

```
admin-dashboard/
├── supabase/
│   ├── config.toml              # Supabase 설정
│   ├── migrations/              # 데이터베이스 마이그레이션
│   │   └── 20250918000001_initial_schema.sql
│   └── seed.sql                 # 시드 데이터
├── src/
│   ├── lib/
│   │   └── supabase.ts          # Supabase 클라이언트 설정
│   ├── services/
│   │   └── supabaseService.ts   # Supabase 서비스 함수들
│   └── types/
│       └── database.types.ts    # 자동 생성되는 타입 (npm run supabase:generate-types)
└── .env                         # 환경 변수
```

## 🔧 환경 변수

현재 `.env` 파일에 다음 변수들이 설정되어 있습니다:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Local development
REACT_APP_ENVIRONMENT=development
```

### 프로덕션 환경 설정

프로덕션에서는 실제 Supabase 프로젝트의 URL과 키를 사용해야 합니다:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## 🗄 데이터베이스 스키마

### 주요 테이블들

1. **profiles** - 사용자 프로필 (auth.users 확장)
2. **churches** - 교회 정보
3. **music_team_recruitments** - 음악팀 모집
4. **job_postings** - 채용 공고
5. **church_news** - 교회 소식
6. **sharing_posts** - 나눔 게시글

### 특별 설정

- **RLS (Row Level Security)** 활성화
- **자동 타임스탬프** 업데이트 트리거
- **UUID 기본키** 사용
- **JSONB 필드** 활용 (team_types, metadata 등)

## 📚 서비스 사용 예제

### 음악팀 모집 조회

```typescript
import { musicTeamService } from '../services/supabaseService'

// 모든 모집 공고 가져오기
const recruitments = await musicTeamService.getAll({
  status: 'open',
  limit: 20
})

// 특정 모집 공고 상세 조회
const recruitment = await musicTeamService.getById('uuid-here')

// 새 모집 공고 생성
const newRecruitment = await musicTeamService.create({
  title: '주일예배 찬양팀 모집',
  team_types: ['찬양팀', '워십팀'],
  church_id: 'church-uuid',
  // ... 기타 필드들
})
```

### 교회 소식 관리

```typescript
import { churchNewsService } from '../services/supabaseService'

// 카테고리별 소식 조회
const news = await churchNewsService.getAll({
  category: '특별예배',
  status: 'active'
})

// 새 소식 등록
const newNews = await churchNewsService.create({
  title: '신년예배 안내',
  content: '새해를 맞아...',
  category: '특별예배',
  church_id: 'church-uuid'
})
```

## 🔐 인증 (Authentication)

```typescript
import { authService } from '../services/supabaseService'

// 로그인
const { user, session } = await authService.signIn('email@example.com', 'password')

// 회원가입
const { user } = await authService.signUp('email@example.com', 'password', {
  full_name: '홍길동'
})

// 로그아웃
await authService.signOut()

// 현재 사용자 정보
const user = await authService.getCurrentUser()
```

## 🐳 Docker 설정

로컬 Supabase 환경을 실행하려면 Docker Desktop이 필요합니다.

### Docker 설치 (미설치된 경우)

1. [Docker Desktop 다운로드](https://www.docker.com/products/docker-desktop/)
2. 설치 후 Docker Desktop 실행
3. `supabase start` 명령어 실행

### 서비스 포트

- **API**: http://localhost:54321
- **Studio**: http://localhost:54323
- **Database**: localhost:54322
- **Inbucket (이메일)**: http://localhost:54324

## 🔄 마이그레이션 워크플로우

### 1. 새 마이그레이션 생성

```bash
# 새 마이그레이션 파일 생성
supabase migration new add_new_table

# 생성된 파일을 편집하여 SQL 작성
# supabase/migrations/[timestamp]_add_new_table.sql
```

### 2. 마이그레이션 적용

```bash
# 로컬에 적용
supabase db reset

# 원격에 적용 (설정 후)
supabase db push
```

### 3. 타입 동기화

```bash
# 데이터베이스 스키마에서 TypeScript 타입 생성
npm run supabase:generate-types
```

## 🚨 문제 해결

### Docker 관련 오류

```bash
# Docker daemon이 실행되지 않는 경우
# Docker Desktop을 시작하거나 다음 명령어로 확인
docker --version
```

### 포트 충돌

```bash
# 포트가 이미 사용 중인 경우
supabase stop
supabase start
```

### 환경 변수 오류

- `.env` 파일의 `REACT_APP_SUPABASE_URL`과 `REACT_APP_SUPABASE_ANON_KEY` 확인
- 로컬 환경에서는 기본값 사용 가능

## 📖 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase CLI 가이드](https://supabase.com/docs/guides/cli)
- [JavaScript 클라이언트 문서](https://supabase.com/docs/reference/javascript)

## ✅ 체크리스트

- [x] Supabase CLI 설치 및 업데이트
- [x] 프로젝트 초기화 (`supabase init`)
- [x] JavaScript 클라이언트 설치
- [x] 환경 변수 설정
- [x] 데이터베이스 스키마 정의
- [x] 시드 데이터 준비
- [x] 서비스 함수 구현
- [x] NPM 스크립트 추가
- [ ] Docker Desktop 설치 (필요시)
- [ ] 로컬 환경 시작 (`npm run supabase:start`)
- [ ] TypeScript 타입 생성

---

**생성일**: 2025년 9월 18일
**작성자**: Claude AI Assistant
**버전**: 1.0