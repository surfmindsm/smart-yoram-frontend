import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get custom auth token
    const customToken = req.headers.get('X-Custom-Auth') || req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!customToken) {
      return new Response(
        JSON.stringify({ error: 'No authentication token provided' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Parse temp token format: temp_token_{user_id}_{timestamp}
    let userId: number | null = null
    if (customToken.startsWith('temp_token_')) {
      const tokenParts = customToken.split('_')
      if (tokenParts.length >= 3) {
        userId = parseInt(tokenParts[2])
        if (isNaN(userId) || userId <= 0) {
          userId = null
        }
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log('🔍 GPT License API - Token User ID:', { userId })

    // Get user profile from database
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId.toString())
      .single()

    if (userError || !user) {
      console.error('❌ User profile lookup failed:', userError)
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/gpt-licenses', '')
    const method = req.method

    console.log('📍 GPT License API - Route:', { method, path })

    // Route handling
    if (method === 'GET' && path === '/stats') {
      return await getChurchStats(supabaseClient, url, user)
    }

    if (method === 'POST' && path === '/update-count') {
      return await updateChurchLicenseCount(supabaseClient, req, user)
    }

    if (method === 'GET' && path.startsWith('/church/')) {
      const churchId = parseInt(path.replace('/church/', ''))
      return await getChurchLicenses(supabaseClient, churchId, user)
    }

    if (method === 'GET' && path.startsWith('/church-admins/')) {
      const churchId = parseInt(path.replace('/church-admins/', ''))
      return await getChurchAdmins(supabaseClient, churchId, user)
    }

    if (method === 'POST' && path === '/assign') {
      return await assignLicense(supabaseClient, req, user)
    }

    if (method === 'DELETE' && path.startsWith('/revoke/')) {
      const licenseId = path.replace('/revoke/', '')
      return await revokeLicense(supabaseClient, licenseId, user)
    }

    if (method === 'DELETE' && path.startsWith('/revoke-user/')) {
      const targetUserId = path.replace('/revoke-user/', '')
      return await revokeLicenseByUser(supabaseClient, targetUserId, user)
    }

    if (method === 'GET' && path.startsWith('/user-status/')) {
      const targetUserId = path.replace('/user-status/', '')
      const churchId = parseInt(url.searchParams.get('church_id') || '0')
      return await getUserLicenseStatus(supabaseClient, targetUserId, churchId, user)
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('❌ GPT License API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

// Get church GPT license statistics
async function getChurchStats(supabaseClient: any, url: URL, user: any) {
  try {
    const churchIdParam = url.searchParams.get('church_id')

    // System admins can see all churches, church super admins can only see their church
    let query = supabaseClient
      .from('churches')
      .select(`
        serial_id,
        name,
        gpt_licenses_purchased,
        gpt_licenses_active,
        user_gpt_licenses!inner(id)
      `)

    if (user.role !== 'super_admin') {
      if (churchIdParam) {
        query = query.eq('serial_id', parseInt(churchIdParam))
      } else if (user.church_id) {
        query = query.eq('serial_id', user.church_id)
      } else {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    } else if (churchIdParam) {
      query = query.eq('serial_id', parseInt(churchIdParam))
    }

    const { data: churches, error } = await query

    if (error) {
      throw error
    }

    // Transform data to include license counts
    const stats = churches.map((church: any) => ({
      church_id: church.serial_id,
      church_name: church.name,
      licenses_purchased: church.gpt_licenses_purchased,
      licenses_active: church.gpt_licenses_active,
      licenses_assigned: church.user_gpt_licenses.length,
      licenses_available: Math.max(0, church.gpt_licenses_purchased - church.user_gpt_licenses.length)
    }))

    return new Response(
      JSON.stringify({ success: true, data: stats }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ Get Church Stats Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get church stats' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

// Update church license count (system admin only)
async function updateChurchLicenseCount(supabaseClient: any, req: Request, user: any) {
  try {
    if (user.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Access denied - system admin only' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { church_id, license_count } = await req.json()

    const { data, error } = await supabaseClient
      .from('churches')
      .update({ gpt_licenses_purchased: license_count })
      .eq('serial_id', church_id)
      .select()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ Update License Count Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update license count' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

// Get detailed church licenses
async function getChurchLicenses(supabaseClient: any, churchId: number, user: any) {
  try {
    // Check permissions
    if (user.role !== 'super_admin' && user.church_id !== churchId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data, error } = await supabaseClient
      .from('user_gpt_licenses')
      .select(`
        id,
        user_id,
        church_id,
        assigned_at,
        is_active,
        users!inner(name, email)
      `)
      .eq('church_id', churchId)
      .eq('is_active', true)

    if (error) {
      throw error
    }

    const licenses = data.map((license: any) => ({
      id: license.id,
      user_id: license.user_id,
      church_id: license.church_id,
      user_name: license.users.name,
      user_email: license.users.email,
      assigned_at: license.assigned_at,
      is_active: license.is_active
    }))

    return new Response(
      JSON.stringify({ success: true, data: licenses }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ Get Church Licenses Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get church licenses' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

// Get church admins for assignment
async function getChurchAdmins(supabaseClient: any, churchId: number, user: any) {
  try {
    // Check permissions - only church super admin or system admin
    if (user.role !== 'super_admin' &&
        (user.role !== 'church_super_admin' || user.church_id !== churchId)) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data: admins, error } = await supabaseClient
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        user_gpt_licenses!left(id, assigned_at, is_active)
      `)
      .eq('church_id', churchId)
      .in('role', ['admin', 'church_super_admin'])

    if (error) {
      throw error
    }

    const adminList = admins.map((admin: any) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      has_gpt_license: admin.user_gpt_licenses.some((l: any) => l.is_active),
      license_assigned_at: admin.user_gpt_licenses.find((l: any) => l.is_active)?.assigned_at
    }))

    return new Response(
      JSON.stringify({ success: true, data: adminList }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ Get Church Admins Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get church admins' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

// Assign license to user
async function assignLicense(supabaseClient: any, req: Request, user: any) {
  try {
    const { user_id, church_id } = await req.json()

    // Check permissions
    if (user.role !== 'super_admin' &&
        (user.role !== 'church_super_admin' || user.church_id !== church_id)) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Check if user already has a license for this church
    const { data: existingLicense, error: checkError } = await supabaseClient
      .from('user_gpt_licenses')
      .select('id')
      .eq('user_id', user_id)
      .eq('church_id', church_id)
      .eq('is_active', true)
      .single()

    if (existingLicense) {
      return new Response(
        JSON.stringify({ error: 'User already has an active GPT license' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Assign new license
    const { data, error } = await supabaseClient
      .from('user_gpt_licenses')
      .insert({
        user_id,
        church_id,
        assigned_by: user.id,
        is_active: true
      })
      .select()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ Assign License Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to assign license' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

// Revoke license by license ID
async function revokeLicense(supabaseClient: any, licenseId: string, user: any) {
  try {
    // Get license details first to check permissions
    const { data: license, error: licenseError } = await supabaseClient
      .from('user_gpt_licenses')
      .select('church_id')
      .eq('id', licenseId)
      .single()

    if (licenseError || !license) {
      return new Response(
        JSON.stringify({ error: 'License not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Check permissions
    if (user.role !== 'super_admin' &&
        (user.role !== 'church_super_admin' || user.church_id !== license.church_id)) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data, error } = await supabaseClient
      .from('user_gpt_licenses')
      .update({ is_active: false })
      .eq('id', licenseId)
      .select()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ Revoke License Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to revoke license' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

// Revoke license by user ID
async function revokeLicenseByUser(supabaseClient: any, targetUserId: string, user: any) {
  try {
    // Get user's license details first to check permissions
    const { data: license, error: licenseError } = await supabaseClient
      .from('user_gpt_licenses')
      .select('church_id, id')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .single()

    if (licenseError || !license) {
      return new Response(
        JSON.stringify({ error: 'Active license not found for user' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Check permissions
    if (user.role !== 'super_admin' &&
        (user.role !== 'church_super_admin' || user.church_id !== license.church_id)) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data, error } = await supabaseClient
      .from('user_gpt_licenses')
      .update({ is_active: false })
      .eq('id', license.id)
      .select()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ Revoke License by User Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to revoke license' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

// Get user license status
async function getUserLicenseStatus(supabaseClient: any, targetUserId: string, churchId: number, user: any) {
  try {
    const { data: license, error } = await supabaseClient
      .from('user_gpt_licenses')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('church_id', churchId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data: license || null }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('❌ Get User License Status Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get user license status' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}