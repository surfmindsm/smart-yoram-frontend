-- 찬양팀 모집 테이블 생성
create table public.community_music_teams (
  id serial not null,
  title character varying(200) not null,
  team_name character varying(100) not null,
  worship_type character varying(50) not null,
  instruments_needed json null,
  positions_needed text null,
  experience_required character varying(12) not null,
  practice_location character varying(200) not null,
  practice_schedule character varying(200) not null,
  commitment character varying(100) null,
  description text not null,
  requirements text null,
  benefits text null,
  contact_method character varying(7) not null,
  contact_info character varying(100) not null,
  current_members integer null,
  target_members integer null,
  author_id integer not null,
  church_id integer not null,
  likes integer null default 0,
  applicants_count integer null default 0,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  view_count integer null default 0,
  status character varying(20) null default 'active'::character varying,
  team_types jsonb null,
  constraint community_music_teams_pkey primary key (id)
);

-- 인덱스 생성
create index IF not exists idx_community_music_teams_church_id on public.community_music_teams using btree (church_id);
create index IF not exists idx_community_music_teams_author_id on public.community_music_teams using btree (author_id);
create index IF not exists idx_community_music_teams_created_at on public.community_music_teams using btree (created_at);
create index IF not exists idx_community_music_teams_status on public.community_music_teams using btree (status);
create index IF not exists idx_community_music_teams_worship_type on public.community_music_teams using btree (worship_type);
create index IF not exists idx_community_music_teams_team_types on public.community_music_teams using gin (team_types);

-- RLS 정책 설정 (행 레벨 보안)
alter table public.community_music_teams enable row level security;

-- 읽기 정책: 모든 사용자가 active 상태의 찬양팀 모집을 볼 수 있음
create policy "Anyone can view active music team posts" on public.community_music_teams
  for select using (status = 'active');

-- 삽입 정책: 인증된 사용자만 찬양팀 모집을 작성할 수 있음
create policy "Authenticated users can insert music team posts" on public.community_music_teams
  for insert with check (auth.role() = 'authenticated');

-- 업데이트 정책: 작성자만 자신의 찬양팀 모집을 수정할 수 있음
create policy "Users can update their own music team posts" on public.community_music_teams
  for update using (auth.uid()::text = author_id::text);

-- 삭제 정책: 작성자만 자신의 찬양팀 모집을 삭제할 수 있음
create policy "Users can delete their own music team posts" on public.community_music_teams
  for delete using (auth.uid()::text = author_id::text);

-- 샘플 데이터 삽입
insert into public.community_music_teams (
  church_id, title, team_name, worship_type, instruments_needed, positions_needed,
  experience_required, practice_location, practice_schedule, commitment, description,
  requirements, benefits, contact_method, contact_info, current_members, target_members,
  author_id, status
) values
(6, '주일 찬양팀 기타리스트 모집', '은혜찬양팀', '현대예배', '["기타", "베이스"]', '기타리스트 1명', '중급', '교회 지하 연습실', '매주 토요일 오후 2시', '최소 6개월', '주일 예배를 위한 찬양팀 기타리스트를 모집합니다.', '기타 연주 가능, 찬양 사역 경험', '식비 제공, 교통비 지원', '전화', '010-0000-0000', 4, 6, 1, 'active'),
(6, '어쿠스틱 찬양팀 보컬 모집', '어쿠스틱팀', '어쿠스틱', '["통기타", "카혼"]', '리드보컬 1명', '고급', '교회 2층 음악실', '매주 수요일 저녁 7시', '1년 이상', '어쿠스틱 스타일의 찬양팀에서 함께할 보컬을 찾습니다.', '찬양 인도 경험, 화음 가능', '연 2회 수련회 참석', '이메일', 'music@church.com', 3, 5, 2, 'active'),
(6, '전통찬송 오르간 연주자 모집', '전통찬양대', '전통예배', '["오르간", "피아노"]', '오르간 연주자 1명', '고급', '교회 본당', '매주 일요일 오전 9시', '장기', '전통 찬송가를 위한 오르간 연주자를 모집합니다.', '오르간 연주 가능, 찬송가 숙지', '예배 참석 우선권', '문자', '010-1111-1111', 8, 10, 3, 'active');