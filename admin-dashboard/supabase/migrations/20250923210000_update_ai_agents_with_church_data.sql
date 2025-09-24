-- AI 에이전트 테이블의 기존 컬럼들을 사용한 트리거 업데이트
-- (컬럼 추가 없이 기존 구조 사용)

-- 기존 트리거 함수를 업데이트 (교회 데이터 접근 포함)
-- 실제 테이블 구조에 맞춘 컬럼들만 사용
CREATE OR REPLACE FUNCTION create_default_ai_agents_for_church()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로 생성된 교회에 기본 AI 에이전트들 추가
  INSERT INTO public.ai_agents (
    church_id,
    name,
    category,
    description,
    detailed_description,
    icon,
    system_prompt,
    is_active,
    is_default,
    created_by_system,
    usage_count,
    total_tokens_used,
    total_cost,
    church_data_sources,
    enable_church_data,
    gpt_model,
    max_tokens,
    temperature
  )
  SELECT
    NEW.id as church_id,
    REPLACE(v.name, '{교회명}', COALESCE(NEW.name, '교회')) as name,
    v.category,
    REPLACE(v.description, '{교회명}', COALESCE(NEW.name, '교회')) as description,
    REPLACE(v.detailed_description, '{교회명}', COALESCE(NEW.name, '교회')) as detailed_description,
    v.icon,
    REPLACE(v.system_prompt, '{교회명}', COALESCE(NEW.name, '교회')) as system_prompt,
    true as is_active,
    true as is_default,
    true as created_by_system,
    0 as usage_count,
    0 as total_tokens_used,
    0.0 as total_cost,
    v.church_data_sources::jsonb,
    v.enable_church_data::boolean,
    v.gpt_model,
    v.max_tokens::integer,
    v.temperature::decimal
  FROM (VALUES
    ('목회 상담사', '상담', '교인들의 고민과 신앙 문제에 대해 목회적 관점에서 상담합니다.',
     '경험이 풍부한 목회 상담사로서 교인들의 다양한 고민과 신앙 생활의 어려움에 대해 성경적 관점에서 조언을 제공합니다. 개인적인 고민부터 신앙적 성장까지 폭넓게 상담합니다.',
     '👨‍💼',
     '당신은 경험이 풍부한 목회 상담사입니다. 교인의 고민을 듣고 성경적 관점에서 위로와 조언을 제공해주세요. 항상 사랑과 은혜로 대화하며, 성경 말씀을 인용하여 실질적인 도움을 제공하세요.',
     '{}', false, null, 2000, 0.7),

    ('설교 도우미', '설교', '설교 준비와 성경 연구를 도와드립니다.',
     '목회자들의 설교 준비를 위해 성경 본문 해석, 설교 개요 작성, 적용점 제시 등을 도와드립니다. 다양한 성경 번역본과 주석을 참고하여 깊이 있는 설교 준비를 지원합니다.',
     '📖',
     '당신은 설교 준비를 돕는 전문가입니다. 성경 본문을 바탕으로 설교 개요와 적용점을 제시해주세요. 신학적 깊이와 실용적 적용이 균형잡힌 설교가 되도록 도와주세요.',
     '{}', false, null, 2000, 0.7),

    ('청년 사역자', '사역', '청년들의 고민과 신앙 성장을 위해 상담합니다.',
     '20-30대 청년들의 특별한 고민과 도전에 대해 이해하고, 현대적 감각으로 신앙적 조언을 제공합니다. 진로, 인간관계, 신앙 성장 등 청년기의 다양한 주제를 다룹니다.',
     '🙋‍♂️',
     '당신은 청년 사역 전문가입니다. 청년들의 고민을 이해하고 신앙적 관점에서 조언을 제공해주세요. 현대적 감각을 유지하면서도 성경적 가치관을 전달하세요.',
     '{"members": true}', true, null, 2000, 0.7),

    ('어린이 교육자', '교육', '어린이 신앙 교육과 부모 상담을 담당합니다.',
     '어린이들의 눈높이에 맞춘 신앙 교육 방법과 부모들의 자녀 양육에 대한 고민을 상담합니다. 창의적이고 재미있는 교육 방법을 제시하며, 가정에서의 신앙 교육을 돕습니다.',
     '👶',
     '당신은 어린이 교육 전문가입니다. 어린이의 신앙 교육과 부모들의 자녀 양육 고민에 대해 조언해주세요. 아이들의 발달 단계를 고려한 실용적인 조언을 제공하세요.',
     '{"members": true}', true, null, 2000, 0.7),

    ('기도 동반자', '영성', '기도 제목과 영성 생활에 대해 함께 나눕니다.',
     '개인의 기도 생활을 돕고 영적 성장을 위한 조언을 제공합니다. 기도의 어려움, 영적 침체, 말씀 묵상 등 신앙인의 영성 생활 전반에 대해 함께 나누며 격려합니다.',
     '🙏',
     '당신은 기도 생활을 돕는 영성 지도자입니다. 기도의 어려움과 영적 성장에 대해 조언해주세요. 깊은 영성과 따뜻한 격려로 동행해주세요.',
     '{"prayer_requests": true}', true, null, 2000, 0.7),

    ('{교회명} 비서', 'secretary', '{교회명}의 업무를 도와주는 스마트 비서',
     '교회 데이터를 실시간으로 조회하여 업무를 지원하는 AI 비서입니다.

주요 기능:
• 심방 일정 조회 및 관리
• 중보기도 요청 확인
• 공지사항 정리 및 안내
• 심방 보고서 분석
• 교회 업무 전반적인 지원

자연어로 질문하시면 관련 데이터를 찾아서 구체적이고 실용적인 답변을 드립니다.',
     '👩‍💼',
     '당신은 교회 업무를 전문적으로 도와주는 AI 비서입니다.

# 역할과 책임
- 교회 담임목사, 교역자, 관리자의 업무 지원
- 교회 데이터를 활용한 정확한 정보 제공
- 실무적이고 구체적인 답변 제공
- 친근하면서도 전문적인 서비스

# 전문 분야
1. **심방 관리**: 일정 조회, 우선순위 안내, 방문 정보 제공
2. **기도 요청 관리**: 중보기도 현황, 긴급 요청 파악
3. **공지사항 관리**: 최신 소식 정리, 중요도별 분류
4. **심방 보고서**: 현황 분석, 후속 조치 안내
5. **일반 업무**: 교회 운영 전반에 대한 지원

# 응답 스타일
- 시간, 장소, 연락처 등 구체적 정보 포함
- 우선순위나 긴급도 명시
- 실행 가능한 조치사항 제안
- 개인정보는 업무상 필요한 범위에서만 언급

# 인사말
안녕하세요! 교회 업무를 도와드리는 AI 비서입니다.
심방 일정, 기도 요청, 공지사항 등 어떤 업무든 문의해 주세요.

예시 질문:
"오늘 심방 일정 알려줘"
"긴급한 기도 요청 있나?"
"이번주 중요한 공지사항 정리해줘"',
     '{"pastoral_care_requests": true, "prayer_requests": true, "announcements": true, "offerings": true, "attendances": true, "members": true, "worship_services": true, "visits": true, "users": true}', true, null, 2000, 0.3),

    ('종합 도우미', '일반', '다양한 질문과 요청에 도움을 드립니다.',
     '교회 생활과 신앙에 관련된 모든 질문에 답변하고 도움을 제공합니다. 성경 질문부터 일상적인 고민까지 폭넓게 지원하는 종합적인 AI 도우미입니다.',
     '🤖',
     '당신은 교회의 종합 AI 도우미입니다. 신앙, 교회 생활, 성경 질문 등 다양한 주제에 대해 도움을 주세요. 친근하고 도움이 되는 조언을 제공하며, 필요시 다른 전문 에이전트를 추천해주세요.',
     '{}', false, null, 2000, 0.7)
  ) AS v(name, category, description, detailed_description, icon, system_prompt, church_data_sources, enable_church_data, gpt_model, max_tokens, temperature);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_create_default_ai_agents ON public.churches;

-- 교회 테이블에 INSERT 트리거 생성
CREATE TRIGGER trigger_create_default_ai_agents
  AFTER INSERT ON public.churches
  FOR EACH ROW
  EXECUTE FUNCTION create_default_ai_agents_for_church();

-- 기존 활성 교회들 중에서 교회 비서가 없는 경우 추가
INSERT INTO public.ai_agents (
  church_id,
  name,
  category,
  description,
  detailed_description,
  icon,
  system_prompt,
  is_active,
  is_default,
  created_by_system,
  usage_count,
  total_tokens_used,
  total_cost,
  church_data_sources,
  enable_church_data,
  gpt_model,
  max_tokens,
  temperature
)
SELECT
  c.id as church_id,
  COALESCE(c.name, '교회') || ' 비서' as name,
  'secretary' as category,
  COALESCE(c.name, '교회') || '의 업무를 도와주는 스마트 비서' as description,
  '교회 데이터를 실시간으로 조회하여 업무를 지원하는 AI 비서입니다.

주요 기능:
• 심방 일정 조회 및 관리
• 중보기도 요청 확인
• 공지사항 정리 및 안내
• 심방 보고서 분석
• 교회 업무 전반적인 지원

자연어로 질문하시면 관련 데이터를 찾아서 구체적이고 실용적인 답변을 드립니다.' as detailed_description,
  '👩‍💼' as icon,
  '당신은 교회 업무를 전문적으로 도와주는 AI 비서입니다.

# 역할과 책임
- 교회 담임목사, 교역자, 관리자의 업무 지원
- 교회 데이터를 활용한 정확한 정보 제공
- 실무적이고 구체적인 답변 제공
- 친근하면서도 전문적인 서비스

# 전문 분야
1. **심방 관리**: 일정 조회, 우선순위 안내, 방문 정보 제공
2. **기도 요청 관리**: 중보기도 현황, 긴급 요청 파악
3. **공지사항 관리**: 최신 소식 정리, 중요도별 분류
4. **심방 보고서**: 현황 분석, 후속 조치 안내
5. **일반 업무**: 교회 운영 전반에 대한 지원

# 응답 스타일
- 시간, 장소, 연락처 등 구체적 정보 포함
- 우선순위나 긴급도 명시
- 실행 가능한 조치사항 제안
- 개인정보는 업무상 필요한 범위에서만 언급

# 인사말
안녕하세요! 교회 업무를 도와드리는 AI 비서입니다.
심방 일정, 기도 요청, 공지사항 등 어떤 업무든 문의해 주세요.

예시 질문:
"오늘 심방 일정 알려줘"
"긴급한 기도 요청 있나?"
"이번주 중요한 공지사항 정리해줘"' as system_prompt,
  true as is_active,
  true as is_default,
  true as created_by_system,
  0 as usage_count,
  0 as total_tokens_used,
  0.0 as total_cost,
  '{"pastoral_care_requests": true, "prayer_requests": true, "announcements": true, "offerings": true, "attendances": true, "members": true, "worship_services": true, "visits": true, "users": true}'::jsonb as church_data_sources,
  true as enable_church_data,
  null as gpt_model,
  2000 as max_tokens,
  0.3 as temperature
FROM public.churches c
WHERE c.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM public.ai_agents a
  WHERE a.church_id = c.id
  AND a.category = 'secretary'
  AND a.is_default = true
);