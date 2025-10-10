// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      // 교회 가입 신청서 제출
      const formData = await req.formData()

      // 필수 필드 추출
      const church_name = formData.get('church_name') as string
      const pastor_name = formData.get('pastor_name') as string
      const admin_name = formData.get('admin_name') as string
      const email = formData.get('email') as string
      const phone = formData.get('phone') as string
      const address = formData.get('address') as string
      const description = formData.get('description') as string

      // 약관 동의 필드
      const agree_terms = formData.get('agree_terms') === 'true'
      const agree_privacy = formData.get('agree_privacy') === 'true'
      const agree_marketing = formData.get('agree_marketing') === 'true'

      // 필수 필드 검증
      if (!church_name || !pastor_name || !admin_name || !email || !phone || !address || !description) {
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

      // 선택 필드 추출
      const business_no = formData.get('business_no') as string | null
      const website = formData.get('website') as string | null
      const homepage_url = formData.get('homepage_url') as string | null
      const youtube_channel = formData.get('youtube_channel') as string | null
      const established_year = formData.get('established_year')
        ? parseInt(formData.get('established_year') as string)
        : null
      const denomination = formData.get('denomination') as string | null
      const member_count = formData.get('member_count')
        ? parseInt(formData.get('member_count') as string)
        : null

      // 파일 첨부 처리 (추후 구현)
      // const attachments = formData.getAll('attachments')

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

      console.log('📝 교회 신청서 저장 중:', insertData)

      const { data, error } = await supabaseClient
        .from('church_applications')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('❌ 교회 신청서 저장 실패:', error)
        return new Response(
          JSON.stringify({
            success: false,
            message: '신청서 저장에 실패했습니다.',
            error: error.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ 교회 신청서 저장 완료:', data.id)

      // 관리자에게 알림 이메일 발송
      try {
        const notifyResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-application`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({
              type: 'church',
              applicantEmail: email,
              applicantName: pastor_name,
              organizationName: church_name,
              applicationId: data.id,
            }),
          }
        )

        if (!notifyResponse.ok) {
          console.error('❌ 알림 이메일 발송 실패')
        } else {
          console.log('✅ 알림 이메일 발송 완료')
        }
      } catch (emailError) {
        console.error('❌ 알림 이메일 발송 오류:', emailError)
        // 이메일 실패해도 신청서는 저장되었으므로 계속 진행
      }

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
