-- 찜하기(위시리스트) 테이블 생성
CREATE TABLE IF NOT EXISTS wishlists (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL,
  church_id bigint NOT NULL,
  post_type varchar(50) NOT NULL, -- 'community-sharing', 'job-posts', 'music-teams', etc
  post_id bigint NOT NULL,
  post_title varchar(500) NULL, -- 캐시용 제목
  post_description text NULL, -- 캐시용 설명
  post_image_url text NULL, -- 캐시용 첫 번째 이미지
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,

  -- 중복 방지: 사용자가 같은 글을 여러 번 찜할 수 없음
  UNIQUE(user_id, church_id, post_type, post_id)
);

-- 인덱스 생성
CREATE INDEX idx_wishlists_user_church ON wishlists(user_id, church_id);
CREATE INDEX idx_wishlists_post ON wishlists(post_type, post_id);
CREATE INDEX idx_wishlists_created_at ON wishlists(created_at DESC);

-- RLS 정책 설정
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 찜하기만 조회/생성/삭제 가능
CREATE POLICY "Users can view their own wishlists" ON wishlists
  FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::bigint);

CREATE POLICY "Users can insert their own wishlists" ON wishlists
  FOR INSERT WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::bigint);

CREATE POLICY "Users can delete their own wishlists" ON wishlists
  FOR DELETE USING (user_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::bigint);

-- 찜하기 통계를 위한 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW wishlist_stats AS
SELECT
  post_type,
  post_id,
  COUNT(*) as wishlist_count
FROM wishlists
GROUP BY post_type, post_id;