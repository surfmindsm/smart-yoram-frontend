-- 8명의 교인을 users 테이블에 추가하고 members.user_id 연결하기

-- 1. users 테이블에 사용자 추가
INSERT INTO users (email, username, full_name, hashed_password, church_id, role, is_active, is_first, created_at, updated_at)
VALUES
  ('dasun7406@naver.com', 'Park Dasun', '박다순', 'gYXoalrm', 64, 'member', true, true, NOW(), NOW()),
  ('sununder5940@naver.com', 'PARK HYEONG SOON', '박형순', 'YnWppAgG', 64, 'member', true, true, NOW(), NOW()),
  ('kiwi1975@kakao.com', 'Kim se-haw', '김세화', 'FSc2u8KJ', 64, 'member', true, true, NOW(), NOW()),
  ('woog0108@kakao.com', 'Kim Byunguk', '김병욱', 'ObUmXEUy', 64, 'member', true, true, NOW(), NOW()),
  ('singtojesus@nate.com', 'Jeong Jin Sik', '정진식', 'CjHp0Eo9', 64, 'member', true, true, NOW(), NOW()),
  ('mymjmh1004@gmail.com', 'Choi young hee', '최영희', 'CL6fod6M', 64, 'member', true, true, NOW(), NOW()),
  ('enjoyit24@naver.com', 'JEON MIJIN', '전미진', '2353pAKO', 64, 'member', true, true, NOW(), NOW()),
  ('rjonglyeol@gmail.com', 'Ra JongLyeol', '라종렬 평화의길벗', 'RMcrRJfB', 64, 'member', true, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. members 테이블의 user_id 업데이트 (이메일로 매칭)
UPDATE members m
SET user_id = u.id::text
FROM users u
WHERE m.email = u.email
  AND m.user_id IS NULL
  AND u.email IN (
    'dasun7406@naver.com',
    'sununder5940@naver.com',
    'kiwi1975@kakao.com',
    'woog0108@kakao.com',
    'singtojesus@nate.com',
    'mymjmh1004@gmail.com',
    'enjoyit24@naver.com',
    'rjonglyeol@gmail.com'
  );

-- 3. 결과 확인
SELECT
  m.id AS member_id,
  m.name,
  m.email,
  m.user_id,
  u.id AS users_table_id,
  u.username,
  u.role
FROM members m
LEFT JOIN users u ON m.user_id = u.id::text
WHERE m.email IN (
  'dasun7406@naver.com',
  'sununder5940@naver.com',
  'kiwi1975@kakao.com',
  'woog0108@kakao.com',
  'singtojesus@nate.com',
  'mymjmh1004@gmail.com',
  'enjoyit24@naver.com',
  'rjonglyeol@gmail.com'
)
ORDER BY m.id;
