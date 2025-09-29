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

    // 1. auth.users에 이미 사용자가 있는지 확인
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.getUserByEmail(email)

    if (existingUser.user) {
      console.log('ℹ️ [초대 Edge Function] 사용자가 이미 존재함:', email)

      // 기존 사용자 메타데이터 업데이트
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.user.id, {
        user_metadata: {
          full_name: memberData.name,
          church_id: memberData.church_id,
          role: 'member',
          temporary_password: temporaryPassword
        }
      })

      if (updateError) {
        throw updateError
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: '기존 사용자 정보가 업데이트되었습니다.',
          user_id: existingUser.user.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. 새 사용자 생성
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: temporaryPassword,
      email_confirm: true, // 이메일 확인 건너뛰기
      user_metadata: {
        full_name: memberData.name,
        church_id: memberData.church_id,
        role: 'member'
      }
    })

    if (createError) {
      console.error('❌ [초대 Edge Function] 사용자 생성 실패:', createError)
      throw createError
    }

    console.log('✅ [초대 Edge Function] auth.users에 사용자 생성 성공:', newUser.user?.email)

    // 3. profiles 테이블에 프로필 생성
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user!.id,
        email: email,
        full_name: memberData.name,
        church_id: memberData.church_id,
        role: 'member'
      })

    if (profileError) {
      console.error('⚠️ [초대 Edge Function] 프로필 생성 실패:', profileError)
      // 프로필 생성 실패는 전체 프로세스를 실패로 처리하지 않음
    } else {
      console.log('✅ [초대 Edge Function] profiles 테이블에 프로필 생성 성공')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '사용자가 성공적으로 생성되었습니다.',
        user_id: newUser.user!.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [초대 Edge Function] 전체 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: '사용자 생성에 실패했습니다.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})