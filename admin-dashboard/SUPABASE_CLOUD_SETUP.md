# Supabase 클라우드 인스턴스 설정 가이드

## 🎯 목표
교회 관리 시스템을 Supabase 클라우드 인스턴스에 연결하기 위한 설정 가이드입니다.

## 📋 단계별 설정

### 1. Supabase 프로젝트 생성

1. **Supabase 웹사이트 접속**
   - https://supabase.com 방문
   - "Start your project" 클릭

2. **계정 생성/로그인**
   - GitHub, Google, 또는 이메일로 가입/로그인

3. **새 프로젝트 생성**
   - "New project" 클릭
   - Organization 선택 (없으면 새로 생성)
   - 프로젝트 정보 입력:
     - **Name**: `church-admin-dashboard`
     - **Database Password**: 안전한 비밀번호 생성
     - **Region**: 가장 가까운 지역 선택 (예: Northeast Asia)
   - "Create new project" 클릭

4. **프로젝트 생성 완료 대기**
   - 약 2-3분 소요
   - 프로젝트가 준비되면 대시보드로 이동

### 2. API 키 및 URL 확인

프로젝트 대시보드에서:

1. **Settings** → **API** 메뉴로 이동
2. 다음 정보를 복사해 두세요:
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **anon public**: `eyJ...` (긴 JWT 토큰)

### 3. 환경 변수 설정

`.env` 파일을 다음과 같이 업데이트하세요:

```env
REACT_APP_API_URL=https://api.surfmind-team.com/api/v1

# Supabase Configuration (Cloud Instance)
REACT_APP_SUPABASE_URL=https://[your-project-ref].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[your-anon-key]

# Local development
REACT_APP_ENVIRONMENT=development
```

**⚠️ 중요**: 대괄호 `[]`를 제거하고 실제 값으로 교체하세요.

### 4. 데이터베이스 스키마 적용

#### 방법 1: Supabase Dashboard SQL Editor 사용

1. Supabase 대시보드에서 **SQL Editor** 메뉴로 이동
2. "New query" 클릭
3. `supabase/migrations/20250918000001_initial_schema.sql` 파일의 내용을 복사
4. SQL Editor에 붙여넣기
5. "Run" 버튼 클릭

#### 방법 2: CLI 사용 (토큰 있는 경우)

```bash
# Supabase에 로그인 (액세스 토큰 필요)
supabase login --token [your-access-token]

# 프로젝트 연결
supabase link --project-ref [your-project-ref]

# 마이그레이션 적용
supabase db push
```

### 5. 시드 데이터 삽입

1. SQL Editor에서 새 쿼리 생성
2. `supabase/seed.sql` 파일의 내용을 복사하여 실행
3. 샘플 데이터가 정상적으로 삽입되었는지 확인

### 6. 연결 테스트

개발 서버를 재시작하고 연결을 테스트합니다:

```bash
# 개발 서버 재시작
npm start
```

브라우저 콘솔에서 Supabase 연결 오류가 없는지 확인합니다.

## 🔐 보안 설정

### Row Level Security (RLS) 확인

Supabase 대시보드에서:

1. **Authentication** → **Policies** 메뉴 확인
2. 각 테이블에 대한 RLS 정책이 적용되었는지 확인
3. 필요시 추가 정책 설정

### 환경 변수 보안

- `.env` 파일을 `.gitignore`에 추가
- 프로덕션에서는 환경 변수를 안전하게 관리
- `service_role` 키는 절대 클라이언트에서 사용하지 않기

## 📊 데이터베이스 구조 확인

Supabase 대시보드의 **Table Editor**에서 다음 테이블들이 생성되었는지 확인:

- ✅ `profiles` - 사용자 프로필
- ✅ `churches` - 교회 정보
- ✅ `music_team_recruitments` - 음악팀 모집
- ✅ `job_postings` - 채용 공고
- ✅ `church_news` - 교회 소식
- ✅ `sharing_posts` - 나눔 게시글

## 🔄 타입 생성 (선택사항)

데이터베이스 스키마에서 TypeScript 타입을 자동 생성:

```bash
# CLI가 연결된 경우
supabase gen types typescript --linked > src/types/database.types.ts
```

## 🚀 배포 준비

### Vercel 환경 변수 설정

Vercel에 배포할 때 환경 변수 추가:

```
REACT_APP_SUPABASE_URL=https://[your-project-ref].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[your-anon-key]
```

### Netlify 환경 변수 설정

Netlify에 배포할 때도 동일하게 환경 변수 설정

## 🛠 유용한 CLI 명령어

```bash
# 프로젝트 상태 확인
supabase projects list

# 로컬 설정 확인
supabase status

# 원격 데이터베이스와 동기화
supabase db pull

# 함수 배포
supabase functions deploy

# 로그 확인
supabase logs
```

## 🆘 문제 해결

### 연결 오류 시

1. **환경 변수 확인**
   - URL과 키가 정확한지 확인
   - 따옴표나 공백이 포함되지 않았는지 확인

2. **CORS 에러 시**
   - Supabase 프로젝트 설정에서 허용된 도메인 확인
   - 로컬 개발시 `http://localhost:3000` 추가

3. **RLS 오류 시**
   - 테이블의 RLS 정책 확인
   - 익명 사용자 접근 권한 확인

### 마이그레이션 오류 시

- SQL 구문 오류가 있는지 확인
- 이미 존재하는 테이블/인덱스인지 확인
- Supabase 대시보드에서 로그 확인

## 📞 지원

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

**⚡ 빠른 시작 체크리스트**

- [ ] Supabase 프로젝트 생성
- [ ] URL과 anon 키 복사
- [ ] `.env` 파일 업데이트
- [ ] 초기 스키마 SQL 실행
- [ ] 시드 데이터 삽입
- [ ] 개발 서버 재시작
- [ ] 연결 테스트 완료

이제 Supabase 클라우드 인스턴스가 준비되었습니다! 🎉