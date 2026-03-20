import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, DollarSign, TrendingUp, TrendingDown, Download, X, ChevronDown, Upload, Image as ImageIcon, FileText, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Card, CardContent } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { PageContainer, PageHeader } from "./ui";
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

  return (
    <PageContainer>
      <PageHeader
        title="회계 관리"
        actions={
          <>
            <Button
              onClick={exportToExcel}
              variant="outline"
              className="flex items-center gap-2"
              disabled={filteredTransactions.length === 0}
            >
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </Button>
            <Button
              onClick={handleAddNew}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              거래 내역 추가
            </Button>
          </>
        }
      />

      {/* 검색 및 필터 */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* 검색 Input */}
          <Input
            type="text"
            placeholder="거래처, 내용, 계정과목 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[400px]"
          />

          {/* 전체보기 버튼 */}
          {searchTerm && (
            <Button
              onClick={() => setSearchTerm('')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              전체보기
            </Button>
          )}

          {/* 구분 필터 */}
          <Popover>
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer bg-white",
                typeFilter.length > 0 && "border-blue-300 text-blue-700"
              )}
            >
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm">구분</span>
                  {typeFilter.length === 0 && (
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </PopoverTrigger>
              {typeFilter.length > 0 && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTypeFilter([]);
                  }}
                />
              )}
            </div>
            <PopoverContent className="w-[200px] p-3" align="start">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-income"
                    checked={typeFilter.includes('income')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTypeFilter([...typeFilter, 'income']);
                      } else {
                        setTypeFilter(typeFilter.filter((v) => v !== 'income'));
                      }
                    }}
                  />
                  <label
                    htmlFor="type-income"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    수입
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-expense"
                    checked={typeFilter.includes('expense')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTypeFilter([...typeFilter, 'expense']);
                      } else {
                        setTypeFilter(typeFilter.filter((v) => v !== 'expense'));
                      }
                    }}
                  />
                  <label
                    htmlFor="type-expense"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    지출
                  </label>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* 기간 선택 */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="border-muted">
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

          <Card className="border-muted">
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

          <Card className="border-muted">
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

      {/* Transactions */}
      <div className="space-y-4">
          {/* Transactions Table */}
          {loading ? (
            <Card className="border-muted">
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                  <p className="text-gray-600">거래 내역을 불러오는 중...</p>
                </div>
              </CardContent>
            </Card>
          ) : paginatedTransactions.length === 0 ? (
            <Card className="border-muted">
              <CardContent className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">거래 내역이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-muted">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계정과목</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거래처</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내용</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">결제수단</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">영수증</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? '수입' : '지출'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.category?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.vendor_name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {transaction.description || '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                          {getPaymentMethodLabel(transaction.payment_method)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {transaction.receipt_urls && transaction.receipt_urls.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // URL에서 파일명 추출하여 ReceiptFile[] 생성
                                const receipts: ReceiptFile[] = transaction.receipt_urls!.map((url) => {
                                  const filename = url.split('/').pop()?.split('?')[0] || '영수증';
                                  return { url, filename };
                                });
                                setPreviewReceipts(receipts);
                                setCurrentReceiptIndex(0);
                                setShowReceiptModal(true);
                              }}
                              className="text-green-600 hover:text-green-800 hover:bg-green-50 h-8 w-8 p-0 relative"
                              title="영수증 보기"
                            >
                              <FileText className="w-4 h-4" />
                              {transaction.receipt_urls.length > 1 && (
                                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                  {transaction.receipt_urls.length}
                                </span>
                              )}
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(transaction.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Total Count and Pagination */}
          {!loading && filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                전체 {totalItems.toLocaleString()}건
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
      </div>

      {/* Add/Edit Transaction Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? '거래 내역 수정' : '거래 내역 추가'}</DialogTitle>
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
              <Select
                value={newTransaction.category_id}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="계정과목 선택" />
                </SelectTrigger>
                <SelectContent>
                  {(newTransaction.type === 'income' ? incomeCategories : expenseCategories)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.parent_id ? `  ∙ ${category.name}` : category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                    <p className="text-sm font-medium text-gray-700">등록된 영수증 ({editingTransaction.receipt_metadata.length}개)</p>
                    {editingTransaction.receipt_metadata.map((receipt, index) => {
                      const isPdf = receipt.url.toLowerCase().endsWith('.pdf') || receipt.url.includes('.pdf?');
                      return (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                          {isPdf ? (
                            <FileText className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm text-gray-700 flex-1 truncate">{receipt.filename}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(receipt.url, '_blank')}
                            className="text-blue-600 hover:text-blue-800 h-8 w-8 p-0"
                            title="보기"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // 다운로드
                              const a = document.createElement('a');
                              a.href = receipt.url;
                              a.download = receipt.filename;
                              a.target = '_blank';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                            className="text-green-600 hover:text-green-800 h-8 w-8 p-0"
                            title="다운로드"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExistingReceipt(index)}
                            className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 선택된 파일 미리보기 */}
                {receiptFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-700">새로 추가할 파일 ({receiptFiles.length}개)</p>
                    {receiptFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="text-sm text-blue-800 flex-1 truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReceiptFiles(receiptFiles.filter((_, i) => i !== index));
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTransaction(null);
                }}
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={editingTransaction ? updateTransaction : addTransaction}
              >
                {editingTransaction ? '수정' : '저장'}
              </Button>
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
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingTransactionId(null);
                }}
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={deleteTransaction}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
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
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
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
