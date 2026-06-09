import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, DollarSign, TrendingUp, TrendingDown, Download, X, ChevronDown, Upload, Image as ImageIcon, FileText, Eye, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Card, CardContent, LoadingState } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { PageContainer } from "./ui";
import { usePageSubtitle, usePageActions } from '../hooks/usePageSubtitle';
import { DatePicker } from "./ui/date-picker";
import { DateRangePicker } from "./ui";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { supabase } from '../lib/supabase';
import { Spinner } from "./ui/spinner";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Pagination } from './common/Pagination';
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
  receipt_url?: string; // 하위 호환성을 위해 유지
  receipt_urls?: string[]; // 여러 영수증 지원
  receipt_file?: string; // 백엔드에서 사용하는 필드명 (단일)
  receipt_files?: string; // 백엔드에서 사용하는 필드명 (JSON 문자열)
  receipt_metadata?: ReceiptFile[]; // 파일명 정보 포함
  created_at: string;
  category?: AccountCategory;
}

interface ReceiptFile {
  url: string;
  filename: string;
}

interface Summary {
  total_income: number;
  total_expense: number;
  net: number;
  income_count: number;
  expense_count: number;
}

const AccountingManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Categories (for transaction modal)
  const [incomeCategories, setIncomeCategories] = useState<AccountCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<AccountCategory[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Add/Edit Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    category_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    amount: '',
    vendor_name: '',
    payment_method: '',
    description: '',
  });

  // Receipt Upload
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Receipt Preview Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentReceiptIndex, setCurrentReceiptIndex] = useState(0);
  const [previewReceipts, setPreviewReceipts] = useState<ReceiptFile[]>([]);

  // Delete Confirmation Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null);

  useEffect(() => {
    loadTransactions();
    loadSummary();
  }, [typeFilter, dateRange]);

  // 검색어나 필터 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (typeFilter.length === 1) params.append('type', typeFilter[0]);
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
        console.log('🔍 백엔드 응답 데이터:', data);

        // receipt_files를 receipt_urls로 매핑
        const transactions = (Array.isArray(data) ? data : (data?.data || [])).map((t: any) => {
          console.log('🔍 거래 내역:', {
            id: t.id,
            receipt_files: t.receipt_files,
            receipt_file: t.receipt_file,
            receipt_url: t.receipt_url
          });

          let receiptUrls: string[] = [];
          let receiptFiles: ReceiptFile[] = [];

          // receipt_files가 JSON 문자열인 경우 파싱
          if (t.receipt_files) {
            try {
              const parsed = JSON.parse(t.receipt_files);
              if (Array.isArray(parsed)) {
                // 객체 배열인 경우 (새 형식: [{url, filename}, ...])
                if (parsed.length > 0 && typeof parsed[0] === 'object' && 'url' in parsed[0]) {
                  receiptFiles = parsed;
                  receiptUrls = parsed.map((r: ReceiptFile) => r.url);
                  console.log('✅ receipt_files 파싱 성공 (객체 배열):', receiptFiles);
                }
                // 문자열 배열인 경우 (이전 형식: ["url1", "url2"])
                else {
                  receiptUrls = parsed;
                  receiptFiles = parsed.map((url: string) => ({
                    url,
                    filename: url.split('/').pop()?.split('?')[0] || '영수증'
                  }));
                  console.log('✅ receipt_files 파싱 성공 (URL 배열):', receiptUrls);
                }
              } else {
                receiptUrls = [parsed];
                receiptFiles = [{ url: parsed, filename: parsed.split('/').pop()?.split('?')[0] || '영수증' }];
              }
            } catch (e) {
              receiptUrls = [t.receipt_files];
              receiptFiles = [{ url: t.receipt_files, filename: t.receipt_files.split('/').pop()?.split('?')[0] || '영수증' }];
              console.log('⚠️ receipt_files 파싱 실패, 문자열로 처리:', receiptUrls);
            }
          }
          // 하위 호환성: receipt_file이 있으면 추가
          else if (t.receipt_file) {
            // receipt_file이 JSON 문자열인지 확인
            if (typeof t.receipt_file === 'string' && t.receipt_file.startsWith('[')) {
              try {
                const parsed = JSON.parse(t.receipt_file);
                if (Array.isArray(parsed)) {
                  // 객체 배열인 경우
                  if (parsed.length > 0 && typeof parsed[0] === 'object' && 'url' in parsed[0]) {
                    receiptFiles = parsed;
                    receiptUrls = parsed.map((r: ReceiptFile) => r.url);
                    console.log('✅ receipt_file JSON 파싱 성공 (객체 배열):', receiptFiles);
                  }
                  // 문자열 배열인 경우
                  else {
                    receiptUrls = parsed;
                    receiptFiles = parsed.map((url: string) => ({
                      url,
                      filename: url.split('/').pop()?.split('?')[0] || '영수증'
                    }));
                    console.log('✅ receipt_file JSON 파싱 성공 (URL 배열):', receiptUrls);
                  }
                } else {
                  receiptUrls = [parsed];
                  receiptFiles = [{ url: parsed, filename: parsed.split('/').pop()?.split('?')[0] || '영수증' }];
                }
              } catch (e) {
                receiptUrls = [t.receipt_file];
                receiptFiles = [{ url: t.receipt_file, filename: t.receipt_file.split('/').pop()?.split('?')[0] || '영수증' }];
                console.log('⚠️ receipt_file JSON 파싱 실패:', receiptUrls);
              }
            } else {
              receiptUrls = [t.receipt_file];
              receiptFiles = [{ url: t.receipt_file, filename: t.receipt_file.split('/').pop()?.split('?')[0] || '영수증' }];
              console.log('✅ receipt_file 사용 (일반 URL):', receiptUrls);
            }
          }
          // 하위 호환성: receipt_url이 있으면 추가
          else if (t.receipt_url) {
            receiptUrls = [t.receipt_url];
            receiptFiles = [{ url: t.receipt_url, filename: t.receipt_url.split('/').pop()?.split('?')[0] || '영수증' }];
            console.log('✅ receipt_url 사용:', receiptUrls);
          }

          return {
            ...t,
            receipt_urls: receiptUrls,
            receipt_url: receiptUrls[0] || undefined, // 하위 호환성
            receipt_metadata: receiptFiles // 파일명 정보 포함
          };
        });

        console.log('✅ 최종 변환된 거래 내역:', transactions.map((t: Transaction) => ({
          id: t.id,
          receipt_urls: t.receipt_urls
        })));

        setTransactions(transactions);
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

  const uploadReceiptsToStorage = async (files: File[]): Promise<ReceiptFile[]> => {
    try {
      setUploadingReceipt(true);
      const uploadedReceipts: ReceiptFile[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}_${random}.${fileExt}`;
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const filePath = `receipts/${year}/${month}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('accounting-receipts')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('영수증 업로드 실패:', error);
          throw error;
        }

        const { data: urlData } = supabase.storage
          .from('accounting-receipts')
          .getPublicUrl(filePath);

        uploadedReceipts.push({
          url: urlData.publicUrl,
          filename: file.name
        });
      }

      return uploadedReceipts;
    } catch (error) {
      console.error('영수증 업로드 중 오류:', error);
      alert('영수증 업로드에 실패했습니다.');
      return [];
    } finally {
      setUploadingReceipt(false);
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

      // 영수증 파일들이 있으면 먼저 업로드
      let uploadedReceipts: ReceiptFile[] = [];
      if (receiptFiles.length > 0) {
        uploadedReceipts = await uploadReceiptsToStorage(receiptFiles);
        if (uploadedReceipts.length === 0) {
          return; // 업로드 실패 시 중단
        }
      }

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
          receipt_files: uploadedReceipts.length > 0 ? JSON.stringify(uploadedReceipts) : null, // 파일명 포함한 객체 배열 저장
        }),
      });

      if (response.ok) {
        alert('거래 내역이 추가되었습니다.');
        setShowAddModal(false);
        setEditingTransaction(null);
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
        setReceiptFiles([]);
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

  const updateTransaction = async () => {
    if (!editingTransaction) return;

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

      // 기존 영수증 URL들 유지하고, 새 파일이 있으면 추가
      let allReceiptUrls = [...(editingTransaction.receipt_urls || [])];

      // 새로운 영수증 파일들이 있으면 업로드하고 추가
      if (receiptFiles.length > 0) {
        const uploadedReceipts = await uploadReceiptsToStorage(receiptFiles);
        if (uploadedReceipts.length === 0) {
          return; // 업로드 실패 시 중단
        }
        allReceiptUrls = [...allReceiptUrls, ...uploadedReceipts.map(r => r.url)];
      }

      // 기존 영수증과 새 영수증을 모두 ReceiptFile 형식으로 통일
      const allReceipts: ReceiptFile[] = [];

      // 기존 영수증 추가 (메타데이터가 있으면 사용, 없으면 URL에서 파일명 추출)
      if (editingTransaction.receipt_metadata && editingTransaction.receipt_metadata.length > 0) {
        allReceipts.push(...editingTransaction.receipt_metadata);
      } else if (editingTransaction.receipt_urls && editingTransaction.receipt_urls.length > 0) {
        for (const url of editingTransaction.receipt_urls) {
          const filename = url.split('/').pop()?.split('?')[0] || '영수증';
          allReceipts.push({ url, filename });
        }
      }

      // 새 영수증 추가
      if (receiptFiles.length > 0) {
        const uploadedReceipts = await uploadReceiptsToStorage(receiptFiles);
        if (uploadedReceipts.length === 0) {
          return; // 업로드 실패 시 중단
        }
        allReceipts.push(...uploadedReceipts);
      }

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/accounting/admin/transactions/${editingTransaction.id}`, {
        method: 'PUT',
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
          receipt_files: allReceipts.length > 0 ? JSON.stringify(allReceipts) : null, // 파일명 포함한 객체 배열 저장
        }),
      });

      if (response.ok) {
        alert('거래 내역이 수정되었습니다.');
        setShowAddModal(false);
        setEditingTransaction(null);
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
        setReceiptFiles([]);
        await loadTransactions();
        await loadSummary();
      } else {
        const error = await response.json();
        alert(`거래 내역 수정 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('거래 내역 수정 실패:', error);
      alert('거래 내역 수정 중 오류가 발생했습니다.');
    }
  };

  const deleteTransaction = async () => {
    if (!deletingTransactionId) return;

    try {
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/accounting/admin/transactions/${deletingTransactionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('거래 내역이 삭제되었습니다.');
        setShowDeleteDialog(false);
        setDeletingTransactionId(null);
        await loadTransactions();
        await loadSummary();
      } else {
        const error = await response.json();
        alert(`거래 내역 삭제 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('거래 내역 삭제 실패:', error);
      alert('거래 내역 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (transaction: Transaction) => {
    console.log('🔧 편집 모드 진입:', {
      id: transaction.id,
      receipt_urls: transaction.receipt_urls,
      receipt_url: transaction.receipt_url,
      receipt_files: transaction.receipt_files,
      receipt_file: transaction.receipt_file,
      receipt_metadata: transaction.receipt_metadata
    });

    // 기존 영수증 메타데이터를 포함한 transaction 설정
    setEditingTransaction(transaction);
    setNewTransaction({
      type: transaction.type,
      category_id: transaction.category_id.toString(),
      transaction_date: transaction.transaction_date,
      amount: transaction.amount.toString(),
      vendor_name: transaction.vendor_name || '',
      payment_method: transaction.payment_method || '',
      description: transaction.description || '',
    });
    setReceiptFiles([]); // 영수증 파일 초기화
    // 계정과목 목록 미리 로드
    if (incomeCategories.length === 0 && expenseCategories.length === 0) {
      loadCategories();
    }
    setShowAddModal(true);
  };

  // 기존 영수증 삭제 핸들러
  const handleRemoveExistingReceipt = (index: number) => {
    if (!editingTransaction || !editingTransaction.receipt_metadata) return;

    const updatedMetadata = editingTransaction.receipt_metadata.filter((_, i) => i !== index);
    const updatedUrls = editingTransaction.receipt_urls?.filter((_, i) => i !== index) || [];

    setEditingTransaction({
      ...editingTransaction,
      receipt_metadata: updatedMetadata,
      receipt_urls: updatedUrls,
      receipt_url: updatedUrls[0] || undefined
    });
  };

  const handleDelete = (transactionId: number) => {
    setDeletingTransactionId(transactionId);
    setShowDeleteDialog(true);
  };

  const handleAddNew = () => {
    setEditingTransaction(null);
    setNewTransaction({
      type: 'expense',
      category_id: '',
      transaction_date: new Date().toISOString().split('T')[0],
      amount: '',
      vendor_name: '',
      payment_method: '',
      description: '',
    });
    setReceiptFiles([]); // 영수증 파일 초기화
    // 계정과목 목록 미리 로드
    if (incomeCategories.length === 0 && expenseCategories.length === 0) {
      loadCategories();
    }
    setShowAddModal(true);
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

  /**
   * 계정과목 트리 정렬: 부모(parent_id null) 다음 자식들을 그룹별로 출력.
   * 같은 그룹 내에서는 display_order → name 순.
   */
  const sortCategoriesByHierarchy = (categories: AccountCategory[]): AccountCategory[] => {
    const sortFn = (a: AccountCategory, b: AccountCategory) => {
      if ((a.display_order || 0) !== (b.display_order || 0)) {
        return (a.display_order || 0) - (b.display_order || 0);
      }
      return a.name.localeCompare(b.name, 'ko-KR');
    };
    const parents = categories.filter(c => !c.parent_id).sort(sortFn);
    const result: AccountCategory[] = [];
    for (const parent of parents) {
      result.push(parent);
      const children = categories.filter(c => c.parent_id === parent.id).sort(sortFn);
      result.push(...children);
    }
    // 부모가 결과에 포함되지 않은 고아 자식들도 끝에 추가
    const includedIds = new Set(result.map(c => c.id));
    const orphans = categories.filter(c => !includedIds.has(c.id));
    result.push(...orphans);
    return result;
  };

  const exportToExcel = async () => {
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

    // 워크북 생성
    const wb = XLSX.utils.book_new();

    // 거래 내역 시트 생성
    const ws1 = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws1, '거래내역');

    // 요약 시트 생성
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, '요약');

    // 파일명 생성 (날짜 포함)
    const today = new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '');
    const fileName = `거래내역_${today}.xlsx`;

    // 엑셀 파일 생성 및 다운로드
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  };

  const filteredTransactions = transactions.filter(t => {
    // 검색 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        t.vendor_name?.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.category?.name?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // 타입 필터 (클라이언트 사이드에서 처리)
    if (typeFilter.length > 0 && !typeFilter.includes(t.type)) {
      return false;
    }

    return true;
  });

  // 페이지네이션 처리
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // 상단바 부제·액션 (Hook은 early return 전)
  usePageSubtitle(
    summary ? `수입 ${summary.income_count}건 · 지출 ${summary.expense_count}건` : undefined
  );
  usePageActions(
    <>
      <Button
        onClick={exportToExcel}
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={filteredTransactions.length === 0}
      >
        <Download className="h-3.5 w-3.5" />
        엑셀 다운
      </Button>
      <Button
        onClick={handleAddNew}
        size="sm"
        className="gap-2"
      >
        <Plus className="h-3.5 w-3.5" />
        거래 추가
      </Button>
    </>,
    [filteredTransactions.length]
  );

  return (
    <PageContainer>
      {/* KPI strip — 통합 요약 카드 */}
      {summary && (() => {
        const total = summary.total_income + summary.total_expense;
        const incomeRatio = total > 0 ? (summary.total_income / total) * 100 : 0;
        const expenseRatio = total > 0 ? (summary.total_expense / total) * 100 : 0;
        const isPositive = summary.net >= 0;
        return (
          <Card className="mb-4 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(280px,360px)_1fr]">
              {/* 좌측 — 순 수익 강조 */}
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
                  <div className="text-[12px] font-semibold text-muted-foreground">순 수익</div>
                </div>
                <div className={cn(
                  "text-[28px] font-bold leading-tight tracking-[-0.02em] tabular-nums",
                  isPositive ? "text-[#2563EB]" : "text-[#B45309]"
                )}>
                  {formatCurrency(summary.net)}
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  거래 {summary.income_count + summary.expense_count}건 · 수입 − 지출
                </div>
              </div>

              {/* 우측 — 수입/지출 비율 */}
              <div className="flex flex-col justify-center gap-3 px-6 py-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#E7F6EC] text-[#16A34A]">
                      <TrendingUp className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-muted-foreground">총 수입</div>
                      <div className="truncate text-[20px] font-bold leading-tight tabular-nums text-[#16A34A]">
                        {formatCurrency(summary.total_income)}
                      </div>
                      <div className="text-[11px] text-[#94A3B8]">{summary.income_count}건 · {incomeRatio.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FCEBEB] text-[#DC2626]">
                      <TrendingDown className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-muted-foreground">총 지출</div>
                      <div className="truncate text-[20px] font-bold leading-tight tabular-nums text-[#DC2626]">
                        {formatCurrency(summary.total_expense)}
                      </div>
                      <div className="text-[11px] text-[#94A3B8]">{summary.expense_count}건 · {expenseRatio.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
                {/* 비율 바 */}
                <div className="flex h-[8px] w-full overflow-hidden rounded-full bg-[#F1F4F9]">
                  {total > 0 ? (
                    <>
                      <div
                        className="h-full bg-[#16A34A] transition-all"
                        style={{ width: `${incomeRatio}%` }}
                      />
                      <div
                        className="h-full bg-[#DC2626] transition-all"
                        style={{ width: `${expenseRatio}%` }}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* 검색·필터 + 테이블 통합 카드 */}
      <Card className="overflow-hidden">
        {/* 검색·필터 바 */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF1F6] px-[16px] py-[14px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="거래처, 내용, 계정과목 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-[320px]"
            />
          </div>

          <div className="flex-1" />

          {/* 구분 필터 — 단일 선택 */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-[38px] w-auto min-w-[140px] items-center justify-between gap-2 rounded-[8px] border border-border bg-card px-3 text-[13px] text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <span className="flex items-center gap-2">
                  <span className="text-[12.5px] text-muted-foreground">구분</span>
                  <span className="font-medium">
                    {typeFilter.length === 0
                      ? '전체'
                      : (typeFilter[0] === 'income' ? '수입' : '지출')}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <div className="py-1.5">
                {[
                  { value: '', label: '전체' },
                  { value: 'income', label: '수입' },
                  { value: 'expense', label: '지출' },
                ].map(opt => {
                  const selected =
                    opt.value === ''
                      ? typeFilter.length === 0
                      : typeFilter[0] === opt.value;
                  return (
                    <button
                      key={opt.value || 'all'}
                      type="button"
                      onClick={() => setTypeFilter(opt.value ? [opt.value] : [])}
                      className={cn(
                        "flex w-full items-center justify-between gap-2.5 px-3 py-2 text-left text-[13px] transition-colors hover:bg-secondary",
                        selected ? "font-semibold text-primary" : "text-foreground"
                      )}
                    >
                      <span className="flex-1">{opt.label}</span>
                      {selected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* 기간 선택 */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>

        {/* 테이블 */}
        {loading ? (
          <LoadingState text="거래 내역을 불러오는 중..." />
        ) : paginatedTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <DollarSign className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
            <p className="text-[13px] text-muted-foreground">거래 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-[12.5px] table-fixed">
              <colgroup>
                <col className="w-[110px]" />
                <col className="w-[80px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col />
                <col className="w-[130px]" />
                <col className="w-[100px]" />
                <col className="w-[80px]" />
              </colgroup>
              <thead className="bg-[#FAFBFD]">
                <tr>
                  <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">날짜</th>
                  <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">구분</th>
                  <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">계정과목</th>
                  <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">거래처</th>
                  <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">내용</th>
                  <th className="px-[18px] py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">금액</th>
                  <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">결제수단</th>
                  <th className="px-[18px] py-3 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">영수증</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {paginatedTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="cursor-pointer transition-colors hover:bg-[#FAFBFD]"
                    onClick={() => handleEdit(transaction)}
                  >
                    <td className="px-[18px] py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-[18px] py-3 whitespace-nowrap">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-[8px] py-[2px] text-[10.5px] font-bold whitespace-nowrap',
                        transaction.type === 'income'
                          ? 'bg-[#E7F6EC] text-[#16A34A]'
                          : 'bg-[#FCEBEB] text-[#DC2626]'
                      )}>
                        {transaction.type === 'income' ? '수입' : '지출'}
                      </span>
                    </td>
                    <td className="px-[18px] py-3 whitespace-nowrap font-semibold text-foreground">
                      {transaction.category?.name || <span className="text-[#CBD5E1]">-</span>}
                    </td>
                    <td className="px-[18px] py-3 whitespace-nowrap text-foreground">
                      {transaction.vendor_name || <span className="text-[#CBD5E1]">-</span>}
                    </td>
                    <td className="px-[18px] py-3 text-muted-foreground">
                      <div className="max-w-[320px] truncate">
                        {transaction.description || <span className="text-[#CBD5E1]">-</span>}
                      </div>
                    </td>
                    <td className={cn(
                      "px-[18px] py-3 whitespace-nowrap text-right font-bold tabular-nums",
                      transaction.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                    )}>
                      {transaction.type === 'income' ? '+' : '−'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-[18px] py-3 whitespace-nowrap text-muted-foreground">
                      {getPaymentMethodLabel(transaction.payment_method)}
                    </td>
                    <td
                      className="px-[18px] py-3 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {transaction.receipt_urls && transaction.receipt_urls.length > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const receipts: ReceiptFile[] = transaction.receipt_urls!.map((url) => {
                              const filename = url.split('/').pop()?.split('?')[0] || '영수증';
                              return { url, filename };
                            });
                            setPreviewReceipts(receipts);
                            setCurrentReceiptIndex(0);
                            setShowReceiptModal(true);
                          }}
                          className="relative h-[30px] w-[30px] p-0 text-[#16A34A] hover:bg-[#E7F6EC] hover:text-[#16A34A]"
                          title="영수증 보기"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {transaction.receipt_urls.length > 1 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                              {transaction.receipt_urls.length}
                            </span>
                          )}
                        </Button>
                      ) : (
                        <span className="text-[#CBD5E1]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 합계 + 페이지네이션 — 카드 밖 (교인 관리 패턴) */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[12.5px] text-muted-foreground">
            전체 <b className="text-foreground">{totalItems.toLocaleString()}</b>건
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
            itemsPerPageOptions={[10, 20, 50, 100]}
          />
        </div>
      )}

      {/* Add/Edit Transaction Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? '거래 내역 수정' : '거래 내역 추가'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* 거래 유형 — segment 토글 */}
            <div className="space-y-2">
              <Label className="block">거래 유형</Label>
              <div className="inline-flex items-center gap-[2px] rounded-[8px] bg-secondary p-[3px]">
                <button
                  type="button"
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'income', category_id: '' })}
                  className={cn(
                    'rounded-[6px] px-4 py-[6px] text-[13px] font-semibold transition-colors',
                    newTransaction.type === 'income'
                      ? 'bg-card text-[#16A34A] shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  수입
                </button>
                <button
                  type="button"
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'expense', category_id: '' })}
                  className={cn(
                    'rounded-[6px] px-4 py-[6px] text-[13px] font-semibold transition-colors',
                    newTransaction.type === 'expense'
                      ? 'bg-card text-[#DC2626] shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  지출
                </button>
              </div>
            </div>

            {/* 계정과목 */}
            <div className="space-y-2">
              <Label htmlFor="category_id">계정과목 *</Label>
              <Select
                value={newTransaction.category_id}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="계정과목 선택" />
                </SelectTrigger>
                <SelectContent>
                  {sortCategoriesByHierarchy(
                    newTransaction.type === 'income' ? incomeCategories : expenseCategories
                  ).map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.parent_id ? (
                        <span className="pl-4 text-[#475569]">└ {category.name}</span>
                      ) : (
                        <span className="font-semibold text-foreground">{category.name}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 거래 날짜 */}
            <div className="space-y-2">
              <Label htmlFor="transaction_date">거래 날짜 *</Label>
              <DatePicker
                value={newTransaction.transaction_date}
                onChange={(value) => setNewTransaction({ ...newTransaction, transaction_date: value })}
                placeholder="날짜 선택"
              />
            </div>

            {/* 금액 */}
            <div className="space-y-2">
              <Label htmlFor="amount">금액 (원) *</Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={
                  newTransaction.amount
                    ? Number(newTransaction.amount).toLocaleString('ko-KR')
                    : ''
                }
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^\d]/g, '');
                  setNewTransaction({ ...newTransaction, amount: digits });
                }}
                className="text-right tabular-nums"
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
              <Select
                value={newTransaction.payment_method}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="transfer">계좌이체</SelectItem>
                  <SelectItem value="card">카드</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
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

            {/* 영수증 첨부 */}
            <div className="space-y-2">
              <Label htmlFor="receipt">영수증</Label>
              <div className="space-y-3">
                {/* 파일 업로드 버튼 */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="receipt-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>파일 선택</span>
                  </label>
                  <input
                    id="receipt-upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const validFiles: File[] = [];

                      for (const file of files) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert(`${file.name}: 파일 크기는 10MB 이하여야 합니다.`);
                          continue;
                        }
                        validFiles.push(file);
                      }

                      if (validFiles.length > 0) {
                        setReceiptFiles([...receiptFiles, ...validFiles]);
                      }

                      // Reset input so the same file can be selected again
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <span className="text-xs text-gray-500">
                    여러 파일 선택 가능 (각 최대 10MB)
                  </span>
                </div>

                {/* 현재 업로드된 영수증 (수정 모드일 때) */}
                {editingTransaction?.receipt_metadata && editingTransaction.receipt_metadata.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">
                      등록된 영수증 ({editingTransaction.receipt_metadata.length}개)
                    </p>
                    {editingTransaction.receipt_metadata.map((receipt, index) => {
                      const isPdf = receipt.url.toLowerCase().endsWith('.pdf') || receipt.url.includes('.pdf?');
                      return (
                        <div key={index} className="flex items-center gap-2 rounded-[8px] bg-[#FAFBFD] px-3 py-2">
                          {isPdf ? (
                            <FileText className="h-4 w-4 text-[#94A3B8]" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-[#94A3B8]" />
                          )}
                          <span className="flex-1 truncate text-[13px] text-foreground">{receipt.filename}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(receipt.url, '_blank')}
                            className="h-[30px] w-[30px] p-0 text-primary hover:bg-accent"
                            title="보기"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = receipt.url;
                              a.download = receipt.filename;
                              a.target = '_blank';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                            className="h-[30px] w-[30px] p-0 text-[#16A34A] hover:bg-[#E7F6EC] hover:text-[#16A34A]"
                            title="다운로드"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExistingReceipt(index)}
                            className="h-[30px] w-[30px] p-0 text-[#DC2626] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                            title="삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 선택된 파일 미리보기 */}
                {receiptFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">
                      새로 추가할 파일 ({receiptFiles.length}개)
                    </p>
                    {receiptFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-[8px] bg-[#EAF1FE] px-3 py-2">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4 text-[#2563EB]" />
                        ) : (
                          <FileText className="h-4 w-4 text-[#2563EB]" />
                        )}
                        <span className="flex-1 truncate text-[13px] text-[#1E40AF]">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReceiptFiles(receiptFiles.filter((_, i) => i !== index));
                          }}
                          className="h-[30px] w-[30px] p-0 text-[#DC2626] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                          title="제거"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 버튼 — 편집 모드는 좌측 삭제 + 우측 취소/수정 */}
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-4">
              <div>
                {editingTransaction && (
                  <Button
                    type="button"
                    variant="destructive-soft"
                    size="sm"
                    onClick={() => {
                      handleDelete(editingTransaction.id);
                    }}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    삭제
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTransaction(null);
                  }}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={editingTransaction ? updateTransaction : addTransaction}
                >
                  {editingTransaction ? '수정' : '저장'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>거래 내역 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              이 거래 내역을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingTransactionId(null);
                }}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={deleteTransaction}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                삭제
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              영수증 미리보기 ({currentReceiptIndex + 1} / {previewReceipts.length})
            </DialogTitle>
          </DialogHeader>

          {previewReceipts.length > 0 && (
            <div className="space-y-4">
              {/* 파일명 표시 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 truncate flex-1">
                  {previewReceipts[currentReceiptIndex].filename}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const receipt = previewReceipts[currentReceiptIndex];
                    const a = document.createElement('a');
                    a.href = receipt.url;
                    a.download = receipt.filename;
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  다운로드
                </Button>
              </div>

              {/* 이미지/PDF 미리보기 */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                {previewReceipts[currentReceiptIndex].url.toLowerCase().includes('.pdf') ? (
                  <iframe
                    src={previewReceipts[currentReceiptIndex].url}
                    className="w-full h-[500px]"
                    title="PDF Preview"
                  />
                ) : (
                  <img
                    src={previewReceipts[currentReceiptIndex].url}
                    alt={previewReceipts[currentReceiptIndex].filename}
                    className="w-full h-auto max-h-[500px] object-contain"
                  />
                )}

                {/* 이전/다음 버튼 (여러 영수증이 있을 때만) */}
                {previewReceipts.length > 1 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentReceiptIndex((prev) =>
                          prev === 0 ? previewReceipts.length - 1 : prev - 1
                        );
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                      disabled={previewReceipts.length <= 1}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentReceiptIndex((prev) =>
                          prev === previewReceipts.length - 1 ? 0 : prev + 1
                        );
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                      disabled={previewReceipts.length <= 1}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>

              {/* 썸네일 리스트 (여러 영수증이 있을 때만) */}
              {previewReceipts.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-2">
                  {previewReceipts.map((receipt, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentReceiptIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                        index === currentReceiptIndex
                          ? 'border-blue-500'
                          : 'border-gray-300 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {receipt.url.toLowerCase().includes('.pdf') ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <FileText className="w-8 h-8 text-gray-600" />
                        </div>
                      ) : (
                        <img
                          src={receipt.url}
                          alt={receipt.filename}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* 닫기 버튼 */}
              <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReceiptModal(false)}
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default AccountingManagement;
