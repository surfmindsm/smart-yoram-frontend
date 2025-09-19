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

    // Verify authentication from custom auth service
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')

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
      // Parse query parameters for date filtering
      const url = new URL(req.url)
      const startDate = url.searchParams.get('start_date')
      const endDate = url.searchParams.get('end_date')

      // Create a mock attendance table structure
      // For now, we'll create mock data since there's no actual attendance table
      // In a real implementation, you would query your actual attendance table

      let mockAttendances = [
        {
          id: 1,
          member_id: 1,
          attendance_date: '2024-01-15',
          is_present: true,
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T09:00:00Z'
        },
        {
          id: 2,
          member_id: 2,
          attendance_date: '2024-01-15',
          is_present: true,
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T09:00:00Z'
        },
        {
          id: 3,
          member_id: 3,
          attendance_date: '2024-01-15',
          is_present: false,
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T09:00:00Z'
        }
      ]

      // Filter by date if provided
      if (startDate || endDate) {
        mockAttendances = mockAttendances.filter(attendance => {
          const attendanceDate = attendance.attendance_date
          if (startDate && attendanceDate < startDate) return false
          if (endDate && attendanceDate > endDate) return false
          return true
        })
      }

      return new Response(
        JSON.stringify(mockAttendances),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      // Create new attendance record
      const body = await req.json()

      // Mock creation response
      const newAttendance = {
        id: Math.floor(Math.random() * 1000),
        member_id: body.member_id,
        attendance_date: body.attendance_date || new Date().toISOString().split('T')[0],
        is_present: body.is_present || true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return new Response(
        JSON.stringify(newAttendance),
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
