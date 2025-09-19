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

    if (req.method === 'GET') {
      // Parse query parameters
      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '50', 10)
      const instrument = url.searchParams.get('instrument')
      const location = url.searchParams.get('location')
      const days = url.searchParams.get('days')
      const status = url.searchParams.get('status')
      const search = url.searchParams.get('search')

      // Build query
      let query = supabaseClient
        .from('music_team_seekers')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (instrument) {
        query = query.eq('instrument', instrument)
      }
      if (status) {
        query = query.eq('status', status)
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,experience.ilike.%${search}%,author_name.ilike.%${search}%`)
      }
      if (location) {
        // Array field search
        query = query.contains('preferred_location', [location])
      }
      if (days) {
        // Array field search
        query = query.contains('available_days', [days])
      }

      // Apply limit
      query = query.limit(limit)

      const { data, error } = await query

      if (error) {
        console.error('Database query error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch music seekers data' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Transform data to match frontend expectations
      const transformedData = (data || []).map(item => ({
        ...item,
        content: item.experience, // Map experience to content for compatibility
        userName: item.author_name || '익명',
        user_name: item.author_name || '익명'
      }))

      return new Response(
        JSON.stringify(transformedData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      // Create new music seeker
      const body = await req.json()

      const insertData = {
        title: body.title,
        team_name: body.team_name || body.teamName,
        instrument: body.instrument,
        experience: body.content || body.experience,
        portfolio: body.portfolio,
        preferred_location: body.preferred_location || body.preferredLocation || [],
        available_days: body.available_days || body.availableDays || [],
        available_time: body.available_time || body.availableTime,
        contact_phone: body.contact_phone || body.contactPhone,
        contact_email: body.contact_email || body.contactEmail,
        author_id: body.author_id,
        author_name: body.author_name || '익명',
        church_id: body.church_id,
        church_name: body.church_name,
        status: body.status || 'active'
      }

      const { data, error } = await supabaseClient
        .from('music_team_seekers')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Database insert error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create music seeker' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Transform response to match frontend expectations
      const transformedItem = {
        ...data,
        content: data.experience, // Map experience to content for compatibility
        userName: data.author_name || '익명',
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