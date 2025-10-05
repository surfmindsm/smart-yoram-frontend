import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth, Authorization, X-Custom-Auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// 임시 토큰 검증 함수
async function verifyToken(token: string, supabaseClient: any) {
  try {
    console.log('🔍 토큰 검증 시작:', { token: token.substring(0, 20) + '...' });

    if (token.startsWith('temp_token_')) {
      const parts = token.split('_');
      console.log('🔍 토큰 파싱 결과:', { parts, partsLength: parts.length });

      if (parts.length >= 3) {
        const userId = parts[2];
        console.log('🔍 임시 토큰에서 추출된 사용자 ID:', userId);

        const { data: user, error } = await supabaseClient
          .from('users')
          .select('id, church_id, email, is_active')
          .eq('id', userId)
          .eq('is_active', true)
          .single();

        if (error || !user) {
          console.error('❌ 사용자 조회 실패:', error);
          return null;
        }

        console.log('✅ 토큰 검증 성공, 사용자 정보:', user);
        return {
          user_id: user.id,
          church_id: user.church_id,
          email: user.email
        };
      }
    }

    return null;
  } catch (error) {
    console.error('❌ 토큰 검증 실패:', error);
    return null;
  }
}

serve(async (req) => {
  console.log('🌍 [Community Function] 요청 받음:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('🌍 [Community Function] OPTIONS 요청 처리');
    const preflightHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth, Authorization, X-Custom-Auth, Content-Type',
    };
    return new Response(null, {
      status: 200,
      headers: preflightHeaders
    })
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');

    console.log('🌍 [Community Function] URL 파싱:', {
      pathname: url.pathname,
      pathParts,
      method: req.method
    });

    // 통계 데이터는 인증 없이 제공 (임시)
    if (pathParts.includes('stats') && req.method === 'GET') {
      console.log('📊 [커뮤니티 통계] 통계 데이터 조회 시작');

      // Mock 데이터 반환 (실제 구현에서는 DB에서 조회)
      const stats = {
        total_posts: 125,
        active_sharing: 23,
        active_requests: 15,
        job_posts: 8,
        music_teams: 5,
        events_this_month: 12,
        total_members: 1200
      };

      console.log('📊 [커뮤니티 통계] 통계 데이터 생성 완료:', stats);

      return new Response(JSON.stringify({
        success: true,
        data: stats
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 최근 게시글 조회
    if (pathParts.includes('recent-posts') && req.method === 'GET') {
      console.log('📋 [최근 게시글] 최근 게시글 조회 시작');

      const limit = url.searchParams.get('limit') || '10';

      // Mock 데이터 반환
      const recentPosts = [
        {
          id: 1,
          type: 'sharing',
          title: '아이 옷 나눔합니다',
          status: '진행중',
          church: '소망교회',
          location: '서울 강남구',
          created_at: '2시간 전',
          author_name: '김은혜'
        },
        {
          id: 2,
          type: 'request',
          title: '책상 하나 구해요',
          status: '요청중',
          church: '믿음교회',
          location: '서울 서초구',
          created_at: '4시간 전',
          author_name: '박희망'
        },
        {
          id: 3,
          type: 'job',
          title: '주일학교 교사 모집',
          status: '모집중',
          church: '사랑교회',
          location: '서울 종로구',
          created_at: '1일 전',
          author_name: '이평화'
        }
      ].slice(0, parseInt(limit));

      console.log('📋 [최근 게시글] 데이터 생성 완료:', recentPosts.length, '개');

      return new Response(JSON.stringify({
        success: true,
        data: recentPosts
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 관리자용 전체 게시글 조회
    if (pathParts.includes('admin') && pathParts.includes('posts') && req.method === 'GET') {
      console.log('👨‍💼 [관리자] 전체 게시글 조회 시작');

      // URL 파라미터 추출
      const type = url.searchParams.get('type');
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');
      const limit = parseInt(url.searchParams.get('limit') || '100');

      console.log('👨‍💼 [관리자] 쿼리 파라미터:', { type, status, search, limit });

      // Mock 데이터 (실제로는 DB에서 필터링해서 조회)
      let allPosts = [
        {
          id: 1,
          type: 'free-sharing',
          title: '아이 옷 나눔합니다',
          status: 'active',
          created_at: '2시간 전',
          view_count: 25,
          likes: 5,
          comments: 3,
          church: '소망교회',
          location: '서울 강남구',
          author: '김은혜',
          authorEmail: 'grace@example.com'
        },
        {
          id: 2,
          type: 'item-request',
          title: '책상 하나 구해요',
          status: 'pending',
          created_at: '4시간 전',
          view_count: 15,
          likes: 2,
          comments: 1,
          church: '믿음교회',
          location: '서울 서초구',
          author: '박희망',
          authorEmail: 'hope@example.com'
        },
        {
          id: 3,
          type: 'job-posting',
          title: '주일학교 교사 모집',
          status: 'reported',
          created_at: '1일 전',
          view_count: 45,
          likes: 8,
          comments: 6,
          church: '사랑교회',
          location: '서울 종로구',
          author: '이평화',
          authorEmail: 'peace@example.com'
        },
        {
          id: 4,
          type: 'music-team-recruit',
          title: '찬양대 기타 연주자 모집',
          status: 'blocked',
          created_at: '2일 전',
          view_count: 32,
          likes: 6,
          comments: 4,
          church: '은혜교회',
          location: '서울 마포구',
          author: '최기쁨',
          authorEmail: 'joy@example.com'
        },
        {
          id: 5,
          type: 'church-events',
          title: '부흥성회 알림',
          status: 'active',
          created_at: '3일 전',
          view_count: 120,
          likes: 15,
          comments: 8,
          church: '소망교회',
          location: '서울 강남구',
          author: '김목사',
          authorEmail: 'pastor@example.com'
        }
      ];

      // 필터 적용
      if (type && type !== 'all') {
        allPosts = allPosts.filter(post => post.type === type);
      }
      if (status && status !== 'all') {
        allPosts = allPosts.filter(post => post.status === status);
      }
      if (search) {
        allPosts = allPosts.filter(post =>
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.author.toLowerCase().includes(search.toLowerCase()) ||
          post.church.toLowerCase().includes(search.toLowerCase())
        );
      }

      // 제한된 수만큼 반환
      const limitedPosts = allPosts.slice(0, limit);

      console.log('👨‍💼 [관리자] 필터링 완료:', limitedPosts.length, '개');

      return new Response(JSON.stringify({
        success: true,
        data: limitedPosts
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 무료나눔 목록 조회
    if (pathParts.includes('sharing') && req.method === 'GET') {
      console.log('🎁 [무료나눔] 목록 조회 시작');

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      try {
        // 파라미터 추출
        const category = url.searchParams.get('category');
        const status = url.searchParams.get('status') || 'active';
        const search = url.searchParams.get('search');
        const skip = parseInt(url.searchParams.get('skip') || '0');
        const limit = parseInt(url.searchParams.get('limit') || '20');

        console.log('🎁 [무료나눔] 쿼리 파라미터:', { category, status, search, skip, limit });

        // 기본 쿼리 구성 - 먼저 간단한 쿼리로 테스트
        let query = supabaseClient
          .from('community_sharing')
          .select('*')
          .eq('status', status)
          .order('created_at', { ascending: false });

        // 카테고리 필터
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }

        // 검색 필터
        if (search) {
          query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // 페이지네이션
        query = query.range(skip, skip + limit - 1);

        const { data, error } = await query;

        if (error) {
          console.error('❌ [무료나눔] DB 조회 실패:', error);
          throw error;
        }

        console.log('✅ [무료나눔] 조회 성공:', data?.length || 0, '개');

        // 디버깅: 첫 번째 아이템 확인
        if (data && data.length > 0) {
          console.log('🔍 [무료나눔] 첫 번째 아이템:', {
            id: data[0].id,
            author_id: data[0].author_id,
            title: data[0].title
          });
        }

        // 각 아이템에 대해 사용자 정보를 별도로 조회
        const transformedData = await Promise.all(data?.map(async (item) => {
          let author_name = '익명';

          if (item.author_id) {
            try {
              // users 테이블에서 사용자 정보 조회
              const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('full_name, email')
                .eq('id', item.author_id)
                .single();

              if (userData && !userError) {
                author_name = userData.full_name || userData.email || '익명';
                console.log(`👤 사용자 ${item.author_id} 조회 성공:`, author_name);
              } else {
                console.log(`❌ 사용자 ${item.author_id} 조회 실패:`, userError);
              }
            } catch (error) {
              console.log(`❌ 사용자 ${item.author_id} 조회 에러:`, error);
            }
          }

          return {
            ...item,
            author_name,
            church_name: null // 교회 정보는 나중에 추가
          };
        }) || []);

        console.log('✅ [무료나눔] 데이터 변환 완료. 샘플:', transformedData[0]?.author_name);

        return new Response(JSON.stringify({
          success: true,
          data: transformedData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ [무료나눔] 조회 실패:', error);
        return new Response(JSON.stringify({
          success: false,
          error: '무료나눔 목록 조회에 실패했습니다',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 무료나눔 상세 조회
    if (pathParts.includes('sharing') && pathParts.length > 3 && req.method === 'GET') {
      const sharingId = pathParts[pathParts.length - 1];
      console.log('🎁 [무료나눔] 상세 조회:', sharingId);

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      try {
        const { data, error } = await supabaseClient
          .from('community_sharing')
          .select(`
            *,
            users:author_id (
              full_name,
              email
            ),
            churches:church_id (
              name
            )
          `)
          .eq('id', sharingId)
          .single();

        if (error) {
          console.error('❌ [무료나눔] 상세 조회 실패:', error);
          throw error;
        }

        // 조회수 증가
        await supabaseClient
          .from('community_sharing')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', sharingId);

        console.log('✅ [무료나눔] 상세 조회 성공:', data?.title);

        // 조인된 데이터를 평탄화하여 author_name과 church_name 추가
        const transformedData = {
          ...data,
          author_name: data.users?.full_name || data.users?.email || '익명',
          church_name: data.churches?.name || null
        };

        return new Response(JSON.stringify({
          success: true,
          data: transformedData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ [무료나눔] 상세 조회 실패:', error);
        return new Response(JSON.stringify({
          success: false,
          error: '무료나눔 상세 정보 조회에 실패했습니다',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 무료나눔 등록
    if (pathParts.includes('sharing') && req.method === 'POST') {
      console.log('🎁 [무료나눔] 등록 시작');

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      try {
        const requestData = await req.json();
        console.log('🎁 [무료나눔] 등록 데이터:', requestData);

        // contact_info 생성: contact_phone과 contact_email이 있으면 합치기
        let contactInfo = requestData.contact_info || '';
        console.log('📞 [연락처] 원본 contact_info:', requestData.contact_info);
        console.log('📞 [연락처] contact_phone:', requestData.contact_phone);
        console.log('📞 [연락처] contact_email:', requestData.contact_email);

        if (!contactInfo && requestData.contact_phone) {
          contactInfo = requestData.contact_phone;
          if (requestData.contact_email) {
            contactInfo += ` | ${requestData.contact_email}`;
          }
          console.log('📞 [연락처] 생성된 contact_info:', contactInfo);
        }

        const { data, error } = await supabaseClient
          .from('community_sharing')
          .insert([{
            church_id: requestData.church_id || 6,
            title: requestData.title,
            description: requestData.description,
            category: requestData.category,
            condition: requestData.condition || 'good',
            location: requestData.location,
            contact_info: contactInfo,
            images: requestData.images || [],
            author_id: requestData.author_id,
            status: 'active'
          }])
          .select()
          .single();

        if (error) {
          console.error('❌ [무료나눔] 등록 실패:', error);
          throw error;
        }

        console.log('✅ [무료나눔] 등록 성공:', data?.id);

        return new Response(JSON.stringify({
          success: true,
          data: data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ [무료나눔] 등록 실패:', error);
        return new Response(JSON.stringify({
          success: false,
          error: '무료나눔 등록에 실패했습니다',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log('🌍 [Community Function] 지원하지 않는 엔드포인트:', url.pathname);
    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [Community Function] 오류:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})