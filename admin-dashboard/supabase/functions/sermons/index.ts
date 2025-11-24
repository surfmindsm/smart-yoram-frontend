// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// 유튜브 비디오 ID 추출 함수
function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

// 유튜브 썸네일 URL 생성
function getYoutubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify authentication
    const authHeader = req.headers.get('X-Custom-Auth') || req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)

    // GET /sermons - 모든 설교 조회
    if (req.method === 'GET' && pathParts.length === 1) {
      const isActive = url.searchParams.get('is_active')
      const category = url.searchParams.get('category')
      const isFeatured = url.searchParams.get('is_featured')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')

      let query = supabaseClient
        .from('sermons')
        .select(`
          *,
          category:sermon_categories(id, name, description)
        `)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // 필터 적용
      if (isActive !== null) {
        query = query.eq('is_active', isActive === 'true')
      }
      if (category) {
        query = query.eq('category', category)
      }
      if (isFeatured !== null) {
        query = query.eq('is_featured', isFeatured === 'true')
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching sermons:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ data, count }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // GET /sermons/:id - 특정 설교 조회
    if (req.method === 'GET' && pathParts.length === 2) {
      const sermonId = pathParts[1]

      const { data, error } = await supabaseClient
        .from('sermons')
        .select(`
          *,
          category:sermon_categories(id, name, description)
        `)
        .eq('id', sermonId)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // POST /sermons - 설교 생성
    if (req.method === 'POST') {
      const body = await req.json()
      const {
        title,
        youtube_url,
        preacher_name,
        description,
        scripture_reference,
        category_id,
        sermon_date,
        tags,
        language,
        is_featured,
        display_order,
        published_at,
        created_by
      } = body

      // 유튜브 비디오 ID 추출
      const videoId = extractYoutubeVideoId(youtube_url)
      if (!videoId) {
        return new Response(
          JSON.stringify({ error: '유효하지 않은 유튜브 URL입니다.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const thumbnailUrl = getYoutubeThumbnailUrl(videoId)

      const { data, error } = await supabaseClient
        .from('sermons')
        .insert({
          title,
          youtube_url,
          youtube_video_id: videoId,
          thumbnail_url: thumbnailUrl,
          preacher_name,
          description,
          scripture_reference,
          category_id,
          sermon_date,
          tags,
          language: language || 'ko',
          is_featured: is_featured || false,
          display_order: display_order || 0,
          is_active: true,
          published_at: published_at || new Date().toISOString(),
          created_by,
          updated_by: created_by
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating sermon:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // 관리자 작업 로그 기록
      await supabaseClient
        .from('sermon_audit_logs')
        .insert({
          sermon_id: data.id,
          action: 'create',
          user_id: created_by,
          changed_data: { new: data }
        })

      return new Response(
        JSON.stringify(data),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // PUT /sermons/:id - 설교 수정
    if (req.method === 'PUT' && pathParts.length === 2) {
      const sermonId = pathParts[1]
      const body = await req.json()
      const { updated_by, ...updateData } = body

      // 유튜브 URL이 변경된 경우 비디오 ID 재추출
      if (updateData.youtube_url) {
        const videoId = extractYoutubeVideoId(updateData.youtube_url)
        if (!videoId) {
          return new Response(
            JSON.stringify({ error: '유효하지 않은 유튜브 URL입니다.' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        updateData.youtube_video_id = videoId
        updateData.thumbnail_url = getYoutubeThumbnailUrl(videoId)
      }

      // 기존 데이터 조회 (로그용)
      const { data: oldData } = await supabaseClient
        .from('sermons')
        .select('*')
        .eq('id', sermonId)
        .single()

      const { data, error } = await supabaseClient
        .from('sermons')
        .update({
          ...updateData,
          updated_by
        })
        .eq('id', sermonId)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // 관리자 작업 로그 기록
      await supabaseClient
        .from('sermon_audit_logs')
        .insert({
          sermon_id: sermonId,
          action: 'update',
          user_id: updated_by,
          changed_data: { old: oldData, new: data }
        })

      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // DELETE /sermons/:id - 설교 삭제 (소프트 삭제)
    if (req.method === 'DELETE' && pathParts.length === 2) {
      const sermonId = pathParts[1]
      const body = await req.json()
      const { deleted_by } = body

      // 기존 데이터 조회 (로그용)
      const { data: oldData } = await supabaseClient
        .from('sermons')
        .select('*')
        .eq('id', sermonId)
        .single()

      const { data, error } = await supabaseClient
        .from('sermons')
        .update({ is_active: false, updated_by: deleted_by })
        .eq('id', sermonId)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // 관리자 작업 로그 기록
      await supabaseClient
        .from('sermon_audit_logs')
        .insert({
          sermon_id: sermonId,
          action: 'delete',
          user_id: deleted_by,
          changed_data: { old: oldData }
        })

      return new Response(
        JSON.stringify({ message: '설교가 삭제되었습니다.', data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // POST /sermons/:id/view - 조회수 기록
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'view') {
      const sermonId = pathParts[1]
      const body = await req.json()
      const { user_id, church_id, ip_address, user_agent } = body

      const { error } = await supabaseClient
        .from('sermon_views')
        .insert({
          sermon_id: sermonId,
          user_id,
          church_id,
          ip_address,
          user_agent
        })

      if (error) {
        console.error('Error recording view:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ message: '조회수가 기록되었습니다.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // GET /sermons/categories - 카테고리 목록 조회
    if (req.method === 'GET' && pathParts[1] === 'categories') {
      const { data, error } = await supabaseClient
        .from('sermon_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
