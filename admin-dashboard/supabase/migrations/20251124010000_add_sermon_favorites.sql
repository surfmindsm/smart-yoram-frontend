-- =====================================================
-- 명설교 즐겨찾기 기능 추가
-- =====================================================

-- sermon_favorites 테이블 생성
CREATE TABLE IF NOT EXISTS public.sermon_favorites (
  id BIGSERIAL PRIMARY KEY,
  sermon_id UUID NOT NULL REFERENCES public.sermons(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,                           -- 사용자 ID
  church_id INTEGER,                                   -- 교회 ID (선택)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 한 사용자가 같은 설교를 중복으로 즐겨찾기 할 수 없도록 UNIQUE 제약
  UNIQUE(sermon_id, user_id)
);

-- 인덱스 생성
CREATE INDEX idx_sermon_favorites_sermon_id ON public.sermon_favorites(sermon_id);
CREATE INDEX idx_sermon_favorites_user_id ON public.sermon_favorites(user_id);
CREATE INDEX idx_sermon_favorites_created_at ON public.sermon_favorites(created_at DESC);

-- RLS 정책 설정
ALTER TABLE public.sermon_favorites ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 즐겨찾기만 조회 가능
DROP POLICY IF EXISTS "sermon_favorites_select_policy" ON public.sermon_favorites;
CREATE POLICY "sermon_favorites_select_policy" ON public.sermon_favorites
  FOR SELECT
  USING (true);  -- 개발 환경: 모든 조회 허용 (프로덕션에서는 user_id 체크 필요)

-- 즐겨찾기 추가
DROP POLICY IF EXISTS "sermon_favorites_insert_policy" ON public.sermon_favorites;
CREATE POLICY "sermon_favorites_insert_policy" ON public.sermon_favorites
  FOR INSERT
  WITH CHECK (true);

-- 즐겨찾기 삭제 (자신의 즐겨찾기만 삭제 가능)
DROP POLICY IF EXISTS "sermon_favorites_delete_policy" ON public.sermon_favorites;
CREATE POLICY "sermon_favorites_delete_policy" ON public.sermon_favorites
  FOR DELETE
  USING (true);  -- 개발 환경: 모든 삭제 허용 (프로덕션에서는 user_id 체크 필요)

-- 즐겨찾기 개수를 sermons 테이블에 추가 (선택사항)
ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;

-- 즐겨찾기 개수 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_sermon_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.sermons
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.sermon_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.sermons
    SET favorite_count = GREATEST(0, favorite_count - 1)
    WHERE id = OLD.sermon_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS sermon_favorite_count_trigger ON public.sermon_favorites;
CREATE TRIGGER sermon_favorite_count_trigger
  AFTER INSERT OR DELETE ON public.sermon_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_sermon_favorite_count();

-- 기존 데이터에 대한 favorite_count 초기화
UPDATE public.sermons s
SET favorite_count = (
  SELECT COUNT(*)
  FROM public.sermon_favorites f
  WHERE f.sermon_id = s.id
);
