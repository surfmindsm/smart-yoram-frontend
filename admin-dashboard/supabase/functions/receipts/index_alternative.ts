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
    console.log('🚀 Receipts Edge Function 시작')

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
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)
    console.log('🔍 URL 파싱:', { pathname: url.pathname, pathParts, method: req.method })

    // Handle different receipts endpoints
    if (req.method === 'GET') {
      console.log('📥 GET 요청 처리 중')

      // GET /receipts - Get receipts list
      const memberId = url.searchParams.get('member_id')
      const taxYear = url.searchParams.get('tax_year')
      const churchId = url.searchParams.get('church_id')
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')

      const offset = (page - 1) * limit

      // Build query for receipts table with member join
      let query = supabaseClient
        .from('receipts')
        .select(`
          *,
          members:member_id(id, name, phone, address)
        `, { count: 'exact' })

      // Apply filters
      if (memberId) {
        query = query.eq('member_id', memberId)
      }

      if (taxYear) {
        query = query.eq('tax_year', taxYear)
      }

      if (churchId) {
        query = query.eq('church_id', churchId)
      }

      // Apply pagination and ordering
      query = query
        .order('issued_at', { ascending: false })
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

      console.log('Query successful, found receipts:', count)

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

    if (req.method === 'POST') {
      const body = await req.json()
      console.log('📤 POST 요청 처리 중:', body)

      // POST /receipts - Create new receipt

      // Extract user ID from token for issued_by
      const tokenParts = customToken.split('_')
      let issuedByUserId = null
      if (tokenParts.length === 4 && tokenParts[0] === 'temp' && tokenParts[1] === 'token') {
        issuedByUserId = parseInt(tokenParts[2])
      }

      const insertData = {
        church_id: body.church_id || body.churchId,
        member_id: body.member_id || body.memberId,
        tax_year: body.tax_year || body.taxYear,
        total_amount: body.total_amount || body.totalAmount,
        issue_no: body.issue_no || body.issueNo,
        issued_by: body.issued_by || body.issuedBy || issuedByUserId,
      }

      console.log('💾 영수증 생성 데이터:', insertData)

      const { data, error } = await supabaseClient
        .from('receipts')
        .insert([insertData])
        .select(`
          *,
          members:member_id(id, name, phone, address)
        `)
        .single()

      if (error) {
        console.error('Database insert error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create receipt', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ 영수증 생성 성공:', data)

      return new Response(
        JSON.stringify(data),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'PUT') {
      const body = await req.json()

      // PUT /receipts/{id} - Update receipt
      const receiptId = pathParts[pathParts.length - 1]

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // Add fields only if they are provided
      if (body.member_id || body.memberId) updateData.member_id = body.member_id || body.memberId
      if (body.tax_year || body.taxYear) updateData.tax_year = body.tax_year || body.taxYear
      if (body.total_amount !== undefined || body.totalAmount !== undefined) {
        updateData.total_amount = body.total_amount || body.totalAmount
      }
      if (body.issue_no || body.issueNo) updateData.issue_no = body.issue_no || body.issueNo
      if (body.issued_by || body.issuedBy) updateData.issued_by = body.issued_by || body.issuedBy

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      const { data, error } = await supabaseClient
        .from('receipts')
        .update(updateData)
        .eq('id', receiptId)
        .select(`
          *,
          members:member_id(id, name, phone, address)
        `)
        .single()

      if (error) {
        console.error('Database update error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update receipt', details: error.message }),
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

    if (req.method === 'DELETE') {
      // DELETE /receipts/{id} - Delete receipt
      const receiptId = pathParts[pathParts.length - 1]

      const { error } = await supabaseClient
        .from('receipts')
        .delete()
        .eq('id', receiptId)

      if (error) {
        console.error('Database delete error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to delete receipt', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Receipt deleted successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
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
