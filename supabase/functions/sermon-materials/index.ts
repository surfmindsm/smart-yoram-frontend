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
    const searchParams = url.searchParams;

    // /sermon-materials/ 기본 엔드포인트
    if (req.method === 'GET' && !pathParts.includes('categories') && !pathParts.includes('authors')) {
      const q = searchParams.get('q');
      const category = searchParams.get('category');
      const author = searchParams.get('author');
      const skip = parseInt(searchParams.get('skip') || '0');
      const limit = parseInt(searchParams.get('limit') || '20');

      let query = supabaseClient
        .from('sermon_materials')
        .select(`
          *,
          author:users!author_id(name, email)
        `)
        .eq('church_id', churchId);

      if (q) {
        query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (author) {
        query = query.eq('author', author);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(skip, skip + limit - 1);

      const { data: materials, error } = await query;

      return new Response(JSON.stringify(materials || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // /sermon-materials/categories 엔드포인트
    if (pathParts.includes('categories')) {
      const categories = ['설교', '성경공부', '예배', '찬양', '기도', '간증'];
      return new Response(JSON.stringify(categories), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // /sermon-materials/authors 엔드포인트
    if (pathParts.includes('authors')) {
      const { data: authors, error } = await supabaseClient
        .from('sermon_materials')
        .select('author')
        .eq('church_id', churchId)
        .not('author', 'is', null);

      const uniqueAuthors = [...new Set((authors || []).map(item => item.author))];
      
      return new Response(JSON.stringify(uniqueAuthors), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // /sermon-materials/stats 엔드포인트
    if (pathParts.includes('stats')) {
      const { data: count, error } = await supabaseClient
        .from('sermon_materials')
        .select('*', { count: 'exact' })
        .eq('church_id', churchId);

      return new Response(JSON.stringify({
        total_materials: count?.length || 0,
        categories: 6,
        authors: 1
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST 요청 - 새 자료 생성
    if (req.method === 'POST') {
      const materialData = await req.json();
      materialData.church_id = churchId;
      materialData.author_id = payload.sub;
      materialData.created_at = new Date().toISOString();

      const { data: newMaterial, error: createError } = await supabaseClient
        .from('sermon_materials')
        .insert(materialData)
        .select()
        .single();

      return new Response(JSON.stringify(newMaterial), {
        status: 201,
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