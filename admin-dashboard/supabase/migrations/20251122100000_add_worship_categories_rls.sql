-- Enable RLS on worship_service_categories table
ALTER TABLE public.worship_service_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.worship_service_categories;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.worship_service_categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.worship_service_categories;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.worship_service_categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.worship_service_categories;

-- Create RLS policies for worship_service_categories
-- Allow authenticated users to read categories
CREATE POLICY "Enable read access for authenticated users" ON public.worship_service_categories
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Allow service role to do everything (for Edge Functions)
CREATE POLICY "Enable all access for service role" ON public.worship_service_categories
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Enable insert for authenticated users" ON public.worship_service_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable update for authenticated users" ON public.worship_service_categories
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable delete for authenticated users" ON public.worship_service_categories
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
