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
    const announcementId = pathParts[pathParts.length - 1];

    // URL 파라미터 처리
    const searchParams = url.searchParams;
    const isActive = searchParams.get('is_active');
    const isPinned = searchParams.get('is_pinned');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    switch (req.method) {
      case 'GET':
        if (pathParts.includes('categories')) {
          // 카테고리 목록 조회
          const { data: categories, error } = await supabaseClient
            .from('announcement_categories')
            .select('*')
            .eq('church_id', churchId)
            .order('name');

          if (error) {
            console.error('카테고리 조회 실패:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(JSON.stringify(categories), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else if (announcementId && announcementId !== 'announcements') {
          // 특정 공지사항 조회
          const { data: announcement, error } = await supabaseClient
            .from('announcements')
            .select(`
              *,
              author:users(name, email),
              category:announcement_categories(name)
            `)
            .eq('id', announcementId)
            .eq('church_id', churchId)
            .single();

          if (error) {
            console.error('공지사항 조회 실패:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(JSON.stringify(announcement), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // 공지사항 목록 조회
          let query = supabaseClient
            .from('announcements')
            .select(`
              *,
              author:users(name, email),
              category:announcement_categories(name)
            `)
            .eq('church_id', churchId);

          // 필터 적용
          if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
          }
          if (isPinned !== null) {
            query = query.eq('is_pinned', isPinned === 'true');
          }
          if (category) {
            query = query.eq('category', category);
          }
          if (subcategory) {
            query = query.eq('subcategory', subcategory);
          }

          query = query
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .range(skip, skip + limit - 1);

          const { data: announcements, error } = await query;

          if (error) {
            console.error('공지사항 목록 조회 실패:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(JSON.stringify(announcements), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'POST':
        // 새 공지사항 생성
        const announcementData = await req.json();
        announcementData.church_id = churchId;
        announcementData.author_id = payload.sub;
        announcementData.created_at = new Date().toISOString();

        const { data: newAnnouncement, error: createError } = await supabaseClient
          .from('announcements')
          .insert(announcementData)
          .select(`
            *,
            author:users(name, email),
            category:announcement_categories(name)
          `)
          .single();

        if (createError) {
          console.error('공지사항 생성 실패:', createError);
          return new Response(
            JSON.stringify({ error: createError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(newAnnouncement), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'PUT':
        if (!announcementId || announcementId === 'announcements') {
          return new Response(
            JSON.stringify({ error: 'Announcement ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // 핀 토글 처리
        if (pathParts.includes('toggle-pin')) {
          const { data: current, error: fetchError } = await supabaseClient
            .from('announcements')
            .select('is_pinned')
            .eq('id', announcementId)
            .eq('church_id', churchId)
            .single();

          if (fetchError) {
            return new Response(
              JSON.stringify({ error: fetchError.message }),
              {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          const { data: updated, error: updateError } = await supabaseClient
            .from('announcements')
            .update({ 
              is_pinned: !current.is_pinned,
              updated_at: new Date().toISOString()
            })
            .eq('id', announcementId)
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

          return new Response(JSON.stringify(updated), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 일반 수정
        const updateData = await req.json();
        delete updateData.id;
        delete updateData.church_id;
        delete updateData.author_id;
        updateData.updated_at = new Date().toISOString();

        const { data: updatedAnnouncement, error: updateError } = await supabaseClient
          .from('announcements')
          .update(updateData)
          .eq('id', announcementId)
          .eq('church_id', churchId)
          .select(`
            *,
            author:users(name, email),
            category:announcement_categories(name)
          `)
          .single();

        if (updateError) {
          console.error('공지사항 수정 실패:', updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(JSON.stringify(updatedAnnouncement), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'DELETE':
        if (!announcementId || announcementId === 'announcements') {
          return new Response(
            JSON.stringify({ error: 'Announcement ID required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { error: deleteError } = await supabaseClient
          .from('announcements')
          .delete()
          .eq('id', announcementId)
          .eq('church_id', churchId);

        if (deleteError) {
          console.error('공지사항 삭제 실패:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Announcement deleted successfully' }),
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