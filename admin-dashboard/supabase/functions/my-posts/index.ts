// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, temp-token',
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
      const type = url.searchParams.get('type')
      const post_type = url.searchParams.get('post_type')
      const search = url.searchParams.get('search')
      const status = url.searchParams.get('status')

      // Get temp-token header to identify user
      const tempToken = req.headers.get('temp-token')
      if (!tempToken) {
        return new Response(
          JSON.stringify({ error: 'temp-token header required' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Validate custom auth token format: temp_token_{user_id}_{timestamp}
      let userId: number | null = null
      if (!tempToken.startsWith('temp_token_')) {
        return new Response(
          JSON.stringify({ error: 'Invalid token format' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Parse token to extract user_id and timestamp
      const tokenParts = tempToken.split('_')
      if (tokenParts.length !== 4 || tokenParts[0] !== 'temp' || tokenParts[1] !== 'token') {
        return new Response(
          JSON.stringify({ error: 'Invalid token structure' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      userId = parseInt(tokenParts[2])
      const timestamp = parseInt(tokenParts[3])

      if (isNaN(userId) || userId <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid user ID in token' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if token is not too old (24 hours = 86400000 ms)
      const now = Date.now()
      if (timestamp > 0 && (now - timestamp) > 86400000) {
        return new Response(
          JSON.stringify({ error: 'Token expired' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const allPosts: any[] = []

      // Query different tables based on type filter
      const tablesToQuery = type ? [type] : ['community_sharing', 'job_posts', 'community_music_teams', 'music_team_seekers', 'church_news']

      for (const table of tablesToQuery) {
        try {
          let query = supabaseClient
            .from(table)
            .select('*')
            .eq('author_id', userId)
            .order('created_at', { ascending: false })

          // Apply status filter if provided
          if (status) {
            query = query.eq('status', status)
          }

          // Apply search filter if provided
          if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,description.ilike.%${search}%`)
          }

          const { data, error } = await query

          if (error) {
            console.error(`Error querying ${table}:`, error)
            continue
          }

          if (data && data.length > 0) {
            // Transform data and add post type
            const transformedData = data.map(item => {
              let postType = getPostType(table)

              // For community_sharing, determine type based on is_free
              if (table === 'community_sharing') {
                postType = item.is_free ? 'community-sharing' : 'item-sale'
              }

              return {
                ...item,
                post_type: postType,
                type: postType,
                table_name: table,
                userName: item.author_name || '익명',
                user_name: item.author_name || '익명'
              }
            })

            allPosts.push(...transformedData)
          }
        } catch (error) {
          console.error(`Error processing ${table}:`, error)
          continue
        }
      }

      // Sort all posts by created_at
      allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Apply limit
      const limitedPosts = allPosts.slice(0, limit)

      return new Response(
        JSON.stringify(limitedPosts),
        {
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

// Helper function to map table names to post types
function getPostType(tableName: string): string {
  switch (tableName) {
    case 'community_sharing':
      return 'community-sharing'
    case 'community_requests':
      return 'community-request'
    case 'job_posts':
      return 'job-posts'
    case 'community_music_teams':
      return 'music-team-recruitment'
    case 'music_team_seekers':
      return 'music-team-seekers'
    case 'church_news':
      return 'church-news'
    default:
      return 'unknown'
  }
}