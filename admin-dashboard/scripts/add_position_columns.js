const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adzhdsajdamrflvybhxq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addPositionColumns() {
  console.log('Adding position columns to members table...');

  // Execute SQL using Supabase client
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
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
              ALTER TABLE public.members ADD COLUMN position_main VARCHAR(50);
              RAISE NOTICE 'Added position_main column';
          ELSE
              RAISE NOTICE 'position_main column already exists';
          END IF;
      END$$;

      -- 3. Create indexes if they don't exist
      CREATE INDEX IF NOT EXISTS idx_members_position_main ON public.members(position_main);
      CREATE INDEX IF NOT EXISTS idx_members_position_detail ON public.members(position_detail);
    `
  });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('Success! Position columns added.');
  console.log('Data:', data);
}

addPositionColumns();
