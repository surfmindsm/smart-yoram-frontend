-- members 테이블의 phone 정보를 users 테이블로 동기화
-- user_id로 연결된 레코드의 phone을 업데이트

UPDATE users u
SET phone = m.phone
FROM members m
WHERE u.id = m.user_id::bigint
  AND m.phone IS NOT NULL
  AND m.phone != ''
  AND (u.phone IS NULL OR u.phone = '');

-- 업데이트된 레코드 수 확인용 주석
-- SELECT COUNT(*) FROM users WHERE phone IS NOT NULL;
