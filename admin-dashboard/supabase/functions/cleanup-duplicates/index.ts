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

    const duplicateNames = [
      '학생회헌금', '이자수입', '특별헌금', '주일학교헌금', '선교헌금',
      '주일헌금', '절기헌금-송구영신', '십일조', '감사헌금', '절기헌금-성탄절',
      '건축헌금', '구역헌금', '생일감사헌금', '절기헌금-맥추감사절', '기타수입', '일천번제헌금'
    ]

    if (action === 'check') {
      // 1. 중복 상태 확인
      const { data: allCategories, error: fetchError } = await supabaseClient
        .from('account_categories')
        .select('id, name, type, created_at')
        .eq('church_id', churchId)
        .eq('type', 'income')
        .in('name', duplicateNames)
        .order('name')
        .order('id')

      if (fetchError) {
        throw fetchError
      }

      // 그룹별로 정리
      const grouped = allCategories.reduce((acc: any, cat: any) => {
        if (!acc[cat.name]) {
          acc[cat.name] = []
        }
        acc[cat.name].push(cat)
        return acc
      }, {})

      const result = Object.entries(grouped).map(([name, cats]: [string, any]) => ({
        name,
        total: cats.length,
        keep: cats[0],
        delete: cats.slice(1)
      }))

      // accounting_transactions 참조 확인
      const allIds = allCategories.map((c: any) => c.id)
      const { data: transactions, error: txError } = await supabaseClient
        .from('accounting_transactions')
        .select('category_id')
        .in('category_id', allIds)

      if (txError) {
        throw txError
      }

      const txCounts = transactions.reduce((acc: any, tx: any) => {
        acc[tx.category_id] = (acc[tx.category_id] || 0) + 1
        return acc
      }, {})

      return new Response(
        JSON.stringify({
          duplicates: result,
          transaction_references: txCounts,
          total_to_delete: allCategories.length - Object.keys(grouped).length
        }, null, 2),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'cleanup' && req.method === 'POST') {
      const results = {
        updated_transactions: 0,
        deleted_categories: 0,
        errors: [] as string[]
      }

      // 각 중복 그룹 처리
      for (const name of duplicateNames) {
        const { data: categories, error: fetchError } = await supabaseClient
          .from('account_categories')
          .select('id, name, created_at')
          .eq('church_id', churchId)
          .eq('type', 'income')
          .eq('name', name)
          .order('id')

        if (fetchError) {
          results.errors.push(`${name}: ${fetchError.message}`)
          continue
        }

        if (categories.length <= 1) {
          continue // 중복 없음
        }

        const keepId = categories[0].id
        const deleteIds = categories.slice(1).map(c => c.id)

        console.log(`Processing ${name}: keep=${keepId}, delete=${deleteIds.join(', ')}`)

        // 1. accounting_transactions 업데이트
        for (const deleteId of deleteIds) {
          const { error: updateError, count } = await supabaseClient
            .from('accounting_transactions')
            .update({ category_id: keepId })
            .eq('category_id', deleteId)

          if (updateError) {
            results.errors.push(`${name} (update tx): ${updateError.message}`)
          } else {
            results.updated_transactions += count || 0
            console.log(`  Updated ${count} transactions from ${deleteId} to ${keepId}`)
          }
        }

        // 2. 중복 레코드 삭제
        const { error: deleteError, count } = await supabaseClient
          .from('account_categories')
          .delete()
          .in('id', deleteIds)

        if (deleteError) {
          results.errors.push(`${name} (delete): ${deleteError.message}`)
        } else {
          results.deleted_categories += count || 0
          console.log(`  Deleted ${count} duplicate categories`)
        }
      }

      return new Response(
        JSON.stringify(results, null, 2),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use ?action=check or ?action=cleanup (POST)' }),
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
