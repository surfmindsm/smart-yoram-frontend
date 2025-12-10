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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Custom authentication header approach
    const customToken = req.headers.get('X-Custom-Auth') || req.headers.get('Authorization')?.replace('Bearer ', '')

    if (!customToken) {
      return new Response(
        JSON.stringify({ error: '인증 정보가 없습니다' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user info from token
    let userId = null
    let userChurchId = null

    if (customToken.startsWith('temp_token_')) {
      const tokenParts = customToken.split('_')
      console.log('🔍 Token parts:', tokenParts)
      if (tokenParts.length >= 3) {
        userId = parseInt(tokenParts[2])
        console.log('👤 Parsed userId:', userId)
        if (!isNaN(userId) && userId > 0) {
          // Get user's church_id
          const { data: userProfile, error: userError } = await supabaseClient
            .from('users')
            .select('church_id, id, email')
            .eq('id', userId.toString())
            .single()

          console.log('📊 User query result:', { userProfile, userError })
          userChurchId = userProfile?.church_id
          console.log('🏛️ User info:', { userId, userChurchId })
        }
      }
    }

    if (userChurchId === null || userChurchId === undefined) {
      return new Response(
        JSON.stringify({ error: '사용자의 교회 정보를 찾을 수 없습니다' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)
    const id = pathParts[pathParts.length - 1]

    // GET - 일정 목록 조회 또는 단일 일정 조회
    if (req.method === 'GET') {
      // 단일 일정 조회
      if (id && id !== 'important-dates' && !isNaN(parseInt(id))) {
        const { data, error } = await supabaseClient
          .from('important_dates')
          .select(`
            *,
            members:member_id (
              id,
              name,
              phone
            )
          `)
          .eq('id', id)
          .eq('church_id', userChurchId)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify(data),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // 목록 조회 (쿼리 파라미터로 필터링)
      const isActive = url.searchParams.get('is_active')
      const isCompleted = url.searchParams.get('is_completed')
      const fromDate = url.searchParams.get('from_date')
      const toDate = url.searchParams.get('to_date')

      let query = supabaseClient
        .from('important_dates')
        .select(`
          *,
          members:member_id (
            id,
            name,
            phone
          )
        `)
        .eq('church_id', userChurchId)
        .order('event_date', { ascending: true })

      if (isActive !== null) {
        query = query.eq('is_active', isActive === 'true')
      }

      if (isCompleted !== null) {
        query = query.eq('is_completed', isCompleted === 'true')
      }

      if (fromDate) {
        query = query.gte('event_date', fromDate)
      }

      if (toDate) {
        query = query.lte('event_date', toDate)
      }

      const { data, error } = await query

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify(data),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // POST - 일정 생성
    if (req.method === 'POST') {
      const body = await req.json()

      const { data, error } = await supabaseClient
        .from('important_dates')
        .insert({
          church_id: userChurchId,
          member_id: body.member_id || null,
          event_type: body.event_type || '',
          title: body.title,
          event_date: body.event_date || null,
          description: body.description || null,
          enable_dday_alert: body.enable_dday_alert !== false,
          alert_days_before: body.alert_days_before || 7,
          is_active: true,
          is_completed: false,
          created_by: userId,
          notes: body.notes || null
        })
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
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

    // PUT - 일정 수정
    if (req.method === 'PUT') {
      if (!id || id === 'important-dates' || isNaN(parseInt(id))) {
        return new Response(
          JSON.stringify({ error: 'ID가 필요합니다' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const body = await req.json()

      const updateData: any = {}
      if (body.member_id !== undefined) updateData.member_id = body.member_id
      if (body.event_type !== undefined) updateData.event_type = body.event_type || ''
      if (body.title) updateData.title = body.title
      if (body.event_date !== undefined) updateData.event_date = body.event_date
      if (body.description !== undefined) updateData.description = body.description
      if (body.enable_dday_alert !== undefined) updateData.enable_dday_alert = body.enable_dday_alert
      if (body.alert_days_before !== undefined) updateData.alert_days_before = body.alert_days_before
      if (body.is_active !== undefined) updateData.is_active = body.is_active
      if (body.is_completed !== undefined) {
        updateData.is_completed = body.is_completed
        if (body.is_completed && !body.completed_at) {
          updateData.completed_at = new Date().toISOString()
        }
      }
      if (body.completed_at !== undefined) updateData.completed_at = body.completed_at
      if (body.notes !== undefined) updateData.notes = body.notes

      const { data, error } = await supabaseClient
        .from('important_dates')
        .update(updateData)
        .eq('id', id)
        .eq('church_id', userChurchId)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify(data),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // DELETE - 일정 삭제
    if (req.method === 'DELETE') {
      if (!id || id === 'important-dates' || isNaN(parseInt(id))) {
        return new Response(
          JSON.stringify({ error: 'ID가 필요합니다' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const { error } = await supabaseClient
        .from('important_dates')
        .delete()
        .eq('id', id)
        .eq('church_id', userChurchId)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: '지원하지 않는 메서드입니다' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
