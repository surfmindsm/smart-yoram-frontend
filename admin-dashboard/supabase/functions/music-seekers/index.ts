// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, temp-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

Deno.serve(async (req) => {
  console.log('🔥 Edge Function started, method:', req.method)

  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      console.log('📋 Handling OPTIONS request')
      return new Response('ok', { headers: corsHeaders })
    }

    // Initialize Supabase client with SERVICE_ROLE_KEY to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    if (req.method === 'GET') {
      console.log('📋 Handling GET request')

      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const status = url.searchParams.get('status') || 'active'

      console.log('📊 Query params:', { limit, offset, status })

      // Query database - try with joins first, fallback to simple query
      let query = supabaseClient
        .from('music_team_seekers')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error('💥 Database query error:', error)
        return new Response(
          JSON.stringify({
            error: 'Database query failed',
            details: error.message,
            code: error.code
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ Query successful, found', data?.length || 0, 'records')

      return new Response(
        JSON.stringify({
          data: data || [],
          count: data?.length || 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      console.log('📝 Handling POST request')

      // Parse request body
      let body;
      try {
        body = await req.json()
        console.log('📥 Request body:', JSON.stringify(body, null, 2));
      } catch (jsonError) {
        console.error('❌ JSON parsing error:', jsonError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON', details: String(jsonError) }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Prepare insert data
      const insertData = {
        title: body.title || 'Untitled',
        team_name: body.team_name || body.teamName || null,
        instrument: body.instrument || body.teamType || '일반',
        experience: body.content || body.experience || null,
        portfolio: body.portfolio || null,
        portfolio_file: body.portfolio_file || body.portfolioFile || null,
        preferred_location: body.preferred_location || body.preferredLocation || [],
        available_days: body.available_days || body.availableDays || [],
        available_time: body.available_time || body.availableTime || null,
        contact_phone: body.contact_phone || body.contactPhone || '000-0000-0000',
        contact_email: body.contact_email || body.contactEmail || null,
        author_id: body.author_id || 1,
        author_name: body.author_name || '익명',
        church_id: body.church_id || null,
        church_name: body.church_name || null,
        status: body.status || 'active'
      }

      console.log('💾 Inserting data:', JSON.stringify(insertData, null, 2));

      // Insert into database
      const { data, error } = await supabaseClient
        .from('music_team_seekers')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('💥 Database error:', error)
        return new Response(
          JSON.stringify({
            error: 'Database insert failed',
            details: error.message,
            code: error.code
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ Insert successful:', data);

      // Return success response
      return new Response(
        JSON.stringify({
          message: 'Music seeker created successfully',
          data: data
        }),
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
    console.error('💥 Function error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})