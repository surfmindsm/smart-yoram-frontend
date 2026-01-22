import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { supabase } from '../lib/supabase';
import { getPositionDetailLabel } from '../constants/memberPositions';
import { Button } from "./ui";
import { Input } from "./ui";
import { Combobox } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { Plus, X, Users, ArrowLeft } from 'lucide-react';

interface Member {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  position_detail?: string;
  department?: string;
  organization_name?: string;
}

interface BulkDonationRow {
  donorId: string;
  amount: number;
  fundType: string;
  note: string;
  isAnonymous: boolean;
}

// 헌금 유형은 계정과목 API에서 동적으로 로드됩니다

const BulkDonationInput: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [churchInfo, setChurchInfo] = useState<any>(null);
  const [fundTypes, setFundTypes] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [bulkDonations, setBulkDonations] = useState<BulkDonationRow[]>([
    { donorId: '', amount: 0, fundType: '', note: '', isAnonymous: false }
  ]);
  const [bulkSettings, setBulkSettings] = useState({
    offeredOn: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadMembers();
    loadChurchInfo();
    loadFundTypes();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await supabaseApiService.members.getAll({ limit: 10000 });
      const membersData = response.data || response;
      setMembers(membersData);
    } catch (error) {
      console.error('교인 목록 로드 실패:', error);
    }
  };

  const loadChurchInfo = async () => {
    try {
      const currentUser = await supabaseAuthService.getCurrentUser();
      if (currentUser?.user?.church_id) {
        const { data: churchData, error } = await supabase
          .from('churches')
          .select('*')
          .eq('id', currentUser.user.church_id)
          .single();

        if (churchData && !error) {
          setChurchInfo({
            id: churchData.id,
            name: churchData.name || churchData.church_name || '교회명 없음',
            address: churchData.address || churchData.church_address || '',
            business_no: churchData.business_no || churchData.registration_number || churchData.tax_number || ''
          });
        }
      }
    } catch (error) {
      console.error('교회 정보 로드 실패:', error);
    }
  };

  // 헌금 유형을 계정과목 API에서 로드하는 함수
  const loadFundTypes = async () => {
    try {
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id;
      if (!userChurchId) {
        console.error('교회 ID를 찾을 수 없습니다.');
        return;
      }

      const token = await supabaseAuthService.getToken();
      if (!token) {
        console.error('토큰을 가져올 수 없습니다.');
        return;
      }

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

      // 수입(income) 타입의 모든 계정과목 가져오기
      const response = await fetch(
        `${supabaseUrl}/functions/v1/accounting/admin/categories?type=income&church_id=${userChurchId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const categories = Array.isArray(data) ? data : (data?.data || []);

        // "헌금" 상위 카테고리 찾기
        const offeringParent = categories.find(
          (cat: any) => cat.name === '헌금' && !cat.parent_id
        );

        if (offeringParent) {
          // "헌금"의 하위 항목 필터링
          const offeringChildren = categories.filter(
            (cat: any) => cat.parent_id === offeringParent.id
          );

          // 이름만 추출하여 정렬
          const fundTypeNames = offeringChildren
            .map((cat: any) => cat.name)
            .sort();

          setFundTypes(fundTypeNames);
          console.log('✅ 헌금 유형 로드 완료:', fundTypeNames);
        } else {
          console.warn('⚠️ "헌금" 상위 카테고리를 찾을 수 없습니다.');
          setFundTypes([]);
        }
      } else {
        console.error('헌금 유형 로드 실패:', response.status);
        setFundTypes([]);
      }
    } catch (error) {
      console.error('헌금 유형 로드 중 오류:', error);
      setFundTypes([]);
    }
  };

  const addBulkRow = () => {
    setBulkDonations([...bulkDonations, { donorId: '', amount: 0, fundType: '', note: '', isAnonymous: false }]);
  };

  const removeBulkRow = (index: number) => {
    setBulkDonations(bulkDonations.filter((_, i) => i !== index));
  };

  const updateBulkRow = (index: number, field: string, value: any) => {
    const updated = bulkDonations.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setBulkDonations(updated);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  const handleBulkSubmit = async () => {
    const validDonations = bulkDonations.filter(d => (d.donorId || d.isAnonymous) && d.amount > 0);

    if (validDonations.length === 0) {
      alert('입력할 헌금 내역이 없습니다.');
      return;
    }

    // 헌금 유형 검증
    const invalidRows: string[] = [];
    validDonations.forEach((donation, index) => {
      const actualIndex = bulkDonations.indexOf(donation) + 1; // 1-based index for display

      if (!donation.fundType || donation.fundType.trim() === '') {
        invalidRows.push(`${actualIndex}번째 행: 헌금 유형이 선택되지 않았습니다.`);
      } else if (!fundTypes.includes(donation.fundType)) {
        invalidRows.push(`${actualIndex}번째 행: "${donation.fundType}"는 유효하지 않은 헌금 유형입니다.`);
      }
    });

    if (invalidRows.length > 0) {
      alert(
        '⚠️ 헌금 유형 검증 실패\n\n' +
        invalidRows.join('\n') +
        '\n\n계정과목 관리에서 등록된 헌금 항목만 사용할 수 있습니다.\n' +
        '(수입 > 헌금 > 세부헌금항목)'
      );
      return;
    }

    setSubmitLoading(true);

    try {
      let successCount = 0;

      // 현재 로그인한 사용자 ID 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const inputUserId = currentUser?.user?.id;

      if (!inputUserId) {
        throw new Error('로그인 사용자 정보를 찾을 수 없습니다.');
      }

      // 모든 헌금을 병렬로 등록
      const offeringPromises = validDonations.map(async (bulk) => {
        // 무명이 아닌 경우 기부자가 선택되었는지 확인
        if (!bulk.isAnonymous && (!bulk.donorId || bulk.donorId.trim() === '')) {
          throw new Error('무명이 아닌 경우 기부자를 선택해야 합니다.');
        }

        const memberId = bulk.isAnonymous ? null : Number(bulk.donorId);

        // 무명이 아닌 경우 교인 정보 확인
        if (!bulk.isAnonymous && memberId) {
          const memberData = members.find(m => m.id === memberId);
          if (!memberData) {
            throw new Error(`선택한 교인 정보를 찾을 수 없습니다. (ID: ${memberId})`);
          }
        }

        const offeringData = {
          member_id: memberId,
          church_id: churchInfo?.id || 1,
          offered_on: bulkSettings.offeredOn,
          fund_type: bulk.fundType,
          amount: bulk.amount.toString(),
          note: bulk.note || null,
          input_user_id: inputUserId
        };

        return await supabaseApiService.offerings.create(offeringData);
      });

      await Promise.all(offeringPromises);
      successCount = validDonations.length;

      alert(`${successCount}건의 헌금이 등록되었으며, 회계 수입으로 자동 기록되었습니다.`);
      navigate('/donation-management');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '일괄 헌금 추가에 실패했습니다.';
      console.error('❌ 일괄 헌금 추가 오류:', error);
      alert(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="헌금 일괄 입력"
        description="여러 건의 헌금을 한번에 입력합니다."
      />

      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/donation-management')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          헌금 관리로 돌아가기
        </Button>
      </div>

      {/* 공통 설정 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">공통 설정</h3>
        <div className="w-64">
          <label className="block text-sm font-medium mb-2">헌금일</label>
          <Input
            type="date"
            value={bulkSettings.offeredOn}
            onChange={(e) => setBulkSettings({ ...bulkSettings, offeredOn: e.target.value })}
          />
        </div>
      </div>

      {/* 헌금 목록 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold">헌금 목록</h3>
            </div>
            <Button
              onClick={addBulkRow}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              행 추가
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-20">무명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">기부자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">헌금 유형</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">적요</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-20">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bulkDonations.map((bulk, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={bulk.isAnonymous}
                      onChange={(e) => {
                        updateBulkRow(index, 'isAnonymous', e.target.checked);
                        if (e.target.checked) {
                          updateBulkRow(index, 'donorId', '');
                        }
                      }}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-6 py-4">
                    {bulk.isAnonymous ? (
                      <div className="px-3 py-2 bg-gray-100 text-gray-500 rounded text-sm text-center">
                        무명
                      </div>
                    ) : (
                      <Combobox
                        options={[...members]
                          .sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'))
                          .map(member => {
                            const details = [
                              getPositionDetailLabel(member.position_detail),
                              member.department,
                              member.organization_name
                            ].filter(Boolean).join('/');
                            return {
                              value: member.id.toString(),
                              label: details ? `${member.name}(${details})` : member.name
                            };
                          })}
                        value={bulk.donorId}
                        onChange={(value) => updateBulkRow(index, 'donorId', value)}
                        placeholder="교인 검색 (이름, 전화번호)"
                        searchPlaceholder="이름, 전화번호로 검색"
                        className="text-sm"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Combobox
                      options={fundTypes.map(type => ({ label: type, value: type }))}
                      value={bulk.fundType}
                      onChange={(value) => updateBulkRow(index, 'fundType', value)}
                      placeholder="헌금 유형 선택..."
                      searchPlaceholder="헌금 유형 검색..."
                      emptyMessage="검색 결과가 없습니다"
                      className="text-sm"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="number"
                      placeholder="0"
                      value={bulk.amount || ''}
                      onChange={(e) => updateBulkRow(index, 'amount', Number(e.target.value))}
                      className="text-right text-sm"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      placeholder="비고"
                      value={bulk.note}
                      onChange={(e) => updateBulkRow(index, 'note', e.target.value)}
                      className="text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    {bulkDonations.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBulkRow(index)}
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 합계 정보 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">총 건수:</span>
                <span className="font-medium">{bulkDonations.filter(b => (b.donorId || b.isAnonymous) && b.amount > 0).length}건</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">무명 헌금:</span>
                <span className="font-medium">{bulkDonations.filter(b => b.isAnonymous && b.amount > 0).length}건</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">총 금액:</span>
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(bulkDonations.reduce((sum, b) => sum + (b.amount || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-4 mt-6">
        <Button
          onClick={handleBulkSubmit}
          className="flex-1"
          disabled={submitLoading || bulkDonations.filter(b => (b.donorId || b.isAnonymous) && b.amount > 0).length === 0}
        >
          {submitLoading ? '등록 중...' : `${bulkDonations.filter(b => (b.donorId || b.isAnonymous) && b.amount > 0).length}건 등록`}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/donation-management')}
          className="flex-1"
        >
          취소
        </Button>
      </div>
    </PageContainer>
  );
};

export default BulkDonationInput;
