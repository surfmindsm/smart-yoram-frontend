-- offerings 테이블에 accounting_transaction_id 컬럼 추가
alter table public.offerings
add column if not exists accounting_transaction_id integer null;

-- 외래키 제약조건 추가
alter table public.offerings
add constraint offerings_accounting_transaction_fkey
foreign key (accounting_transaction_id)
references public.accounting_transactions(id)
on delete set null;

-- 인덱스 추가
create index if not exists idx_offerings_accounting_transaction_id
on public.offerings using btree (accounting_transaction_id);

-- 헌금 계정과목을 템플릿에 추가
-- 헌금 상위 카테고리
insert into public.account_categories (church_id, name, type, display_order)
values (0, '헌금', 'income', 0);

-- 헌금 하위 항목들
insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '십일조', 'income', id, 1 from public.account_categories where name = '헌금' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '주일헌금', 'income', id, 2 from public.account_categories where name = '헌금' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '감사헌금', 'income', id, 3 from public.account_categories where name = '헌금' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '선교헌금', 'income', id, 4 from public.account_categories where name = '헌금' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '건축헌금', 'income', id, 5 from public.account_categories where name = '헌금' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '절기헌금', 'income', id, 6 from public.account_categories where name = '헌금' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '특별헌금', 'income', id, 7 from public.account_categories where name = '헌금' and church_id = 0;

insert into public.account_categories (church_id, name, type, parent_id, display_order)
select 0, '기타헌금', 'income', id, 8 from public.account_categories where name = '헌금' and church_id = 0;
