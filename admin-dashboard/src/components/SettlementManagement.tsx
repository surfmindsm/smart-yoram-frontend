import React, { useState, useMemo } from 'react';
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
import { useBudgetVsActual } from "../hooks/queries";
import { cn } from "../lib/utils";

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
  const [analysisYear, setAnalysisYear] = useState<number>(new Date().getFullYear());
  const budgetVsActualQuery = useBudgetVsActual(analysisYear);
  const loading = budgetVsActualQuery.isLoading;
  const budgetVsActual: BudgetVsActual[] = budgetVsActualQuery.data?.comparison ?? [];
  const budgetSummary: BudgetSummary | null = budgetVsActualQuery.data?.summary ?? null;

  // 정렬 및 그룹화 (type 별 분리)
  type Row = { kind: 'parent' | 'child' | 'normal'; item: BudgetVsActual; aggBudget?: number; aggActual?: number; aggDiff?: number; aggRate?: number };

  const buildRows = (type: 'income' | 'expense', items: BudgetVsActual[]): Row[] => {
    const offeringParentId = items.find(
      i => i.category?.name === '헌금' && !i.category.parent_id
    )?.category_id;

    const sorted = [...items].sort((a, b) => {
      const aChild = a.category?.parent_id === offeringParentId;
      const bChild = b.category?.parent_id === offeringParentId;
      if (aChild && !bChild) return -1;
      if (!aChild && bChild) return 1;
      return (a.category?.name || '').localeCompare(b.category?.name || '', 'ko-KR');
    });

    const result: Row[] = [];
    const handledChildren = new Set<number>();

    sorted.forEach(item => {
      const isOfferingParent = type === 'income' && item.category?.name === '헌금' && !item.category?.parent_id;
      if (isOfferingParent) {
        const children = sorted.filter(i => i.category?.parent_id === item.category_id);
        const aggBudget = children.reduce((s, i) => s + Number(i.budgeted_amount || 0), 0);
        const aggActual = children.reduce((s, i) => s + Number(i.actual_amount || 0), 0);
        // 수입: 실적 − 예산 (많이 받을수록 +), 지출: 예산 − 실적 (적게 쓸수록 +)
        const aggDiff = type === 'income' ? (aggActual - aggBudget) : (aggBudget - aggActual);
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
  };

  const incomeRows = useMemo(
    () => buildRows('income', budgetVsActual.filter(i => i.type === 'income')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [budgetVsActual]
  );
  const expenseRows = useMemo(
    () => buildRows('expense', budgetVsActual.filter(i => i.type === 'expense')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [budgetVsActual]
  );

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
      <div className="flex flex-col items-end gap-1">
        <span className="text-[12.5px] tabular-nums" style={{ color }}>
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

  const renderTable = (
    type: 'income' | 'expense',
    title: string,
    rows: Row[],
    total: { budget: number; actual: number }
  ) => {
    const tone = type === 'income'
      ? { bg: '#E7F6EC', fg: '#16A34A', icon: <TrendingUp className="h-[16px] w-[16px]" /> }
      : { bg: '#FCEBEB', fg: '#DC2626', icon: <TrendingDown className="h-[16px] w-[16px]" /> };
    const isExpense = type === 'expense';

    return (
      <Card className="overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F6] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: tone.bg, color: tone.fg }}
            >
              {tone.icon}
            </div>
            <div className="text-[14px] font-bold leading-tight text-foreground">{title}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground">실적 / 예산</div>
            <div className="text-[14px] font-bold tabular-nums" style={{ color: tone.fg }}>
              {formatCurrency(total.actual)}
              <span className="ml-1 text-[11.5px] text-muted-foreground"> / {formatCurrency(total.budget)}</span>
            </div>
          </div>
        </div>

        {/* 테이블 */}
        {rows.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-muted-foreground">
            데이터가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[140px]" />
                <col className="w-[130px]" />
                <col className="w-[130px]" />
                <col className="w-[130px]" />
                <col className="w-[140px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">계정과목</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">예산</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">실적</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">차액</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">집행률</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const { item } = row;
                  const isParent = row.kind === 'parent';
                  const isChild = row.kind === 'child';
                  const budget = isParent ? (row.aggBudget ?? 0) : Number(item.budgeted_amount || 0);
                  const actual = isParent ? (row.aggActual ?? 0) : Number(item.actual_amount || 0);
                  const rawDiff = isParent ? (row.aggDiff ?? 0) : Number(item.difference || 0);
                  // 백엔드 difference는 actual-budget. 지출은 부호 뒤집어서 "예산 - 실적"으로 표시
                  const difference = isParent ? rawDiff : (type === 'income' ? rawDiff : -rawDiff);
                  const rate = isParent ? (row.aggRate ?? 0) : Number(item.execution_rate || 0);

                  return (
                    <tr
                      key={`${row.kind}-${item.category_id}-${item.type}-${idx}`}
                      className={cn(
                        "border-b border-[#EEF1F6] transition-colors",
                        isParent ? "bg-[#F8FAFD]" : "hover:bg-[#F8FAFD]"
                      )}
                    >
                      <td
                        className={cn(
                          "px-4 py-2.5 text-[13px]",
                          isParent ? "font-bold text-foreground" : isChild ? "pl-10 text-[#475569]" : "text-foreground"
                        )}
                        title={item.category?.name || '-'}
                      >
                        <div className="truncate">
                          {isChild && <span className="mr-1.5 text-[12px] text-[#94A3B8]">└</span>}
                          {item.category?.name || '-'}
                        </div>
                      </td>
                      <td className={cn(
                        "px-4 py-2.5 text-right text-[13px] tabular-nums text-foreground",
                        isParent && "font-bold"
                      )}>
                        {formatCurrency(budget)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right text-[13px] tabular-nums",
                          isParent && "font-bold",
                          type === 'income' ? "text-[#16A34A]" : "text-[#DC2626]"
                        )}
                      >
                        {formatCurrency(actual)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right text-[13px] tabular-nums",
                          isParent && "font-bold",
                          difference > 0 ? "text-[#16A34A]" : difference < 0 ? "text-[#DC2626]" : "text-muted-foreground"
                        )}
                      >
                        {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                      </td>
                      <td className="px-4 py-2.5">
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
    );
  };

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
                  {formatCurrency(netActual)}
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  예산 순액 {formatCurrency(netBudget)}
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
                      <span className="font-medium tabular-nums">{formatCurrency(budgetSummary.budget.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">실적</span>
                      <span className="font-bold tabular-nums text-[#16A34A]">{formatCurrency(budgetSummary.actual.income)}</span>
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
                      <span className="font-medium tabular-nums">{formatCurrency(budgetSummary.budget.expense)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">실적</span>
                      <span className="font-bold tabular-nums text-[#DC2626]">{formatCurrency(budgetSummary.actual.expense)}</span>
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

      {/* 상세 테이블 — 수입/지출 분리 */}
      {loading ? (
        <Card>
          <LoadingState text="불러오는 중..." />
        </Card>
      ) : budgetVsActual.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-[13px] text-muted-foreground">
            예산 데이터가 없습니다.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {renderTable('income', '수입 예산 대비 실적', incomeRows, {
            budget: budgetSummary?.budget.income ?? 0,
            actual: budgetSummary?.actual.income ?? 0,
          })}
          {renderTable('expense', '지출 예산 대비 실적', expenseRows, {
            budget: budgetSummary?.budget.expense ?? 0,
            actual: budgetSummary?.actual.expense ?? 0,
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default SettlementManagement;
