import React, { useState } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { Button } from "@/components/ui3";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui3";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui3";
import { Badge } from "@/components/ui3";
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
      console.log('📊 [엑셀 업로드] 시작:', selectedFile.name);

      const result = await supabaseApiService.excel.uploadMembers(selectedFile);

      setUploadResult(result);
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('업로드 실패:', error);
      alert(error.message || '업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMembers = async () => {
    try {
      console.log('📊 [교인 명단 다운로드] 시작');

      const data = await supabaseApiService.excel.downloadMembers();

      let blob: Blob;
      if (data instanceof Blob) {
        blob = data;
      } else {
        // If data is string, create blob
        blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }

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
      console.log('📊 [템플릿 다운로드] 시작');

      const data = await supabaseApiService.excel.downloadTemplate();

      let blob: Blob;
      if (data instanceof Blob) {
        blob = data;
      } else {
        // If data is string, create blob
        blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }

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

      console.log('📊 [출석 기록 다운로드] 시작:', { startDate, endDate });

      const data = await supabaseApiService.excel.downloadAttendance(startDate, endDate);

      let blob: Blob;
      if (data instanceof Blob) {
        blob = data;
      } else {
        // If data is string, create blob
        blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }

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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">교인 명단 업로드</h3>
        <Card className="border-muted">
          <CardContent className="p-6 space-y-4">
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
              <Card className="border-muted">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h4 className="text-base font-semibold text-foreground">업로드 결과</h4>
                  </div>
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
      </div>

      {/* Download Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">데이터 다운로드</h3>
        <Card className="border-muted">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-muted">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-semibold text-foreground">교인 명단</h4>
                      <p className="text-sm text-muted-foreground">전체 교인 정보</p>
                    </div>
                  </div>
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

              <Card className="border-muted">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-semibold text-foreground">출석 기록</h4>
                      <p className="text-sm text-muted-foreground">기간별 출석 데이터</p>
                    </div>
                  </div>
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

              <Card className="border-muted">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <FileSpreadsheet className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-semibold text-foreground">업로드 템플릿</h4>
                      <p className="text-sm text-muted-foreground">양식 및 예시 포함</p>
                    </div>
                  </div>
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
      </div>

      {/* Instructions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">사용 방법</h3>
        <Card className="border-muted bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-800">업로드 안내</h4>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-blue-700">
              <li><strong>교인 업로드:</strong> 먼저 템플릿을 다운로드하여 양식을 확인하세요.</li>
              <li><strong>필수 필드:</strong> 이름, 성별, 전화번호는 반드시 입력해야 합니다.</li>
              <li><strong>전화번호 형식:</strong> 010-1234-5678 형태로 입력하세요.</li>
              <li><strong>생년월일 형식:</strong> YYYY-MM-DD 형태로 입력하세요 (예: 1990-01-15).</li>
              <li><strong>중복 처리:</strong> 전화번호가 같으면 기존 정보를 업데이트합니다.</li>
              <li><strong>파일 크기:</strong> 최대 10MB까지 업로드 가능합니다.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExcelManagement;