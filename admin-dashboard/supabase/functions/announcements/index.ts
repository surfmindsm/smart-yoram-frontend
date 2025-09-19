// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📢 Announcements Edge Function 시작')

    // Initialize Supabase client with service role key for database access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('✅ Supabase 클라이언트 초기화 완료')

    // Custom authentication header approach
    const customToken = req.headers.get('X-Custom-Auth') || req.headers.get('Authorization')?.replace('Bearer ', '')
    console.log('🔍 인증 토큰 확인:', customToken ? customToken.substring(0, 20) + '...' : 'None')

    if (!customToken) {
      console.log('❌ 인증 토큰이 없습니다')
      return new Response(
        JSON.stringify({ error: 'Missing authentication' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate custom token format (temp_token_${user_id}_${timestamp} or temp_system_token)
    if (!customToken.startsWith('temp_token_') && customToken !== 'temp_system_token') {
      console.log('❌ 잘못된 토큰 형식')
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ 인증 토큰 유효함')

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)
    console.log('🔍 URL 파싱:', { pathname: url.pathname, pathParts, method: req.method })

    // Handle different announcements endpoints
    if (req.method === 'GET') {
      console.log('📥 GET 요청 처리 중')

      // GET /announcements/admin/announcements - Get all announcements with pagination
      if (pathParts.includes('admin') && pathParts.includes('announcements')) {
        console.log('📢 공지사항 목록 조회 요청')

        const churchId = url.searchParams.get('church_id')
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const isActive = url.searchParams.get('is_active')
        const isPinned = url.searchParams.get('is_pinned')
        const category = url.searchParams.get('category')

        const offset = (page - 1) * limit

        // Build query
        let query = supabaseClient
          .from('announcements')
          .select('*', { count: 'exact' })

        // Apply church filter if specified
        if (churchId) {
          query = query.eq('church_id', parseInt(churchId))
        }

        // Apply active filter if specified
        if (isActive !== null) {
          query = query.eq('is_active', isActive === 'true')
        }

        // Apply pinned filter if specified
        if (isPinned !== null) {
          query = query.eq('is_pinned', isPinned === 'true')
        }

        // Apply category filter if specified
        if (category) {
          query = query.eq('category', category)
        }

        // Apply pagination and ordering
        query = query
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
          console.error('Announcements list query error:', error)
          return new Response(
            JSON.stringify({ error: 'Database query failed', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('Query successful, found announcements:', count)

        return new Response(
          JSON.stringify({
            data: data || [],
            count: count || 0,
            page,
            limit,
            total_pages: Math.ceil((count || 0) / limit)
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // GET /announcements/admin/announcements/{id} - Get specific announcement
      if (pathParts.includes('admin') && pathParts.includes('announcements') && pathParts[pathParts.length - 1]) {
        const announcementId = pathParts[pathParts.length - 1]

        const { data, error } = await supabaseClient
          .from('announcements')
          .select('*')
          .eq('id', announcementId)
          .single()

        if (error) {
          console.error('Single announcement query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch announcement', details: error.message }),
            {
              status: 500,
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

      // GET /announcements/church/{church_id} - Get public announcements for a church
      if (pathParts.includes('church')) {
        const churchId = pathParts[pathParts.indexOf('church') + 1]
        console.log('📢 교회 공지사항 공개 조회:', churchId)

        const { data, error } = await supabaseClient
          .from('announcements')
          .select('*')
          .eq('church_id', parseInt(churchId))
          .eq('is_active', true)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Public announcements query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch announcements', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ data: data || [] }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    if (req.method === 'POST') {
      const body = await req.json()

      // POST /announcements/admin/announcements - Create new announcement
      if (pathParts.includes('admin') && pathParts.includes('announcements')) {
        const insertData = {
          church_id: body.church_id,
          title: body.title,
          content: body.content,
          author_id: body.author_id,
          author_name: body.author_name || null,
          is_active: body.is_active !== undefined ? body.is_active : true,
          is_pinned: body.is_pinned !== undefined ? body.is_pinned : false,
          target_audience: body.target_audience || null,
          category: body.category,
          subcategory: body.subcategory || null
        }

        const { data, error } = await supabaseClient
          .from('announcements')
          .insert([insertData])
          .select('*')
          .single()

        if (error) {
          console.error('Database insert error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to create announcement', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify(data),
          {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    if (req.method === 'PUT') {
      const body = await req.json()

      // PUT /announcements/admin/announcements/{id} - Update announcement
      if (pathParts.includes('admin') && pathParts.includes('announcements')) {
        const announcementId = pathParts[pathParts.length - 1]

        const updateData = {
          title: body.title,
          content: body.content,
          author_name: body.author_name,
          is_active: body.is_active,
          is_pinned: body.is_pinned,
          target_audience: body.target_audience,
          category: body.category,
          subcategory: body.subcategory,
          updated_at: new Date().toISOString()
        }

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key]
          }
        })

        const { data, error } = await supabaseClient
          .from('announcements')
          .update(updateData)
          .eq('id', announcementId)
          .select('*')
          .single()

        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to update announcement', details: error.message }),
            {
              status: 500,
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
    }

    if (req.method === 'DELETE') {
      // DELETE /announcements/admin/announcements/{id} - Delete announcement
      if (pathParts.includes('admin') && pathParts.includes('announcements')) {
        const announcementId = pathParts[pathParts.length - 1]

        const { error } = await supabaseClient
          .from('announcements')
          .delete()
          .eq('id', announcementId)

        if (error) {
          console.error('Database delete error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to delete announcement', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Announcement deleted successfully' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed or endpoint not found' }),
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