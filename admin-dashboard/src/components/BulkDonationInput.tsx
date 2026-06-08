import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { supabase } from '../lib/supabase';
import { getPositionDetailLabel } from '../constants/memberPositions';
import { Button } from "./ui";
import { Input } from "./ui";
import { Combobox } from "./ui";
import { Card } from "./ui";
import { Checkbox } from "./ui";
import { PageContainer } from "./ui";
import { DatePicker } from "./ui/date-picker";
import { usePageTitle, usePageLeading, usePageSubtitle, usePageActions } from '../hooks/usePageSubtitle';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

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

  // 엑셀 업로드 관련 state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreviewData, setExcelPreviewData] = useState<any[] | null>(null);
  const [validationResults, setValidationResults] = useState<Array<{
    rowNumber: number;
    data: any[];
    errors: string[];
    warnings: string[];
    isValid: boolean;
  }> | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);

  useEffect(() => {
    loadMembers();
    loadChurchInfo();
    loadFundTypes();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await supabaseApiService.members.getAll({ limit: 500 });
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
    // functional setState — 연속 호출 시 stale snapshot 문제 방지
    setBulkDonations(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  // 엑셀 미리보기 및 검증
  const handleExcelPreview = async () => {
    if (!excelFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    setIsPreviewLoading(true);

    try {
      // 엑셀 파일 읽기
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // 첫 번째 시트 읽기
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // JSON으로 변환 (헤더 포함)
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',  // 빈 셀을 빈 문자열로 처리
        raw: true    // 숫자를 그대로 읽음
      });

      if (jsonData.length < 2) {
        alert('엑셀 파일에 데이터가 없습니다.');
        setIsPreviewLoading(false);
        return;
      }

      // 헤더와 데이터 분리
      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);

      // 헤더 인덱스 매핑
      const headerMap: { [key: string]: number } = {};
      headers.forEach((header: string, index: number) => {
        headerMap[header] = index;
      });

      // 각 행 검증
      const validatedRows = dataRows.map((row: any[], index: number) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        const donorName = row[headerMap['기부자']];
        const isAnonymous = row[headerMap['무명']] === '예' || row[headerMap['무명']] === 'Y' || row[headerMap['무명']] === true;
        const fundType = row[headerMap['헌금유형']];
        const amount = row[headerMap['금액']];

        // 기부자 또는 무명 검증
        if (!isAnonymous && (!donorName || !String(donorName).trim())) {
          errors.push('무명이 아닌 경우 기부자는 필수입니다');
        }

        // 기부자 이름 검증 (무명이 아닌 경우에만)
        if (!isAnonymous && donorName) {
          const member = members.find(m => m.name === String(donorName).trim());
          if (!member) {
            errors.push(`기부자 "${donorName}"를 찾을 수 없습니다`);
          }
        }

        // 헌금 유형 검증
        if (!fundType || !String(fundType).trim()) {
          errors.push('헌금 유형은 필수입니다');
        } else {
          const fundTypeStr = String(fundType).trim();
          if (!fundTypes.includes(fundTypeStr)) {
            errors.push(`헌금 유형 "${fundTypeStr}"는 등록되지 않은 유형입니다`);
          }
        }

        // 금액 검증
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
          errors.push('금액은 0보다 큰 숫자여야 합니다');
        }

        return {
          rowNumber: index + 2, // 엑셀 행 번호 (헤더 1 + 데이터)
          data: row,
          errors,
          warnings,
          isValid: errors.length === 0
        };
      });

      // 검증 결과 저장
      setValidationResults(validatedRows);
      setExcelPreviewData([headers, ...dataRows]);
    } catch (error: any) {
      console.error('파일 검증 실패:', error);
      alert(`파일을 읽는 중 오류가 발생했습니다.\n오류: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // 엑셀에서 데이터 가져오기
  const handleExcelImport = () => {
    if (!excelPreviewData || !validationResults) {
      alert('먼저 파일을 검증해주세요.');
      return;
    }

    const validRows = validationResults.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('가져올 수 있는 유효한 데이터가 없습니다.');
      return;
    }

    // 헤더 인덱스 매핑
    const headers = excelPreviewData[0];
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header: string, index: number) => {
      headerMap[header] = index;
    });

    // 유효한 행만 헌금 목록으로 변환
    const importedDonations: BulkDonationRow[] = validRows.map(validRow => {
      const row = validRow.data;
      const donorName = row[headerMap['기부자']];
      const isAnonymous = row[headerMap['무명']] === '예' || row[headerMap['무명']] === 'Y' || row[headerMap['무명']] === true;
      const fundType = row[headerMap['헌금유형']];
      const amount = Number(row[headerMap['금액']]);
      const note = row[headerMap['적요']] || '';

      let donorId = '';
      if (!isAnonymous && donorName) {
        const member = members.find(m => m.name === String(donorName).trim());
        if (member) {
          donorId = member.id.toString();
        }
      }

      return {
        donorId,
        amount,
        fundType: String(fundType).trim(),
        note: String(note),
        isAnonymous
      };
    });

    // 기존 목록 대체
    setBulkDonations(importedDonations);
    setShowExcelUpload(false);
    setExcelFile(null);
    setExcelPreviewData(null);
    setValidationResults(null);
    alert(`${importedDonations.length}건의 헌금 데이터를 가져왔습니다.`);
  };

  // 엑셀 템플릿 다운로드
  const downloadExcelTemplate = () => {
    const headers = ['기부자', '무명', '헌금유형', '금액', '적요'];
    const sampleData = [
      ['홍길동', '아니오', '주일헌금', 50000, '주일 예배 헌금'],
      ['', '예', '감사헌금', 100000, '감사 헌금'],
    ];

    const worksheetData = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 15 },  // 기부자
      { wch: 10 },  // 무명
      { wch: 15 },  // 헌금유형
      { wch: 12 },  // 금액
      { wch: 30 },  // 적요
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '헌금목록');

    // 파일 다운로드
    XLSX.writeFile(workbook, '헌금_엑셀템플릿.xlsx');
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
      navigate('/donations');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '일괄 헌금 추가에 실패했습니다.';
      console.error('❌ 일괄 헌금 추가 오류:', error);
      alert(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const validBulkCount = bulkDonations.filter(b => (b.donorId || b.isAnonymous) && b.amount > 0).length;

  // 상단바: 진입형 서브 페이지 — 좌측 뒤로가기, 우측 등록 액션
  usePageTitle('헌금 일괄 입력');
  usePageSubtitle(`유효 ${validBulkCount}건`);
  usePageLeading(
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate('/donations')}
      className="h-[32px] w-[32px] p-0"
      title="헌금 관리로 돌아가기"
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );
  usePageActions(
    <Button
      size="sm"
      onClick={handleBulkSubmit}
      disabled={submitLoading || validBulkCount === 0}
    >
      {submitLoading ? '등록 중...' : `${validBulkCount}건 등록`}
    </Button>,
    [validBulkCount, submitLoading]
  );

  return (
    <PageContainer>

      {/* 공통 설정 */}
      {/* 공통 설정 + 헌금 목록 — 통합 카드 (다른 화면과 동일 패턴) */}
      <Card className="overflow-hidden">
        {/* 컨트롤 바: 공통 설정 + 행 추가 */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#EEF1F6] px-[16px] py-[14px]">
          <div className="flex items-center gap-2">
            <label className="text-[12.5px] font-semibold text-muted-foreground">헌금일</label>
            <DatePicker
              value={bulkSettings.offeredOn}
              onChange={(value) => setBulkSettings({ ...bulkSettings, offeredOn: value })}
              placeholder="날짜 선택"
            />
          </div>
          <div className="flex-1" />
          <Button
            onClick={addBulkRow}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            행 추가
          </Button>
        </div>


        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-[12.5px]">
            <thead className="bg-[#FAFBFD]">
              <tr>
                <th className="w-[64px] px-[18px] py-3 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">무명</th>
                <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">기부자</th>
                <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">헌금 유형</th>
                <th className="px-[18px] py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">금액</th>
                <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">적요</th>
                <th className="w-[64px] px-[18px] py-3 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F4F9] bg-card">
              {bulkDonations.map((bulk, index) => (
                <tr key={index} className="transition-colors hover:bg-[#FAFBFD]">
                  <td className="px-[18px] py-3 text-center">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={bulk.isAnonymous}
                        onCheckedChange={(c) => {
                          const checked = c === true;
                          updateBulkRow(index, 'isAnonymous', checked);
                          if (checked) {
                            updateBulkRow(index, 'donorId', '');
                          }
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-[18px] py-3">
                    {bulk.isAnonymous ? (
                      <div className="rounded-[8px] bg-[#F1F4F9] px-3 py-2 text-center text-[12.5px] text-muted-foreground">
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
                  <td className="px-[18px] py-3">
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
                  <td className="px-[18px] py-3">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={bulk.amount ? bulk.amount.toLocaleString('ko-KR') : ''}
                      onChange={(e) => {
                        // 숫자만 추출 후 저장 — 쉼표/공백 제거
                        const digits = e.target.value.replace(/[^\d]/g, '');
                        updateBulkRow(index, 'amount', digits ? Number(digits) : 0);
                      }}
                      className="text-right text-sm tabular-nums"
                    />
                  </td>
                  <td className="px-[18px] py-3">
                    <Input
                      placeholder="비고"
                      value={bulk.note}
                      onChange={(e) => updateBulkRow(index, 'note', e.target.value)}
                      className="text-sm"
                    />
                  </td>
                  <td className="px-[18px] py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBulkRow(index)}
                      disabled={bulkDonations.length === 1}
                      className="h-[30px] w-[30px] p-0 text-[#DC2626] hover:bg-[#FCEBEB] hover:text-[#DC2626] disabled:opacity-30"
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 합계 정보 */}
        <div className="flex items-center justify-end gap-6 border-t border-[#EEF1F6] px-[18px] py-[14px] bg-[#FAFBFD]">
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="text-muted-foreground">총 건수</span>
            <span className="font-bold text-foreground tabular-nums">{validBulkCount}건</span>
          </div>
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="text-muted-foreground">무명</span>
            <span className="font-bold text-foreground tabular-nums">{bulkDonations.filter(b => b.isAnonymous && b.amount > 0).length}건</span>
          </div>
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="text-muted-foreground">총 금액</span>
            <span className="text-[15px] font-bold text-primary tabular-nums">
              {formatCurrency(bulkDonations.reduce((sum, b) => sum + (b.amount || 0), 0))}
            </span>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default BulkDonationInput;
