import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, verify } from 'https://deno.land/x/djwt@v2.8/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface LoginRequest {
  username: string;
  password: string;
}

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key';

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Form data 처리 (application/x-www-form-urlencoded)
    const formData = await req.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('🔐 로그인 시도:', { username });

    // Supabase Auth를 사용한 인증
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (authError || !authData.user) {
      console.error('❌ 인증 실패:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 사용자 프로필 정보 조회
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', username)
      .single();

    if (profileError) {
      console.error('❌ 프로필 조회 실패:', profileError.message);
    }

    // JWT 토큰 생성
    const payload = {
      sub: authData.user.id,
      email: authData.user.email,
      role: userProfile?.role || 'user',
      church_id: userProfile?.church_id,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1시간
    };

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    const jwt = await create({ alg: 'HS256', typ: 'JWT' }, payload, key);

    console.log('✅ 로그인 성공:', { userId: authData.user.id });

    return new Response(
      JSON.stringify({
        access_token: jwt,
        token_type: 'bearer',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: userProfile?.username || username,
          role: userProfile?.role || 'user',
          church_id: userProfile?.church_id,
          name: userProfile?.name,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Edge Function 오류:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})