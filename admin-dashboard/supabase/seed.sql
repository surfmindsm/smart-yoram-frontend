-- Seed data for development
-- This file contains sample data for testing the church management system

-- Insert sample churches
INSERT INTO public.churches (id, name, address, phone, email, pastor_name, denomination, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', '샘물교회', '서울시 강남구 테헤란로 123', '02-1234-5678', 'info@samwater.church', '김목사', '장로교', '은혜가 넘치는 교회입니다.'),
    ('550e8400-e29b-41d4-a716-446655440001', '빛과소금교회', '서울시 서초구 서초대로 456', '02-2345-6789', 'contact@lightandsalt.church', '이목사', '감리교', '세상의 빛과 소금이 되는 교회입니다.'),
    ('550e8400-e29b-41d4-a716-446655440002', '새생명교회', '서울시 마포구 월드컵로 789', '02-3456-7890', 'hello@newlife.church', '박목사', '침례교', '새로운 생명을 주시는 교회입니다.');

-- Insert sample music team recruitments
INSERT INTO public.music_team_recruitments (
    title, description, recruitment_type, team_types, worship_type, schedule, location,
    requirements, compensation, contact_phone, contact_email, church_id, author_id
) VALUES
    (
        '주일예배 찬양팀 모집',
        '주일 1부, 2부 예배를 위한 찬양팀원을 모집합니다. 피아노, 기타, 드럼, 보컬 등 다양한 파트를 모집하고 있습니다.',
        '주일예배',
        '["찬양팀", "워십팀"]',
        '주일예배',
        '매주 일요일 오전 8시, 오전 11시 / 리허설: 매주 토요일 오후 2시',
        '서울시 강남구',
        '3년 이상 연주 경험, 악보 시창 가능, 예배에 대한 올바른 자세',
        '회당 5만원',
        '010-1234-5678',
        'worship@samwater.church',
        '550e8400-e29b-41d4-a716-446655440000',
        NULL
    ),
    (
        '찬양콘서트 밴드 모집',
        '연말 찬양콘서트를 위한 밴드 멤버를 모집합니다. 젊고 열정적인 분들의 많은 참여 바랍니다.',
        '특별예배',
        '["밴드", "어쿠스틱 팀"]',
        '특별예배',
        '콘서트 날짜: 12월 24일 / 연습: 매주 수요일 저녁 7시',
        '서울시 서초구',
        '밴드 연주 경험, 찬양에 대한 열정',
        '협의',
        '010-2345-6789',
        'band@lightandsalt.church',
        '550e8400-e29b-41d4-a716-446655440001',
        NULL
    ),
    (
        '수요기도회 찬양인도자 모집',
        '매주 수요일 기도회 찬양 인도를 담당할 찬양인도자를 모집합니다.',
        '수요예배',
        '["현재 솔로 활동"]',
        '수요예배',
        '매주 수요일 오후 7시 30분',
        '서울시 마포구',
        '찬양 인도 경험, 기도회 취지에 맞는 찬양 선곡 능력',
        '월 20만원',
        '010-3456-7890',
        'prayer@newlife.church',
        '550e8400-e29b-41d4-a716-446655440002',
        NULL
    );

-- Insert sample job postings
INSERT INTO public.job_postings (
    title, description, job_type, employment_type, location, requirements,
    contact_info, church_id, author_id
) VALUES
    (
        '유치부 교사 모집',
        '유치부 아이들을 사랑으로 돌보고 가르쳐 주실 교사를 모집합니다.',
        '교육사역',
        'part_time',
        '서울시 강남구',
        '유아교육 관련 자격증 우대, 아이들을 사랑하는 마음',
        '{"phone": "02-1234-5678", "email": "hr@samwater.church", "contact_person": "김전도사"}',
        '550e8400-e29b-41d4-a716-446655440000',
        NULL
    ),
    (
        '찬양팀 반주자 모집',
        '교회 찬양팀에서 피아노 반주를 담당하실 분을 모집합니다.',
        '음악사역',
        'volunteer',
        '서울시 서초구',
        '피아노 연주 실력, 찬양에 대한 열정',
        '{"phone": "02-2345-6789", "email": "music@lightandsalt.church"}',
        '550e8400-e29b-41d4-a716-446655440001',
        NULL
    );

-- Insert sample church news
INSERT INTO public.church_news (
    title, content, category, priority, event_date, location, organizer,
    tags, church_id, author_id
) VALUES
    (
        '2025년 신년예배 및 떡국 나눔',
        '새해를 맞이하여 신년예배를 드리고 성도들과 함께 떡국을 나누는 시간을 갖겠습니다. 많은 참여 바랍니다.',
        '특별예배',
        'important',
        '2025-01-01 10:00:00+09',
        '본당 및 친교실',
        '장로회',
        ARRAY['신년', '예배', '친교'],
        '550e8400-e29b-41d4-a716-446655440000',
        NULL
    ),
    (
        '성경공부 소그룹 모집',
        '새해를 맞이하여 성경공부 소그룹을 새롭게 구성합니다. 말씀으로 무장하고자 하는 성도들의 참여를 기다립니다.',
        '성경공부',
        'normal',
        '2025-01-15 19:30:00+09',
        '소그룹실',
        '교육부',
        ARRAY['성경공부', '소그룹', '양육'],
        '550e8400-e29b-41d4-a716-446655440001',
        NULL
    );

-- Insert sample sharing posts
INSERT INTO public.sharing_posts (
    title, description, sharing_type, category, condition, location,
    contact_info, church_id, author_id
) VALUES
    (
        '아기 용품 나눔',
        '더 이상 사용하지 않는 아기 용품들을 필요한 분께 나눔합니다. 유모차, 아기 의류, 장난감 등이 있습니다.',
        'offer',
        '유아용품',
        '중고',
        '서울시 강남구',
        '{"phone": "010-1111-2222", "preferred_contact": "phone"}',
        '550e8400-e29b-41d4-a716-446655440000',
        NULL
    ),
    (
        '이사짐 도움 요청',
        '다음 주 이사 예정인데 도와주실 청년들을 찾습니다. 간단한 식사 제공합니다.',
        'request',
        '도움요청',
        '신청',
        '서울시 서초구',
        '{"phone": "010-3333-4444", "message": "문자 연락 부탁드립니다"}',
        '550e8400-e29b-41d4-a716-446655440001',
        NULL
    );

-- Update view counts for testing
UPDATE public.music_team_recruitments SET view_count = 45 WHERE title = '주일예배 찬양팀 모집';
UPDATE public.music_team_recruitments SET view_count = 32 WHERE title = '찬양콘서트 밴드 모집';
UPDATE public.music_team_recruitments SET view_count = 28 WHERE title = '수요기도회 찬양인도자 모집';

UPDATE public.church_news SET views = 67 WHERE title = '2025년 신년예배 및 떡국 나눔';
UPDATE public.church_news SET views = 43 WHERE title = '성경공부 소그룹 모집';