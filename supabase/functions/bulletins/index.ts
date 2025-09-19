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

    const churchId = payload.church_id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const bulletinId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'GET':
        if (bulletinId && bulletinId !== 'bulletins') {
          // 특정 주보 조회
          const { data: bulletin, error } = await supabaseClient
            .from('bulletins')
            .select(`
              *,
              author:users!author_id(id, name, email)
            `)
            .eq('id', bulletinId)
            .eq('church_id', churchId)
            .single();

          if (error) {
            console.error('주보 조회 실패:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(JSON.stringify(bulletin), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // 주보 목록 조회
          const { data: bulletins, error } = await supabaseClient
            .from('bulletins')
            .select(`
              *,
              author:users!author_id(id, name, email)
            `)
            .eq('church_id', churchId)
            .order('service_date', { ascending: false })
            .order('created_at', { ascending: false });

          if (error) {
            console.error('주보 목록 조회 실패:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(JSON.stringify(bulletins), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'POST':
        // 새 주보 생성
        const bulletinData = await req.json();
        bulletinData.church_id = churchId;
        bulletinData.author_id = payload.sub;
        bulletinData.created_at = new Date().toISOString();

        const { data: newBulletin, error: createError } = await supabaseClient
          .from('bulletins')
          .insert(bulletinData)
          .select(`
            *,
            author:users!author_id(id, name, email)
          `)
          .single();

        if (createError) {
          console.error('주보 생성 실패:', createError);
          return new Response(
            JSON.stringify({ error: createError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(newBulletin), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'PUT':
        if (!bulletinId || bulletinId === 'bulletins') {
          return new Response(
            JSON.stringify({ error: 'Bulletin ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const updateData = await req.json();
        delete updateData.id;
        delete updateData.church_id;
        delete updateData.author_id;
        updateData.updated_at = new Date().toISOString();

        const { data: updatedBulletin, error: updateError } = await supabaseClient
          .from('bulletins')
          .update(updateData)
          .eq('id', bulletinId)
          .eq('church_id', churchId)
          .select(`
            *,
            author:users!author_id(id, name, email)
          `)
          .single();

        if (updateError) {
          console.error('주보 수정 실패:', updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(updatedBulletin), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'DELETE':
        if (!bulletinId || bulletinId === 'bulletins') {
          return new Response(
            JSON.stringify({ error: 'Bulletin ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { error: deleteError } = await supabaseClient
          .from('bulletins')
          .delete()
          .eq('id', bulletinId)
          .eq('church_id', churchId);

        if (deleteError) {
          console.error('주보 삭제 실패:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Bulletin deleted successfully' }),
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