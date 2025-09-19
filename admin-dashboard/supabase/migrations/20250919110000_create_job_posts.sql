-- 채용공고 테이블 생성
create table public.job_posts (
  id serial not null,
  church_id integer not null default 9998,
  title character varying(200) not null,
  description text null,
  company_name character varying(200) null,
  job_type character varying(50) null,
  employment_type character varying(50) null,
  location character varying(200) null,
  salary_range character varying(100) null,
  requirements text null,
  contact_info character varying(500) null,
  application_deadline date null,
  view_count integer null default 0,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  author_id integer not null,
  likes integer null default 0,
  status character varying(20) null default 'active'::character varying,
  constraint job_posts_pkey primary key (id)
);

-- 인덱스 생성
create index IF not exists idx_job_posts_church_id on public.job_posts using btree (church_id);
create index IF not exists idx_job_posts_job_type on public.job_posts using btree (job_type);
create index IF not exists idx_job_posts_status on public.job_posts using btree (status);
create index IF not exists ix_job_posts_author_id on public.job_posts using btree (author_id);
create index IF not exists ix_job_posts_created_at on public.job_posts using btree (created_at);

-- RLS 정책 설정 (행 레벨 보안)
alter table public.job_posts enable row level security;

-- 읽기 정책: 모든 사용자가 active 상태의 채용공고를 볼 수 있음
create policy "Anyone can view active job posts" on public.job_posts
  for select using (status = 'active');

-- 삽입 정책: 인증된 사용자만 채용공고를 작성할 수 있음
create policy "Authenticated users can insert job posts" on public.job_posts
  for insert with check (auth.role() = 'authenticated');

-- 업데이트 정책: 작성자만 자신의 채용공고를 수정할 수 있음
create policy "Users can update their own job posts" on public.job_posts
  for update using (auth.uid()::text = author_id::text);

-- 삭제 정책: 작성자만 자신의 채용공고를 삭제할 수 있음
create policy "Users can delete their own job posts" on public.job_posts
  for delete using (auth.uid()::text = author_id::text);

-- 샘플 데이터 삽입
insert into public.job_posts (
  church_id, title, description, company_name, job_type, employment_type, location,
  salary_range, requirements, contact_info, author_id, status
) values
(6, '교회 사무원 모집', '교회 행정 업무를 담당할 사무원을 모집합니다.', '○○교회', '사무직', '정규직', '서울 강남구', '연봉 3000-3500만원', '컴퓨터 활용 가능, 성실한 분', '교회 사무실로 연락주세요', 1, 'active'),
(6, '카페 아르바이트생 모집', '교회 내 카페에서 근무할 아르바이트생을 모집합니다.', '카페베데스다', '서비스직', '아르바이트', '서울 서초구', '시급 10,000원', '밝고 친절한 성격', '010-0000-0000', 2, 'active'),
(6, '찬양팀 리더 모집', '주일 찬양을 인도할 찬양팀 리더를 모집합니다.', '○○교회', '예배사역', '정규직', '서울 종로구', '협의', '악기 연주 가능, 찬양 사역 경험', '010-1111-1111', 3, 'active');