import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Card, CardContent } from "./ui";
import { PageContainer, PageHeader } from "./ui";
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

const AccountCategoryManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [incomeCategories, setIncomeCategories] = useState<AccountCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<AccountCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingType, setAddingType] = useState<'income' | 'expense' | null>(null);

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

  return (
    <PageContainer>
      <PageHeader
        title="계정 과목 관리"
        description="수입 및 지출 계정 과목을 관리합니다."
      />

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
    </PageContainer>
  );
};

export default AccountCategoryManagement;
