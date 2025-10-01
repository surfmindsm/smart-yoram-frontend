import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// 임시 토큰 파싱 함수 (temp_token_{user_id}_{timestamp} 형식)
function parseTempToken(token: string) {
  try {
    if (token.startsWith('temp_token_')) {
      const parts = token.replace('temp_token_', '').split('_');
      if (parts.length >= 1) {
        const userId = parseInt(parts[0]);
        return { user_id: userId };
      }
    }
    return null;
  } catch (error) {
    console.error('임시 토큰 파싱 실패:', error);
    return null;
  }
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

    // JWT 토큰 검증 - X-Custom-Auth 헤더에서 토큰 가져오기
    const customAuthToken = req.headers.get('X-Custom-Auth');
    if (!customAuthToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No X-Custom-Auth token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 임시 토큰 파싱 시도
    let payload = parseTempToken(customAuthToken);

    // 임시 토큰이 아니면 JWT 검증 시도
    if (!payload) {
      payload = await verifyJWT(customAuthToken);
    }

    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // church_id 가져오기 (JWT에서 직접 or user_id로 조회)
    let churchId = payload.church_id;
    console.log('🔍 JWT payload:', JSON.stringify(payload));
    console.log('🔍 Initial churchId from payload:', churchId);

    if (!churchId && payload.user_id) {
      // church_id가 없으면 user_id로 조회
      console.log('🔍 Fetching church_id for user_id:', payload.user_id);
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('church_id')
        .eq('id', payload.user_id)
        .single();

      if (userError || !user) {
        console.error('❌ 사용자 조회 실패:', userError);
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      churchId = user.church_id;
      console.log('✅ Fetched church_id from users table:', churchId);
    }

    console.log('🎯 Final churchId:', churchId);
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const memberId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'GET':
        if (memberId && memberId !== 'members') {
          // 특정 멤버 조회
          const { data: member, error } = await supabaseClient
            .from('members')
            .select(`
              *,
              organization:church_organizations(name)
            `)
            .eq('id', memberId)
            .eq('church_id', churchId)
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

          // organization_name 필드 추가
          const memberWithOrgName = {
            ...member,
            organization_name: member?.organization?.name || null,
            organization: undefined
          };

          return new Response(JSON.stringify(memberWithOrgName), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // 전체 멤버 목록 조회 (organization_name 포함)
          console.log('📋 Querying members table with church_id:', churchId);
          const { data: members, error } = await supabaseClient
            .from('members')
            .select(`
              *,
              organization:church_organizations(name)
            `)
            .eq('church_id', churchId)
            .order('created_at', { ascending: false });

          console.log('📊 Query result - members count:', members?.length || 0);
          console.log('📊 Query error:', error);

          if (error) {
            console.error('❌ 멤버 목록 조회 실패:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          // organization_name 필드 추가
          const membersWithOrgName = members?.map(member => ({
            ...member,
            organization_name: member.organization?.name || null,
            organization: undefined  // 중첩 객체 제거
          })) || [];

          console.log('✅ Returning members with org names:', membersWithOrgName.length);

          return new Response(JSON.stringify(membersWithOrgName), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'POST':
        // 새 멤버 생성
        const memberData = await req.json();
        memberData.church_id = churchId;
        memberData.created_at = new Date().toISOString();

        const { data: newMember, error: createError } = await supabaseClient
          .from('members')
          .insert(memberData)
          .select(`
            *,
            organization:church_organizations(name)
          `)
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

        // organization_name 필드 추가
        const memberWithOrgName = {
          ...newMember,
          organization_name: newMember?.organization?.name || null,
          organization: undefined
        };

        return new Response(JSON.stringify(memberWithOrgName), {
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
          .from('members')
          .update(updateData)
          .eq('id', memberId)
          .eq('church_id', churchId)
          .select(`
            *,
            organization:church_organizations(name)
          `)
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

        // organization_name 필드 추가
        const updatedMemberWithOrgName = {
          ...updatedMember,
          organization_name: updatedMember?.organization?.name || null,
          organization: undefined
        };

        return new Response(JSON.stringify(updatedMemberWithOrgName), {
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
          .from('members')
          .delete()
          .eq('id', memberId)
          .eq('church_id', churchId);

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