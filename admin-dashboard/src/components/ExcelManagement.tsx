import React, { useState } from 'react';
import { api } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { FileSpreadsheet, Download, Upload, Users, BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

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
        <h2 className="text-3xl font-bold tracking-tight text-foreground">엑셀 관리</h2>
      </div>

      {/* Upload Section */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-lg">교인 명단 업로드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className={cn(
                "flex flex-col items-center justify-center w-full h-64",
                "border-2 border-dashed rounded-lg cursor-pointer",
                "bg-muted/50 hover:bg-muted transition-colors",
                "border-muted-foreground/25"
              )}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">클릭하여 파일 선택</span> 또는 드래그 앤 드롭
                </p>
                <p className="text-xs text-muted-foreground">Excel 파일 (.xlsx, .xls)</p>
                {selectedFile && (
                  <Badge variant="secondary" className="mt-2">
                    {selectedFile.name}
                  </Badge>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              업로드 템플릿 다운로드
            </Button>
            
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
            >
              {loading ? '업로드 중...' : '업로드'}
            </Button>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  업로드 결과
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{uploadResult.message}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <Badge variant="success" className="mb-2">신규 등록</Badge>
                    <p className="text-2xl font-bold text-foreground">{uploadResult.created}</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="default" className="mb-2">정보 수정</Badge>
                    <p className="text-2xl font-bold text-foreground">{uploadResult.updated}</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="destructive" className="mb-2">오류</Badge>
                    <p className="text-2xl font-bold text-foreground">{uploadResult.errors.length}</p>
                  </div>
                </div>
                
                {uploadResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>오류 목록</AlertTitle>
                    <AlertDescription>
                      <ul className="text-sm space-y-1 mt-2">
                        {uploadResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-lg">데이터 다운로드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-4">
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-base">교인 명단</CardTitle>
                <CardDescription>전체 교인 정보</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDownloadMembers}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  교인 명단 다운로드
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-4">
                <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-base">출석 기록</CardTitle>
                <CardDescription>기간별 출석 데이터</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDownloadAttendance}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  출석 기록 다운로드
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-4">
                <FileSpreadsheet className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle className="text-base">업로드 템플릿</CardTitle>
                <CardDescription>양식 및 예시 포함</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDownloadTemplate}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  템플릿 다운로드
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>사용 방법</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>교인 업로드:</strong> 먼저 템플릿을 다운로드하여 양식을 확인하세요.</li>
            <li><strong>필수 필드:</strong> 이름, 성별, 전화번호는 반드시 입력해야 합니다.</li>
            <li><strong>전화번호 형식:</strong> 010-1234-5678 형태로 입력하세요.</li>
            <li><strong>생년월일 형식:</strong> YYYY-MM-DD 형태로 입력하세요 (예: 1990-01-15).</li>
            <li><strong>중복 처리:</strong> 전화번호가 같으면 기존 정보를 업데이트합니다.</li>
            <li><strong>파일 크기:</strong> 최대 10MB까지 업로드 가능합니다.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ExcelManagement;