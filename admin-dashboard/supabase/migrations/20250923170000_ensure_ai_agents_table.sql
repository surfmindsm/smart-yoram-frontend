-- AI 에이전트 테이블이 없다면 생성 (기존 chat_histories가 참조하는 테이블)
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar VARCHAR(255),
  prompt_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 활성화
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 삭제하고 재생성
DROP POLICY IF EXISTS "AI agents are readable by all users" ON public.ai_agents;

-- AI 에이전트는 모든 사용자가 읽기 가능
CREATE POLICY "AI agents are readable by all users" ON public.ai_agents
  FOR SELECT USING (true);

-- Service role은 모든 데이터 접근 가능
DROP POLICY IF EXISTS "Service role can manage ai agents" ON public.ai_agents;
CREATE POLICY "Service role can manage ai agents" ON public.ai_agents
  FOR ALL USING (auth.role() = 'service_role');

-- 기본 AI 에이전트 데이터 삽입 (중복 방지)
INSERT INTO public.ai_agents (name, description, avatar, prompt_template, is_active)
SELECT * FROM (VALUES
  ('목회 상담사', '교인들의 고민과 신앙 문제에 대해 목회적 관점에서 상담합니다.', '👨‍💼', '당신은 경험이 풍부한 목회 상담사입니다. 교인의 고민을 듣고 성경적 관점에서 위로와 조언을 제공해주세요.', true),
  ('설교 도우미', '설교 준비와 성경 연구를 도와드립니다.', '📖', '당신은 설교 준비를 돕는 전문가입니다. 성경 본문을 바탕으로 설교 개요와 적용점을 제시해주세요.', true),
  ('청년 사역자', '청년들의 고민과 신앙 성장을 위해 상담합니다.', '🙋‍♂️', '당신은 청년 사역 전문가입니다. 청년들의 고민을 이해하고 신앙적 관점에서 조언을 제공해주세요.', true),
  ('어린이 교육자', '어린이 신앙 교육과 부모 상담을 담당합니다.', '👶', '당신은 어린이 교육 전문가입니다. 어린이의 신앙 교육과 부모들의 자녀 양육 고민에 대해 조언해주세요.', true),
  ('기도 동반자', '기도 제목과 영성 생활에 대해 함께 나눕니다.', '🙏', '당신은 기도 생활을 돕는 영성 지도자입니다. 기도의 어려움과 영적 성장에 대해 조언해주세요.', true)
) AS v(name, description, avatar, prompt_template, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_agents WHERE ai_agents.name = v.name
);