-- Add location-related fields to community_sharing table
ALTER TABLE public.community_sharing
ADD COLUMN IF NOT EXISTS province VARCHAR(50),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.community_sharing.province IS '도/시 (예: 서울특별시, 경기도)';
COMMENT ON COLUMN public.community_sharing.district IS '시/군/구 (예: 강남구, 수원시)';
COMMENT ON COLUMN public.community_sharing.delivery_available IS '택배 가능 여부';

-- Add location-related fields to community_requests table
ALTER TABLE public.community_requests
ADD COLUMN IF NOT EXISTS province VARCHAR(50),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.community_requests.province IS '도/시 (예: 서울특별시, 경기도)';
COMMENT ON COLUMN public.community_requests.district IS '시/군/구 (예: 강남구, 수원시)';
COMMENT ON COLUMN public.community_requests.delivery_available IS '택배 가능 여부';
