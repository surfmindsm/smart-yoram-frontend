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
      const worship_type = url.searchParams.get('worship_type')
      const instruments = url.searchParams.get('instruments')
      const experience = url.searchParams.get('experience')
      const status = url.searchParams.get('status')
      const search = url.searchParams.get('search')

      // Build query
      let query = supabaseClient
        .from('community_music_teams')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (worship_type) {
        query = query.eq('worship_type', worship_type)
      }
      if (experience) {
        query = query.eq('experience_required', experience)
      }
      if (status) {
        query = query.eq('status', status)
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,team_name.ilike.%${search}%`)
      }
      if (instruments) {
        // JSON 배열에서 악기 검색
        query = query.contains('instruments_needed', [instruments])
      }

      // Apply limit
      query = query.limit(limit)

      const { data, error } = await query

      if (error) {
        console.error('Database query error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch music teams data' }),
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
        author_name: item.author_name || '익명',
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
      // Create new music team recruitment
      const body = await req.json()

      const insertData = {
        title: body.title,
        team_name: body.team_name || body.teamName,
        worship_type: body.worship_type || body.worshipType || 'contemporary',
        instruments_needed: body.instruments_needed || body.instrumentsNeeded || [],
        positions_needed: body.positions_needed || body.positionsNeeded,
        experience_required: body.experience_required || body.experienceRequired || 'beginner',
        practice_location: body.practice_location || body.practiceLocation,
        practice_schedule: body.practice_schedule || body.practiceSchedule,
        commitment: body.commitment,
        description: body.content || body.description,
        requirements: body.requirements,
        benefits: body.benefits,
        contact_method: body.contact_method || body.contactMethod || 'phone',
        contact_info: body.contact_info || body.contactInfo,
        current_members: body.current_members || body.currentMembers || 0,
        target_members: body.target_members || body.targetMembers,
        church_id: body.church_id || 9998,
        author_id: body.author_id,
        status: body.status || 'active'
      }

      const { data, error } = await supabaseClient
        .from('community_music_teams')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Database insert error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create music team recruitment' }),
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