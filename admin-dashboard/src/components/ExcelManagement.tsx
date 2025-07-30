import React, { useState } from 'react';
import { api } from '../services/api';

interface UploadResult {
  message: string;
  created: number;
  updated: number;
  errors: string[];
}

const ExcelManagement: React.FC = () => {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      alert('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/excel/members/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      console.error('업로드 실패:', error);
      alert(error.response?.data?.detail || '업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMembers = async () => {
    try {
      const response = await api.get('/excel/members/download', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const today = new Date().toISOString().split('T')[0];
      link.download = `교인명단_${today}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드에 실패했습니다.');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/excel/members/template', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'member_upload_template.xlsx';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('템플릿 다운로드 실패:', error);
      alert('템플릿 다운로드에 실패했습니다.');
    }
  };

  const handleDownloadAttendance = async () => {
    try {
      const startDate = prompt('시작일을 입력하세요 (YYYY-MM-DD)', '2024-01-01');
      const endDate = prompt('종료일을 입력하세요 (YYYY-MM-DD)', new Date().toISOString().split('T')[0]);
      
      if (!startDate || !endDate) return;

      const response = await api.get(`/excel/attendance/download?start_date=${startDate}&end_date=${endDate}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `출석기록_${startDate}_${endDate}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('출석 기록 다운로드 실패:', error);
      alert('출석 기록 다운로드에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">엑셀 관리</h2>
      </div>

      {/* Upload Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">교인 명단 업로드</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">클릭하여 파일 선택</span> 또는 드래그 앤 드롭
                </p>
                <p className="text-xs text-gray-500">Excel 파일 (.xlsx, .xls)</p>
                {selectedFile && (
                  <p className="mt-2 text-sm text-indigo-600 font-medium">
                    선택된 파일: {selectedFile.name}
                  </p>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleDownloadTemplate}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              📥 업로드 템플릿 다운로드
            </button>
            
            <button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '업로드 중...' : '업로드'}
            </button>
          </div>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className="mt-6 p-4 border rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-2">업로드 결과</h4>
            <div className="space-y-2">
              <p className="text-green-600">
                ✅ {uploadResult.message}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-green-800 font-medium">신규 등록</div>
                  <div className="text-green-600 text-lg">{uploadResult.created}명</div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-blue-800 font-medium">정보 수정</div>
                  <div className="text-blue-600 text-lg">{uploadResult.updated}명</div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-red-800 font-medium">오류</div>
                  <div className="text-red-600 text-lg">{uploadResult.errors.length}건</div>
                </div>
              </div>
              
              {uploadResult.errors.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-red-800 mb-2">오류 목록:</h5>
                  <ul className="text-sm text-red-600 space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Download Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">데이터 다운로드</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">교인 명단</h4>
                <p className="text-sm text-gray-500">전체 교인 정보</p>
              </div>
            </div>
            <button
              onClick={handleDownloadMembers}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              교인 명단 다운로드
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">출석 기록</h4>
                <p className="text-sm text-gray-500">기간별 출석 데이터</p>
              </div>
            </div>
            <button
              onClick={handleDownloadAttendance}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              출석 기록 다운로드
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">업로드 템플릿</h4>
                <p className="text-sm text-gray-500">양식 및 예시 포함</p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
            >
              템플릿 다운로드
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">사용 방법</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>교인 업로드:</strong> 먼저 템플릿을 다운로드하여 양식을 확인하세요.</li>
                <li><strong>필수 필드:</strong> 이름, 성별, 전화번호는 반드시 입력해야 합니다.</li>
                <li><strong>전화번호 형식:</strong> 010-1234-5678 형태로 입력하세요.</li>
                <li><strong>생년월일 형식:</strong> YYYY-MM-DD 형태로 입력하세요 (예: 1990-01-15).</li>
                <li><strong>중복 처리:</strong> 전화번호가 같으면 기존 정보를 업데이트합니다.</li>
                <li><strong>파일 크기:</strong> 최대 10MB까지 업로드 가능합니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelManagement;