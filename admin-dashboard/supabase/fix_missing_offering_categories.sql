-- ========================================
-- 헌금 계정과목이 없는 교회에 자동으로 추가
-- ========================================

DO $$
DECLARE
  church_record RECORD;
  template_parent RECORD;
  template_child RECORD;
  new_parent_id INTEGER;
  fixed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '헌금 계정과목 자동 추가 시작';
  RAISE NOTICE '========================================';

  -- 템플릿(church_id=0)의 헌금 상위 카테고리 확인
  SELECT id, name, type, display_order, is_offering
  INTO template_parent
  FROM account_categories
  WHERE church_id = 0
    AND name = '헌금'
    AND type = 'income'
    AND parent_id IS NULL
  LIMIT 1;

  IF template_parent.id IS NULL THEN
    RAISE EXCEPTION '❌ 템플릿에 헌금 상위 카테고리가 없습니다. 먼저 20251117000001_link_offerings_to_accounting.sql 마이그레이션을 실행하세요.';
  END IF;

  RAISE NOTICE '✅ 템플릿 헌금 카테고리 ID: %', template_parent.id;

  -- 헌금 상위 카테고리가 없는 각 교회에 대해 처리
  FOR church_record IN
    SELECT c.id, c.serial_id, c.name
    FROM churches c
    WHERE c.id != 9998  -- "no church" 제외
      AND NOT EXISTS (
        SELECT 1 FROM account_categories ac
        WHERE ac.church_id = c.id
          AND ac.name = '헌금'
          AND ac.type = 'income'
          AND ac.parent_id IS NULL
      )
    ORDER BY c.id
  LOOP
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE '🔧 교회 처리 중: % (ID: %, Serial: %)', church_record.name, church_record.id, church_record.serial_id;

    -- 1단계: 헌금 상위 카테고리 추가
    INSERT INTO account_categories (
      church_id,
      name,
      type,
      parent_id,
      is_active,
      is_offering,
      display_order,
      created_at,
      updated_at
    ) VALUES (
      church_record.id,
      template_parent.name,
      template_parent.type,
      NULL,
      true,
      template_parent.is_offering,
      template_parent.display_order,
      NOW(),
      NOW()
    )
    RETURNING id INTO new_parent_id;

    RAISE NOTICE '  ✅ 헌금 상위 카테고리 추가 완료 (새 ID: %)', new_parent_id;

    -- 2단계: 헌금 하위 항목들 추가
    FOR template_child IN
      SELECT name, type, is_offering, display_order
      FROM account_categories
      WHERE church_id = 0
        AND parent_id = template_parent.id
      ORDER BY display_order
    LOOP
      INSERT INTO account_categories (
        church_id,
        name,
        type,
        parent_id,
        is_active,
        is_offering,
        display_order,
        created_at,
        updated_at
      ) VALUES (
        church_record.id,
        template_child.name,
        template_child.type,
        new_parent_id,
        true,
        template_child.is_offering,
        template_child.display_order,
        NOW(),
        NOW()
      );

      RAISE NOTICE '  ✅ 하위 항목 추가: %', template_child.name;
    END LOOP;

    fixed_count := fixed_count + 1;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 완료: % 개 교회에 헌금 카테고리 추가됨', fixed_count;
  RAISE NOTICE '========================================';
END $$;

-- 확인 쿼리: 모든 교회의 헌금 카테고리 상태
SELECT
  c.id as church_id,
  c.serial_id,
  c.name as church_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM account_categories ac
      WHERE ac.church_id = c.id
        AND ac.name = '헌금'
        AND ac.type = 'income'
        AND ac.parent_id IS NULL
    ) THEN '✅ 있음'
    ELSE '❌ 없음'
  END as has_offering_category,
  (
    SELECT COUNT(*)
    FROM account_categories ac
    WHERE ac.church_id = c.id
      AND (ac.name = '헌금' OR ac.parent_id IN (
        SELECT id FROM account_categories
        WHERE church_id = c.id AND name = '헌금' AND parent_id IS NULL
      ))
  ) as offering_categories_count
FROM churches c
WHERE c.id != 9998
ORDER BY c.id;
