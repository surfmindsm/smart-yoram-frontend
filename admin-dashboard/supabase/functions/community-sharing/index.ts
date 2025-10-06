// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // For now, we'll use a custom header for authentication to bypass Supabase JWT validation
    // Frontend should send the custom token in a custom header instead of Authorization
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

    if (req.method === 'GET') {
      // Parse query parameters
      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '50', 10)
      const category = url.searchParams.get('category')
      const status = url.searchParams.get('status')
      const search = url.searchParams.get('search')
      const isFreeParam = url.searchParams.get('is_free') // 'true', 'false', or null

      // Build query with JOIN to fetch user and church data in one query
      let query = supabaseClient
        .from('community_sharing')
        .select(`
          *,
          author:users!author_id(id, full_name, email),
          church:churches!church_id(id, name, address)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (category) {
        query = query.eq('category', category)
      }
      if (status) {
        query = query.eq('status', status)
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }
      if (isFreeParam !== null) {
        // Filter by is_free: 'true' or 'false'
        const isFreeValue = isFreeParam === 'true'
        query = query.eq('is_free', isFreeValue)
      }

      // Apply limit
      query = query.limit(limit)

      const { data, error } = await query

      if (error) {
        console.error('Database query error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch community sharing data' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Transform data to match frontend expectations
      const transformedData = (data || []).map(item => ({
        ...item,
        content: item.description, // Map description to content for compatibility
        author_name: item.author?.full_name || item.author?.email || '익명',
        user_name: item.author?.full_name || item.author?.email || '익명',
        church_name: item.church?.name || null,
        church_address: item.church?.address || null
      }))

      return new Response(
        JSON.stringify({ success: true, data: transformedData }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      // Create new sharing item
      const body = await req.json()

      const insertData = {
        title: body.title,
        description: body.content || body.description,
        category: body.category || 'general',
        condition: body.condition || 'good',
        price: body.price || 0,
        is_free: body.is_free !== false, // Default to true
        location: body.location,
        contact_info: body.contact_info || body.contactInfo,
        images: body.images || [],
        church_id: body.church_id || 9998,
        author_id: body.author_id,
        status: body.status || 'active'
      }

      const { data, error } = await supabaseClient
        .from('community_sharing')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Database insert error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create community sharing item' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Transform response to match frontend expectations
      const transformedItem = {
        ...data,
        content: data.description, // Map description to content for compatibility
        author_name: data.author_name || '익명',
        user_name: data.author_name || '익명'
      }

      return new Response(
        JSON.stringify(transformedItem),
        {
          status: 201,
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
