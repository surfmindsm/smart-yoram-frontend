-- =============================================
-- 테스트 교회 삭제 샘플 SQL
-- =============================================
-- ⚠️ 주의: 실행 전 반드시 백업하고 조회 쿼리로 확인하세요!
-- =============================================

-- =============================================
-- 1단계: 삭제 대상 교회 조회 (실행 전 확인)
-- =============================================

-- 옵션 1: 이름에 '테스트' 또는 'test'가 포함된 교회 조회
SELECT
    id,
    serial_id,
    name,
    pastor_name,
    email,
    created_at,
    subscription_status
FROM churches
WHERE
    name ILIKE '%테스트%'
    OR name ILIKE '%test%'
    OR name ILIKE '%demo%'
ORDER BY created_at DESC;

-- 옵션 2: 특정 날짜 이후에 생성된 교회 조회
SELECT
    id,
    serial_id,
    name,
    pastor_name,
    email,
    created_at
FROM churches
WHERE created_at >= '2025-12-01'  -- 날짜 수정 필요
ORDER BY created_at DESC;

-- 옵션 3: 교인이 없는 교회 조회
SELECT
    c.id,
    c.serial_id,
    c.name,
    c.pastor_name,
    c.created_at,
    COUNT(m.id) as member_count
FROM churches c
LEFT JOIN members m ON c.serial_id = m.church_id
GROUP BY c.id, c.serial_id, c.name, c.pastor_name, c.created_at
HAVING COUNT(m.id) = 0
ORDER BY c.created_at DESC;

-- 옵션 4: 특정 serial_id 범위의 교회 조회
SELECT
    id,
    serial_id,
    name,
    pastor_name,
    email,
    created_at
FROM churches
WHERE serial_id IN (100, 101, 102)  -- 삭제할 교회 ID 입력
ORDER BY serial_id;

-- =============================================
-- 2단계: 관련 데이터 확인 (삭제 전 영향 범위 파악)
-- =============================================

-- 특정 교회의 관련 데이터 개수 확인
WITH target_church AS (
    SELECT serial_id
    FROM churches
    WHERE name ILIKE '%테스트%'  -- 조건 수정 필요
)
SELECT
    '교인 수' as category,
    COUNT(*) as count
FROM members
WHERE church_id IN (SELECT serial_id FROM target_church)

UNION ALL

SELECT
    '공지사항' as category,
    COUNT(*) as count
FROM announcements
WHERE church_id IN (SELECT serial_id FROM target_church)

UNION ALL

SELECT
    '예배' as category,
    COUNT(*) as count
FROM worship_services
WHERE church_id IN (SELECT serial_id FROM target_church)

UNION ALL

SELECT
    '헌금' as category,
    COUNT(*) as count
FROM offerings
WHERE church_id IN (SELECT serial_id FROM target_church);

-- =============================================
-- 3단계: 백업 (선택사항이지만 강력 권장)
-- =============================================

-- 삭제 대상 교회 백업 테이블 생성
CREATE TABLE churches_backup_20251212 AS
SELECT * FROM churches
WHERE
    name ILIKE '%테스트%'   -- 조건 수정 필요
    OR name ILIKE '%test%';

-- 백업 확인
SELECT COUNT(*) as backed_up_count
FROM churches_backup_20251212;

-- =============================================
-- 4단계: 실제 삭제 (트랜잭션 사용)
-- =============================================

-- ⚠️⚠️⚠️ 주의: 아래 코드는 실제로 데이터를 삭제합니다! ⚠️⚠️⚠️

-- 방법 1: 이름 패턴으로 삭제
BEGIN;

-- 삭제할 교회 확인
SELECT id, serial_id, name FROM churches
WHERE
    name ILIKE '%테스트%'
    OR name ILIKE '%test%';

-- 확인 후 문제없으면 삭제 실행
DELETE FROM churches
WHERE
    name ILIKE '%테스트%'
    OR name ILIKE '%test%';

-- 삭제된 개수 확인
-- 문제 없으면 COMMIT, 문제 있으면 ROLLBACK
-- COMMIT;
ROLLBACK;  -- 안전을 위해 기본값은 ROLLBACK

-- 방법 2: 특정 ID로 삭제
BEGIN;

-- 삭제할 교회 확인
SELECT id, serial_id, name FROM churches
WHERE serial_id IN (100, 101, 102);  -- 삭제할 ID 입력

-- 확인 후 문제없으면 삭제 실행
DELETE FROM churches
WHERE serial_id IN (100, 101, 102);  -- 삭제할 ID 입력

-- 삭제된 개수 확인
-- 문제 없으면 COMMIT, 문제 있으면 ROLLBACK
-- COMMIT;
ROLLBACK;  -- 안전을 위해 기본값은 ROLLBACK

-- 방법 3: 특정 날짜 이후 생성된 교회 삭제
BEGIN;

-- 삭제할 교회 확인
SELECT id, serial_id, name, created_at FROM churches
WHERE created_at >= '2025-12-10'  -- 날짜 수정 필요
ORDER BY created_at DESC;

-- 확인 후 문제없으면 삭제 실행
DELETE FROM churches
WHERE created_at >= '2025-12-10';  -- 날짜 수정 필요

-- 삭제된 개수 확인
-- 문제 없으면 COMMIT, 문제 있으면 ROLLBACK
-- COMMIT;
ROLLBACK;  -- 안전을 위해 기본값은 ROLLBACK

-- 방법 4: 교인이 없는 교회만 삭제 (가장 안전)
BEGIN;

-- 삭제할 교회 확인 (교인이 0명인 교회)
SELECT c.id, c.serial_id, c.name, COUNT(m.id) as member_count
FROM churches c
LEFT JOIN members m ON c.serial_id = m.church_id
WHERE c.name ILIKE '%테스트%'  -- 추가 조건
GROUP BY c.id, c.serial_id, c.name
HAVING COUNT(m.id) = 0;

-- 확인 후 문제없으면 삭제 실행
DELETE FROM churches
WHERE serial_id IN (
    SELECT c.serial_id
    FROM churches c
    LEFT JOIN members m ON c.serial_id = m.church_id
    WHERE c.name ILIKE '%테스트%'  -- 추가 조건
    GROUP BY c.serial_id
    HAVING COUNT(m.id) = 0
);

-- 삭제된 개수 확인
-- 문제 없으면 COMMIT, 문제 있으면 ROLLBACK
-- COMMIT;
ROLLBACK;  -- 안전을 위해 기본값은 ROLLBACK

-- =============================================
-- 5단계: 삭제 후 확인
-- =============================================

-- 전체 교회 수 확인
SELECT COUNT(*) as total_churches FROM churches;

-- 최근 생성된 교회 확인
SELECT id, serial_id, name, created_at
FROM churches
ORDER BY created_at DESC
LIMIT 10;

-- =============================================
-- 6단계: 백업 테이블 삭제 (선택사항)
-- =============================================

-- 삭제가 완료되고 문제없으면 백업 테이블 삭제
-- DROP TABLE IF EXISTS churches_backup_20251212;

-- =============================================
-- 참고: CASCADE 관계로 자동 삭제되는 데이터
-- =============================================
-- churches 테이블을 삭제하면 다음 데이터들이 자동으로 삭제됩니다:
-- - members (교인)
-- - announcements (공지사항)
-- - worship_services (예배)
-- - offerings (헌금)
-- - community_posts (커뮤니티 게시물)
-- - prayer_requests (기도 요청)
-- - pastoral_care (심방)
-- - ai_agents (AI 에이전트)
-- - 기타 church_id를 참조하는 모든 테이블
--
-- ⚠️ 반드시 삭제 전에 관련 데이터를 확인하세요!
-- =============================================
