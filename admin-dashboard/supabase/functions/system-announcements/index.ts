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

    // Verify authentication from custom auth service
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Basic token validation (in real app, you'd verify JWT properly)
    if (!token.startsWith('temp_token_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'GET') {
      // Return mock system announcements
      const mockAnnouncements = [
        {
          id: 1,
          title: "시스템 업데이트 공지",
          content: "Supabase 마이그레이션이 완료되었습니다. 새로운 기능들을 확인해보세요!",
          priority: "important",
          target_type: "all",
          is_active: true,
          created_at: "2024-01-15T09:00:00Z",
          updated_at: "2024-01-15T09:00:00Z"
        },
        {
          id: 2,
          title: "정기 점검 안내",
          content: "다음 주 일요일 오후 2시부터 4시까지 정기 점검이 있을 예정입니다.",
          priority: "normal",
          target_type: "all",
          is_active: true,
          created_at: "2024-01-14T10:00:00Z",
          updated_at: "2024-01-14T10:00:00Z"
        }
      ]

      return new Response(
        JSON.stringify(mockAnnouncements),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      // Create new announcement
      const body = await req.json()

      const newAnnouncement = {
        id: Math.floor(Math.random() * 1000),
        title: body.title,
        content: body.content,
        priority: body.priority || 'normal',
        target_type: body.target_type || 'all',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return new Response(
        JSON.stringify(newAnnouncement),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'PUT') {
      // Mark announcement as read
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const announcementId = pathParts[pathParts.length - 2] // Get ID from path like /read/1

      if (pathParts[pathParts.length - 1] === 'read') {
        // Mock marking as read
        return new Response(
          JSON.stringify({ message: 'Announcement marked as read' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
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
