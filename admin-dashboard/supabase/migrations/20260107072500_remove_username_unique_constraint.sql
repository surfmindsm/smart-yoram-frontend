-- Remove UNIQUE constraint from users.username to allow duplicate names
-- This is necessary because multiple users can have the same name (동명이인)
-- Users are uniquely identified by email instead

DROP INDEX IF EXISTS public.ix_users_username;

-- Add comment to document this change
COMMENT ON COLUMN public.users.username IS '사용자 이름 (동명이인 가능, email로 고유 식별)';
