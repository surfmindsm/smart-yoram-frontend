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

    // Get user's church_id from token
    let userChurchId = null
    if (customToken.startsWith('temp_token_')) {
      const tokenParts = customToken.split('_')
      if (tokenParts.length >= 3) {
        const userId = parseInt(tokenParts[2])
        if (!isNaN(userId) && userId > 0) {
          // Get user's church_id
          const { data: userProfile } = await supabaseClient
            .from('users')
            .select('church_id')
            .eq('id', userId.toString())
            .single()

          userChurchId = userProfile?.church_id
          console.log('🏛️ User church lookup:', { userId, userChurchId })
        }
      }
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

    if (req.method === 'GET') {
      // Parse query parameters
      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const search = url.searchParams.get('search') || ''
      const position = url.searchParams.get('position') || ''
      const department = url.searchParams.get('department') || ''
      const status = url.searchParams.get('status') || ''

      // Calculate offset for pagination
      const offset = (page - 1) * limit

      // Build base query with church filter
      let query = supabaseClient
        .from('members')
        .select('*', { count: 'exact' })

      // Apply church filter (except for super admin with church_id 0)
      if (userChurchId && userChurchId !== 0) {
        query = query.eq('church_id', userChurchId)
      }

      // Apply other filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      if (position && position !== 'all') {
        query = query.eq('position', position)
      }

      if (department) {
        query = query.eq('department', department)
      }

      if (status) {
        query = query.eq('status', status)
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

      console.log('Query successful, found rows:', count)

      // Return paginated response
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
      // Create new member
      let body
      try {
        const text = await req.text()
        body = text ? JSON.parse(text) : {}
      } catch (error) {
        console.error('JSON parsing error in POST:', error)
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const insertData: any = {
        church_id: userChurchId || body.church_id || 9998, // Use user's church_id
        status: body.status || 'active'
      }

      // Only include fields that are provided and exist in the members table
      if (body.name !== undefined) insertData.name = body.name
      if (body.name_eng !== undefined) insertData.name_eng = body.name_eng
      if (body.phone !== undefined) insertData.phone = body.phone
      if (body.email !== undefined) insertData.email = body.email
      if (body.gender !== undefined) insertData.gender = body.gender
      if (body.birthdate !== undefined) insertData.birthdate = body.birthdate
      if (body.address !== undefined) insertData.address = body.address
      if (body.marital_status !== undefined) insertData.marital_status = body.marital_status
      if (body.position !== undefined) insertData.position = body.position
      if (body.department !== undefined) insertData.department = body.department
      if (body.district !== undefined) insertData.district = body.district

      console.log('📝 Insert data prepared:', insertData)

      const { data, error } = await supabaseClient
        .from('members')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Database insert error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create member' }),
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

    if (req.method === 'PUT') {
      // Update member
      console.log('📝 PUT request received')
      let body
      try {
        const text = await req.text()
        console.log('📝 Request text length:', text.length)
        console.log('📝 Request text preview:', text.substring(0, 200))
        body = text ? JSON.parse(text) : {}
        console.log('📝 Parsed body keys:', Object.keys(body))
      } catch (error) {
        console.error('JSON parsing error in PUT:', error)
        console.error('Request text that failed to parse:', text)
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const memberId = body.id

      if (!memberId) {
        return new Response(
          JSON.stringify({ error: 'Member ID is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Only include fields that exist in the members table and are being updated
      const updateData: any = {}

      if (body.name !== undefined) updateData.name = body.name
      if (body.name_eng !== undefined) updateData.name_eng = body.name_eng
      if (body.phone !== undefined) updateData.phone = body.phone
      if (body.email !== undefined) updateData.email = body.email
      if (body.gender !== undefined) updateData.gender = body.gender
      if (body.birthdate !== undefined) updateData.birthdate = body.birthdate
      if (body.address !== undefined) updateData.address = body.address
      if (body.marital_status !== undefined) updateData.marital_status = body.marital_status
      if (body.position !== undefined) updateData.position = body.position
      if (body.department !== undefined) updateData.department = body.department
      if (body.district !== undefined) updateData.district = body.district
      if (body.status !== undefined) updateData.status = body.status
      if (body.profile_photo_url !== undefined) updateData.profile_photo_url = body.profile_photo_url

      console.log('📝 Update data prepared:', updateData)

      let updateQuery = supabaseClient
        .from('members')
        .update(updateData)
        .eq('id', memberId)

      // Add church filter for non-super admins
      if (userChurchId && userChurchId !== 0) {
        updateQuery = updateQuery.eq('church_id', userChurchId)
      }

      const { data, error } = await updateQuery
        .select()
        .single()

      if (error) {
        console.error('Database update error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update member' }),
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
      // Delete member (soft delete by setting is_active to false)
      const url = new URL(req.url)
      const memberId = url.searchParams.get('id')

      if (!memberId) {
        return new Response(
          JSON.stringify({ error: 'Member ID is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      let deleteQuery = supabaseClient
        .from('members')
        .update({ status: 'inactive' })
        .eq('id', parseInt(memberId))

      // Add church filter for non-super admins
      if (userChurchId && userChurchId !== 0) {
        deleteQuery = deleteQuery.eq('church_id', userChurchId)
      }

      const { data, error } = await deleteQuery
        .select()
        .single()

      if (error) {
        console.error('Database delete error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to delete member' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data }),
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
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
