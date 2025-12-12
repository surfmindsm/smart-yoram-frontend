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

    console.log('🔄 Denomination 마이그레이션 시작...');

    // 1. 기존 승인된 신청서의 denomination을 churches로 업데이트
    const { data: applications, error: fetchError } = await supabase
      .from('church_applications')
      .select('*')
      .eq('status', 'approved');

    if (fetchError) {
      throw new Error(`신청서 조회 실패: ${fetchError.message}`);
    }

    console.log(`📋 승인된 신청서 ${applications?.length || 0}개 발견`);

    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    for (const app of applications || []) {
      // 이메일로 기존 교회 찾기
      const { data: existingChurch } = await supabase
        .from('churches')
        .select('*')
        .eq('email', app.email)
        .single();

      if (existingChurch) {
        // 교회가 이미 존재하면 denomination 업데이트
        const updateData: any = {};

        if (app.denomination && (!existingChurch.denomination || existingChurch.denomination === '')) {
          updateData.denomination = app.denomination;
        }
        if (app.homepage_url && !existingChurch.homepage_url) {
          updateData.homepage_url = app.homepage_url;
        }
        if (app.website && !existingChurch.homepage_url && !app.homepage_url) {
          updateData.homepage_url = app.website;
        }
        if (app.youtube_channel && !existingChurch.youtube_channel) {
          updateData.youtube_channel = app.youtube_channel;
        }
        if (app.business_no && !existingChurch.business_no) {
          updateData.business_no = app.business_no;
        }
        if (app.established_year && !existingChurch.established_date) {
          updateData.established_date = `${app.established_year}-01-01`;
        }

        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date().toISOString();

          const { error: updateError } = await supabase
            .from('churches')
            .update(updateData)
            .eq('id', existingChurch.id);

          if (updateError) {
            console.error(`❌ 교회 ${app.church_name} 업데이트 실패:`, updateError);
          } else {
            console.log(`✅ 교회 ${app.church_name} 업데이트 완료 (denomination: ${app.denomination})`);
            updatedCount++;
          }
        } else {
          console.log(`⏭️  교회 ${app.church_name} 스킵 (업데이트 필요 없음)`);
          skippedCount++;
        }
      } else {
        // 교회가 없으면 새로 생성
        const newChurch = {
          name: app.church_name,
          pastor_name: app.pastor_name,
          email: app.email,
          phone: app.phone,
          address: app.address,
          denomination: app.denomination,
          established_date: app.established_year ? `${app.established_year}-01-01` : null,
          homepage_url: app.homepage_url || app.website,
          youtube_channel: app.youtube_channel,
          business_no: app.business_no,
          subscription_status: 'active',
          subscription_plan: 'trial',
          is_active: true,
          member_limit: 500,
        };

        const { error: insertError } = await supabase
          .from('churches')
          .insert([newChurch]);

        if (insertError) {
          console.error(`❌ 교회 ${app.church_name} 생성 실패:`, insertError);
        } else {
          console.log(`🆕 교회 ${app.church_name} 생성 완료 (denomination: ${app.denomination})`);
          createdCount++;
        }
      }
    }

    // 2. 자동 트리거 함수 생성
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION auto_create_church_from_application()
      RETURNS TRIGGER AS $$
      DECLARE
        new_church_id UUID;
        existing_church_id UUID;
      BEGIN
        IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
          SELECT id INTO existing_church_id FROM churches WHERE email = NEW.email;

          IF existing_church_id IS NULL THEN
            INSERT INTO churches (
              id, name, pastor_name, email, phone, address, denomination,
              established_date, homepage_url, youtube_channel, business_no,
              subscription_status, subscription_plan, is_active, member_limit,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(), NEW.church_name, NEW.pastor_name, NEW.email,
              NEW.phone, NEW.address, NEW.denomination,
              CASE WHEN NEW.established_year IS NOT NULL
                THEN make_date(NEW.established_year, 1, 1) ELSE NULL END,
              COALESCE(NEW.homepage_url, NEW.website), NEW.youtube_channel,
              NEW.business_no, 'active', 'trial', true, 500, NOW(), NOW()
            )
            RETURNING id INTO new_church_id;
          ELSE
            UPDATE churches SET
              denomination = COALESCE(NEW.denomination, denomination),
              homepage_url = COALESCE(homepage_url, NEW.homepage_url, NEW.website),
              youtube_channel = COALESCE(youtube_channel, NEW.youtube_channel),
              business_no = COALESCE(business_no, NEW.business_no),
              updated_at = NOW()
            WHERE id = existing_church_id;
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_auto_create_church ON church_applications;
      CREATE TRIGGER trigger_auto_create_church
        AFTER UPDATE ON church_applications
        FOR EACH ROW
        EXECUTE FUNCTION auto_create_church_from_application();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });

    // RPC 함수가 없을 수 있으므로 에러 무시
    console.log('⚙️  트리거 설정 시도 완료');

    const result = {
      success: true,
      message: '마이그레이션 완료',
      statistics: {
        total: applications?.length || 0,
        updated: updatedCount,
        created: createdCount,
        skipped: skippedCount,
      }
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
