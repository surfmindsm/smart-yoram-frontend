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
    const memberId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'GET':
        if (memberId && memberId !== 'members') {
          // 특정 멤버 조회
          const { data: member, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', memberId)
            .eq('church_id', churchId)
            .eq('role', 'member')
            .single();

          if (error) {
            console.error('멤버 조회 실패:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(JSON.stringify(member), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // 전체 멤버 목록 조회
          const { data: members, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('church_id', churchId)
            .eq('role', 'member')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('멤버 목록 조회 실패:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(JSON.stringify(members), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'POST':
        // 새 멤버 생성
        const memberData = await req.json();
        memberData.church_id = churchId;
        memberData.role = 'member';
        memberData.created_at = new Date().toISOString();

        const { data: newMember, error: createError } = await supabaseClient
          .from('users')
          .insert(memberData)
          .select()
          .single();

        if (createError) {
          console.error('멤버 생성 실패:', createError);
          return new Response(
            JSON.stringify({ error: createError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(newMember), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'PUT':
        // 멤버 정보 수정
        if (!memberId || memberId === 'members') {
          return new Response(
            JSON.stringify({ error: 'Member ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const updateData = await req.json();
        delete updateData.id; // ID 수정 방지
        delete updateData.church_id; // 교회 ID 수정 방지
        updateData.updated_at = new Date().toISOString();

        const { data: updatedMember, error: updateError } = await supabaseClient
          .from('users')
          .update(updateData)
          .eq('id', memberId)
          .eq('church_id', churchId)
          .eq('role', 'member')
          .select()
          .single();

        if (updateError) {
          console.error('멤버 수정 실패:', updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(updatedMember), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'DELETE':
        // 멤버 삭제
        if (!memberId || memberId === 'members') {
          return new Response(
            JSON.stringify({ error: 'Member ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { error: deleteError } = await supabaseClient
          .from('users')
          .delete()
          .eq('id', memberId)
          .eq('church_id', churchId)
          .eq('role', 'member');

        if (deleteError) {
          console.error('멤버 삭제 실패:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Member deleted successfully' }),
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