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
    console.log('🔐 Permission Groups Edge Function 시작')

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Custom authentication
    const customToken = req.headers.get('X-Custom-Auth') || req.headers.get('Authorization')?.replace('Bearer ', '')

    if (!customToken || (!customToken.startsWith('temp_token_') && customToken !== 'temp_system_token')) {
      console.log('❌ 인증 실패')
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const body = req.method !== 'GET' ? await req.json() : {}

    console.log('📋 Action:', action)

    switch (action) {
      // 권한 그룹 목록 조회 (사용자 수 포함)
      case 'list': {
        const { church_id } = body

        // 권한 그룹 조회
        const { data: groups, error: groupsError } = await supabaseClient
          .from('permission_groups')
          .select('*')
          .eq('church_id', church_id)
          .order('code', { ascending: true })

        if (groupsError) throw groupsError

        // 각 그룹별 사용자 수 조회
        const enrichedGroups = await Promise.all(
          (groups || []).map(async (group) => {
            const { count } = await supabaseClient
              .from('user_permission_groups')
              .select('*', { count: 'exact', head: true })
              .eq('permission_group_id', group.id)

            return {
              ...group,
              user_count: count || 0
            }
          })
        )

        return new Response(
          JSON.stringify({ data: enrichedGroups }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 특정 권한 그룹 상세 조회
      case 'get': {
        const { id } = body

        const { data, error } = await supabaseClient
          .from('permission_groups')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 권한 그룹 생성
      case 'create': {
        const { church_id, code, category, name, description } = body

        const { data, error } = await supabaseClient
          .from('permission_groups')
          .insert({ church_id, code, category, name, description })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ data }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 권한 그룹 수정
      case 'update': {
        const { id, code, category, name, description } = body

        const { data, error } = await supabaseClient
          .from('permission_groups')
          .update({ code, category, name, description, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 권한 그룹 삭제
      case 'delete': {
        const { id } = body

        const { error } = await supabaseClient
          .from('permission_groups')
          .delete()
          .eq('id', id)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 시스템 메뉴 구조 조회 (2단계 계층)
      case 'get-menus': {
        const { data, error } = await supabaseClient
          .from('system_menus')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        if (error) throw error

        // 1Depth, 2Depth 구분하여 계층 구조로 변환
        const menus1Depth = data.filter(m => !m.parent_id)
        const menus2Depth = data.filter(m => m.parent_id)

        const hierarchicalMenus = menus1Depth.map(parent => ({
          ...parent,
          children: menus2Depth
            .filter(child => child.parent_id === parent.id)
            .sort((a, b) => a.display_order - b.display_order)
        }))

        return new Response(
          JSON.stringify({ data: hierarchicalMenus }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 권한 그룹의 메뉴 권한 조회
      case 'get-group-permissions': {
        const { permission_group_id } = body

        const { data, error } = await supabaseClient
          .from('permission_group_menus')
          .select(`
            *,
            menu:system_menus(*)
          `)
          .eq('permission_group_id', permission_group_id)

        if (error) throw error

        return new Response(
          JSON.stringify({ data: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 권한 그룹의 메뉴 권한 일괄 업데이트
      case 'update-permissions': {
        const { permission_group_id, permissions } = body

        // 기존 권한 삭제
        const { error: deleteError } = await supabaseClient
          .from('permission_group_menus')
          .delete()
          .eq('permission_group_id', permission_group_id)

        if (deleteError) throw deleteError

        // 새 권한 삽입 (사용여부가 true인 항목만)
        const validPermissions = permissions
          .filter((p: any) => p.can_use || p.can_create || p.can_edit || p.can_delete)
          .map((p: any) => ({
            permission_group_id,
            menu_id: p.menu_id,
            can_use: p.can_use || false,
            can_create: p.can_create || false,
            can_edit: p.can_edit || false,
            can_delete: p.can_delete || false
          }))

        if (validPermissions.length > 0) {
          const { data, error } = await supabaseClient
            .from('permission_group_menus')
            .insert(validPermissions)
            .select()

          if (error) throw error

          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ data: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 권한 그룹에 속한 사용자 조회
      case 'get-group-users': {
        const { permission_group_id } = body

        const { data, error } = await supabaseClient
          .from('user_permission_groups')
          .select(`
            id,
            user_id,
            assigned_at,
            assigned_by
          `)
          .eq('permission_group_id', permission_group_id)

        if (error) throw error

        // 사용자 정보 조회
        if (data && data.length > 0) {
          const userIds = data.map(upg => upg.user_id)
          const { data: users, error: usersError } = await supabaseClient
            .from('users')
            .select('id, email, full_name, username')
            .in('id', userIds)

          if (usersError) throw usersError

          // 사용자 정보와 권한 그룹 매핑 정보 결합
          const enrichedData = data.map(upg => {
            const user = users.find(u => u.id === upg.user_id)
            return {
              ...upg,
              user_email: user?.email,
              user_name: user?.full_name || user?.username,
            }
          })

          return new Response(
            JSON.stringify({ data: enrichedData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ data: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 권한 그룹에 사용자 추가
      case 'add-users': {
        const { permission_group_id, user_ids, assigned_by } = body

        const insertData = user_ids.map((user_id: string) => ({
          permission_group_id,
          user_id,
          assigned_by
        }))

        const { data, error } = await supabaseClient
          .from('user_permission_groups')
          .insert(insertData)
          .select()

        if (error) throw error

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 권한 그룹에서 사용자 제거
      case 'remove-users': {
        const { permission_group_id, user_ids } = body

        const { error } = await supabaseClient
          .from('user_permission_groups')
          .delete()
          .eq('permission_group_id', permission_group_id)
          .in('user_id', user_ids)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 교회의 모든 사용자 조회 (권한 그룹 할당용)
      case 'get-church-users': {
        const { church_id } = body

        const { data, error } = await supabaseClient
          .from('users')
          .select('id, email, full_name, username, role')
          .eq('church_id', church_id)
          .neq('role', 'member') // 일반 교인 제외
          .order('full_name', { ascending: true })

        if (error) throw error

        return new Response(
          JSON.stringify({ data: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 특정 사용자의 권한 조회 (모든 권한 그룹의 권한을 병합)
      case 'get-user-permissions': {
        const { user_id } = body

        // 1. 사용자가 속한 모든 권한 그룹 조회
        const { data: userGroups, error: userGroupsError } = await supabaseClient
          .from('user_permission_groups')
          .select('permission_group_id')
          .eq('user_id', user_id)

        if (userGroupsError) throw userGroupsError

        if (!userGroups || userGroups.length === 0) {
          return new Response(
            JSON.stringify({ data: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const groupIds = userGroups.map(ug => ug.permission_group_id)

        // 2. 해당 권한 그룹들의 모든 메뉴 권한 조회
        const { data: permissions, error: permissionsError } = await supabaseClient
          .from('permission_group_menus')
          .select(`
            menu_id,
            can_use,
            can_create,
            can_edit,
            can_delete,
            menu:system_menus(*)
          `)
          .in('permission_group_id', groupIds)

        if (permissionsError) throw permissionsError

        // 3. 메뉴별로 권한 병합 (OR 연산: 하나라도 true면 true)
        const mergedPermissions = new Map()

        permissions?.forEach(perm => {
          const menuId = perm.menu_id
          const existing = mergedPermissions.get(menuId)

          if (existing) {
            mergedPermissions.set(menuId, {
              ...existing,
              can_use: existing.can_use || perm.can_use,
              can_create: existing.can_create || perm.can_create,
              can_edit: existing.can_edit || perm.can_edit,
              can_delete: existing.can_delete || perm.can_delete
            })
          } else {
            mergedPermissions.set(menuId, {
              menu_id: perm.menu_id,
              can_use: perm.can_use,
              can_create: perm.can_create,
              can_edit: perm.can_edit,
              can_delete: perm.can_delete,
              menu: perm.menu
            })
          }
        })

        return new Response(
          JSON.stringify({ data: Array.from(mergedPermissions.values()) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
