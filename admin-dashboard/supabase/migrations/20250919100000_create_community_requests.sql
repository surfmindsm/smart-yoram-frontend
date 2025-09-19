-- 물품요청 테이블 생성
create table public.community_requests (
  id serial not null,
  church_id integer not null default 9998,
  title character varying(200) not null,
  description text null,
  category character varying(50) null,
  urgency character varying(20) null default 'normal'::character varying,
  location character varying(200) null,
  contact_info character varying(500) null,
  reward_type character varying(20) null default 'none'::character varying,
  reward_amount numeric(10, 2) null,
  images json null,
  view_count integer null default 0,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  author_id integer null,
  likes integer null default 0,
  status character varying(20) null default 'active'::character varying,
  constraint community_requests_pkey primary key (id)
);

-- 인덱스 생성
create index IF not exists idx_community_requests_church_id on public.community_requests using btree (church_id);
create index IF not exists idx_community_requests_category on public.community_requests using btree (category);
create index IF not exists ix_community_requests_id on public.community_requests using btree (id);
create index IF not exists ix_community_requests_author_id on public.community_requests using btree (author_id);
create index IF not exists ix_community_requests_church_id on public.community_requests using btree (church_id);
create index IF not exists ix_community_requests_created_at on public.community_requests using btree (created_at);
create index IF not exists idx_community_requests_status on public.community_requests using btree (status);

-- RLS 정책 설정 (행 레벨 보안)
alter table public.community_requests enable row level security;

-- 읽기 정책: 모든 사용자가 active 상태의 요청을 볼 수 있음
create policy "Anyone can view active request posts" on public.community_requests
  for select using (status = 'active');

-- 삽입 정책: 인증된 사용자만 요청을 작성할 수 있음
create policy "Authenticated users can insert request posts" on public.community_requests
  for insert with check (auth.role() = 'authenticated');

-- 업데이트 정책: 작성자만 자신의 요청을 수정할 수 있음
create policy "Users can update their own request posts" on public.community_requests
  for update using (auth.uid()::text = author_id::text);

-- 삭제 정책: 작성자만 자신의 요청을 삭제할 수 있음
create policy "Users can delete their own request posts" on public.community_requests
  for delete using (auth.uid()::text = author_id::text);

-- 샘플 데이터 삽입
insert into public.community_requests (
  church_id, title, description, category, urgency, location, contact_info, author_id, status
) values
(6, '책상 하나 구해요', '아이가 공부할 책상이 필요합니다. 크기는 상관없어요.', '가구', 'normal', '서울 강남구', '문의: 교회 사무실로 연락주세요', 1, 'active'),
(6, '이사할 때 도움 요청', '다음 주 토요일에 이사 예정인데 도움 주실 분 구합니다.', '서비스', 'urgent', '서울 서초구', '010-0000-0000', 2, 'active'),
(6, '아이 돌봄 요청', '주일 예배 시간에 아이 돌봐주실 분 찾습니다.', '서비스', 'normal', '서울 종로구', '010-1111-1111', 3, 'active');