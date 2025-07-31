import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '../lib/utils';

interface Member {
  id: number;
  name: string;
  phone_number: string;
  position: string | null;
  profile_photo_url: string | null;
}

interface QRCode {
  id: number;
  member_id: number;
  code: string;
  qr_type: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const QRCodeManagement: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [qrCode, setQrCode] = useState<QRCode | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members/?member_status=active');
      setMembers(response.data);
    } catch (error) {
      console.error('교인 목록 조회 실패:', error);
    }
  };

  const generateQRCode = async (memberId: number, qrType: string = 'attendance') => {
    setLoading(true);
    try {
      const response = await api.post(`/qr-codes/generate/${memberId}`, {
        qr_type: qrType,
        expires_at: null // 만료일 없음
      });
      
      setQrCode(response.data);
      
      // QR 코드 이미지 URL 설정
      const imageUrl = `${process.env.REACT_APP_API_URL}/qr-codes/${response.data.code}/image`;
      setQrImageUrl(imageUrl);
      
    } catch (error) {
      console.error('QR 코드 생성 실패:', error);
      alert('QR 코드 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const verifyQRCode = async (code: string, attendanceType: string = '주일예배') => {
    setLoading(true);
    try {
      const response = await api.post(`/qr-codes/verify/${code}?attendance_type=${attendanceType}`);
      setScanResult(response.data);
      
      if (response.data.status === 'success') {
        alert(`${response.data.member.name}님의 출석이 체크되었습니다.`);
      } else if (response.data.status === 'already_marked') {
        alert('이미 출석 체크된 교인입니다.');
      }
    } catch (error) {
      console.error('QR 코드 인증 실패:', error);
      alert('유효하지 않은 QR 코드입니다.');
    } finally {
      setLoading(false);
    }
  };

  const getMemberQRCode = async (memberId: number) => {
    try {
      const response = await api.get(`/qr-codes/member/${memberId}`);
      if (response.data) {
        setQrCode(response.data);
        const imageUrl = `${process.env.REACT_APP_API_URL}/qr-codes/${response.data.code}/image`;
        setQrImageUrl(imageUrl);
      } else {
        setQrCode(null);
        setQrImageUrl('');
      }
    } catch (error) {
      console.error('QR 코드 조회 실패:', error);
      setQrCode(null);
      setQrImageUrl('');
    }
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setScanResult(null);
    getMemberQRCode(member.id);
  };

  const handlePrintQR = () => {
    if (!qrImageUrl || !selectedMember) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedMember.name}님 출석용 QR 코드</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px auto;
              display: inline-block;
              border-radius: 10px;
            }
            .member-info {
              margin-bottom: 20px;
            }
            .member-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .member-details {
              font-size: 14px;
              color: #666;
            }
            .qr-image {
              border: 1px solid #ddd;
              padding: 10px;
              background: white;
            }
            .instructions {
              margin-top: 20px;
              font-size: 12px;
              color: #888;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="member-info">
              <div class="member-name">${selectedMember.name}</div>
              <div class="member-details">
                ${selectedMember.position || ''} | ${selectedMember.phone_number}
              </div>
            </div>
            <img src="${qrImageUrl}" alt="QR Code" class="qr-image" />
            <div class="instructions">
              출석 체크용 QR 코드<br>
              생성일: ${new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">QR 코드 관리</h2>
        <Button
          onClick={() => setScanMode(!scanMode)}
          variant={scanMode ? "destructive" : "default"}
        >
          {scanMode ? 'QR 생성 모드' : 'QR 스캔 모드'}
        </Button>
      </div>

      {!scanMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member Selection */}
          <Card className="border-muted">
            <CardHeader>
              <CardTitle>교인 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto border border-muted rounded-md">
                {members.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => handleMemberSelect(member)}
                    className={cn(
                      "p-3 border-b border-muted cursor-pointer hover:bg-muted/50 transition-colors",
                      selectedMember?.id === member.id && "bg-primary/10 border-primary/20"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      {member.profile_photo_url ? (
                        <img
                          src={member.profile_photo_url?.startsWith('http') ? member.profile_photo_url : `${process.env.REACT_APP_API_URL}${member.profile_photo_url}`}
                          alt={member.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground font-medium text-sm">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.position && `${member.position} | `}{member.phone_number}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <Card className="border-muted">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {selectedMember ? `${selectedMember.name}님 QR 코드` : 'QR 코드'}
                </CardTitle>
                {selectedMember && qrCode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrintQR}
                  >
                    인쇄하기
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedMember ? (
                <>
                  {qrCode ? (
                    <div className="text-center">
                      <div className="mb-4">
                        <img
                          src={qrImageUrl}
                          alt="QR Code"
                          className="mx-auto border border-muted p-4 rounded-lg"
                          style={{ maxWidth: '200px' }}
                        />
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>코드:</strong> {qrCode.code}</p>
                        <p><strong>유형:</strong> {qrCode.qr_type}</p>
                        <p><strong>생성일:</strong> {new Date(qrCode.created_at).toLocaleDateString('ko-KR')}</p>
                        <p>
                          <strong>상태:</strong> 
                          <Badge 
                            variant={qrCode.is_active ? 'success' : 'destructive'}
                            className="ml-1"
                          >
                            {qrCode.is_active ? '활성' : '비활성'}
                          </Badge>
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => generateQRCode(selectedMember.id)}
                        disabled={loading}
                        className="mt-4 w-full"
                      >
                        {loading ? '생성 중...' : 'QR 코드 재생성'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m0 4v8m-4-4h8" />
                        </svg>
                      </div>
                      <p className="text-muted-foreground mb-4">QR 코드가 없습니다.</p>
                      <Button
                        onClick={() => generateQRCode(selectedMember.id)}
                        disabled={loading}
                      >
                        {loading ? '생성 중...' : 'QR 코드 생성'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground">교인을 선택해주세요.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-muted">
          <CardHeader>
            <CardTitle>QR 코드 스캔</CardTitle>
          </CardHeader>
          <CardContent>
          
            <div className="space-y-4">
              <Alert>
                <AlertTitle>참고사항</AlertTitle>
                <AlertDescription>
                  실제 환경에서는 카메라를 사용한 QR 코드 스캔 기능이 구현됩니다.
                </AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="qr-input">QR 코드 입력</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    id="qr-input"
                    type="text"
                    placeholder="QR 코드를 입력하거나 스캔하세요"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const code = (e.target as HTMLInputElement).value;
                        if (code) verifyQRCode(code);
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const input = document.querySelector('#qr-input') as HTMLInputElement;
                      if (input?.value) verifyQRCode(input.value);
                    }}
                    disabled={loading}
                  >
                    {loading ? '확인 중...' : '출석 체크'}
                  </Button>
                </div>
              </div>

              {scanResult && (
                <Card className="mt-6 border-muted">
                  <CardContent className="p-4">
                    {scanResult.status === 'success' ? (
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {scanResult.member.profile_photo_url ? (
                            <img
                              src={scanResult.member.profile_photo_url?.startsWith('http') ? scanResult.member.profile_photo_url : `${process.env.REACT_APP_API_URL}${scanResult.member.profile_photo_url}`}
                              alt={scanResult.member.name}
                              className="h-16 w-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground font-medium">
                                {scanResult.member.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-green-600">출석 체크 완료!</h4>
                          <p className="text-foreground">
                            <strong>{scanResult.member.name}</strong>님의 출석이 기록되었습니다.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(scanResult.attendance.attendance_date).toLocaleDateString('ko-KR')} 
                            {' - ' + scanResult.attendance.attendance_type}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-yellow-600">
                          {scanResult.message}
                        </h4>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRCodeManagement;