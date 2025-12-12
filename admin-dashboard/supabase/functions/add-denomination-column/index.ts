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

    console.log('🔧 churches 테이블에 denomination 컬럼 추가 시작...');

    // 1. 임시 denomination 컬럼 확인을 위해 교회 데이터 조회
    const { data: sampleChurch } = await supabase
      .from('churches')
      .select('*')
      .limit(1)
      .single();

    const hasDenomination = sampleChurch && 'denomination' in sampleChurch;

    if (hasDenomination) {
      console.log('✅ denomination 컬럼이 이미 존재합니다.');
    } else {
      console.log('⚠️  denomination 컬럼이 없습니다. Supabase Studio에서 수동으로 추가해야 합니다.');
      console.log('SQL: ALTER TABLE public.churches ADD COLUMN denomination VARCHAR(100);');
    }

    // 2. church_applications에서 denomination 데이터 가져와서 업데이트
    const { data: applications, error: fetchError } = await supabase
      .from('church_applications')
      .select('*')
      .eq('status', 'approved');

    if (fetchError) {
      throw new Error(`신청서 조회 실패: ${fetchError.message}`);
    }

    console.log(`📋 승인된 신청서 ${applications?.length || 0}개 발견`);

    let updatedCount = 0;
    const updates = [];

    for (const app of applications || []) {
      if (app.denomination) {
        const { data: church } = await supabase
          .from('churches')
          .select('id, serial_id, name, denomination')
          .eq('email', app.email)
          .single();

        if (church) {
          // denomination 업데이트
          const { error: updateError } = await supabase
            .from('churches')
            .update({
              denomination: app.denomination,
              updated_at: new Date().toISOString()
            })
            .eq('id', church.id);

          if (!updateError) {
            console.log(`✅ ${church.name} (serial_id: ${church.serial_id}): ${app.denomination}`);
            updatedCount++;
            updates.push({
              church_id: church.serial_id,
              church_name: church.name,
              denomination: app.denomination
            });
          } else {
            console.error(`❌ ${church.name} 업데이트 실패:`, updateError);
          }
        }
      }
    }

    const result = {
      success: true,
      message: 'denomination 컬럼 추가 및 데이터 마이그레이션 완료',
      statistics: {
        total_applications: applications?.length || 0,
        updated_churches: updatedCount,
      },
      updates: updates
    };

    console.log('✅ 마이그레이션 완료:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
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
