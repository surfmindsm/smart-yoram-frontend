// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'check'
    const churchId = parseInt(url.searchParams.get('church_id') || '56')

    if (action === 'check') {
      // 현재 상태 확인만
      const results = {
        step1_create_category: { needed: false, details: null },
        step2_rename_fund_type: { needed: false, count: 0, offerings: [] },
        step3_create_accounting: { needed: false, count: 0, offerings: [] }
      }

      // Step 1: "연말감사헌금" 계정과목 확인
      const { data: existingCategory } = await supabaseClient
        .from('account_categories')
        .select('id, name, parent_id')
        .eq('church_id', churchId)
        .eq('name', '연말감사헌금')
        .maybeSingle()

      if (!existingCategory) {
        results.step1_create_category.needed = true
        results.step1_create_category.details = {
          name: '연말감사헌금',
          parent_id: 1924,
          type: 'income'
        }
      }

      // Step 2: "일천번제" 헌금 확인
      const { data: ilcheonOfferings } = await supabaseClient
        .from('offerings')
        .select('id, fund_type, amount, offered_on')
        .eq('church_id', churchId)
        .eq('fund_type', '일천번제')

      if (ilcheonOfferings && ilcheonOfferings.length > 0) {
        results.step2_rename_fund_type.needed = true
        results.step2_rename_fund_type.count = ilcheonOfferings.length
        results.step2_rename_fund_type.offerings = ilcheonOfferings
      }

      // Step 3: 회계 거래 없는 헌금 확인
      const { data: offeringsWithoutAccounting } = await supabaseClient
        .from('offerings')
        .select('id, fund_type, amount, offered_on, member_id')
        .eq('church_id', churchId)
        .is('accounting_transaction_id', null)

      if (offeringsWithoutAccounting && offeringsWithoutAccounting.length > 0) {
        results.step3_create_accounting.needed = true
        results.step3_create_accounting.count = offeringsWithoutAccounting.length
        results.step3_create_accounting.offerings = offeringsWithoutAccounting.map(o => ({
          id: o.id,
          fund_type: o.fund_type,
          amount: o.amount,
          offered_on: o.offered_on
        }))
      }

      return new Response(
        JSON.stringify(results, null, 2),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'migrate' && req.method === 'POST') {
      const results = {
        step1: { success: false, category_id: null, error: null },
        step2: { success: false, updated_count: 0, error: null },
        step3: { success: false, created_count: 0, errors: [] }
      }

      // Step 1: "연말감사헌금" 계정과목 생성
      const { data: existingCategory } = await supabaseClient
        .from('account_categories')
        .select('id')
        .eq('church_id', churchId)
        .eq('name', '연말감사헌금')
        .maybeSingle()

      if (!existingCategory) {
        const { data: newCategory, error: createError } = await supabaseClient
          .from('account_categories')
          .insert({
            church_id: churchId,
            name: '연말감사헌금',
            parent_id: 1924,
            type: 'income'
          })
          .select('id')
          .single()

        if (createError) {
          results.step1.error = createError.message
          console.error('Step 1 failed:', createError)
        } else {
          results.step1.success = true
          results.step1.category_id = newCategory.id
          console.log('✅ Step 1: Created 연말감사헌금 category:', newCategory.id)
        }
      } else {
        results.step1.success = true
        results.step1.category_id = existingCategory.id
        console.log('✅ Step 1: 연말감사헌금 already exists:', existingCategory.id)
      }

      // Step 2: "일천번제" → "일천번제헌금" 수정
      const { data: updatedOfferings, error: renameError } = await supabaseClient
        .from('offerings')
        .update({ fund_type: '일천번제헌금' })
        .eq('church_id', churchId)
        .eq('fund_type', '일천번제')
        .select('id')

      if (renameError) {
        results.step2.error = renameError.message
        console.error('Step 2 failed:', renameError)
      } else {
        results.step2.success = true
        results.step2.updated_count = updatedOfferings?.length || 0
        console.log(`✅ Step 2: Updated ${results.step2.updated_count} offerings`)
      }

      // Step 3: 회계 거래 생성
      const { data: offeringsWithoutAccounting } = await supabaseClient
        .from('offerings')
        .select('id, fund_type, amount, offered_on, member_id, input_user_id')
        .eq('church_id', churchId)
        .is('accounting_transaction_id', null)

      let createdCount = 0
      const errors = []

      for (const offering of offeringsWithoutAccounting || []) {
        try {
          // 계정과목 찾기
          const { data: category } = await supabaseClient
            .from('account_categories')
            .select('id')
            .eq('church_id', churchId)
            .eq('name', offering.fund_type)
            .eq('type', 'income')
            .limit(1)
            .maybeSingle()

          if (!category) {
            errors.push({ offering_id: offering.id, error: `계정과목 없음: ${offering.fund_type}` })
            continue
          }

          // 기부자 이름 조회
          let donorName = '무명'
          if (offering.member_id) {
            const { data: member } = await supabaseClient
              .from('members')
              .select('name')
              .eq('id', offering.member_id)
              .single()

            if (member) {
              donorName = member.name
            }
          }

          // 회계 거래 생성
          const { data: accountingTx, error: txError } = await supabaseClient
            .from('accounting_transactions')
            .insert({
              church_id: churchId,
              transaction_date: offering.offered_on,
              category_id: category.id,
              type: 'income',
              amount: offering.amount,
              description: `헌금 - ${donorName}`,
              payment_method: 'other',
              input_user_id: offering.input_user_id || 1
            })
            .select('id')
            .single()

          if (txError) {
            errors.push({ offering_id: offering.id, error: txError.message })
            continue
          }

          // offerings 테이블 업데이트
          const { error: updateError } = await supabaseClient
            .from('offerings')
            .update({ accounting_transaction_id: accountingTx.id })
            .eq('id', offering.id)

          if (updateError) {
            // 롤백: 생성한 회계 거래 삭제
            await supabaseClient
              .from('accounting_transactions')
              .delete()
              .eq('id', accountingTx.id)

            errors.push({ offering_id: offering.id, error: updateError.message })
            continue
          }

          createdCount++
          console.log(`✅ Created accounting for offering ${offering.id}`)

        } catch (error) {
          errors.push({ offering_id: offering.id, error: error.message })
        }
      }

      results.step3.success = errors.length === 0
      results.step3.created_count = createdCount
      results.step3.errors = errors

      console.log(`✅ Step 3: Created ${createdCount} accounting transactions, ${errors.length} errors`)

      return new Response(
        JSON.stringify(results, null, 2),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use ?action=check or ?action=migrate (POST)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
