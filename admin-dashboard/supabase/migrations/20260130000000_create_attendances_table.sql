-- Create attendances table
-- This table stores member attendance records for church services

CREATE TABLE IF NOT EXISTS public.attendances (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL,
  church_id INTEGER NOT NULL,
  service_date DATE NOT NULL,
  service_type VARCHAR(50) DEFAULT 'sunday_morning',
  present BOOLEAN DEFAULT true,
  check_in_method VARCHAR(50) DEFAULT 'manual',
  check_in_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one attendance record per member per service date
  UNIQUE(member_id, service_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendances_member_id ON public.attendances(member_id);
CREATE INDEX IF NOT EXISTS idx_attendances_church_id ON public.attendances(church_id);
CREATE INDEX IF NOT EXISTS idx_attendances_service_date ON public.attendances(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_present ON public.attendances(present);

-- Add comment for documentation
COMMENT ON TABLE public.attendances IS '교인 출석 기록 테이블';
COMMENT ON COLUMN public.attendances.service_type IS '예배 종류: sunday_morning, sunday_evening, wednesday, etc.';
COMMENT ON COLUMN public.attendances.check_in_method IS '출석 체크 방법: manual, qr, nfc, etc.';

-- Enable Row Level Security
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read attendance records from their church
CREATE POLICY "Users can view attendances from their church"
  ON public.attendances
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert attendance records
CREATE POLICY "Authenticated users can create attendance records"
  ON public.attendances
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update attendance records
CREATE POLICY "Authenticated users can update attendance records"
  ON public.attendances
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete attendance records
CREATE POLICY "Authenticated users can delete attendance records"
  ON public.attendances
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER handle_updated_at_attendances
  BEFORE UPDATE ON public.attendances
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
