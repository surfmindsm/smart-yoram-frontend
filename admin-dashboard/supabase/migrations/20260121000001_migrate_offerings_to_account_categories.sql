-- 기존 헌금 종류를 계정과목(수입)으로 마이그레이션
-- church_id = 0 은 공통 템플릿, 각 교회가 자동으로 복사하여 사용

-- '헌금' 상위 카테고리는 is_offering=false 유지 (상위 카테고리이므로)
update public.account_categories
set is_offering = false
where name = '헌금' and type = 'income' and church_id = 0 and parent_id is null;

-- 기존 '헌금' 하위 항목들은 is_offering=true로 업데이트
update public.account_categories
set is_offering = true
where parent_id in (
  select id from public.account_categories
  where name = '헌금' and type = 'income' and church_id = 0 and parent_id is null
);

-- 추가 헌금 과목 삽입 (기존에 없는 항목들만)
do $$
declare
  offering_names text[] := array[
    '감사절',
    '구제헌금',
    '맥추감사절',
    '부활절',
    '성탄절',
    '신년헌금',
    '연말감사헌금',
    '일천번제',
    '장학헌금'
  ];
  offering_name text;
  parent_category_id integer;
  idx integer := 10;
begin
  -- '헌금' 상위 카테고리 ID 가져오기
  select id into parent_category_id
  from public.account_categories
  where name = '헌금' and type = 'income' and church_id = 0 and parent_id is null;

  if parent_category_id is null then
    raise notice '⚠️  "헌금" 상위 카테고리를 찾을 수 없습니다.';
    return;
  end if;

  raise notice '✅ "헌금" 상위 카테고리 ID: %', parent_category_id;

  -- 각 헌금 종류를 하위 항목으로 추가
  foreach offering_name in array offering_names
  loop
    -- 중복 체크 후 삽입
    if not exists (
      select 1 from public.account_categories
      where name = offering_name
        and type = 'income'
        and parent_id = parent_category_id
        and church_id = 0
    ) then
      insert into public.account_categories (
        church_id,
        name,
        type,
        parent_id,
        is_offering,
        is_active,
        display_order
      ) values (
        0,  -- 템플릿용
        offering_name,
        'income',
        parent_category_id,
        true,  -- 헌금 하위 항목은 모두 true
        true,
        idx
      );

      raise notice '✅ 헌금 계정과목 추가: % (parent_id: %)', offering_name, parent_category_id;
    else
      -- 이미 존재하면 is_offering만 true로 업데이트
      update public.account_categories
      set is_offering = true
      where name = offering_name
        and type = 'income'
        and parent_id = parent_category_id
        and church_id = 0;

      raise notice '🔄 기존 헌금 계정과목 업데이트: %', offering_name;
    end if;

    idx := idx + 1;
  end loop;
end $$;

-- 확인용 쿼리 (결과 출력)
do $$
declare
  offering_count integer;
  parent_id integer;
begin
  -- '헌금' 상위 카테고리 ID
  select id into parent_id
  from public.account_categories
  where name = '헌금' and type = 'income' and church_id = 0 and parent_id is null;

  -- is_offering=true 인 하위 항목 개수
  select count(*) into offering_count
  from public.account_categories
  where type = 'income'
    and is_offering = true
    and parent_id = parent_id
    and church_id = 0;

  raise notice '📊 총 헌금 계정과목 개수: %', offering_count;
  raise notice '📋 헌금 상위 카테고리 ID: %', parent_id;
end $$;
