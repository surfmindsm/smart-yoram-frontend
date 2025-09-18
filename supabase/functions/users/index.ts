import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// JWT 토큰 검증 함수
async function verifyJWT(token: string) {
  try {
    const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key';
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    
    const payload = await verify(token, key);
    return payload;
  } catch (error) {
    console.error('JWT 검증 실패:', error);
    return null;
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    
    // /users/me 엔드포인트 처리
    if (pathParts.includes('me')) {
      // JWT 토큰 검증
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // 현재 사용자 정보 조회
      const { data: user, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', payload.sub)
        .single();

      if (error) {
        console.error('사용자 조회 실패:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(JSON.stringify(user), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 일반 사용자 관리 엔드포인트
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyJWT(token);

    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const churchId = payload.church_id;
    const userId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'GET':
        if (userId && userId !== 'users') {
          // 특정 사용자 조회
          const { data: user, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .eq('church_id', churchId)
            .single();

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(JSON.stringify(user), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // 전체 사용자 목록 조회
          const { data: users, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('church_id', churchId)
            .order('created_at', { ascending: false });

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(JSON.stringify(users), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'POST':
        // 새 사용자 생성
        const userData = await req.json();
        userData.church_id = churchId;
        userData.created_at = new Date().toISOString();

        // Supabase Auth에 사용자 생성
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
          email: userData.email,
          password: userData.password || 'temporary123',
          email_confirm: true
        });

        if (authError) {
          return new Response(
            JSON.stringify({ error: authError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // users 테이블에 추가 정보 저장
        userData.id = authUser.user.id;
        delete userData.password;

        const { data: newUser, error: createError } = await supabaseClient
          .from('users')
          .insert(userData)
          .select()
          .single();

        if (createError) {
          // Auth에서 생성된 사용자 삭제
          await supabaseClient.auth.admin.deleteUser(authUser.user.id);
          
          return new Response(
            JSON.stringify({ error: createError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(newUser), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'PUT':
        if (!userId || userId === 'users') {
          return new Response(
            JSON.stringify({ error: 'User ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const updateData = await req.json();
        delete updateData.id;
        delete updateData.church_id;
        updateData.updated_at = new Date().toISOString();

        const { data: updatedUser, error: updateError } = await supabaseClient
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .eq('church_id', churchId)
          .select()
          .single();

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(updatedUser), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'DELETE':
        if (!userId || userId === 'users') {
          return new Response(
            JSON.stringify({ error: 'User ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // users 테이블에서 삭제
        const { error: deleteError } = await supabaseClient
          .from('users')
          .delete()
          .eq('id', userId)
          .eq('church_id', churchId);

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Auth에서도 삭제
        await supabaseClient.auth.admin.deleteUser(userId);

        return new Response(
          JSON.stringify({ message: 'User deleted successfully' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      default:
        return new Response('Method not allowed', { 
          status: 405, 
          headers: corsHeaders 
        });
    }

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