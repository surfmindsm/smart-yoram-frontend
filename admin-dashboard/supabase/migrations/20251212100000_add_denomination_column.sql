-- Add denomination and related columns to churches table

-- 1. Add denomination column
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS denomination VARCHAR(100);

-- 2. Add established_date column (if not exists)
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS established_date DATE;

-- 3. Add website column (if not exists)
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS website TEXT;

-- 4. Add description column (if not exists)
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS description TEXT;

-- 5. Add logo_url column (if not exists)
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 6. Update churches with denomination data from approved applications
UPDATE public.churches c
SET
  denomination = ca.denomination,
  established_date = CASE
    WHEN ca.established_year IS NOT NULL AND c.established_date IS NULL
    THEN make_date(ca.established_year, 1, 1)
    ELSE c.established_date
  END,
  website = COALESCE(c.website, ca.website),
  description = COALESCE(c.description, ca.description),
  updated_at = NOW()
FROM church_applications ca
WHERE ca.status = 'approved'
  AND ca.email = c.email
  AND (
    ca.denomination IS NOT NULL OR
    ca.established_year IS NOT NULL OR
    ca.website IS NOT NULL OR
    ca.description IS NOT NULL
  );

-- 7. Create function to auto-update church from application on approval
CREATE OR REPLACE FUNCTION sync_church_from_application()
RETURNS TRIGGER AS $$
BEGIN
  -- When application is approved, update or create church
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Check if church exists
    IF EXISTS (SELECT 1 FROM churches WHERE email = NEW.email) THEN
      -- Update existing church
      UPDATE churches SET
        denomination = COALESCE(NEW.denomination, denomination),
        established_date = CASE
          WHEN NEW.established_year IS NOT NULL AND established_date IS NULL
          THEN make_date(NEW.established_year, 1, 1)
          ELSE established_date
        END,
        website = COALESCE(website, NEW.website),
        homepage_url = COALESCE(homepage_url, NEW.homepage_url, NEW.website),
        youtube_channel = COALESCE(youtube_channel, NEW.youtube_channel),
        business_no = COALESCE(business_no, NEW.business_no),
        description = COALESCE(description, NEW.description),
        updated_at = NOW()
      WHERE email = NEW.email;
    ELSE
      -- Create new church
      INSERT INTO churches (
        name, pastor_name, email, phone, address,
        denomination, established_date, website, homepage_url,
        youtube_channel, business_no, description,
        subscription_status, subscription_plan, is_active, member_limit
      ) VALUES (
        NEW.church_name, NEW.pastor_name, NEW.email, NEW.phone, NEW.address,
        NEW.denomination,
        CASE WHEN NEW.established_year IS NOT NULL
          THEN make_date(NEW.established_year, 1, 1) ELSE NULL END,
        NEW.website,
        COALESCE(NEW.homepage_url, NEW.website),
        NEW.youtube_channel, NEW.business_no, NEW.description,
        'active', 'trial', true, 500
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger
DROP TRIGGER IF EXISTS trigger_sync_church_from_application ON church_applications;
CREATE TRIGGER trigger_sync_church_from_application
  AFTER INSERT OR UPDATE ON church_applications
  FOR EACH ROW
  EXECUTE FUNCTION sync_church_from_application();
