/**
 * 화면 간 공유 데이터용 React Query 훅 모음.
 * staleTime/gcTime은 데이터 변동 빈도에 맞춰 설정.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { supabaseApiService } from '../services/supabaseApiService';
import { organizationService } from '../services/organizationService';

// 1) 현재 사용자 — 거의 변하지 않으므로 길게 캐싱
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const result = await supabaseAuthService.getCurrentUser();
      return result?.user ?? null;
    },
    staleTime: 10 * 60_000, // 10분
    gcTime: 30 * 60_000,
  });
}

// 2) 전체 교인 목록 — 여러 화면(교인/출석/심방/조직)에서 공유
export function useMembers(enabled: boolean = true) {
  return useQuery({
    queryKey: ['members', 'all'],
    queryFn: async () => {
      const response = await supabaseApiService.members.getAll({ limit: 1000 });
      return response?.data ?? [];
    },
    staleTime: 60_000,        // 1분
    gcTime: 5 * 60_000,
    enabled,
  });
}

// 3) 조직 목록 — 조직/교인 화면에서 공유
export function useOrganizations(churchId: number | null | undefined) {
  return useQuery({
    queryKey: ['organizations', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      const result = await organizationService.getOrganizations(churchId);
      return result?.organizations ?? [];
    },
    enabled: !!churchId,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

// 4) 부서 목록 — 조직/교인 화면에서 공유
export function useDepartments(churchId: number | null | undefined) {
  return useQuery({
    queryKey: ['departments', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        .eq('church_id', churchId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data?.map(d => d.name) ?? [];
    },
    enabled: !!churchId,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

// 5) 활성 예배 목록 — 출석 화면에서 사용
export function useWorshipServices(churchId: number | null | undefined) {
  return useQuery({
    queryKey: ['worshipServices', 'active', churchId],
    queryFn: async () => {
      if (!churchId) return [];
      const result = await supabaseApiService.worshipServices.getAll({
        church_id: churchId,
        is_active: true,
        limit: 100,
      });
      return (result?.data ?? result ?? []) as any[];
    },
    enabled: !!churchId,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}
