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
    const churchId = parseInt(url.searchParams.get('church_id') || '56')

    // 1. 헌금 데이터 조회
    const { data: offerings, error: offeringsError } = await supabaseClient
      .from('offerings')
      .select('id, fund_type, amount, offered_on, accounting_transaction_id')
      .eq('church_id', churchId)
      .order('offered_on', { ascending: false })

    if (offeringsError) throw offeringsError

    // 2. fund_type별 통계
    const fundTypeStats = offerings.reduce((acc: any, o: any) => {
      if (!acc[o.fund_type]) {
        acc[o.fund_type] = {
          count: 0,
          total_amount: 0,
          with_accounting: 0,
          without_accounting: 0
        }
      }
      acc[o.fund_type].count++
      acc[o.fund_type].total_amount += parseFloat(o.amount || 0)
      if (o.accounting_transaction_id) {
        acc[o.fund_type].with_accounting++
      } else {
        acc[o.fund_type].without_accounting++
      }
      return acc
    }, {})

    // 3. accounting_transaction_id가 있는 헌금의 회계 거래 정보 조회
    const offeringsWithAccounting = offerings.filter(o => o.accounting_transaction_id)
    const accountingIds = offeringsWithAccounting.map(o => o.accounting_transaction_id)

    let accountingTransactions = []
    if (accountingIds.length > 0) {
      const { data: txData, error: txError } = await supabaseClient
        .from('accounting_transactions')
        .select('id, category_id, amount, description, account_categories(id, name, parent_id)')
        .in('id', accountingIds)

      if (txError) throw txError
      accountingTransactions = txData || []
    }

    // 4. 각 헌금 유형에 해당하는 계정과목 조회
    const fundTypes = Object.keys(fundTypeStats)
    const { data: categories, error: catError } = await supabaseClient
      .from('account_categories')
      .select('id, name, parent_id')
      .eq('church_id', churchId)
      .eq('type', 'income')
      .in('name', fundTypes)

    if (catError) throw catError

    // 5. 매칭 분석
    const categoryMap = categories.reduce((acc: any, c: any) => {
      acc[c.name] = c
      return acc
    }, {})

    const matchingAnalysis = fundTypes.map(fundType => {
      const category = categoryMap[fundType]
      return {
        fund_type: fundType,
        stats: fundTypeStats[fundType],
        category_exists: !!category,
        category_info: category ? {
          id: category.id,
          parent_id: category.parent_id,
          is_under_offering: category.parent_id === 1924
        } : null
      }
    })

    // 6. 회계 거래 연결 상태 분석
    const accountingAnalysis = accountingTransactions.map((tx: any) => {
      const offering = offeringsWithAccounting.find(o => o.accounting_transaction_id === tx.id)
      return {
        offering_id: offering?.id,
        fund_type: offering?.fund_type,
        accounting_tx_id: tx.id,
        category_id: tx.category_id,
        category_name: tx.account_categories?.name,
        category_parent_id: tx.account_categories?.parent_id,
        is_under_offering: tx.account_categories?.parent_id === 1924,
        matches_fund_type: tx.account_categories?.name === offering?.fund_type
      }
    })

    return new Response(
      JSON.stringify({
        summary: {
          total_offerings: offerings.length,
          with_accounting: offeringsWithAccounting.length,
          without_accounting: offerings.length - offeringsWithAccounting.length,
          unique_fund_types: fundTypes.length
        },
        fund_type_stats: fundTypeStats,
        matching_analysis: matchingAnalysis,
        accounting_analysis: accountingAnalysis,
        migration_needed: {
          categories_not_under_offering: matchingAnalysis.filter(m => m.category_exists && !m.category_info?.is_under_offering),
          offerings_without_accounting: offerings.length - offeringsWithAccounting.length,
          mismatched_categories: accountingAnalysis.filter(a => !a.matches_fund_type || !a.is_under_offering)
        }
      }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
