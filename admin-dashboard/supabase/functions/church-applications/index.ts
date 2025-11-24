// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    if (req.method === 'POST') {
      // 교회 가입 신청서 제출 (JSON 기반)
      const body = await req.json()

      // 필수 필드 추출
      const {
        church_name,
        pastor_name,
        admin_name,
        email,
        phone,
        address,
        description,
        agree_terms,
        agree_privacy,
        agree_marketing,
        business_no,
        website,
        homepage_url,
        youtube_channel,
        established_year,
        denomination,
        member_count,
        attachments
      } = body

      // 필수 필드 검증 (빈 문자열도 허용하지 않음)
      if (!church_name || !pastor_name || !admin_name || !email || !phone || !address) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '필수 필드가 누락되었습니다.'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (!agree_terms || !agree_privacy) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '필수 약관에 동의해주세요.'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // DB에 신청서 저장
      const insertData: any = {
        church_name,
        pastor_name,
        admin_name,
        email,
        phone,
        address,
        description,
        agree_terms,
        agree_privacy,
        agree_marketing,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      }

      // 선택 필드 추가
      if (business_no) insertData.business_no = business_no
      if (website) insertData.website = website
      if (homepage_url) insertData.homepage_url = homepage_url
      if (youtube_channel) insertData.youtube_channel = youtube_channel
      if (established_year) insertData.established_year = established_year
      if (denomination) insertData.denomination = denomination
      if (member_count) insertData.member_count = member_count

      // 첨부파일 정보 추가 (JSONB 형식)
      if (attachments && Array.isArray(attachments)) {
        insertData.attachments = JSON.stringify(attachments)
      }

      console.log('📝 교회 신청서 저장 중:', insertData)

      const { data, error } = await supabaseClient
        .from('church_applications')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('❌ 교회 신청서 저장 실패:', error)
        console.error('❌ Error details:', JSON.stringify(error, null, 2))
        return new Response(
          JSON.stringify({
            success: false,
            message: '신청서 저장에 실패했습니다.',
            error: error.message,
            error_details: error.details,
            error_hint: error.hint,
            error_code: error.code
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ 교회 신청서 저장 완료:', data.id)

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            application_id: data.id,
            status: data.status,
            submitted_at: data.submitted_at,
          },
          message: '신청서가 성공적으로 제출되었습니다.',
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'PUT') {
      // 교회 신청서 승인/반려 처리
      const body = await req.json()
      const { applicationId, status } = body

      if (!applicationId || !status) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '필수 필드가 누락되었습니다.'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (status !== 'approved' && status !== 'rejected') {
        return new Response(
          JSON.stringify({
            success: false,
            message: '유효하지 않은 상태입니다.'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`📝 교회 신청서 ${status === 'approved' ? '승인' : '반려'} 처리 중:`, applicationId)

      // Service Role Key로 UPDATE 수행 (RLS 우회)
      const { data: updatedApplication, error: updateError } = await supabaseClient
        .from('church_applications')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 1
        })
        .eq('id', applicationId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ 상태 업데이트 실패:', updateError)
        return new Response(
          JSON.stringify({
            success: false,
            message: '상태 업데이트에 실패했습니다.',
            error: updateError.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`✅ 교회 신청서 ${status} 처리 완료:`, applicationId)

      return new Response(
        JSON.stringify({
          success: true,
          data: updatedApplication,
          message: `신청서가 ${status === 'approved' ? '승인' : '반려'}되었습니다.`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
