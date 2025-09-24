import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS 헤더 설정
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-custom-auth",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      });
      return new Response(JSON.stringify({
        error: 'Supabase 환경 변수가 설정되지 않았습니다.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // 사용자 인증 확인
    const token = req.headers.get('X-Custom-Auth');
    if (!token) {
      return new Response(JSON.stringify({
        error: '인증 토큰이 필요합니다.'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // 토큰에서 사용자 정보 추출
    const userIdMatch = token.match(/temp_token_(\d+)_/);
    if (!userIdMatch) {
      return new Response(JSON.stringify({
        error: '유효하지 않은 토큰 형식입니다.'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const userId = parseInt(userIdMatch[1]);

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, church_id, role, is_active')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({
        error: '사용자를 찾을 수 없습니다.'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const action = pathSegments[pathSegments.length - 1]; // 마지막 경로 세그먼트

    if (req.method === 'GET') {
      if (action === 'histories') {
        // 채팅 히스토리 조회
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const skip = parseInt(url.searchParams.get('skip') || '0');

        const { data: histories, error } = await supabaseClient
          .from('chat_histories')
          .select(`
            id,
            title,
            agent_id,
            created_at,
            updated_at,
            user_id,
            church_id,
            is_bookmarked,
            message_count
          `)
          .eq('user_id', userId)
          .eq('church_id', user.church_id)
          .order('updated_at', { ascending: false })
          .range(skip, skip + limit - 1);

        if (error) {
          console.error('채팅 히스토리 조회 실패:', error);
          throw new Error('채팅 히스토리 조회에 실패했습니다.');
        }

        return new Response(JSON.stringify(histories || []), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      } else if (action === 'agents') {
        // AI 에이전트 목록 조회 (해당 교회의 에이전트만)
        const { data: agents, error } = await supabaseClient
          .from('ai_agents')
          .select(`
            id,
            name,
            category,
            description,
            detailed_description,
            icon,
            system_prompt,
            is_active,
            is_default,
            created_at
          `)
          .eq('church_id', user.church_id)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('AI 에이전트 조회 실패:', error);
          throw new Error('AI 에이전트 조회에 실패했습니다.');
        }

        return new Response(JSON.stringify(agents || []), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    } else if (req.method === 'POST') {
      const body = await req.json();

      if (action === 'histories') {
        // 새 채팅 히스토리 생성
        const { title, agent_id } = body;

        const { data: newHistory, error } = await supabaseClient
          .from('chat_histories')
          .insert({
            title: title || '새 대화',
            agent_id,
            user_id: userId,
            church_id: user.church_id,
            message_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('채팅 히스토리 생성 실패:', error);
          throw new Error('채팅 히스토리 생성에 실패했습니다.');
        }

        return new Response(JSON.stringify(newHistory), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      } else if (action === 'messages') {
        // 새 메시지 생성 및 AI 응답
        const { history_id, content, agent_id } = body;

        // 사용자 메시지 저장
        const { data: userMessage, error: userMsgError } = await supabaseClient
          .from('chat_messages')
          .insert({
            chat_history_id: history_id,
            content,
            role: 'user',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (userMsgError) {
          console.error('사용자 메시지 저장 실패:', userMsgError);
          throw new Error('메시지 저장에 실패했습니다.');
        }

        // 실제 AI 응답 생성 로직
        let aiResponse = '';

        // 비서 에이전트인 경우 교회 데이터 조회
        if (agent_id) {
          const { data: agentData } = await supabaseClient
            .from('ai_agents')
            .select('category, enable_church_data, church_data_sources')
            .eq('id', agent_id)
            .single();

          if (agentData && agentData.category === 'secretary' && agentData.enable_church_data) {
            // 교회 데이터 조회가 필요한 질문인지 확인
            const needsChurchData = content.match(/교인|멤버|회원|참석|출석|인원|명수|몇.*명|수.*명|데이터/i);

            if (needsChurchData) {
              console.log('🔍 교회 데이터 조회 필요한 질문 감지:', content);

              // 교인 수 조회
              if (content.match(/교인.*몇.*명|멤버.*몇.*명|회원.*몇.*명|교인.*수|멤버.*수/i)) {
                console.log(`🔍 교인 수 조회 시작 - church_id: ${user.church_id}`);

                // 먼저 테이블 구조 확인을 위해 모든 컬럼 조회
                const { data: allMembers, error: allMembersError } = await supabaseClient
                  .from('members')
                  .select('*')
                  .eq('church_id', user.church_id)
                  .limit(5);

                console.log('📊 전체 members 조회 결과:', {
                  data: allMembers,
                  error: allMembersError,
                  count: allMembers?.length || 0
                });

                if (allMembersError) {
                  console.error('❌ Members 테이블 조회 오류:', allMembersError);
                  aiResponse = '교인 데이터 조회 중 오류가 발생했습니다.';
                } else {
                  const totalCount = allMembers?.length || 0;

                  // 테이블 구조 로깅
                  if (allMembers && allMembers.length > 0) {
                    console.log('📋 Members 테이블 구조 (첫 번째 레코드):', Object.keys(allMembers[0]));
                    console.log('📄 Members 첫 번째 데이터:', allMembers[0]);
                  }

                  // 전체 카운트 조회
                  const { count: fullCount, error: countError } = await supabaseClient
                    .from('members')
                    .select('*', { count: 'exact', head: true })
                    .eq('church_id', user.church_id);

                  console.log(`📊 전체 교인 수: ${fullCount}명 (오류: ${countError})`);

                  if (totalCount === 0 && fullCount === 0) {
                    aiResponse = `현재 교회 ID ${user.church_id}에 등록된 교인이 없습니다. 교인 등록이 필요합니다.`;
                  } else {
                    const actualCount = fullCount || totalCount;
                    aiResponse = `현재 우리 교회에 등록된 교인은 총 ${actualCount}명입니다.`;
                  }
                }
              }
              // 출석 현황 조회
              else if (content.match(/출석|참석/i)) {
                const today = new Date();
                const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

                const { data: attendances } = await supabaseClient
                  .from('attendances')
                  .select('id', { count: 'exact' })
                  .eq('church_id', user.church_id)
                  .gte('attendance_date', oneWeekAgo.toISOString().split('T')[0]);

                const weeklyAttendance = attendances?.length || 0;
                aiResponse = `최근 일주일간 출석 기록은 ${weeklyAttendance}건입니다.`;
              }
              // 기도 요청 조회
              else if (content.match(/기도.*요청|중보.*기도/i)) {
                const { data: prayerRequests } = await supabaseClient
                  .from('prayer_requests')
                  .select('id, title, is_urgent', { count: 'exact' })
                  .eq('church_id', user.church_id)
                  .eq('is_active', true);

                const totalRequests = prayerRequests?.length || 0;
                const urgentRequests = prayerRequests?.filter(req => req.is_urgent)?.length || 0;
                aiResponse = `현재 활성 기도 요청은 총 ${totalRequests}건이며, 이 중 긴급 요청은 ${urgentRequests}건입니다.`;
              }
              // 일반적인 교회 데이터 문의
              else {
                const { data: memberCount } = await supabaseClient
                  .from('members')
                  .select('id', { count: 'exact' })
                  .eq('church_id', user.church_id)
                  .eq('is_active', true);

                const count = memberCount?.length || 0;
                aiResponse = `교회 데이터를 기반으로 답변드리겠습니다. 현재 등록된 교인은 ${count}명입니다. 더 구체적인 정보가 필요하시면 말씀해 주세요.`;
              }
            } else {
              // 교회 데이터가 필요하지 않은 일반적인 질문
              aiResponse = `안녕하세요! 저는 교회 비서입니다. "${content}"에 대해 도움을 드리겠습니다.`;
            }
          } else {
            // 일반 에이전트 응답
            aiResponse = `안녕하세요! 저는 AI 도우미입니다. "${content}"에 대해 도움을 드리겠습니다.`;
          }
        } else {
          // 에이전트 정보가 없는 경우
          aiResponse = `안녕하세요! "${content}"에 대해 도움을 드리겠습니다.`;
        }

        // AI 응답 저장
        const { data: aiMessage, error: aiMsgError } = await supabaseClient
          .from('chat_messages')
          .insert({
            chat_history_id: history_id,
            content: aiResponse,
            role: 'assistant',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (aiMsgError) {
          console.error('AI 메시지 저장 실패:', aiMsgError);
          throw new Error('AI 응답 저장에 실패했습니다.');
        }

        // 채팅 히스토리 업데이트 시간 갱신
        await supabaseClient
          .from('chat_histories')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', history_id);

        return new Response(JSON.stringify({
          user_message: userMessage,
          ai_message: aiMessage
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    } else if (req.method === 'PUT') {
      const body = await req.json();

      if (pathSegments.includes('histories')) {
        // 채팅 히스토리 업데이트
        const historyId = pathSegments[pathSegments.indexOf('histories') + 1];
        const { title } = body;

        const { data: updatedHistory, error } = await supabaseClient
          .from('chat_histories')
          .update({
            title,
            updated_at: new Date().toISOString()
          })
          .eq('id', historyId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error('채팅 히스토리 업데이트 실패:', error);
          throw new Error('채팅 히스토리 업데이트에 실패했습니다.');
        }

        return new Response(JSON.stringify(updatedHistory), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    } else if (req.method === 'DELETE') {
      if (pathSegments.includes('histories')) {
        // 채팅 히스토리 삭제
        const historyId = pathSegments[pathSegments.indexOf('histories') + 1];

        // 관련 메시지들도 함께 삭제
        await supabaseClient
          .from('chat_messages')
          .delete()
          .eq('chat_history_id', historyId);

        const { error } = await supabaseClient
          .from('chat_histories')
          .delete()
          .eq('id', historyId)
          .eq('user_id', userId);

        if (error) {
          console.error('채팅 히스토리 삭제 실패:', error);
          throw new Error('채팅 히스토리 삭제에 실패했습니다.');
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    }

    return new Response(JSON.stringify({
      error: '지원하지 않는 요청입니다.'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error: any) {
    console.error('AI Chat API 오류:', error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});