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
      // Parse query parameters for user lookup
      const url = new URL(req.url)
      const email = url.searchParams.get('email')
      const userId = url.searchParams.get('id')

      // Build query
      let query = supabaseClient
        .from('users')
        .select('*')

      // Apply filters for login
      if (email) {
        query = query.eq('email', email).eq('is_active', true)
      } else if (userId) {
        query = query.eq('id', parseInt(userId))
      } else {
        // Return all users if no filter
        query = query.eq('is_active', true).order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) {
        console.error('Database query error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user data' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // For single user lookup (login), return single object
      if (email && data && data.length > 0) {
        return new Response(
          JSON.stringify(data[0]),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Return array for multiple users
      return new Response(
        JSON.stringify(data || []),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      // Create new user
      const body = await req.json()

      const insertData = {
        email: body.email,
        username: body.username,
        full_name: body.full_name,
        role: body.role || 'member',
        church_id: body.church_id || 9998,
        is_active: body.is_active !== false, // Default to true
        is_superuser: body.is_superuser || false
      }

      const { data, error } = await supabaseClient
        .from('users')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Database insert error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
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