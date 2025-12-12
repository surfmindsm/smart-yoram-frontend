import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // churches 테이블의 첫 번째 레코드 조회하여 컬럼 확인
    const { data: churches, error } = await supabase
      .from('churches')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    const columns = churches && churches.length > 0 ? Object.keys(churches[0]) : [];

    return new Response(
      JSON.stringify({
        success: true,
        columns: columns,
        hasDenomination: columns.includes('denomination'),
        sampleData: churches && churches.length > 0 ? churches[0] : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
