import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, DollarSign, Check, X } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

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

      // 삭제 전 사용 여부 확인
      const checkUrl = `${supabaseUrl}/functions/v1/accounting/admin/categories/${id}/usage`;
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
        const { budgetCount = 0, transactionCount = 0, offeringCount = 0 } = usage;

        if (budgetCount > 0 || transactionCount > 0 || offeringCount > 0) {
          const usageDetails = [];
          if (budgetCount > 0) usageDetails.push(`예산 ${budgetCount}건`);
          if (transactionCount > 0) usageDetails.push(`회계거래 ${transactionCount}건`);
          if (offeringCount > 0) usageDetails.push(`헌금 ${offeringCount}건`);

          alert(
            `⚠️ 이 계정과목은 현재 사용 중입니다.\n\n` +
            `${usageDetails.join(', ')}\n\n` +
            `사용 중인 계정과목은 삭제할 수 없습니다.\n` +
            `먼저 관련 데이터를 다른 계정과목으로 이동하거나 삭제해주세요.`
          );
          return;
        }
      }

      // 사용 중이 아니면 삭제 확인
      if (!window.confirm('이 계정과목을 삭제하시겠습니까?')) {
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

        // 외래 키 제약 조건 오류 메시지 개선
        if (error.error && error.error.includes('foreign key constraint')) {
          alert(
            `⚠️ 이 계정과목은 현재 사용 중입니다.\n\n` +
            `예산, 회계거래, 또는 헌금 데이터에서 참조되고 있어 삭제할 수 없습니다.\n\n` +
            `먼저 관련 데이터를 다른 계정과목으로 이동하거나 삭제해주세요.`
          );
        } else {
          alert(`계정과목 삭제 실패: ${error.error || '알 수 없는 오류'}`);
        }
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

  const startEditing = (id: number, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const updateCategory = async (id: number) => {
    if (!editingName.trim()) {
      alert('계정과목 이름을 입력해주세요.');
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
        return;
      }

      const url = `${supabaseUrl}/functions/v1/accounting/admin/categories/${id}`;

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
        setEditingId(null);
        setEditingName('');
        await loadCategories();
      } else {
        const error = await response.json();
        alert(`계정과목 수정 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('계정과목 수정 실패:', error);
      alert('계정과목 수정 중 오류가 발생했습니다.\n\n상세 정보: ' + (error as Error).message);
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
                        <div className="flex items-center gap-2 flex-1">
                          {editingId === category.id ? (
                            // 수정 모드
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && updateCategory(category.id)}
                                className="flex-1"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateCategory(category.id)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditing}
                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            // 보기 모드
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
                          )}
                        </div>
                        {/* 헌금 상위 카테고리는 수정/삭제 버튼 숨김 */}
                        {!(category.name === '헌금' && !category.parent_id) && editingId !== category.id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(category.id, category.name)}
                              className="text-gray-400 hover:text-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCategory(category.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* 하위 항목들 */}
                      {incomeCategories
                        .filter(c => c.parent_id === category.id)
                        .map((child) => {
                          return (
                            <div key={child.id} className="flex items-center justify-between py-2 pl-6 group hover:bg-gray-50 border-l-2 border-gray-200">
                              <div className="flex items-center gap-2 flex-1">
                                {editingId === child.id ? (
                                  // 수정 모드
                                  <div className="flex items-center gap-2 flex-1">
                                    <Input
                                      value={editingName}
                                      onChange={(e) => setEditingName(e.target.value)}
                                      onKeyPress={(e) => e.key === 'Enter' && updateCategory(child.id)}
                                      className="flex-1"
                                      autoFocus
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => updateCategory(child.id)}
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={cancelEditing}
                                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  // 보기 모드
                                  <div>
                                    <p className="font-medium text-gray-700 text-sm">{child.name}</p>
                                    {child.code && <p className="text-xs text-gray-500">{child.code}</p>}
                                  </div>
                                )}
                              </div>
                              {/* 모든 하위 항목 수정/삭제 가능 */}
                              {editingId !== child.id && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditing(child.id, child.name)}
                                    className="text-gray-400 hover:text-blue-600"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteCategory(child.id)}
                                    className="text-gray-400 hover:text-red-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
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
                {expenseCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between py-3 group hover:bg-gray-50">
                    <div className="flex items-center gap-2 flex-1">
                      {editingId === category.id ? (
                        // 수정 모드
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && updateCategory(category.id)}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateCategory(category.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        // 보기 모드
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`text-gray-900 ${category.parent_id ? 'font-medium' : 'font-semibold'}`}>
                              {category.name}
                            </p>
                            {category.parent_id && (
                              <span className="text-xs text-gray-500">
                                (하위 항목)
                              </span>
                            )}
                          </div>
                          {category.code && <p className="text-sm text-gray-500">{category.code}</p>}
                        </div>
                      )}
                    </div>
                    {editingId !== category.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(category.id, category.name)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCategory(category.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
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
    </PageContainer>
  );
};

export default AccountCategoryManagement;
