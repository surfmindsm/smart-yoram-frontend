import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  LoadingState,
  PageContainer,
  Label,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  is_offering?: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const AccountCategoryManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [incomeCategories, setIncomeCategories] = useState<AccountCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<AccountCategory[]>([]);

  // 추가 모달 상태
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'income' | 'expense'>('income');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIsOffering, setNewCategoryIsOffering] = useState(false);

  // 수정 모달
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AccountCategory | null>(null);
  const [editingName, setEditingName] = useState('');

  // 삭제 확인 모달
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<AccountCategory | null>(null);
  const [deleteUsage, setDeleteUsage] = useState<{ budget: number; transaction: number; offering: number } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

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
        const categories = Array.isArray(data) ? data : (data?.data || []);
        setIncomeCategories(categories);
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

  const openAddModal = (type: 'income' | 'expense') => {
    setAddModalType(type);
    setNewCategoryName('');
    setNewCategoryIsOffering(false);
    setAddModalOpen(true);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('계정과목 이름을 입력해주세요.');
      return;
    }

    try {
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

      let parentId = null;
      if (addModalType === 'income' && newCategoryIsOffering) {
        const offeringParent = incomeCategories.find(
          (cat) => cat.name === '헌금' && !cat.parent_id
        );

        if (!offeringParent) {
          alert('헌금 상위 카테고리를 찾을 수 없습니다. 먼저 "헌금" 카테고리를 생성해주세요.');
          return;
        }

        parentId = offeringParent.id;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/accounting/admin/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          type: addModalType,
          parent_id: parentId,
          is_active: true,
          is_offering: addModalType === 'income' ? newCategoryIsOffering : false,
        }),
      });

      if (response.ok) {
        setAddModalOpen(false);
        setNewCategoryName('');
        setNewCategoryIsOffering(false);
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

  const openDeleteModal = async (category: AccountCategory) => {
    setDeletingCategory(category);
    setDeleteUsage(null);
    setDeleteModalOpen(true);

    try {
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const checkUrl = `${supabaseUrl}/functions/v1/accounting/admin/categories/${category.id}/usage`;
      const checkResponse = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
      });

      if (checkResponse.ok) {
        const usage = await checkResponse.json();
        setDeleteUsage({
          budget: usage.budgetCount || 0,
          transaction: usage.transactionCount || 0,
          offering: usage.offeringCount || 0,
        });
      }
    } catch (error) {
      console.error('사용 여부 확인 실패:', error);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    if (deleteUsage && (deleteUsage.budget > 0 || deleteUsage.transaction > 0 || deleteUsage.offering > 0)) {
      return;
    }

    try {
      const token = await supabaseAuthService.getToken();
      if (!token) {
        alert('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/accounting/admin/categories/${deletingCategory.id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDeleteModalOpen(false);
        setDeletingCategory(null);
        setDeleteUsage(null);
        await loadCategories();
      } else {
        const error = await response.json();
        if (error.error && error.error.includes('foreign key constraint')) {
          alert('이 계정과목은 현재 사용 중이라 삭제할 수 없습니다.');
        } else {
          alert(`계정과목 삭제 실패: ${error.error || '알 수 없는 오류'}`);
        }
      }
    } catch (error) {
      console.error('계정과목 삭제 실패:', error);
      alert('계정과목 삭제 중 오류가 발생했습니다.');
    }
  };

  const openEditModal = (category: AccountCategory) => {
    setSelectedCategory(category);
    setEditingName(category.name);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedCategory(null);
    setEditingName('');
  };

  const updateCategory = async () => {
    if (!selectedCategory) return;
    if (!editingName.trim()) {
      alert('계정과목 이름을 입력해주세요.');
      return;
    }

    try {
      const token = await supabaseAuthService.getToken();
      if (!token) return;

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/accounting/admin/categories/${selectedCategory.id}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingName.trim(),
        }),
      });

      if (response.ok) {
        closeEditModal();
        await loadCategories();
      } else {
        const error = await response.json();
        alert(`계정과목 수정 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('계정과목 수정 실패:', error);
      alert('계정과목 수정 중 오류가 발생했습니다.');
    }
  };

  const requestDelete = () => {
    if (!selectedCategory) return;
    const target = selectedCategory;
    closeEditModal();
    openDeleteModal(target);
  };

  usePageSubtitle(undefined);
  usePageActions(null, []);

  const renderCategoryRow = (
    category: AccountCategory,
    isChild = false,
    color: 'income' | 'expense' = 'income'
  ) => {
    const isOfferingParent = category.name === '헌금' && !category.parent_id && color === 'income';
    const clickable = !isOfferingParent;
    return (
      <button
        key={category.id}
        type="button"
        onClick={clickable ? () => openEditModal(category) : undefined}
        disabled={!clickable}
        className={cn(
          "flex w-full items-center justify-between gap-2 border-b border-[#EEF1F6] px-4 text-left transition-colors",
          isChild ? "py-2 pl-10" : "py-3",
          clickable
            ? "cursor-pointer hover:bg-[#F8FAFD] focus:bg-[#F8FAFD] focus:outline-none"
            : "cursor-default"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {isChild && (
            <span className="text-[12px] text-[#94A3B8]">└</span>
          )}
          <span className={cn(
            "truncate text-[13.5px]",
            isChild ? "font-medium text-[#475569]" : "font-semibold text-foreground"
          )}>
            {category.name}
          </span>
          {category.is_offering && (
            <span className="inline-flex items-center rounded-full bg-[#E7F6EC] px-2 py-0.5 text-[10.5px] font-semibold text-[#16A34A]">
              헌금
            </span>
          )}
          {category.code && (
            <span className="truncate text-[11.5px] text-[#94A3B8]">{category.code}</span>
          )}
          {isOfferingParent && (
            <span className="text-[11px] text-[#94A3B8]">시스템 항목</span>
          )}
        </div>
      </button>
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
      ? { bg: '#E7F6EC', fg: '#16A34A' }
      : { bg: '#FCEBEB', fg: '#DC2626' };

    const parents = categories.filter(c => !c.parent_id);

    return (
      <Card className="overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[#EEF1F6] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: tone.bg, color: tone.fg }}
            >
              {icon}
            </div>
            <div className="text-[14px] font-bold leading-tight text-foreground">{title}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAddModal(type)}
            className="h-8 gap-1.5 text-[12px]"
          >
            <Plus className="h-3.5 w-3.5" />
            추가
          </Button>
        </div>

        {/* 리스트 */}
        {loading ? (
          <LoadingState text="불러오는 중..." />
        ) : parents.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-muted-foreground">
            등록된 {title}이 없습니다.
          </div>
        ) : (
          <div>
            {parents.map((parent) => {
              const children = categories.filter(c => c.parent_id === parent.id);
              return (
                <React.Fragment key={parent.id}>
                  {renderCategoryRow(parent, false, type)}
                  {children.map(child => renderCategoryRow(child, true, type))}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </Card>
    );
  };

  return (
    <PageContainer>
      {/* 좌우 컬럼 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderColumn(
          'income',
          '수입 계정과목',
          <TrendingUp className="h-[16px] w-[16px]" />,
          incomeCategories
        )}
        {renderColumn(
          'expense',
          '지출 계정과목',
          <TrendingDown className="h-[16px] w-[16px]" />,
          expenseCategories
        )}
      </div>

      {/* 추가 모달 */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {addModalType === 'income' ? '수입' : '지출'} 계정과목 추가
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-category-name" className="text-[12.5px] font-semibold">
                계정과목 이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-category-name"
                placeholder="예: 십일조, 사역비"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                autoFocus
              />
            </div>
            {addModalType === 'income' && (
              <label className="flex cursor-pointer items-start gap-2.5 rounded-[8px] border border-border bg-[#F8FAFD] px-3 py-2.5">
                <Checkbox
                  checked={newCategoryIsOffering}
                  onCheckedChange={(c) => setNewCategoryIsOffering(c === true)}
                  className="mt-0.5"
                />
                <div className="text-[12.5px] leading-tight">
                  <div className="font-semibold text-foreground">헌금 과목으로 설정</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    헌금 관리 화면의 종류 옵션에 표시됩니다.
                  </div>
                </div>
              </label>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>
              취소
            </Button>
            <Button onClick={addCategory}>
              <Check className="mr-1 h-3.5 w-3.5" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 모달 */}
      <Dialog open={editModalOpen} onOpenChange={(open) => { if (!open) closeEditModal(); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>계정과목 수정</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-category-type" className="text-[12.5px] font-semibold">구분</Label>
                <div
                  id="edit-category-type"
                  className="flex h-[38px] w-full items-center rounded-[8px] border border-border bg-[#F8FAFD] px-3 text-[13px] text-muted-foreground"
                >
                  {selectedCategory.type === 'income' ? '수입' : '지출'}
                  <span className="ml-2 text-[11.5px] text-[#94A3B8]">
                    · {selectedCategory.parent_id ? '하위 항목' : '상위 항목'}
                  </span>
                  {selectedCategory.is_offering && (
                    <span className="ml-auto inline-flex items-center rounded-full bg-[#E7F6EC] px-2 py-0.5 text-[11px] font-semibold text-[#16A34A]">
                      헌금
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-category-name" className="text-[12.5px] font-semibold">
                  계정과목 이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-category-name"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && updateCategory()}
                  autoFocus
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between sm:gap-2">
            <Button
              variant="destructive-soft"
              onClick={requestDelete}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={closeEditModal}>
                취소
              </Button>
              <Button onClick={updateCategory}>
                수정
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 모달 */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>계정과목 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-[13px]">
            {deletingCategory && (
              <p className="text-foreground">
                <span className="font-semibold">"{deletingCategory.name}"</span> 계정과목을 삭제하시겠습니까?
              </p>
            )}
            {deleteUsage === null ? (
              <p className="text-[12px] text-muted-foreground">사용 여부 확인 중...</p>
            ) : (deleteUsage.budget > 0 || deleteUsage.transaction > 0 || deleteUsage.offering > 0) ? (
              <div className="rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <div className="mb-1 text-[12.5px] font-semibold text-destructive">
                  사용 중인 계정과목이라 삭제할 수 없습니다
                </div>
                <ul className="space-y-0.5 text-[11.5px] text-muted-foreground">
                  {deleteUsage.budget > 0 && <li>· 예산: {deleteUsage.budget}건</li>}
                  {deleteUsage.transaction > 0 && <li>· 회계 거래: {deleteUsage.transaction}건</li>}
                  {deleteUsage.offering > 0 && <li>· 헌금: {deleteUsage.offering}건</li>}
                </ul>
                <p className="mt-2 text-[11.5px] text-muted-foreground">
                  관련 데이터를 다른 계정과목으로 이동하거나 삭제한 후 다시 시도해주세요.
                </p>
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                이 작업은 되돌릴 수 없습니다.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={
                deleteUsage === null ||
                (deleteUsage && (deleteUsage.budget > 0 || deleteUsage.transaction > 0 || deleteUsage.offering > 0)) || undefined
              }
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default AccountCategoryManagement;
