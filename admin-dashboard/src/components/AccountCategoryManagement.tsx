import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, DollarSign } from 'lucide-react';
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
  is_offering?: boolean;  // 헌금 계정과목 여부
  display_order: number;
  created_at: string;
  updated_at: string;
}

const AccountCategoryManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [incomeCategories, setIncomeCategories] = useState<AccountCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<AccountCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIsOffering, setNewCategoryIsOffering] = useState(false);
  const [addingType, setAddingType] = useState<'income' | 'expense' | null>(null);
  const [offeringParentId, setOfferingParentId] = useState<number | null>(null);

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

        // "헌금" 상위 카테고리 ID 찾기 (parent_id가 null이고 name이 "헌금")
        const offeringParent = categories.find(
          (cat: AccountCategory) => cat.name === '헌금' && !cat.parent_id
        );
        if (offeringParent) {
          setOfferingParentId(offeringParent.id);
          console.log('✅ 헌금 상위 카테고리 ID:', offeringParent.id);
        }
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

      // 헌금 과목이면 자동으로 parent_id를 헌금 상위 카테고리로 설정
      let parentId = null;
      if (type === 'income' && newCategoryIsOffering) {
        // 실시간으로 "헌금" 상위 카테고리 찾기
        const offeringParent = incomeCategories.find(
          (cat) => cat.name === '헌금' && !cat.parent_id
        );

        if (!offeringParent) {
          alert('헌금 상위 카테고리를 찾을 수 없습니다. 먼저 "헌금" 카테고리를 생성해주세요.');
          return;
        }

        parentId = offeringParent.id;
        console.log('✅ 헌금 상위 카테고리 ID 찾음:', parentId);
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
          type: type,
          parent_id: parentId,
          is_active: true,
          is_offering: type === 'income' ? newCategoryIsOffering : false,  // 수입 타입일 때만 헌금 여부 적용
        }),
      });

      if (response.ok) {
        setNewCategoryName('');
        setNewCategoryIsOffering(false);
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
      if (!token) {
        alert('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      if (!supabaseUrl) {
        alert('Supabase URL이 설정되지 않았습니다.');
        console.error('REACT_APP_SUPABASE_URL이 환경변수에 없습니다.');
        return;
      }

      const url = `${supabaseUrl}/functions/v1/accounting/admin/categories/${id}`;
      console.log('DELETE 요청 URL:', url);
      console.log('토큰:', token.substring(0, 20) + '...');

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
      });

      console.log('응답 상태:', response.status);

      if (response.ok) {
        alert('계정과목이 삭제되었습니다.');
        await loadCategories();
      } else {
        const error = await response.json();
        console.error('서버 응답 에러:', error);
        alert(`계정과목 삭제 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('계정과목 삭제 실패 (전체 에러):', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('서버와 통신할 수 없습니다. 네트워크 연결을 확인해주세요.\n\n상세 정보: ' + error.message);
      } else {
        alert('계정과목 삭제 중 오류가 발생했습니다.\n\n상세 정보: ' + (error as Error).message);
      }
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
              <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="계정과목 이름"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCategory('income')}
                  />
                  <Button onClick={() => addCategory('income')} size="sm">
                    저장
                  </Button>
                  <Button onClick={() => { setAddingType(null); setNewCategoryName(''); setNewCategoryIsOffering(false); }} variant="outline" size="sm">
                    취소
                  </Button>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCategoryIsOffering}
                    onChange={(e) => setNewCategoryIsOffering(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span>헌금 과목으로 설정 (헌금 관리 화면에 표시됨)</span>
                </label>
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
                {incomeCategories
                  .filter(c => !c.parent_id)
                  .map((category) => (
                    <React.Fragment key={category.id}>
                      {/* 상위 카테고리 */}
                      <div className="flex items-center justify-between py-3 group hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{category.name}</p>
                              {category.is_offering && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <DollarSign className="w-3 h-3" />
                                  헌금
                                </span>
                              )}
                            </div>
                            {category.code && <p className="text-sm text-gray-500">{category.code}</p>}
                          </div>
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

                      {/* 하위 항목들 */}
                      {incomeCategories
                        .filter(c => c.parent_id === category.id)
                        .map((child) => (
                          <div key={child.id} className="flex items-center justify-between py-2 pl-6 group hover:bg-gray-50 border-l-2 border-gray-200">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-700 text-sm">{child.name}</p>
                                  {child.is_offering && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <DollarSign className="w-3 h-3" />
                                      헌금
                                    </span>
                                  )}
                                </div>
                                {child.code && <p className="text-xs text-gray-500">{child.code}</p>}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCategory(child.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                    </React.Fragment>
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
