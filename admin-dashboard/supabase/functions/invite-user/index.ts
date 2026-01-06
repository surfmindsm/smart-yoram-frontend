import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { email, temporaryPassword, memberData } = await req.json()

    console.log('👤 [초대 Edge Function] 사용자 생성 시작:', { email, memberData })

    // 1. 먼저 users 테이블에 레코드가 있는지 확인
    const { data: existingUsersRecord, error: findUsersError } = await supabaseAdmin
      .from('users')
      .select('id, email, username')
      .eq('email', email)
      .maybeSingle()

    if (existingUsersRecord) {
      console.log('ℹ️ [초대 Edge Function] users 테이블에 이미 존재 (앱에서 가입했거나 이미 초대받음):', email)
      console.log('   → 기존 users 레코드를 유지하고 members.user_id만 연결합니다.')

      // members.user_id만 업데이트 (기존 users 레코드는 건드리지 않음)
      if (memberData.member_id) {
        const { error: memberUpdateError } = await supabaseAdmin
          .from('members')
          .update({ user_id: existingUsersRecord.id.toString() })
          .eq('id', memberData.member_id)

        if (memberUpdateError) {
          console.error('⚠️ [초대 Edge Function] members.user_id 업데이트 실패:', memberUpdateError)
        } else {
          console.log('✅ [초대 Edge Function] members.user_id 연결 성공:', existingUsersRecord.id)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: '기존 사용자 계정과 연결되었습니다.',
          user_id: existingUsersRecord.id,
          is_existing_user: true  // 명확한 플래그 추가
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('ℹ️ [초대 Edge Function] users 테이블에 없음 → 새로 생성합니다.')

    // 2. users 테이블에 바로 생성 (auth.users는 사용 안 함)
    console.log('ℹ️ [초대 Edge Function] users 테이블에 삽입할 데이터:', {
      email: email,
      username: memberData.name,
      full_name: memberData.name,
      church_id: memberData.church_id,
      role: 'member'
    })

    const { data: newUsersRecord, error: usersError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email,
        username: memberData.name, // members의 name을 username으로 사용
        full_name: memberData.name,
        phone: memberData.phone, // members의 phone을 users에 전달
        hashed_password: temporaryPassword, // 임시 비밀번호 (해시 전)
        church_id: memberData.church_id,
        role: 'member',
        is_active: true,
        is_first: true // 초대를 통해 생성된 사용자
      })
      .select()
      .single()

    if (usersError) {
      console.error('❌ [초대 Edge Function] users 테이블 생성 실패:', usersError)
      console.error('❌ [초대 Edge Function] 에러 코드:', usersError.code)
      console.error('❌ [초대 Edge Function] 에러 상세:', usersError.details)
      console.error('❌ [초대 Edge Function] 에러 힌트:', usersError.hint)
      throw new Error(`users 테이블 생성 실패: ${usersError.message} (코드: ${usersError.code})`)
    }

    console.log('✅ [초대 Edge Function] users 테이블에 사용자 생성 성공:', newUsersRecord)

    // 3. members 테이블의 user_id 업데이트 (연결)
    if (newUsersRecord && memberData.member_id) {
      const { error: memberUpdateError } = await supabaseAdmin
        .from('members')
        .update({ user_id: newUsersRecord.id.toString() })
        .eq('id', memberData.member_id)

      if (memberUpdateError) {
        console.error('⚠️ [초대 Edge Function] members.user_id 업데이트 실패:', memberUpdateError)
      } else {
        console.log('✅ [초대 Edge Function] members.user_id 업데이트 성공:', newUsersRecord.id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '사용자가 성공적으로 생성되었습니다.',
        user_id: newUsersRecord.id,
        is_existing_user: false  // 신규 사용자 플래그
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [초대 Edge Function] 전체 오류:', error)
    console.error('❌ [초대 Edge Function] 오류 상세:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        error_name: error.name,
        error_stack: error.stack?.substring(0, 500),
        message: '사용자 생성에 실패했습니다.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})