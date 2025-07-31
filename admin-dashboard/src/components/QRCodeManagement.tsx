import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

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
        <h2 className="text-2xl font-bold text-gray-900">QR 코드 관리</h2>
        <button
          onClick={() => setScanMode(!scanMode)}
          className={`px-4 py-2 rounded-md ${
            scanMode 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {scanMode ? 'QR 생성 모드' : 'QR 스캔 모드'}
        </button>
      </div>

      {!scanMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">교인 선택</h3>
            
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
              {members.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedMember?.id === member.id ? 'bg-indigo-50 border-indigo-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {member.profile_photo_url ? (
                      <img
                        src={`${process.env.REACT_APP_API_URL}${member.profile_photo_url}`}
                        alt={member.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">
                        {member.position && `${member.position} | `}{member.phone_number}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code Display */}
          <div className="bg-white rounded-lg shadow p-6">
            {selectedMember ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedMember.name}님 QR 코드
                  </h3>
                  {qrCode && (
                    <button
                      onClick={handlePrintQR}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      인쇄하기
                    </button>
                  )}
                </div>

                {qrCode ? (
                  <div className="text-center">
                    <div className="mb-4">
                      <img
                        src={qrImageUrl}
                        alt="QR Code"
                        className="mx-auto border border-gray-200 p-4 rounded-lg"
                        style={{ maxWidth: '200px' }}
                      />
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>코드:</strong> {qrCode.code}</p>
                      <p><strong>유형:</strong> {qrCode.qr_type}</p>
                      <p><strong>생성일:</strong> {new Date(qrCode.created_at).toLocaleDateString('ko-KR')}</p>
                      <p>
                        <strong>상태:</strong> 
                        <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                          qrCode.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {qrCode.is_active ? '활성' : '비활성'}
                        </span>
                      </p>
                    </div>
                    
                    <button
                      onClick={() => generateQRCode(selectedMember.id)}
                      disabled={loading}
                      className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                      {loading ? '생성 중...' : 'QR 코드 재생성'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m0 4v8m-4-4h8" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-4">QR 코드가 없습니다.</p>
                    <button
                      onClick={() => generateQRCode(selectedMember.id)}
                      disabled={loading}
                      className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                      {loading ? '생성 중...' : 'QR 코드 생성'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-gray-500">교인을 선택해주세요.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">QR 코드 스캔</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR 코드 입력 (실제 환경에서는 카메라 스캔)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="QR 코드를 입력하거나 스캔하세요"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const code = (e.target as HTMLInputElement).value;
                      if (code) verifyQRCode(code);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="QR 코드"]') as HTMLInputElement;
                    if (input?.value) verifyQRCode(input.value);
                  }}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? '확인 중...' : '출석 체크'}
                </button>
              </div>
            </div>

            {scanResult && (
              <div className="mt-6 p-4 border rounded-lg">
                {scanResult.status === 'success' ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {scanResult.member.profile_photo_url ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL}${scanResult.member.profile_photo_url}`}
                          alt={scanResult.member.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {scanResult.member.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-green-800">출석 체크 완료!</h4>
                      <p className="text-gray-600">
                        <strong>{scanResult.member.name}</strong>님의 출석이 기록되었습니다.
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(scanResult.attendance.attendance_date).toLocaleDateString('ko-KR')} 
                        {' - ' + scanResult.attendance.attendance_type}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-yellow-800">
                      {scanResult.message}
                    </h4>
                  </div>
                )}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">참고사항</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>실제 환경에서는 카메라를 사용한 QR 코드 스캔 기능이 구현됩니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeManagement;