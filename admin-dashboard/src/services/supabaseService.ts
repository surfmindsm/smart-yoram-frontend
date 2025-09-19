import { supabase } from '../lib/supabase'

// Music Team Recruitment Service
export const musicTeamService = {
  // Get all music team recruitments
  async getAll(filters?: {
    church_id?: string
    status?: string
    team_types?: string
    worship_type?: string
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('music_team_recruitments')
      .select(`
        *,
        churches:church_id (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.church_id) {
      query = query.eq('church_id', filters.church_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.worship_type) {
      query = query.eq('worship_type', filters.worship_type)
    }

    if (filters?.team_types) {
      query = query.contains('team_types', [filters.team_types])
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  // Get single recruitment by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('music_team_recruitments')
      .select(`
        *,
        churches:church_id (
          name,
          address,
          phone
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new recruitment
  async create(recruitment: Omit<any, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('music_team_recruitments')
      .insert(recruitment)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update recruitment
  async update(id: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('music_team_recruitments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete recruitment
  async delete(id: string) {
    const { error } = await supabase
      .from('music_team_recruitments')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Increment view count
  async incrementViewCount(id: string) {
    const { data, error } = await supabase
      .rpc('increment_view_count', {
        table_name: 'music_team_recruitments',
        row_id: id
      })

    if (error) throw error
    return data
  }
}

// Church News Service
export const churchNewsService = {
  async getAll(filters?: {
    church_id?: string
    category?: string
    priority?: string
    status?: string
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('church_news')
      .select(`
        *,
        churches:church_id (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.church_id) {
      query = query.eq('church_id', filters.church_id)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('church_news')
      .select(`
        *,
        churches:church_id (
          name,
          address,
          phone
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(news: Omit<any, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('church_news')
      .insert(news)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('church_news')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('church_news')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Job Posting Service
export const jobPostingService = {
  async getAll(filters?: {
    church_id?: string
    job_type?: string
    employment_type?: string
    status?: string
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('job_postings')
      .select(`
        *,
        churches:church_id (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.church_id) {
      query = query.eq('church_id', filters.church_id)
    }

    if (filters?.job_type) {
      query = query.eq('job_type', filters.job_type)
    }

    if (filters?.employment_type) {
      query = query.eq('employment_type', filters.employment_type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('job_postings')
      .select(`
        *,
        churches:church_id (
          name,
          address,
          phone
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(job: Omit<any, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('job_postings')
      .insert(job)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('job_postings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('job_postings')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Church Service
export const churchService = {
  async getAll() {
    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(church: Omit<any, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('churches')
      .insert(church)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('churches')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Auth Service
export const authService = {
  async signUp(email: string, password: string, userData?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })

    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Generic database utility functions
export const dbUtils = {
  async executeFunction(functionName: string, params?: any) {
    const { data, error } = await supabase.rpc(functionName, params)
    if (error) throw error
    return data
  },

  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)

    if (error) throw error
    return data
  },

  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  },

  async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  }
}