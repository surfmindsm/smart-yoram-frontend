-- 7번 교회에 기본 AI 에이전트들 생성
-- 교회명을 먼저 조회해서 동적으로 적용

DO $$
DECLARE
    church_name TEXT;
BEGIN
    -- 7번 교회의 이름 조회
    SELECT name INTO church_name FROM public.churches WHERE id = 7;

    -- 교회명이 없으면 기본값 사용
    IF church_name IS NULL THEN
        church_name := '교회';
    END IF;

    -- 기본 AI 에이전트들 생성 (중복 방지)
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
        7 as church_id,
        CASE
            WHEN v.name = '{교회명} 비서' THEN church_name || ' 비서'
            ELSE v.name
        END as name,
        v.category,
        CASE
            WHEN v.description LIKE '%{교회명}%' THEN REPLACE(v.description, '{교회명}', church_name)
            ELSE v.description
        END as description,
        CASE
            WHEN v.detailed_description LIKE '%{교회명}%' THEN REPLACE(v.detailed_description, '{교회명}', church_name)
            ELSE v.detailed_description
        END as detailed_description,
        v.icon,
        CASE
            WHEN v.system_prompt LIKE '%{교회명}%' THEN REPLACE(v.system_prompt, '{교회명}', church_name)
            ELSE v.system_prompt
        END as system_prompt,
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
        ('종합 도우미', '일반', '다양한 질문과 요청에 도움을 드립니다.',
         '교회 생활과 신앙에 관련된 모든 질문에 답변하고 도움을 제공합니다. 성경 질문부터 일상적인 고민까지 폭넓게 지원하는 종합적인 AI 도우미입니다.',
         '🤖',
         '당신은 교회의 종합 AI 도우미입니다. 신앙, 교회 생활, 성경 질문 등 다양한 주제에 대해 도움을 주세요. 친근하고 도움이 되는 조언을 제공하며, 필요시 다른 전문 에이전트를 추천해주세요.',
         '{}', false, null, 2000, 0.7),

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
         '{"pastoral_care_requests": true, "prayer_requests": true, "announcements": true, "offerings": true, "attendances": true, "members": true, "worship_services": true, "visits": true, "users": true}', true, null, 2000, 0.3)
    ) AS v(name, category, description, detailed_description, icon, system_prompt, church_data_sources, enable_church_data, gpt_model, max_tokens, temperature)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.ai_agents a
        WHERE a.church_id = 7
        AND a.name = CASE
            WHEN v.name = '{교회명} 비서' THEN church_name || ' 비서'
            ELSE v.name
        END
        AND a.is_default = true
    );

    -- 결과 출력
    RAISE NOTICE '7번 교회(%)에 기본 AI 에이전트들이 생성되었습니다.', church_name;
END $$;