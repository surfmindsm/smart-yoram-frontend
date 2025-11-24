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
    console.log('⛪ 요청 메서드:', req.method)
    console.log('⛪ 요청 URL:', req.url)

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
      console.log('❌ 잘못된 토큰 형식:', customToken)
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
    console.log('🔍 URL 파싱:', {
      pathname: url.pathname,
      pathParts,
      pathPartsLength: pathParts.length,
      method: req.method,
      includesAdmin: pathParts.includes('admin'),
      includesServices: pathParts.includes('services')
    })

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

    // ===== Category Endpoints (check before general POST to avoid body consumption) =====

    if (req.method === 'POST' && pathParts.includes('categories')) {
      console.log('📂 카테고리 생성 요청')

      let body
      try {
        const rawBody = await req.text()
        body = JSON.parse(rawBody)
      } catch (parseError: any) {
        console.error('❌ JSON 파싱 오류:', parseError.message)
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const insertData = {
        church_id: body.church_id,
        name: body.name,
        description: body.description || null,
        order_index: body.order_index !== undefined ? body.order_index : 0
      }

      const { data, error } = await supabaseClient
        .from('worship_service_categories')
        .insert([insertData])
        .select('*')
        .single()

      if (error) {
        console.error('❌ 카테고리 생성 오류:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create category', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ 카테고리 생성 성공:', data)
      return new Response(
        JSON.stringify(data),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'GET' && pathParts.includes('categories')) {
      console.log('📂 카테고리 목록 조회 요청')

      const churchId = url.searchParams.get('church_id')

      let query = supabaseClient
        .from('worship_service_categories')
        .select('*')
        .order('order_index', { ascending: true })

      if (churchId) {
        query = query.eq('church_id', parseInt(churchId))
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ 카테고리 조회 오류:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch categories', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ 카테고리 조회 성공:', data?.length || 0, '개')
      return new Response(
        JSON.stringify({ data: data || [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'PUT' && pathParts.includes('categories')) {
      console.log('📂 카테고리 수정 요청')

      const categoryId = pathParts[pathParts.length - 1]

      let body
      try {
        const rawBody = await req.text()
        body = JSON.parse(rawBody)
      } catch (parseError: any) {
        console.error('❌ JSON 파싱 오류:', parseError.message)
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const updateData = {
        name: body.name,
        description: body.description,
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
        .from('worship_service_categories')
        .update(updateData)
        .eq('id', categoryId)
        .select('*')
        .single()

      if (error) {
        console.error('❌ 카테고리 수정 오류:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update category', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ 카테고리 수정 성공:', data)
      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'DELETE' && pathParts.includes('categories')) {
      console.log('📂 카테고리 삭제 요청')

      const categoryId = pathParts[pathParts.length - 1]

      const { error } = await supabaseClient
        .from('worship_service_categories')
        .delete()
        .eq('id', categoryId)

      if (error) {
        console.error('❌ 카테고리 삭제 오류:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to delete category', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ 카테고리 삭제 성공')
      return new Response(
        JSON.stringify({ message: 'Category deleted successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      console.log('📥 POST 요청 처리 시작')
      console.log('📥 Content-Type:', req.headers.get('Content-Type'))

      let body
      try {
        const rawBody = await req.text()
        console.log('📥 Raw body:', rawBody)
        console.log('📥 Raw body type:', typeof rawBody)
        body = JSON.parse(rawBody)
        console.log('📥 Parsed body:', JSON.stringify(body, null, 2))
      } catch (parseError: any) {
        console.error('❌ JSON 파싱 오류:', parseError.message)
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // POST /worship-services/admin/services - Create new service
      if (pathParts.includes('admin') && pathParts.includes('services')) {
        // Convert HH:MM to HH:MM:SS for PostgreSQL TIME type
        const formatTime = (time: string) => {
          if (!time) return time
          const parts = time.split(':')
          if (parts.length === 2) {
            return `${time}:00`
          }
          return time
        }

        const insertData = {
          church_id: body.church_id,
          name: body.name,
          location: body.location,
          day_of_week: body.day_of_week,
          start_time: formatTime(body.start_time),
          end_time: body.end_time ? formatTime(body.end_time) : null,
          service_type: body.service_type,
          target_group: body.target_group,
          is_online: body.is_online !== undefined ? body.is_online : false,
          is_active: body.is_active !== undefined ? body.is_active : true,
          order_index: body.order_index !== undefined ? body.order_index : 0
        }

        console.log('💾 데이터베이스 삽입 데이터:', JSON.stringify(insertData, null, 2))

        const { data, error } = await supabaseClient
          .from('worship_services')
          .insert([insertData])
          .select('*')
          .single()

        if (error) {
          console.error('❌ Database insert error:', error)
          console.error('❌ Error details:', JSON.stringify(error, null, 2))
          return new Response(
            JSON.stringify({
              error: 'Failed to create service',
              details: error.message,
              code: error.code,
              hint: error.hint
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('✅ 예배 서비스 생성 성공:', data)
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

  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error keys:', error ? Object.keys(error) : 'null')

    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    const errorDetails = {
      message: errorMessage,
      name: error?.name,
      stack: error?.stack,
    }

    console.error('❌ Error details:', errorDetails)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: errorMessage,
        debug: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})