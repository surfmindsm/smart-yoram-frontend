-- Add position_main and position_detail columns to members table
-- This is a simplified version to avoid conflicts

-- 1. Add position_detail column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'position_detail'
    ) THEN
        ALTER TABLE public.members ADD COLUMN position_detail VARCHAR(50);
        RAISE NOTICE 'Added position_detail column';
    ELSE
        RAISE NOTICE 'position_detail column already exists';
    END IF;
END$$;

-- 2. Rename position to position_main if needed
DO $$
BEGIN
    -- Check if position column exists and position_main doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'position'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'position_main'
    ) THEN
        ALTER TABLE public.members RENAME COLUMN position TO position_main;
        RAISE NOTICE 'Renamed position to position_main';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'position_main'
    ) THEN
        -- If neither exists, create position_main
        ALTER TABLE public.members ADD COLUMN position_main VARCHAR(50);
        RAISE NOTICE 'Added position_main column';
    ELSE
        RAISE NOTICE 'position_main column already exists';
    END IF;
END$$;

-- 3. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_members_position_main ON public.members(position_main);
CREATE INDEX IF NOT EXISTS idx_members_position_detail ON public.members(position_detail);

-- 4. Add comments
COMMENT ON COLUMN public.members.position_main IS '직분 대분류: CLERGY(교역자), ELDER(장로), DEACONESS(권사), DEACON(집사), MEMBER(성도)';
COMMENT ON COLUMN public.members.position_detail IS '직분 세부: SENIOR_PASTOR(담임목사), EMERITUS_ELDER(원로장로), HONORARY_DEACONESS(명예권사) 등';
