# 명설교 기능 설정 가이드

## 📋 백엔드 담당자용 가이드

이 문서는 명설교 기능의 데이터베이스 설정 및 배포 과정을 안내합니다.

---

## 1️⃣ 데이터베이스 마이그레이션

### Supabase Dashboard에서 실행

1. **Supabase Dashboard** 접속
2. **SQL Editor** 메뉴로 이동
3. **New Query** 클릭
4. 아래 마이그레이션 파일 내용 복사 & 붙여넣기
5. **Run** 버튼 클릭

**마이그레이션 파일 위치:**
```
/supabase/migrations/20251124000000_create_sermons_tables.sql (필수)
/supabase/migrations/20251124010000_add_sermon_favorites.sql (즐겨찾기 기능, 선택)
```

**참고:** 즐겨찾기 기능이 필요한 경우에만 두 번째 마이그레이션을 실행하세요.

### CLI로 실행 (선택)

```bash
# Supabase CLI 설치 (없는 경우)
npm install -g supabase

# 로컬 Supabase 시작
supabase start

# 마이그레이션 실행
supabase db push

# 또는 특정 파일 실행
supabase db reset
```

---

## 2️⃣ 생성되는 테이블

### 📊 테이블 목록

1. **sermon_categories** - 카테고리 관리
2. **sermons** - 설교 정보 (메인)
3. **sermon_views** - 조회수 로그
4. **sermon_audit_logs** - 관리자 작업 로그
5. **sermon_favorites** - 사용자별 즐겨찾기 (선택 기능)

### 🔐 RLS (Row Level Security) 정책

모든 테이블에 RLS가 활성화되며, 다음 정책이 적용됩니다:

**sermons 테이블:**
- SELECT: 모든 사용자 (활성화되고 발행된 것만)
- INSERT/UPDATE/DELETE: 인증된 사용자 (관리자 전용)

**sermon_views 테이블:**
- INSERT: 모든 사용자
- SELECT: 인증된 사용자

**sermon_audit_logs 테이블:**
- INSERT: 인증된 사용자
- SELECT: 인증된 사용자

---

## 3️⃣ Edge Function 배포 (선택)

Edge Function을 사용하려면 배포가 필요합니다.

### 배포 방법

```bash
# 모든 Edge Functions 배포
supabase functions deploy

# 특정 Function만 배포
supabase functions deploy sermons
```

### Edge Function 위치
```
/supabase/functions/sermons/index.ts
```

### Edge Function 엔드포인트

배포 후 다음 URL로 접근 가능:
```
https://YOUR_PROJECT.supabase.co/functions/v1/sermons
```

**참고:** 앱 개발자는 Supabase 클라이언트로 직접 쿼리하는 것을 권장하므로 Edge Function 배포는 선택사항입니다.

---

## 4️⃣ 초기 데이터 확인

마이그레이션 실행 후 자동으로 생성되는 데이터:

### 기본 카테고리 (5개)
1. 주일설교
2. 수요예배
3. 금요기도회
4. 특별집회
5. 새벽기도회

### 샘플 설교 (2개)
- 은혜와 진리가 충만하신 예수
- 십자가의 능력

**확인 쿼리:**
```sql
-- 카테고리 확인
SELECT * FROM sermon_categories ORDER BY display_order;

-- 설교 확인
SELECT * FROM sermons ORDER BY created_at DESC;
```

---

## 5️⃣ 앱 개발자에게 전달할 정보

### Supabase 연결 정보

**필수 정보:**
- Supabase URL: `https://YOUR_PROJECT.supabase.co`
- Anon Key: `YOUR_ANON_KEY`

**전달 방법:**
```
# .env 파일 예제
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 필수 문서

앱 개발자에게 다음 문서를 전달하세요:

1. **README.md** - 전체 개요
2. **sermons-quick-start.md** - 빠른 시작 가이드
3. **sermons-api-guide.md** - 상세 API 문서

**문서 위치:** `/docs/api/`

---

## 6️⃣ 관리 페이지 접근

### 시스템 관리자 로그인

1. Admin Dashboard 로그인
2. "보안 & 시스템" 메뉴 클릭
3. "명설교 관리" 선택

### 관리 기능

- ✅ 설교 추가/수정/삭제
- ✅ 유튜브 URL 입력 시 자동 비디오 ID 추출
- ✅ 썸네일 자동 생성
- ✅ 카테고리 설정
- ✅ 추천 설교 설정
- ✅ 활성화/비활성화
- ✅ 태그 관리
- ✅ 표시 순서 관리

---

## 7️⃣ 데이터베이스 백업

### Supabase 자동 백업

Supabase는 자동으로 백업을 수행하지만, 중요한 변경 전에는 수동 백업을 권장합니다.

```bash
# 테이블 백업
supabase db dump -f backup.sql

# 특정 테이블만 백업
pg_dump -h YOUR_DB_HOST -U postgres -t sermons -t sermon_categories > sermons_backup.sql
```

---

## 8️⃣ 문제 해결

### 마이그레이션 실패 시

**에러: "table already exists"**

기존 테이블이 있는 경우입니다. 마이그레이션 파일의 상단 DROP 문을 실행하세요:

```sql
DROP TABLE IF EXISTS public.sermon_audit_logs CASCADE;
DROP TABLE IF EXISTS public.sermon_views CASCADE;
DROP TABLE IF EXISTS public.sermons CASCADE;
DROP TABLE IF EXISTS public.sermon_categories CASCADE;
```

**주의:** 기존 데이터가 모두 삭제됩니다!

### RLS 정책 오류

정책이 중복되면 에러가 발생합니다. 다음 명령으로 기존 정책을 삭제하세요:

```sql
-- 모든 정책 삭제
DROP POLICY IF EXISTS "sermon_categories_select_policy" ON sermon_categories;
DROP POLICY IF EXISTS "sermons_select_policy" ON sermons;
-- ... (기타 정책들)
```

### 트리거 오류

트리거가 중복되면 에러가 발생합니다:

```sql
-- 트리거 삭제
DROP TRIGGER IF EXISTS sermon_categories_updated_at_trigger ON sermon_categories;
DROP TRIGGER IF EXISTS sermons_updated_at_trigger ON sermons;
DROP TRIGGER IF EXISTS sermon_view_count_trigger ON sermon_views;
```

---

## 9️⃣ 성능 모니터링

### 쿼리 성능 확인

Supabase Dashboard에서 쿼리 성능을 모니터링하세요:

1. **Database** → **Query Performance**
2. 느린 쿼리 확인
3. 필요시 인덱스 추가

### 인덱스 확인

마이그레이션으로 다음 인덱스가 자동 생성됩니다:

```sql
-- sermons 테이블 인덱스
CREATE INDEX idx_sermons_is_active ON sermons(is_active);
CREATE INDEX idx_sermons_category_id ON sermons(category_id);
CREATE INDEX idx_sermons_sermon_date ON sermons(sermon_date DESC);
CREATE INDEX idx_sermons_display_order ON sermons(display_order);
CREATE INDEX idx_sermons_is_featured ON sermons(is_featured);
CREATE INDEX idx_sermons_created_at ON sermons(created_at DESC);
CREATE INDEX idx_sermons_published_at ON sermons(published_at DESC);
CREATE INDEX idx_sermons_tags ON sermons USING GIN(tags);
```

---

## 🔟 보안 체크리스트

### 배포 전 확인사항

- [ ] RLS 정책이 모든 테이블에 활성화되어 있는가?
- [ ] Anon Key만으로 관리 기능(INSERT/UPDATE/DELETE)이 불가능한가?
- [ ] 활성화되지 않은 설교(`is_active=false`)가 일반 사용자에게 노출되지 않는가?
- [ ] 발행 예정(`published_at > NOW()`) 설교가 노출되지 않는가?
- [ ] 조회수 로그에 민감한 정보(IP 주소 등)가 적절히 보호되는가?

### 테스트 방법

```typescript
// 일반 사용자 권한으로 테스트
const { data, error } = await supabase
  .from('sermons')
  .insert({
    title: 'Test',
    youtube_url: 'https://youtube.com/watch?v=test'
  });

// error가 발생해야 정상 (RLS 정책으로 차단됨)
console.log(error); // "new row violates row-level security policy"
```

---

## 📞 지원

### 기술 문의
- Supabase 문서: https://supabase.com/docs
- PostgreSQL 문서: https://www.postgresql.org/docs/

### 내부 문의
- 백엔드 팀
- 시스템 관리자

---

**작성일:** 2024-11-24
**버전:** 1.0
**담당자:** 백엔드 개발팀
