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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyJWT(token);

    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const churchId = payload.church_id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');

    // /financial/offerings 엔드포인트
    if (pathParts.includes('offerings')) {
      switch (req.method) {
        case 'GET':
          const { data: offerings, error } = await supabaseClient
            .from('offerings')
            .select('*')
            .eq('church_id', churchId)
            .order('offering_date', { ascending: false });

          return new Response(JSON.stringify(offerings || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case 'POST':
          const offeringData = await req.json();
          offeringData.church_id = churchId;
          offeringData.created_at = new Date().toISOString();

          const { data: newOffering, error: createError } = await supabaseClient
            .from('offerings')
            .insert(offeringData)
            .select()
            .single();

          return new Response(JSON.stringify(newOffering), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
    }

    // /financial/statistics 엔드포인트
    if (pathParts.includes('statistics')) {
      // 기본 통계 반환
      return new Response(JSON.stringify({
        total_offerings: 0,
        monthly_average: 0,
        fund_breakdown: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('❌ Edge Function 오류:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    })
  }
})