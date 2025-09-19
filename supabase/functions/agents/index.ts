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
    const agentId = pathParts[pathParts.length - 1];

    // /agents/templates 엔드포인트 처리
    if (pathParts.includes('templates')) {
      if (req.method === 'GET') {
        // 기본 에이전트 템플릿 반환
        const templates = [
          {
            id: 1,
            name: "일반 비서",
            category: "assistant",
            description: "교회 업무 전반을 도와주는 범용 비서",
            system_prompt: "당신은 교회 관리를 도와주는 친절한 AI 비서입니다.",
            is_template: true
          },
          {
            id: 2,
            name: "설교 도우미",
            category: "sermon",
            description: "설교 준비와 성경 연구를 도와주는 전문 비서",
            system_prompt: "당신은 설교 준비와 성경 연구를 전문으로 하는 AI 도우미입니다.",
            is_template: true
          },
          {
            id: 3,
            name: "교육 담당",
            category: "education",
            description: "교회 교육 프로그램과 성경 공부를 지원하는 비서",
            system_prompt: "당신은 교회 교육과 성경 공부를 전문으로 하는 AI 교사입니다.",
            is_template: true
          }
        ];

        return new Response(JSON.stringify({
          success: true,
          templates: templates
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    switch (req.method) {
      case 'GET':
        if (agentId && agentId !== 'agents') {
          // 특정 에이전트 조회
          const { data: agent, error } = await supabaseClient
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .eq('church_id', churchId)
            .single();

          if (error) {
            console.error('에이전트 조회 실패:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(JSON.stringify(agent), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // 에이전트 목록 조회
          const { data: agents, error } = await supabaseClient
            .from('agents')
            .select('*')
            .eq('church_id', churchId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('에이전트 목록 조회 실패:', error);
            return new Response(JSON.stringify([]), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify(agents || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'POST':
        // 새 에이전트 생성
        const agentData = await req.json();
        agentData.church_id = churchId;
        agentData.created_by = payload.sub;
        agentData.created_at = new Date().toISOString();
        agentData.is_active = agentData.is_active ?? true;

        const { data: newAgent, error: createError } = await supabaseClient
          .from('agents')
          .insert(agentData)
          .select()
          .single();

        if (createError) {
          console.error('에이전트 생성 실패:', createError);
          return new Response(
            JSON.stringify({ error: createError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(newAgent), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'PUT':
        if (!agentId || agentId === 'agents') {
          return new Response(
            JSON.stringify({ error: 'Agent ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const updateData = await req.json();
        delete updateData.id;
        delete updateData.church_id;
        delete updateData.created_by;
        updateData.updated_at = new Date().toISOString();

        const { data: updatedAgent, error: updateError } = await supabaseClient
          .from('agents')
          .update(updateData)
          .eq('id', agentId)
          .eq('church_id', churchId)
          .select()
          .single();

        if (updateError) {
          console.error('에이전트 수정 실패:', updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(updatedAgent), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'DELETE':
        if (!agentId || agentId === 'agents') {
          return new Response(
            JSON.stringify({ error: 'Agent ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { error: deleteError } = await supabaseClient
          .from('agents')
          .delete()
          .eq('id', agentId)
          .eq('church_id', churchId);

        if (deleteError) {
          console.error('에이전트 삭제 실패:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Agent deleted successfully' }),
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