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
    // Initialize Supabase client with Service Role Key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    if (req.method === 'POST') {
      // 커뮤니티 가입 신청서 제출
      const body = await req.json()

      // 필수 필드 추출
      const {
        applicant_type,
        organization_name,
        contact_person,
        email,
        phone,
        description,
        agree_terms,
        agree_privacy,
        agree_marketing,
        business_number,
        address,
        service_area,
        website,
        attachments
      } = body

      // 필수 필드 검증
      if (!applicant_type || !organization_name || !contact_person || !email || !phone || !description) {
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
        applicant_type,
        organization_name,
        contact_person,
        email,
        phone,
        description,
        agree_terms,
        agree_privacy,
        agree_marketing,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      }

      // 선택 필드 추가
      if (business_number) insertData.business_number = business_number
      if (address) insertData.address = address
      if (service_area) insertData.service_area = service_area
      if (website) insertData.website = website

      // 첨부파일 정보 추가 (JSONB 형식)
      if (attachments && Array.isArray(attachments)) {
        insertData.attachments = JSON.stringify(attachments)
      }

      console.log('📝 커뮤니티 신청서 저장 중:', insertData)

      const { data, error } = await supabaseClient
        .from('community_applications')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('❌ 커뮤니티 신청서 저장 실패:', error)
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

      console.log('✅ 커뮤니티 신청서 저장 완료:', data.id)

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
      // 커뮤니티 신청서 승인/반려 처리
      const body = await req.json()
      const { applicationId, status, rejectionReason, notes } = body

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

      console.log(`📝 커뮤니티 신청서 ${status === 'approved' ? '승인' : '반려'} 처리 중:`, applicationId)

      // 업데이트 데이터 구성
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 1
      }

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason
      }

      if (notes) {
        updateData.notes = notes
      }

      // Service Role Key로 UPDATE 수행 (RLS 우회)
      const { data: updatedApplication, error: updateError } = await supabaseClient
        .from('community_applications')
        .update(updateData)
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

      console.log(`✅ 커뮤니티 신청서 ${status} 처리 완료:`, applicationId)

      // 승인 시 users 테이블 생성 및 이메일 알림 발송
      if (status === 'approved') {
        try {
          console.log('🔑 임시 비밀번호 생성 중...')

          // 임시 비밀번호 생성 (8자리: 대문자, 소문자, 숫자 조합)
          const generateTempPassword = (): string => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let password = '';
            for (let i = 0; i < 8; i++) {
              password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
          };

          const temporaryPassword = generateTempPassword();
          const username = updatedApplication.email; // 이메일을 username으로 사용

          console.log('👤 [커뮤니티 승인] users 테이블에 사용자 생성 시작:', username)

          // 이메일로 기존 사용자 확인
          const { data: existingUser } = await supabaseClient
            .from('users')
            .select('id, email')
            .eq('email', updatedApplication.email)
            .maybeSingle()

          if (existingUser) {
            console.log('ℹ️ [커뮤니티 승인] 이미 존재하는 사용자:', existingUser.email)
            // 기존 사용자가 있으면 role만 업데이트
            await supabaseClient
              .from('users')
              .update({
                role: 'member',
                is_active: true
              })
              .eq('id', existingUser.id)
          } else {
            // 새로운 사용자 생성
            const { error: userError } = await supabaseClient
              .from('users')
              .insert({
                username: username,
                email: updatedApplication.email,
                full_name: updatedApplication.contact_person,
                hashed_password: temporaryPassword,
                church_id: 9998, // 커뮤니티 회원은 교회 없음
                role: 'member',
                is_active: true,
                is_first: true
              })

            if (userError) {
              console.error('❌ [커뮤니티 승인] users 테이블 삽입 오류:', userError)
              throw userError
            }

            console.log('✅ [커뮤니티 승인] users 테이블에 사용자 생성 완료:', username)
          }

          console.log('📧 승인 이메일 발송 중...')

          const notifyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-application`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
            },
            body: JSON.stringify({
              type: 'community_approved',
              applicantEmail: updatedApplication.email,
              applicantName: updatedApplication.contact_person,
              organizationName: updatedApplication.organization_name,
              applicationId: applicationId,
              username: username,
              temporaryPassword: temporaryPassword
            })
          })

          if (notifyResponse.ok) {
            console.log('✅ 승인 이메일 발송 완료 (아이디:', username, ')')
          } else {
            console.error('❌ 승인 이메일 발송 실패:', await notifyResponse.text())
          }
        } catch (emailError) {
          console.error('❌ 이메일/사용자 생성 오류:', emailError)
          // 오류 발생 시에도 승인은 완료되지만 로그 남김
        }
      }

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
