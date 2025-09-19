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
    console.log('🚀 Edge Function 시작')

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

    // Validate custom auth token format: temp_token_{user_id}_{timestamp}
    if (!customToken.startsWith('temp_token_')) {
      // For backward compatibility, also accept any non-empty token during development
      console.log('⚠️ Non-temp token provided, allowing for development:', customToken.substring(0, 20) + '...')
    } else {
      console.log('🔍 temp_token 형식 검증 중...')
      // Parse token to extract user_id and timestamp
      const tokenParts = customToken.split('_')
      console.log('🔍 토큰 파트:', tokenParts)

      if (tokenParts.length !== 4 || tokenParts[0] !== 'temp' || tokenParts[1] !== 'token') {
        console.log('❌ 잘못된 토큰 구조:', { length: tokenParts.length, parts: tokenParts })
        return new Response(
          JSON.stringify({ error: 'Invalid token structure' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const userId = parseInt(tokenParts[2])
      const timestamp = parseInt(tokenParts[3])
      console.log('🔍 파싱된 값들:', { userId, timestamp })

      if (isNaN(userId) || userId <= 0) {
        console.log('❌ 잘못된 사용자 ID:', userId)
        return new Response(
          JSON.stringify({ error: 'Invalid user ID in token' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if token is not too old (24 hours = 86400000 ms)
      const now = Date.now()
      const tokenAge = now - timestamp
      console.log('🔍 토큰 만료 확인:', { now, timestamp, age: tokenAge, maxAge: 86400000 })

      if (timestamp > 0 && tokenAge > 86400000) {
        console.log('❌ 토큰이 만료됨')
        return new Response(
          JSON.stringify({ error: 'Token expired' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ 토큰 검증 완료')
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)
    console.log('🔍 URL 파싱:', { pathname: url.pathname, pathParts, method: req.method })

    // Handle different offerings endpoints
    if (req.method === 'GET') {
      console.log('📥 GET 요청 처리 중')
      // GET /offerings/admin/offerings - Get offerings
      if (pathParts.includes('admin') && pathParts.includes('offerings')) {
        console.log('📋 헌금 목록 조회 요청')
        const fundType = url.searchParams.get('fund_type')
        const dateFrom = url.searchParams.get('date_from')
        const dateTo = url.searchParams.get('date_to')
        const memberId = url.searchParams.get('member_id')
        const churchId = url.searchParams.get('church_id')
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '50')

        const offset = (page - 1) * limit

        // Build query for offerings table with member join
        let query = supabaseClient
          .from('offerings')
          .select(`
            *,
            members:member_id(id, name, email),
            input_user:input_user_id(id, username)
          `, { count: 'exact' })

        // Apply filters
        if (fundType) {
          query = query.eq('fund_type', fundType)
        }

        if (dateFrom) {
          query = query.gte('offered_on', dateFrom)
        }

        if (dateTo) {
          query = query.lte('offered_on', dateTo)
        }

        if (memberId) {
          query = query.eq('member_id', memberId)
        }

        if (churchId) {
          query = query.eq('church_id', churchId)
        }

        // Apply pagination and ordering
        query = query
          .order('offered_on', { ascending: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
          console.error('Database query error:', error)
          return new Response(
            JSON.stringify({ error: 'Database query failed', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('Query successful, found offerings:', count)

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

      // GET /offerings/admin/stats - Get offering statistics
      if (pathParts.includes('admin') && pathParts.includes('stats')) {
        const churchId = url.searchParams.get('church_id')
        const dateFrom = url.searchParams.get('date_from')
        const dateTo = url.searchParams.get('date_to')

        let query = supabaseClient
          .from('offerings')
          .select('fund_type, amount, offered_on')

        if (churchId) {
          query = query.eq('church_id', churchId)
        }

        if (dateFrom) {
          query = query.gte('offered_on', dateFrom)
        }

        if (dateTo) {
          query = query.lte('offered_on', dateTo)
        }

        const { data, error } = await query

        if (error) {
          console.error('Stats query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch stats', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Calculate statistics
        const totalAmount = data?.reduce((sum, offering) => sum + parseFloat(offering.amount), 0) || 0
        const fundTypeStats = data?.reduce((acc: any, offering) => {
          const type = offering.fund_type
          if (!acc[type]) {
            acc[type] = { count: 0, amount: 0 }
          }
          acc[type].count += 1
          acc[type].amount += parseFloat(offering.amount)
          return acc
        }, {}) || {}

        const stats = {
          total: data?.length || 0,
          total_amount: totalAmount,
          by_fund_type: fundTypeStats,
          period: {
            from: dateFrom,
            to: dateTo
          }
        }

        return new Response(
          JSON.stringify(stats),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // GET /offerings/admin/offerings/{id} - Get specific offering
      if (pathParts.includes('admin') && pathParts.includes('offerings') && pathParts[pathParts.length - 1]) {
        const offeringId = pathParts[pathParts.length - 1]

        const { data, error } = await supabaseClient
          .from('offerings')
          .select(`
            *,
            members:member_id(id, name, email),
            input_user:input_user_id(id, username)
          `)
          .eq('id', offeringId)
          .single()

        if (error) {
          console.error('Single offering query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch offering', details: error.message }),
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

      // GET /offerings/admin/fund-types - Get available fund types
      if (pathParts.includes('admin') && pathParts.includes('fund-types')) {
        const churchId = url.searchParams.get('church_id')

        let query = supabaseClient
          .from('offerings')
          .select('fund_type')

        if (churchId) {
          query = query.eq('church_id', churchId)
        }

        const { data, error } = await query

        if (error) {
          console.error('Fund types query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch fund types', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Extract unique fund types
        const uniqueFundTypes = [...new Set(data?.map(d => d.fund_type).filter(Boolean))] || []

        return new Response(
          JSON.stringify(uniqueFundTypes),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    if (req.method === 'POST') {
      const body = await req.json()

      // POST /offerings/admin/offerings - Create new offering
      if (pathParts.includes('admin') && pathParts.includes('offerings')) {
        const insertData = {
          church_id: body.church_id || body.churchId || 6,
          member_id: body.member_id || body.memberId,
          offered_on: body.offered_on || body.offeredOn,
          fund_type: body.fund_type || body.fundType,
          amount: body.amount,
          note: body.note,
          input_user_id: body.input_user_id || body.inputUserId || 1 // TODO: Extract from token
        }

        const { data, error } = await supabaseClient
          .from('offerings')
          .insert([insertData])
          .select(`
            *,
            members:member_id(id, name, email),
            input_user:input_user_id(id, username)
          `)
          .single()

        if (error) {
          console.error('Database insert error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to create offering', details: error.message }),
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

      // PUT /offerings/admin/offerings/{id} - Update offering
      if (pathParts.includes('admin') && pathParts.includes('offerings')) {
        const offeringId = pathParts[pathParts.length - 1]

        const updateData = {
          member_id: body.member_id || body.memberId,
          offered_on: body.offered_on || body.offeredOn,
          fund_type: body.fund_type || body.fundType,
          amount: body.amount,
          note: body.note,
          updated_at: new Date().toISOString()
        }

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key]
          }
        })

        const { data, error } = await supabaseClient
          .from('offerings')
          .update(updateData)
          .eq('id', offeringId)
          .select(`
            *,
            members:member_id(id, name, email),
            input_user:input_user_id(id, username)
          `)
          .single()

        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to update offering', details: error.message }),
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
      // DELETE /offerings/admin/offerings/{id} - Delete offering
      if (pathParts.includes('admin') && pathParts.includes('offerings')) {
        const offeringId = pathParts[pathParts.length - 1]

        const { error } = await supabaseClient
          .from('offerings')
          .delete()
          .eq('id', offeringId)

        if (error) {
          console.error('Database delete error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to delete offering', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Offering deleted successfully' }),
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