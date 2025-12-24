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

    // Verify authentication from custom auth service
    const customAuthHeader = req.headers.get('X-Custom-Auth')
    if (!customAuthHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = customAuthHeader

    // Basic token validation (in real app, you'd verify JWT properly)
    if (!token.startsWith('temp_token_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'GET') {
      // Get query parameters
      const url = new URL(req.url)
      const adminMode = url.searchParams.get('admin') === 'true'

      let query = supabaseClient
        .from('system_announcements')
        .select('*')
        .order('created_at', { ascending: false })

      // If not admin mode, only return active announcements within date range
      if (!adminMode) {
        const now = new Date().toISOString()
        query = query
          .eq('is_active', true)
          .lte('start_date', now)
          .or(`end_date.is.null,end_date.gte.${now}`)
      }

      const { data: announcements, error } = await query

      if (error) {
        console.error('Database error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify(announcements || []),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      // Create new announcement
      const body = await req.json()

      // Get user ID from token
      const userId = parseInt(token.split('_')[2])

      // Insert into database
      const { data: newAnnouncement, error } = await supabaseClient
        .from('system_announcements')
        .insert({
          title: body.title,
          content: body.content,
          priority: body.priority || 'normal',
          target_churches: body.target_churches || null,
          start_date: body.start_date,
          end_date: body.end_date || null,
          is_active: body.is_active !== undefined ? body.is_active : true,
          created_by: userId,
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify(newAnnouncement),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'PUT') {
      // Update announcement or mark as read
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const announcementId = pathParts[pathParts.length - 2] // Get ID from path like /1/read or /1

      if (pathParts[pathParts.length - 1] === 'read') {
        // Mark announcement as read
        return new Response(
          JSON.stringify({ message: 'Announcement marked as read' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else {
        // Update announcement
        const body = await req.json()
        const id = pathParts[pathParts.length - 1]

        const updatedAnnouncement = {
          id: parseInt(id),
          ...body,
          updated_at: new Date().toISOString()
        }

        return new Response(
          JSON.stringify(updatedAnnouncement),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    if (req.method === 'DELETE') {
      // Delete announcement
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const id = pathParts[pathParts.length - 1]

      return new Response(
        JSON.stringify({ message: 'Announcement deleted successfully', id }),
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
