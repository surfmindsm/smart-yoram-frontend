import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  Card,
  LoadingState,
  PageContainer,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui";
import { usePageSubtitle, usePageActions } from "../hooks/usePageSubtitle";
import { cn } from "../lib/utils";
import { supabaseAuthService } from '../services/supabaseAuthService';

interface AccountCategory {
  id: number;
  church_id: number;
  type: 'income' | 'expense';
  code: string;
  name: string;
  description?: string;
  parent_id?: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface BudgetVsActual {
  id: number;
  church_id: number;
  year: number;
  month: number | null;
  category_id: number;
  type: 'income' | 'expense';
  budgeted_amount: number;
  actual_amount: number;
  difference: number;
  execution_rate: number;
  notes?: string;
  category?: AccountCategory;
}

interface BudgetSummary {
  budget: {
    income: number;
    expense: number;
    net: number;
  };
  actual: {
    income: number;
    expense: number;
    net: number;
  };
  execution_rate: {
    income: number;
    expense: number;
  };
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ko-KR').format(Math.round(amount || 0));

const SettlementManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActual[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [analysisYear, setAnalysisYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    loadBudgetVsActual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisYear]);

  const loadBudgetVsActual = async () => {
    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const params = new URLSearchParams();
      params.append('year', analysisYear.toString());

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const functionsUrl = `${supabaseUrl}/functions/v1/budgets/admin/budgets/vs-actual?${params.toString()}`;

      const response = await fetch(functionsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBudgetVsActual(data.comparison || []);
        setBudgetSummary(data.summary || null);
      }
    } catch (error) {
      console.error('예산 대비 실적 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 정렬 및 그룹화: 수입 → 지출, 헌금 그룹화
  const rows = useMemo(() => {
    const offeringParentId = budgetVsActual.find(
      item => item.category?.name === '헌금' && !item.category.parent_id
    )?.category_id;

    const sorted = [...budgetVsActual].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
      const aChild = a.category?.parent_id === offeringParentId;
      const bChild = b.category?.parent_id === offeringParentId;
      if (aChild && !bChild) return -1;
      if (!aChild && bChild) return 1;
      return (a.category?.name || '').localeCompare(b.category?.name || '', 'ko-KR');
    });

    const result: Array<{ kind: 'parent' | 'child' | 'normal'; item: BudgetVsActual; aggBudget?: number; aggActual?: number; aggDiff?: number; aggRate?: number }> = [];
    const handledChildren = new Set<number>();

    sorted.forEach(item => {
      const isOfferingParent = item.category?.name === '헌금' && !item.category?.parent_id;
      if (isOfferingParent) {
        const children = sorted.filter(i => i.category?.parent_id === item.category_id);
        const aggBudget = children.reduce((s, i) => s + Number(i.budgeted_amount || 0), 0);
        const aggActual = children.reduce((s, i) => s + Number(i.actual_amount || 0), 0);
        const aggDiff = aggActual - aggBudget;
        const aggRate = aggBudget > 0 ? (aggActual / aggBudget) * 100 : (aggActual > 0 ? 999.9 : 0);
        result.push({ kind: 'parent', item, aggBudget, aggActual, aggDiff, aggRate });
        children.forEach(child => {
          handledChildren.add(child.category_id);
          result.push({ kind: 'child', item: child });
        });
        return;
      }
      if (item.category?.parent_id === offeringParentId && handledChildren.has(item.category_id)) return;
      if (item.category?.parent_id === offeringParentId) return;
      result.push({ kind: 'normal', item });
    });

    return result;
  }, [budgetVsActual]);

  // 상단바 슬롯
  usePageSubtitle(`${analysisYear}년 예산 대비 실적`);
  usePageActions(
    <Select value={analysisYear.toString()} onValueChange={(value) => setAnalysisYear(parseInt(value))}>
      <SelectTrigger className="h-9 w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
          <SelectItem key={year} value={year.toString()}>{year}년</SelectItem>
        ))}
      </SelectContent>
    </Select>,
    [analysisYear]
  );

  // 집행률 색상 — 중립 톤 (지출 초과시에만 경고)
  const rateColor = (rate: number, isExpense = false) => {
    if (isExpense && rate > 100) return '#DC2626'; // 지출 예산 초과만 경고
    return '#475569'; // 그 외 모두 중립 슬레이트
  };

  const renderRateBar = (rate: number, isExpense = false) => {
    const color = rateColor(rate, isExpense);
    return (
      <div className="flex flex-col items-end gap-1 min-w-[100px]">
        <span className="text-[12.5px] font-semibold tabular-nums" style={{ color }}>
          {rate.toFixed(1)}%
        </span>
        <div className="h-[6px] w-[100px] overflow-hidden rounded-full bg-[#F1F4F9]">
          <div
            className="h-full transition-all"
            style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color }}
          />
        </div>
      </div>
    );
  };

  const renderTypeBadge = (type: 'income' | 'expense') => (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        type === 'income' ? "bg-[#E7F6EC] text-[#16A34A]" : "bg-[#FCEBEB] text-[#DC2626]"
      )}
    >
      {type === 'income' ? '수입' : '지출'}
    </span>
  );

  return (
    <PageContainer>
      {/* 상단 통합 카드 */}
      {budgetSummary && (() => {
        const netBudget = budgetSummary.budget.net;
        const netActual = budgetSummary.actual.net;
        const isPositiveActual = netActual >= 0;
        return (
          <Card className="mb-4 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(280px,340px)_1fr]">
              {/* 좌측 — 순 실적 */}
              <div className={cn(
                "flex flex-col justify-center gap-2 border-b px-6 py-5 md:border-b-0 md:border-r",
                "border-[#EEF1F6]",
                isPositiveActual ? "bg-[#F4F8FF]" : "bg-[#FFF8EE]"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px]",
                    isPositiveActual ? "bg-[#EAF1FE] text-[#2563EB]" : "bg-[#FBF1E3] text-[#B45309]"
                  )}>
                    <DollarSign className="h-[16px] w-[16px]" />
                  </div>
                  <div className="text-[12px] font-semibold text-muted-foreground">순 실적</div>
                </div>
                <div className={cn(
                  "text-[26px] font-bold leading-tight tracking-[-0.02em] tabular-nums",
                  isPositiveActual ? "text-[#2563EB]" : "text-[#B45309]"
                )}>
                  ₩{formatCurrency(netActual)}
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  예산 순액 ₩{formatCurrency(netBudget)}
                </div>
              </div>

              {/* 우측 — 수입/지출 집행 현황 */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* 수입 */}
                <div className="border-b px-5 py-4 md:border-b-0 md:border-r border-[#EEF1F6]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#E7F6EC] text-[#16A34A]">
                      <TrendingUp className="h-[14px] w-[14px]" />
                    </div>
                    <div className="text-[12px] font-semibold text-muted-foreground">수입</div>
                    <span
                      className="ml-auto text-[14px] font-bold tabular-nums"
                      style={{ color: rateColor(budgetSummary.execution_rate.income) }}
                    >
                      {budgetSummary.execution_rate.income.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-1 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">예산</span>
                      <span className="font-medium tabular-nums">₩{formatCurrency(budgetSummary.budget.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">실적</span>
                      <span className="font-bold tabular-nums text-[#16A34A]">₩{formatCurrency(budgetSummary.actual.income)}</span>
                    </div>
                  </div>
                  <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-[#F1F4F9]">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(budgetSummary.execution_rate.income, 100)}%`,
                        backgroundColor: rateColor(budgetSummary.execution_rate.income),
                      }}
                    />
                  </div>
                </div>
                {/* 지출 */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FCEBEB] text-[#DC2626]">
                      <TrendingDown className="h-[14px] w-[14px]" />
                    </div>
                    <div className="text-[12px] font-semibold text-muted-foreground">지출</div>
                    <span
                      className="ml-auto text-[14px] font-bold tabular-nums"
                      style={{ color: rateColor(budgetSummary.execution_rate.expense, true) }}
                    >
                      {budgetSummary.execution_rate.expense.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-1 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">예산</span>
                      <span className="font-medium tabular-nums">₩{formatCurrency(budgetSummary.budget.expense)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">실적</span>
                      <span className="font-bold tabular-nums text-[#DC2626]">₩{formatCurrency(budgetSummary.actual.expense)}</span>
                    </div>
                  </div>
                  <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-[#F1F4F9]">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(budgetSummary.execution_rate.expense, 100)}%`,
                        backgroundColor: rateColor(budgetSummary.execution_rate.expense, true),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* 상세 테이블 */}
      <Card className="overflow-hidden">
        {loading ? (
          <LoadingState text="불러오는 중..." />
        ) : budgetVsActual.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-muted-foreground">
            예산 데이터가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">계정과목</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">구분</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">예산</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">실적</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">차액</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">집행률</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const { item } = row;
                  const isParent = row.kind === 'parent';
                  const isChild = row.kind === 'child';
                  const budget = isParent ? (row.aggBudget ?? 0) : Number(item.budgeted_amount || 0);
                  const actual = isParent ? (row.aggActual ?? 0) : Number(item.actual_amount || 0);
                  const difference = isParent ? (row.aggDiff ?? 0) : Number(item.difference || 0);
                  const rate = isParent ? (row.aggRate ?? 0) : Number(item.execution_rate || 0);
                  const isExpense = item.type === 'expense';

                  return (
                    <tr
                      key={`${row.kind}-${item.category_id}-${item.type}-${idx}`}
                      className={cn(
                        "border-b border-[#EEF1F6] transition-colors",
                        isParent ? "bg-[#F8FAFD]" : "hover:bg-[#F8FAFD]"
                      )}
                    >
                      <td className={cn(
                        "px-4 py-3 text-[13px]",
                        isParent ? "font-bold text-foreground" : isChild ? "pl-10 font-medium text-[#475569]" : "font-semibold text-foreground"
                      )}>
                        {isChild && <span className="mr-1.5 text-[12px] text-[#94A3B8]">└</span>}
                        {item.category?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {renderTypeBadge(item.type)}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] tabular-nums text-foreground">
                        ₩{formatCurrency(budget)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right text-[13px] font-bold tabular-nums",
                          item.type === 'income' ? "text-[#16A34A]" : "text-[#DC2626]"
                        )}
                      >
                        ₩{formatCurrency(actual)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right text-[13px] font-medium tabular-nums",
                          difference > 0 ? "text-[#16A34A]" : difference < 0 ? "text-[#DC2626]" : "text-muted-foreground"
                        )}
                      >
                        {difference > 0 ? '+' : ''}₩{formatCurrency(difference)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">{renderRateBar(rate, isExpense)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default SettlementManagement;
