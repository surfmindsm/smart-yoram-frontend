-- 예산 테이블 생성
create table public.budgets (
  id serial not null,
  church_id integer not null,
  year integer not null,
  month integer null, -- NULL이면 연간 예산, 1-12면 월별 예산
  category_id integer not null,
  type character varying(10) not null check (type in ('income', 'expense')),
  budgeted_amount numeric(15, 2) not null check (budgeted_amount >= 0),
  notes text null,
  created_by integer null,
  created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  constraint budgets_pkey primary key (id),
  constraint budgets_category_fkey foreign key (category_id) references public.account_categories(id) on delete restrict,
  constraint budgets_unique_entry unique (church_id, year, month, category_id)
);

-- 예산 조정 이력 테이블
create table public.budget_adjustments (
  id serial not null,
  budget_id integer not null,
  previous_amount numeric(15, 2) not null,
  new_amount numeric(15, 2) not null,
  reason text null,
  adjusted_by integer null,
  adjusted_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  constraint budget_adjustments_pkey primary key (id),
  constraint budget_adjustments_budget_fkey foreign key (budget_id) references public.budgets(id) on delete cascade
);

-- 인덱스 생성
create index idx_budgets_church_id on public.budgets using btree (church_id);
create index idx_budgets_year on public.budgets using btree (year);
create index idx_budgets_month on public.budgets using btree (month);
create index idx_budgets_category_id on public.budgets using btree (category_id);
create index idx_budgets_type on public.budgets using btree (type);
create index idx_budget_adjustments_budget_id on public.budget_adjustments using btree (budget_id);

-- RLS 정책 설정
alter table public.budgets enable row level security;
alter table public.budget_adjustments enable row level security;

-- 예산 RLS 정책
create policy "Users can view their church's budgets" on public.budgets
  for select using (true);

create policy "Authenticated users can insert budgets" on public.budgets
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update their church's budgets" on public.budgets
  for update using (true);

create policy "Users can delete their church's budgets" on public.budgets
  for delete using (true);

-- 예산 조정 이력 RLS 정책
create policy "Users can view their church's budget adjustments" on public.budget_adjustments
  for select using (true);

create policy "Authenticated users can insert budget adjustments" on public.budget_adjustments
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update their church's budget adjustments" on public.budget_adjustments
  for update using (true);

create policy "Users can delete their church's budget adjustments" on public.budget_adjustments
  for delete using (true);

-- 예산 업데이트 시 updated_at 자동 갱신 함수
create or replace function update_budgets_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 트리거 생성
create trigger budgets_updated_at_trigger
  before update on public.budgets
  for each row
  execute function update_budgets_updated_at();
