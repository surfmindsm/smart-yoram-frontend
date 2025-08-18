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
  Receipt,
  Users,
  CalendarDays,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
  donorId: string | null; // null인 경우 무명 헌금
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
  '주일헌금',
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
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<string>('');
  
  // 날짜 필터 상태
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    isActive: false
  });
  
  // 정렬 상태
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Donation | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // 새 헌금 입력 폼 상태
  const [newDonation, setNewDonation] = useState({
    donorId: '',
    offeredOn: new Date().toISOString().split('T')[0],
    fundType: '십일조',
    amount: 0,
    note: '',
    isAnonymous: false
  });

  // 일괄 입력 상태
  const [bulkDonations, setBulkDonations] = useState<Array<{
    donorId: string;
    amount: number;
    fundType: string;
    note: string;
    isAnonymous: boolean;
  }>>([]);
  const [bulkSettings, setBulkSettings] = useState({
    offeredOn: new Date().toISOString().split('T')[0]
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
      },
      {
        id: '4',
        donorId: null,
        donorName: '무명',
        offeredOn: '2024-12-03',
        fundType: '주일헌금',
        amount: 20000,
        note: '주일 1부 예배',
        inputUserId: 'admin'
      },
      {
        id: '5',
        donorId: null,
        donorName: '무명',
        offeredOn: '2024-12-03',
        fundType: '건축헌금',
        amount: 100000,
        note: '새 성전을 위해',
        inputUserId: 'admin'
      },
      {
        id: '6',
        donorId: null,
        donorName: '무명',
        offeredOn: '2024-12-10',
        fundType: '주일헌금',
        amount: 15000,
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
    if ((!newDonation.donorId && !newDonation.isAnonymous) || newDonation.amount <= 0) {
      alert('기부자 또는 무명 선택과 금액을 입력해주세요.');
      return;
    }

    let donorName = '무명';
    let donorId = null;
    
    if (!newDonation.isAnonymous) {
      const donor = members.find(m => m.id === newDonation.donorId);
      if (!donor) {
        alert('기부자를 찾을 수 없습니다.');
        return;
      }
      donorName = donor.name;
      donorId = newDonation.donorId;
    }

    const donation: Donation = {
      id: Date.now().toString(),
      donorId,
      donorName,
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
      note: '',
      isAnonymous: false
    });
  };

  // 일괄 입력 관련 함수들
  const addBulkRow = () => {
    setBulkDonations([...bulkDonations, { donorId: '', amount: 0, fundType: '십일조', note: '', isAnonymous: false }]);
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

  const handleBulkSubmit = () => {
    const validDonations = bulkDonations.filter(d => (d.donorId || d.isAnonymous) && d.amount > 0);
    
    if (validDonations.length === 0) {
      alert('입력할 헌금 내역이 없습니다.');
      return;
    }

    const newDonations: Donation[] = validDonations.map((bulk, index) => {
      if (bulk.isAnonymous) {
        return {
          id: (Date.now() + index).toString(),
          donorId: null,
          donorName: '무명',
          offeredOn: bulkSettings.offeredOn,
          fundType: bulk.fundType,
          amount: bulk.amount,
          note: bulk.note,
          inputUserId: 'admin'
        };
      } else {
        const donor = members.find(m => m.id === bulk.donorId);
        return {
          id: (Date.now() + index).toString(),
          donorId: bulk.donorId,
          donorName: donor?.name || '',
          offeredOn: bulkSettings.offeredOn,
          fundType: bulk.fundType,
          amount: bulk.amount,
          note: bulk.note,
          inputUserId: 'admin'
        };
      }
    });

    setDonations([...newDonations, ...donations]);
    setIsBulkModalOpen(false);
    setBulkDonations([]);
    alert(`${validDonations.length}건의 헌금이 등록되었습니다.`);
  };

  // 날짜 필터링 함수
  const toggleDateFilter = () => {
    setDateFilter({ ...dateFilter, isActive: !dateFilter.isActive });
    if (dateFilter.isActive) {
      // 필터 해제 시 날짜 초기화
      setDateFilter({ startDate: '', endDate: '', isActive: false });
    }
  };

  const applyDateFilter = () => {
    if (!dateFilter.startDate && !dateFilter.endDate) {
      alert('시작일 또는 종료일을 입력해주세요.');
      return;
    }
    // 실제 필터링은 filteredDonations에서 적용
  };

  // 정렬 함수
  const handleSort = (key: keyof Donation) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: keyof Donation) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
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

  const filteredDonations = donations.filter(donation => {
    // 검색 필터
    const matchesSearch = donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.fundType.includes(searchTerm);
    
    // 날짜 필터
    let matchesDate = true;
    if (dateFilter.isActive && (dateFilter.startDate || dateFilter.endDate)) {
      const donationDate = new Date(donation.offeredOn);
      
      if (dateFilter.startDate) {
        const startDate = new Date(dateFilter.startDate);
        matchesDate = matchesDate && donationDate >= startDate;
      }
      
      if (dateFilter.endDate) {
        const endDate = new Date(dateFilter.endDate);
        matchesDate = matchesDate && donationDate <= endDate;
      }
    }
    
    return matchesSearch && matchesDate;
  }).sort((a, b) => {
    // 정렬 로직
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
    if (bValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
    
    let comparison = 0;
    if (sortConfig.key === 'amount') {
      comparison = (aValue as number) - (bValue as number);
    } else if (sortConfig.key === 'offeredOn') {
      comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
    } else {
      comparison = String(aValue).localeCompare(String(bValue), 'ko');
    }
    
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

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
          <div className="space-y-4">
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
                <Button
                  variant={dateFilter.isActive ? 'default' : 'outline'}
                  onClick={toggleDateFilter}
                  className="flex items-center space-x-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>날짜 필터</span>
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsBulkModalOpen(true);
                    setBulkDonations([{ donorId: '', amount: 0, fundType: '십일조', note: '', isAnonymous: false }]);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>일괄 입력</span>
                </Button>
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>헌금 입력</span>
                </Button>
              </div>
            </div>
            
            {/* 날짜 필터 */}
            {dateFilter.isActive && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">시작일:</label>
                  <Input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">종료일:</label>
                  <Input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                    className="w-40"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateFilter({ startDate: '', endDate: '', isActive: true })}
                >
                  초기화
                </Button>
                <div className="text-sm text-gray-600">
                  {dateFilter.startDate && dateFilter.endDate 
                    ? `${dateFilter.startDate} ~ ${dateFilter.endDate}` 
                    : dateFilter.startDate 
                    ? `${dateFilter.startDate} 이후` 
                    : dateFilter.endDate 
                    ? `${dateFilter.endDate} 이전`
                    : '날짜를 선택하세요'
                  }
                </div>
              </div>
            )}
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
                      <th className="text-left py-2 px-2">
                        <button
                          onClick={() => handleSort('offeredOn')}
                          className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                        >
                          <span>날짜</span>
                          {getSortIcon('offeredOn')}
                        </button>
                      </th>
                      <th className="text-left py-2 px-2">
                        <button
                          onClick={() => handleSort('donorName')}
                          className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                        >
                          <span>기부자</span>
                          {getSortIcon('donorName')}
                        </button>
                      </th>
                      <th className="text-left py-2 px-2">
                        <button
                          onClick={() => handleSort('fundType')}
                          className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                        >
                          <span>헌금 유형</span>
                          {getSortIcon('fundType')}
                        </button>
                      </th>
                      <th className="text-right py-2 px-4">
                        <button
                          onClick={() => handleSort('amount')}
                          className="flex items-center space-x-1 hover:text-blue-600 transition-colors ml-auto"
                        >
                          <span>금액</span>
                          {getSortIcon('amount')}
                        </button>
                      </th>
                      <th className="text-left py-2 px-4">적요</th>
                      <th className="text-center py-2 px-4">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.map((donation) => (
                      <tr key={donation.id} className="border-b">
                        <td className="py-3 px-2">{donation.offeredOn}</td>
                        <td className="py-3 px-2">{donation.donorName}</td>
                        <td className="py-3 px-2">{donation.fundType}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(donation.amount)}</td>
                        <td className="py-3 px-4 text-gray-600">{donation.note}</td>
                        <td className="py-3 px-4 text-center">
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

      {/* 일괄 입력 모달 */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">헌금 일괄 입력</h2>
            
            {/* 공통 설정 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">헌금일</label>
                <Input
                  type="date"
                  value={bulkSettings.offeredOn}
                  onChange={(e) => setBulkSettings({ ...bulkSettings, offeredOn: e.target.value })}
                />
              </div>
            </div>

            {/* 헌금 목록 */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">헌금 목록</h3>
                <Button
                  onClick={addBulkRow}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>행 추가</span>
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-center py-2 px-3 border-b w-16">무명</th>
                      <th className="text-left py-2 px-3 border-b">기부자</th>
                      <th className="text-left py-2 px-3 border-b">헌금 유형</th>
                      <th className="text-right py-2 px-3 border-b">금액</th>
                      <th className="text-left py-2 px-3 border-b">적요</th>
                      <th className="text-center py-2 px-3 border-b w-20">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkDonations.map((bulk, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-3 text-center">
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
                        <td className="py-2 px-3">
                          {bulk.isAnonymous ? (
                            <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-sm text-center">
                              무명
                            </div>
                          ) : (
                            <select
                              value={bulk.donorId}
                              onChange={(e) => updateBulkRow(index, 'donorId', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">기부자 선택</option>
                              {members.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={bulk.fundType}
                            onChange={(e) => updateBulkRow(index, 'fundType', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {FUND_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            placeholder="0"
                            value={bulk.amount || ''}
                            onChange={(e) => updateBulkRow(index, 'amount', Number(e.target.value))}
                            className="text-right text-sm"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            placeholder="비고"
                            value={bulk.note}
                            onChange={(e) => updateBulkRow(index, 'note', e.target.value)}
                            className="text-sm"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {bulkDonations.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBulkRow(index)}
                              className="text-red-600 p-1"
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
              <div className="flex justify-end">
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">총 {bulkDonations.filter(b => (b.donorId || b.isAnonymous) && b.amount > 0).length}건, </span>
                  <span className="font-medium">
                    {formatCurrency(bulkDonations.reduce((sum, b) => sum + (b.amount || 0), 0))}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">(무명: {bulkDonations.filter(b => b.isAnonymous && b.amount > 0).length}건)</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleBulkSubmit} className="flex-1">
                {bulkDonations.filter(b => (b.donorId || b.isAnonymous) && b.amount > 0).length}건 등록
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkDonations([]);
                }}
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 헌금 입력 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">헌금 입력</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <label className="block text-sm font-medium">기부자</label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newDonation.isAnonymous}
                      onChange={(e) => {
                        setNewDonation({ 
                          ...newDonation, 
                          isAnonymous: e.target.checked,
                          donorId: e.target.checked ? '' : newDonation.donorId
                        });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">무명 헌금</span>
                  </label>
                </div>
                {newDonation.isAnonymous ? (
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 text-center">
                    무명
                  </div>
                ) : (
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
                )}
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
