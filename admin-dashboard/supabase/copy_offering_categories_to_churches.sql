-- 헌금 상위 카테고리는 있지만 하위 항목이 없는 교회들을 찾아서
-- 0번 교회(템플릿)의 헌금 하위 항목들을 복사하는 스크립트

-- 1단계: 헌금 상위 카테고리는 있지만 하위 항목이 없는 교회 조회
DO $$
DECLARE
  church_record RECORD;
  template_offering_record RECORD;
  parent_category_id INTEGER;
  churches_count INTEGER := 0;
  inserted_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== 헌금 하위 항목 복사 작업 시작 ===';
  RAISE NOTICE '';

  -- 헌금 상위 카테고리는 있지만 하위 항목이 없는 교회들 찾기
  RAISE NOTICE '1단계: 대상 교회 조회 중...';

  FOR church_record IN
    SELECT DISTINCT ac.church_id, c.name as church_name
    FROM account_categories ac
    LEFT JOIN churches c ON c.id = ac.church_id
    WHERE ac.name = '헌금'
      AND ac.type = 'income'
      AND ac.parent_id IS NULL
      AND ac.church_id != 0  -- 템플릿 제외
      AND NOT EXISTS (
        -- 해당 교회에 헌금 하위 항목이 없는 경우
        SELECT 1
        FROM account_categories ac2
        WHERE ac2.church_id = ac.church_id
          AND ac2.parent_id = ac.id
          AND ac2.is_offering = true
      )
    ORDER BY ac.church_id
  LOOP
    churches_count := churches_count + 1;
    RAISE NOTICE '대상 교회 발견: church_id=%, name=%', church_record.church_id, COALESCE(church_record.church_name, '(이름 없음)');
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '총 대상 교회 수: %개', churches_count;
  RAISE NOTICE '';

  IF churches_count = 0 THEN
    RAISE NOTICE '⚠️  헌금 하위 항목이 없는 교회가 없습니다. 작업을 종료합니다.';
    RETURN;
  END IF;

  -- 2단계: 0번 교회의 헌금 하위 항목 조회
  RAISE NOTICE '2단계: 0번 교회의 헌금 하위 항목 조회 중...';

  FOR template_offering_record IN
    SELECT
      ac.*
    FROM account_categories ac
    WHERE ac.church_id = 0
      AND ac.type = 'income'
      AND ac.is_offering = true
      AND ac.parent_id IS NOT NULL
    ORDER BY ac.display_order
  LOOP
    RAISE NOTICE '템플릿 헌금 항목: % (display_order: %)', template_offering_record.name, template_offering_record.display_order;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '3단계: 헌금 하위 항목 복사 시작...';
  RAISE NOTICE '';

  -- 3단계: 각 교회에 헌금 하위 항목 복사
  FOR church_record IN
    SELECT DISTINCT ac.church_id, ac.id as parent_id
    FROM account_categories ac
    WHERE ac.name = '헌금'
      AND ac.type = 'income'
      AND ac.parent_id IS NULL
      AND ac.church_id != 0
      AND NOT EXISTS (
        SELECT 1
        FROM account_categories ac2
        WHERE ac2.church_id = ac.church_id
          AND ac2.parent_id = ac.id
          AND ac2.is_offering = true
      )
    ORDER BY ac.church_id
  LOOP
    RAISE NOTICE '교회 ID %에 헌금 항목 복사 중...', church_record.church_id;

    -- 0번 교회의 헌금 하위 항목들을 현재 교회에 복사
    FOR template_offering_record IN
      SELECT
        ac.*
      FROM account_categories ac
      WHERE ac.church_id = 0
        AND ac.type = 'income'
        AND ac.is_offering = true
        AND ac.parent_id IS NOT NULL
      ORDER BY ac.display_order
    LOOP
      -- 중복 체크 후 삽입
      IF NOT EXISTS (
        SELECT 1
        FROM account_categories
        WHERE church_id = church_record.church_id
          AND name = template_offering_record.name
          AND parent_id = church_record.parent_id
      ) THEN
        INSERT INTO account_categories (
          church_id,
          name,
          type,
          parent_id,
          is_offering,
          is_active,
          display_order,
          description
        ) VALUES (
          church_record.church_id,
          template_offering_record.name,
          template_offering_record.type,
          church_record.parent_id,
          template_offering_record.is_offering,
          template_offering_record.is_active,
          template_offering_record.display_order,
          template_offering_record.description
        );

        inserted_count := inserted_count + 1;
        RAISE NOTICE '  ✅ 추가됨: %', template_offering_record.name;
      ELSE
        RAISE NOTICE '  ⚠️  이미 존재: %', template_offering_record.name;
      END IF;
    END LOOP;

    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '=== 작업 완료 ===';
  RAISE NOTICE '총 대상 교회 수: %개', churches_count;
  RAISE NOTICE '총 삽입된 항목 수: %개', inserted_count;
  RAISE NOTICE '';

  -- 4단계: 작업 결과 확인
  RAISE NOTICE '=== 작업 결과 확인 ===';
  FOR church_record IN
    SELECT
      ac.church_id,
      c.name as church_name,
      COUNT(ac2.id) as offering_count
    FROM account_categories ac
    LEFT JOIN churches c ON c.id = ac.church_id
    LEFT JOIN account_categories ac2 ON ac2.church_id = ac.church_id
      AND ac2.parent_id = ac.id
      AND ac2.is_offering = true
    WHERE ac.name = '헌금'
      AND ac.type = 'income'
      AND ac.parent_id IS NULL
      AND ac.church_id != 0
    GROUP BY ac.church_id, c.name
    HAVING COUNT(ac2.id) > 0
    ORDER BY ac.church_id
  LOOP
    RAISE NOTICE '교회 ID %(%): 헌금 하위 항목 %개',
      church_record.church_id,
      COALESCE(church_record.church_name, '이름 없음'),
      church_record.offering_count;
  END LOOP;
END $$;
