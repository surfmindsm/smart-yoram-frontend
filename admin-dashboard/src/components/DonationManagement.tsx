import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  FileText,
  DollarSign,
  User,
  Receipt,
  Users,
  Download,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
  CalendarDays,
  Edit
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { financialService, memberService, churchService } from '../services/api';
import { Combobox } from './ui/combobox';

// 백엔드 API 응답 타입 정의
interface Member {
  id: number;
  church_id?: number;
  name: string;
  rrn?: string;
  address?: string;
  phone?: string;
  email?: string;
  photo_url?: string | null;
  birth_date?: string | null;
  gender?: string;
  marital_status?: string | null;
  job?: string | null;
  is_active?: boolean;
  baptism_date?: string | null;
  registration_date?: string;
  family_id?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Donor {
  id: number;
  member_id?: number;
  legal_name: string;
  address?: string;
  rrn_encrypted?: string;
  created_at: string;
  updated_at: string;
}

interface Offering {
  id: number;
  donor_id?: number;
  church_id: number;
  offered_on: string;
  fund_type: string;
  amount: string; // Decimal로 전송되므로 string
  note?: string;
  input_user_id: number;
  created_at: string;
  updated_at: string;
  donor?: {
    legal_name: string;
    member_id?: number;
  };
}

interface Receipt {
  id: number;
  donor_id: number | null;
  donor?: {
    id: number;
    name: string;
    phone: string;
    legal_name?: string;
    address?: string;
  };
  tax_year: number;
  total_amount: string;
  issue_no: string;
  issued_at: string;
  issued_by: string;
  church_id: number;
  updated_at: string;
  // UI 호환을 위한 추가 속성들 (computed)
  donorName?: string;
  taxYear?: number;
  totalAmount?: number;
  issueNo?: string;
  issuedAt?: string;
  issuedBy?: string;
}

interface FundType {
  id: number;
  church_id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 호환성을 위한 Donation 타입 (기존 UI 코드와 호환)
interface Donation {
  id: number;
  donorId: number | null;
  donorName: string;
  offeredOn: string;
  fundType: string;
  amount: number;
  note?: string;
  inputUserId: number;
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
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [fundTypes, setFundTypes] = useState<FundType[]>([]);
  const [churchInfo, setChurchInfo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 1);
  const [selectedDonor, setSelectedDonor] = useState<string>('');
  const [receiptInfo, setReceiptInfo] = useState({
    churchName: '',
    churchAddress: '',
    churchRegNo: '',
    donorAddress: '',
    donorRegNo: ''
  });

  // 교회 정보 자동 입력
  useEffect(() => {
    console.log('🏛️ 교회 정보 자동 입력 useEffect 실행:', churchInfo);
    if (churchInfo) {
      console.log('✅ 교회 정보로 영수증 폼 자동 채우기:');
      console.log('- 교회명:', churchInfo.name);
      console.log('- 교회주소:', churchInfo.address);
      console.log('- 사업자등록번호:', churchInfo.business_registration_number);
      
      setReceiptInfo(prev => ({
        ...prev,
        churchName: churchInfo.name || '',
        churchAddress: churchInfo.address || '',
        churchRegNo: churchInfo.business_registration_number || ''
      }));
    } else {
      console.log('⚠️ 교회 정보가 없어서 자동 입력 불가');
    }
  }, [churchInfo]);

  // 기부자 선택 시 정보 자동 입력
  useEffect(() => {
    if (selectedDonor && members.length > 0) {
      const selectedMember = members.find(m => m.id === Number(selectedDonor));
      if (selectedMember) {
        // 주민번호에서 생년월일 추출 (앞 6자리)
        const birthDate = selectedMember.rrn ? selectedMember.rrn.substring(0, 6) : '';
        
        setReceiptInfo(prev => ({
          ...prev,
          donorAddress: selectedMember.address || '',
          donorRegNo: birthDate ? `${birthDate}-` : ''
        }));
      }
    } else {
      // 기부자가 선택 해제되면 기부자 정보 초기화
      setReceiptInfo(prev => ({
        ...prev,
        donorAddress: '',
        donorRegNo: ''
      }));
    }
  }, [selectedDonor, members]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadDataRef = useRef(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
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
    const currentToken = localStorage.getItem('token');
    
    if (currentToken && !loadDataRef.current) {
      loadDataRef.current = true;
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 API 호출 시작...');

      // API 병렬 호출로 로딩 시간 3배 단축
      const [offeringsResponse, donorsResponse, membersResponse, receiptsResponse] = await Promise.all([
        financialService.getOfferings(),
        financialService.getDonors(),
        memberService.getMembers(),
        financialService.getReceipts()
      ]);

      // 교회 정보는 별도로 호출 (실패해도 다른 기능에 영향 없도록)
      let churchData: any = null;
      try {
        churchData = await churchService.getMyChurch();
        console.log('✅ 교회 정보 로드 성공:', churchData);
        setChurchInfo(churchData);
        
        // 교회 정보가 로드되면 즉시 영수증 폼에 반영
        if (churchData) {
          setReceiptInfo(prev => ({
            ...prev,
            churchName: churchData.name || '',
            churchAddress: churchData.address || '',
            churchRegNo: churchData.business_registration_number || ''
          }));
          console.log('🏛️ 교회 정보 즉시 적용 완료');
        }
      } catch (churchError) {
        console.warn('⚠️ 교회 정보 로드 실패 (다른 기능은 정상 동작):', churchError);
        // 교회 정보 실패는 무시하고 계속 진행
      }

      console.log('📊 원본 응답 데이터:');
      console.log('- offeringsResponse:', offeringsResponse);
      console.log('- donorsResponse:', donorsResponse);
      console.log('- membersResponse 전체:', membersResponse);
      console.log('- membersResponse 타입:', typeof membersResponse);
      console.log('- membersResponse가 배열인가?:', Array.isArray(membersResponse));
      console.log('- receiptsResponse:', receiptsResponse);

      // 응답 정규화 - memberService.getMembers()는 배열을 직접 반환
      const offeringsArray = Array.isArray(offeringsResponse) ? offeringsResponse : offeringsResponse?.data || [];
      const donorsArray = Array.isArray(donorsResponse) ? donorsResponse : donorsResponse?.data || [];
      // memberService는 response.data를 반환하므로, 이미 배열 형태
      const membersArray = Array.isArray(membersResponse) ? membersResponse : [];
      const receiptsArray = Array.isArray(receiptsResponse) ? receiptsResponse : receiptsResponse?.data || [];

      console.log('📋 정규화된 배열들:');
      console.log('- offeringsArray 길이:', offeringsArray.length);
      console.log('- donorsArray 길이:', donorsArray.length);
      console.log('- membersArray 길이:', membersArray.length);
      console.log('- receiptsArray 길이:', receiptsArray.length);
      console.log('- membersArray 내용:', membersArray);

      // members가 비어있는 경우 목 데이터 사용
      if (membersArray.length === 0) {
        console.warn('⚠️ 교인 데이터가 비어있습니다. 목 데이터를 사용합니다.');
        // 개발/테스트용 목 데이터
        const mockMembers: Member[] = [
          { id: 1, name: '김철수', phone: '010-1234-5678', address: '서울시 강남구' },
          { id: 2, name: '이영희', phone: '010-2345-6789', address: '서울시 서초구' },
          { id: 3, name: '박민수', phone: '010-3456-7890', address: '서울시 송파구' },
          { id: 4, name: '최수진', phone: '010-4567-8901', address: '서울시 마포구' },
          { id: 5, name: '정호영', phone: '010-5678-9012', address: '서울시 영등포구' }
        ];
        setMembers(mockMembers);
      } else {
        setMembers(membersArray);
      }

      // receipts 데이터에 donor 정보 매핑
      const receiptsWithDonorInfo = receiptsArray.map((receipt: any) => {
        const donor = donorsArray.find((d: any) => d.id === receipt.donor_id);
        const member = donor ? membersArray.find((m: any) => m.id === donor.member_id) : null;
        
        return {
          ...receipt,
          donorName: member?.name || donor?.legal_name || '무명',
          donor: {
            id: donor?.id,
            name: member?.name || donor?.legal_name || '무명',
            phone: member?.phone || '',
            legal_name: donor?.legal_name || '',
            address: member?.address || donor?.address || ''
          }
        };
      });

      setOfferings(offeringsArray);
      setDonors(donorsArray);
      // members는 위에서 이미 설정됨 (membersArray 또는 mockMembers)
      setFundTypes([]);
      setReceipts(receiptsWithDonorInfo);

      // Offerings를 Donations로 변환
      if (offeringsArray.length > 0) {
        const convertedDonations = convertOfferingsToDonations(offeringsArray, donorsArray, membersArray);
        setDonations(convertedDonations);
      } else {
        setDonations([]);
      }

      console.log('✅ 데이터 로딩 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('❌ API 호출 실패:', error);
      setError(`API 호출 실패: ${errorMessage}`);
      
      // 빈 배열로 초기화
      setOfferings([]);
      setDonors([]);
      setMembers([]);
      setDonations([]);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  // Offering을 Donation으로 변환하는 함수 (기존 UI 호환성)
  const convertOfferingsToDonations = (offerings: Offering[], donorsArray: any[], membersArray: any[]): Donation[] => {
    
    return offerings.map(offering => {
      let donorName = '무명';
      let memberId = null; // member_id를 donorId로 사용
      
      if (offering.donor_id && offering.donor_id !== null) {
        // 1. 먼저 offering에 포함된 donor 정보 확인
        if (offering.donor?.legal_name) {
          donorName = offering.donor.legal_name;
        } else {
          // 2. donors 배열에서 해당 기부자 찾기
          const donor = donorsArray.find((d: any) => d.id === offering.donor_id);
          if (donor) {
            // 3. 기부자와 연결된 교인 정보 찾기
            const relatedMember = membersArray.find((m: any) => m.id === donor.member_id);
            if (relatedMember) {
              donorName = relatedMember.name;
              memberId = relatedMember.id; // member_id를 사용
            } else {
              donorName = donor.legal_name || '무명';
            }
          }
        }
      }
      
      return {
        id: offering.id,
        donorId: memberId, // member_id를 donorId로 설정하여 영수증 모달과 매칭
        donorName: donorName,
        offeredOn: offering.offered_on,
        fundType: offering.fund_type,
        amount: parseFloat(offering.amount),
        note: offering.note || '',
        inputUserId: offering.input_user_id
      };
    });
  };

  const loadMockData = () => {
    // 목업 데이터 (API 실패 시 폴백)
    const mockMembers: Member[] = [
      { id: 1, name: '김철수', rrn: '801234-1******', address: '서울시 강남구' },
      { id: 2, name: '이영희', rrn: '750101-2******', address: '서울시 서초구' },
      { id: 3, name: '박민수', rrn: '851215-1******', address: '서울시 송파구' },
      { id: 4, name: '최수진', rrn: '900101-2******', address: '서울시 마포구' },
      { id: 5, name: '정호영', rrn: '920101-1******', address: '서울시 영등포구' }
    ];

    const mockDonations: Donation[] = [
      {
        id: 1,
        donorId: 1,
        donorName: '김철수',
        offeredOn: '2024-01-01',
        fundType: '십일조',
        amount: 100000,
        note: '감사헌금',
        inputUserId: 1
      },
      {
        id: 2,
        donorId: 2,
        donorName: '이영희',
        offeredOn: '2024-01-01',
        fundType: '감사헌금',
        amount: 50000,
        note: '',
        inputUserId: 1
      },
      {
        id: 3,
        donorId: 3,
        donorName: '박민수',
        offeredOn: '2024-01-02',
        fundType: '십일조',
        amount: 120000,
        note: '',
        inputUserId: 1
      },
      {
        id: 4,
        donorId: 1,
        donorName: '김철수',
        offeredOn: '2024-01-03',
        fundType: '건축헌금',
        amount: 200000,
        note: '새성전 건축',
        inputUserId: 1
      },
      {
        id: 5,
        donorId: 4,
        donorName: '최수진',
        offeredOn: '2024-01-05',
        fundType: '십일조',
        amount: 80000,
        note: '',
        inputUserId: 1
      },
      {
        id: 6,
        donorId: 2,
        donorName: '이영희',
        offeredOn: '2024-01-07',
        fundType: '선교헌금',
        amount: 30000,
        note: '아프리카 선교',
        inputUserId: 1
      },
      {
        id: 7,
        donorId: null,
        donorName: '무명',
        offeredOn: '2024-01-10',
        fundType: '감사헌금',
        amount: 20000,
        note: '익명헌금',
        inputUserId: 1
      },
      {
        id: 8,
        donorId: 5,
        donorName: '정호영',
        offeredOn: '2024-01-12',
        fundType: '십일조',
        amount: 150000,
        note: '',
        inputUserId: 1
      }
    ];

    const mockReceipts: Receipt[] = [
      {
        id: 1,
        donor_id: 1,
        tax_year: 2024,
        issue_no: 'R2024001',
        total_amount: '1200000',
        issued_at: '2024-01-15',
        issued_by: '관리자',
        church_id: 1,
        updated_at: '2024-01-15',
        // UI 호환 속성들
        donorName: '김철수',
        taxYear: 2024,
        issueNo: 'R2024001',
        totalAmount: 1200000,
        issuedAt: '2024-01-15',
        issuedBy: '관리자'
      },
      {
        id: 2,
        donor_id: 2,
        tax_year: 2024,
        issue_no: 'R2024002',
        total_amount: '800000',
        issued_at: '2024-01-15',
        issued_by: '관리자',
        church_id: 1,
        updated_at: '2024-01-15',
        // UI 호환 속성들
        donorName: '이영희',
        taxYear: 2024,
        issueNo: 'R2024002',
        totalAmount: 800000,
        issuedAt: '2024-01-15',
        issuedBy: '관리자'
      }
    ];

    setMembers(mockMembers);
    setDonations(mockDonations);
    setReceipts(mockReceipts);
  };

  const handleAddDonation = async () => {
    
    if ((!newDonation.donorId && !newDonation.isAnonymous) || newDonation.amount <= 0) {
      alert('기부자 또는 무명 선택과 금액을 입력해주세요.');
      return;
    }

    try {
      setSubmitLoading(true);
      
      let donorId = null;
      
      if (!newDonation.isAnonymous) {
        // member_id로 donor_id 자동 찾기/생성
        const memberId = parseInt(newDonation.donorId);
        const memberData = members.find(m => m.id === memberId);
        
        if (memberData) {
          donorId = await financialService.getOrCreateDonorByMemberId(memberId, memberData);
        } else {
          throw new Error('선택한 교인 정보를 찾을 수 없습니다.');
        }
      }

      const offeringData = {
        donor_id: donorId,
        church_id: 1, // TODO: 실제 교회 ID로 변경
        offered_on: newDonation.offeredOn,
        fund_type: newDonation.fundType,
        amount: newDonation.amount.toString(),
        note: newDonation.note || null
      };

      
      try {
        const result = await financialService.createOffering(offeringData);
        
        // 옵티미스틱 UI 업데이트 - 즉시 화면에 반영
        const newDonationItem: Donation = {
          id: result.id || Date.now(), // 임시 ID
          donorId: donorId,
          donorName: newDonation.isAnonymous ? '무명' : 
                    members.find(m => m.id === parseInt(newDonation.donorId))?.name || '무명',
          offeredOn: newDonation.offeredOn,
          fundType: newDonation.fundType,
          amount: newDonation.amount,
          note: newDonation.note || '',
          inputUserId: 1 // 현재 사용자 ID
        };
        
        // 기존 목록에 새 헌금 추가
        setDonations(prev => [newDonationItem, ...prev]);
        
        setIsAddModalOpen(false);
        
        // 폼 초기화
        setNewDonation({
          donorId: '',
          offeredOn: new Date().toISOString().split('T')[0],
          fundType: '십일조',
          amount: 0,
          note: '',
          isAnonymous: false
        });
        
      } catch (apiError: any) {
        throw apiError; // 상위 catch로 에러 전달
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '헌금 추가에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
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

    const saveBulkDonations = async () => {
      try {
        setSubmitLoading(true);
        let successCount = 0;
        
        // 병렬 처리로 속도 대폭 개선
        const donorCache = new Map<number, number>(); // member_id → donor_id 캐시
        
        // 1단계: 고유한 member_id들의 donor_id를 병렬로 가져오기
        const uniqueMemberIds = Array.from(new Set(
          validDonations
            .filter(bulk => !bulk.isAnonymous)
            .map(bulk => Number(bulk.donorId))
        ));
        
        const donorPromises = uniqueMemberIds.map(async (memberId) => {
          const memberData = members.find(m => m.id === memberId);
          if (memberData) {
            const donorId = await financialService.getOrCreateDonorByMemberId(memberId, memberData);
            donorCache.set(memberId, donorId);
            return { memberId, donorId };
          } else {
            throw new Error(`선택한 교인 정보를 찾을 수 없습니다. (ID: ${memberId})`);
          }
        });
        
        await Promise.all(donorPromises);
        
        // 2단계: 모든 헌금을 병렬로 등록
        const offeringPromises = validDonations.map(async (bulk, index) => {
          const donorId = bulk.isAnonymous ? null : donorCache.get(Number(bulk.donorId));
          
          const offeringData = {
            donor_id: donorId,
            church_id: 1,
            offered_on: bulkSettings.offeredOn,
            fund_type: bulk.fundType,
            amount: bulk.amount.toString(),
            note: bulk.note || null
          };

          const result = await financialService.createOffering(offeringData);
          
          return {
            id: result.id || Date.now() + index,
            donorId: donorId,
            donorName: bulk.isAnonymous ? '무명' : 
                      members.find(m => m.id === Number(bulk.donorId))?.name || '무명',
            offeredOn: bulkSettings.offeredOn,
            fundType: bulk.fundType,
            amount: bulk.amount,
            note: bulk.note || '',
            inputUserId: 1
          } as Donation;
        });
        
        const newDonationItems = await Promise.all(offeringPromises);
        successCount = newDonationItems.length;
        
        // 기존 목록에 새 헌금들 추가 (옵티미스틱 업데이트)
        setDonations(prev => [...newDonationItems, ...prev]);
        
        setBulkDonations([]);
        setIsBulkModalOpen(false);
        
        alert(`${successCount}건의 헌금이 등록되었습니다.`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '일괄 헌금 추가에 실패했습니다.';
        setError(errorMessage);
      } finally {
        setSubmitLoading(false);
      }
    };

    saveBulkDonations();
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

  // 헌금 수정 함수
  const handleEditDonation = (donation: Donation) => {
    setEditingDonation(donation);
    setIsEditModalOpen(true);
  };

  // 헌금 삭제 함수
  const handleDeleteDonation = async (donationId: number) => {
    if (!window.confirm('정말로 이 헌금 내역을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await financialService.deleteOffering(donationId);
      
      // 옵티미스틱 업데이트 - 즉시 화면에서 제거
      setDonations(prev => prev.filter(d => d.id !== donationId));
      
      alert('헌금 내역이 삭제되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '헌금 삭제에 실패했습니다.';
      setError(errorMessage);
      // 에러 발생 시 데이터 다시 로드
      loadData();
    } finally {
      setLoading(false);
    }
  };

  // 헌금 수정 저장 함수
  const handleUpdateDonation = async () => {
    if (!editingDonation) return;

    try {
      setSubmitLoading(true);
      
      const updateData = {
        offered_on: editingDonation.offeredOn,
        fund_type: editingDonation.fundType,
        amount: editingDonation.amount.toString(),
        note: editingDonation.note || null
      };

      await financialService.updateOffering(editingDonation.id, updateData);
      
      // 옵티미스틱 업데이트
      setDonations(prev => prev.map(d => 
        d.id === editingDonation.id ? editingDonation : d
      ));
      
      setIsEditModalOpen(false);
      setEditingDonation(null);
      alert('헌금 내역이 수정되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '헌금 수정에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const generateReceipt = async () => {
    if (!selectedDonor) {
      alert('기부자를 선택해주세요.');
      return;
    }

    const selectedMember = members.find(m => m.id === Number(selectedDonor));
    const donorDonations = donations.filter(d => 
      d.donorId === Number(selectedDonor) && 
      new Date(d.offeredOn).getFullYear() === selectedYear
    );

    if (donorDonations.length === 0) {
      alert('해당 연도에 기부 기록이 없습니다.');
      return;
    }

    if (!selectedMember) {
      alert('선택한 교인 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      
      // member_id로 실제 donor_id 찾기
      let actualDonorId = null;
      const donor = donors.find(d => d.member_id === selectedMember.id);
      if (donor) {
        actualDonorId = donor.id;
      } else {
        // donor가 없으면 member_id를 donor_id로 사용하거나 생성 필요
        console.warn('해당 교인의 donor 정보가 없습니다. member_id를 사용합니다.');
        actualDonorId = selectedMember.id;
      }
      
      // 영수증 발급번호 생성 (연도 + 순번)
      const issueNo = `R${selectedYear}${String(Date.now()).slice(-6)}`;
      
      const receiptData = {
        donor_id: actualDonorId,
        tax_year: selectedYear,
        total_amount: donorDonations.reduce((sum, d) => sum + d.amount, 0).toString(),
        church_id: 1, // TODO: 실제 교회 ID로 변경
        issue_no: issueNo
      };

      console.log('영수증 발행 요청 데이터:', receiptData);

      const result = await financialService.createReceipt(receiptData);
      
      console.log('영수증 발행 성공:', result);
      
      // PDF 생성 및 다운로드
      generateReceiptPDF(selectedMember, donorDonations, selectedYear, result.issue_no || issueNo, receiptInfo);
      
      // 데이터 새로고침
      await loadData();
      setIsReceiptModalOpen(false);
      setSelectedDonor('');
      alert('기부금 영수증이 발급되었습니다.');
    } catch (error: any) {
      console.error('영수증 발행 실패:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || '영수증 발급에 실패했습니다.';
      setError(`영수증 발급 실패: ${errorMessage}`);
      alert(`영수증 발급에 실패했습니다: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
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

  const filteredReceipts = receipts.filter(receipt => {
    const donorName = receipt.donorName || receipt.donor?.name || '';
    const taxYear = receipt.taxYear || receipt.tax_year;
    return donorName.toLowerCase().includes(searchTerm.toLowerCase()) &&
           taxYear === selectedYear;
  });

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  // PDF 영수증 생성 함수
  const generateReceiptPDF = (member: Member, donations: Donation[], year: number, issueNo: string, additionalInfo: any) => {
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>기부금 영수증</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { 
              font-family: 'Malgun Gothic', sans-serif; 
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 0;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px;
            }
            .receipt-no {
              text-align: right;
              margin-bottom: 20px;
              font-size: 11px;
            }
            .section {
              margin-bottom: 15px;
            }
            .section-title {
              font-weight: bold;
              background-color: #f0f0f0;
              padding: 5px;
              border: 1px solid #000;
              border-bottom: none;
            }
            .info-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
            }
            .info-table th, .info-table td { 
              border: 1px solid #000; 
              padding: 8px; 
              text-align: left; 
              height: 25px;
            }
            .info-table th { 
              background-color: #f0f0f0; 
              font-weight: bold; 
              width: 120px;
            }
            .donation-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
            }
            .donation-table th, .donation-table td { 
              border: 1px solid #000; 
              padding: 6px; 
              text-align: center; 
              font-size: 11px;
            }
            .donation-table th { 
              background-color: #f0f0f0; 
              font-weight: bold; 
            }
            .amount-cell {
              text-align: right;
              padding-right: 10px;
            }
            .legal-text {
              font-size: 10px;
              margin: 20px 0;
              line-height: 1.6;
              text-align: justify;
            }
            .footer {
              margin-top: 30px;
              text-align: right;
            }
            .signature-area {
              margin-top: 20px;
              text-align: center;
            }
            .blank-line {
              border-bottom: 1px solid #000;
              display: inline-block;
              width: 150px;
              margin: 0 5px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-no">
            법 제45조의2제1식 <신설 2004.3.5>
          </div>

          <div class="header">
            <div class="title">기부금 영수증</div>
          </div>

          <div class="section">
            <div class="section-title">접수번호</div>
            <table class="info-table">
              <tr>
                <td style="text-align: center; font-weight: bold;">${issueNo}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">1. 기부자</div>
            <table class="info-table">
              <tr>
                <th>성명</th>
                <td>${member.name}</td>
                <th>주민등록번호<br/>(사업자등록번호)</th>
                <td>${additionalInfo.donorRegNo || '-'}</td>
              </tr>
              <tr>
                <th>주소</th>
                <td colspan="3">${additionalInfo.donorAddress || member.address || ''}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">2. 기부단체</div>
            <table class="info-table">
              <tr>
                <th>단체명</th>
                <td>${additionalInfo.churchName || ''}</td>
                <th>주민등록번호<br/>(사업자등록번호)</th>
                <td>${additionalInfo.churchRegNo || '-'}</td>
              </tr>
              <tr>
                <th>소재지</th>
                <td colspan="3">${additionalInfo.churchAddress || ''}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">3. 기부금 모집처(언론기관 등)</div>
            <table class="info-table">
              <tr>
                <th>단체명</th>
                <td colspan="3">사업자등록번호</td>
              </tr>
              <tr>
                <th>소재지</th>
                <td colspan="3"></td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">4. 기부내용</div>
            <table class="donation-table">
              <thead>
                <tr>
                  <th width="120">유형</th>
                  <th width="60">코드</th>
                  <th width="100">연월일</th>
                  <th width="120">적요</th>
                  <th width="120">금액</th>
                </tr>
              </thead>
              <tbody>
                ${donations.map(donation => `
                  <tr>
                    <td>종교단체기부금</td>
                    <td>41</td>
                    <td>${new Date(donation.offeredOn).getFullYear()}년도</td>
                    <td>${donation.fundType}</td>
                    <td class="amount-cell">${donation.amount.toLocaleString()}</td>
                  </tr>
                `).join('')}
                <tr style="border-top: 2px solid #000;">
                  <td colspan="4" style="font-weight: bold; text-align: center;">합계</td>
                  <td class="amount-cell" style="font-weight: bold;">${totalAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            <div style="text-align: right; font-size: 10px; margin-top: 5px;">
              =이하 여백=
            </div>
          </div>

          <div class="legal-text">
            소득세법 제34조, 조세특례제한법 제73조 및 동법 제88조의4의 규정에
            의한 기부금을 위와 같이 기부하였음을 증명하여 주시기 바랍니다.
          </div>

          <div class="footer">
            <div style="margin-bottom: 30px;">
              ${new Date().getFullYear()}년 &nbsp;&nbsp;&nbsp; ${new Date().getMonth() + 1}월 &nbsp;&nbsp;&nbsp; ${new Date().getDate()}일
            </div>
            <div style="margin-bottom: 10px;">
              신청인 <span class="blank-line"></span> (인)
            </div>
          </div>

          <div style="margin-top: 40px; border-top: 1px solid #000; padding-top: 20px;">
            <div style="margin-bottom: 20px;">
              위와 같이 기부금을 기부하였음을 증명합니다.
            </div>
            <div style="text-align: right; margin-bottom: 30px;">
              ${new Date().getFullYear()}년 &nbsp;&nbsp;&nbsp; ${new Date().getMonth() + 1}월 &nbsp;&nbsp;&nbsp; ${new Date().getDate()}일
            </div>
            <div style="text-align: right;">
              기부금 수령인 <span class="blank-line"></span> (인)
            </div>
          </div>

          <div style="margin-top: 30px; font-size: 9px; border-top: 1px solid #ccc; padding-top: 10px;">
            <div>유형, 코드: 소득세법 제34조제1항의 기부금 &nbsp;&nbsp;&nbsp;&nbsp; (법정기부금, 코드 10)</div>
            <div style="margin-left: 80px;">조세특례제한법 제73조 기부금 &nbsp;&nbsp;&nbsp;&nbsp; (정치자금, 코드 20)</div>
            <div style="margin-left: 80px;">소득세법 제34조제1항 기부금 &nbsp;&nbsp;&nbsp;&nbsp; (지정기부금, 코드 40)</div>
            <div style="margin-left: 80px;">소득세법 제34조제1항의 기부금종 &nbsp;&nbsp;&nbsp;&nbsp; (종교단체기부금, 코드 41)</div>
            <div style="margin-left: 80px;">조세특례제한법 제88조의4 기부금 &nbsp;&nbsp;&nbsp;&nbsp; (우리사주조합기부금, 코드 42)</div>
            <div style="margin-left: 80px;">기타기부금 &nbsp;&nbsp;&nbsp;&nbsp; (기타기부금, 코드 50)</div>
            <div style="text-align: right; margin-top: 10px;">
              210㎜×297㎜(신문지 54g/㎡(재활용품))
            </div>
          </div>
        </body>
      </html>
    `;

    // 새 창에서 PDF로 출력
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // 페이지 로드 후 자동으로 인쇄 대화상자 열기
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    }
  };

  // 개별 영수증 인쇄 처리
  const handleReceiptPrint = (receipt: any) => {
    // 해당 영수증의 기부자와 기부 내역 찾기
    const donorId = receipt.donorId || receipt.donor_id;
    const taxYear = receipt.taxYear || receipt.tax_year;
    
    // 기부자 정보 찾기
    const donor = donors.find(d => d.id === donorId);
    const member = donor ? members.find(m => m.id === donor.member_id) : null;
    
    if (!member) {
      alert('기부자 정보를 찾을 수 없습니다.');
      return;
    }
    
    // 해당 연도의 기부 내역 찾기
    const memberDonations = donations.filter(d => 
      d.donorId === member.id && new Date(d.offeredOn).getFullYear() === taxYear
    );
    
    generateReceiptPDF(member, memberDonations, taxYear, receipt.issueNo || receipt.issue_no, receiptInfo);
  };

  // 개별 영수증 다운로드 처리
  const handleReceiptDownload = (receipt: any) => {
    handleReceiptPrint(receipt); // 동일한 로직 사용
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
            {loading ? (
              // 스켈레톤 카드들
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
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
              </>
            )}
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
                    {loading ? (
                      // 스켈레톤 테이블 행들
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-20 ml-auto"></div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      filteredDonations.map((donation) => (
                        <tr key={donation.id} className="border-b">
                          <td className="py-3 px-2">{donation.offeredOn}</td>
                          <td className="py-3 px-2">{donation.donorName}</td>
                          <td className="py-3 px-2">{donation.fundType}</td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency(donation.amount)}</td>
                          <td className="py-3 px-4 text-gray-600">{donation.note}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditDonation(donation)}
                                title="수정"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600"
                                onClick={() => handleDeleteDonation(donation.id)}
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
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
                        <td className="py-3 font-mono">{receipt.issueNo || receipt.issue_no}</td>
                        <td className="py-3">{receipt.donorName || receipt.donor?.name || ''}</td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(receipt.totalAmount || Number(receipt.total_amount) || 0)}
                        </td>
                        <td className="py-3">
                          {receipt.issuedAt ? new Date(receipt.issuedAt).toLocaleDateString('ko-KR') : 
                           receipt.issued_at ? new Date(receipt.issued_at).toLocaleDateString('ko-KR') : ''}
                        </td>
                        <td className="py-3">관리자</td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleReceiptPrint(receipt)}
                              title="영수증 인쇄"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleReceiptDownload(receipt)}
                              title="PDF 다운로드"
                            >
                              <Download className="w-4 h-4" />
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
                            <Combobox
                              options={members.map(member => ({
                                value: member.id.toString(),
                                label: member.name,
                                description: member.phone ? `📱 ${member.phone}` : member.address ? `🏠 ${member.address}` : undefined
                              }))}
                              value={bulk.donorId}
                              onChange={(value) => updateBulkRow(index, 'donorId', value)}
                              placeholder="기부자 검색..."
                              searchPlaceholder="이름, 전화번호로 검색"
                              className="text-sm"
                            />
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
              <Button 
                onClick={handleBulkSubmit} 
                className="flex-1"
                disabled={submitLoading}
              >
                {submitLoading ? '등록 중...' : `${bulkDonations.filter(b => (b.donorId || b.isAnonymous) && b.amount > 0).length}건 등록`}
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
                  <Combobox
                    options={members.map(member => ({
                      value: member.id.toString(),
                      label: member.name,
                      description: member.phone ? `📱 ${member.phone}` : member.address ? `🏠 ${member.address}` : undefined
                    }))}
                    value={newDonation.donorId}
                    onChange={(value) => setNewDonation({ ...newDonation, donorId: value })}
                    placeholder="기부자 검색..."
                    searchPlaceholder="이름, 전화번호, 주소로 검색"
                  />
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
              <Button 
                onClick={handleAddDonation} 
                className="flex-1"
                disabled={submitLoading}
              >
                {submitLoading ? '등록 중...' : '등록'}
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

      {/* 헌금 수정 모달 */}
      {isEditModalOpen && editingDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">헌금 내역 수정</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">기부자</label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500">
                  {editingDonation.donorName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">헌금일</label>
                <Input
                  type="date"
                  value={editingDonation.offeredOn}
                  onChange={(e) => setEditingDonation({ ...editingDonation, offeredOn: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">헌금 유형</label>
                <select
                  value={editingDonation.fundType}
                  onChange={(e) => setEditingDonation({ ...editingDonation, fundType: e.target.value })}
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
                  value={editingDonation.amount || ''}
                  onChange={(e) => setEditingDonation({ ...editingDonation, amount: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">적요</label>
                <Input
                  placeholder="비고 사항이 있으면 입력하세요"
                  value={editingDonation.note || ''}
                  onChange={(e) => setEditingDonation({ ...editingDonation, note: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <Button 
                onClick={handleUpdateDonation} 
                className="flex-1"
                disabled={submitLoading}
              >
                {submitLoading ? '수정 중...' : '수정'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingDonation(null);
                }}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">기부금 영수증 발행</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">귀속연도</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 1 - i).map(year => (
                      <option key={year} value={year}>{year}년</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">기부자</label>
                  <Combobox
                    options={members.map(member => ({
                      value: member.id.toString(),
                      label: member.name,
                      description: member.phone ? `📱 ${member.phone}` : member.address ? `🏠 ${member.address}` : undefined
                    }))}
                    value={selectedDonor}
                    onChange={(value) => setSelectedDonor(value)}
                    placeholder="기부자 검색..."
                    searchPlaceholder="이름, 전화번호, 주소로 검색"
                  />
                </div>
              </div>

              {/* 기부자 추가 정보 */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">기부자 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">주소</label>
                    <Input
                      value={receiptInfo.donorAddress}
                      onChange={(e) => setReceiptInfo({...receiptInfo, donorAddress: e.target.value})}
                      placeholder="기부자 주소"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">주민등록번호</label>
                    <Input
                      value={receiptInfo.donorRegNo}
                      onChange={(e) => setReceiptInfo({...receiptInfo, donorRegNo: e.target.value})}
                      placeholder="000000-0000000"
                    />
                  </div>
                </div>
              </div>

              {/* 기부단체 정보 */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">기부단체 정보</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">단체명</label>
                    <Input
                      value={receiptInfo.churchName}
                      onChange={(e) => setReceiptInfo({...receiptInfo, churchName: e.target.value})}
                      placeholder="교회명"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">사업자등록번호</label>
                      <Input
                        value={receiptInfo.churchRegNo}
                        onChange={(e) => setReceiptInfo({...receiptInfo, churchRegNo: e.target.value})}
                        placeholder="000-00-00000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">소재지</label>
                      <Input
                        value={receiptInfo.churchAddress}
                        onChange={(e) => setReceiptInfo({...receiptInfo, churchAddress: e.target.value})}
                        placeholder="교회 주소"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {selectedDonor && (
                <div className="bg-gray-50 p-3 rounded-md border-t">
                  <h4 className="font-medium mb-2">{selectedYear}년 헌금 내역</h4>
                  {donations
                    .filter(d => d.donorId === Number(selectedDonor) && new Date(d.offeredOn).getFullYear() === selectedYear)
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
                          .filter(d => d.donorId === Number(selectedDonor) && new Date(d.offeredOn).getFullYear() === selectedYear)
                          .reduce((sum, d) => sum + d.amount, 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2 mt-6">
              <Button onClick={generateReceipt} className="flex-1" disabled={!selectedDonor}>
                영수증 발행
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setSelectedDonor('');
                  setReceiptInfo({
                    churchName: '',
                    churchAddress: '',
                    churchRegNo: '',
                    donorAddress: '',
                    donorRegNo: ''
                  });
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
