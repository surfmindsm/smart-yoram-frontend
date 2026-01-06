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
    console.log('📰 Bulletins Edge Function 시작')

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

    // Handle different bulletins endpoints
    if (req.method === 'GET') {
      console.log('📥 GET 요청 처리 중')

      // GET /bulletins/admin/bulletins - Get all bulletins with pagination
      if (pathParts.includes('admin') && pathParts.includes('bulletins')) {
        console.log('📰 주보 목록 조회 요청')

        const churchId = url.searchParams.get('church_id')
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const startDate = url.searchParams.get('start_date')
        const endDate = url.searchParams.get('end_date')

        const offset = (page - 1) * limit

        // Build query
        let query = supabaseClient
          .from('bulletins')
          .select('*', { count: 'exact' })

        // Apply church filter if specified
        if (churchId) {
          query = query.eq('church_id', parseInt(churchId))
        }

        // Apply date range filter if specified
        if (startDate) {
          query = query.gte('date', startDate)
        }
        if (endDate) {
          query = query.lte('date', endDate)
        }

        // Apply pagination and ordering
        query = query
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
          console.error('Bulletins list query error:', error)
          return new Response(
            JSON.stringify({ error: 'Database query failed', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('Query successful, found bulletins:', count)

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

      // GET /bulletins/admin/bulletins/{id} - Get specific bulletin
      if (pathParts.includes('admin') && pathParts.includes('bulletins') && pathParts[pathParts.length - 1]) {
        const bulletinId = pathParts[pathParts.length - 1]

        // Validate bulletin ID is not 'bulletins' itself and is a number
        if (bulletinId === 'bulletins' || isNaN(parseInt(bulletinId))) {
          console.log('⚠️ Invalid bulletin ID, treating as list request')
          // This is actually a list request without ID, let it fall through to list handler above
          return new Response(
            JSON.stringify({ error: 'Invalid bulletin ID' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('📰 주보 단일 조회:', bulletinId)

        const { data, error } = await supabaseClient
          .from('bulletins')
          .select('*')
          .eq('id', parseInt(bulletinId))
          .single()

        if (error) {
          console.error('Single bulletin query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch bulletin', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('✅ 주보 단일 조회 성공')
        return new Response(
          JSON.stringify(data),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // GET /bulletins/church/{church_id} - Get public bulletins for a church
      if (pathParts.includes('church')) {
        const churchId = pathParts[pathParts.indexOf('church') + 1]
        console.log('📰 교회 주보 공개 조회:', churchId)

        const { data, error } = await supabaseClient
          .from('bulletins')
          .select('*')
          .eq('church_id', parseInt(churchId))
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Public bulletins query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch bulletins', details: error.message }),
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

      // POST /bulletins/admin/bulletins - Create new bulletin
      if (pathParts.includes('admin') && pathParts.includes('bulletins')) {
        const insertData = {
          church_id: body.church_id,
          title: body.title,
          date: body.date,
          content: body.content || null,
          file_url: body.file_url || null,
          created_by: body.created_by || null
        }

        const { data, error } = await supabaseClient
          .from('bulletins')
          .insert([insertData])
          .select('*')
          .single()

        if (error) {
          console.error('Database insert error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to create bulletin', details: error.message }),
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

      // PUT /bulletins/admin/bulletins/{id} - Update bulletin
      if (pathParts.includes('admin') && pathParts.includes('bulletins')) {
        const bulletinId = pathParts[pathParts.length - 1]

        // Validate bulletin ID exists and is not 'bulletins' itself
        if (!bulletinId || bulletinId === 'bulletins' || isNaN(parseInt(bulletinId))) {
          console.error('Invalid or missing bulletin ID:', bulletinId)
          return new Response(
            JSON.stringify({ error: 'Invalid or missing bulletin ID' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('📝 주보 수정 요청:', bulletinId)

        const updateData = {
          title: body.title,
          date: body.date,
          content: body.content,
          file_url: body.file_url,
          updated_at: new Date().toISOString()
        }

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key]
          }
        })

        const { data, error } = await supabaseClient
          .from('bulletins')
          .update(updateData)
          .eq('id', parseInt(bulletinId))
          .select('*')
          .single()

        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to update bulletin', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('✅ 주보 수정 성공:', bulletinId)
        return new Response(
          JSON.stringify(data),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    if (req.method === 'DELETE') {
      // DELETE /bulletins/admin/bulletins/{id} - Delete bulletin
      if (pathParts.includes('admin') && pathParts.includes('bulletins')) {
        const bulletinId = pathParts[pathParts.length - 1]

        // Validate bulletin ID exists and is not 'bulletins' itself
        if (!bulletinId || bulletinId === 'bulletins' || isNaN(parseInt(bulletinId))) {
          console.error('Invalid or missing bulletin ID:', bulletinId)
          return new Response(
            JSON.stringify({ error: 'Invalid or missing bulletin ID' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('🗑️ 주보 삭제 요청:', bulletinId)

        const { error } = await supabaseClient
          .from('bulletins')
          .delete()
          .eq('id', parseInt(bulletinId))

        if (error) {
          console.error('Database delete error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to delete bulletin', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('✅ 주보 삭제 성공:', bulletinId)
        return new Response(
          JSON.stringify({ message: 'Bulletin deleted successfully' }),
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