import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useAccountCategories } from '../hooks/queries';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Trash2,
  FileText,
  DollarSign,
  User,
  Receipt,
  Users,
  X,
  ChevronUp,
  ChevronDown,
  Printer,
  CalendarDays,
  Edit,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, LoadingState } from "./ui";
import { Combobox } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { DatePicker } from "./ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./ui";
import { Checkbox } from "./ui";
import { PageContainer } from "./ui";
import { usePageSubtitle, usePageActions } from '../hooks/usePageSubtitle';
import { DateRangePicker } from "./ui";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
// Legacy API imports removed - now using Supabase Edge Functions
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { supabase } from '../lib/supabase';
import { getPositionDetailLabel } from '../constants/memberPositions';
import * as XLSX from 'xlsx';
import { Pagination } from './common/Pagination';
import { cn } from '../lib/utils';

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
  position_detail?: string;
  department?: string;
  organization_name?: string;
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
  member_id?: number;
  church_id: number;
  offered_on: string;
  fund_type: string;
  amount: string; // Decimal로 전송되므로 string
  note?: string;
  input_user_id: number;
  created_at: string;
  updated_at: string;
  member?: {
    name: string;
    id?: number;
  };
}

interface Receipt {
  id: number;
  member_id: number | null;
  member?: {
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

// 헌금 유형은 계정과목 API에서 동적으로 로드됩니다

const DonationManagement: React.FC = () => {
  const navigate = useNavigate();
  // currentUser는 다른 화면과 공유 캐시 (loadData 내 getCurrentUser 호출도 캐시 활용 가능)
  const { data: cachedCurrentUser } = useCurrentUser();
  const churchIdForQuery = (cachedCurrentUser as any)?.church_id ?? null;
  const [activeTab, setActiveTab] = useState<'donations' | 'receipts'>('donations');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  // 헌금 종류는 계정과목(income 카테고리의 헌금 하위)에서 derive — React Query로 캐싱 공유
  const categoriesQuery = useAccountCategories();
  const queryClient = useQueryClient();
  const fundTypes: string[] = useMemo(() => {
    const income = categoriesQuery.data?.income ?? [];
    const offeringParent = income.find((cat: any) => cat.name === '헌금' && !cat.parent_id);
    if (!offeringParent) return [];
    return income
      .filter((cat: any) => cat.parent_id === offeringParent.id)
      .map((cat: any) => cat.name)
      .sort();
  }, [categoriesQuery.data]);
  const [churchInfo, setChurchInfo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fundTypeFilter, setFundTypeFilter] = useState<string[]>([]);
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
    if (churchInfo) {
      
      setReceiptInfo(prev => ({
        ...prev,
        churchName: churchInfo.name || '',
        churchAddress: churchInfo.address || '',
        churchRegNo: churchInfo.business_no || ''
      }));
    } else {
      // 교회 정보가 없을 때는 조용히 패스
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
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 헌금 종류별 분포 차트 — 마우스 따라가는 tooltip 상태
  const [fundTooltip, setFundTooltip] = useState<{
    item: any;
    x: number; // 막대 컨테이너 기준 마우스 X
  } | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadDataRef = useRef(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 적요 인라인 편집
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState<string>('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreviewData, setExcelPreviewData] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<Array<{
    rowNumber: number;
    data: any;
    errors: string[];
    warnings: string[];
    isValid: boolean;
  }> | null>(null);

  // 날짜 필터 상태
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // 정렬 상태
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Donation | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // 새 헌금 입력 폼 상태
  const [newDonation, setNewDonation] = useState({
    donorId: '',
    offeredOn: new Date().toISOString().split('T')[0],
    fundType: '주일헌금',
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

  // React Query로 헌금 화면 raw 데이터 캐싱 (페이지 재진입/새로고침 즉시 표시)
  const donationsDataQuery = useQuery({
    queryKey: ['donationsScreenData', churchIdForQuery ?? 9998],
    queryFn: async () => {
      const userChurchId = churchIdForQuery ?? 9998;
      const [offeringsResult, membersResult, receiptsResult] = await Promise.allSettled([
        supabaseApiService.offerings.getAll({ church_id: userChurchId }),
        supabaseApiService.members.getAll({ limit: 500 }),
        supabaseApiService.receipts.getAll({ church_id: userChurchId }),
      ]);

      let offerings: any[] = [];
      let members: any[] = [];
      let receipts: any[] = [];

      if (offeringsResult.status === 'fulfilled') {
        const v = offeringsResult.value;
        offerings = Array.isArray(v) ? v : (v?.data || v?.offerings || []);
      }
      if (membersResult.status === 'fulfilled') {
        members = membersResult.value?.data || membersResult.value || [];
      }
      if (receiptsResult.status === 'fulfilled') {
        receipts = receiptsResult.value?.data || receiptsResult.value || [];
      }

      let church: any = null;
      try {
        const { data: churchInfo } = await supabase
          .from('churches')
          .select('*')
          .eq('id', userChurchId)
          .single();
        if (churchInfo) {
          church = {
            id: churchInfo.id,
            name: churchInfo.name || churchInfo.church_name || '교회명 없음',
            address: churchInfo.address || churchInfo.church_address || '',
            business_no: churchInfo.business_no || churchInfo.registration_number || churchInfo.tax_number || '',
          };
        }
      } catch (e) {
        console.error('교회 정보 가져오기 실패:', e);
      }

      return { offerings, members, receipts, church };
    },
    enabled: !!churchIdForQuery,
    staleTime: 60_000,
  });

  // donations Query 데이터 → state 동기화
  useEffect(() => {
    if (!donationsDataQuery.data) return;
    const { offerings: offeringsArray, members: membersArray, receipts: receiptsArray, church } = donationsDataQuery.data;

    setMembers(membersArray);
    setOfferings(offeringsArray);
    setDonors([]);

    if (church) {
      setChurchInfo(church);
      setReceiptInfo(prev => ({
        ...prev,
        churchName: church.name || '',
        churchAddress: church.address || '',
        churchRegNo: church.business_no || '',
      }));
    }

    // 영수증에 member 정보 매핑
    const receiptsWithMemberInfo = (receiptsArray || []).map((receipt: any) => {
      const member = membersArray.find((m: any) => m.id === receipt.member_id);
      return {
        ...receipt,
        donorName: member?.name || '무명',
        member: {
          id: member?.id,
          name: member?.name || '무명',
          phone: member?.phone || '',
          legal_name: member?.name || '',
          address: member?.address || '',
        },
      };
    });
    setReceipts(receiptsWithMemberInfo);

    if (offeringsArray.length > 0) {
      const convertedDonations = convertOfferingsToDonations(offeringsArray, membersArray);
      setDonations(convertedDonations);
    } else {
      setDonations([]);
    }

    loadDataRef.current = true;
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donationsDataQuery.data]);

  useEffect(() => {
    // 토큰 있고 처음이면 (캐시 없을 때) loadData 폴백
    const currentToken = localStorage.getItem('token');
    const accessToken = localStorage.getItem('access_token');
    if ((currentToken || accessToken) && !loadDataRef.current && !churchIdForQuery) {
      loadDataRef.current = true;
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 현재 사용자의 church_id 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998; // 기본값 9998

      // API 병렬 호출로 로딩 시간 단축 (donors API 제거)
      let offeringsResponse: any = [];
      let membersResponse: any = [];
      let receiptsResponse: any = [];
      let supabaseOfferingsResponse: any = { data: [] };

      try {
        // Supabase API 병렬 호출 (receipts 추가)
        const [offeringsResult, membersResult, receiptsResult] = await Promise.allSettled([
          supabaseApiService.offerings.getAll({ church_id: userChurchId }),
          supabaseApiService.members.getAll({ limit: 500 }),
          supabaseApiService.receipts.getAll({ church_id: userChurchId })
        ]);

        if (offeringsResult.status === 'fulfilled') {
          supabaseOfferingsResponse = offeringsResult.value;
        } else {
          console.error('❌ Supabase Offerings API 오류:', offeringsResult.reason);
          supabaseOfferingsResponse = { data: [] };
        }

        if (membersResult.status === 'fulfilled') {
          membersResponse = membersResult.value.data || membersResult.value; // .data 프로퍼티 접근
        } else {
          console.error('❌ Supabase Members API 오류:', membersResult.reason);
          membersResponse = [];
        }

        if (receiptsResult.status === 'fulfilled') {
          receiptsResponse = receiptsResult.value.data || receiptsResult.value; // .data 프로퍼티 접근
        } else {
          console.error('❌ Supabase Receipts API 오류:', receiptsResult.reason);
          receiptsResponse = [];
        }

      } catch (error) {
        console.error('❌ API 병렬 호출 전체 실패:', error);
        supabaseOfferingsResponse = { data: [] };
        membersResponse = [];
      }

      // 현재 로그인한 사용자의 교회 정보 가져오기
      let churchData: any = {
        id: 6,
        name: '기본 교회',
        address: '서울특별시 강남구',
        business_no: '123-45-67890'
      };

      try {
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (currentUser?.user?.church_id) {
          // Supabase에서 교회 정보 가져오기
          const { data: churchInfo, error } = await supabase
            .from('churches')
            .select('*')
            .eq('id', currentUser.user.church_id)
            .single();

          if (churchInfo && !error) {
            churchData = {
              id: churchInfo.id,
              name: churchInfo.name || churchInfo.church_name || '교회명 없음',
              address: churchInfo.address || churchInfo.church_address || '',
              business_no: churchInfo.business_no ||
                                            churchInfo.registration_number ||
                                            churchInfo.tax_number || ''
            };
          }
        }
      } catch (error) {
        console.error('교회 정보 가져오기 실패:', error);
      }

      setChurchInfo(churchData);

      // 교회 정보를 영수증 폼에 반영
      setReceiptInfo(prev => ({
        ...prev,
        churchName: churchData.name || '',
        churchAddress: churchData.address || '',
        churchRegNo: churchData.business_no || ''
      }));
      // 응답 정규화 - API별로 다른 구조 확인
      
      // offerings API 응답이 배열인지 객체인지 확인
      let offeringsArray = [];
      if (Array.isArray(offeringsResponse)) {
        offeringsArray = offeringsResponse;
      } else if (offeringsResponse?.offerings) {
        offeringsArray = offeringsResponse.offerings;
      } else if (offeringsResponse?.data) {
        offeringsArray = offeringsResponse.data;
      } else {
        // 예상치 못한 구조면 빈 배열 사용
      }
      
      const membersArray = membersResponse || []; // 배열 직접 반환
      const receiptsArray = receiptsResponse?.receipts || receiptsResponse || [];

      // 실제 API 데이터만 사용
      setMembers(membersArray);

      if (membersArray.length === 0) {
        console.warn('⚠️ 교인 데이터가 비어있습니다.');
      }

      // receipts 데이터에 member 정보 매핑
      const receiptsWithMemberInfo = receiptsArray.map((receipt: any) => {
        const member = membersArray.find((m: any) => m.id === receipt.member_id);

        return {
          ...receipt,
          donorName: member?.name || '무명',
          member: {
            id: member?.id,
            name: member?.name || '무명',
            phone: member?.phone || '',
            legal_name: member?.name || '',
            address: member?.address || ''
          }
        };
      });

      // Supabase offerings 응답 처리
      const supabaseOfferingsArray = Array.isArray(supabaseOfferingsResponse?.data)
        ? supabaseOfferingsResponse.data
        : [];

      // 두 헌금 데이터 합치기 (기존 financialService + supabase)
      const allOfferings = [...offeringsArray, ...supabaseOfferingsArray];

      setOfferings(allOfferings);
      setDonors([]); // donors 비워둔 (members로 대체)
      setReceipts(receiptsWithMemberInfo);

      // 헌금 유형을 계정과목 API에서 로드
      await loadFundTypes(userChurchId);

      // 모든 Offerings를 Donations로 변환
      if (allOfferings.length > 0) {
        const convertedDonations = convertOfferingsToDonations(allOfferings, membersArray);
        setDonations(convertedDonations);
      } else {
        setDonations([]);
      }

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

  // 헌금 유형은 useAccountCategories 캐시에서 derive — 별도 로딩 함수 불필요
  const loadFundTypes = async (_userChurchId: number) => {
    queryClient.invalidateQueries({ queryKey: ['accountCategories'] });
  };

  // Offering을 Donation으로 변환하는 함수 (기존 UI 호환성)
  const convertOfferingsToDonations = (offerings: any[], membersArray: any[]): Donation[] => {

    return offerings.map(offering => {
      let donorName = '무명';
      let memberId = null; // member_id를 donorId로 사용

      // member_id 처리 (둘 다 동일한 구조)
      const memberIdValue = offering.member_id;

      if (memberIdValue && memberIdValue !== null) {
        // 1. 먼저 offering에 포함된 member 정보 확인
        if (offering.member?.name) {
          donorName = offering.member.name;
          memberId = offering.member.id || memberIdValue;
        } else {
          // 2. members 배열에서 해당 교인 찾기
          const member = membersArray.find((m: any) => m.id === memberIdValue);
          if (member) {
            donorName = member.name;
            memberId = member.id;
          }
        }
      }

      return {
        id: offering.id,
        donorId: memberId, // member_id를 donorId로 설정하여 영수증 모달과 매칭
        donorName: donorName,
        offeredOn: offering.offered_on,
        fundType: offering.fund_type,
        amount: parseFloat(offering.amount || offering.amount_decimal || '0'),
        note: offering.note || '',
        inputUserId: offering.input_user_id || 1 // supabase에서 input_user_id가 없을 수 있음
      };
    });
  };

  // 목업 데이터 제거됨 - 실제 API 데이터만 사용

  const handleAddDonation = async () => {

    if ((!newDonation.donorId && !newDonation.isAnonymous) || newDonation.amount <= 0) {
      alert('기부자 또는 무명 선택과 금액을 입력해주세요.');
      return;
    }

    try {
      setSubmitLoading(true);

      let memberId: number | null = null;

      if (!newDonation.isAnonymous) {
        // member_id 직접 사용
        memberId = parseInt(newDonation.donorId);
        const memberData = members.find(m => m.id === memberId);

        if (!memberData) {
          throw new Error('선택한 교인 정보를 찾을 수 없습니다.');
        }
      }

      // 현재 로그인한 사용자 ID 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const inputUserId = currentUser?.user?.id;

      if (!inputUserId) {
        throw new Error('로그인 사용자 정보를 찾을 수 없습니다.');
      }

      const offeringData = {
        member_id: memberId,
        church_id: churchInfo?.id || 1, // 실제 교회 ID 사용
        offered_on: newDonation.offeredOn,
        fund_type: newDonation.fundType,
        amount: newDonation.amount.toString(),
        note: newDonation.note || null,
        input_user_id: inputUserId
      };

      try {
        const result = await supabaseApiService.offerings.create(offeringData);

        // 옵티미스틱 UI 업데이트 - 즉시 화면에 반영
        const newDonationItem: Donation = {
          id: result.id || Date.now(), // 임시 ID
          donorId: memberId,
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
        alert('헌금이 등록되었으며, 회계 수입으로 자동 기록되었습니다.');

        // 폼 초기화
        setNewDonation({
          donorId: '',
          offeredOn: new Date().toISOString().split('T')[0],
          fundType: '주일헌금',
          amount: 0,
          note: '',
          isAnonymous: false
        });

      } catch (apiError: any) {
        console.error('❌ 헌금 등록 실패:', apiError);
        throw apiError; // 상위 catch로 에러 전달
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '헌금 추가에 실패했습니다.';
      console.error('❌ 헌금 추가 오류:', error);
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 일괄 입력 관련 함수들
  const addBulkRow = () => {
    setBulkDonations([...bulkDonations, { donorId: '', amount: 0, fundType: '주일헌금', note: '', isAnonymous: false }]);
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

        // 현재 로그인한 사용자 ID 가져오기
        const currentUser = await supabaseAuthService.getCurrentUser();
        const inputUserId = currentUser?.user?.id;

        if (!inputUserId) {
          throw new Error('로그인 사용자 정보를 찾을 수 없습니다.');
        }

        // 병렬 처리로 속도 대폭 개선

        // 모든 헌금을 병렬로 등록 (member_id 직접 사용)
        const offeringPromises = validDonations.map(async (bulk, index) => {
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
            church_id: churchInfo?.id || 1, // 실제 교회 ID 사용
            offered_on: bulkSettings.offeredOn,
            fund_type: bulk.fundType,
            amount: bulk.amount.toString(),
            note: bulk.note || null,
            input_user_id: inputUserId
          };

          const result = await supabaseApiService.offerings.create(offeringData);

          return {
            id: result.id || Date.now() + index,
            donorId: memberId,
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

        alert(`${successCount}건의 헌금이 등록되었으며, 회계 수입으로 자동 기록되었습니다.`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '일괄 헌금 추가에 실패했습니다.';
        console.error('❌ 일괄 헌금 추가 오류:', error);
        alert(errorMessage);
        setError(errorMessage);
      } finally {
        setSubmitLoading(false);
      }
    };

    saveBulkDonations();
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
      return null;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5" />
      : <ChevronDown className="h-3.5 w-3.5" />;
  };

  // 헌금 수정 함수
  const handleEditDonation = (donation: Donation) => {
    setEditingDonation(donation);
    setIsEditModalOpen(true);
  };

  // 헌금 삭제 함수
  const handleDeleteDonation = async (donationId: number) => {
    if (!window.confirm('정말로 이 헌금 내역을 삭제하시겠습니까? (연동된 회계 거래도 함께 삭제됩니다)')) {
      return;
    }

    try {
      setLoading(true);
      await supabaseApiService.offerings.delete(donationId.toString());

      // 옵티미스틱 업데이트 - 즉시 화면에서 제거
      setDonations(prev => prev.filter(d => d.id !== donationId));

      alert('헌금 내역 및 연동된 회계 거래가 삭제되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '헌금 삭제에 실패했습니다.';
      console.error('❌ 헌금 삭제 오류:', error);
      alert(errorMessage);
      setError(errorMessage);
      // 에러 발생 시 데이터 다시 로드
      queryClient.invalidateQueries({ queryKey: ['donationsScreenData'] });
    } finally {
      setLoading(false);
    }
  };

  // 헌금 수정 저장 함수
  // 적요 인라인 편집 — 셀 클릭으로 진입
  const startEditNote = (donation: Donation) => {
    setEditingNoteId(donation.id);
    setEditingNoteValue(donation.note || '');
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteValue('');
  };

  const saveEditNote = async () => {
    if (editingNoteId == null) return;
    const target = donations.find(d => d.id === editingNoteId);
    if (!target) {
      cancelEditNote();
      return;
    }
    const newNote = editingNoteValue.trim();
    if ((target.note || '') === newNote) {
      cancelEditNote();
      return;
    }

    // 옵티미스틱 업데이트 (state + React Query 캐시)
    setDonations(prev => prev.map(d =>
      d.id === editingNoteId ? { ...d, note: newNote } : d
    ));
    queryClient.setQueryData(
      ['donationsScreenData', churchIdForQuery ?? 9998],
      (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          offerings: (prev.offerings || []).map((o: any) =>
            o.id === editingNoteId ? { ...o, note: newNote } : o
          ),
        };
      }
    );
    const id = editingNoteId;
    cancelEditNote();

    try {
      await supabaseApiService.offerings.update(id.toString(), {
        note: newNote || null,
      });
    } catch (error) {
      console.error('적요 저장 실패:', error);
      alert('적요 저장에 실패했습니다.');
      // 실패 시 원래 값으로 롤백
      setDonations(prev => prev.map(d =>
        d.id === id ? target : d
      ));
      queryClient.setQueryData(
        ['donationsScreenData', churchIdForQuery ?? 9998],
        (prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            offerings: (prev.offerings || []).map((o: any) =>
              o.id === id ? { ...o, note: target.note || null } : o
            ),
          };
        }
      );
    }
  };

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

      await supabaseApiService.offerings.update(editingDonation.id.toString(), updateData);

      // 옵티미스틱 업데이트
      setDonations(prev => prev.map(d =>
        d.id === editingDonation.id ? editingDonation : d
      ));

      setIsEditModalOpen(false);
      setEditingDonation(null);
      alert('헌금 내역 및 연동된 회계 거래가 수정되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '헌금 수정에 실패했습니다.';
      console.error('❌ 헌금 수정 오류:', error);
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 엑셀 템플릿 다운로드
  const downloadExcelTemplate = () => {
    if (!XLSX || !XLSX.utils) {
      alert('엑셀 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 엑셀 헤더 정의
    const headers = [
      '기부자명',
      '헌금일',
      '헌금유형',
      '금액',
      '비고'
    ];

    // 샘플 데이터 (여러 헌금 유형 예시)
    const sampleData = [
      ['홍길동', '2024-01-07', '십일조', '100000', '감사합니다'],
      ['김철수', '2024-01-07', '주일헌금', '50000', ''],
      ['이영희', '2024-01-07', '감사헌금', '30000', ''],
      ['무명', '2024-01-07', '건축헌금', '200000', '무명처리']
    ];

    // 워크시트 생성
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

    // 열 너비 설정
    const columnWidths = [
      { wch: 15 }, // 기부자명
      { wch: 12 }, // 헌금일
      { wch: 15 }, // 헌금유형
      { wch: 12 }, // 금액
      { wch: 20 }  // 비고
    ];
    worksheet['!cols'] = columnWidths;

    // 헌금 유형 가이드 시트 생성
    const guideHeaders = ['헌금 유형', '설명'];
    const guideData = fundTypes.map(type => [type, '']);

    const guideWorksheet = XLSX.utils.aoa_to_sheet([
      guideHeaders,
      ...guideData,
      [],
      ['※ 안내사항'],
      ['1. 위의 헌금 유형 중 하나를 선택하여 입력해주세요.'],
      ['2. 헌금일 형식: YYYY-MM-DD (예: 2024-01-07)'],
      ['3. 금액은 숫자만 입력해주세요. (예: 100000)'],
      ['4. 무명 헌금의 경우 기부자명에 "무명"을 입력해주세요.']
    ]);

    // 가이드 시트 열 너비 설정
    guideWorksheet['!cols'] = [
      { wch: 20 }, // 헌금 유형
      { wch: 50 }  // 설명
    ];

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '헌금정보');
    XLSX.utils.book_append_sheet(workbook, guideWorksheet, '헌금유형 가이드');

    // 엑셀 파일 다운로드
    XLSX.writeFile(workbook, '헌금내역_엑셀템플릿.xlsx');
  };

  // 헌금 데이터 다운로드
  const downloadDonationsExcel = () => {
    if (!XLSX || !XLSX.utils) {
      alert('엑셀 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // [DEBUG] 다운로드 시점 데이터 상태
    console.log('[Donation][다운로드 클릭 시점]', {
      donations_length: donations.length,
      filteredDonations_length: filteredDonations.length,
      offerings_length: offerings.length,
      searchTerm,
      fundTypeFilter,
      dateRange,
      loadDataRef: loadDataRef.current,
    });

    // 현재 필터 결과 기준으로 다운로드. 비어있으면 안내.
    if (filteredDonations.length === 0) {
      if (donations.length === 0) {
        alert('헌금 데이터가 아직 로딩되지 않았거나 등록된 헌금이 없습니다.');
      } else {
        alert('현재 필터 결과가 비어있습니다. 필터를 조정해 주세요.');
      }
      return;
    }

    // 엑셀 헤더 정의
    const headers = [
      '헌금일',
      '기부자명',
      '헌금유형',
      '금액',
      '비고'
    ];

    // 헌금 데이터를 엑셀 행으로 변환
    const data = filteredDonations.map(donation => [
      donation.offeredOn || '',
      donation.donorName || '',
      donation.fundType || '',
      donation.amount || 0,
      donation.note || ''
    ]);

    // 워크시트 생성
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // 열 너비 자동 조정
    const maxWidth = 30;
    const columnWidths = headers.map((header, i) => {
      const headerWidth = header.length;
      const dataWidth = Math.max(
        ...data.map(row => String(row[i] || '').length)
      );
      return { wch: Math.min(Math.max(headerWidth, dataWidth) + 2, maxWidth) };
    });
    worksheet['!cols'] = columnWidths;

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '헌금목록');

    // 파일명 생성 (현재 날짜 포함)
    const today = new Date();
    const dateString = today.toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `헌금목록_${dateString}.xlsx`;

    // 엑셀 파일 다운로드
    XLSX.writeFile(workbook, fileName);
  };

  // 엑셀 파일 미리보기
  const handleExcelPreview = async () => {
    if (!excelFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    if (!XLSX || !XLSX.utils) {
      alert('엑셀 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setLoading(true);

    try {
      // Excel 날짜를 YYYY-MM-DD 형식으로 변환하는 함수
      const parseExcelDate = (value: any): string => {
        if (!value) return '';

        // 이미 문자열 형태의 날짜인 경우
        if (typeof value === 'string') {
          return value;
        }

        // Excel serial number인 경우 (숫자)
        if (typeof value === 'number') {
          // Excel의 날짜는 1900년 1월 1일부터의 일수로 저장됨
          // JavaScript Date로 변환
          const date = new Date((value - 25569) * 86400 * 1000);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }

        return String(value);
      };

      // 엑셀 파일 읽기
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // 첫 번째 시트 가져오기
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // 시트를 JSON으로 변환
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // 헤더와 데이터 분리
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1);

      // 헤더 매핑
      const headerMap: { [key: string]: number } = {};
      headers.forEach((header, index) => {
        headerMap[header] = index;
      });

      // 필수 헤더 확인
      const requiredHeaders = ['기부자명', '헌금일', '헌금유형', '금액'];
      const missingHeaders = requiredHeaders.filter(h => !(h in headerMap));

      if (missingHeaders.length > 0) {
        alert(`필수 컬럼이 누락되었습니다: ${missingHeaders.join(', ')}\n엑셀 템플릿을 다운로드하여 양식을 확인해주세요.`);
        setLoading(false);
        return;
      }

      // 각 행 검증
      const validatedRows = rows.map((row: any, index: number) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        const donorName = row[headerMap['기부자명']];
        const offeredOnRaw = row[headerMap['헌금일']];
        const offeredOn = parseExcelDate(offeredOnRaw);
        const fundType = row[headerMap['헌금유형']];
        const amount = row[headerMap['금액']];

        // 기부자명 검증
        if (!donorName || !String(donorName).trim()) {
          errors.push('기부자명은 필수입니다');
        } else {
          const donorNameStr = String(donorName).trim();
          if (donorNameStr !== '무명') {
            const member = members.find(m => m.name === donorNameStr);
            if (!member) {
              errors.push(`기부자 "${donorNameStr}"를 찾을 수 없습니다`);
            }
          }
        }

        // 헌금일 검증
        if (!offeredOn || !String(offeredOn).trim()) {
          errors.push('헌금일은 필수입니다');
        }

        // 헌금유형 검증 - 실제 계정과목과 비교
        if (!fundType || !String(fundType).trim()) {
          errors.push('헌금유형은 필수입니다');
        } else {
          const fundTypeStr = String(fundType).trim();
          if (!fundTypes.includes(fundTypeStr)) {
            errors.push(`헌금유형 "${fundTypeStr}"은(는) 등록되지 않은 유형입니다`);
          }
        }

        // 금액 검증
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
          errors.push('금액은 0보다 큰 숫자여야 합니다');
        }

        return {
          rowNumber: index + 2, // 엑셀 행 번호 (헤더 1 + 데이터)
          data: {
            donorName: donorName || '',
            offeredOn: offeredOn || '',
            fundType: fundType || '',
            amount: amount || 0,
            note: row[headerMap['비고']] || ''
          },
          errors,
          warnings,
          isValid: errors.length === 0
        };
      });

      // 검증 결과 저장
      setValidationResults(validatedRows);

      // 미리보기 데이터 생성 (최대 10건)
      const previewData = validatedRows.slice(0, 10).map(v => v.data);
      setExcelPreviewData(previewData);
      setLoading(false);
    } catch (error) {
      console.error('엑셀 파일 읽기 실패:', error);
      alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 엑셀 데이터 업로드
  const handleExcelUpload = async () => {
    if (!excelFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    if (!XLSX || !XLSX.utils) {
      alert('엑셀 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setSubmitLoading(true);

    try {
      // 엑셀 파일 읽기
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // 첫 번째 시트 가져오기
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // 시트를 JSON으로 변환
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // 헤더와 데이터 분리
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1);

      // 헤더 매핑
      const headerMap: { [key: string]: number } = {};
      headers.forEach((header, index) => {
        headerMap[header] = index;
      });

      // 현재 로그인한 사용자 ID 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const inputUserId = currentUser?.user?.id;

      if (!inputUserId) {
        throw new Error('로그인 사용자 정보를 찾을 수 없습니다.');
      }

      let successCount = 0;
      const errors: string[] = [];

      // 각 행을 헌금으로 등록
      for (let i = 0; i < rows.length; i++) {
        const row: any = rows[i];

        // 빈 행 건너뛰기
        if (!row[headerMap['기부자명']] || !row[headerMap['금액']]) {
          continue;
        }

        try {
          const donorName = String(row[headerMap['기부자명']]).trim();
          const offeredOn = String(row[headerMap['헌금일']]).trim();
          const fundType = String(row[headerMap['헌금유형']]).trim();
          const amount = Number(row[headerMap['금액']]);
          const note = row[headerMap['비고']] ? String(row[headerMap['비고']]).trim() : '';

          // 기부자명으로 교인 찾기
          let memberId: number | null = null;
          if (donorName !== '무명') {
            const member = members.find(m => m.name === donorName);
            if (member) {
              memberId = member.id;
            } else {
              errors.push(`${i + 2}행: 기부자 "${donorName}"을 찾을 수 없습니다.`);
              continue;
            }
          }

          // 헌금 등록
          const offeringData = {
            member_id: memberId,
            church_id: churchInfo?.id || 1,
            offered_on: offeredOn,
            fund_type: fundType,
            amount: amount.toString(),
            note: note || null,
            input_user_id: inputUserId
          };

          await supabaseApiService.offerings.create(offeringData);
          successCount++;
        } catch (error) {
          errors.push(`${i + 2}행: ${error instanceof Error ? error.message : '등록 실패'}`);
        }
      }

      // 결과 메시지
      let message = `${successCount}건의 헌금이 등록되었습니다.`;
      if (errors.length > 0) {
        message += `\n\n실패한 항목 (${errors.length}건):\n${errors.slice(0, 5).join('\n')}`;
        if (errors.length > 5) {
          message += `\n... 외 ${errors.length - 5}건`;
        }
      }

      alert(message);

      // 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: ['donationsScreenData'] });

      // 모달 닫기
      setIsExcelUploadModalOpen(false);
      setExcelFile(null);
      setExcelPreviewData([]);
      setValidationResults(null);
    } catch (error) {
      console.error('엑셀 업로드 실패:', error);
      alert('엑셀 업로드 중 오류가 발생했습니다.');
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
        member_id: actualDonorId, // donor_id 대신 member_id 사용
        tax_year: selectedYear,
        total_amount: donorDonations.reduce((sum, d) => sum + d.amount, 0).toString(),
        church_id: churchInfo?.id || 1, // 실제 교회 ID 사용
        issue_no: issueNo
      };
      const result = await supabaseApiService.receipts.create(receiptData);
      
      // PDF 생성 및 다운로드
      generateReceiptPDF(selectedMember, donorDonations, selectedYear, result.issue_no || issueNo, receiptInfo);
      
      // 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: ['donationsScreenData'] });
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
    // 헌금 유형 필터
    const matchesFundType = fundTypeFilter.length === 0 || fundTypeFilter.includes(donation.fundType);

    // 검색 필터
    const matchesSearch = donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.fundType.includes(searchTerm);

    // 날짜 필터
    let matchesDate = true;
    if (dateRange?.from || dateRange?.to) {
      const donationDate = new Date(donation.offeredOn);

      if (dateRange.from) {
        matchesDate = matchesDate && donationDate >= dateRange.from;
      }

      if (dateRange.to) {
        matchesDate = matchesDate && donationDate <= dateRange.to;
      }
    }

    return matchesFundType && matchesSearch && matchesDate;
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

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDonations = filteredDonations.slice(startIndex, endIndex);

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange, fundTypeFilter]);

  const filteredReceipts = receipts.filter(receipt => {
    const donorName = receipt.donorName || receipt.member?.name || '';
    const taxYear = receipt.taxYear || receipt.tax_year;
    return donorName.toLowerCase().includes(searchTerm.toLowerCase()) &&
           taxYear === selectedYear;
  });

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  // 헌금 유형별 chip 색 페어 (Direction C)
  const getFundTypeChipClass = (fundType: string): string => {
    switch (fundType) {
      case '십일조': return 'bg-[#EAF1FE] text-[#2563EB]';
      case '주일헌금': return 'bg-[#F1F4F9] text-[#475569]';
      case '감사헌금': return 'bg-[#E7F6EC] text-[#16A34A]';
      case '선교헌금': return 'bg-[#F0E6EF] text-[#8A5A86]';
      case '건축헌금': return 'bg-[#FBF1E3] text-[#B45309]';
      default: return 'bg-[#F1F4F9] text-[#64748B]';
    }
  };

  // 헌금 유형별 막대/도트 색 (시안 .dn-bar / .dn-leg 매핑)
  const getFundTypeBarColor = (fundType: string): string => {
    switch (fundType) {
      case '십일조': return '#2563EB';
      case '주일헌금': return '#64748B';
      case '감사헌금': return '#16A34A';
      case '선교헌금': return '#8A5A86';
      case '건축헌금': return '#B45309';
      default: return '#94A3B8';
    }
  };

  // 헌금 종류별 분포 (현재 filteredDonations 기준)
  // 헌금 종류별 분포는 필터와 무관하게 항상 전체(donations) 기준
  const fundDistribution = useMemo(() => {
    const totalsByType = new Map<string, number>();
    let total = 0;
    for (const d of donations) {
      totalsByType.set(d.fundType, (totalsByType.get(d.fundType) || 0) + d.amount);
      total += d.amount;
    }
    const rawItems = Array.from(totalsByType.entries())
      .map(([type, amount]) => ({
        type,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
        color: getFundTypeBarColor(type),
      }))
      .sort((a, b) => b.amount - a.amount);

    // 1% 미만은 "기타"로 묶어 시각적 잡음 줄임
    const THRESHOLD = 1; // %
    const major = rawItems.filter(i => i.percentage >= THRESHOLD);
    const minor = rawItems.filter(i => i.percentage < THRESHOLD);
    const items = [...major];
    if (minor.length > 0) {
      const otherAmount = minor.reduce((s, i) => s + i.amount, 0);
      const otherPct = total > 0 ? Math.round((otherAmount / total) * 1000) / 10 : 0;
      items.push({
        type: '기타',
        amount: otherAmount,
        percentage: otherPct,
        color: '#CBD5E1',
        details: minor, // tooltip에서 분해 표시용
      } as any);
    }
    return { items, total };
  }, [donations]);

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
          </div>
        </body>
      </html>
    `;

    // 새 창에서 인쇄 대화상자 열기
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.document.title = `기부금영수증_${member.name}_${year}`;
      printWindow.focus();

      // 페이지 로드 후 자동으로 인쇄 대화상자 열기
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  // 개별 영수증 인쇄 처리
  const handleReceiptPrint = (receipt: any) => {
    // 해당 영수증의 교인과 기부 내역 찾기
    const memberId = receipt.donorId || receipt.member_id;
    const taxYear = receipt.taxYear || receipt.tax_year;
    
    // 교인 정보 찾기
    const member = members.find(m => m.id === memberId);
    
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

  // 상단바 부제·액션 (Hook은 early return 전 호출)
  usePageSubtitle('교인별 헌금 내역을 관리하고 연말정산 영수증을 발행합니다');
  usePageActions(
    <>
      <Button
        onClick={downloadDonationsExcel}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="h-3.5 w-3.5" />
        엑셀 다운
      </Button>
      <Button
        onClick={downloadExcelTemplate}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <FileText className="h-3.5 w-3.5" />
        템플릿
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExcelUploadModalOpen(true)}
        className="gap-2"
      >
        <Upload className="h-3.5 w-3.5" />
        엑셀 등록
      </Button>
      <Button
        variant="info-soft"
        size="sm"
        onClick={() => navigate('/donations/bulk-input')}
        className="gap-2"
      >
        <Users className="h-3.5 w-3.5" />
        일괄 입력
      </Button>
      <Button
        size="sm"
        onClick={() => setIsAddModalOpen(true)}
        className="gap-2"
      >
        <Plus className="h-3.5 w-3.5" />
        헌금 입력
      </Button>
    </>,
    // 클로저가 최신 데이터/필터를 잡도록 deps 명시
    [donations.length, filteredDonations.length, searchTerm, fundTypeFilter, dateRange]
  );

  return (
    <PageContainer>
      {/* 헌금 내역 / 기부금 영수증 탭 — 조직·부서/심방 관리와 동일한 언더라인 스타일 */}
      <div className="mb-4 inline-flex items-center gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('donations')}
          className={cn(
            'relative px-4 py-2.5 text-[13px] font-semibold transition-colors',
            activeTab === 'donations'
              ? 'text-foreground after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          헌금 내역
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={cn(
            'relative px-4 py-2.5 text-[13px] font-semibold transition-colors',
            activeTab === 'receipts'
              ? 'text-foreground after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          기부금 영수증
        </button>
      </div>

      {/* 헌금 내역 탭 */}
      {activeTab === 'donations' && (
        <div className="space-y-4">
          {/* 헌금 데이터 전체 로딩 */}
          {loading ? (
            <Card>
              <LoadingState text="헌금 데이터를 불러오는 중..." />
            </Card>
          ) : (
            <>
              {/* 1) 통계 KPI strip */}
              <div className="grid grid-cols-2 gap-[14px] md:grid-cols-4">
                <Card>
                  <div className="px-[18px] py-4">
                    <div className="text-[12px] font-semibold text-muted-foreground">이번 달 총액</div>
                    <div className="mt-2 text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums">
                      {formatCurrency(donations.reduce((sum, d) => sum + d.amount, 0))}
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="px-[18px] py-4">
                    <div className="text-[12px] font-semibold text-muted-foreground">헌금 건수</div>
                    <div className="mt-2 text-[24px] font-bold leading-none tracking-[-0.02em]">
                      {donations.length}
                      <span className="ml-1 text-[13px] font-semibold text-[#94A3B8]">건</span>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="px-[18px] py-4">
                    <div className="text-[12px] font-semibold text-muted-foreground">기부자 수</div>
                    <div className="mt-2 text-[24px] font-bold leading-none tracking-[-0.02em]">
                      {new Set(donations.map(d => d.donorId)).size}
                      <span className="ml-1 text-[13px] font-semibold text-[#94A3B8]">명</span>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="px-[18px] py-4">
                    <div className="text-[12px] font-semibold text-muted-foreground">평균 헌금</div>
                    <div className="mt-2 text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums">
                      {donations.length > 0 ? formatCurrency(Math.round(donations.reduce((sum, d) => sum + d.amount, 0) / donations.length)) : '0'}
                    </div>
                  </div>
                </Card>
              </div>

              {/* 2) 헌금 종류별 분포 — 컴팩트 (스택바 + 범례 inline) */}
              {fundDistribution.items.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between border-b border-[#EEF1F6] px-[18px] py-3">
                    <div className="text-[13px] font-bold tracking-[-0.01em]">헌금 종류별 분포</div>
                    <span className="text-[12px] font-semibold text-[#94A3B8]">
                      누계 {formatCurrency(fundDistribution.total)}
                    </span>
                  </div>
                  <div className="px-[18px] py-[14px]">
                    {/* 스택바 — 마우스 따라다니는 단일 tooltip */}
                    <div
                      className="relative mb-3"
                      onMouseLeave={() => setFundTooltip(null)}
                    >
                      <div className="flex h-[10px] rounded-[5px] bg-[#F1F4F9]">
                        {fundDistribution.items.map((item, index) => {
                          const isFirst = index === 0;
                          const isLast = index === fundDistribution.items.length - 1;
                          return (
                            <div
                              key={item.type}
                              className="h-full cursor-default transition-all hover:brightness-95"
                              style={{
                                width: `${item.percentage}%`,
                                background: item.color,
                                borderTopLeftRadius: isFirst ? 5 : 0,
                                borderBottomLeftRadius: isFirst ? 5 : 0,
                                borderTopRightRadius: isLast ? 5 : 0,
                                borderBottomRightRadius: isLast ? 5 : 0,
                              }}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                                setFundTooltip({ item, x: e.clientX - rect.left });
                              }}
                              onMouseMove={(e) => {
                                const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                                setFundTooltip({ item, x: e.clientX - rect.left });
                              }}
                            />
                          );
                        })}
                      </div>
                      {/* 마우스 따라가는 Tooltip */}
                      {fundTooltip && (() => {
                        const item: any = fundTooltip.item;
                        // 컨테이너 폭을 모르므로 좌/우 경계는 transform으로 처리
                        return (
                          <div
                            className="pointer-events-none absolute z-20 -translate-x-1/2 whitespace-nowrap rounded-[8px] border border-border bg-card px-3 py-2 text-[12px] shadow-lg"
                            style={{
                              left: fundTooltip.x,
                              bottom: 'calc(100% + 8px)',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-[8px] w-[8px] flex-shrink-0 rounded-[2px]"
                                style={{ background: item.color }}
                              />
                              <span className="font-bold text-foreground">{item.type}</span>
                              <span className="text-[#94A3B8]">{item.percentage}%</span>
                            </div>
                            <div className="mt-1 text-[13px] font-bold tabular-nums text-foreground">
                              {formatCurrency(item.amount)}
                            </div>
                            {item.details && item.details.length > 0 && (
                              <div className="mt-2 border-t border-[#F1F4F9] pt-2">
                                {(item.details as Array<{ type: string; amount: number; percentage: number; color: string }>).map(d => (
                                  <div key={d.type} className="mt-1 flex items-center gap-2 text-[11.5px]">
                                    <span
                                      className="h-[6px] w-[6px] flex-shrink-0 rounded-[1px]"
                                      style={{ background: d.color }}
                                    />
                                    <span className="text-[#334155]">{d.type}</span>
                                    <span className="ml-auto whitespace-nowrap tabular-nums text-foreground">
                                      {formatCurrency(d.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-card" />
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {fundDistribution.items.map((item) => (
                        <div key={item.type} className="flex items-center gap-2 text-[12.5px]">
                          <span
                            className="h-[8px] w-[8px] flex-shrink-0 rounded-[2px]"
                            style={{ background: item.color }}
                          />
                          <span className="font-semibold text-[#334155]">{item.type}</span>
                          <span className="text-[11.5px] text-[#94A3B8]">
                            {item.percentage}%
                          </span>
                          <span className="whitespace-nowrap font-bold tabular-nums text-foreground">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* 3) 검색·필터 + 테이블 — 한 카드로 통합 (교인 관리 패턴) */}
              <Card className="overflow-hidden">
                {/* 검색 + 필터 바 (카드 헤더 자리) */}
                <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF1F6] px-[16px] py-[14px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="기부자명 또는 헌금 유형 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full md:w-[320px]"
                    />
                  </div>
                  {/* spacer — 기간/헌금 유형을 우측으로 밀어냄 */}
                  <div className="flex-1" />
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                  />
                  {/* 헌금 유형 — 다중 선택 (교인 관리 패턴) */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-[38px] w-auto min-w-[160px] items-center justify-between gap-2 rounded-[8px] border border-border bg-card px-3 text-[13px] text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[12.5px] text-muted-foreground">헌금 유형</span>
                          <span className="font-medium">
                            {fundTypeFilter.length === 0
                              ? '전체'
                              : fundTypeFilter.length === 1
                                ? fundTypeFilter[0]
                                : `${fundTypeFilter.length}개 선택`}
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-0" align="end">
                      <div className="py-1.5">
                        {fundTypes.map((type) => {
                          const checked = fundTypeFilter.includes(type);
                          return (
                            <label
                              key={type}
                              htmlFor={`fund-type-${type}`}
                              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-secondary"
                            >
                              <Checkbox
                                id={`fund-type-${type}`}
                                checked={checked}
                                onCheckedChange={(c) => {
                                  if (c) {
                                    setFundTypeFilter([...fundTypeFilter, type]);
                                  } else {
                                    setFundTypeFilter(fundTypeFilter.filter((t) => t !== type));
                                  }
                                }}
                              />
                              <span className="flex-1">{type}</span>
                            </label>
                          );
                        })}
                      </div>
                      {fundTypeFilter.length > 0 && (
                        <div className="border-t border-border px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setFundTypeFilter([])}
                            className="text-[12px] font-semibold text-primary hover:underline"
                          >
                            선택 초기화
                          </button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 헌금 목록 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[840px] table-fixed">
                    <colgroup>
                      <col className="w-[120px]" />
                      <col className="w-[160px]" />
                      <col className="w-[140px]" />
                      <col className="w-[140px]" />
                      <col />
                    </colgroup>
                    <thead className="bg-[#F8FAFD]">
                      <tr>
                        <th
                          className="cursor-pointer px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
                          onClick={() => handleSort('offeredOn')}
                        >
                          <span className="flex items-center gap-1">
                            날짜
                            {getSortIcon('offeredOn')}
                          </span>
                        </th>
                        <th
                          className="cursor-pointer px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
                          onClick={() => handleSort('donorName')}
                        >
                          <span className="flex items-center gap-1">
                            기부자
                            {getSortIcon('donorName')}
                          </span>
                        </th>
                        <th
                          className="cursor-pointer px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
                          onClick={() => handleSort('fundType')}
                        >
                          <span className="flex items-center gap-1">
                            헌금 유형
                            {getSortIcon('fundType')}
                          </span>
                        </th>
                        <th
                          className="cursor-pointer px-[18px] py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
                          onClick={() => handleSort('amount')}
                        >
                          <span className="flex items-center justify-end gap-1">
                            금액
                            {getSortIcon('amount')}
                          </span>
                        </th>
                        <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">적요</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F4F9] bg-card">
                      {currentDonations.map((donation) => {
                        const isEditingNote = editingNoteId === donation.id;
                        return (
                          <tr
                            key={donation.id}
                            className="cursor-pointer transition-colors hover:bg-[#F8FAFD]"
                            onClick={() => handleEditDonation(donation)}
                          >
                            <td className="px-[18px] py-3 whitespace-nowrap text-[13px] text-foreground tabular-nums">{donation.offeredOn}</td>
                            <td className="px-[18px] py-3 whitespace-nowrap text-[13px] font-semibold text-foreground truncate" title={donation.donorName}>{donation.donorName}</td>
                            <td className="px-[18px] py-3 whitespace-nowrap text-[13px]">
                              <span className={cn(
                                "inline-flex rounded-[6px] px-[9px] py-[2px] text-[10.5px] font-semibold whitespace-nowrap",
                                getFundTypeChipClass(donation.fundType)
                              )}>
                                {donation.fundType}
                              </span>
                            </td>
                            <td className="px-[18px] py-3 whitespace-nowrap text-right text-[13px] tabular-nums text-foreground">
                              {formatCurrency(donation.amount)}
                            </td>
                            {/* 적요 — 인라인 편집 가능 */}
                            <td
                              className="px-[18px] py-2 text-[13px] text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isEditingNote) startEditNote(donation);
                              }}
                            >
                              {isEditingNote ? (
                                <input
                                  type="text"
                                  value={editingNoteValue}
                                  onChange={(e) => setEditingNoteValue(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      saveEditNote();
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      cancelEditNote();
                                    }
                                  }}
                                  onBlur={() => saveEditNote()}
                                  autoFocus
                                  className="h-[32px] w-full rounded-[6px] border border-primary bg-card px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              ) : (
                                <div className="min-h-[32px] flex items-center rounded-[6px] px-2 -mx-2 hover:bg-[#EEF3FC] transition-colors">
                                  <span className={cn("truncate", !donation.note && "text-[#CBD5E1]")} title={donation.note || ''}>
                                    {donation.note || '—'}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredDonations.length === 0 && (
                  <div className="py-12 text-center text-[13px] text-muted-foreground">
                    등록된 헌금 내역이 없습니다.
                  </div>
                )}
              </Card>

              {/* 페이지네이션 */}
              {filteredDonations.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredDonations.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1);
                  }}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* 영수증 탭 */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          {/* 컨트롤 바 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number(value))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="년도 선택" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2023, 2022, 2021, 2020].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>기부금 영수증</CardTitle>
              <CardDescription>{selectedYear}년 발행된 기부금 영수증 목록입니다.</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                  <thead className="bg-[#F8FAFD]">
                    <tr>
                      {['발행번호', '기부자', '총액', '발행일', '발행자'].map((h, i) => (
                        <th
                          key={h}
                          className={cn(
                            "px-[18px] py-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]",
                            i === 2 ? "text-right" : "text-left"
                          )}
                        >
                          {h}
                        </th>
                      ))}
                      <th className="px-[18px] py-3 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F4F9] bg-card">
                    {filteredReceipts.map((receipt) => (
                      <tr key={receipt.id} className="transition-colors hover:bg-[#F8FAFD]">
                        <td className="px-[18px] py-3 whitespace-nowrap text-[13px] font-mono text-foreground">{receipt.issueNo || receipt.issue_no}</td>
                        <td className="px-[18px] py-3 whitespace-nowrap text-[13px] font-semibold text-foreground">{receipt.donorName || receipt.member?.name || ''}</td>
                        <td className="px-[18px] py-3 whitespace-nowrap text-right text-[13px] tabular-nums text-foreground">
                          {formatCurrency(receipt.totalAmount || Number(receipt.total_amount) || 0)}
                        </td>
                        <td className="px-[18px] py-3 whitespace-nowrap text-[13px] text-foreground tabular-nums">
                          {receipt.issuedAt ? new Date(receipt.issuedAt).toLocaleDateString('ko-KR') :
                           receipt.issued_at ? new Date(receipt.issued_at).toLocaleDateString('ko-KR') : ''}
                        </td>
                        <td className="px-[18px] py-3 whitespace-nowrap text-[13px] text-foreground">관리자</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReceiptPrint(receipt)}
                              title="영수증 인쇄"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
            {filteredReceipts.length === 0 && (
              <div className="py-8 text-center text-[13px] text-muted-foreground">
                {selectedYear}년에 발행된 영수증이 없습니다.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 일괄 입력 모달 */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{overflow: 'visible'}}>
          <div className="bg-white p-6 w-full max-w-6xl relative flex flex-col" style={{maxHeight: '90vh', borderRadius: '8px', overflow: 'visible'}}>
            <h2 className="text-xl font-bold mb-4">헌금 일괄 입력</h2>
            
            {/* 공통 설정 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">헌금일</label>
                <DatePicker
                  value={bulkSettings.offeredOn}
                  onChange={(value) => setBulkSettings({ ...bulkSettings, offeredOn: value })}
                  placeholder="날짜 선택"
                />
              </div>
            </div>

            {/* 헌금 목록 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-3">
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
              
              <div className="border rounded-lg flex-1 flex flex-col overflow-hidden">
                <div className="overflow-y-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200 relative">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-16">무명</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">기부자</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">헌금 유형</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">금액</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">적요</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-20">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bulkDonations.map((bulk, index) => (
                      <tr key={index} className="hover:bg-gray-50">
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
                        <td className="py-2 px-3 relative z-50 overflow-visible">
                          {bulk.isAnonymous ? (
                            <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-sm text-center">
                              무명
                            </div>
                          ) : (
                            <div style={{position: 'relative', zIndex: 9999}}>
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
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3">
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
                <label className="block text-sm font-medium mb-2">기부자</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
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
                    <span className="ml-2 text-sm">무명</span>
                  </div>
                  <div className="flex-1">
                    {newDonation.isAnonymous ? (
                      <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-sm text-center">
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
                        value={newDonation.donorId}
                        onChange={(value) => {
                          setNewDonation({ ...newDonation, donorId: value });
                        }}
                        placeholder="교인 검색 (이름, 전화번호)"
                        searchPlaceholder="이름, 전화번호로 검색"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">헌금일</label>
                <DatePicker
                  value={newDonation.offeredOn}
                  onChange={(value) => setNewDonation({ ...newDonation, offeredOn: value })}
                  placeholder="날짜 선택"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">헌금 유형</label>
                <Combobox
                  options={fundTypes.map(type => ({ label: type, value: type }))}
                  value={newDonation.fundType}
                  onChange={(value) => setNewDonation({ ...newDonation, fundType: value })}
                  placeholder="헌금 유형 선택..."
                  searchPlaceholder="헌금 유형 검색..."
                  emptyMessage="검색 결과가 없습니다"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">금액</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="헌금 금액을 입력하세요"
                  value={newDonation.amount ? newDonation.amount.toLocaleString('ko-KR') : ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, '');
                    setNewDonation({ ...newDonation, amount: digits ? Number(digits) : 0 });
                  }}
                  className="text-right tabular-nums"
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

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleAddDonation}
                disabled={submitLoading}
              >
                {submitLoading ? '등록 중...' : '등록'}
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
                <DatePicker
                  value={editingDonation.offeredOn}
                  onChange={(value) => setEditingDonation({ ...editingDonation, offeredOn: value })}
                  placeholder="날짜 선택"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">헌금 유형</label>
                <Combobox
                  options={fundTypes.map(type => ({ label: type, value: type }))}
                  value={editingDonation.fundType}
                  onChange={(value) => setEditingDonation({ ...editingDonation, fundType: value })}
                  placeholder="헌금 유형 선택..."
                  searchPlaceholder="헌금 유형 검색..."
                  emptyMessage="검색 결과가 없습니다"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">금액</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="헌금 금액을 입력하세요"
                  value={editingDonation.amount ? editingDonation.amount.toLocaleString('ko-KR') : ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, '');
                    setEditingDonation({ ...editingDonation, amount: digits ? Number(digits) : 0 });
                  }}
                  className="text-right tabular-nums"
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

            <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-4">
              <Button
                variant="destructive-soft"
                size="sm"
                onClick={async () => {
                  if (!editingDonation) return;
                  const id = editingDonation.id;
                  setIsEditModalOpen(false);
                  setEditingDonation(null);
                  await handleDeleteDonation(id);
                }}
                disabled={submitLoading}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                삭제
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingDonation(null);
                  }}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdateDonation}
                  disabled={submitLoading}
                >
                  {submitLoading ? '수정 중...' : '수정'}
                </Button>
              </div>
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
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="년도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 1 - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}년
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">기부자</label>
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
                    value={selectedDonor}
                    onChange={(value) => setSelectedDonor(value)}
                    placeholder="교인 검색 (이름, 전화번호)"
                    searchPlaceholder="이름, 전화번호로 검색"
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

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="ghost"
                size="sm"
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
              >
                취소
              </Button>
              <Button size="sm" onClick={generateReceipt} disabled={!selectedDonor}>
                영수증 발행
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 엑셀 업로드 모달 */}
      {isExcelUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Upload className="w-5 h-5" />
                엑셀 업로드
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExcelUploadModalOpen(false);
                  setExcelFile(null);
                  setExcelPreviewData([]);
                  setValidationResults(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-md p-3">
                <p className="text-sm text-primary-800">
                  <strong>안내:</strong> 엑셀 템플릿을 먼저 다운로드하여 작성한 후 업로드해주세요.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  엑셀 파일 선택
                </label>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setExcelFile(file);
                      setExcelPreviewData([]);
                      setValidationResults(null);
                    }
                  }}
                />
                <p className="text-xs text-gray-600 mt-1">
                  엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.
                </p>
              </div>

              {excelFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-900">{excelFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(excelFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExcelPreview}
                    disabled={loading}
                  >
                    미리보기
                  </Button>
                </div>
              )}

              {excelPreviewData.length > 0 && validationResults && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      검증 결과 ({validationResults.filter(r => r.isValid).length}/{validationResults.length}건 유효)
                    </h3>
                    <Button
                      onClick={() => {
                        setExcelPreviewData([]);
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
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <h3 className="font-medium text-sm">미리보기 (최대 10건)</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">상태</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">기부자명</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">헌금일</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">헌금유형</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-700">금액</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">비고</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {excelPreviewData.map((row, index) => {
                            const result = validationResults[index];
                            return (
                              <tr
                                key={index}
                                className={result.isValid ? 'bg-white' : 'bg-red-50'}
                              >
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {result.isValid ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                  )}
                                </td>
                                <td className="px-3 py-2">{row.donorName}</td>
                                <td className="px-3 py-2">{row.offeredOn}</td>
                                <td className="px-3 py-2">{row.fundType}</td>
                                <td className="px-3 py-2 text-right">{Number(row.amount).toLocaleString()}</td>
                                <td className="px-3 py-2">{row.note}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExcelUploadModalOpen(false);
                  setExcelFile(null);
                  setExcelPreviewData([]);
                  setValidationResults(null);
                }}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleExcelUpload}
                disabled={!excelFile || submitLoading}
              >
                {submitLoading ? '업로드 중...' : '업로드 시작'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default DonationManagement;
