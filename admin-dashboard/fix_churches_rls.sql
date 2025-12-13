-- churches 테이블의 RLS 정책 수정
-- 이 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view their own church" ON public.churches;
DROP POLICY IF EXISTS "Users can update their own church" ON public.churches;
DROP POLICY IF EXISTS "Super admins can view all churches" ON public.churches;
DROP POLICY IF EXISTS "Super admins can update all churches" ON public.churches;

-- 2. RLS 활성화 (이미 활성화되어 있을 수 있음)
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- 3. SELECT 정책: 사용자가 자신의 교회 정보를 조회할 수 있음
CREATE POLICY "Users can view their own church"
ON public.churches
FOR SELECT
USING (
  -- users 테이블의 church_id가 churches.id와 일치
  id IN (
    SELECT church_id
    FROM auth.users
    WHERE auth.users.id = auth.uid()
  )
  OR
  -- profiles 테이블의 church_id가 churches.id와 일치 (대안)
  id IN (
    SELECT church_id
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- 4. UPDATE 정책: 사용자가 자신의 교회 정보를 수정할 수 있음
CREATE POLICY "Users can update their own church"
ON public.churches
FOR UPDATE
USING (
  id IN (
    SELECT church_id
    FROM auth.users
    WHERE auth.users.id = auth.uid()
  )
  OR
  id IN (
    SELECT church_id
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- 5. super_admin을 위한 전체 조회 정책
CREATE POLICY "Super admins can view all churches"
ON public.churches
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- 6. super_admin을 위한 전체 수정 정책
CREATE POLICY "Super admins can update all churches"
ON public.churches
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);
