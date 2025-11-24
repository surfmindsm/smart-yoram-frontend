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

    // Handle different pastoral care endpoints
    if (req.method === 'GET') {
      // GET /pastoral-care/admin/requests - Get pastoral care requests
      if (pathParts.includes('admin') && pathParts.includes('requests')) {
        const status = url.searchParams.get('status')
        const priority = url.searchParams.get('priority')
        const requestType = url.searchParams.get('request_type')
        const churchId = url.searchParams.get('church_id')
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '50')

        const offset = (page - 1) * limit

        // Build query for pastoral_care_requests table
        let query = supabaseClient
          .from('pastoral_care_requests')
          .select('*', { count: 'exact' })

        // Apply filters
        if (status) {
          query = query.eq('status', status)
        }

        if (priority) {
          query = query.eq('priority', priority)
        }

        if (requestType) {
          query = query.eq('request_type', requestType)
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

        console.log('Query successful, found pastoral care requests:', count)

        // Enrich data with member information
        const enrichedData = await Promise.all((data || []).map(async (request: any) => {
          let enrichedRequest = { ...request }

          // Get member information if member_id exists
          if (request.member_id) {
            const { data: memberData } = await supabaseClient
              .from('members')
              .select('name, phone, profile_photo_url, department, organization_id, address')
              .eq('id', request.member_id)
              .single()

            if (memberData) {
              // Override requester info with member info for consistency
              enrichedRequest.requester_name = memberData.name
              enrichedRequest.requester_phone = memberData.phone
              enrichedRequest.profile_photo_url = memberData.profile_photo_url
              enrichedRequest.department = memberData.department
              if (!enrichedRequest.address) {
                enrichedRequest.address = memberData.address
              }

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

      // GET /pastoral-care/admin/stats - Get pastoral care statistics
      if (pathParts.includes('admin') && pathParts.includes('stats')) {
        const { data, error } = await supabaseClient
          .from('pastoral_care_requests')
          .select('status, priority, request_type')

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
          pending: data?.filter(r => r.status === 'pending').length || 0,
          in_progress: data?.filter(r => r.status === 'in_progress').length || 0,
          completed: data?.filter(r => r.status === 'completed').length || 0,
          urgent: data?.filter(r => r.priority === 'urgent').length || 0,
          high: data?.filter(r => r.priority === 'high').length || 0,
          normal: data?.filter(r => r.priority === 'normal').length || 0,
          by_type: {
            general: data?.filter(r => r.request_type === 'general').length || 0,
            urgent: data?.filter(r => r.request_type === 'urgent').length || 0,
            hospital: data?.filter(r => r.request_type === 'hospital').length || 0,
            counseling: data?.filter(r => r.request_type === 'counseling').length || 0,
          }
        }

        return new Response(
          JSON.stringify(stats),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // GET /pastoral-care/admin/requests/{id} - Get specific request
      if (pathParts.includes('admin') && pathParts.includes('requests') && pathParts[pathParts.length - 1]) {
        const requestId = pathParts[pathParts.length - 1]

        const { data, error } = await supabaseClient
          .from('pastoral_care_requests')
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
            .select('name, phone, profile_photo_url, department, organization_id, address')
            .eq('id', data.member_id)
            .single()

          if (memberData) {
            enrichedRequest.requester_name = memberData.name
            enrichedRequest.requester_phone = memberData.phone
            enrichedRequest.profile_photo_url = memberData.profile_photo_url
            enrichedRequest.department = memberData.department
            if (!enrichedRequest.address) {
              enrichedRequest.address = memberData.address
            }

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

      // POST /pastoral-care/admin/requests - Create new pastoral care request
      if (pathParts.includes('admin') && pathParts.includes('requests')) {
        const insertData: any = {
          church_id: body.church_id || body.churchId || 9998,
          requester_name: body.requester_name || body.requesterName,
          requester_phone: body.requester_phone || body.requesterPhone,
          request_type: body.request_type || body.requestType || 'general',
          request_content: body.request_content || body.requestContent,
          preferred_date: body.preferred_date || body.preferredDate || null,
          preferred_time_start: body.preferred_time_start || body.preferredTimeStart || null,
          preferred_time_end: body.preferred_time_end || body.preferredTimeEnd || null,
          priority: body.priority || 'normal',
          status: body.status || 'pending',
          address: body.address || null,
          contact_info: body.contact_info || body.contactInfo || null,
          is_urgent: body.is_urgent || body.isUrgent || false
        }

        // member_id는 선택 사항 - 값이 있을 때만 추가
        const memberId = body.member_id || body.memberId;
        if (memberId) {
          insertData.member_id = memberId;
        }

        console.log('📥 [Edge Function] Received body:', body);
        console.log('📥 [Edge Function] Insert data:', insertData);
        console.log('📥 [Edge Function] member_id included:', 'member_id' in insertData, insertData.member_id);

        const { data, error } = await supabaseClient
          .from('pastoral_care_requests')
          .insert([insertData])
          .select()
          .single()

        if (error) {
          console.error('Database insert error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to create pastoral care request', details: error.message }),
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

      // POST /pastoral-care/admin/requests/{id}/complete - Complete request
      if (pathParts.includes('complete')) {
        const requestId = pathParts[pathParts.length - 2] // requests/{id}/complete

        const updateData = {
          status: 'completed',
          completion_date: new Date().toISOString(),
          completion_notes: body.completion_notes || body.completionNotes,
          pastor_notes: body.pastor_notes || body.pastorNotes
        }

        const { data, error } = await supabaseClient
          .from('pastoral_care_requests')
          .update(updateData)
          .eq('id', requestId)
          .select()
          .single()

        if (error) {
          console.error('Database update error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to complete request', details: error.message }),
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

      // PUT /pastoral-care/admin/requests/{id} - Update request
      if (pathParts.includes('admin') && pathParts.includes('requests')) {
        const requestId = pathParts[pathParts.length - 1]

        // Handle assign pastor endpoint
        if (pathParts.includes('assign')) {
          const updateData = {
            assigned_pastor_id: body.assigned_pastor_id,
            status: 'in_progress'
          }

          const { data, error } = await supabaseClient
            .from('pastoral_care_requests')
            .update(updateData)
            .eq('id', requestId)
            .select()
            .single()

          if (error) {
            console.error('Pastor assignment error:', error)
            return new Response(
              JSON.stringify({ error: 'Failed to assign pastor', details: error.message }),
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

        // Regular update
        const updateData = {
          requester_name: body.requester_name || body.requesterName,
          requester_phone: body.requester_phone || body.requesterPhone,
          request_type: body.request_type || body.requestType,
          request_content: body.request_content || body.requestContent,
          preferred_date: body.preferred_date || body.preferredDate,
          preferred_time_start: body.preferred_time_start || body.preferredTimeStart,
          preferred_time_end: body.preferred_time_end || body.preferredTimeEnd,
          priority: body.priority,
          status: body.status,
          pastor_notes: body.pastor_notes || body.pastorNotes
        }

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key]
          }
        })

        const { data, error } = await supabaseClient
          .from('pastoral_care_requests')
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