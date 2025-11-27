// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Get user's church_id from token
    let userChurchId = null
    if (customToken.startsWith('temp_token_')) {
      const tokenParts = customToken.split('_')
      if (tokenParts.length >= 3) {
        const userId = parseInt(tokenParts[2])
        if (!isNaN(userId) && userId > 0) {
          // Get user's church_id
          const { data: userProfile } = await supabaseClient
            .from('users')
            .select('church_id')
            .eq('id', userId.toString())
            .single()

          userChurchId = userProfile?.church_id
          console.log('🏛️ User church lookup:', { userId, userChurchId })
        }
      }
    }

    if (!userChurchId) {
      return new Response(
        JSON.stringify({ error: '사용자의 교회 정보를 찾을 수 없습니다' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'GET') {
      // UTC+9 (한국 시간) 기준으로 오늘 날짜 계산
      const now = new Date()
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000))
      const today = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate())

      const todayMonth = today.getMonth() + 1
      const todayDay = today.getDate()
      const todayDateString = today.toISOString().split('T')[0]

      const threeDaysLater = new Date(today)
      threeDaysLater.setDate(today.getDate() + 3)

      // 1. 생일 조회 (오늘 + 다가오는 7일)
      const { data: allMembers, error: todayBirthdaysError } = await supabaseClient
        .from('members')
        .select(`
          id,
          name,
          phone,
          birthdate,
          position_main,
          position_detail,
          department,
          organization_id,
          church_organizations:organization_id (
            id,
            name
          )
        `)
        .eq('church_id', userChurchId)
        .not('birthdate', 'is', null)

      console.log('🎂 생일 조회:', {
        today: today.toISOString(),
        todayMonth,
        todayDay,
        totalMembers: allMembers?.length || 0,
        members: allMembers?.map(m => ({ name: m.name, birthdate: m.birthdate })),
        error: todayBirthdaysError
      })

      // 오늘 생일
      const todayBirthdayMembers = allMembers?.filter(member => {
        if (!member.birthdate) return false
        const birthDate = new Date(member.birthdate)
        const birthMonth = birthDate.getMonth() + 1
        const birthDay = birthDate.getDate()
        const isToday = birthMonth === todayMonth && birthDay === todayDay

        console.log('🎂 오늘 생일 체크:', {
          name: member.name,
          birthdate: member.birthdate,
          birthMonth,
          birthDay,
          todayMonth,
          todayDay,
          isToday
        })

        return isToday
      }) || []

      // 다가오는 생일 (7일 이내, 오늘 제외)
      const upcomingBirthdays = allMembers?.filter(member => {
        if (!member.birthdate) return false
        const birthDate = new Date(member.birthdate)
        const birthMonth = birthDate.getMonth() + 1
        const birthDay = birthDate.getDate()

        // 올해 생일 날짜 계산
        const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay)

        // 이미 지났으면 내년 생일로 계산
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1)
        }

        // 오늘 제외, 7일 이내
        const daysDiff = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const isUpcoming = daysDiff > 0 && daysDiff <= 7

        console.log('📅 다가오는 생일 체크:', {
          name: member.name,
          birthdate: member.birthdate,
          birthMonth,
          birthDay,
          thisYearBirthday: thisYearBirthday.toISOString(),
          daysDiff,
          isUpcoming
        })

        return isUpcoming
      }).map(member => {
        const birthDate = new Date(member.birthdate)
        const birthMonth = birthDate.getMonth() + 1
        const birthDay = birthDate.getDate()
        const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay)

        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1)
        }

        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        return {
          ...member,
          birthdate: member.birthdate,
          daysUntil
        }
      }).sort((a, b) => a.daysUntil - b.daysUntil) || []

      console.log('✅ 생일 결과:', {
        todayBirthdays: todayBirthdayMembers.length,
        upcomingBirthdays: upcomingBirthdays.length
      })

      // 2. 심방 일정 조회 (scheduled 또는 approved 상태)
      const { data: allPastoralCare, error: pastoralCareError } = await supabaseClient
        .from('pastoral_care_requests')
        .select(`
          id,
          requester_name,
          requester_phone,
          scheduled_date,
          scheduled_time,
          preferred_date,
          request_type,
          address,
          status,
          member_id,
          members:member_id (
            id,
            name,
            phone,
            position_main,
            position_detail,
            department,
            organization_id,
            church_organizations:organization_id (
              id,
              name
            )
          )
        `)
        .eq('church_id', userChurchId)
        .in('status', ['scheduled', 'approved'])

      console.log('🏠 심방 조회:', {
        total: allPastoralCare?.length || 0,
        items: allPastoralCare?.map(c => ({
          id: c.id,
          status: c.status,
          scheduled_date: c.scheduled_date,
          preferred_date: c.preferred_date,
          requester: c.requester_name
        })),
        error: pastoralCareError
      })

      // 심방 일정을 날짜별로 필터링 (scheduled_date 우선, 없으면 preferred_date 사용)
      const filteredPastoralCare = allPastoralCare?.filter(care => {
        const careDate = care.scheduled_date || care.preferred_date
        if (!careDate) return false

        const careDateObj = new Date(careDate)
        const todayObj = new Date(todayDateString)
        const threeDaysObj = new Date(threeDaysLater.toISOString().split('T')[0])

        return careDateObj >= todayObj && careDateObj <= threeDaysObj
      }) || []

      console.log('🏠 필터링된 심방:', {
        total: filteredPastoralCare.length,
        items: filteredPastoralCare.map(c => ({
          id: c.id,
          date: c.scheduled_date || c.preferred_date
        }))
      })

      // 오늘 심방
      const todayPastoralCare = filteredPastoralCare.filter(care => {
        const careDate = care.scheduled_date || care.preferred_date
        return careDate === todayDateString
      })

      // 다가오는 심방 (오늘 제외, 3일 이내)
      const upcomingPastoralCare = filteredPastoralCare.filter(care => {
        const careDate = care.scheduled_date || care.preferred_date
        return careDate > todayDateString
      })

      // 4. 중요 일정 조회 (완료되지 않은 모든 일정)
      const { data: importantDates, error: importantDatesError } = await supabaseClient
        .from('important_dates')
        .select(`
          id,
          title,
          event_type,
          event_date,
          notes,
          alert_days_before,
          member_id,
          enable_dday_alert,
          is_active,
          is_completed,
          members:member_id (
            id,
            name,
            phone
          )
        `)
        .eq('church_id', userChurchId)
        .eq('is_active', true)
        .eq('is_completed', false)
        .order('event_date', { ascending: true, nullsFirst: false })

      console.log('📅 중요 일정 조회 결과:', {
        total: importantDates?.length || 0,
        items: importantDates,
        error: importantDatesError
      })

      // 모든 미완료 일정을 표시 (날짜가 있으면 D-day 계산)
      const upcomingImportantDates = importantDates?.map(item => {
        // 날짜가 있는 경우 D-day 계산
        if (item.event_date) {
          const eventDate = new Date(item.event_date)

          // Invalid Date 체크
          if (!isNaN(eventDate.getTime())) {
            const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            return {
              ...item,
              daysUntil
            }
          }
        }

        // 날짜가 없거나 Invalid Date인 경우
        return item
      }) || []

      console.log('✅ 표시할 중요 일정:', upcomingImportantDates.length)

      const result = {
        todayBirthdays: todayBirthdayMembers,
        upcomingBirthdays,
        todayPastoralCare,
        upcomingPastoralCare,
        upcomingImportantDates,
        errors: {
          todayBirthdaysError: todayBirthdaysError?.message,
          pastoralCareError: pastoralCareError?.message,
          importantDatesError: importantDatesError?.message
        }
      }

      return new Response(
        JSON.stringify(result),
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
