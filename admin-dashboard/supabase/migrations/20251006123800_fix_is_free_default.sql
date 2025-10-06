-- Fix is_free column default value to false instead of true
-- This ensures that items are not free by default (for item sales)
-- 무료나눔: is_free=true, 물품판매: is_free=false

ALTER TABLE community_sharing
ALTER COLUMN is_free SET DEFAULT false;

-- 기존에 잘못 저장된 물품판매 데이터 수정 (price가 0보다 크면 물품판매로 간주)
UPDATE community_sharing
SET is_free = false
WHERE price > 0 AND is_free = true;
