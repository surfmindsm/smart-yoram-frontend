import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Card, CardContent } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { supabaseAuthService } from '../services/supabaseAuthService';
import { Spinner } from "./ui/spinner";

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

const BudgetManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // Categories
  const [incomeCategories, setIncomeCategories] = useState<AccountCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<AccountCategory[]>([]);

  // Budgets (연간 예산만 사용)
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetYear, setBudgetYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (incomeCategories.length > 0 || expenseCategories.length > 0) {
      loadBudgets();
    }
  }, [budgetYear, incomeCategories, expenseCategories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

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

      if (incomeResponse.ok) {
        const data = await incomeResponse.json();
        setIncomeCategories(Array.isArray(data) ? data : (data?.data || []));
      }
      if (expenseResponse.ok) {
        const data = await expenseResponse.json();
        setExpenseCategories(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (error) {
      console.error('계정과목 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const params = new URLSearchParams();
      params.append('year', budgetYear.toString());

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

        const allBudgets: Budget[] = [];

        // 수입 카테고리 (모든 항목 포함)
        incomeCategories.forEach(category => {
          const existing = annualBudgets.find(b => b.category_id === category.id && b.type === 'income');
          if (existing) {
            allBudgets.push(existing);
          } else {
            allBudgets.push({
              id: 0,
              church_id: 0,
              year: budgetYear,
              month: null,
              category_id: category.id,
              type: 'income',
              budgeted_amount: 0,
              notes: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              category: category,
            });
          }
        });

        // 지출 카테고리 (모든 항목 포함)
        expenseCategories.forEach(category => {
          const existing = annualBudgets.find(b => b.category_id === category.id && b.type === 'expense');
          if (existing) {
            allBudgets.push(existing);
          } else {
            allBudgets.push({
              id: 0,
              church_id: 0,
              year: budgetYear,
              month: null,
              category_id: category.id,
              type: 'expense',
              budgeted_amount: 0,
              notes: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              category: category,
            });
          }
        });

        setBudgets(allBudgets);
      }
    } catch (error) {
      console.error('예산 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBudgets = async () => {
    if (!window.confirm('예산을 저장하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

      const budgetData = budgets
        .filter(b => b.budgeted_amount >= 0)
        .map(b => ({
          year: budgetYear,
          month: null,
          category_id: b.category_id,
          type: b.type,
          budgeted_amount: b.budgeted_amount,
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
    if (!window.confirm(`${budgetYear - 1}년 예산을 ${budgetYear}년으로 복사하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
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
        alert('전년도 예산이 복사되었습니다.');
        await loadBudgets();
      } else {
        const error = await response.json();
        alert(`예산 복사 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('예산 복사 실패:', error);
      alert('예산 복사 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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
      } else {
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
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  return (
    <PageContainer>
      <PageHeader
        title="예산 관리"
        description="연간 예산을 편성하고 관리합니다."
      />

      <div className="space-y-4">
        {/* Budget Controls */}
        <Card className="border-muted">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">연도:</label>
                <Select value={budgetYear.toString()} onValueChange={(value) => setBudgetYear(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}년</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-gray-600">
                연간 예산
              </div>

              <div className="ml-auto flex gap-2">
                <Button onClick={copyPreviousYearBudget} variant="outline">
                  전년도 복사
                </Button>
                <Button onClick={saveBudgets}>
                  저장
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 수입 예산</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      budgets
                        .filter(b => b.type === 'income')
                        .reduce((sum, b) => sum + parseFloat(b.budgeted_amount.toString()), 0)
                    )}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 지출 예산</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(
                      budgets
                        .filter(b => b.type === 'expense')
                        .reduce((sum, b) => sum + parseFloat(b.budgeted_amount.toString()), 0)
                    )}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">순 예산 (수입 - 지출)</p>
                  <p className={`text-2xl font-bold ${
                    (budgets.filter(b => b.type === 'income').reduce((sum, b) => sum + parseFloat(b.budgeted_amount.toString()), 0) -
                     budgets.filter(b => b.type === 'expense').reduce((sum, b) => sum + parseFloat(b.budgeted_amount.toString()), 0)) >= 0
                      ? 'text-primary-600'
                      : 'text-orange-600'
                  }`}>
                    {formatCurrency(
                      budgets.filter(b => b.type === 'income').reduce((sum, b) => sum + parseFloat(b.budgeted_amount.toString()), 0) -
                      budgets.filter(b => b.type === 'expense').reduce((sum, b) => sum + parseFloat(b.budgeted_amount.toString()), 0)
                    )}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Input Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Budget */}
          <Card className="border-muted">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-green-700 mb-4">수입 예산</h3>
              {loading ? (
                <div className="text-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="space-y-2">
                  {incomeCategories
                    .filter(c => !c.parent_id)
                    .map(category => {
                      const children = incomeCategories.filter(c => c.parent_id === category.id);
                      const isOfferingCategory = category.name === '헌금';

                      // 헌금 카테고리인 경우: 하위 항목의 합계만 표시
                      if (isOfferingCategory && children.length > 0) {
                        const childrenTotal = children.reduce((sum, child) => {
                          const budget = budgets.find(b => b.category_id === child.id && b.type === 'income');
                          return sum + parseFloat(budget?.budgeted_amount?.toString() || '0');
                        }, 0);

                        return (
                          <div key={category.id} className="space-y-1">
                            {/* 헌금 상위 카테고리 - 입력 불가, 합계만 표시 */}
                            <div className="flex items-center gap-2">
                              <label className="text-sm flex-1 font-semibold text-gray-700">{category.name}</label>
                              <Input
                                type="number"
                                value={childrenTotal || ''}
                                disabled
                                className="w-40 text-right bg-gray-100 text-gray-600 font-medium"
                                readOnly
                              />
                              <span className="text-sm text-gray-500 w-8">원</span>
                            </div>

                            {/* 헌금 하위 카테고리 - 입력 가능 */}
                            {children.map(child => {
                              const budget = budgets.find(b => b.category_id === child.id && b.type === 'income');
                              return (
                                <div key={child.id} className="flex items-center gap-2 ml-4">
                                  <label className="text-sm flex-1 text-gray-600">∙ {child.name}</label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={budget?.budgeted_amount || ''}
                                    onChange={(e) => updateBudgetAmount(child.id, 'income', parseFloat(e.target.value) || 0)}
                                    className="w-40 text-right"
                                    min="0"
                                    step="10000"
                                  />
                                  <span className="text-sm text-gray-500 w-8">원</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      // 다른 카테고리들: 일반적으로 입력 가능
                      const budget = budgets.find(b => b.category_id === category.id && b.type === 'income');
                      return (
                        <div key={category.id} className="flex items-center gap-2">
                          <label className="text-sm flex-1">{category.name}</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={budget?.budgeted_amount || ''}
                            onChange={(e) => updateBudgetAmount(category.id, 'income', parseFloat(e.target.value) || 0)}
                            className="w-40 text-right"
                            min="0"
                            step="10000"
                          />
                          <span className="text-sm text-gray-500 w-8">원</span>
                        </div>
                      );
                    })
                  }
                  <div className="pt-3 border-t">
                    <div className="flex justify-between font-semibold text-green-700">
                      <span>합계</span>
                      <span>
                        {formatCurrency(
                          budgets
                            .filter(b => b.type === 'income')
                            .reduce((sum, b) => sum + parseFloat(b.budgeted_amount.toString()), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Budget */}
          <Card className="border-muted">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-red-700 mb-4">지출 예산</h3>
              {loading ? (
                <div className="text-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="space-y-2">
                  {expenseCategories
                    .filter(c => !c.parent_id)
                    .map(category => {
                      // 지출은 모든 카테고리가 입력 가능
                      const budget = budgets.find(b => b.category_id === category.id && b.type === 'expense');
                      return (
                        <div key={category.id} className="flex items-center gap-2">
                          <label className="text-sm flex-1">{category.name}</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={budget?.budgeted_amount || ''}
                            onChange={(e) => updateBudgetAmount(category.id, 'expense', parseFloat(e.target.value) || 0)}
                            className="w-40 text-right"
                            min="0"
                            step="10000"
                          />
                          <span className="text-sm text-gray-500 w-8">원</span>
                        </div>
                      );
                    })
                  }
                  <div className="pt-3 border-t">
                    <div className="flex justify-between font-semibold text-red-700">
                      <span>합계</span>
                      <span>
                        {formatCurrency(
                          budgets
                            .filter(b => b.type === 'expense')
                            .reduce((sum, b) => sum + parseFloat(b.budgeted_amount.toString()), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default BudgetManagement;
