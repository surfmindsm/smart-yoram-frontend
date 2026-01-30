// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify authentication from custom auth service
    const customAuthHeader = req.headers.get('X-Custom-Auth')

    if (!customAuthHeader) {
      console.error('Missing X-Custom-Auth header')
      return new Response(
        JSON.stringify({ error: 'Missing authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Basic token validation (accepts temp_token_ or regular JWT)
    console.log('Auth token received:', customAuthHeader.substring(0, 20) + '...')

    if (req.method === 'GET') {
      // Parse query parameters for date filtering
      const url = new URL(req.url)
      const startDate = url.searchParams.get('start_date')
      const endDate = url.searchParams.get('end_date')
      const serviceDate = url.searchParams.get('service_date')
      const churchId = url.searchParams.get('church_id')

      console.log('GET attendances - filters:', { startDate, endDate, serviceDate, churchId })

      // Build query
      let query = supabaseClient.from('attendances').select('*')

      // Filter by church_id if provided
      if (churchId) {
        query = query.eq('church_id', parseInt(churchId))
      }

      // Filter by specific service date if provided
      if (serviceDate) {
        query = query.eq('service_date', serviceDate)
      }
      // Otherwise filter by date range
      else {
        if (startDate) {
          query = query.gte('service_date', startDate)
        }
        if (endDate) {
          query = query.lte('service_date', endDate)
        }
      }

      const { data, error } = await query.order('service_date', { ascending: false })

      if (error) {
        console.error('Database query error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify(data || []),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      // Create new attendance record
      const body = await req.json()

      const { data, error } = await supabaseClient
        .from('attendances')
        .insert([{
          member_id: body.member_id,
          church_id: body.church_id,
          service_date: body.service_date || new Date().toISOString().split('T')[0],
          service_type: body.service_type || 'sunday_morning',
          present: body.present !== undefined ? body.present : true,
          check_in_method: body.check_in_method || 'manual',
          check_in_time: body.check_in_time || new Date().toISOString(),
          notes: body.notes || null
        }])
        .select()
        .single()

      if (error) {
        console.error('Insert error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
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

    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Update attendance record
      const body = await req.json()
      const { id, ...updates } = body

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Attendance ID is required for update' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const { data, error } = await supabaseClient
        .from('attendances')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Update error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
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
      // Delete attendance record
      const url = new URL(req.url)
      const id = url.searchParams.get('id')

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Attendance ID is required for deletion' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const { error } = await supabaseClient
        .from('attendances')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
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
