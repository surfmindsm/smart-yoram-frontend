// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📖 Daily Verses Edge Function 시작')

    // Initialize Supabase client with service role key for database access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('✅ Supabase 클라이언트 초기화 완료')

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)
    console.log('🔍 URL 파싱:', { pathname: url.pathname, pathParts, method: req.method })

    // Custom authentication header approach
    const customToken = req.headers.get('X-Custom-Auth') || req.headers.get('Authorization')?.replace('Bearer ', '')
    console.log('🔍 인증 토큰 확인:', customToken ? customToken.substring(0, 20) + '...' : 'None')
    console.log('🔍 모든 헤더:', Object.fromEntries(req.headers.entries()))

    // /today endpoint doesn't require authentication (public access)
    const isPublicEndpoint = pathParts.includes('today')

    if (!customToken && !isPublicEndpoint) {
      console.log('❌ 인증 토큰이 없습니다 (관리자 엔드포인트)')
      return new Response(
        JSON.stringify({ error: 'Missing authentication' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle different daily verses endpoints
    if (req.method === 'GET') {
      console.log('📥 GET 요청 처리 중')

      // GET /daily-verses/today - Get today's active verse
      if (pathParts.includes('today')) {
        console.log('📖 오늘의 말씀 조회 요청')

        const { data, error } = await supabaseClient
          .from('daily_verses')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) {
          console.error('Today verse query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch today verse', details: error.message }),
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

      // GET /daily-verses/admin/verses - Get all verses with pagination
      if (pathParts.includes('admin') && pathParts.includes('verses')) {
        console.log('📋 말씀 목록 조회 요청')

        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const isActive = url.searchParams.get('is_active')

        const offset = (page - 1) * limit

        // Build query
        let query = supabaseClient
          .from('daily_verses')
          .select('*', { count: 'exact' })

        // Apply active filter if specified
        if (isActive !== null) {
          query = query.eq('is_active', isActive === 'true')
        }

        // Apply pagination and ordering
        query = query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
          console.error('Verses list query error:', error)
          return new Response(
            JSON.stringify({ error: 'Database query failed', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('Query successful, found verses:', count)

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

      // GET /daily-verses/admin/verses/{id} - Get specific verse
      if (pathParts.includes('admin') && pathParts.includes('verses') && pathParts[pathParts.length - 1]) {
        const verseId = pathParts[pathParts.length - 1]

        const { data, error } = await supabaseClient
          .from('daily_verses')
          .select('*')
          .eq('id', verseId)
          .single()

        if (error) {
          console.error('Single verse query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch verse', details: error.message }),
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

    if (req.method === 'POST') {
      const body = await req.json()

      // POST /daily-verses/admin/verses - Create new verse
      if (pathParts.includes('admin') && pathParts.includes('verses')) {
        const insertData = {
          verse: body.verse,
          reference: body.reference,
          is_active: body.is_active !== undefined ? body.is_active : true
        }

        const { data, error } = await supabaseClient
          .from('daily_verses')
          .insert([insertData])
          .select('*')
          .single()

        if (error) {
          console.error('Database insert error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to create verse', details: error.message }),
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

      // PUT /daily-verses/admin/verses/{id} - Update verse
      if (pathParts.includes('admin') && pathParts.includes('verses')) {
        const verseId = pathParts[pathParts.length - 1]

        const updateData = {
          verse: body.verse,
          reference: body.reference,
          is_active: body.is_active,
          updated_at: new Date().toISOString()
        }

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key]
          }
        })

        const { data, error } = await supabaseClient
          .from('daily_verses')
          .update(updateData)
          .eq('id', verseId)
          .select('*')
          .single()

        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to update verse', details: error.message }),
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
      // DELETE /daily-verses/admin/verses/{id} - Delete verse
      if (pathParts.includes('admin') && pathParts.includes('verses')) {
        const verseId = pathParts[pathParts.length - 1]

        const { error } = await supabaseClient
          .from('daily_verses')
          .delete()
          .eq('id', verseId)

        if (error) {
          console.error('Database delete error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to delete verse', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Verse deleted successfully' }),
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
