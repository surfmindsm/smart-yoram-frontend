-- Add total_amount column to existing receipts table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'receipts'
    AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE public.receipts ADD COLUMN total_amount DECIMAL(15,2) NULL;
    COMMENT ON COLUMN public.receipts.total_amount IS 'Total donation amount for the receipt';
  END IF;
END $$;

-- Update existing receipts to calculate total_amount from offerings
-- This will sum up all offerings for each member for the specific tax year
UPDATE public.receipts r
SET total_amount = COALESCE(
  (
    SELECT SUM(CAST(o.amount AS DECIMAL(15,2)))
    FROM public.offerings o
    WHERE o.member_id = r.member_id
      AND o.church_id = r.church_id
      AND EXTRACT(YEAR FROM o.offered_on) = r.tax_year
  ),
  0
)
WHERE total_amount IS NULL;

-- Make total_amount NOT NULL and set default after backfilling
ALTER TABLE public.receipts ALTER COLUMN total_amount SET NOT NULL;
ALTER TABLE public.receipts ALTER COLUMN total_amount SET DEFAULT 0;

COMMENT ON TABLE public.receipts IS 'Stores donation receipts for tax purposes';
