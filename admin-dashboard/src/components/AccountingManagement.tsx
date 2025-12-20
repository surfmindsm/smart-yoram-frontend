import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, DollarSign, TrendingUp, TrendingDown, Download, X } from 'lucide-react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Card, CardContent } from "./ui";
import { SimpleTabs } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { DateRangePicker } from "./ui";
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { Spinner } from "./ui/spinner";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

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

const AccountingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'budgets' | 'budget-analysis' | 'categories'>('transactions');
  const [loading, setLoading] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Categories
  const [incomeCategories, setIncomeCategories] = useState<AccountCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<AccountCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingType, setAddingType] = useState<'income' | 'expense' | null>(null);

  // Budgets (연간 예산만 사용)
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetYear, setBudgetYear] = useState<number>(new Date().getFullYear());

  // Budget Analysis
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActual[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [analysisYear, setAnalysisYear] = useState<number>(new Date().getFullYear());
  const [analysisMonth, setAnalysisMonth] = useState<number | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Add Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    category_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    amount: '',
    vendor_name: '',
    payment_method: '',
    description: '',
  });

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
      loadSummary();
    } else if (activeTab === 'categories') {
      loadCategories();
    }
  }, [activeTab, typeFilter, dateRange]);

  useEffect(() => {
    if (activeTab === 'budgets') {
      loadBudgets();
      loadCategories(); // 예산 편성 시 필요
    }
  }, [activeTab, budgetYear]);

  useEffect(() => {
    if (activeTab === 'budget-analysis') {
      loadBudgetVsActual();
    }
  }, [activeTab, analysisYear, analysisMonth]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (dateRange?.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange?.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));

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
      if (dateRange?.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange?.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));

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

  const addTransaction = async () => {
    // Validation
    if (!newTransaction.category_id) {
      alert('계정과목을 선택해주세요.');
      return;
    }
    if (!newTransaction.amount || parseFloat(newTransaction.amount) <= 0) {
      alert('금액을 입력해주세요.');
      return;
    }
    if (!newTransaction.transaction_date) {
      alert('거래 날짜를 입력해주세요.');
      return;
    }

    try {
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/accounting/admin/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newTransaction.type,
          category_id: parseInt(newTransaction.category_id),
          transaction_date: newTransaction.transaction_date,
          amount: parseFloat(newTransaction.amount),
          vendor_name: newTransaction.vendor_name || null,
          payment_method: newTransaction.payment_method || null,
          description: newTransaction.description || null,
        }),
      });

      if (response.ok) {
        alert('거래 내역이 추가되었습니다.');
        setShowAddModal(false);
        // Reset form
        setNewTransaction({
          type: 'expense',
          category_id: '',
          transaction_date: new Date().toISOString().split('T')[0],
          amount: '',
          vendor_name: '',
          payment_method: '',
          description: '',
        });
        await loadTransactions();
        await loadSummary();
      } else {
        const error = await response.json();
        alert(`거래 내역 추가 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('거래 내역 추가 실패:', error);
      alert('거래 내역 추가 중 오류가 발생했습니다.');
    }
  };

  // Budget functions (연간 예산만 조회)
  const loadBudgets = async () => {
    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const params = new URLSearchParams();
      params.append('year', budgetYear.toString());
      // month는 전달하지 않음 (연간 예산만)

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
        // month가 null인 연간 예산만 필터링
        const annualBudgets = Array.isArray(data)
          ? data.filter(b => b.month === null)
          : [];

        // 모든 부모 계정과목에 대해 예산이 없으면 0으로 초기화
        const allBudgets: Budget[] = [];

        // 수입 카테고리
        incomeCategories.filter(c => !c.parent_id).forEach(category => {
          const existing = annualBudgets.find(b => b.category_id === category.id && b.type === 'income');
          if (existing) {
            allBudgets.push(existing);
          } else {
            // 예산이 없으면 0으로 초기화
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

        // 지출 카테고리
        expenseCategories.filter(c => !c.parent_id).forEach(category => {
          const existing = annualBudgets.find(b => b.category_id === category.id && b.type === 'expense');
          if (existing) {
            allBudgets.push(existing);
          } else {
            // 예산이 없으면 0으로 초기화
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

  const saveBudgets = async () => {
    if (!window.confirm('예산을 저장하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

      // 저장할 예산 데이터 준비 (모든 계정과목, 금액 0 포함)
      const budgetData = budgets
        .filter(b => b.budgeted_amount >= 0) // 0 이상 (0 포함)
        .map(b => ({
          year: budgetYear,
          month: null, // 연간 예산만 사용
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

      // UPSERT 방식으로 저장 (충돌 시 업데이트)
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
        // 새로운 예산 항목 추가 (연간 예산만)
        return [...prev, {
          id: 0, // 임시 ID
          church_id: 0,
          year: budgetYear,
          month: null, // 연간 예산만
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getPaymentMethodLabel = (method: string | null | undefined) => {
    if (!method) return '-';
    const labels: { [key: string]: string } = {
      'cash': '현금',
      'transfer': '계좌이체',
      'card': '카드',
      'other': '기타',
    };
    return labels[method] || method;
  };

  const exportToExcel = async () => {
    // 예산 데이터 로드 (현재 연도)
    const token = await supabaseAuthService.getToken();
    if (!token) return;

    const currentYear = new Date().getFullYear();

    // 예산 데이터 가져오기
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const budgetUrl = `${supabaseUrl}/functions/v1/budgets/admin/budgets?year=${currentYear}`;
    const budgetVsActualUrl = `${supabaseUrl}/functions/v1/budgets/admin/budgets/vs-actual?year=${currentYear}`;

    let budgetData: any[] = [];
    let budgetVsActualData: any[] = [];

    try {
      const [budgetResponse, vsActualResponse] = await Promise.all([
        fetch(budgetUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }),
        fetch(budgetVsActualUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (budgetResponse.ok) {
        budgetData = await budgetResponse.json();
      }

      if (vsActualResponse.ok) {
        const vsActualJson = await vsActualResponse.json();
        budgetVsActualData = vsActualJson.comparison || [];
      }
    } catch (error) {
      console.error('예산 데이터 로드 실패:', error);
    }

    // 엑셀로 내보낼 데이터 준비
    const excelData = filteredTransactions.map((transaction) => ({
      '날짜': formatDate(transaction.transaction_date),
      '구분': transaction.type === 'income' ? '수입' : '지출',
      '계정과목': transaction.category?.name || '-',
      '거래처': transaction.vendor_name || '-',
      '내용': transaction.description || '-',
      '금액': transaction.amount,
      '결제수단': getPaymentMethodLabel(transaction.payment_method),
    }));

    // 요약 정보 추가
    const summaryData = [
      { '항목': '총 수입', '금액': summary?.total_income || 0, '건수': summary?.income_count || 0 },
      { '항목': '총 지출', '금액': summary?.total_expense || 0, '건수': summary?.expense_count || 0 },
      { '항목': '순 수익', '금액': summary?.net || 0, '건수': '' },
    ];

    // 예산 데이터
    const budgetSheetData = budgetData.map((b: any) => ({
      '연도': b.year,
      '월': b.month || '연간',
      '구분': b.type === 'income' ? '수입' : '지출',
      '계정과목': b.category?.name || '-',
      '예산액': b.budgeted_amount,
      '비고': b.notes || '',
    }));

    // 예산 대비 실적 데이터
    const budgetVsActualSheetData = budgetVsActualData.map((item: any) => ({
      '계정과목': item.category?.name || '-',
      '구분': item.type === 'income' ? '수입' : '지출',
      '예산액': item.budgeted_amount,
      '실행액': item.actual_amount,
      '차액': item.difference,
      '집행률(%)': item.execution_rate.toFixed(1),
    }));

    // 워크북 생성
    const wb = XLSX.utils.book_new();

    // 거래 내역 시트 생성
    const ws1 = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws1, '거래내역');

    // 요약 시트 생성
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, '요약');

    // 예산 시트 생성
    if (budgetSheetData.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(budgetSheetData);
      XLSX.utils.book_append_sheet(wb, ws3, '예산');
    }

    // 예산 대비 실적 시트 생성
    if (budgetVsActualSheetData.length > 0) {
      const ws4 = XLSX.utils.json_to_sheet(budgetVsActualSheetData);
      XLSX.utils.book_append_sheet(wb, ws4, '예산대비실적');
    }

    // 파일명 생성 (날짜 포함)
    const today = new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '');
    const fileName = `회계자료_${today}.xlsx`;

    // 엑셀 파일 생성 및 다운로드
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
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

      {/* Global Filters */}
      <div className="flex items-center gap-4 mb-6">
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
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

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
                  <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-primary-600' : 'text-orange-600'}`}>
                    {formatCurrency(summary.net)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">수입 - 지출</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary-600" />
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
            id: 'budgets',
            label: '예산 편성',
            icon: <TrendingUp className="w-4 h-4" />
          },
          {
            id: 'budget-analysis',
            label: '예산 대비 실적',
            icon: <TrendingDown className="w-4 h-4" />
          },
          {
            id: 'categories',
            label: '계정과목 관리',
            icon: <Edit className="w-4 h-4" />
          }
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'transactions' | 'budgets' | 'budget-analysis' | 'categories')}
        variant="default"
        className="mb-6"
      />

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Search and Actions */}
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
            <Button
              onClick={exportToExcel}
              variant="outline"
              className="whitespace-nowrap"
              disabled={filteredTransactions.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              엑셀 다운로드
            </Button>
            <Button
              onClick={() => {
                // 계정과목 목록 미리 로드
                if (incomeCategories.length === 0 && expenseCategories.length === 0) {
                  loadCategories();
                }
                setShowAddModal(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              거래 내역 추가
            </Button>
          </div>

          {/* Transactions Table */}
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                  <p className="text-gray-600">거래 내역을 불러오는 중...</p>
                </div>
              </CardContent>
            </Card>
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
                            {getPaymentMethodLabel(transaction.payment_method)}
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

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          {/* Budget Controls */}
          <Card>
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
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">총 수입 예산</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(
                        budgets
                          .filter(b => b.type === 'income')
                          .reduce((sum, b) => sum + parseFloat(b.budgeted_amount.toString()), 0)
                      )}
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">총 지출 예산</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(
                        budgets
                          .filter(b => b.type === 'expense')
                          .reduce((sum, b) => sum + parseFloat(b.budgeted_amount.toString()), 0)
                      )}
                    </p>
                  </div>
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">순 예산 (수입 - 지출)</p>
                    <p className={`text-xl font-bold ${
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
                  <DollarSign className="w-6 h-6 text-primary-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Input Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Budget */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-green-700 mb-4">수입 예산</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomeCategories.filter(c => !c.parent_id).map(category => {
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
                    })}
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
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-red-700 mb-4">지출 예산</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenseCategories.filter(c => !c.parent_id).map(category => {
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
                    })}
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
      )}

      {/* Budget Analysis Tab */}
      {activeTab === 'budget-analysis' && (
        <div className="space-y-4">
          {/* Analysis Controls */}
          <Card>
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
              <Card>
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

              <Card>
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
            <Card>
              <CardContent className="text-center py-12">
                <Spinner />
              </CardContent>
            </Card>
          ) : (
            <Card>
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
                          // 1. type으로 정렬 (income이 먼저, expense가 나중)
                          if (a.type !== b.type) {
                            return a.type === 'income' ? -1 : 1;
                          }
                          // 2. 같은 type 내에서는 카테고리 이름으로 정렬
                          return (a.category?.name || '').localeCompare(b.category?.name || '', 'ko-KR');
                        })
                        .map((item) => (
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
                      ))}
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
                <div className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    <p className="text-sm text-gray-600">불러오는 중...</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {incomeCategories.filter(c => !c.parent_id).map((category) => (
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
                  {incomeCategories.filter(c => !c.parent_id).length === 0 && (
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
                <div className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    <p className="text-sm text-gray-600">불러오는 중...</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {expenseCategories.filter(c => !c.parent_id).map((category) => (
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
                  {expenseCategories.filter(c => !c.parent_id).length === 0 && (
                    <p className="text-center text-gray-500 py-4">등록된 지출 계정과목이 없습니다.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Transaction Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>거래 내역 추가</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* 거래 유형 */}
            <div className="space-y-2">
              <Label>거래 유형</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={newTransaction.type === 'income'}
                    onChange={(e) => setNewTransaction({ ...newTransaction, type: 'income', category_id: '' })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-green-700">수입</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={newTransaction.type === 'expense'}
                    onChange={(e) => setNewTransaction({ ...newTransaction, type: 'expense', category_id: '' })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-red-700">지출</span>
                </label>
              </div>
            </div>

            {/* 계정과목 */}
            <div className="space-y-2">
              <Label htmlFor="category_id">계정과목 *</Label>
              <select
                id="category_id"
                value={newTransaction.category_id}
                onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">계정과목 선택</option>
                {(newTransaction.type === 'income' ? incomeCategories : expenseCategories)
                  .filter(c => !c.parent_id)  // 부모 카테고리만 선택 가능 (예산과 일치)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* 거래 날짜 */}
            <div className="space-y-2">
              <Label htmlFor="transaction_date">거래 날짜 *</Label>
              <Input
                id="transaction_date"
                type="date"
                value={newTransaction.transaction_date}
                onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
              />
            </div>

            {/* 금액 */}
            <div className="space-y-2">
              <Label htmlFor="amount">금액 (원) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                min="0"
                step="1000"
              />
            </div>

            {/* 거래처 */}
            <div className="space-y-2">
              <Label htmlFor="vendor_name">거래처</Label>
              <Input
                id="vendor_name"
                placeholder="거래처 이름"
                value={newTransaction.vendor_name}
                onChange={(e) => setNewTransaction({ ...newTransaction, vendor_name: e.target.value })}
              />
            </div>

            {/* 결제수단 */}
            <div className="space-y-2">
              <Label htmlFor="payment_method">결제수단</Label>
              <select
                id="payment_method"
                value={newTransaction.payment_method}
                onChange={(e) => setNewTransaction({ ...newTransaction, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">선택</option>
                <option value="cash">현금</option>
                <option value="transfer">계좌이체</option>
                <option value="card">카드</option>
                <option value="other">기타</option>
              </select>
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="description">내용</Label>
              <Textarea
                id="description"
                placeholder="거래 내용을 입력하세요"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={addTransaction}
              >
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default AccountingManagement;
