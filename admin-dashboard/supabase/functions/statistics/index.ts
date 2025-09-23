import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
}

interface Database {
  public: {
    Tables: {
      attendances: {
        Row: {
          id: number
          member_id: number
          attendance_date: string
          attendance_type: string
          church_id: number
          created_at: string
        }
      }
      members: {
        Row: {
          id: number
          name: string
          email: string
          phone: string
          birth_date: string | null
          gender: string | null
          address: string | null
          church_id: number
          status: string
          created_at: string
        }
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') // 서비스 역할 키 사용

    console.log('🔧 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      keyPrefix: supabaseKey?.substring(0, 20)
    })

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const pathname = url.pathname
    const searchParams = url.searchParams

    // 커스텀 인증 헤더에서 토큰 추출 (다른 Edge Function과 동일한 패턴)
    const customAuthToken = req.headers.get('X-Custom-Auth')

    console.log('🔐 Auth check:', {
      hasCustomAuth: !!customAuthToken,
      customAuthPrefix: customAuthToken?.substring(0, 20)
    })

    // 사용자의 교회 ID 조회 (커스텀 토큰이 있는 경우)
    let churchId = null
    let userId = null

    if (customAuthToken) {
      try {
        // temp_token_{user_id}_{timestamp} 형식 파싱
        if (customAuthToken.startsWith('temp_token_')) {
          const tokenParts = customAuthToken.split('_')
          if (tokenParts.length >= 3) {
            userId = parseInt(tokenParts[2])

            console.log('🔐 Token parsed:', {
              fullToken: customAuthToken,
              userId: userId,
              isValidUserId: !isNaN(userId) && userId > 0
            })

            if (!isNaN(userId) && userId > 0) {
              // 사용자의 교회 ID 조회
              const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('church_id')
                .eq('id', userId.toString())
                .single()

              console.log('🏛️ User church lookup:', {
                userId: userId,
                churchId: userProfile?.church_id,
                profileError: profileError?.message
              })

              churchId = userProfile?.church_id
            }
          }
        } else {
          console.log('⚠️ 토큰 형식이 temp_token 형식이 아님:', customAuthToken?.substring(0, 20))
        }
      } catch (error) {
        console.log('⚠️ 토큰 파싱 또는 사용자 조회 실패:', error.message)
      }
    }

    console.log('📊 Statistics request:', {
      pathname,
      searchParams: Object.fromEntries(searchParams),
      churchId
    })

    // 출석 통계 요약
    if (pathname.includes('/attendance/summary')) {
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')
      const attendanceType = searchParams.get('attendance_type') || '주일예배'

      console.log('📈 Fetching attendance summary:', { startDate, endDate, attendanceType })

      // 출석 데이터 조회 (교회 ID 필터 포함)
      let attendanceQuery = supabase
        .from('attendances')
        .select('*')
        .gte('attendance_date', startDate || '2024-01-01')
        .lte('attendance_date', endDate || new Date().toISOString().split('T')[0])
        .eq('attendance_type', attendanceType)

      // 교회 ID 필터 추가 (슈퍼어드민이 아닌 경우에만)
      if (churchId && churchId !== 0) {
        attendanceQuery = attendanceQuery.eq('church_id', churchId)
      }

      const { data: attendances, error: attendanceError } = await attendanceQuery

      console.log('📊 Attendance query result:', {
        count: attendances?.length || 0,
        error: attendanceError?.message,
        params: { startDate, endDate, attendanceType }
      })

      // 에러가 있어도 기본 데이터로 계속 진행
      const attendanceData = attendances || []

      // 전체 교인 수 조회 (교회 ID 필터 포함)
      let memberQuery = supabase
        .from('members')
        .select('id')
        .eq('status', 'active')

      // 교회 ID 필터 추가 (슈퍼어드민이 아닌 경우에만)
      if (churchId && churchId !== 0) {
        memberQuery = memberQuery.eq('church_id', churchId)
      }

      const { data: allMembers, error: memberError } = await memberQuery

      console.log('👥 Members query result:', {
        count: allMembers?.length || 0,
        error: memberError?.message
      })

      // 에러가 있어도 기본값으로 계속 진행
      const totalMembers = allMembers?.length || 0
      const totalAttendances = attendanceData?.length || 0
      const averageAttendance = totalAttendances
      const averageAttendanceRate = totalMembers > 0 ? (averageAttendance / totalMembers) * 100 : 0

      // 날짜별 출석 데이터 집계
      const attendanceByDate = attendanceData?.reduce((acc: any, curr: any) => {
        const date = curr.attendance_date
        if (!acc[date]) {
          acc[date] = 0
        }
        acc[date]++
        return acc
      }, {}) || {}

      const attendanceDataFormatted = Object.entries(attendanceByDate).map(([date, count]) => ({
        date,
        count,
        attendance_type: attendanceType
      }))

      const result = {
        summary: {
          total_members: totalMembers,
          average_attendance: Math.round(averageAttendance),
          average_attendance_rate: Math.round(averageAttendanceRate * 100) / 100,
          period: {
            start_date: startDate,
            end_date: endDate
          }
        },
        attendance_data: attendanceDataFormatted
      }

      console.log('✅ Attendance summary result:', result)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 교인 인구통계
    if (pathname.includes('/members/demographics')) {
      console.log('📊 Fetching member demographics')

      // 교인 데이터 조회 (교회 ID 필터 포함)
      let membersQuery = supabase
        .from('members')
        .select('gender, birth_date')
        .eq('status', 'active')

      // 교회 ID 필터 추가 (슈퍼어드민이 아닌 경우에만)
      if (churchId && churchId !== 0) {
        membersQuery = membersQuery.eq('church_id', churchId)
      }

      const { data: members, error } = await membersQuery

      console.log('👥 Demographics query result:', {
        count: members?.length || 0,
        error: error?.message
      })

      // 에러가 있어도 빈 배열로 계속 진행
      const membersData = members || []

      // 성별 통계
      const genderStats = membersData?.reduce((acc: any, member: any) => {
        const gender = member.gender || '미상'
        acc[gender] = (acc[gender] || 0) + 1
        return acc
      }, {}) || {}

      // 연령대 통계
      const ageGroups = {
        '10대 이하': 0,
        '20대': 0,
        '30대': 0,
        '40대': 0,
        '50대': 0,
        '60대 이상': 0,
        '미상': 0
      }

      membersData?.forEach((member: any) => {
        if (!member.birth_date) {
          ageGroups['미상']++
          return
        }

        const birthYear = new Date(member.birth_date).getFullYear()
        const currentYear = new Date().getFullYear()
        const age = currentYear - birthYear

        if (age <= 19) ageGroups['10대 이하']++
        else if (age <= 29) ageGroups['20대']++
        else if (age <= 39) ageGroups['30대']++
        else if (age <= 49) ageGroups['40대']++
        else if (age <= 59) ageGroups['50대']++
        else ageGroups['60대 이상']++
      })

      const result = {
        gender_distribution: Object.entries(genderStats).map(([gender, count]) => ({
          gender,
          count,
          percentage: Math.round(((count as number) / (membersData?.length || 1)) * 100 * 100) / 100
        })),
        age_distribution: Object.entries(ageGroups).map(([age_group, count]) => ({
          age_group,
          count,
          percentage: Math.round(((count as number) / (membersData?.length || 1)) * 100 * 100) / 100
        })),
        total_members: membersData?.length || 0
      }

      console.log('✅ Demographics result:', result)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 교인 증가 통계
    if (pathname.includes('/members/growth')) {
      const months = parseInt(searchParams.get('months') || '12')

      console.log('📈 Fetching member growth:', { months })

      // 교인 데이터 조회 (교회 ID 필터 포함)
      let membersQuery = supabase
        .from('members')
        .select('created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      // 교회 ID 필터 추가 (슈퍼어드민이 아닌 경우에만)
      if (churchId && churchId !== 0) {
        membersQuery = membersQuery.eq('church_id', churchId)
      }

      const { data: members, error } = await membersQuery

      console.log('📈 Growth query result:', {
        count: members?.length || 0,
        error: error?.message,
        months
      })

      // 에러가 있어도 빈 배열로 계속 진행
      const membersData = members || []

      // 월별 등록 교인 수 집계
      const monthlyGrowth: any = {}
      const endDate = new Date()

      // 지난 N개월 동안의 데이터 생성
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthlyGrowth[yearMonth] = 0
      }

      // 실제 등록 데이터 집계
      membersData?.forEach((member: any) => {
        const createdDate = new Date(member.created_at)
        const yearMonth = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`

        if (monthlyGrowth[yearMonth] !== undefined) {
          monthlyGrowth[yearMonth]++
        }
      })

      // 누적 교인 수 계산
      let cumulativeCount = 0
      const growthData = Object.entries(monthlyGrowth).map(([month, newMembers]) => {
        cumulativeCount += newMembers as number
        return {
          month,
          new_members: newMembers,
          total_members: cumulativeCount,
          growth_rate: cumulativeCount > 0 ? Math.round(((newMembers as number) / cumulativeCount) * 100 * 100) / 100 : 0
        }
      })

      const result = {
        growth_data: growthData,
        total_current_members: membersData?.length || 0,
        period_months: months
      }

      console.log('✅ Member growth result:', result)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Statistics function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})