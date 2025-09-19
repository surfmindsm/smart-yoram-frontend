import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SaveMessageRequest {
  chatHistoryId: string;
  content: string;
  role: 'user' | 'assistant';
  tokensUsed?: number;
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

    const { chatHistoryId, content, role, tokensUsed }: SaveMessageRequest = await req.json()
    
    console.log('💾 메시지 저장 요청:', { chatHistoryId, role, contentLength: content.length });
    
    // chat_messages 테이블에 메시지 저장
    const { data, error } = await supabaseClient
      .from('chat_messages')
      .insert({
        chat_history_id: chatHistoryId,
        content: content,
        role: role,
        tokens_used: tokensUsed || 0,
        created_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('❌ 메시지 저장 실패:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('✅ 메시지 저장 성공:', data?.[0]?.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: data?.[0],
        metadata: {
          chatHistoryId,
          role,
          timestamp: new Date().toISOString()
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
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
