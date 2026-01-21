-- account_categories 테이블에 is_offering 컬럼 추가
-- 헌금 계정과목 여부를 표시하는 불리언 필드
alter table public.account_categories
add column if not exists is_offering boolean not null default false;

-- 인덱스 추가 (헌금 과목 필터링 성능 향상)
create index if not exists idx_account_categories_is_offering
on public.account_categories using btree (is_offering);

-- 복합 인덱스: 헌금 + 수입 타입
create index if not exists idx_account_categories_offering_income
on public.account_categories using btree (church_id, type, is_offering)
where type = 'income' and is_offering = true;

-- 주석 추가
comment on column public.account_categories.is_offering is '헌금 계정과목 여부 (true: 헌금 관리 화면에 표시됨)';
