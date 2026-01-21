-- 기존 헌금 데이터를 accounting_transactions에 연동하는 마이그레이션

DO $$
DECLARE
  offering_record RECORD;
  category_record RECORD;
  transaction_id INTEGER;
  donor_name TEXT;
BEGIN
  -- accounting_transaction_id가 null인 모든 헌금 레코드 처리
  FOR offering_record IN 
    SELECT id, church_id, member_id, offered_on, fund_type, amount, note, input_user_id
    FROM offerings
    WHERE accounting_transaction_id IS NULL
  LOOP
    -- 헌금 유형에 해당하는 계정과목 찾기
    SELECT id INTO category_record
    FROM account_categories
    WHERE church_id = offering_record.church_id
      AND name = offering_record.fund_type
      AND type = 'income'
    LIMIT 1;

    -- 계정과목이 존재하는 경우만 처리
    IF category_record.id IS NOT NULL THEN
      -- 기부자 이름 조회
      donor_name := '무명';
      IF offering_record.member_id IS NOT NULL THEN
        SELECT name INTO donor_name
        FROM members
        WHERE id = offering_record.member_id
        LIMIT 1;
        
        IF donor_name IS NULL THEN
          donor_name := '무명';
        END IF;
      END IF;

      -- accounting_transactions 레코드 생성
      INSERT INTO accounting_transactions (
        church_id,
        transaction_date,
        category_id,
        type,
        amount,
        description,
        payment_method,
        input_user_id,
        created_at,
        updated_at
      ) VALUES (
        offering_record.church_id,
        offering_record.offered_on,
        category_record.id,
        'income',
        offering_record.amount,
        '헌금 - ' || donor_name || CASE WHEN offering_record.note IS NOT NULL AND offering_record.note != '' THEN ' (' || offering_record.note || ')' ELSE '' END,
        'other',
        offering_record.input_user_id,
        NOW(),
        NOW()
      )
      RETURNING id INTO transaction_id;

      -- offerings 테이블의 accounting_transaction_id 업데이트
      UPDATE offerings
      SET accounting_transaction_id = transaction_id,
          updated_at = NOW()
      WHERE id = offering_record.id;

      RAISE NOTICE '헌금 ID % -> 회계 거래 ID % 연동 완료', offering_record.id, transaction_id;
    ELSE
      RAISE NOTICE '헌금 ID %: 계정과목 "%"을 찾을 수 없음 (church_id: %)', offering_record.id, offering_record.fund_type, offering_record.church_id;
    END IF;
  END LOOP;
END $$;
