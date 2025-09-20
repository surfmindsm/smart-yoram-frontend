-- 음악팀 지원자 테이블에 portfolio_file 필드 추가
ALTER TABLE public.music_team_seekers
ADD COLUMN portfolio_file TEXT NULL;

COMMENT ON COLUMN public.music_team_seekers.portfolio_file IS '포트폴리오 파일 (Base64 인코딩된 데이터)';