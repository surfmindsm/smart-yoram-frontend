import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Supabase 클라이언트 생성
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "인증이 필요합니다",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 요청 본문 파싱
    const {
      reported_type,
      reported_id,
      reported_table,
      reason,
      description,
    } = await req.json();

    // 필수 파라미터 검증
    if (!reported_type || !reported_id || !reason) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "필수 파라미터가 누락되었습니다",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 유효한 신고 타입 검증
    const validTypes = ["post", "chat", "user"];
    if (!validTypes.includes(reported_type)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "유효하지 않은 신고 타입입니다",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 유효한 신고 사유 검증
    const validReasons = ["spam", "inappropriate", "fraud", "harassment", "etc"];
    if (!validReasons.includes(reason)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "유효하지 않은 신고 사유입니다",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 중복 신고 확인 (같은 사용자가 같은 대상을 이미 신고했는지)
    const { data: existingReport } = await supabaseClient
      .from("reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("reported_type", reported_type)
      .eq("reported_id", reported_id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingReport) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "이미 신고한 내용입니다",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 신고 데이터 삽입
    const { data: report, error: insertError } = await supabaseClient
      .from("reports")
      .insert({
        reporter_id: user.id,
        reported_type,
        reported_id,
        reported_table,
        reason,
        description: description || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("신고 생성 실패:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "신고 생성에 실패했습니다",
          error: insertError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        message: "신고가 접수되었습니다",
        data: report,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("서버 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "서버 오류가 발생했습니다",
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
