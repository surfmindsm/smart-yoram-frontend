// Shared API Client for Smart Yoram Frontend Applications
// This provides a unified interface for all frontend apps to communicate with Supabase

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

// Environment configuration
interface SupabaseConfig {
  url: string
  anonKey: string
  environment: 'development' | 'staging' | 'production'
}

class ApiClient {
  private supabase: SupabaseClient<Database>
  private config: SupabaseConfig

  constructor(config: SupabaseConfig) {
    this.config = config
    this.supabase = createClient<Database>(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }

  // Authentication methods
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  async signUp(email: string, password: string, userData?: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: userData },
    })
    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async getUser() {
    const { data, error } = await this.supabase.auth.getUser()
    if (error) throw error
    return data.user
  }

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession()
    if (error) throw error
    return data.session
  }

  // Member management methods
  async getMembers(churchId: string, filters?: any) {
    let query = this.supabase
      .from('members')
      .select('*')
      .eq('church_id', churchId)

    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters?.department) {
      query = query.eq('department', filters.department)
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    const { data, error } = await query.order('full_name')
    if (error) throw error
    return data
  }

  async getMember(id: string, churchId: string) {
    const { data, error } = await this.supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .eq('church_id', churchId)
      .single()

    if (error) throw error
    return data
  }

  async createMember(memberData: any) {
    const { data, error } = await this.supabase
      .from('members')
      .insert(memberData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateMember(id: string, churchId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .eq('church_id', churchId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteMember(id: string, churchId: string) {
    const { error } = await this.supabase
      .from('members')
      .delete()
      .eq('id', id)
      .eq('church_id', churchId)

    if (error) throw error
  }

  // Community methods
  async getCommunityPosts(churchId: string, type: string, filters?: any) {
    const tableName = this.getCommunityTableName(type)
    let query = this.supabase
      .from(tableName)
      .select('*, author:users(full_name)')
      .eq('church_id', churchId)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  }

  async createCommunityPost(type: string, postData: any) {
    const tableName = this.getCommunityTableName(type)
    const { data, error } = await this.supabase
      .from(tableName)
      .insert(postData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateCommunityPost(type: string, id: string, churchId: string, updates: any) {
    const tableName = this.getCommunityTableName(type)
    const { data, error } = await this.supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .eq('church_id', churchId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Church Events methods
  async getChurchEvents(churchId: string, filters?: any) {
    let query = this.supabase
      .from('church_events')
      .select('*, author:users(full_name)')
      .eq('church_id', churchId)

    if (filters?.startDate) {
      query = query.gte('start_date', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('start_date', filters.endDate)
    }

    const { data, error } = await query.order('start_date')
    if (error) throw error
    return data
  }

  async createChurchEvent(eventData: any) {
    const { data, error } = await this.supabase
      .from('church_events')
      .insert(eventData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Notifications methods
  async getNotifications(userId: string) {
    const { data, error } = await this.supabase
      .from('notification_recipients')
      .select(`
        *,
        notification:push_notifications(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async markNotificationAsRead(notificationId: string, userId: string) {
    const { error } = await this.supabase
      .from('notification_recipients')
      .update({ read_at: new Date().toISOString() })
      .eq('notification_id', notificationId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // File upload methods
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file)

    if (error) throw error
    return data
  }

  async getFileUrl(bucket: string, path: string) {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  }

  // Utility methods
  private getCommunityTableName(type: string): string {
    const tableMap: Record<string, string> = {
      sharing: 'community_sharing',
      requests: 'community_requests',
      jobs: 'job_posts',
      music: 'music_team_recruitment',
    }
    return tableMap[type] || 'community_sharing'
  }

  // Real-time subscriptions
  subscribeToTable(
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ) {
    return this.supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        callback
      )
      .subscribe()
  }

  unsubscribe(channel: any) {
    return this.supabase.removeChannel(channel)
  }

  // Get Supabase client for direct access
  getClient() {
    return this.supabase
  }
}

// Factory function to create API client
export function createApiClient(config: SupabaseConfig): ApiClient {
  return new ApiClient(config)
}

// Default export
export default ApiClient