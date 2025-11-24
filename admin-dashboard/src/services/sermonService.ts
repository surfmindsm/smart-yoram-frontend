import { supabase } from '../lib/supabase';

export interface SermonCategory {
  id: number;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sermon {
  id: string;
  title: string;
  youtube_url: string;
  youtube_video_id: string;
  preacher_name?: string;
  description?: string;
  scripture_reference?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  view_count: number;
  category_id?: number;
  category?: string;
  sermon_date?: string;
  tags?: string[];
  language: string;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  // 관계 데이터
  category_info?: SermonCategory;
}

export interface SermonCreate {
  title: string;
  youtube_url: string;
  preacher_name?: string;
  description?: string;
  scripture_reference?: string;
  category_id?: number;
  sermon_date?: string;
  tags?: string[];
  language?: string;
  is_featured?: boolean;
  display_order?: number;
  published_at?: string;
  duration_seconds?: number;
}

export interface SermonUpdate extends Partial<SermonCreate> {
  is_active?: boolean;
}

export interface SermonFilters {
  is_active?: boolean;
  category?: string;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}

export const sermonService = {
  // 모든 설교 조회
  getAll: async (filters?: SermonFilters): Promise<Sermon[]> => {
    try {
      let query = supabase
        .from('sermons')
        .select(`
          *,
          category_info:sermon_categories(*)
        `)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      // 필터 적용
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('설교 목록 조회 실패:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('설교 목록 조회 실패:', error);
      return [];
    }
  },

  // 특정 설교 조회
  getById: async (id: string): Promise<Sermon | null> => {
    try {
      const { data, error } = await supabase
        .from('sermons')
        .select(`
          *,
          category_info:sermon_categories(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('설교 조회 실패:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('설교 조회 실패:', error);
      return null;
    }
  },

  // 설교 생성
  create: async (sermon: SermonCreate, userId: number): Promise<Sermon> => {
    try {
      // 유튜브 비디오 ID 추출
      const videoId = extractYoutubeVideoId(sermon.youtube_url);
      if (!videoId) {
        throw new Error('유효하지 않은 유튜브 URL입니다.');
      }

      const { data, error } = await supabase
        .from('sermons')
        .insert({
          ...sermon,
          youtube_video_id: videoId,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          language: sermon.language || 'ko',
          is_featured: sermon.is_featured || false,
          display_order: sermon.display_order || 0,
          is_active: true,
          published_at: sermon.published_at || new Date().toISOString(),
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('설교 생성 실패:', error);
        throw error;
      }

      // 관리자 작업 로그 기록
      await supabase.from('sermon_audit_logs').insert({
        sermon_id: data.id,
        action: 'create',
        user_id: userId,
        changed_data: { new: data },
      });

      return data;
    } catch (error) {
      console.error('설교 생성 실패:', error);
      throw error;
    }
  },

  // 설교 수정
  update: async (id: string, sermon: SermonUpdate, userId: number): Promise<Sermon> => {
    try {
      // 기존 데이터 조회 (로그용)
      const { data: oldData } = await supabase
        .from('sermons')
        .select('*')
        .eq('id', id)
        .single();

      const updateData: any = {
        ...sermon,
        updated_by: userId,
      };

      // 유튜브 URL이 변경된 경우 비디오 ID 재추출
      if (sermon.youtube_url) {
        const videoId = extractYoutubeVideoId(sermon.youtube_url);
        if (!videoId) {
          throw new Error('유효하지 않은 유튜브 URL입니다.');
        }
        updateData.youtube_video_id = videoId;
        updateData.thumbnail_url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }

      const { data, error } = await supabase
        .from('sermons')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('설교 수정 실패:', error);
        throw error;
      }

      // 관리자 작업 로그 기록
      await supabase.from('sermon_audit_logs').insert({
        sermon_id: id,
        action: 'update',
        user_id: userId,
        changed_data: { old: oldData, new: data },
      });

      return data;
    } catch (error) {
      console.error('설교 수정 실패:', error);
      throw error;
    }
  },

  // 설교 삭제 (소프트 삭제)
  delete: async (id: string, userId: number): Promise<void> => {
    try {
      // 기존 데이터 조회 (로그용)
      const { data: oldData } = await supabase
        .from('sermons')
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('sermons')
        .update({ is_active: false, updated_by: userId })
        .eq('id', id);

      if (error) {
        console.error('설교 삭제 실패:', error);
        throw error;
      }

      // 관리자 작업 로그 기록
      await supabase.from('sermon_audit_logs').insert({
        sermon_id: id,
        action: 'delete',
        user_id: userId,
        changed_data: { old: oldData },
      });
    } catch (error) {
      console.error('설교 삭제 실패:', error);
      throw error;
    }
  },

  // 조회수 기록
  recordView: async (sermonId: string, userId?: number, churchId?: number): Promise<void> => {
    try {
      await supabase.from('sermon_views').insert({
        sermon_id: sermonId,
        user_id: userId,
        church_id: churchId,
      });
    } catch (error) {
      console.error('조회수 기록 실패:', error);
    }
  },

  // 카테고리 조회
  getCategories: async (): Promise<SermonCategory[]> => {
    try {
      const { data, error } = await supabase
        .from('sermon_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('카테고리 조회 실패:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
      return [];
    }
  },

  // 추천 설교 조회
  getFeatured: async (): Promise<Sermon[]> => {
    return sermonService.getAll({ is_active: true, is_featured: true });
  },

  // 최신 설교 조회
  getRecent: async (limit: number = 10): Promise<Sermon[]> => {
    return sermonService.getAll({ is_active: true, limit });
  },
};

// 유튜브 비디오 ID 추출 헬퍼 함수
function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
