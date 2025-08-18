import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  FileText,
  DollarSign,
  Calendar,
  User,
  Receipt
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

// 타입 정의
interface Member {
  id: string;
  name: string;
  rrn?: string;
  address?: string;
}

interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  offeredOn: string;
  fundType: string;
  amount: number;
  note?: string;
  inputUserId: string;
}

interface Receipt {
  id: string;
  donorId: string;
  donorName: string;
  taxYear: number;
  issueNo: string;
  totalAmount: number;
  issuedAt?: string;
  issuedBy?: string;
  canceledAt?: string;
}

// 헌금 유형 옵션
const FUND_TYPES = [
  '십일조',
  '감사헌금',
  '선교헌금',
  '건축헌금',
  '절기헌금',
  '특별헌금',
  '기타'
];

const DonationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'donations' | 'receipts'>('donations');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<string>('');

  // 새 헌금 입력 폼 상태
  const [newDonation, setNewDonation] = useState({
    donorId: '',
    offeredOn: new Date().toISOString().split('T')[0],
    fundType: '십일조',
    amount: 0,
    note: ''
  });

  useEffect(() => {
    // TODO: API 연결 시 실제 데이터 로드
    loadMockData();
  }, []);

  const loadMockData = () => {
    // 목업 데이터
    const mockMembers: Member[] = [
      { id: '1', name: '김철수', rrn: '801234-1******', address: '서울시 강남구' },
      { id: '2', name: '이영희', rrn: '750101-2******', address: '서울시 서초구' },
      { id: '3', name: '박민수', rrn: '851215-1******', address: '서울시 송파구' }
    ];

    const mockDonations: Donation[] = [
      {
        id: '1',
        donorId: '1',
        donorName: '김철수',
        offeredOn: '2024-12-01',
        fundType: '십일조',
        amount: 100000,
        note: '12월 십일조',
        inputUserId: 'admin'
      },
      {
        id: '2',
        donorId: '1',
        donorName: '김철수',
        offeredOn: '2024-12-08',
        fundType: '감사헌금',
        amount: 50000,
        note: '승진 감사',
        inputUserId: 'admin'
      },
      {
        id: '3',
        donorId: '2',
        donorName: '이영희',
        offeredOn: '2024-12-01',
        fundType: '십일조',
        amount: 80000,
        inputUserId: 'admin'
      }
    ];

    const mockReceipts: Receipt[] = [
      {
        id: '1',
        donorId: '1',
        donorName: '김철수',
        taxYear: 2024,
        issueNo: '2024-001',
        totalAmount: 1200000,
        issuedAt: '2024-12-31',
        issuedBy: '담임목사'
      }
    ];

    setMembers(mockMembers);
    setDonations(mockDonations);
    setReceipts(mockReceipts);
  };

  const handleAddDonation = () => {
    if (!newDonation.donorId || newDonation.amount <= 0) {
      alert('기부자와 금액을 입력해주세요.');
      return;
    }

    const donor = members.find(m => m.id === newDonation.donorId);
    if (!donor) {
      alert('기부자를 찾을 수 없습니다.');
      return;
    }

    const donation: Donation = {
      id: Date.now().toString(),
      donorId: newDonation.donorId,
      donorName: donor.name,
      offeredOn: newDonation.offeredOn,
      fundType: newDonation.fundType,
      amount: newDonation.amount,
      note: newDonation.note,
      inputUserId: 'admin' // TODO: 실제 로그인 사용자
    };

    setDonations([donation, ...donations]);
    setIsAddModalOpen(false);
    setNewDonation({
      donorId: '',
      offeredOn: new Date().toISOString().split('T')[0],
      fundType: '십일조',
      amount: 0,
      note: ''
    });
  };

  const generateReceipt = () => {
    if (!selectedDonor) {
      alert('기부자를 선택해주세요.');
      return;
    }

    const donor = members.find(m => m.id === selectedDonor);
    const donorDonations = donations.filter(d => 
      d.donorId === selectedDonor && 
      new Date(d.offeredOn).getFullYear() === selectedYear
    );

    if (donorDonations.length === 0) {
      alert('해당 기부자의 헌금 내역이 없습니다.');
      return;
    }

    const totalAmount = donorDonations.reduce((sum, d) => sum + d.amount, 0);
    const issueNo = `${selectedYear}-${String(receipts.length + 1).padStart(3, '0')}`;

    const receipt: Receipt = {
      id: Date.now().toString(),
      donorId: selectedDonor,
      donorName: donor?.name || '',
      taxYear: selectedYear,
      issueNo,
      totalAmount,
      issuedAt: new Date().toISOString().split('T')[0],
      issuedBy: '담임목사'
    };

    setReceipts([receipt, ...receipts]);
    setIsReceiptModalOpen(false);
    setSelectedDonor('');
    alert('기부금 영수증이 발행되었습니다.');
  };

  const filteredDonations = donations.filter(donation =>
    donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donation.fundType.includes(searchTerm)
  );

  const filteredReceipts = receipts.filter(receipt =>
    receipt.donorName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    receipt.taxYear === selectedYear
  );

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">헌금 관리</h1>
          <p className="text-gray-600">교인별 헌금내역을 관리하고 연말정산 영수증을 발행합니다.</p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-1 mb-6">
        <Button
          variant={activeTab === 'donations' ? 'default' : 'outline'}
          onClick={() => setActiveTab('donations')}
          className="flex items-center space-x-2"
        >
          <DollarSign className="w-4 h-4" />
          <span>헌금 내역</span>
        </Button>
        <Button
          variant={activeTab === 'receipts' ? 'default' : 'outline'}
          onClick={() => setActiveTab('receipts')}
          className="flex items-center space-x-2"
        >
          <Receipt className="w-4 h-4" />
          <span>기부금 영수증</span>
        </Button>
      </div>

      {/* 헌금 내역 탭 */}
      {activeTab === 'donations' && (
        <div className="space-y-6">
          {/* 컨트롤 바 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="기부자명 또는 헌금 유형 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>헌금 입력</span>
              </Button>
            </div>
          </div>

          {/* 헌금 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">이번 달 총액</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(donations.reduce((sum, d) => sum + d.amount, 0))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">헌금 건수</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{donations.length}건</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">기부자 수</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(donations.map(d => d.donorId)).size}명
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">평균 헌금</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {donations.length > 0 ? formatCurrency(Math.round(donations.reduce((sum, d) => sum + d.amount, 0) / donations.length)) : '0원'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 헌금 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>헌금 내역</CardTitle>
              <CardDescription>등록된 헌금 내역을 확인할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">날짜</th>
                      <th className="text-left py-2">기부자</th>
                      <th className="text-left py-2">헌금 유형</th>
                      <th className="text-right py-2">금액</th>
                      <th className="text-left py-2">적요</th>
                      <th className="text-center py-2">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.map((donation) => (
                      <tr key={donation.id} className="border-b">
                        <td className="py-3">{donation.offeredOn}</td>
                        <td className="py-3">{donation.donorName}</td>
                        <td className="py-3">{donation.fundType}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(donation.amount)}</td>
                        <td className="py-3 text-gray-600">{donation.note}</td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredDonations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    등록된 헌금 내역이 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 영수증 탭 */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          {/* 컨트롤 바 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {[2024, 2023, 2022, 2021, 2020].map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="기부자명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setIsReceiptModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>영수증 발행</span>
              </Button>
            </div>
          </div>

          {/* 영수증 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>기부금 영수증</CardTitle>
              <CardDescription>{selectedYear}년 발행된 기부금 영수증 목록입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">발행번호</th>
                      <th className="text-left py-2">기부자</th>
                      <th className="text-right py-2">총액</th>
                      <th className="text-left py-2">발행일</th>
                      <th className="text-left py-2">발행자</th>
                      <th className="text-center py-2">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map((receipt) => (
                      <tr key={receipt.id} className="border-b">
                        <td className="py-3 font-mono">{receipt.issueNo}</td>
                        <td className="py-3">{receipt.donorName}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(receipt.totalAmount)}</td>
                        <td className="py-3">{receipt.issuedAt}</td>
                        <td className="py-3">{receipt.issuedBy}</td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredReceipts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {selectedYear}년에 발행된 영수증이 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 헌금 입력 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">헌금 입력</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">기부자</label>
                <select
                  value={newDonation.donorId}
                  onChange={(e) => setNewDonation({ ...newDonation, donorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">기부자를 선택하세요</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">헌금일</label>
                <Input
                  type="date"
                  value={newDonation.offeredOn}
                  onChange={(e) => setNewDonation({ ...newDonation, offeredOn: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">헌금 유형</label>
                <select
                  value={newDonation.fundType}
                  onChange={(e) => setNewDonation({ ...newDonation, fundType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {FUND_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">금액</label>
                <Input
                  type="number"
                  placeholder="헌금 금액을 입력하세요"
                  value={newDonation.amount || ''}
                  onChange={(e) => setNewDonation({ ...newDonation, amount: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">적요</label>
                <Input
                  placeholder="비고 사항이 있으면 입력하세요"
                  value={newDonation.note}
                  onChange={(e) => setNewDonation({ ...newDonation, note: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <Button onClick={handleAddDonation} className="flex-1">
                등록
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 영수증 발행 모달 */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">기부금 영수증 발행</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">귀속연도</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {[2024, 2023, 2022, 2021, 2020].map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">기부자</label>
                <select
                  value={selectedDonor}
                  onChange={(e) => setSelectedDonor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">기부자를 선택하세요</option>
                  {members.map((member) => {
                    const yearDonations = donations.filter(d => 
                      d.donorId === member.id && 
                      new Date(d.offeredOn).getFullYear() === selectedYear
                    );
                    const totalAmount = yearDonations.reduce((sum, d) => sum + d.amount, 0);
                    
                    if (totalAmount === 0) return null;
                    
                    return (
                      <option key={member.id} value={member.id}>
                        {member.name} ({formatCurrency(totalAmount)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedDonor && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="font-medium mb-2">{selectedYear}년 헌금 내역</h4>
                  {donations
                    .filter(d => d.donorId === selectedDonor && new Date(d.offeredOn).getFullYear() === selectedYear)
                    .map((donation, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{donation.fundType}</span>
                        <span>{formatCurrency(donation.amount)}</span>
                      </div>
                    ))
                  }
                  <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                    <span>총액</span>
                    <span>
                      {formatCurrency(
                        donations
                          .filter(d => d.donorId === selectedDonor && new Date(d.offeredOn).getFullYear() === selectedYear)
                          .reduce((sum, d) => sum + d.amount, 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2 mt-6">
              <Button onClick={generateReceipt} className="flex-1">
                영수증 발행
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setSelectedDonor('');
                }}
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationManagement;
