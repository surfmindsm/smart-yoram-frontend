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
    // Initialize Supabase client with service role key for database access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Custom authentication header approach
    const customToken = req.headers.get('X-Custom-Auth') || req.headers.get('Authorization')?.replace('Bearer ', '')

    if (!customToken) {
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
      console.log('Non-temp token provided, allowing for development:', customToken.substring(0, 20) + '...')
    } else {
      // Parse token to extract user_id and timestamp
      const tokenParts = customToken.split('_')
      if (tokenParts.length !== 4 || tokenParts[0] !== 'temp' || tokenParts[1] !== 'token') {
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

      if (isNaN(userId) || userId <= 0) {
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
      if (timestamp > 0 && (now - timestamp) > 86400000) {
        return new Response(
          JSON.stringify({ error: 'Token expired' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)

    // Handle different prayer request endpoints
    if (req.method === 'GET') {
      // GET /prayer-requests/admin/requests - Get prayer requests
      if (pathParts.includes('admin') && pathParts.includes('requests')) {
        const status = url.searchParams.get('status')
        const prayerType = url.searchParams.get('prayer_type')
        const isUrgent = url.searchParams.get('is_urgent')
        const isPublic = url.searchParams.get('is_public')
        const churchId = url.searchParams.get('church_id')
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '50')

        const offset = (page - 1) * limit

        // Build query for prayer_requests table
        let query = supabaseClient
          .from('prayer_requests')
          .select('*', { count: 'exact' })

        // Apply filters
        if (status) {
          query = query.eq('status', status)
        }

        if (prayerType) {
          query = query.eq('prayer_type', prayerType)
        }

        if (isUrgent) {
          query = query.eq('is_urgent', isUrgent === 'true')
        }

        if (isPublic) {
          query = query.eq('is_public', isPublic === 'true')
        }

        if (churchId) {
          query = query.eq('church_id', churchId)
        }

        // Apply pagination and ordering
        query = query
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

        console.log('Query successful, found prayer requests:', count)

        // Enrich data with member information
        const enrichedData = await Promise.all((data || []).map(async (request: any) => {
          let enrichedRequest = { ...request }

          // Get member information if member_id exists
          if (request.member_id) {
            const { data: memberData } = await supabaseClient
              .from('members')
              .select('name, phone, profile_photo_url, department, organization_id')
              .eq('id', request.member_id)
              .single()

            if (memberData) {
              // Override requester info with member info for consistency
              enrichedRequest.requester_name = memberData.name
              enrichedRequest.requester_phone = memberData.phone
              enrichedRequest.profile_photo_url = memberData.profile_photo_url
              enrichedRequest.department = memberData.department

              // Get organization name if organization_id exists
              if (memberData.organization_id) {
                const { data: orgData } = await supabaseClient
                  .from('church_organizations')
                  .select('name')
                  .eq('id', memberData.organization_id)
                  .single()

                enrichedRequest.organization_name = orgData?.name || null
              }
            }
          }

          return enrichedRequest
        }))

        return new Response(
          JSON.stringify({
            data: enrichedData || [],
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

      // GET /prayer-requests/admin/stats - Get prayer request statistics
      if (pathParts.includes('admin') && pathParts.includes('stats')) {
        const churchId = url.searchParams.get('church_id')

        let query = supabaseClient
          .from('prayer_requests')
          .select('status, prayer_type, is_urgent, is_public')

        if (churchId) {
          query = query.eq('church_id', churchId)
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
        const stats = {
          total: data?.length || 0,
          active: data?.filter(r => r.status === 'active').length || 0,
          answered: data?.filter(r => r.status === 'answered').length || 0,
          closed: data?.filter(r => r.status === 'closed').length || 0,
          urgent: data?.filter(r => r.is_urgent === true).length || 0,
          public: data?.filter(r => r.is_public === true).length || 0,
          by_type: {
            general: data?.filter(r => r.prayer_type === 'general').length || 0,
            healing: data?.filter(r => r.prayer_type === 'healing').length || 0,
            family: data?.filter(r => r.prayer_type === 'family').length || 0,
            work: data?.filter(r => r.prayer_type === 'work').length || 0,
            ministry: data?.filter(r => r.prayer_type === 'ministry').length || 0,
          }
        }

        return new Response(
          JSON.stringify(stats),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // GET /prayer-requests/admin/requests/{id} - Get specific request
      if (pathParts.includes('admin') && pathParts.includes('requests') && pathParts[pathParts.length - 1]) {
        const requestId = pathParts[pathParts.length - 1]

        const { data, error } = await supabaseClient
          .from('prayer_requests')
          .select('*')
          .eq('id', requestId)
          .single()

        if (error) {
          console.error('Single request query error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch request', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Enrich with member information if member_id exists
        let enrichedRequest = { ...data }
        if (data.member_id) {
          const { data: memberData } = await supabaseClient
            .from('members')
            .select('name, phone, profile_photo_url, department, organization_id')
            .eq('id', data.member_id)
            .single()

          if (memberData) {
            enrichedRequest.requester_name = memberData.name
            enrichedRequest.requester_phone = memberData.phone
            enrichedRequest.profile_photo_url = memberData.profile_photo_url
            enrichedRequest.department = memberData.department

            if (memberData.organization_id) {
              const { data: orgData } = await supabaseClient
                .from('church_organizations')
                .select('name')
                .eq('id', memberData.organization_id)
                .single()

              enrichedRequest.organization_name = orgData?.name || null
            }
          }
        }

        return new Response(
          JSON.stringify(enrichedRequest),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    if (req.method === 'POST') {
      const body = await req.json()
      console.log('🙏 [Edge Function] URL pathname:', url.pathname)
      console.log('🙏 [Edge Function] pathParts:', pathParts)
      console.log('🙏 [Edge Function] 받은 body:', body)

      // POST - Create new prayer request (check action from body or path)
      const action = body.action || (pathParts.includes('answer') ? 'answer' : pathParts.includes('pray') ? 'pray' : 'create')

      if (action === 'create') {
        console.log('🙏 [Edge Function] Creating prayer request')

        const insertData = {
          church_id: body.church_id || body.churchId || 9998,
          member_id: body.member_id || body.memberId || null,
          requester_name: body.requester_name || body.requesterName,
          requester_phone: body.requester_phone || body.requesterPhone,
          prayer_type: body.prayer_type || body.prayerType || 'general',
          prayer_content: body.prayer_content || body.prayerContent,
          is_anonymous: body.is_anonymous || body.isAnonymous || false,
          is_urgent: body.is_urgent || body.isUrgent || false,
          is_public: body.is_public !== undefined ? body.is_public : (body.isPublic !== undefined ? body.isPublic : true),
          status: body.status || 'active',
          expires_at: body.expires_at || body.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        }

        console.log('🙏 [Edge Function] 삽입할 데이터:', insertData)

        const { data, error } = await supabaseClient
          .from('prayer_requests')
          .insert([insertData])
          .select()
          .single()

        if (error) {
          console.error('🚨 [Edge Function] Database insert error:', error)
          console.error('🚨 [Edge Function] Error details:', JSON.stringify(error, null, 2))
          return new Response(
            JSON.stringify({ error: 'Failed to create prayer request', details: error.message, code: error.code }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        console.log('✅ [Edge Function] 삽입 성공:', data)

        return new Response(
          JSON.stringify(data),
          {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // POST - Increment prayer count
      if (action === 'pray') {
        const requestId = body.requestId || body.request_id

        const { data, error } = await supabaseClient
          .from('prayer_requests')
          .update({
            prayer_count: supabaseClient.rpc('increment_prayer_count', { request_id: requestId })
          })
          .eq('id', requestId)
          .select()
          .single()

        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to increment prayer count', details: error.message }),
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

      // POST - Mark as answered
      if (action === 'answer') {
        const requestId = body.requestId || body.request_id

        const updateData = {
          status: 'answered',
          answered_testimony: body.answered_testimony || body.answeredTestimony,
          closed_at: new Date().toISOString(),
          admin_notes: body.admin_notes || body.adminNotes
        }

        const { data, error } = await supabaseClient
          .from('prayer_requests')
          .update(updateData)
          .eq('id', requestId)
          .select()
          .single()

        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to mark as answered', details: error.message }),
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

      // POST /prayer-requests/admin/requests/{id}/pray - Increment prayer count
      if (pathParts.includes('pray')) {
        const requestId = pathParts[pathParts.length - 2] // requests/{id}/pray

        const { data, error } = await supabaseClient
          .from('prayer_requests')
          .update({
            prayer_count: supabaseClient.rpc('increment_prayer_count', { request_id: requestId })
          })
          .eq('id', requestId)
          .select()
          .single()

        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to increment prayer count', details: error.message }),
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

    if (req.method === 'PUT') {
      const body = await req.json()

      // PUT - Update request
      const requestId = body.requestId || body.request_id || body.id

      const updateData = {
        member_id: body.member_id || body.memberId,
        requester_name: body.requester_name || body.requesterName,
        requester_phone: body.requester_phone || body.requesterPhone,
        prayer_type: body.prayer_type || body.prayerType,
        prayer_content: body.prayer_content || body.prayerContent,
        is_anonymous: body.is_anonymous !== undefined ? body.is_anonymous : body.isAnonymous,
        is_urgent: body.is_urgent !== undefined ? body.is_urgent : body.isUrgent,
        is_public: body.is_public !== undefined ? body.is_public : body.isPublic,
        status: body.status,
        admin_notes: body.admin_notes || body.adminNotes,
        answered_testimony: body.answered_testimony || body.answeredTestimony,
        updated_at: new Date().toISOString()
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      const { data, error } = await supabaseClient
        .from('prayer_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single()

      if (error) {
        console.error('Database update error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update request', details: error.message }),
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
      const body = await req.json()
      const requestId = body.requestId || body.request_id || body.id

      const { error } = await supabaseClient
        .from('prayer_requests')
        .delete()
        .eq('id', requestId)

      if (error) {
        console.error('Database delete error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to delete request', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Prayer request deleted successfully' }),
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