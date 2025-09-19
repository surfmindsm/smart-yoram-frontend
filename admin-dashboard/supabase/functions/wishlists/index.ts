import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, temp-token',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

serve(async (req) => {
  // CORS 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const url = new URL(req.url)
    const method = req.method

    // 임시 토큰에서 사용자 정보 추출
    const tempToken = req.headers.get('temp-token')
    if (!tempToken || !tempToken.startsWith('temp_token_')) {
      throw new Error('유효하지 않은 인증 토큰입니다.')
    }

    const [, , userId, ] = tempToken.split('_')
    const userIdNum = parseInt(userId)

    if (!userIdNum) {
      throw new Error('유효하지 않은 사용자 ID입니다.')
    }

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, church_id, is_active')
      .eq('id', userIdNum)
      .single()

    if (userError || !userData || !userData.is_active) {
      throw new Error('사용자를 찾을 수 없거나 비활성화된 계정입니다.')
    }

    const { church_id } = userData

    if (method === 'GET') {
      // 찜한 글 목록 조회
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const offset = (page - 1) * limit

      const { data: wishlists, error: wishlistError } = await supabaseClient
        .from('wishlists')
        .select(`
          id,
          post_type,
          post_id,
          post_title,
          post_description,
          post_image_url,
          created_at
        `)
        .eq('user_id', userIdNum)
        .eq('church_id', church_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (wishlistError) throw wishlistError

      // 전체 개수 조회
      const { count, error: countError } = await supabaseClient
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userIdNum)
        .eq('church_id', church_id)

      if (countError) throw countError

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            items: wishlists,
            pagination: {
              page,
              limit,
              total: count || 0,
              totalPages: Math.ceil((count || 0) / limit)
            }
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (method === 'POST') {
      // 찜하기 추가
      let body;
      try {
        const text = await req.text()
        console.log('Raw request body:', text)
        body = text ? JSON.parse(text) : {}
      } catch (error) {
        console.error('JSON parsing error:', error)
        throw new Error('잘못된 JSON 형식입니다.')
      }

      const { post_type, post_id, post_title, post_description, post_image_url } = body

      if (!post_type || !post_id) {
        throw new Error('post_type과 post_id는 필수입니다.')
      }

      // 이미 찜한 글인지 확인
      const { data: existing } = await supabaseClient
        .from('wishlists')
        .select('id')
        .eq('user_id', userIdNum)
        .eq('church_id', church_id)
        .eq('post_type', post_type)
        .eq('post_id', post_id)
        .single()

      if (existing) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '이미 찜한 글입니다.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // 찜하기 추가
      const { data: newWishlist, error: insertError } = await supabaseClient
        .from('wishlists')
        .insert({
          user_id: userIdNum,
          church_id: church_id,
          post_type,
          post_id,
          post_title: post_title || '',
          post_description: post_description || '',
          post_image_url: post_image_url || null
        })
        .select()
        .single()

      if (insertError) throw insertError

      return new Response(
        JSON.stringify({
          success: true,
          message: '찜하기에 추가되었습니다.',
          data: newWishlist
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        },
      )
    }

    if (method === 'DELETE') {
      // 찜하기 제거
      let body;
      try {
        const text = await req.text()
        console.log('Raw DELETE request body:', text)
        body = text ? JSON.parse(text) : {}
      } catch (error) {
        console.error('DELETE JSON parsing error:', error)
        throw new Error('잘못된 JSON 형식입니다.')
      }

      const { post_type, post_id } = body

      if (!post_type || !post_id) {
        throw new Error('post_type과 post_id는 필수입니다.')
      }

      const { error: deleteError } = await supabaseClient
        .from('wishlists')
        .delete()
        .eq('user_id', userIdNum)
        .eq('church_id', church_id)
        .eq('post_type', post_type)
        .eq('post_id', post_id)

      if (deleteError) throw deleteError

      return new Response(
        JSON.stringify({
          success: true,
          message: '찜하기에서 제거되었습니다.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    throw new Error(`지원하지 않는 HTTP 메서드: ${method}`)

  } catch (error) {
    console.error('Wishlists function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '서버 오류가 발생했습니다.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})