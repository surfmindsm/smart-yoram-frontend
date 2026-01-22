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

    // 헌금이 아닌 기타 수입 항목 ID
    const nonOfferingIds = [768, 771, 773] // 기타수입, 이자수입, 기타

    if (action === 'check') {
      // 현재 상태 조회
      const { data: categories, error } = await supabaseClient
        .from('account_categories')
        .select('id, name, parent_id')
        .eq('church_id', churchId)
        .eq('type', 'income')
        .order('name')

      if (error) throw error

      const offeringParent = categories.find(c => c.id === 1924)
      const offeringChildren = categories.filter(c => c.parent_id === 1924)
      const orphanOfferings = categories.filter(c =>
        c.parent_id === null &&
        c.id !== 1924 &&
        !nonOfferingIds.includes(c.id)
      )

      return new Response(
        JSON.stringify({
          offering_parent: offeringParent,
          current_children_count: offeringChildren.length,
          current_children: offeringChildren.map(c => ({ id: c.id, name: c.name })),
          orphan_offerings_count: orphanOfferings.length,
          orphan_offerings: orphanOfferings.map(c => ({ id: c.id, name: c.name })),
          non_offering_items: categories
            .filter(c => nonOfferingIds.includes(c.id))
            .map(c => ({ id: c.id, name: c.name }))
        }, null, 2),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'reorganize' && req.method === 'POST') {
      const results = {
        updated_count: 0,
        updated_items: [] as any[],
        errors: [] as string[]
      }

      // 모든 헌금 항목 조회 (parent_id가 null이고, 헌금이 아닌 수입 항목 제외)
      const { data: categories, error: fetchError } = await supabaseClient
        .from('account_categories')
        .select('id, name, parent_id')
        .eq('church_id', churchId)
        .eq('type', 'income')
        .is('parent_id', null)

      if (fetchError) {
        throw fetchError
      }

      // 업데이트할 항목들 필터링
      const toUpdate = categories.filter(c =>
        c.id !== 1924 && // 헌금 부모 카테고리 자체 제외
        !nonOfferingIds.includes(c.id) // 기타수입, 이자수입, 기타 제외
      )

      console.log(`Total items to update: ${toUpdate.length}`)

      // 각 항목의 parent_id를 1924로 업데이트
      for (const item of toUpdate) {
        const { error: updateError } = await supabaseClient
          .from('account_categories')
          .update({ parent_id: 1924 })
          .eq('id', item.id)

        if (updateError) {
          results.errors.push(`${item.name} (ID: ${item.id}): ${updateError.message}`)
          console.error(`Failed to update ${item.name}:`, updateError)
        } else {
          results.updated_count++
          results.updated_items.push({ id: item.id, name: item.name })
          console.log(`✅ Updated ${item.name} (ID: ${item.id})`)
        }
      }

      // 최종 상태 확인
      const { data: finalState } = await supabaseClient
        .from('account_categories')
        .select('id, name, parent_id')
        .eq('church_id', churchId)
        .eq('type', 'income')
        .eq('parent_id', 1924)

      results['final_children_count'] = finalState?.length || 0

      return new Response(
        JSON.stringify(results, null, 2),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use ?action=check or ?action=reorganize (POST)' }),
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
