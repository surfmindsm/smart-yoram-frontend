import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Save, Copy } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  LoadingState,
  PageContainer,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ConfirmDialog,
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

interface Budget {
  id: number;
  church_id: number;
  year: number;
  month: number | null;
  category_id: number;
  type: 'income' | 'expense';
  budgeted_amount: number;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  category?: AccountCategory;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ko-KR').format(Math.round(amount || 0));

const BudgetManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const [incomeCategories, setIncomeCategories] = useState<AccountCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<AccountCategory[]>([]);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetYear, setBudgetYear] = useState<number>(new Date().getFullYear());

  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);

  // 초기 1회: 카테고리 로딩 + 예산 로딩을 순차적으로 (race 방지)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { income, expense } = await fetchCategories();
      if (cancelled) return;
      setIncomeCategories(income);
      setExpenseCategories(expense);
      await loadBudgetsWithCategories(income, expense, budgetYear);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 연도 변경 시: 기존에 가진 카테고리로 예산만 다시 로딩
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (incomeCategories.length === 0 && expenseCategories.length === 0) return;
    loadBudgetsWithCategories(incomeCategories, expenseCategories, budgetYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetYear]);

  const fetchCategories = async (): Promise<{ income: AccountCategory[]; expense: AccountCategory[] }> => {
    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return { income: [], expense: [] };

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

      const [incomeResponse, expenseResponse] = await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/accounting/admin/categories?type=income`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${supabaseUrl}/functions/v1/accounting/admin/categories?type=expense`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        })
      ]);

      let income: AccountCategory[] = [];
      let expense: AccountCategory[] = [];

      if (incomeResponse.ok) {
        const data = await incomeResponse.json();
        income = Array.isArray(data) ? data : (data?.data || []);
      }
      if (expenseResponse.ok) {
        const data = await expenseResponse.json();
        expense = Array.isArray(data) ? data : (data?.data || []);
      }
      return { income, expense };
    } catch (error) {
      console.error('계정과목 로드 실패:', error);
      return { income: [], expense: [] };
    }
  };

  const loadBudgetsWithCategories = async (
    incomeCats: AccountCategory[],
    expenseCats: AccountCategory[],
    year: number
  ) => {
    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const params = new URLSearchParams();
      params.append('year', year.toString());

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const functionsUrl = `${supabaseUrl}/functions/v1/budgets/admin/budgets?${params.toString()}`;

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
        const annualBudgets = Array.isArray(data)
          ? data.filter(b => b.month === null)
          : [];

        // 사용자가 입력한 미저장 값을 유지: 현재 state에서 백엔드보다 큰 값을 가진 항목은 보존
        setBudgets(prevBudgets => {
          const allBudgets: Budget[] = [];

          const buildRow = (category: AccountCategory, type: 'income' | 'expense'): Budget => {
            const existing = annualBudgets.find(b => b.category_id === category.id && b.type === type);
            const prev = prevBudgets.find(b => b.category_id === category.id && b.type === type);
            const backendAmount = existing ? Number(existing.budgeted_amount) || 0 : 0;
            const prevAmount = prev ? Number(prev.budgeted_amount) || 0 : 0;
            // 사용자가 입력한 값(prev)이 백엔드(existing)와 다르면 사용자 입력 우선
            const finalAmount = prev && prevAmount !== backendAmount ? prevAmount : backendAmount;

            if (existing) {
              return { ...existing, budgeted_amount: finalAmount, category };
            }
            return {
              id: 0,
              church_id: 0,
              year,
              month: null,
              category_id: category.id,
              type,
              budgeted_amount: finalAmount,
              notes: prev?.notes || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              category,
            };
          };

          incomeCats.forEach(c => allBudgets.push(buildRow(c, 'income')));
          expenseCats.forEach(c => allBudgets.push(buildRow(c, 'expense')));

          return allBudgets;
        });
      }
    } catch (error) {
      console.error('예산 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgets = () => loadBudgetsWithCategories(incomeCategories, expenseCategories, budgetYear);

  const saveBudgets = async () => {
    if (!window.confirm('예산을 저장하시겠습니까?')) return;

    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

      // 헌금 상위 카테고리 ID 집계 (저장에서 제외)
      const offeringParentIds = new Set(
        incomeCategories
          .filter(c => c.name === '헌금' && !c.parent_id)
          .map(c => c.id)
      );

      const budgetData = budgets
        .filter(b => !offeringParentIds.has(b.category_id))
        .filter(b => b.budgeted_amount >= 0)
        .map(b => ({
          year: budgetYear,
          month: null,
          category_id: b.category_id,
          type: b.type,
          budgeted_amount: Number(b.budgeted_amount) || 0,
          notes: b.notes || null,
        }));

      if (budgetData.length === 0) {
        alert('저장할 예산이 없습니다.');
        setLoading(false);
        return;
      }

      const functionsUrl = `${supabaseUrl}/functions/v1/budgets/admin/budgets/upsert`;

      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData),
      });

      if (response.ok) {
        alert('예산이 저장되었습니다.');
        await loadBudgets();
      } else {
        const error = await response.json();
        alert(`예산 저장 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('예산 저장 실패:', error);
      alert('예산 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyPreviousYearBudget = async () => {
    try {
      setCopyLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const functionsUrl = `${supabaseUrl}/functions/v1/budgets/admin/budgets/copy-previous-year`;

      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_year: budgetYear - 1,
          to_year: budgetYear,
        }),
      });

      if (response.ok) {
        setCopyConfirmOpen(false);
        await loadBudgets();
        alert('전년도 예산이 복사되었습니다.');
      } else {
        const error = await response.json();
        alert(`예산 복사 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('예산 복사 실패:', error);
      alert('예산 복사 중 오류가 발생했습니다.');
    } finally {
      setCopyLoading(false);
    }
  };

  const updateBudgetAmount = (categoryId: number, type: 'income' | 'expense', amount: number) => {
    setBudgets(prev => {
      const existing = prev.find(b => b.category_id === categoryId && b.type === type);
      if (existing) {
        return prev.map(b =>
          b.category_id === categoryId && b.type === type
            ? { ...b, budgeted_amount: amount }
            : b
        );
      }
      return [...prev, {
        id: 0,
        church_id: 0,
        year: budgetYear,
        month: null,
        category_id: categoryId,
        type,
        budgeted_amount: amount,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];
    });
  };

  const totals = useMemo(() => {
    const income = budgets
      .filter(b => b.type === 'income')
      .reduce((sum, b) => sum + parseFloat(b.budgeted_amount?.toString() || '0'), 0);
    const expense = budgets
      .filter(b => b.type === 'expense')
      .reduce((sum, b) => sum + parseFloat(b.budgeted_amount?.toString() || '0'), 0);
    return { income, expense, net: income - expense };
  }, [budgets]);

  // 최신 saveBudgets / copyPreviousYearBudget를 ref로 보관 (usePageActions의 stale closure 방지)
  const saveBudgetsRef = useRef(saveBudgets);
  saveBudgetsRef.current = saveBudgets;

  // 상단바 슬롯
  usePageSubtitle(`${budgetYear}년 연간 예산`);
  usePageActions(
    <>
      <Select value={budgetYear.toString()} onValueChange={(value) => setBudgetYear(parseInt(value))}>
        <SelectTrigger className="h-9 w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
            <SelectItem key={year} value={year.toString()}>{year}년</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={() => setCopyConfirmOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={loading}
      >
        <Copy className="h-3.5 w-3.5" />
        전년도 복사
      </Button>
      <Button
        onClick={() => saveBudgetsRef.current()}
        size="sm"
        className="gap-2"
        disabled={loading}
      >
        <Save className="h-3.5 w-3.5" />
        저장
      </Button>
    </>,
    [budgetYear, loading]
  );

  const renderAmountInput = (
    categoryId: number,
    type: 'income' | 'expense',
    disabled = false,
    displayValue?: number
  ) => {
    const budget = budgets.find(b => b.category_id === categoryId && b.type === type);
    const rawValue = displayValue !== undefined ? displayValue : budget?.budgeted_amount;
    const numericValue = Number(rawValue) || 0;
    return (
      <div className="flex items-center gap-1.5">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={numericValue ? numericValue.toLocaleString('ko-KR') : ''}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, '');
            updateBudgetAmount(categoryId, type, digits ? Number(digits) : 0);
          }}
          disabled={disabled}
          className={cn(
            "h-8 w-[140px] text-right tabular-nums",
            disabled && "border-[#E3E8F0] bg-white font-semibold text-foreground disabled:cursor-default disabled:opacity-100"
          )}
        />
        <span className="text-[11.5px] text-muted-foreground">원</span>
      </div>
    );
  };

  const renderColumn = (
    type: 'income' | 'expense',
    title: string,
    icon: React.ReactNode,
    categories: AccountCategory[]
  ) => {
    const isIncome = type === 'income';
    const tone = isIncome
      ? { bg: '#E7F6EC', fg: '#16A34A', total: '#16A34A' }
      : { bg: '#FCEBEB', fg: '#DC2626', total: '#DC2626' };
    const total = isIncome ? totals.income : totals.expense;
    const parents = categories.filter(c => !c.parent_id);

    return (
      <Card className="overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F6] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: tone.bg, color: tone.fg }}
            >
              {icon}
            </div>
            <div className="text-[14px] font-bold leading-tight text-foreground">{title}</div>
          </div>
          <span
            className="text-[16px] font-bold tabular-nums"
            style={{ color: tone.total }}
          >
            ₩{formatCurrency(total)}
          </span>
        </div>

        {/* 리스트 */}
        {loading ? (
          <LoadingState text="불러오는 중..." />
        ) : parents.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-muted-foreground">
            등록된 계정과목이 없습니다.
          </div>
        ) : (
          <div>
            {parents.map((category) => {
              const children = categories.filter(c => c.parent_id === category.id);
              const isOfferingParent = isIncome && category.name === '헌금' && children.length > 0;

              if (isOfferingParent) {
                const childrenTotal = children.reduce((sum, child) => {
                  const b = budgets.find(b => b.category_id === child.id && b.type === 'income');
                  return sum + parseFloat(b?.budgeted_amount?.toString() || '0');
                }, 0);

                return (
                  <React.Fragment key={category.id}>
                    <div className="flex items-center justify-between gap-2 border-b border-[#EEF1F6] bg-[#F8FAFD] px-4 py-2.5">
                      <span className="text-[13.5px] font-semibold text-foreground">
                        {category.name}
                        <span className="ml-1.5 text-[11px] font-normal text-[#94A3B8]">(합계)</span>
                      </span>
                      {renderAmountInput(category.id, 'income', true, childrenTotal)}
                    </div>
                    {children.map(child => (
                      <div key={child.id} className="flex items-center justify-between gap-2 border-b border-[#EEF1F6] px-4 py-2 pl-10">
                        <span className="flex items-center gap-2 text-[13px] font-medium text-[#475569]">
                          <span className="text-[12px] text-[#94A3B8]">└</span>
                          {child.name}
                        </span>
                        {renderAmountInput(child.id, 'income')}
                      </div>
                    ))}
                  </React.Fragment>
                );
              }

              return (
                <div key={category.id} className="flex items-center justify-between gap-2 border-b border-[#EEF1F6] px-4 py-2.5">
                  <span className="text-[13.5px] font-semibold text-foreground">{category.name}</span>
                  {renderAmountInput(category.id, type)}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    );
  };

  const totalSum = totals.income + totals.expense;
  const incomeRatio = totalSum > 0 ? (totals.income / totalSum) * 100 : 0;
  const expenseRatio = totalSum > 0 ? (totals.expense / totalSum) * 100 : 0;
  const isPositive = totals.net >= 0;

  return (
    <PageContainer>
      {/* KPI 통합 카드 */}
      <Card className="mb-4 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(280px,360px)_1fr]">
          {/* 좌측 — 순 예산 */}
          <div className={cn(
            "flex flex-col justify-center gap-2 border-b px-6 py-5 md:border-b-0 md:border-r",
            "border-[#EEF1F6]",
            isPositive ? "bg-[#F4F8FF]" : "bg-[#FFF8EE]"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px]",
                isPositive ? "bg-[#EAF1FE] text-[#2563EB]" : "bg-[#FBF1E3] text-[#B45309]"
              )}>
                <DollarSign className="h-[16px] w-[16px]" />
              </div>
              <div className="text-[12px] font-semibold text-muted-foreground">순 예산</div>
            </div>
            <div className={cn(
              "text-[28px] font-bold leading-tight tracking-[-0.02em] tabular-nums",
              isPositive ? "text-[#2563EB]" : "text-[#B45309]"
            )}>
              ₩{formatCurrency(totals.net)}
            </div>
            <div className="text-[11px] text-[#94A3B8]">
              {budgetYear}년 연간 · 수입 − 지출
            </div>
          </div>

          {/* 우측 — 수입/지출 */}
          <div className="flex flex-col justify-center gap-3 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#E7F6EC] text-[#16A34A]">
                  <TrendingUp className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-muted-foreground">총 수입 예산</div>
                  <div className="truncate text-[20px] font-bold leading-tight tabular-nums text-[#16A34A]">
                    ₩{formatCurrency(totals.income)}
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">{incomeRatio.toFixed(0)}%</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FCEBEB] text-[#DC2626]">
                  <TrendingDown className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-muted-foreground">총 지출 예산</div>
                  <div className="truncate text-[20px] font-bold leading-tight tabular-nums text-[#DC2626]">
                    ₩{formatCurrency(totals.expense)}
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">{expenseRatio.toFixed(0)}%</div>
                </div>
              </div>
            </div>
            <div className="flex h-[8px] w-full overflow-hidden rounded-full bg-[#F1F4F9]">
              {totalSum > 0 && (
                <>
                  <div className="h-full bg-[#16A34A] transition-all" style={{ width: `${incomeRatio}%` }} />
                  <div className="h-full bg-[#DC2626] transition-all" style={{ width: `${expenseRatio}%` }} />
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 입력 컬럼 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderColumn(
          'income',
          '수입 예산',
          <TrendingUp className="h-[16px] w-[16px]" />,
          incomeCategories
        )}
        {renderColumn(
          'expense',
          '지출 예산',
          <TrendingDown className="h-[16px] w-[16px]" />,
          expenseCategories
        )}
      </div>

      {/* 전년도 복사 확인 모달 */}
      <ConfirmDialog
        open={copyConfirmOpen}
        onOpenChange={setCopyConfirmOpen}
        title={`${budgetYear - 1}년 예산을 ${budgetYear}년으로 복사`}
        description={
          <div className="space-y-2 text-[13px] leading-relaxed">
            <p>{budgetYear - 1}년에 입력된 모든 예산을 {budgetYear}년으로 복사합니다.</p>
            <div className="rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <div className="font-semibold text-destructive">
                ⚠️ {budgetYear}년에 이미 입력된 예산은 모두 덮어씌워집니다.
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                이 작업은 되돌릴 수 없습니다.
              </div>
            </div>
          </div>
        }
        confirmText="복사"
        variant="destructive"
        onConfirm={copyPreviousYearBudget}
        loading={copyLoading}
      />
    </PageContainer>
  );
};

export default BudgetManagement;
