-- Link attendances to worship_services
-- Adds worship_service_id FK to attendances so each attendance is tied to a specific worship service.
-- Existing rows are left with NULL worship_service_id (no backfill).

-- 1) Add nullable FK column
ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS worship_service_id BIGINT REFERENCES public.worship_services(id) ON DELETE SET NULL;

-- 2) Index for faster joins / filtering
CREATE INDEX IF NOT EXISTS idx_attendances_worship_service_id
  ON public.attendances(worship_service_id);

CREATE INDEX IF NOT EXISTS idx_attendances_church_service_date
  ON public.attendances(church_id, worship_service_id, service_date DESC);

-- 3) Relax unique constraint to allow multiple services per day per member
--    Old constraint: UNIQUE(member_id, service_date) — blocks morning + evening on same day.
--    New behavior: unique per (member_id, service_date, worship_service_id)
--    for rows that link to a worship service. Legacy rows (worship_service_id IS NULL)
--    are intentionally NOT covered by a unique constraint because existing data may
--    already contain duplicates that we don't want to discard here.
ALTER TABLE public.attendances
  DROP CONSTRAINT IF EXISTS attendances_member_id_service_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS attendances_member_service_unique
  ON public.attendances (member_id, service_date, worship_service_id)
  WHERE worship_service_id IS NOT NULL;

COMMENT ON COLUMN public.attendances.worship_service_id IS 'FK to worship_services. Nullable for legacy rows created before this column existed.';
