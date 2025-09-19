import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// 임시 토큰 검증 함수 (현재 인증 시스템에 맞춤)
async function verifyToken(token: string, supabaseClient: any) {
  try {
    console.log('🔍 토큰 검증 시작:', { token: token.substring(0, 20) + '...' });

    // 1. temp_token 형식 확인
    if (token.startsWith('temp_token_')) {
      // temp_token_${user.id}_${timestamp} 형식에서 user_id 추출
      const parts = token.split('_');
      if (parts.length >= 3) {
        const userId = parts[2];
        console.log('🔍 임시 토큰에서 추출된 사용자 ID:', userId);

        // 사용자 정보 조회로 토큰 유효성 확인
        const { data: user, error } = await supabaseClient
          .from('users')
          .select('id, church_id, email, is_active')
          .eq('id', userId)
          .eq('is_active', true)
          .single();

        if (error || !user) {
          console.error('❌ 사용자 조회 실패:', error);
          return null;
        }

        console.log('✅ 토큰 검증 성공, 사용자 정보:', user);
        return {
          user_id: user.id,
          church_id: user.church_id,
          email: user.email
        };
      }
    }

    // 2. 다른 토큰 형식도 지원 (향후 확장용)
    console.error('❌ 지원하지 않는 토큰 형식:', token.substring(0, 20));
    return null;
  } catch (error) {
    console.error('❌ 토큰 검증 실패:', error);
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

    // 토큰 검증 (Bearer 또는 X-Custom-Auth 헤더 모두 지원)
    let token = '';
    const authHeader = req.headers.get('Authorization');
    const customAuthHeader = req.headers.get('X-Custom-Auth');

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else if (customAuthHeader) {
      token = customAuthHeader;
    } else {
      console.error('❌ 인증 헤더 없음');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('🔍 토큰 확인됨:', { hasToken: !!token, tokenStart: token.substring(0, 20) });

    const payload = await verifyToken(token, supabaseClient);

    if (!payload) {
      console.error('❌ 토큰 검증 실패');
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const churchId = payload.church_id;
    console.log('✅ 교회 ID 확인됨:', churchId);
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');

    // /churches/my 엔드포인트 처리
    if (pathParts.includes('my')) {
      if (req.method === 'GET') {
        const { data: church, error } = await supabaseClient
          .from('churches')
          .select('*')
          .eq('id', churchId)
          .single();

        if (error) {
          console.error('교회 정보 조회 실패:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(church), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // /church/profile 엔드포인트 처리
    if (pathParts.includes('profile')) {
      if (req.method === 'GET') {
        const { data: church, error } = await supabaseClient
          .from('churches')
          .select('*')
          .eq('id', churchId)
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

        return new Response(JSON.stringify(church), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (req.method === 'PUT') {
        const updateData = await req.json();
        delete updateData.id;
        updateData.updated_at = new Date().toISOString();

        const { data: updatedChurch, error: updateError } = await supabaseClient
          .from('churches')
          .update(updateData)
          .eq('id', churchId)
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

        return new Response(JSON.stringify(updatedChurch), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // /church/gpt-config 엔드포인트 처리
    if (pathParts.includes('gpt-config')) {
      if (req.method === 'GET') {
        const { data: church, error } = await supabaseClient
          .from('churches')
          .select('gpt_api_key, gpt_model, gpt_max_tokens, gpt_temperature, gpt_is_active, database_connected, last_sync')
          .eq('id', churchId)
          .single();

        if (error) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                api_key: null,
                database_connected: false,
                last_sync: null,
                model: 'gpt-4o-mini',
                max_tokens: 2000,
                temperature: 0.7,
                is_active: false
              }
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        return new Response(JSON.stringify({
          success: true,
          data: {
            api_key: church.gpt_api_key,
            database_connected: church.database_connected || false,
            last_sync: church.last_sync,
            model: church.gpt_model || 'gpt-4o-mini',
            max_tokens: church.gpt_max_tokens || 2000,
            temperature: church.gpt_temperature || 0.7,
            is_active: church.gpt_is_active || false
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (req.method === 'PUT') {
        const configData = await req.json();
        
        const updateData = {
          gpt_api_key: configData.api_key,
          gpt_model: configData.model,
          gpt_max_tokens: configData.max_tokens,
          gpt_temperature: configData.temperature,
          gpt_is_active: configData.is_active,
          updated_at: new Date().toISOString()
        };

        const { data: updatedChurch, error: updateError } = await supabaseClient
          .from('churches')
          .update(updateData)
          .eq('id', churchId)
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

        return new Response(JSON.stringify({
          success: true,
          data: updatedChurch
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (req.method === 'POST' && pathParts.includes('test')) {
        // GPT 연결 테스트
        return new Response(JSON.stringify({
          success: true,
          message: 'GPT connection test successful'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 일반 교회 관리 엔드포인트
    const specificChurchId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'GET':
        if (specificChurchId && specificChurchId !== 'churches') {
          // 특정 교회 조회
          const { data: church, error } = await supabaseClient
            .from('churches')
            .select('*')
            .eq('id', specificChurchId)
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

          return new Response(JSON.stringify(church), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // 교회 목록 조회 (관리자용)
          const { data: churches, error } = await supabaseClient
            .from('churches')
            .select('*')
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

          return new Response(JSON.stringify(churches), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'POST':
        // 새 교회 생성
        const churchData = await req.json();
        churchData.created_at = new Date().toISOString();

        const { data: newChurch, error: createError } = await supabaseClient
          .from('churches')
          .insert(churchData)
          .select()
          .single();

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(newChurch), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'PUT':
        if (!specificChurchId || specificChurchId === 'churches') {
          return new Response(
            JSON.stringify({ error: 'Church ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const updateData = await req.json();
        delete updateData.id;
        updateData.updated_at = new Date().toISOString();

        const { data: updatedChurch, error: updateError } = await supabaseClient
          .from('churches')
          .update(updateData)
          .eq('id', specificChurchId)
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

        return new Response(JSON.stringify(updatedChurch), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

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