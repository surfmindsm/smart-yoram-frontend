import React, { useState } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { Button } from "./ui";
import { Card, CardContent } from "./ui";
import { Alert, AlertDescription, AlertTitle } from "./ui";
import { Badge } from "./ui";
import { Input } from "./ui";
import { FileSpreadsheet, Download, Upload, Users, BarChart3, AlertTriangle, CheckCircle2, X, Edit2, Save } from 'lucide-react';
import { cn } from '../lib/utils';

interface ParsedRow {
  rowNumber: number;
  data: any;
  errors: string[];
  warnings: string[];
  suggestions: any;
  isValid: boolean;
}

interface ParseResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  rows: ParsedRow[];
}

const ExcelManagement: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<any>({});

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setParseResult(null);
      setUploadResult(null);
    }
  };

  // 파일 파싱 (미리보기)
  const handleParse = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      console.log('📊 [엑셀 파싱] 시작:', selectedFile.name);

      const result = await supabaseApiService.excel.parseMembers(selectedFile);
      setParseResult(result);

      console.log('✅ [엑셀 파싱] 성공:', result);
    } catch (error: any) {
      console.error('파싱 실패:', error);
      alert(error.message || '파일 파싱에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 최종 저장
  const handleSave = async () => {
    if (!parseResult) {
      return;
    }

    // 유효한 행만 저장
    const validRows = parseResult.rows.filter(row => row.isValid);

    if (validRows.length === 0) {
      alert('저장할 수 있는 유효한 데이터가 없습니다.');
      return;
    }

    const confirmed = window.confirm(
      `총 ${validRows.length}개의 교인 정보를 저장하시겠습니까?\n` +
      `(신규 등록 또는 기존 정보 업데이트)`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      console.log('📊 [엑셀 저장] 시작, 행 수:', validRows.length);

      const result = await supabaseApiService.excel.saveParsedMembers(validRows);
      setUploadResult(result);
      setParseResult(null);
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      console.log('✅ [엑셀 저장] 성공:', result);
    } catch (error: any) {
      console.error('저장 실패:', error);
      alert(error.message || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 행 편집 시작
  const startEditingRow = (rowNumber: number, data: any) => {
    setEditingRow(rowNumber);
    setEditedData({ ...data });
  };

  // 행 편집 저장
  const saveEditedRow = (rowNumber: number) => {
    if (!parseResult) return;

    const updatedRows = parseResult.rows.map(row => {
      if (row.rowNumber === rowNumber) {
        return {
          ...row,
          data: editedData,
          errors: [], // 에디트 후 재검증 필요하면 추가
          warnings: []
        };
      }
      return row;
    });

    setParseResult({
      ...parseResult,
      rows: updatedRows
    });

    setEditingRow(null);
    setEditedData({});
  };

  // 행 삭제
  const deleteRow = (rowNumber: number) => {
    if (!parseResult) return;

    const confirmed = window.confirm('이 행을 삭제하시겠습니까?');
    if (!confirmed) return;

    const updatedRows = parseResult.rows.filter(row => row.rowNumber !== rowNumber);

    setParseResult({
      ...parseResult,
      rows: updatedRows,
      totalRows: updatedRows.length,
      validRows: updatedRows.filter(r => r.isValid).length,
      errorRows: updatedRows.filter(r => !r.isValid).length
    });
  };

  const handleDownloadMembers = async () => {
    try {
      console.log('📊 [교인 명단 다운로드] 시작');

      const data = await supabaseApiService.excel.downloadMembers();

      let blob: Blob;
      if (data instanceof Blob) {
        blob = data;
      } else {
        blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const today = new Date().toISOString().split('T')[0];
      link.download = `교인명단_${today}.csv`;

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
        blob = new Blob([data], {
          type: 'text/csv; charset=utf-8'
        });
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'member_upload_template.csv';

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
                  <p className="text-xs text-muted-foreground">Excel 파일 (.xlsx, .xls, .csv)</p>
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
                  accept=".xlsx,.xls,.csv"
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
                onClick={handleParse}
                disabled={!selectedFile || loading}
              >
                {loading ? '파싱 중...' : '파일 검증'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      {parseResult && (
        <Card className="border-muted">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">미리보기 및 검증 결과</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setParseResult(null)}>
                  취소
                </Button>
                <Button onClick={handleSave} disabled={loading || parseResult.validRows === 0}>
                  {loading ? '저장 중...' : `${parseResult.validRows}개 행 저장`}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">전체</p>
                <p className="text-2xl font-bold">{parseResult.totalRows}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">유효</p>
                <p className="text-2xl font-bold text-green-600">{parseResult.validRows}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">오류</p>
                <p className="text-2xl font-bold text-red-600">{parseResult.errorRows}</p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">행</th>
                    <th className="px-4 py-2 text-left">이름</th>
                    <th className="px-4 py-2 text-left">전화번호</th>
                    <th className="px-4 py-2 text-left">직분</th>
                    <th className="px-4 py-2 text-left">구역</th>
                    <th className="px-4 py-2 text-left">상태</th>
                    <th className="px-4 py-2 text-center">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={cn(
                        "border-b",
                        !row.isValid && "bg-red-50",
                        row.warnings.length > 0 && row.isValid && "bg-yellow-50"
                      )}
                    >
                      <td className="px-4 py-2">{row.rowNumber}</td>
                      <td className="px-4 py-2">
                        {editingRow === row.rowNumber ? (
                          <Input
                            value={editedData['이름*'] || ''}
                            onChange={(e) => setEditedData({ ...editedData, '이름*': e.target.value })}
                            className="h-8 text-sm"
                          />
                        ) : (
                          row.data['이름*']
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {editingRow === row.rowNumber ? (
                          <Input
                            value={editedData['전화번호*'] || ''}
                            onChange={(e) => setEditedData({ ...editedData, '전화번호*': e.target.value })}
                            className="h-8 text-sm"
                          />
                        ) : (
                          row.data['전화번호*']
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {editingRow === row.rowNumber ? (
                          <Input
                            value={editedData['직분'] || ''}
                            onChange={(e) => setEditedData({ ...editedData, '직분': e.target.value })}
                            className="h-8 text-sm"
                          />
                        ) : (
                          row.data['직분']
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {editingRow === row.rowNumber ? (
                          <Input
                            value={editedData['소구역'] || ''}
                            onChange={(e) => setEditedData({ ...editedData, '소구역': e.target.value })}
                            className="h-8 text-sm"
                          />
                        ) : (
                          row.data['소구역']
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="space-y-1">
                          {row.errors.map((err, idx) => (
                            <div key={idx} className="text-xs text-red-600 flex items-start gap-1">
                              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{err}</span>
                            </div>
                          ))}
                          {row.warnings.map((warn, idx) => (
                            <div key={idx} className="text-xs text-yellow-600 flex items-start gap-1">
                              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{warn}</span>
                            </div>
                          ))}
                          {row.isValid && row.errors.length === 0 && row.warnings.length === 0 && (
                            <div className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>정상</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1">
                          {editingRow === row.rowNumber ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => saveEditedRow(row.rowNumber)}
                                className="h-7 px-2"
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingRow(null)}
                                className="h-7 px-2"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingRow(row.rowNumber, row.data)}
                                className="h-7 px-2"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteRow(row.rowNumber)}
                                className="h-7 px-2 text-red-600 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <Card className="border-muted">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="text-base font-semibold text-foreground">업로드 결과</h4>
            </div>
            <p className="text-sm text-muted-foreground">{uploadResult.message}</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Badge variant="default" className="mb-2 bg-green-600">신규 등록</Badge>
                <p className="text-2xl font-bold text-foreground">{uploadResult.created}</p>
              </div>
              <div className="text-center">
                <Badge variant="default" className="mb-2 bg-blue-600">정보 수정</Badge>
                <p className="text-2xl font-bold text-foreground">{uploadResult.updated}</p>
              </div>
              <div className="text-center">
                <Badge variant="destructive" className="mb-2">오류</Badge>
                <p className="text-2xl font-bold text-foreground">{uploadResult.errors?.length || 0}</p>
              </div>
            </div>

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>오류 목록</AlertTitle>
                <AlertDescription>
                  <ul className="text-sm space-y-1 mt-2">
                    {uploadResult.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

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
                    <div className="p-3 rounded-lg bg-primary-500/10">
                      <BarChart3 className="h-6 w-6 text-primary-600" />
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
        <Card className="border-muted bg-primary-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-primary-600" />
              <h4 className="font-medium text-primary-800">업로드 안내</h4>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-primary-700">
              <li><strong>교인 업로드:</strong> 먼저 템플릿을 다운로드하여 양식을 확인하세요.</li>
              <li><strong>파일 검증:</strong> 업로드 전 "파일 검증" 버튼으로 데이터를 미리 확인할 수 있습니다.</li>
              <li><strong>자동 매칭:</strong> 직분과 구역은 유사한 값을 자동으로 매칭합니다.</li>
              <li><strong>미리보기:</strong> 오류가 있는 행은 빨간색으로 표시되며, 직접 수정할 수 있습니다.</li>
              <li><strong>필수 필드:</strong> 이름, 전화번호는 반드시 입력해야 합니다.</li>
              <li><strong>전화번호 형식:</strong> 010-1234-5678 형태로 입력하세요.</li>
              <li><strong>중복 처리:</strong> 전화번호가 같으면 기존 정보를 업데이트합니다.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExcelManagement;
