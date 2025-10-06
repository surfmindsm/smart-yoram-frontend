// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    if (req.method === 'GET') {
      // Parse query parameters
      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '50', 10)
      const category = url.searchParams.get('category')
      const urgency = url.searchParams.get('urgency')
      const status = url.searchParams.get('status')
      const search = url.searchParams.get('search')

      // Build query
      let query = supabaseClient
        .from('community_requests')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (category) {
        query = query.eq('category', category)
      }
      if (urgency) {
        query = query.eq('urgency', urgency)
      }
      if (status) {
        query = query.eq('status', status)
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Apply limit
      query = query.limit(limit)

      const { data, error } = await query

      if (error) {
        console.error('Database query error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch community requests data' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Transform data to match frontend expectations
      const transformedData = (data || []).map(item => ({
        ...item,
        content: item.description, // Map description to content for compatibility
        author_name: item.author_name || '익명',
        user_name: item.author_name || '익명'
      }))

      return new Response(
        JSON.stringify(transformedData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      // Create new request item
      const body = await req.json()

      console.log('===== 물품요청 등록 시작 (위치정보 디버깅) =====');
      console.log('받은 전체 데이터:', JSON.stringify({
        province: body.province,
        district: body.district,
        deliveryAvailable: body.deliveryAvailable,
        delivery_available: body.delivery_available
      }, null, 2));

      const provinceValue = body.province || null;
      const districtValue = body.district || null;
      const deliveryValue = body.deliveryAvailable || body.delivery_available || false;

      console.log('변환된 위치 정보:', {
        province: provinceValue,
        district: districtValue,
        delivery_available: deliveryValue
      });

      const insertData = {
        title: body.title,
        description: body.content || body.description,
        category: body.category || 'general',
        urgency: body.urgency || 'normal',
        location: body.location,
        province: provinceValue,
        district: districtValue,
        delivery_available: deliveryValue,
        contact_info: body.contact_info || body.contactInfo,
        reward_type: body.reward_type || body.rewardType || 'none',
        reward_amount: body.reward_amount || body.rewardAmount || 0,
        images: body.images || [],
        church_id: body.church_id || 9998,
        author_id: body.author_id,
        status: body.status || 'active'
      }

      console.log('INSERT할 데이터 (위치정보):', {
        province: insertData.province,
        district: insertData.district,
        delivery_available: insertData.delivery_available
      });

      const { data, error } = await supabaseClient
        .from('community_requests')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Database insert error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create community request item' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ INSERT 성공! ID:', data?.id);
      console.log('DB에 저장된 데이터:', {
        province: data?.province,
        district: data?.district,
        delivery_available: data?.delivery_available,
        location: data?.location
      });
      console.log('===== 등록 완료 =====');

      // Transform response to match frontend expectations
      const transformedItem = {
        ...data,
        content: data.description, // Map description to content for compatibility
        author_name: data.author_name || '익명',
        user_name: data.author_name || '익명'
      }

      return new Response(
        JSON.stringify(transformedItem),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})