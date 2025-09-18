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
    const userId = payload.sub;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');

    // /chat/histories 엔드포인트 처리
    if (pathParts.includes('histories')) {
      const historyId = pathParts[pathParts.length - 1];

      // /chat/histories/{id}/messages 엔드포인트
      if (pathParts.includes('messages')) {
        if (req.method === 'GET') {
          const cleanId = historyId.toString().replace('chat_', '');
          
          const { data: messages, error } = await supabaseClient
            .from('chat_messages')
            .select('*')
            .eq('chat_history_id', cleanId)
            .order('created_at', { ascending: true });

          if (error) {
            console.error('채팅 메시지 조회 실패:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(JSON.stringify(messages || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      if (req.method === 'GET') {
        if (historyId && historyId !== 'histories') {
          // 특정 채팅 히스토리 조회
          const { data: history, error } = await supabaseClient
            .from('chat_histories')
            .select(`
              *,
              agent:agents(id, name, category)
            `)
            .eq('id', historyId)
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

          return new Response(JSON.stringify(history), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // 채팅 히스토리 목록 조회
          const searchParams = url.searchParams;
          const includeMessages = searchParams.get('include_messages') === 'true';
          const limit = parseInt(searchParams.get('limit') || '50');
          const skip = parseInt(searchParams.get('skip') || '0');

          let query = supabaseClient
            .from('chat_histories')
            .select(`
              *,
              agent:agents(id, name, category)
              ${includeMessages ? ', messages:chat_messages(*)' : ''}
            `)
            .eq('church_id', churchId)
            .order('updated_at', { ascending: false })
            .range(skip, skip + limit - 1);

          const { data: histories, error } = await query;

          if (error) {
            console.error('채팅 히스토리 조회 실패:', error);
            return new Response(JSON.stringify([]), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify(histories || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else if (req.method === 'POST') {
        // 새 채팅 히스토리 생성
        const historyData = await req.json();
        historyData.church_id = churchId;
        historyData.user_id = historyData.user_id || userId;
        historyData.created_at = new Date().toISOString();
        historyData.updated_at = new Date().toISOString();

        const { data: newHistory, error: createError } = await supabaseClient
          .from('chat_histories')
          .insert(historyData)
          .select(`
            *,
            agent:agents(id, name, category)
          `)
          .single();

        if (createError) {
          console.error('채팅 히스토리 생성 실패:', createError);
          return new Response(
            JSON.stringify({ error: createError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(newHistory), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (req.method === 'PUT') {
        if (!historyId || historyId === 'histories') {
          return new Response(
            JSON.stringify({ error: 'History ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const updateData = await req.json();
        delete updateData.id;
        delete updateData.church_id;
        delete updateData.user_id;
        updateData.updated_at = new Date().toISOString();

        const { data: updatedHistory, error: updateError } = await supabaseClient
          .from('chat_histories')
          .update(updateData)
          .eq('id', historyId)
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

        return new Response(JSON.stringify(updatedHistory), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (req.method === 'DELETE') {
        if (!historyId || historyId === 'histories') {
          return new Response(
            JSON.stringify({ error: 'History ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const cleanId = historyId.replace('chat_', '');

        // 관련 메시지들도 함께 삭제
        await supabaseClient
          .from('chat_messages')
          .delete()
          .eq('chat_history_id', cleanId);

        const { error: deleteError } = await supabaseClient
          .from('chat_histories')
          .delete()
          .eq('id', cleanId)
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

        return new Response(
          JSON.stringify({ message: 'Chat history deleted successfully' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // /chat/messages 엔드포인트 처리
    if (pathParts.includes('messages')) {
      if (req.method === 'POST') {
        const messageData = await req.json();
        
        // 먼저 사용자 메시지 저장
        const userMessage = {
          chat_history_id: messageData.chat_history_id,
          content: messageData.content,
          role: 'user',
          created_at: new Date().toISOString()
        };

        const { data: savedUserMessage, error: userError } = await supabaseClient
          .from('chat_messages')
          .insert(userMessage)
          .select()
          .single();

        if (userError) {
          console.error('사용자 메시지 저장 실패:', userError);
          return new Response(
            JSON.stringify({ error: userError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // AI 응답 생성 (여기서는 간단한 응답만 생성)
        const aiResponse = `안녕하세요! "${messageData.content}"에 대해 도움을 드리겠습니다. 더 구체적인 질문이 있으시면 언제든 말씀해 주세요.`;

        // AI 응답 메시지 저장
        const assistantMessage = {
          chat_history_id: messageData.chat_history_id,
          content: aiResponse,
          role: 'assistant',
          tokens_used: aiResponse.length, // 간단한 토큰 계산
          created_at: new Date().toISOString()
        };

        const { data: savedAssistantMessage, error: assistantError } = await supabaseClient
          .from('chat_messages')
          .insert(assistantMessage)
          .select()
          .single();

        if (assistantError) {
          console.error('AI 메시지 저장 실패:', assistantError);
          return new Response(
            JSON.stringify({ error: assistantError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // 채팅 히스토리 업데이트 시간 갱신
        await supabaseClient
          .from('chat_histories')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', messageData.chat_history_id);

        return new Response(JSON.stringify({
          user_message: savedUserMessage,
          assistant_message: savedAssistantMessage,
          response: aiResponse
        }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });

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