-- =====================================================
-- 명설교 (Sermons) 전체 스키마
-- =====================================================
-- 시스템 관리자가 관리하는 명설교 기능
-- 모바일 앱 전체 사용자에게 제공되는 유튜브 설교 영상 관리

-- =====================================================
-- 기존 테이블이 있다면 삭제 (주의: 데이터가 모두 삭제됩니다!)
-- =====================================================
-- 처음 실행하거나 깨끗하게 재생성하려면 아래 주석을 해제하세요
DROP TABLE IF EXISTS public.sermon_audit_logs CASCADE;
DROP TABLE IF EXISTS public.sermon_views CASCADE;
DROP TABLE IF EXISTS public.sermons CASCADE;
DROP TABLE IF EXISTS public.sermon_categories CASCADE;

-- =====================================================
-- 1. sermon_categories 테이블 (카테고리 관리)
-- =====================================================
CREATE TABLE public.sermon_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,                 -- 카테고리 이름 (예: 주일설교, 수요예배)
  description TEXT,                                  -- 카테고리 설명
  display_order INTEGER DEFAULT 0,                   -- 표시 순서
  is_active BOOLEAN DEFAULT true,                    -- 활성화 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 카테고리 삽입
INSERT INTO public.sermon_categories (name, description, display_order) VALUES
  ('주일설교', '주일 낮 예배 설교', 1),
  ('수요예배', '수요일 저녁 예배 설교', 2),
  ('금요기도회', '금요일 기도회 설교', 3),
  ('특별집회', '부흥회, 사경회 등 특별 집회', 4),
  ('새벽기도회', '새벽 기도회 설교', 5);

CREATE INDEX idx_sermon_categories_active ON public.sermon_categories(is_active);
CREATE INDEX idx_sermon_categories_order ON public.sermon_categories(display_order);

-- =====================================================
-- 2. sermons 테이블 (개선된 버전)
-- =====================================================
CREATE TABLE public.sermons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,                       -- 설교 제목
  youtube_url TEXT NOT NULL,                         -- 유튜브 URL
  youtube_video_id VARCHAR(20) NOT NULL,             -- 유튜브 비디오 ID
  preacher_name VARCHAR(100),                        -- 설교자 이름
  description TEXT,                                   -- 설교 설명/요약
  scripture_reference VARCHAR(200),                   -- 본문 말씀 (예: "요한복음 3:16-21")
  thumbnail_url TEXT,                                 -- 썸네일 URL
  duration_seconds INTEGER,                           -- 영상 길이 (초)
  view_count INTEGER DEFAULT 0,                       -- 조회수
  category_id INTEGER REFERENCES public.sermon_categories(id), -- 카테고리 FK
  category VARCHAR(50),                               -- 레거시 호환용 카테고리 (선택)
  sermon_date DATE,                                   -- 설교 날짜
  tags TEXT[],                                        -- 태그 배열
  language VARCHAR(10) DEFAULT 'ko',                  -- 언어 코드 (ko, en, zh 등)
  is_featured BOOLEAN DEFAULT false,                  -- 추천 설교 여부
  display_order INTEGER DEFAULT 0,                    -- 표시 순서
  is_active BOOLEAN DEFAULT true,                     -- 활성화 여부
  published_at TIMESTAMP WITH TIME ZONE,              -- 발행 시간 (예약 발행 기능)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER,                                 -- 등록자 (user_id)
  updated_by INTEGER                                  -- 수정자 (user_id)
);

-- 인덱스 생성
CREATE INDEX idx_sermons_is_active ON public.sermons(is_active);
CREATE INDEX idx_sermons_category_id ON public.sermons(category_id);
CREATE INDEX idx_sermons_sermon_date ON public.sermons(sermon_date DESC);
CREATE INDEX idx_sermons_display_order ON public.sermons(display_order);
CREATE INDEX idx_sermons_is_featured ON public.sermons(is_featured);
CREATE INDEX idx_sermons_created_at ON public.sermons(created_at DESC);
CREATE INDEX idx_sermons_published_at ON public.sermons(published_at DESC);
CREATE INDEX idx_sermons_tags ON public.sermons USING GIN(tags);

-- =====================================================
-- 3. sermon_views 테이블 (조회 로그)
-- =====================================================
CREATE TABLE public.sermon_views (
  id BIGSERIAL PRIMARY KEY,
  sermon_id UUID NOT NULL REFERENCES public.sermons(id) ON DELETE CASCADE,
  user_id INTEGER,                                    -- 사용자 ID (선택, 비회원도 가능)
  church_id INTEGER,                                  -- 교회 ID (선택)
  ip_address VARCHAR(45),                             -- IP 주소
  user_agent TEXT,                                    -- User Agent
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sermon_views_sermon_id ON public.sermon_views(sermon_id);
CREATE INDEX idx_sermon_views_viewed_at ON public.sermon_views(viewed_at DESC);
CREATE INDEX idx_sermon_views_user_id ON public.sermon_views(user_id);

-- =====================================================
-- 4. sermon_audit_logs 테이블 (관리자 작업 로그)
-- =====================================================
CREATE TABLE public.sermon_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  sermon_id UUID REFERENCES public.sermons(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL,                        -- create, update, delete, publish, unpublish
  user_id INTEGER NOT NULL,                           -- 작업 수행한 관리자 ID
  user_name VARCHAR(100),                             -- 관리자 이름
  changed_data JSONB,                                 -- 변경된 데이터 (before/after)
  ip_address VARCHAR(45),                             -- IP 주소
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sermon_audit_logs_sermon_id ON public.sermon_audit_logs(sermon_id);
CREATE INDEX idx_sermon_audit_logs_action ON public.sermon_audit_logs(action);
CREATE INDEX idx_sermon_audit_logs_user_id ON public.sermon_audit_logs(user_id);
CREATE INDEX idx_sermon_audit_logs_created_at ON public.sermon_audit_logs(created_at DESC);

-- =====================================================
-- 5. RLS (Row Level Security) 정책
-- =====================================================

-- sermon_categories RLS
ALTER TABLE public.sermon_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sermon_categories_select_policy" ON public.sermon_categories;
CREATE POLICY "sermon_categories_select_policy" ON public.sermon_categories
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "sermon_categories_manage_policy" ON public.sermon_categories;
CREATE POLICY "sermon_categories_manage_policy" ON public.sermon_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- sermons RLS
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성화되고 발행된 설교 조회 가능
DROP POLICY IF EXISTS "sermons_select_policy" ON public.sermons;
CREATE POLICY "sermons_select_policy" ON public.sermons
  FOR SELECT
  USING (
    is_active = true
    AND (published_at IS NULL OR published_at <= NOW())
  );

-- 시스템 관리자만 CRUD 가능 (여기서는 모든 인증된 사용자로 설정, 실제로는 role 체크 필요)
DROP POLICY IF EXISTS "sermons_insert_policy" ON public.sermons;
CREATE POLICY "sermons_insert_policy" ON public.sermons
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "sermons_update_policy" ON public.sermons;
CREATE POLICY "sermons_update_policy" ON public.sermons
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "sermons_delete_policy" ON public.sermons;
CREATE POLICY "sermons_delete_policy" ON public.sermons
  FOR DELETE
  USING (true);

-- sermon_views RLS
ALTER TABLE public.sermon_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sermon_views_insert_policy" ON public.sermon_views;
CREATE POLICY "sermon_views_insert_policy" ON public.sermon_views
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "sermon_views_select_policy" ON public.sermon_views;
CREATE POLICY "sermon_views_select_policy" ON public.sermon_views
  FOR SELECT
  USING (true);

-- sermon_audit_logs RLS
ALTER TABLE public.sermon_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sermon_audit_logs_insert_policy" ON public.sermon_audit_logs;
CREATE POLICY "sermon_audit_logs_insert_policy" ON public.sermon_audit_logs
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "sermon_audit_logs_select_policy" ON public.sermon_audit_logs;
CREATE POLICY "sermon_audit_logs_select_policy" ON public.sermon_audit_logs
  FOR SELECT
  USING (true);

-- =====================================================
-- 6. 트리거 함수들
-- =====================================================

-- updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_sermon_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sermons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (DROP 후 재생성)
DROP TRIGGER IF EXISTS sermon_categories_updated_at_trigger ON public.sermon_categories;
CREATE TRIGGER sermon_categories_updated_at_trigger
  BEFORE UPDATE ON public.sermon_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_sermon_categories_updated_at();

DROP TRIGGER IF EXISTS sermons_updated_at_trigger ON public.sermons;
CREATE TRIGGER sermons_updated_at_trigger
  BEFORE UPDATE ON public.sermons
  FOR EACH ROW
  EXECUTE FUNCTION update_sermons_updated_at();

-- 조회수 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION increment_sermon_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.sermons
  SET view_count = view_count + 1
  WHERE id = NEW.sermon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sermon_view_count_trigger ON public.sermon_views;
CREATE TRIGGER sermon_view_count_trigger
  AFTER INSERT ON public.sermon_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_sermon_view_count();

-- =====================================================
-- 7. 유용한 뷰 (View)
-- =====================================================

-- 설교 통계 뷰
CREATE OR REPLACE VIEW sermon_statistics AS
SELECT
  s.id,
  s.title,
  s.preacher_name,
  s.sermon_date,
  s.view_count,
  sc.name as category_name,
  COUNT(DISTINCT sv.id) as actual_view_count,
  COUNT(DISTINCT sv.user_id) as unique_user_count,
  s.created_at
FROM public.sermons s
LEFT JOIN public.sermon_categories sc ON s.category_id = sc.id
LEFT JOIN public.sermon_views sv ON s.id = sv.sermon_id
WHERE s.is_active = true
GROUP BY s.id, s.title, s.preacher_name, s.sermon_date, s.view_count, sc.name, s.created_at;

-- =====================================================
-- 8. 샘플 데이터
-- =====================================================

-- 샘플 설교 데이터
INSERT INTO public.sermons (
  title,
  youtube_url,
  youtube_video_id,
  preacher_name,
  description,
  scripture_reference,
  category_id,
  sermon_date,
  tags,
  is_featured,
  display_order,
  is_active,
  published_at
) VALUES
  (
    '은혜와 진리가 충만하신 예수',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
    '김영진 목사',
    '요한복음 1장을 통해 살펴보는 예수님의 은혜와 진리에 대한 말씀입니다.',
    '요한복음 1:14-18',
    1,
    '2024-01-07',
    ARRAY['은혜', '진리', '요한복음'],
    true,
    1,
    true,
    NOW()
  ),
  (
    '십자가의 능력',
    'https://www.youtube.com/watch?v=AbCdEfGhIjK',
    'AbCdEfGhIjK',
    '이성호 목사',
    '고린도전서 1장 18절 말씀을 통한 십자가의 능력',
    '고린도전서 1:18-25',
    2,
    '2024-01-10',
    ARRAY['십자가', '능력', '구원'],
    false,
    2,
    true,
    NOW()
  );

-- =====================================================
-- 9. 관리 헬퍼 함수들
-- =====================================================

-- 유튜브 비디오 ID 추출 함수
CREATE OR REPLACE FUNCTION extract_youtube_video_id(url TEXT)
RETURNS TEXT AS $$
DECLARE
  video_id TEXT;
BEGIN
  -- https://www.youtube.com/watch?v=VIDEO_ID
  IF url ~ 'youtube\.com/watch\?v=' THEN
    video_id := substring(url from 'v=([a-zA-Z0-9_-]{11})');
  -- https://youtu.be/VIDEO_ID
  ELSIF url ~ 'youtu\.be/' THEN
    video_id := substring(url from 'youtu\.be/([a-zA-Z0-9_-]{11})');
  -- https://www.youtube.com/embed/VIDEO_ID
  ELSIF url ~ 'youtube\.com/embed/' THEN
    video_id := substring(url from 'embed/([a-zA-Z0-9_-]{11})');
  END IF;

  RETURN video_id;
END;
$$ LANGUAGE plpgsql;

-- 썸네일 URL 자동 생성 함수
CREATE OR REPLACE FUNCTION get_youtube_thumbnail_url(video_id TEXT)
RETURNS TEXT AS $$
BEGIN
  -- 고화질 썸네일 URL
  RETURN 'https://img.youtube.com/vi/' || video_id || '/maxresdefault.jpg';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.sermons IS '시스템 관리자가 관리하는 명설교 영상 테이블';
COMMENT ON TABLE public.sermon_categories IS '설교 카테고리 관리 테이블';
COMMENT ON TABLE public.sermon_views IS '설교 조회 로그 테이블';
COMMENT ON TABLE public.sermon_audit_logs IS '설교 관리 작업 로그 테이블';
