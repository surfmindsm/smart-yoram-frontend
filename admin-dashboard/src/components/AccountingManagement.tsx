import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Card, CardContent } from "./ui";
import { SimpleTabs } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { Spinner } from "./ui/spinner";

interface AccountCategory {
  id: number;
  church_id: number;
  type: 'income' | 'expense';
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: number;
  church_id: number;
  category_id: number;
  transaction_date: string;
  type: 'income' | 'expense';
  amount: number;
  vendor_name?: string;
  payment_method?: string;
  description?: string;
  created_at: string;
  category?: AccountCategory;
}

interface Summary {
  total_income: number;
  total_expense: number;
  net: number;
  income_count: number;
  expense_count: number;
}

const AccountingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'categories'>('transactions');
  const [loading, setLoading] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Categories
  const [incomeCategories, setIncomeCategories] = useState<AccountCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<AccountCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingType, setAddingType] = useState<'income' | 'expense' | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
      loadSummary();
    } else {
      loadCategories();
    }
  }, [activeTab, typeFilter, startDate, endDate]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const functionsUrl = `${supabaseUrl}/functions/v1/accounting/admin/transactions?${params.toString()}`;

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
        setTransactions(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (error) {
      console.error('거래 내역 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const functionsUrl = `${supabaseUrl}/functions/v1/accounting/admin/transactions/summary?${params.toString()}`;

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
        setSummary(data);
      }
    } catch (error) {
      console.error('요약 정보 로드 실패:', error);
    }
  };

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

  const addCategory = async (type: 'income' | 'expense') => {
    if (!newCategoryName.trim()) {
      alert('계정과목 이름을 입력해주세요.');
      return;
    }

    try {
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/accounting/admin/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          type: type,
          is_active: true,
        }),
      });

      if (response.ok) {
        setNewCategoryName('');
        setAddingType(null);
        await loadCategories();
      } else {
        const error = await response.json();
        alert(`계정과목 추가 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('계정과목 추가 실패:', error);
      alert('계정과목 추가 중 오류가 발생했습니다.');
    }
  };

  const deleteCategory = async (id: number) => {
    if (!window.confirm('이 계정과목을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/accounting/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await loadCategories();
      } else {
        const error = await response.json();
        alert(`계정과목 삭제 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('계정과목 삭제 실패:', error);
      alert('계정과목 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const filteredTransactions = transactions.filter(t => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        t.vendor_name?.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.category?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <PageContainer>
      <PageHeader
        title="회계 관리"
        description="교회 수입/지출 내역을 관리하고 재정 상태를 확인합니다."
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 수입</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_income)}</p>
                  <p className="text-xs text-gray-500 mt-1">{summary.income_count}건</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 지출</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_expense)}</p>
                  <p className="text-xs text-gray-500 mt-1">{summary.expense_count}건</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">순 수익</p>
                  <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(summary.net)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">수입 - 지출</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <SimpleTabs
        tabs={[
          {
            id: 'transactions',
            label: '거래 내역',
            icon: <DollarSign className="w-4 h-4" />
          },
          {
            id: 'categories',
            label: '계정과목 관리',
            icon: <Edit className="w-4 h-4" />
          }
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'transactions' | 'categories')}
        variant="default"
        className="mb-6"
      />

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="거래처, 내용 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="income">수입</SelectItem>
                <SelectItem value="expense">지출</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">조회 기간:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36 h-8"
              />
              <span className="text-gray-500">~</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36 h-8"
              />
            </div>
          </div>

          {/* Transactions Table */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner />
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">구분</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">계정과목</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">거래처</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">내용</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">금액</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">결제수단</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(transaction.transaction_date)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'income'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type === 'income' ? '수입' : '지출'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.category?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.vendor_name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {transaction.description || '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-medium ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {transaction.payment_method || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTransactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      거래 내역이 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Categories */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-700">수입 계정과목</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddingType(addingType === 'income' ? null : 'income')}
                  className="text-gray-900 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </Button>
              </div>

              {addingType === 'income' && (
                <div className="mb-4 flex gap-2">
                  <Input
                    placeholder="계정과목 이름"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCategory('income')}
                  />
                  <Button onClick={() => addCategory('income')} size="sm">
                    저장
                  </Button>
                  <Button onClick={() => { setAddingType(null); setNewCategoryName(''); }} variant="outline" size="sm">
                    취소
                  </Button>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : (
                <div className="divide-y">
                  {incomeCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between py-3 group hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        {category.code && <p className="text-sm text-gray-500">{category.code}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory(category.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {incomeCategories.length === 0 && (
                    <p className="text-center text-gray-500 py-4">등록된 수입 계정과목이 없습니다.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-700">지출 계정과목</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddingType(addingType === 'expense' ? null : 'expense')}
                  className="text-gray-900 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </Button>
              </div>

              {addingType === 'expense' && (
                <div className="mb-4 flex gap-2">
                  <Input
                    placeholder="계정과목 이름"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCategory('expense')}
                  />
                  <Button onClick={() => addCategory('expense')} size="sm">
                    저장
                  </Button>
                  <Button onClick={() => { setAddingType(null); setNewCategoryName(''); }} variant="outline" size="sm">
                    취소
                  </Button>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : (
                <div className="divide-y">
                  {expenseCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between py-3 group hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        {category.code && <p className="text-sm text-gray-500">{category.code}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory(category.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {expenseCategories.length === 0 && (
                    <p className="text-center text-gray-500 py-4">등록된 지출 계정과목이 없습니다.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};

export default AccountingManagement;
