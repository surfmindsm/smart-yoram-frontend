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

// 6) 계정과목 — 회계/예산/결산/헌금 화면 모두 공유
export function useAccountCategories() {
  return useQuery({
    queryKey: ['accountCategories', 'all'],
    queryFn: async () => {
      const token = await supabaseAuthService.getToken();
      if (!token) return { income: [], expense: [] };

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const headers = {
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        'X-Custom-Auth': token,
        'Content-Type': 'application/json',
      };

      const [incomeResponse, expenseResponse] = await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/accounting/admin/categories?type=income`, { method: 'GET', headers }),
        fetch(`${supabaseUrl}/functions/v1/accounting/admin/categories?type=expense`, { method: 'GET', headers }),
      ]);

      let income: any[] = [];
      let expense: any[] = [];

      if (incomeResponse.ok) {
        const data = await incomeResponse.json();
        income = Array.isArray(data) ? data : (data?.data || []);
      }
      if (expenseResponse.ok) {
        const data = await expenseResponse.json();
        expense = Array.isArray(data) ? data : (data?.data || []);
      }
      return { income, expense };
    },
    staleTime: 5 * 60_000,    // 5분 — 자주 안 바뀜
    gcTime: 30 * 60_000,
  });
}

// 7) 회계 거래 — 회계 관리 화면에서 사용
export function useAccountingTransactions(params: {
  year?: number;
  month?: number | null;
  type?: 'income' | 'expense';
}) {
  const { year, month, type } = params;
  return useQuery({
    queryKey: ['accountingTransactions', year ?? 'all', month ?? 'all', type ?? 'all'],
    queryFn: async () => {
      const token = await supabaseAuthService.getToken();
      if (!token) return [];

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const queryParams = new URLSearchParams();
      if (year) queryParams.append('year', year.toString());
      if (month) queryParams.append('month', month.toString());
      if (type) queryParams.append('type', type);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/accounting/admin/transactions?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.data || []);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

// 8) 회계 요약 — 회계 관리 상단 카드
export function useAccountingSummary(params: { year?: number; month?: number | null }) {
  const { year, month } = params;
  return useQuery({
    queryKey: ['accountingSummary', year ?? 'all', month ?? 'all'],
    queryFn: async () => {
      const token = await supabaseAuthService.getToken();
      if (!token) return null;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const queryParams = new URLSearchParams();
      if (year) queryParams.append('year', year.toString());
      if (month) queryParams.append('month', month.toString());

      const response = await fetch(
        `${supabaseUrl}/functions/v1/accounting/admin/summary?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return null;
      return await response.json();
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

// 9) 예산 (연간) — 예산 관리 / 결산에서 사용
export function useBudgets(year: number) {
  return useQuery({
    queryKey: ['budgets', 'annual', year],
    queryFn: async () => {
      const token = await supabaseAuthService.getToken();
      if (!token) return [];

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/budgets/admin/budgets?year=${year}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      return list.filter((b: any) => b.month === null);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

// 10) 예산 vs 실적 — 결산 화면
export function useBudgetVsActual(year: number) {
  return useQuery({
    queryKey: ['budgetVsActual', year],
    queryFn: async () => {
      const token = await supabaseAuthService.getToken();
      if (!token) return { comparison: [], summary: null };

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/budgets/admin/budgets/vs-actual?year=${year}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return { comparison: [], summary: null };
      const data = await response.json();
      return { comparison: data.comparison || [], summary: data.summary || null };
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

// 11) 헌금 목록 — 헌금 관리 화면
export function useDonations(params: { year?: number; month?: number | null; fundType?: string; memberId?: number | null }) {
  const { year, month, fundType, memberId } = params;
  return useQuery({
    queryKey: ['donations', 'list', year ?? 'all', month ?? 'all', fundType ?? 'all', memberId ?? 'all'],
    queryFn: async () => {
      const queryParams: any = { limit: 5000 };
      if (year) queryParams.year = year;
      if (month) queryParams.month = month;
      if (fundType) queryParams.fund_type = fundType;
      if (memberId) queryParams.member_id = memberId;

      const result = await supabaseApiService.offerings.getAll(queryParams);
      return Array.isArray(result) ? result : (result?.data || []);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
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
