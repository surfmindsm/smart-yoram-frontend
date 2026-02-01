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
import { Plus, X, Users, ArrowLeft, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    const updated = bulkDonations.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setBulkDonations(updated);
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
            <div className="flex gap-2">
              <Button
                onClick={downloadExcelTemplate}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                템플릿 다운로드
              </Button>
              <Button
                onClick={() => setShowExcelUpload(!showExcelUpload)}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                엑셀에서 가져오기
              </Button>
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
        </div>

        {/* 엑셀 업로드 섹션 */}
        {showExcelUpload && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">엑셀 파일 선택</label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setExcelFile(file);
                      setExcelPreviewData(null);
                      setValidationResults(null);
                    }
                  }}
                />
                <p className="text-xs text-gray-600 mt-1">
                  CSV, XLSX, XLS 파일만 가능 (헤더: 기부자, 무명, 헌금유형, 금액, 적요)
                </p>
              </div>

              {excelFile && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-800">
                    <strong>선택된 파일:</strong> {excelFile.name}
                  </p>
                </div>
              )}

              {excelFile && !excelPreviewData && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleExcelPreview}
                    disabled={isPreviewLoading}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    {isPreviewLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        검증 중...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        파일 검증 및 미리보기
                      </>
                    )}
                  </Button>
                </div>
              )}

              {excelPreviewData && validationResults && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      검증 결과 ({validationResults.filter(r => r.isValid).length}/{validationResults.length}건 유효)
                    </h3>
                    <Button
                      onClick={() => {
                        setExcelPreviewData(null);
                        setValidationResults(null);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* 검증 에러 요약 */}
                  {validationResults.some(r => !r.isValid) && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-40 overflow-y-auto">
                      <h4 className="text-sm font-medium text-red-800 mb-2">❌ 오류가 있는 행</h4>
                      {validationResults
                        .filter(r => !r.isValid)
                        .map((result, idx) => (
                          <div key={idx} className="text-xs text-red-700 mb-1">
                            <strong>행 {result.rowNumber}:</strong> {result.errors.join(', ')}
                          </div>
                        ))}
                    </div>
                  )}

                  {/* 미리보기 테이블 */}
                  <div className="border rounded-md overflow-hidden">
                    <div className="max-h-80 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">상태</th>
                            {excelPreviewData[0].map((header: string, index: number) => (
                              <th
                                key={index}
                                className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {excelPreviewData.slice(1).map((row: any[], rowIndex: number) => {
                            const result = validationResults[rowIndex];
                            return (
                              <tr
                                key={rowIndex}
                                className={result.isValid ? 'bg-white' : 'bg-red-50'}
                              >
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {result.isValid ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                  )}
                                </td>
                                {row.map((cell: any, cellIndex: number) => (
                                  <td key={cellIndex} className="px-3 py-2 whitespace-nowrap">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 가져오기 버튼 */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleExcelImport}
                      disabled={validationResults.filter(r => r.isValid).length === 0}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {validationResults.filter(r => r.isValid).length}건 가져오기
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
