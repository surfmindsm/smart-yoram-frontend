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
    console.log('⛪ Worship Services Edge Function 시작')

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

    // Handle different worship services endpoints
    if (req.method === 'GET') {
      console.log('📥 GET 요청 처리 중')

      // GET /worship-services/admin/services - Get all services with pagination
      if (pathParts.includes('admin') && pathParts.includes('services')) {
        console.log('⛪ 예배 서비스 목록 조회 요청')

        const churchId = url.searchParams.get('church_id')
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const isActive = url.searchParams.get('is_active')

        const offset = (page - 1) * limit

        // Build query
        let query = supabaseClient
          .from('worship_services')
          .select('*', { count: 'exact' })

        // Apply church filter if specified
        if (churchId) {
          query = query.eq('church_id', parseInt(churchId))
        }

        // Apply active filter if specified
        if (isActive !== null) {
          query = query.eq('is_active', isActive === 'true')
        }

        // Apply pagination and ordering
        query = query
          .order('order_index', { ascending: true })
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true })
          .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
          console.error('Services list query error:', error)
          return new Response(
            JSON.stringify({ error: 'Database query failed', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('Query successful, found services:', count)

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

      // GET /worship-services/admin/services/{id} - Get specific service
      if (pathParts.includes('admin') && pathParts.includes('services') && pathParts[pathParts.length - 1]) {
        const serviceId = pathParts[pathParts.length - 1]

        const { data, error } = await supabaseClient
          .from('worship_services')
          .select('*')
          .eq('id', serviceId)
          .single()

        if (error) {
          console.error('Single service query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch service', details: error.message }),
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

      // GET /worship-services/church/{church_id} - Get public services for a church
      if (pathParts.includes('church')) {
        const churchId = pathParts[pathParts.indexOf('church') + 1]
        console.log('⛪ 교회 예배 서비스 공개 조회:', churchId)

        const { data, error } = await supabaseClient
          .from('worship_services')
          .select('*')
          .eq('church_id', parseInt(churchId))
          .eq('is_active', true)
          .order('order_index', { ascending: true })
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true })

        if (error) {
          console.error('Public services query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch services', details: error.message }),
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

      // POST /worship-services/admin/services - Create new service
      if (pathParts.includes('admin') && pathParts.includes('services')) {
        const insertData = {
          church_id: body.church_id,
          name: body.name,
          location: body.location,
          day_of_week: body.day_of_week,
          start_time: body.start_time,
          end_time: body.end_time,
          service_type: body.service_type,
          target_group: body.target_group,
          is_online: body.is_online !== undefined ? body.is_online : false,
          is_active: body.is_active !== undefined ? body.is_active : true,
          order_index: body.order_index
        }

        const { data, error } = await supabaseClient
          .from('worship_services')
          .insert([insertData])
          .select('*')
          .single()

        if (error) {
          console.error('Database insert error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to create service', details: error.message }),
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

      // PUT /worship-services/admin/services/{id} - Update service
      if (pathParts.includes('admin') && pathParts.includes('services')) {
        const serviceId = pathParts[pathParts.length - 1]

        const updateData = {
          name: body.name,
          location: body.location,
          day_of_week: body.day_of_week,
          start_time: body.start_time,
          end_time: body.end_time,
          service_type: body.service_type,
          target_group: body.target_group,
          is_online: body.is_online,
          is_active: body.is_active,
          order_index: body.order_index,
          updated_at: new Date().toISOString()
        }

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key]
          }
        })

        const { data, error } = await supabaseClient
          .from('worship_services')
          .update(updateData)
          .eq('id', serviceId)
          .select('*')
          .single()

        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to update service', details: error.message }),
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
      // DELETE /worship-services/admin/services/{id} - Delete service
      if (pathParts.includes('admin') && pathParts.includes('services')) {
        const serviceId = pathParts[pathParts.length - 1]

        const { error } = await supabaseClient
          .from('worship_services')
          .delete()
          .eq('id', serviceId)

        if (error) {
          console.error('Database delete error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to delete service', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Service deleted successfully' }),
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