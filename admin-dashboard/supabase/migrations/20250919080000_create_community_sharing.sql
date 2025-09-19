-- 무료나눔 테이블 생성
create table public.community_sharing (
  id serial not null,
  church_id integer not null default 9998,
  title character varying(200) not null,
  description text null,
  category character varying(50) null,
  condition character varying(20) null default 'good'::character varying,
  price numeric(10, 2) null default 0,
  is_free boolean null default true,
  location character varying(200) null,
  contact_info character varying(500) null,
  images json null,
  view_count integer null default 0,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  author_id integer null,
  likes integer null default 0,
  status character varying(20) null default 'active'::character varying,
  constraint community_sharing_pkey primary key (id)
);

-- 인덱스 생성
create index IF not exists idx_community_sharing_church_id on public.community_sharing using btree (church_id);
create index IF not exists idx_community_sharing_category on public.community_sharing using btree (category);
create index IF not exists idx_community_sharing_status on public.community_sharing using btree (status);

-- RLS 정책 설정 (행 레벨 보안)
alter table public.community_sharing enable row level security;

-- 읽기 정책: 모든 사용자가 active 상태의 게시글을 볼 수 있음
create policy "Anyone can view active sharing posts" on public.community_sharing
  for select using (status = 'active');

-- 삽입 정책: 인증된 사용자만 게시글을 작성할 수 있음
create policy "Authenticated users can insert sharing posts" on public.community_sharing
  for insert with check (auth.role() = 'authenticated');

-- 업데이트 정책: 작성자만 자신의 게시글을 수정할 수 있음
create policy "Users can update their own sharing posts" on public.community_sharing
  for update using (auth.uid()::text = author_id::text);

-- 삭제 정책: 작성자만 자신의 게시글을 삭제할 수 있음
create policy "Users can delete their own sharing posts" on public.community_sharing
  for delete using (auth.uid()::text = author_id::text);

-- 샘플 데이터 삽입
insert into public.community_sharing (
  church_id, title, description, category, condition, location, contact_info, author_id, status
) values
(6, '아이 옷 나눔합니다', '6개월-1세 아이 옷 30벌 정도 드립니다. 깨끗하게 세탁해서 보관하고 있었어요.', '의류', 'good', '서울 강남구', '문의: 교회 사무실로 연락주세요', 1, 'active'),
(6, '책상 의자 드립니다', '사무용 의자와 책상입니다. 이사하면서 필요없어져서 나눔합니다.', '가구', 'fair', '서울 서초구', '직접 가져가실 분만 연락주세요', 2, 'active'),
(6, '유아용품 나눔', '유모차, 카시트, 아기용품 등 다양하게 있습니다.', '육아용품', 'good', '서울 종로구', '010-0000-0000', 3, 'active');