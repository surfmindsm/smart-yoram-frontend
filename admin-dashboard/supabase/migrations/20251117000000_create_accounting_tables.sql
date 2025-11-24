-- 계정과목 테이블 생성
create table public.account_categories (
  id serial not null,
  church_id integer not null,
  name character varying(100) not null,
  type character varying(10) not null check (type in ('income', 'expense')),
  parent_id integer null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  constraint account_categories_pkey primary key (id),
  constraint account_categories_parent_fkey foreign key (parent_id) references public.account_categories(id) on delete set null
);

-- 회계 거래 테이블 생성
create table public.accounting_transactions (
  id serial not null,
  church_id integer not null,
  transaction_date date not null,
  category_id integer not null,
  type character varying(10) not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount >= 0),
  vendor_name character varying(200) null,
  description text not null,
  payment_method character varying(20) null check (payment_method in ('cash', 'card', 'transfer', 'other')),
  receipt_file character varying(500) null,
  input_user_id integer not null,
  created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  constraint accounting_transactions_pkey primary key (id),
  constraint accounting_transactions_category_fkey foreign key (category_id) references public.account_categories(id) on delete restrict
);

-- 인덱스 생성
create index idx_account_categories_church_id on public.account_categories using btree (church_id);
create index idx_account_categories_type on public.account_categories using btree (type);
create index idx_account_categories_parent_id on public.account_categories using btree (parent_id);

create index idx_accounting_transactions_church_id on public.accounting_transactions using btree (church_id);
create index idx_accounting_transactions_date on public.accounting_transactions using btree (transaction_date);
create index idx_accounting_transactions_category_id on public.accounting_transactions using btree (category_id);
create index idx_accounting_transactions_type on public.accounting_transactions using btree (type);

-- RLS 정책 설정
alter table public.account_categories enable row level security;
alter table public.accounting_transactions enable row level security;

-- 계정과목 RLS 정책
create policy "Users can view their church's categories" on public.account_categories
  for select using (true);

create policy "Authenticated users can insert categories" on public.account_categories
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update their church's categories" on public.account_categories
  for update using (true);

create policy "Users can delete their church's categories" on public.account_categories
  for delete using (true);

-- 회계 거래 RLS 정책
create policy "Users can view their church's transactions" on public.accounting_transactions
  for select using (true);

create policy "Authenticated users can insert transactions" on public.accounting_transactions
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update their church's transactions" on public.accounting_transactions
  for update using (true);

create policy "Users can delete their church's transactions" on public.accounting_transactions
  for delete using (true);

-- 기본 계정과목 데이터 삽입 (church_id 0은 공통 템플릿, 각 교회는 첫 사용시 자동 복사됨)
-- 수입 계정과목
insert into public.account_categories (church_id, name, type, display_order) values
(0, '기타수입', 'income', 1),
(0, '임대수입', 'income', 2),
(0, '이자수입', 'income', 3),
(0, '기타', 'income', 4);

-- 지출 계정과목
insert into public.account_categories (church_id, name, type, display_order) values
(0, '사역비', 'expense', 1),
(0, '인건비', 'expense', 2),
(0, '관리비', 'expense', 3),
(0, '시설비', 'expense', 4),
(0, '차량비', 'expense', 5),
(0, '경조사비', 'expense', 6),
(0, '접대비', 'expense', 7),
(0, '기타', 'expense', 8);

-- 사역비 하위 항목
insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '교육', 'expense', id, 1 from public.account_categories where name = '사역비' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '선교', 'expense', id, 2 from public.account_categories where name = '사역비' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '전도', 'expense', id, 3 from public.account_categories where name = '사역비' and church_id = 0;

-- 인건비 하위 항목
insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '급여', 'expense', id, 1 from public.account_categories where name = '인건비' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '퇴직금', 'expense', id, 2 from public.account_categories where name = '인건비' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '4대보험', 'expense', id, 3 from public.account_categories where name = '인건비' and church_id = 0;

-- 관리비 하위 항목
insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '통신비', 'expense', id, 1 from public.account_categories where name = '관리비' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '사무용품', 'expense', id, 2 from public.account_categories where name = '관리비' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '수도광열비', 'expense', id, 3 from public.account_categories where name = '관리비' and church_id = 0;

-- 시설비 하위 항목
insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '수리비', 'expense', id, 1 from public.account_categories where name = '시설비' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '건물관리', 'expense', id, 2 from public.account_categories where name = '시설비' and church_id = 0;

-- 차량비 하위 항목
insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '유류비', 'expense', id, 1 from public.account_categories where name = '차량비' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '수리비', 'expense', id, 2 from public.account_categories where name = '차량비' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '보험', 'expense', id, 3 from public.account_categories where name = '차량비' and church_id = 0;
