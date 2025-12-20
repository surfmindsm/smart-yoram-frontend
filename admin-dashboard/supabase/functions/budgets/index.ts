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
    console.log('🚀 Budgets Edge Function 시작')

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('✅ Supabase 클라이언트 초기화 완료')

    // Custom authentication
    const customToken = req.headers.get('X-Custom-Auth') || req.headers.get('Authorization')?.replace('Bearer ', '')
    console.log('🔍 인증 토큰 확인:', customToken ? customToken.substring(0, 20) + '...' : 'None')

    if (!customToken) {
      console.log('❌ 인증 토큰이 없습니다')
      return new Response(
        JSON.stringify({ error: 'Missing authentication' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)
    console.log('🔍 URL 파싱:', { pathname: url.pathname, pathParts, method: req.method })

    // Extract user info from token
    let userId = 0
    let userChurchId = 9998

    if (customToken.startsWith('temp_token_')) {
      const tokenParts = customToken.split('_')
      userId = parseInt(tokenParts[2])

      // Get user's church_id
      const { data: userData } = await supabaseClient
        .from('users')
        .select('church_id')
        .eq('id', userId)
        .single()

      if (userData?.church_id) {
        userChurchId = userData.church_id
      }
    }

    console.log('👤 사용자 정보:', { userId, userChurchId })

    // Route handler
    const resource = pathParts[pathParts.length - 1] === 'admin' ? pathParts[pathParts.length - 2] : pathParts[pathParts.length - 1]
    const isAdmin = pathParts.includes('admin')

    console.log('🔍 리소스:', { resource, isAdmin })

    // Handle budgets endpoints
    if (resource === 'budgets' || pathParts.includes('budgets')) {
      const lastPart = pathParts[pathParts.length - 1]
      const budgetId = !isNaN(parseInt(lastPart)) ? parseInt(lastPart) : null

      // POST /budgets/admin/budgets/copy-previous-year
      if (req.method === 'POST' && lastPart === 'copy-previous-year') {
        const body = await req.json()
        const fromYear = body.from_year
        const toYear = body.to_year

        if (!fromYear || !toYear) {
          return new Response(
            JSON.stringify({ error: '복사할 연도와 대상 연도를 지정해주세요.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 기존 대상 연도 예산 삭제
        await supabaseClient
          .from('budgets')
          .delete()
          .eq('church_id', userChurchId)
          .eq('year', toYear)

        // 이전 연도 예산 조회
        const { data: previousBudgets, error: fetchError } = await supabaseClient
          .from('budgets')
          .select('*')
          .eq('church_id', userChurchId)
          .eq('year', fromYear)

        if (fetchError) {
          console.log('❌ 이전 연도 예산 조회 오류:', fetchError)
          return new Response(
            JSON.stringify({ error: fetchError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!previousBudgets || previousBudgets.length === 0) {
          return new Response(
            JSON.stringify({ error: '복사할 예산이 없습니다.' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 새로운 연도로 복사
        const newBudgets = previousBudgets.map(b => ({
          church_id: userChurchId,
          year: toYear,
          month: b.month,
          category_id: b.category_id,
          type: b.type,
          budgeted_amount: b.budgeted_amount,
          notes: b.notes,
          created_by: userId,
        }))

        const { data, error } = await supabaseClient
          .from('budgets')
          .insert(newBudgets)
          .select()

        if (error) {
          console.log('❌ 예산 복사 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 예산 복사 성공:', data?.length)
        return new Response(
          JSON.stringify({ success: true, count: data?.length || 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /budgets/admin/budgets/vs-actual
      if (req.method === 'GET' && lastPart === 'vs-actual') {
        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())
        const month = url.searchParams.get('month') ? parseInt(url.searchParams.get('month')!) : null
        const type = url.searchParams.get('type') // 'income' or 'expense'

        // 예산 조회
        let budgetQuery = supabaseClient
          .from('budgets')
          .select(`
            *,
            category:account_categories(id, name, type)
          `)
          .eq('church_id', userChurchId)
          .eq('year', year)

        if (month) {
          budgetQuery = budgetQuery.eq('month', month)
        } else {
          budgetQuery = budgetQuery.is('month', null) // 연간 예산만
        }

        if (type) {
          budgetQuery = budgetQuery.eq('type', type)
        }

        const { data: budgets, error: budgetError } = await budgetQuery

        if (budgetError) {
          console.log('❌ 예산 조회 오류:', budgetError)
          return new Response(
            JSON.stringify({ error: budgetError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 실적 조회 (해당 연도의 거래 내역)
        let actualQuery = supabaseClient
          .from('accounting_transactions')
          .select('category_id, type, amount')
          .eq('church_id', userChurchId)
          .gte('transaction_date', `${year}-01-01`)
          .lte('transaction_date', `${year}-12-31`)

        if (month) {
          const monthStr = month.toString().padStart(2, '0')
          actualQuery = actualQuery
            .gte('transaction_date', `${year}-${monthStr}-01`)
            .lte('transaction_date', `${year}-${monthStr}-31`)
        }

        if (type) {
          actualQuery = actualQuery.eq('type', type)
        }

        const { data: actuals, error: actualError } = await actualQuery

        if (actualError) {
          console.log('❌ 실적 조회 오류:', actualError)
          return new Response(
            JSON.stringify({ error: actualError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 카테고리별 실적 집계
        const actualByCategory = actuals?.reduce((acc, item) => {
          const key = `${item.category_id}_${item.type}`
          if (!acc[key]) {
            acc[key] = {
              category_id: item.category_id,
              type: item.type,
              amount: 0
            }
          }
          acc[key].amount += parseFloat(item.amount)
          return acc
        }, {} as Record<string, { category_id: number, type: string, amount: number }>) || {}

        // 예산과 실적 비교
        const comparison = budgets?.map(budget => {
          const key = `${budget.category_id}_${budget.type}`
          const actualAmount = actualByCategory[key]?.amount || 0
          const budgetAmount = parseFloat(budget.budgeted_amount)
          const difference = actualAmount - budgetAmount
          const executionRate = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : (actualAmount > 0 ? 999.9 : 0)

          return {
            ...budget,
            actual_amount: actualAmount,
            difference,
            execution_rate: executionRate,
          }
        }) || []

        // 예산이 없는데 거래가 있는 카테고리 추가 (예산 0으로)
        for (const key in actualByCategory) {
          const actual = actualByCategory[key]
          const existsInBudget = comparison.some(c => c.category_id === actual.category_id && c.type === actual.type)

          if (!existsInBudget) {
            // 카테고리 정보 조회
            const { data: categoryData } = await supabaseClient
              .from('account_categories')
              .select('id, name, type')
              .eq('id', actual.category_id)
              .single()

            if (categoryData) {
              comparison.push({
                id: 0,
                church_id: userChurchId,
                year,
                month: month || null,
                category_id: actual.category_id,
                type: actual.type as 'income' | 'expense',
                budgeted_amount: 0,
                notes: null,
                created_by: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                category: categoryData,
                actual_amount: actual.amount,
                difference: actual.amount,
                execution_rate: 999.9, // 예산이 0인데 실적이 있으면 999.9%
              })
            }
          }
        }

        // 전체 요약
        const totalBudgetIncome = comparison.filter(c => c.type === 'income').reduce((sum, c) => sum + parseFloat(c.budgeted_amount), 0)
        const totalBudgetExpense = comparison.filter(c => c.type === 'expense').reduce((sum, c) => sum + parseFloat(c.budgeted_amount), 0)
        const totalActualIncome = comparison.filter(c => c.type === 'income').reduce((sum, c) => sum + c.actual_amount, 0)
        const totalActualExpense = comparison.filter(c => c.type === 'expense').reduce((sum, c) => sum + c.actual_amount, 0)

        const summary = {
          budget: {
            income: totalBudgetIncome,
            expense: totalBudgetExpense,
            net: totalBudgetIncome - totalBudgetExpense,
          },
          actual: {
            income: totalActualIncome,
            expense: totalActualExpense,
            net: totalActualIncome - totalActualExpense,
          },
          execution_rate: {
            income: totalBudgetIncome > 0 ? (totalActualIncome / totalBudgetIncome) * 100 : 0,
            expense: totalBudgetExpense > 0 ? (totalActualExpense / totalBudgetExpense) * 100 : 0,
          }
        }

        console.log('✅ 예산 대비 실적 조회 성공')
        return new Response(
          JSON.stringify({
            comparison,
            summary,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /budgets/admin/budgets/:id/adjust
      if (req.method === 'POST' && budgetId && pathParts[pathParts.length - 2] !== 'budgets') {
        const body = await req.json()

        // 현재 예산 조회
        const { data: currentBudget, error: fetchError } = await supabaseClient
          .from('budgets')
          .select('*')
          .eq('id', budgetId)
          .eq('church_id', userChurchId)
          .single()

        if (fetchError || !currentBudget) {
          return new Response(
            JSON.stringify({ error: '예산을 찾을 수 없습니다.' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 조정 이력 저장
        const { error: historyError } = await supabaseClient
          .from('budget_adjustments')
          .insert({
            budget_id: budgetId,
            previous_amount: currentBudget.budgeted_amount,
            new_amount: body.new_amount,
            reason: body.reason || null,
            adjusted_by: userId,
          })

        if (historyError) {
          console.log('❌ 조정 이력 저장 오류:', historyError)
          return new Response(
            JSON.stringify({ error: historyError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 예산 업데이트
        const { data, error } = await supabaseClient
          .from('budgets')
          .update({
            budgeted_amount: body.new_amount,
            notes: body.notes || currentBudget.notes,
          })
          .eq('id', budgetId)
          .eq('church_id', userChurchId)
          .select()
          .single()

        if (error) {
          console.log('❌ 예산 조정 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 예산 조정 성공')
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /budgets/admin/budgets
      if (req.method === 'GET' && !budgetId) {
        const year = url.searchParams.get('year')
        const month = url.searchParams.get('month')
        const type = url.searchParams.get('type')

        let query = supabaseClient
          .from('budgets')
          .select(`
            *,
            category:account_categories(id, name, type)
          `)
          .eq('church_id', userChurchId)
          .order('year', { ascending: false })
          .order('type', { ascending: true })

        if (year) query = query.eq('year', parseInt(year))
        if (month) {
          query = query.eq('month', parseInt(month))
        }
        if (type) query = query.eq('type', type)

        const { data, error } = await query

        if (error) {
          console.log('❌ 예산 조회 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 예산 조회 성공:', data?.length)
        return new Response(
          JSON.stringify(data || []),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /budgets/admin/budgets/:id
      if (req.method === 'GET' && budgetId) {
        const { data, error } = await supabaseClient
          .from('budgets')
          .select(`
            *,
            category:account_categories(id, name, type)
          `)
          .eq('id', budgetId)
          .eq('church_id', userChurchId)
          .single()

        if (error) {
          console.log('❌ 예산 조회 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 예산 조회 성공')
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /budgets/admin/budgets/upsert
      if (req.method === 'POST' && lastPart === 'upsert') {
        const body = await req.json()

        // 배치 처리 지원 (배열로 받으면 여러 개 처리)
        const budgets = Array.isArray(body) ? body : [body]

        if (budgets.length === 0) {
          return new Response(
            JSON.stringify({ error: '저장할 예산이 없습니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 첫 번째 예산의 year와 month 추출 (모두 동일하다고 가정)
        const year = budgets[0].year
        const month = budgets[0].month || null

        console.log(`🗑️ 기존 예산 삭제 시작: church_id=${userChurchId}, year=${year}, month=${month}`)

        // 1. 기존 예산 삭제 (해당 연도/월의 모든 예산)
        let deleteQuery = supabaseClient
          .from('budgets')
          .delete()
          .eq('church_id', userChurchId)
          .eq('year', year)

        if (month !== null) {
          deleteQuery = deleteQuery.eq('month', month)
        } else {
          deleteQuery = deleteQuery.is('month', null)
        }

        const { error: deleteError } = await deleteQuery

        if (deleteError) {
          console.log('❌ 기존 예산 삭제 오류:', deleteError)
          return new Response(
            JSON.stringify({ error: `기존 예산 삭제 실패: ${deleteError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 기존 예산 삭제 완료')

        // 2. 새 예산 INSERT
        const insertData = budgets.map(b => ({
          church_id: userChurchId,
          year: b.year,
          month: b.month || null,
          category_id: b.category_id,
          type: b.type,
          budgeted_amount: b.budgeted_amount,
          notes: b.notes || null,
          created_by: userId,
        }))

        const { data, error } = await supabaseClient
          .from('budgets')
          .insert(insertData)
          .select(`
            *,
            category:account_categories(id, name, type)
          `)

        if (error) {
          console.log('❌ 예산 INSERT 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 예산 저장 성공:', data?.length)
        return new Response(
          JSON.stringify(Array.isArray(body) ? data : data?.[0]),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /budgets/admin/budgets
      if (req.method === 'POST' && lastPart === 'budgets') {
        const body = await req.json()

        // 배치 생성 지원 (배열로 받으면 여러 개 생성)
        const budgets = Array.isArray(body) ? body : [body]

        const insertData = budgets.map(b => ({
          church_id: userChurchId,
          year: b.year,
          month: b.month || null,
          category_id: b.category_id,
          type: b.type,
          budgeted_amount: b.budgeted_amount,
          notes: b.notes || null,
          created_by: userId,
        }))

        const { data, error } = await supabaseClient
          .from('budgets')
          .insert(insertData)
          .select(`
            *,
            category:account_categories(id, name, type)
          `)

        if (error) {
          console.log('❌ 예산 생성 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 예산 생성 성공')
        return new Response(
          JSON.stringify(Array.isArray(body) ? data : data?.[0]),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // PUT /budgets/admin/budgets/:id
      if (req.method === 'PUT' && budgetId) {
        const body = await req.json()

        const updateData: any = {}
        if (body.year !== undefined) updateData.year = body.year
        if (body.month !== undefined) updateData.month = body.month
        if (body.category_id !== undefined) updateData.category_id = body.category_id
        if (body.type !== undefined) updateData.type = body.type
        if (body.budgeted_amount !== undefined) updateData.budgeted_amount = body.budgeted_amount
        if (body.notes !== undefined) updateData.notes = body.notes

        const { data, error } = await supabaseClient
          .from('budgets')
          .update(updateData)
          .eq('id', budgetId)
          .eq('church_id', userChurchId)
          .select(`
            *,
            category:account_categories(id, name, type)
          `)
          .single()

        if (error) {
          console.log('❌ 예산 수정 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 예산 수정 성공')
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // DELETE /budgets/admin/budgets/:id
      if (req.method === 'DELETE' && budgetId) {
        const { error } = await supabaseClient
          .from('budgets')
          .delete()
          .eq('id', budgetId)
          .eq('church_id', userChurchId)

        if (error) {
          console.log('❌ 예산 삭제 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 예산 삭제 성공')
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Handle adjustments endpoints
    if (pathParts.includes('adjustments')) {
      // GET /budgets/admin/adjustments
      if (req.method === 'GET') {
        const budgetId = url.searchParams.get('budget_id')

        let query = supabaseClient
          .from('budget_adjustments')
          .select(`
            *,
            budget:budgets(
              *,
              category:account_categories(id, name, type)
            )
          `)
          .order('adjusted_at', { ascending: false })

        if (budgetId) {
          query = query.eq('budget_id', parseInt(budgetId))
        }

        const { data, error } = await query

        if (error) {
          console.log('❌ 조정 이력 조회 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // church_id로 필터링 (budget의 church_id 확인)
        const filtered = data?.filter(item => item.budget?.church_id === userChurchId) || []

        console.log('✅ 조정 이력 조회 성공:', filtered.length)
        return new Response(
          JSON.stringify(filtered),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Unknown endpoint
    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
