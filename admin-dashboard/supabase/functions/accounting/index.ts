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
    console.log('🚀 Accounting Edge Function 시작')

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

    // Handle categories endpoints
    if (resource === 'categories' || pathParts.includes('categories')) {
      const categoryId = pathParts[pathParts.length - 1] !== 'categories' ? parseInt(pathParts[pathParts.length - 1]) : null

      // GET /accounting/admin/categories
      if (req.method === 'GET' && !categoryId) {
        const type = url.searchParams.get('type') // 'income' or 'expense'
        const isOffering = url.searchParams.get('is_offering') // 'true' or 'false'

        let query = supabaseClient
          .from('account_categories')
          .select('*')
          .eq('church_id', userChurchId)
          .order('display_order', { ascending: true })

        if (type) {
          query = query.eq('type', type)
        }

        if (isOffering !== null && isOffering !== undefined) {
          query = query.eq('is_offering', isOffering === 'true')
        }

        const { data, error } = await query

        if (error) {
          console.log('❌ 계정과목 조회 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 첫 사용시 템플릿 자동 복사
        if (data && data.length === 0 && userChurchId !== 0) {
          console.log('📋 계정과목이 없음. 템플릿 복사 시작...')

          // church_id = 0 템플릿 조회
          const { data: templateData, error: templateError } = await supabaseClient
            .from('account_categories')
            .select('*')
            .eq('church_id', 0)
            .order('id', { ascending: true })

          if (templateError || !templateData || templateData.length === 0) {
            console.log('❌ 템플릿 조회 실패:', templateError)
            // 템플릿이 없어도 빈 배열 반환 (에러는 아님)
            return new Response(
              JSON.stringify([]),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          console.log('✅ 템플릿 조회 성공:', templateData.length, '개')

          // parent_id 매핑을 위한 맵 (old_id -> new_id)
          const idMap = new Map()

          // 1단계: 부모 항목부터 삽입 (parent_id가 null인 항목들)
          const parentItems = templateData.filter(item => !item.parent_id)

          for (const item of parentItems) {
            const { data: insertedData, error: insertError } = await supabaseClient
              .from('account_categories')
              .insert({
                church_id: userChurchId,
                name: item.name,
                type: item.type,
                parent_id: null,
                is_active: item.is_active,
                is_offering: item.is_offering ?? false,
                display_order: item.display_order,
              })
              .select()
              .single()

            if (!insertError && insertedData) {
              idMap.set(item.id, insertedData.id)
              console.log(`✅ 부모 항목 복사: ${item.name} (${item.id} -> ${insertedData.id})`)
            }
          }

          // 2단계: 자식 항목 삽입 (parent_id가 있는 항목들)
          const childItems = templateData.filter(item => item.parent_id)

          for (const item of childItems) {
            const newParentId = idMap.get(item.parent_id)

            if (newParentId) {
              const { data: insertedData, error: insertError } = await supabaseClient
                .from('account_categories')
                .insert({
                  church_id: userChurchId,
                  name: item.name,
                  type: item.type,
                  parent_id: newParentId,
                  is_active: item.is_active,
                  is_offering: item.is_offering ?? false,
                  display_order: item.display_order,
                })
                .select()
                .single()

              if (!insertError && insertedData) {
                console.log(`✅ 자식 항목 복사: ${item.name} (부모: ${newParentId})`)
              }
            }
          }

          // 복사 완료 후 다시 조회
          const { data: newData, error: newError } = await supabaseClient
            .from('account_categories')
            .select('*')
            .eq('church_id', userChurchId)
            .order('display_order', { ascending: true })

          if (newError) {
            console.log('❌ 복사 후 재조회 오류:', newError)
            return new Response(
              JSON.stringify({ error: newError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          console.log('✅ 템플릿 복사 완료:', newData?.length, '개')
          return new Response(
            JSON.stringify(newData || []),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 계정과목 조회 성공:', data?.length)
        return new Response(
          JSON.stringify(data || []),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /accounting/admin/categories/:id/usage - 사용 여부 확인
      if (req.method === 'GET' && pathParts[pathParts.length - 1] === 'usage') {
        const categoryId = parseInt(pathParts[pathParts.length - 2])

        // 예산에서 사용 여부 확인 (금액이 0이 아닌 것만)
        const { count: budgetCount } = await supabaseClient
          .from('budgets')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', categoryId)
          .eq('church_id', userChurchId)
          .neq('budgeted_amount', 0)

        // 회계거래에서 사용 여부 확인 (금액이 0이 아닌 것만)
        const { count: transactionCount } = await supabaseClient
          .from('accounting_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', categoryId)
          .eq('church_id', userChurchId)
          .neq('amount', 0)

        // 헌금에서 사용 여부 확인 (간접 참조, 금액이 0이 아닌 것만)
        const { data: offeringData } = await supabaseClient
          .from('offerings')
          .select('id, accounting_transaction_id')
          .eq('church_id', userChurchId)
          .not('accounting_transaction_id', 'is', null)

        let offeringCount = 0
        if (offeringData && offeringData.length > 0) {
          const transactionIds = offeringData.map(o => o.accounting_transaction_id)
          const { count } = await supabaseClient
            .from('accounting_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', categoryId)
            .in('id', transactionIds)
            .neq('amount', 0)

          offeringCount = count || 0
        }

        console.log('✅ 계정과목 사용 여부 확인:', { categoryId, budgetCount, transactionCount, offeringCount })
        return new Response(
          JSON.stringify({
            budgetCount: budgetCount || 0,
            transactionCount: transactionCount || 0,
            offeringCount: offeringCount || 0,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /accounting/admin/categories/:id
      if (req.method === 'GET' && categoryId) {
        const { data, error } = await supabaseClient
          .from('account_categories')
          .select('*')
          .eq('id', categoryId)
          .eq('church_id', userChurchId)
          .single()

        if (error) {
          console.log('❌ 계정과목 조회 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 계정과목 조회 성공')
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /accounting/admin/categories
      if (req.method === 'POST') {
        const body = await req.json()

        const { data, error } = await supabaseClient
          .from('account_categories')
          .insert({
            church_id: userChurchId,
            name: body.name,
            type: body.type,
            parent_id: body.parent_id || null,
            is_active: body.is_active ?? true,
            is_offering: body.is_offering ?? false,
            display_order: body.display_order || 0,
          })
          .select()
          .single()

        if (error) {
          console.log('❌ 계정과목 생성 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 계정과목 생성 성공')
        return new Response(
          JSON.stringify(data),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // PUT /accounting/admin/categories/:id
      if (req.method === 'PUT' && categoryId) {
        const body = await req.json()

        const updateData: any = {}
        if (body.name !== undefined) updateData.name = body.name
        if (body.type !== undefined) updateData.type = body.type
        if (body.parent_id !== undefined) updateData.parent_id = body.parent_id
        if (body.is_active !== undefined) updateData.is_active = body.is_active
        if (body.is_offering !== undefined) updateData.is_offering = body.is_offering
        if (body.display_order !== undefined) updateData.display_order = body.display_order
        updateData.updated_at = new Date().toISOString()

        const { data, error } = await supabaseClient
          .from('account_categories')
          .update(updateData)
          .eq('id', categoryId)
          .eq('church_id', userChurchId)
          .select()
          .single()

        if (error) {
          console.log('❌ 계정과목 수정 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 계정과목 수정 성공')
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // DELETE /accounting/admin/categories/:id
      if (req.method === 'DELETE' && categoryId) {
        // 0. 헌금 상위 카테고리인지 확인
        const { data: categoryData } = await supabaseClient
          .from('account_categories')
          .select('name, parent_id')
          .eq('id', categoryId)
          .eq('church_id', userChurchId)
          .single()

        if (categoryData) {
          // 헌금 상위 카테고리만 삭제 방지 (하위 항목은 삭제 가능)
          if (categoryData.name === '헌금' && !categoryData.parent_id) {
            console.log('❌ 헌금 상위 카테고리는 삭제할 수 없습니다')
            return new Response(
              JSON.stringify({ error: '헌금 상위 카테고리는 삭제할 수 없습니다.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        // 1. 먼저 금액이 0인 예산 데이터 삭제
        const { error: budgetDeleteError } = await supabaseClient
          .from('budgets')
          .delete()
          .eq('category_id', categoryId)
          .eq('church_id', userChurchId)
          .eq('budgeted_amount', 0)

        if (budgetDeleteError) {
          console.log('⚠️ 예산 데이터 삭제 실패 (무시):', budgetDeleteError)
        }

        // 2. 금액이 0인 회계거래 데이터 삭제
        const { error: transactionDeleteError } = await supabaseClient
          .from('accounting_transactions')
          .delete()
          .eq('category_id', categoryId)
          .eq('church_id', userChurchId)
          .eq('amount', 0)

        if (transactionDeleteError) {
          console.log('⚠️ 회계거래 데이터 삭제 실패 (무시):', transactionDeleteError)
        }

        // 3. 계정과목 삭제
        const { error } = await supabaseClient
          .from('account_categories')
          .delete()
          .eq('id', categoryId)
          .eq('church_id', userChurchId)

        if (error) {
          console.log('❌ 계정과목 삭제 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 계정과목 삭제 성공')
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Handle transactions endpoints
    if (resource === 'transactions' || pathParts.includes('transactions')) {
      const transactionId = pathParts[pathParts.length - 1] !== 'transactions' && pathParts[pathParts.length - 1] !== 'summary'
        ? parseInt(pathParts[pathParts.length - 1])
        : null

      // GET /accounting/admin/transactions/summary
      if (req.method === 'GET' && pathParts[pathParts.length - 1] === 'summary') {
        const startDate = url.searchParams.get('start_date')
        const endDate = url.searchParams.get('end_date')
        const type = url.searchParams.get('type')

        let query = supabaseClient
          .from('accounting_transactions')
          .select('type, amount')
          .eq('church_id', userChurchId)

        if (startDate) query = query.gte('transaction_date', startDate)
        if (endDate) query = query.lte('transaction_date', endDate)
        if (type) query = query.eq('type', type)

        const { data, error } = await query

        if (error) {
          console.log('❌ 통계 조회 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const total_income = data?.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        const total_expense = data?.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        const income_count = data?.filter(t => t.type === 'income').length || 0
        const expense_count = data?.filter(t => t.type === 'expense').length || 0

        const summary = {
          total_income,
          total_expense,
          net: total_income - total_expense,
          income_count,
          expense_count,
        }

        console.log('✅ 통계 조회 성공:', summary)
        return new Response(
          JSON.stringify(summary),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /accounting/admin/transactions
      if (req.method === 'GET' && !transactionId) {
        const startDate = url.searchParams.get('start_date')
        const endDate = url.searchParams.get('end_date')
        const type = url.searchParams.get('type')
        const categoryId = url.searchParams.get('category_id')
        const keyword = url.searchParams.get('keyword')
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '50')

        let query = supabaseClient
          .from('accounting_transactions')
          .select(`
            *,
            category:account_categories(id, name, type)
          `, { count: 'exact' })
          .eq('church_id', userChurchId)

        if (startDate) query = query.gte('transaction_date', startDate)
        if (endDate) query = query.lte('transaction_date', endDate)
        if (type) query = query.eq('type', type)
        if (categoryId) query = query.eq('category_id', parseInt(categoryId))
        if (keyword) {
          query = query.or(`vendor_name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        }

        query = query
          .order('transaction_date', { ascending: false })
          .order('id', { ascending: false })
          .range((page - 1) * limit, page * limit - 1)

        const { data, error, count } = await query

        if (error) {
          console.log('❌ 거래 내역 조회 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 거래 내역 조회 성공:', data?.length)
        return new Response(
          JSON.stringify({
            data: data || [],
            total: count || 0,
            page,
            limit,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET /accounting/admin/transactions/:id
      if (req.method === 'GET' && transactionId) {
        const { data, error } = await supabaseClient
          .from('accounting_transactions')
          .select(`
            *,
            category:account_categories(id, name, type)
          `)
          .eq('id', transactionId)
          .eq('church_id', userChurchId)
          .single()

        if (error) {
          console.log('❌ 거래 조회 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 거래 조회 성공')
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // POST /accounting/admin/transactions
      if (req.method === 'POST') {
        const body = await req.json()

        const { data, error } = await supabaseClient
          .from('accounting_transactions')
          .insert({
            church_id: userChurchId,
            transaction_date: body.transaction_date,
            category_id: body.category_id,
            type: body.type,
            amount: body.amount,
            vendor_name: body.vendor_name || null,
            description: body.description,
            payment_method: body.payment_method || null,
            receipt_file: body.receipt_file || null,
            input_user_id: userId,
          })
          .select(`
            *,
            category:account_categories(id, name, type)
          `)
          .single()

        if (error) {
          console.log('❌ 거래 생성 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 거래 생성 성공')
        return new Response(
          JSON.stringify(data),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // PUT /accounting/admin/transactions/:id
      if (req.method === 'PUT' && transactionId) {
        const body = await req.json()

        const updateData: any = {}
        if (body.transaction_date !== undefined) updateData.transaction_date = body.transaction_date
        if (body.category_id !== undefined) updateData.category_id = body.category_id
        if (body.type !== undefined) updateData.type = body.type
        if (body.amount !== undefined) updateData.amount = body.amount
        if (body.vendor_name !== undefined) updateData.vendor_name = body.vendor_name
        if (body.description !== undefined) updateData.description = body.description
        if (body.payment_method !== undefined) updateData.payment_method = body.payment_method
        if (body.receipt_file !== undefined) updateData.receipt_file = body.receipt_file
        updateData.updated_at = new Date().toISOString()

        const { data, error } = await supabaseClient
          .from('accounting_transactions')
          .update(updateData)
          .eq('id', transactionId)
          .eq('church_id', userChurchId)
          .select(`
            *,
            category:account_categories(id, name, type)
          `)
          .single()

        if (error) {
          console.log('❌ 거래 수정 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 거래 수정 성공')
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // DELETE /accounting/admin/transactions/:id
      if (req.method === 'DELETE' && transactionId) {
        const { error } = await supabaseClient
          .from('accounting_transactions')
          .delete()
          .eq('id', transactionId)
          .eq('church_id', userChurchId)

        if (error) {
          console.log('❌ 거래 삭제 오류:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ 거래 삭제 성공')
        return new Response(
          JSON.stringify({ success: true }),
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
