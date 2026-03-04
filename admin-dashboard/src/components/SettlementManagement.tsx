import React, { useState, useEffect } from 'react';
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

const SettlementManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // Budget Analysis
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActual[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [analysisYear, setAnalysisYear] = useState<number>(new Date().getFullYear());
  const [analysisMonth, setAnalysisMonth] = useState<number | null>(null);

  useEffect(() => {
    loadBudgetVsActual();
  }, [analysisYear, analysisMonth]);

  const loadBudgetVsActual = async () => {
    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const params = new URLSearchParams();
      params.append('year', analysisYear.toString());
      if (analysisMonth) {
        params.append('month', analysisMonth.toString());
      }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  return (
    <PageContainer>
      <PageHeader
        title="결산 관리"
        description="예산 대비 실적을 분석하고 집행률을 확인합니다."
      />

      <div className="space-y-4">
        {/* Analysis Controls */}
        <Card className="border-muted">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">연도:</label>
                <Select value={analysisYear.toString()} onValueChange={(value) => setAnalysisYear(parseInt(value))}>
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
                연간 예산 대비 실적 분석
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {budgetSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-muted">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-4">수입 현황</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">예산</span>
                    <span className="font-medium">{formatCurrency(budgetSummary.budget.income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">실적</span>
                    <span className="font-medium text-green-600">{formatCurrency(budgetSummary.actual.income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">집행률</span>
                    <span className={`font-medium ${budgetSummary.execution_rate.income > 100 ? 'text-orange-600' : 'text-primary-600'}`}>
                      {budgetSummary.execution_rate.income.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${budgetSummary.execution_rate.income > 100 ? 'bg-orange-600' : 'bg-green-600'}`}
                      style={{ width: `${Math.min(budgetSummary.execution_rate.income, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-4">지출 현황</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">예산</span>
                    <span className="font-medium">{formatCurrency(budgetSummary.budget.expense)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">실적</span>
                    <span className="font-medium text-red-600">{formatCurrency(budgetSummary.actual.expense)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">집행률</span>
                    <span className={`font-medium ${budgetSummary.execution_rate.expense > 100 ? 'text-orange-600' : 'text-primary-600'}`}>
                      {budgetSummary.execution_rate.expense.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${budgetSummary.execution_rate.expense > 100 ? 'bg-orange-600' : 'bg-primary-600'}`}
                      style={{ width: `${Math.min(budgetSummary.execution_rate.expense, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Comparison Table */}
        {loading ? (
          <Card className="border-muted">
            <CardContent className="text-center py-12">
              <Spinner />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-muted">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">계정과목</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">구분</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">예산</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">실적</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">차액</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">집행률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {budgetVsActual
                      .sort((a, b) => {
                        if (a.type !== b.type) {
                          return a.type === 'income' ? -1 : 1;
                        }

                        // 헌금 카테고리의 parent_id 찾기
                        const offeringParentId = budgetVsActual.find(item =>
                          item.category?.name === '헌금' && !item.category.parent_id
                        )?.category_id;

                        // 헌금의 하위 항목들은 함께 그룹화
                        const aIsOfferingChild = a.category?.parent_id === offeringParentId;
                        const bIsOfferingChild = b.category?.parent_id === offeringParentId;

                        if (aIsOfferingChild && !bIsOfferingChild) return -1;
                        if (!aIsOfferingChild && bIsOfferingChild) return 1;

                        return (a.category?.name || '').localeCompare(b.category?.name || '', 'ko-KR');
                      })
                      .reduce((acc, item, index, array) => {
                        const isOfferingParent = item.category?.name === '헌금' && !item.category?.parent_id;

                        // 헌금 상위 항목인 경우, 하위 항목들의 합계 계산
                        if (isOfferingParent) {
                          const offeringChildren = array.filter(i => i.category?.parent_id === item.category_id);
                          const totalBudget = offeringChildren.reduce((sum, i) => sum + i.budgeted_amount, 0);
                          const totalActual = offeringChildren.reduce((sum, i) => sum + i.actual_amount, 0);
                          const totalDifference = totalActual - totalBudget;
                          const totalExecutionRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : (totalActual > 0 ? 999.9 : 0);

                          // 헌금 상위 카테고리 행 추가
                          acc.push(
                            <tr key={`parent_${item.category_id}_${item.type}`} className="bg-gray-50 font-semibold">
                              <td className="px-4 py-3 text-sm text-gray-900">{item.category?.name}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.type === 'income'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {item.type === 'income' ? '수입' : '지출'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                {formatCurrency(totalBudget)}
                              </td>
                              <td className={`px-4 py-3 text-sm text-right font-medium ${
                                item.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(totalActual)}
                              </td>
                              <td className={`px-4 py-3 text-sm text-right font-medium ${
                                totalDifference > 0 ? 'text-green-600' : totalDifference < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {totalDifference > 0 ? '+' : ''}{formatCurrency(totalDifference)}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`font-medium ${
                                    totalExecutionRate > 100 ? 'text-orange-600' : 'text-primary-600'
                                  }`}>
                                    {totalExecutionRate.toFixed(1)}%
                                  </span>
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        totalExecutionRate > 100 ? 'bg-orange-600' : 'bg-primary-600'
                                      }`}
                                      style={{ width: `${Math.min(totalExecutionRate, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );

                          // 헌금 하위 항목들 추가
                          offeringChildren.forEach(child => {
                            acc.push(
                              <tr key={`${child.category_id}_${child.type}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-600 pl-8">
                                  ∙ {child.category?.name || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    child.type === 'income'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {child.type === 'income' ? '수입' : '지출'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  {formatCurrency(child.budgeted_amount)}
                                </td>
                                <td className={`px-4 py-3 text-sm text-right font-medium ${
                                  child.type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(child.actual_amount)}
                                </td>
                                <td className={`px-4 py-3 text-sm text-right font-medium ${
                                  child.difference > 0 ? 'text-green-600' : child.difference < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {child.difference > 0 ? '+' : ''}{formatCurrency(child.difference)}
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`font-medium ${
                                      child.execution_rate > 100 ? 'text-orange-600' : 'text-primary-600'
                                    }`}>
                                      {child.execution_rate.toFixed(1)}%
                                    </span>
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          child.execution_rate > 100 ? 'bg-orange-600' : 'bg-primary-600'
                                        }`}
                                        style={{ width: `${Math.min(child.execution_rate, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        } else {
                          // 헌금의 하위 항목이 아니면서 상위 항목도 아닌 경우만 개별 표시
                          const offeringParentId = array.find(i =>
                            i.category?.name === '헌금' && !i.category?.parent_id
                          )?.category_id;

                          if (item.category?.parent_id !== offeringParentId) {
                            acc.push(
                              <tr key={`${item.category_id}_${item.type}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {item.category?.name || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    item.type === 'income'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {item.type === 'income' ? '수입' : '지출'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  {formatCurrency(item.budgeted_amount)}
                                </td>
                                <td className={`px-4 py-3 text-sm text-right font-medium ${
                                  item.type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(item.actual_amount)}
                                </td>
                                <td className={`px-4 py-3 text-sm text-right font-medium ${
                                  item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {item.difference > 0 ? '+' : ''}{formatCurrency(item.difference)}
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`font-medium ${
                                      item.execution_rate > 100 ? 'text-orange-600' : 'text-primary-600'
                                    }`}>
                                      {item.execution_rate.toFixed(1)}%
                                    </span>
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          item.execution_rate > 100 ? 'bg-orange-600' : 'bg-primary-600'
                                        }`}
                                        style={{ width: `${Math.min(item.execution_rate, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        }

                        return acc;
                      }, [] as React.ReactElement[])}
                  </tbody>
                </table>
                {budgetVsActual.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    예산 데이터가 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default SettlementManagement;
