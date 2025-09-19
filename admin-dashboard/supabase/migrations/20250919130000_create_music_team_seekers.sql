-- 찬양팀 구직 테이블 생성
create table public.music_team_seekers (
  id serial not null,
  title character varying(200) not null,
  team_name character varying(100) null,
  instrument character varying(50) not null,
  experience text null,
  portfolio character varying(500) null,
  preferred_location text[] null,
  available_days text[] null,
  available_time character varying(100) null,
  contact_phone character varying(20) not null,
  contact_email character varying(100) null,
  author_id integer not null,
  author_name character varying(100) not null,
  church_id integer null,
  church_name character varying(100) null,
  likes integer null default 0,
  matches integer null default 0,
  applications integer null default 0,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  view_count integer null default 0,
  status character varying(20) null default 'active'::character varying,
  constraint music_team_seekers_pkey primary key (id)
);

-- 인덱스 생성
create index IF not exists idx_music_seekers_instrument on public.music_team_seekers using btree (instrument);
create index IF not exists idx_music_seekers_church on public.music_team_seekers using btree (church_id);
create index IF not exists idx_music_seekers_location on public.music_team_seekers using gin (preferred_location);
create index IF not exists idx_music_seekers_days on public.music_team_seekers using gin (available_days);
create index IF not exists idx_music_seekers_created on public.music_team_seekers using btree (created_at desc);
create index IF not exists idx_music_seekers_author on public.music_team_seekers using btree (author_id);
create index IF not exists idx_music_team_seekers_status on public.music_team_seekers using btree (status);

-- RLS 정책 설정 (행 레벨 보안)
alter table public.music_team_seekers enable row level security;

-- 읽기 정책: 모든 사용자가 active 상태의 찬양팀 구직을 볼 수 있음
create policy "Anyone can view active music seekers" on public.music_team_seekers
  for select using (status = 'active');

-- 삽입 정책: 인증된 사용자만 찬양팀 구직을 작성할 수 있음
create policy "Authenticated users can insert music seekers" on public.music_team_seekers
  for insert with check (auth.role() = 'authenticated');

-- 업데이트 정책: 작성자만 자신의 찬양팀 구직을 수정할 수 있음
create policy "Users can update their own music seekers" on public.music_team_seekers
  for update using (auth.uid()::text = author_id::text);

-- 삭제 정책: 작성자만 자신의 찬양팀 구직을 삭제할 수 있음
create policy "Users can delete their own music seekers" on public.music_team_seekers
  for delete using (auth.uid()::text = author_id::text);

-- 샘플 데이터 삽입
insert into public.music_team_seekers (
  title, team_name, instrument, experience, portfolio, preferred_location, available_days,
  available_time, contact_phone, contact_email, author_id, author_name, church_id, church_name, status
) values
('기타리스트 구합니다', '워십팀', '기타', '5년 경력, 다양한 장르 연주 가능', 'youtube.com/my-guitar', '{"서울 강남구", "서울 서초구"}', '{"토요일", "일요일"}', '주말 오후', '010-0000-0000', 'guitar@email.com', 1, '김기타', 6, '성광교회', 'active'),
('피아노 반주자입니다', '찬양대', '피아노', '클래식 전공, 찬송가 반주 경험 많음', 'blog.naver.com/piano', '{"서울 종로구", "서울 중구"}', '{"수요일", "일요일"}', '저녁 시간', '010-1111-1111', 'piano@email.com', 2, '이피아노', 6, '성광교회', 'active'),
('드럼 연주자 찾아요', null, '드럼', '밴드 활동 3년, 현대찬양 위주', null, '{"서울 전체"}', '{"금요일", "토요일", "일요일"}', '자유롭게', '010-2222-2222', 'drum@email.com', 3, '박드럼', 9998, null, 'active');