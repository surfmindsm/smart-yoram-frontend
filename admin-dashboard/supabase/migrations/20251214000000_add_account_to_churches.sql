-- Add account field to churches table for donation account information
ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS account TEXT;

COMMENT ON COLUMN public.churches.account IS '교회 헌금 계좌 정보';
