import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCurrentUser, useMembers, useOrganizations, useDepartments } from '../hooks/queries';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { activityLogger } from '../services/activityLogger';
import { supabase } from '../lib/supabase';
import { Pagination } from './common/Pagination';
import axios from 'axios';
import {
  Search,
  Plus,
  Camera,
  QrCode,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  User,
  UserPlus,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Send,
  MessageSquare,
  Edit3,
  Save,
  X,
  MapPin,
  UserCheck,
  Briefcase,
  Heart,
  Upload,
  Download,
  Settings,
  Shield,
  Phone,
  Mail,
  Church,
  ArrowRightLeft,
  Car,
  CheckCircle2,
  AlertTriangle,
  Loader,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from "./ui";
import { Input } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Card, CardContent, LoadingState } from "./ui";
import { Badge } from "./ui";
import { usePermissions } from '../contexts/PermissionContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "./ui";
import { Textarea } from "./ui";
import { Spinner } from "./ui/spinner";
import { PageContainer } from "./ui";
import { usePageSubtitle, usePageActions } from '../hooks/usePageSubtitle';
import { DatePicker } from "./ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { isChurchSuperAdmin, isSuperAdmin, ROLES, getRoleDisplayName } from '../utils/userPermissions';
import { StandardPagination } from '../types/community-common';
import { organizationService } from '../services/organizationService';
import { ChurchOrganization, ORGANIZATION_TYPE_LABELS } from '../types/organization';
import * as XLSX from 'xlsx';
import { matchKoreanSearch } from '../utils/koreanSearch';
import {
  ADMIN_POSITION_OPTIONS,
  getPositionMainLabel,
  getPositionDetailLabel,
  isValidPositionMain,
  isValidPositionDetail,
  normalizePositionMain,
  normalizePositionDetail,
  POSITION_MAIN_LABELS,
  POSITION_DETAIL_LABELS,
  POSITION_HIERARCHY
} from '../constants/memberPositions';

interface Member {
  id: number;
  name: string;
  name_eng?: string;
  email?: string;
  gender: string;
  birthdate: string | null;
  birthdate_type?: string;
  phone?: string;
  address: string | null;
  position_main?: string | null;  // 직분 대분류
  position_detail?: string | null; // 직분 세부
  organization_id?: string | null;
  organization_name?: string | null;
  church_id: number;
  profile_photo_url: string | null;
  member_status: string;
  registration_date: string | null;
  invitation_status?: string;

  // 사역 정보
  department?: string;
  position_code?: string;
  appointed_on?: string;
  ordination_church?: string;
  ministry_start_date?: string;
  neighboring_church?: string;
  position_decision?: string;
  daily_activity?: string;
  inviter3_member_id?: number;
  inviter_name?: string;

  // 직업 정보
  job_category?: string;
  job_detail?: string;
  job_position?: string;
  job_title?: string;
  workplace?: string;
  workplace_phone?: string;

  // 주소 정보
  postal_code?: string;
  region_1?: string;
  region_2?: string;
  region_3?: string;

  // 개인 정보
  member_type?: string;
  age_group?: string;
  spiritual_grade?: string;
  marital_status?: string;
  spouse_name?: string;
  married_on?: string;
  children?: Array<{ name: string; gender?: string; birthdate?: string; }>;

  // 자유 필드
  custom_field_1?: string;
  custom_field_2?: string;
  custom_field_3?: string;
  custom_field_4?: string;
  custom_field_5?: string;
  custom_field_6?: string;
  custom_field_7?: string;
  custom_field_8?: string;
  custom_field_9?: string;
  custom_field_10?: string;
  custom_field_11?: string;
  custom_field_12?: string;

  // 특별 사항
  special_notes?: string;

  // 연락처 정보
  contacts?: Array<{ type: string; value: string; }>;

  // 성례 기록
  sacraments?: Array<{ type: string; date: string; church_name: string; }>;

  // 이명 기록
  transfers?: Array<{ type: string; church_name: string; date: string; }>;

  // 차량 정보
  vehicles?: Array<{ car_type: string; plate_no: string; }>;
}

// 일괄 초대 진행 상황 타입
interface InviteProgressItem {
  id: number;
  name: string;
  email: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  temporaryPassword?: string;
  errorMessage?: string;
}

const MemberManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = usePermissions();

  // 권한 체크 (교인 관리 페이지 경로: /member-management)
  const canCreateMember = permissions.canCreate('/member-management');
  const canEditMember = permissions.canEdit('/member-management');
  const canDeleteMember = permissions.canDelete('/member-management');

  // React Query: 공유 데이터 (currentUser/members/organizations/departments)
  const { data: queriedCurrentUser } = useCurrentUser();
  const queriedChurchId = queriedCurrentUser?.church_id ?? null;
  const {
    data: queriedMembers,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useMembers();
  const { data: queriedOrganizations } = useOrganizations(queriedChurchId);
  const { data: queriedDepartments } = useDepartments(queriedChurchId);

  const [members, setMembers] = useState<Member[]>([]); // 현재 페이지 데이터
  const [allMembers, setAllMembers] = useState<Member[]>([]); // 원본 데이터 캐시
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [invitationStatusFilter, setInvitationStatusFilter] = useState<string[]>([]);
  // 시안 매핑 필터 (직분 / 구역)
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedMember, setEditedMember] = useState<Partial<Member>>({});

  // 관계 테이블 데이터
  const [memberContacts, setMemberContacts] = useState<any[]>([]);
  const [memberSacraments, setMemberSacraments] = useState<any[]>([]);
  const [memberTransfers, setMemberTransfers] = useState<any[]>([]);
  const [memberVehicles, setMemberVehicles] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [excelPreviewData, setExcelPreviewData] = useState<any[] | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<Array<{
    rowNumber: number;
    data: any;
    errors: string[];
    warnings: string[];
    isValid: boolean;
  }> | null>(null);

  // 초대 메시지 모달 상태
  const [showInviteMessage, setShowInviteMessage] = useState(false);
  const [inviteMessageData, setInviteMessageData] = useState({ email: '', name: '', temporaryPassword: '' });
  const [copySuccess, setCopySuccess] = useState(false);

  // 일괄 초대 결과 모달 상태
  const [showBulkInviteResults, setShowBulkInviteResults] = useState(false);
  const [bulkInviteResults, setBulkInviteResults] = useState<Array<{ name: string; email: string; temporaryPassword: string; success: boolean }>>([]);
  const [bulkCopySuccess, setBulkCopySuccess] = useState(false);

  // 일괄 초대 진행 상황 모달 상태
  const [showBulkInviteProgress, setShowBulkInviteProgress] = useState(false);
  const [bulkInviteProgress, setBulkInviteProgress] = useState<InviteProgressItem[]>([]);

  // View and pagination states
  const [viewType, setViewType] = useState<'grid'>('grid');
  const [pagination, setPagination] = useState<StandardPagination>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20,
    has_next: false,
    has_prev: false
  });
  const [sortField, setSortField] = useState<keyof Member | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInfo, setPasswordInfo] = useState<{member_id: number, member_name: string, email: string, password: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // SMS Invitation states
  const [smsLoading, setSmsLoading] = useState<number | null>(null);

  // 현재 사용자 정보 및 권한 관련 상태
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  // 조직 관련 상태
  const [organizations, setOrganizations] = useState<ChurchOrganization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('all');

  // 부서 관련 상태
  const [departments, setDepartments] = useState<string[]>([]);

  // Advanced search states
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearchData, setAdvancedSearchData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'all',
    position_main: 'all',
    position_detail: 'all',
    organization_id: 'all',
    age_group: 'all',
    ageFrom: '',
    ageTo: '',
    marital_status: 'all',
    job_category: 'all'
  });
  const [isAdvancedSearchActive, setIsAdvancedSearchActive] = useState(false);

  // Bulk invitation states
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [isBulkInviting, setIsBulkInviting] = useState(false);

  // Bulk delete states
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);


  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    gender: '남',
    birthdate: '',
    birthdate_type: '양력',
    phone: '',
    address: '',
    position_main: '',
    position_detail: '',
    district: ''
  });

  // Helper function to flatten organization tree
  const flattenOrganizations = (orgs: ChurchOrganization[], level: number = 0): ChurchOrganization[] => {
    let result: ChurchOrganization[] = [];
    orgs.forEach(org => {
      result.push({ ...org, level });
      if (org.children && org.children.length > 0) {
        result = result.concat(flattenOrganizations(org.children, level + 1));
      }
    });
    return result;
  };

  // organization_id로부터 루트까지의 계층 경로 문자열 생성 (예: "장년부 / 1구역 / A조")
  // organizations Map은 한 번만 생성하여 행마다 재생성하지 않음
  const organizationsMap = useMemo(
    () => new Map(organizations.map(o => [o.id, o])),
    [organizations]
  );
  const orgPathCacheRef = useRef<Map<string, string[]>>(new Map());
  useEffect(() => {
    // organizations가 바뀌면 캐시 무효화
    orgPathCacheRef.current = new Map();
  }, [organizationsMap]);
  const getOrgPath = React.useCallback((orgId?: string | null): string[] => {
    if (!orgId || organizationsMap.size === 0) return [];
    const cached = orgPathCacheRef.current.get(orgId);
    if (cached) return cached;
    const path: string[] = [];
    let cur = organizationsMap.get(orgId);
    let safety = 0;
    while (cur && safety < 20) {
      path.unshift(cur.name);
      if (!cur.parent_id) break;
      cur = organizationsMap.get(cur.parent_id);
      safety += 1;
    }
    orgPathCacheRef.current.set(orgId, path);
    return path;
  }, [organizationsMap]);

  // getCurrentUser 결과를 컴포넌트 라이프타임 동안 한 번만 호출하도록 캐시
  const currentUserPromiseRef = useRef<ReturnType<typeof supabaseAuthService.getCurrentUser> | null>(null);
  const getCurrentUserCached = React.useCallback(() => {
    if (!currentUserPromiseRef.current) {
      currentUserPromiseRef.current = supabaseAuthService.getCurrentUser();
    }
    return currentUserPromiseRef.current;
  }, []);

  // React Query 데이터를 기존 state에 동기화 (자체 페이지네이션/필터 흐름 유지)
  useEffect(() => {
    if (queriedCurrentUser !== undefined) {
      setCurrentUser(queriedCurrentUser);
    }
  }, [queriedCurrentUser]);

  useEffect(() => {
    if (queriedMembers) {
      setAllMembers(queriedMembers as Member[]);
    }
  }, [queriedMembers]);

  useEffect(() => {
    // 첫 로딩 끝나면 loading false
    if (!membersLoading) {
      setLoading(false);
    }
  }, [membersLoading]);

  useEffect(() => {
    if (queriedOrganizations) {
      const flatOrgs = flattenOrganizations(queriedOrganizations as any);
      setOrganizations(flatOrgs);
    }
  }, [queriedOrganizations]);

  useEffect(() => {
    if (queriedDepartments) {
      setDepartments(queriedDepartments as string[]);
    }
  }, [queriedDepartments]);

  // 외부 호출용 — 기존 코드와 호환을 위해 fetchMembers는 refetch로 위임
  const fetchMembers = async () => {
    await refetchMembers();
  };

  // Helper function to calculate age from birthdate
  const calculateAge = (birthdate: string | null): number | null => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // useMemo로 필터링 및 정렬된 데이터 캐싱 (검색어, 필터, 정렬 옵션이 변경될 때만 재계산)
  const filteredAndSortedMembers = useMemo(() => {
    let filteredData = [...allMembers];

    // Apply basic search filter with Korean chosung search support
    if (searchTerm.trim() && !isAdvancedSearchActive) {
      const term = searchTerm.trim();
      filteredData = filteredData.filter((member: any) =>
        // 이름 검색 (초성 검색 지원)
        (member.name && matchKoreanSearch(member.name, term)) ||
        (member.full_name && matchKoreanSearch(member.full_name, term)) ||
        // 이메일 검색 (일반 텍스트 검색)
        (member.email && member.email.toLowerCase().includes(term.toLowerCase())) ||
        // 전화번호 검색 (일반 텍스트 검색)
        (member.phone && member.phone.includes(term))
      );
    }

    // Apply advanced search filters
    if (isAdvancedSearchActive) {
      filteredData = filteredData.filter((member: any) => {
        // 이름 필터
        if (advancedSearchData.name && member.name &&
            !member.name.toLowerCase().includes(advancedSearchData.name.toLowerCase())) {
          return false;
        }

        // 이메일 필터
        if (advancedSearchData.email && member.email &&
            !member.email.toLowerCase().includes(advancedSearchData.email.toLowerCase())) {
          return false;
        }

        // 전화번호 필터
        if (advancedSearchData.phone && member.phone &&
            !member.phone.includes(advancedSearchData.phone)) {
          return false;
        }

        // 성별 필터
        if (advancedSearchData.gender !== 'all' && member.gender !== advancedSearchData.gender) {
          return false;
        }

        // 직분 대분류 필터
        if (advancedSearchData.position_main !== 'all' && member.position_main !== advancedSearchData.position_main) {
          return false;
        }

        // 직분 세부 필터
        if (advancedSearchData.position_detail !== 'all' && member.position_detail !== advancedSearchData.position_detail) {
          return false;
        }

        // 조직/부서 필터
        if (advancedSearchData.organization_id !== 'all' && member.organization_id !== advancedSearchData.organization_id) {
          return false;
        }

        // 연령대 필터
        if (advancedSearchData.age_group !== 'all' && member.age_group !== advancedSearchData.age_group) {
          return false;
        }

        // 나이 범위 필터
        if (advancedSearchData.ageFrom || advancedSearchData.ageTo) {
          const age = calculateAge(member.birthdate);
          if (age === null) return false; // 생년월일이 없는 경우 제외

          if (advancedSearchData.ageFrom && age < parseInt(advancedSearchData.ageFrom)) {
            return false;
          }
          if (advancedSearchData.ageTo && age > parseInt(advancedSearchData.ageTo)) {
            return false;
          }
        }

        // 결혼 상태 필터
        if (advancedSearchData.marital_status !== 'all' && member.marital_status !== advancedSearchData.marital_status) {
          return false;
        }

        // 직업 분류 필터
        if (advancedSearchData.job_category !== 'all' && member.job_category !== advancedSearchData.job_category) {
          return false;
        }

        return true;
      });
    }

    // Apply invitation status filter (OR condition for multiple selections)
    if (invitationStatusFilter.length > 0) {
      filteredData = filteredData.filter((member: any) => {
        return invitationStatusFilter.includes(member.invitation_status);
      });
    }

    // 시안 매핑: 직분 / 구역 / 상태 필터
    if (positionFilter !== 'all') {
      filteredData = filteredData.filter((m: any) => m.position_main === positionFilter);
    }
    if (organizationFilter !== 'all') {
      filteredData = filteredData.filter((m: any) =>
        String(m.organization_id ?? '') === organizationFilter ||
        m.organization_name === organizationFilter
      );
    }
    // Sort all filtered data (before pagination)
    if (sortField) {
      filteredData.sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return filteredData;
  }, [allMembers, searchTerm, invitationStatusFilter, positionFilter, organizationFilter, sortField, sortOrder, isAdvancedSearchActive, advancedSearchData]);

  // useMemo로 페이지네이션된 데이터 캐싱 (페이지가 변경될 때만 재계산)
  const paginatedMembers = useMemo(() => {
    const startIndex = (pagination.current_page - 1) * pagination.per_page;
    const endIndex = startIndex + pagination.per_page;
    return filteredAndSortedMembers.slice(startIndex, endIndex);
  }, [filteredAndSortedMembers, pagination.current_page, pagination.per_page]);

  // 페이지네이션 메타데이터 계산 (useMemo로 캐싱)
  const paginationMeta = useMemo(() => {
    const actualTotalCount = filteredAndSortedMembers.length;
    const totalPages = Math.ceil(actualTotalCount / pagination.per_page) || 1;

    // current_page가 totalPages를 초과하는 경우 조정
    let adjustedCurrentPage = pagination.current_page;
    if (totalPages > 0 && pagination.current_page > totalPages) {
      adjustedCurrentPage = totalPages;
    }

    return {
      current_page: adjustedCurrentPage,
      total_count: actualTotalCount,
      total_pages: totalPages,
      has_prev: adjustedCurrentPage > 1,
      has_next: adjustedCurrentPage < totalPages
    };
  }, [filteredAndSortedMembers.length, pagination.current_page, pagination.per_page]);

  // 페이지네이션 메타데이터가 변경되면 상태 업데이트
  useEffect(() => {
    // 페이지 복원 중이면 자동 조정하지 않음
    if (isRestoringPaginationRef.current) {
      return;
    }

    if (
      pagination.total_count !== paginationMeta.total_count ||
      pagination.total_pages !== paginationMeta.total_pages ||
      pagination.has_prev !== paginationMeta.has_prev ||
      pagination.has_next !== paginationMeta.has_next ||
      pagination.current_page !== paginationMeta.current_page
    ) {
      setPagination(prev => ({
        ...prev,
        ...paginationMeta
      }));
    }
  }, [paginationMeta]);

  // paginatedMembers를 members 상태로 동기화
  useEffect(() => {
    setMembers(paginatedMembers);
  }, [paginatedMembers]);

  // 검색 로그 기록 (debounced)
  useEffect(() => {
    if (!searchTerm.trim()) return;

    const timer = setTimeout(() => {
      activityLogger.logMemberSearch(searchTerm, filteredAndSortedMembers.length);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filteredAndSortedMembers.length]);

  // 페이지 접근 로그 (최초 마운트 시에만) — 데이터 자체는 React Query가 자동 fetch
  useEffect(() => {
    activityLogger.logPageAccess('/member-management', '교인 관리');
  }, []);

  // location.state로 전달된 memberId가 있으면 자동으로 다이얼로그 열기
  // 수정 페이지에서 돌아왔을 때 페이지네이션 복원
  const processedStateRef = useRef<string | null>(null);
  const isRestoringPaginationRef = useRef<boolean>(false); // 페이지 복원 중인지 추적
  useEffect(() => {
    const state = location.state as {
      memberId?: number;
      action?: string;
      returnToPage?: number;
      returnPerPage?: number;
    } | null;

    // location.key를 사용하여 동일한 state를 중복 처리하지 않도록 방지
    if (processedStateRef.current === location.key) {
      return;
    }

    // 수정 페이지에서 돌아온 경우 페이지네이션 복원
    if (state?.returnToPage !== undefined || state?.returnPerPage !== undefined) {
      const returnPage = state.returnToPage;
      const returnPerPage = state.returnPerPage;

      // 복원 중임을 표시
      isRestoringPaginationRef.current = true;

      setPagination(prev => {
        const newPagination = {
          ...prev,
          ...(returnPage !== undefined && { current_page: returnPage }),
          ...(returnPerPage !== undefined && { per_page: returnPerPage })
        };
        return newPagination;
      });
      processedStateRef.current = location.key;

      // 복원 완료 후 플래그 해제 (다음 렌더링 사이클에서)
      setTimeout(() => {
        isRestoringPaginationRef.current = false;
      }, 100);

      // state 초기화 - navigate를 사용해서 명확하게 제거
      navigate(location.pathname, { replace: true, state: {} });
      return; // 더 이상 진행하지 않음
    }

    if (state?.memberId && allMembers.length > 0) {
      const targetMember = allMembers.find(m => m.id === state.memberId);
      if (targetMember) {
        handleMemberClick(targetMember);
        processedStateRef.current = location.key;
        // state 초기화
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, location.key]);

  const handleClearSearch = () => {
    setSearchTerm('');
    setIsAdvancedSearchActive(false);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // useMemo로 자동 필터링되므로 별도 처리 불필요
      // 검색 로그만 즉시 기록
      if (searchTerm.trim()) {
        activityLogger.logMemberSearch(searchTerm, filteredAndSortedMembers.length);
      }
    }
  };

  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };


  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await supabaseApiService.members.create(newMember);
      setMembers([...members, response.data]);
      setShowAddModal(false);
      setNewMember({
        name: '',
        email: '',
        gender: '남',
        birthdate: '',
        birthdate_type: '양력',
        phone: '',
        address: '',
        position_main: '',
        position_detail: '',
        district: ''
      });
    } catch (error) {
      console.error('교인 추가 실패:', error);
      alert('교인 추가에 실패했습니다.');
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!selectedMember) return;

    try {
      // Supabase Storage를 사용하여 파일 업로드
      const fileExt = file.name.split('.').pop();
      const fileName = `member-profiles/${selectedMember.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        // 버킷이 없으면 생성
        if (uploadError.message.includes('not found')) {
          const { error: createBucketError } = await supabase.storage.createBucket('member-photos', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
          });

          if (createBucketError) {
            throw new Error('프로필 사진 저장소 생성 실패: ' + createBucketError.message);
          }

          // 다시 시도
          const { data: retryData, error: retryError } = await supabase.storage
            .from('member-photos')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });

          if (retryError) {
            throw retryError;
          }
        } else {
          throw uploadError;
        }
      }

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('member-photos')
        .getPublicUrl(fileName);

      // members 테이블 업데이트
      const { error: updateError } = await supabase
        .from('members')
        .update({ profile_photo_url: publicUrl })
        .eq('id', selectedMember.id);

      if (updateError) {
        throw updateError;
      }

      // 사진 업로드 로그 기록
      activityLogger.log({
        action: 'update',
        resource: 'member',
        target_id: selectedMember.id,
        target_name: selectedMember.name,
        page_path: window.location.pathname,
        page_name: '교인 프로필 사진 업로드',
        details: { photo_uploaded: true, file_name: file.name, file_size: file.size }
      });

      // Update member in list
      const updatedMembers = allMembers.map(m =>
        m.id === selectedMember.id
          ? { ...m, profile_photo_url: publicUrl }
          : m
      );

      setAllMembers(updatedMembers);

      // Also update selectedMember for immediate UI feedback
      setSelectedMember(prev => prev ? { ...prev, profile_photo_url: publicUrl } : prev);
      
      setShowPhotoModal(false);
      alert('프로필 사진이 업로드되었습니다.');
    } catch (error: any) {
      console.error('사진 업로드 실패:', error);
      const errorMessage = error.response?.data?.detail || '사진 업로드에 실패했습니다.';
      alert(`사진 업로드 실패: ${errorMessage}`);
    }
  };

  const handleDeletePhoto = async (memberId: number) => {
    try {
      // TODO: 사진 삭제 기능을 Supabase Storage로 마이그레이션 필요
      alert('사진 삭제 기능은 현재 마이그레이션 중입니다.');
      return;
      // await api.delete(`/members/${memberId}/delete-photo`);
      // setMembers(members.map(m =>
      //   m.id === memberId
      //     ? { ...m, profile_photo_url: null }
      //     : m
      // ));
      // alert('프로필 사진이 삭제되었습니다.');
    } catch (error) {
      console.error('사진 삭제 실패:', error);
      alert('사진 삭제에 실패했습니다.');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success' as const;
      case 'inactive': return 'warning' as const;
      case 'transferred': return 'destructive' as const;
      case null:
      case undefined:
      case '': return 'success' as const;  // null/undefined는 기본적으로 활동(success)으로 처리
      default: return 'secondary' as const;
    }
  };

  const getGenderText = (gender: string) => {
    if (gender === 'M' || gender === 'MALE' || gender === 'male') return '남';
    if (gender === 'F' || gender === 'FEMALE' || gender === 'female') return '여';
    return gender; // 이미 '남', '여'로 되어있거나 다른 값인 경우 그대로 표시
  };

  const handleGetPassword = async (memberId: number) => {
    try {
      // TODO: 비밀번호 조회 기능을 Supabase Edge Function에 구현 필요
      alert('비밀번호 조회 기능은 현재 마이그레이션 중입니다.');
      return;
      // const response = await api.get(`/members/${memberId}/password`);
      // setPasswordInfo(response.data);
      // setShowPasswordModal(true);
      // setShowPassword(false); // Reset to hidden state
    } catch (error: any) {
      console.error('비밀번호 조회 실패:', error);
      if (error.response?.status === 404) {
        alert('이 교인은 아직 계정이 생성되지 않았습니다.');
      } else {
        alert('비밀번호 조회에 실패했습니다.');
      }
    }
  };

  const loadMemberRelations = async (memberId: number) => {
    try {
      // 모든 관계 데이터를 병렬로 조회 (성능 최적화)
      const [
        { data: contacts },
        { data: sacraments },
        { data: transfers },
        { data: vehicles }
      ] = await Promise.all([
        supabase.from('member_contacts').select('*').eq('member_id', memberId),
        supabase.from('sacraments').select('*').eq('member_id', memberId),
        supabase.from('transfers').select('*').eq('member_id', memberId),
        supabase.from('member_vehicles').select('*').eq('member_id', memberId)
      ]);

      setMemberContacts(contacts || []);
      setMemberSacraments(sacraments || []);
      setMemberTransfers(transfers || []);
      setMemberVehicles(vehicles || []);
    } catch (error) {
      console.error('관계 데이터 로드 실패:', error);
    }
  };

  const handleMemberClick = async (member: Member) => {
    // 교인 상세 조회 로그 기록
    const viewedFields = ['name', 'email', 'phone', 'gender', 'birthdate', 'address', 'position', 'district', 'member_status'];
    activityLogger.logMemberView(member.id, member.name, viewedFields);

    setSelectedMember({ ...member, children: member.children || [] });
    setEditedMember({ ...member, children: member.children || [] });
    setIsEditMode(false);

    // 관계 테이블 데이터 로드
    await loadMemberRelations(member.id);

    setShowDetailModal(true);
  };

  const handleEditMember = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (selectedMember) {
      setEditedMember({ ...selectedMember, children: selectedMember.children || [] });
    }
    setIsEditMode(false);
  };

  const handleSaveMember = async () => {
    if (!selectedMember) return;

    try {
      // Preserve profile_photo_url from selectedMember to prevent overwriting
      const { organization_name, ...memberDataWithoutOrgName } = editedMember;

      const memberDataToSave = {
        ...memberDataWithoutOrgName,
        id: selectedMember.id, // Ensure ID is included
        profile_photo_url: selectedMember.profile_photo_url
      };

      const response = await supabaseApiService.members.update(memberDataToSave);
      
      // 수정된 필드들 확인
      const updatedFields = Object.keys(editedMember).filter(key => 
        editedMember[key as keyof Member] !== selectedMember[key as keyof Member]
      );
      
      // 교인 정보 수정 로그 기록
      activityLogger.logMemberUpdate(selectedMember.id, selectedMember.name, updatedFields);
      
      // Update member in list
      setAllMembers(allMembers.map(m =>
        m.id === selectedMember.id
          ? { ...m, ...response.data }
          : m
      ));
      
      setSelectedMember({ ...selectedMember, ...response.data });
      setIsEditMode(false);
      alert('교인 정보가 수정되었습니다.');
    } catch (error: any) {
      console.error('교인 정보 수정 실패:', error);
      const errorMessage = error.response?.data?.detail || '교인 정보 수정에 실패했습니다.';
      alert(`수정 실패: ${errorMessage}`);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      await supabaseApiService.members.delete(selectedMember.id);
      
      // 교인 삭제 로그 기록
      activityLogger.logMemberDelete(selectedMember.id, selectedMember.name);
      
      // Remove member from list
      setAllMembers(allMembers.filter(m => m.id !== selectedMember.id));
      setShowDetailModal(false);
      setShowDeleteConfirm(false);
      setSelectedMember(null);
      alert('교인 정보가 삭제되었습니다.');
    } catch (error: any) {
      console.error('교인 삭제 실패:', error);
      const errorMessage = error.response?.data?.detail || '교인 삭제에 실패했습니다.';
      alert(`삭제 실패: ${errorMessage}`);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  // 일괄 초대 발송 함수
  const handleBulkInvitation = async () => {
    if (selectedMembers.size === 0) {
      alert('초대할 교인을 선택해주세요.');
      return;
    }

    const selectedMembersList = members.filter(m => selectedMembers.has(m.id));
    const membersWithoutEmail = selectedMembersList.filter(m => !m.email);

    if (membersWithoutEmail.length > 0) {
      const memberNames = membersWithoutEmail.map(m => m.name).join(', ');
      if (!window.confirm(`이메일이 없는 교인이 있습니다: ${memberNames}\n\n나머지 교인들에게만 초대를 발송하시겠습니까?`)) {
        return;
      }
    }

    const validMembers = selectedMembersList.filter(m => m.email && m.invitation_status !== 'active');

    const alreadyActiveMembers = selectedMembersList.filter(m => m.invitation_status === 'active');
    if (alreadyActiveMembers.length > 0) {
      const activeNames = alreadyActiveMembers.map(m => m.name).join(', ');
      alert(`이미 활성화된 회원은 제외됩니다: ${activeNames}`);
    }

    if (validMembers.length === 0) {
      alert('이메일이 등록된 교인이 없습니다.');
      return;
    }

    if (!window.confirm(`선택한 ${validMembers.length}명의 교인에게 앱 초대 이메일을 발송하시겠습니까?`)) {
      return;
    }

    try {
      setIsBulkInviting(true);

      // 진행 상황 초기화 (모두 pending 상태로)
      const initialProgress: InviteProgressItem[] = validMembers.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email!,
        status: 'pending' as const
      }));
      setBulkInviteProgress(initialProgress);
      setShowBulkInviteProgress(true);

      let successCount = 0;
      let failCount = 0;
      const results: Array<{ name: string; email: string; temporaryPassword: string; success: boolean }> = [];

      for (let i = 0; i < validMembers.length; i++) {
        const member = validMembers[i];

        // 현재 교인을 processing 상태로 변경
        setBulkInviteProgress(prev =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'processing' as const } : item
          )
        );

        try {
          const result = await supabaseApiService.smsInvitation.send(
            member.id,
            member.phone || '',
            member.name || member.email!,
            member.email!,
            '요람교회'
          );

          if (result.success) {
            successCount++;
            results.push({
              name: member.name,
              email: member.email!,
              temporaryPassword: result.temporaryPassword || '이메일 확인',
              success: true
            });

            // 성공 상태로 업데이트
            setBulkInviteProgress(prev =>
              prev.map((item, idx) =>
                idx === i ? {
                  ...item,
                  status: 'success' as const,
                  temporaryPassword: result.temporaryPassword || '이메일 확인'
                } : item
              )
            );
          } else {
            failCount++;
            results.push({
              name: member.name,
              email: member.email!,
              temporaryPassword: '',
              success: false
            });

            // 실패 상태로 업데이트
            setBulkInviteProgress(prev =>
              prev.map((item, idx) =>
                idx === i ? {
                  ...item,
                  status: 'failed' as const,
                  errorMessage: '초대 발송 실패'
                } : item
              )
            );
          }
        } catch (error: any) {
          failCount++;
          results.push({
            name: member.name,
            email: member.email!,
            temporaryPassword: '',
            success: false
          });

          // 실패 상태로 업데이트
          setBulkInviteProgress(prev =>
            prev.map((item, idx) =>
              idx === i ? {
                ...item,
                status: 'failed' as const,
                errorMessage: error.message || '초대 발송 실패'
              } : item
            )
          );
        }
      }

      // 모든 처리 완료 후 1.5초 대기 (사용자가 결과를 확인할 시간)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 진행 모달 닫고 결과 모달 표시
      setShowBulkInviteProgress(false);
      setBulkInviteResults(results);
      setShowBulkInviteResults(true);

      // 선택 초기화 및 목록 새로고침
      setSelectedMembers(new Set());
      fetchMembers();
    } catch (error) {
      console.error('대량 초대 발송 실패:', error);
      alert('초대 발송 중 오류가 발생했습니다.');
      setShowBulkInviteProgress(false);
    } finally {
      setIsBulkInviting(false);
    }
  };

  const handleToggleMemberSelection = (memberId: number) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedMembers(newSelection);
  };

  const handleToggleAllMembers = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map(m => m.id)));
    }
  };

  // 일괄 삭제 함수
  const handleBulkDelete = async () => {
    if (selectedMembers.size === 0) {
      alert('삭제할 교인을 선택해주세요.');
      return;
    }

    const selectedMembersList = members.filter(m => selectedMembers.has(m.id));
    const memberNames = selectedMembersList.map(m => m.name).join(', ');

    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setIsBulkDeleting(true);
      setShowBulkDeleteConfirm(false);

      const selectedMembersList = members.filter(m => selectedMembers.has(m.id));
      let successCount = 0;
      let failCount = 0;
      const failedMembers: string[] = [];

      for (const member of selectedMembersList) {
        try {
          await supabaseApiService.members.delete(member.id);
          successCount++;
        } catch (error) {
          console.error(`교인 삭제 실패 (${member.name}):`, error);
          failCount++;
          failedMembers.push(member.name);
        }
      }

      // 결과 알림
      if (failCount === 0) {
        alert(`${successCount}명의 교인이 완전히 삭제되었습니다.`);
      } else {
        alert(`${successCount}명 삭제 성공, ${failCount}명 실패\n\n실패한 교인: ${failedMembers.join(', ')}`);
      }

      // 선택 초기화 및 목록 새로고침
      setSelectedMembers(new Set());
      fetchMembers();
    } catch (error) {
      console.error('일괄 삭제 실패:', error);
      alert('교인 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // 초대 메시지 생성 함수
  const generateInviteMessage = (name: string, email: string, temporaryPassword: string) => {
    const appUrl = process.env.REACT_APP_PRODUCTION_URL || 'https://churchround.com';
    return `[Church Round 교인 초대]

${name}님, 안녕하세요!
Church Round 앱에 초대되셨습니다.

앱 다운로드:
- iOS: App Store에서 "Church Round" 검색
- Android: Google Play에서 "Church Round" 검색

로그인 정보:
- 이메일: ${email}
- 임시 비밀번호: ${temporaryPassword}

첫 로그인 후 반드시 비밀번호를 변경해주세요.

앱 다운로드 링크: ${appUrl}/download

문의사항이 있으시면 담당자에게 연락주세요.`;
  };

  // 클립보드 복사 함수
  const handleCopyMessage = async () => {
    const message = generateInviteMessage(inviteMessageData.name, inviteMessageData.email, inviteMessageData.temporaryPassword);
    try {
      await navigator.clipboard.writeText(message);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
      alert('메시지 복사에 실패했습니다.');
    }
  };

  // 일괄 초대 메시지 생성 함수
  const generateBulkInviteMessages = () => {
    const successResults = bulkInviteResults.filter(r => r.success);
    return successResults.map(result =>
      generateInviteMessage(result.name, result.email, result.temporaryPassword)
    ).join('\n\n' + '='.repeat(50) + '\n\n');
  };

  // 일괄 초대 메시지 복사 함수
  const handleCopyBulkMessages = async () => {
    const messages = generateBulkInviteMessages();
    try {
      await navigator.clipboard.writeText(messages);
      setBulkCopySuccess(true);
      setTimeout(() => setBulkCopySuccess(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
      alert('메시지 복사에 실패했습니다.');
    }
  };

  const handleSendInvitation = async (member: Member) => {
    if (member.invitation_status === 'active') {
      alert('이미 활성화된 회원입니다. 초대를 다시 발송할 수 없습니다.');
      return;
    }

    if (!member.email) {
      alert('이메일이 등록되지 않은 교인입니다.');
      return;
    }

    const inviteMessage = `${member.name}님에게 앱 초대 이메일을 발송하시겠습니까?\n이메일: ${member.email}`;

    if (!window.confirm(inviteMessage)) {
      return;
    }

    try {
      setSmsLoading(member.id);

      // 이메일 초대 발송 (전화번호는 필수가 아니므로 빈 문자열로 전달)
      const result = await supabaseApiService.smsInvitation.send(
        member.id,
        member.phone || '', // 전화번호가 없어도 진행
        member.name || member.email, // 이름이 있으면 이름, 없으면 이메일을 username으로 사용
        member.email, // 이메일 주소
        '요람교회' // 교회명
      );

      if (result.success) {
        // 기존 사용자인 경우 경고 표시
        if (result.isExistingUser) {
          alert(`⚠️ 기존 사용자 계정과 연결되었습니다.\n\n${member.name}님은 이미 앱에 가입되어 있습니다.\n기존 비밀번호로 로그인할 수 있습니다.\n\n※ 임시 비밀번호 이메일과 SMS가 발송되지 않았습니다.`);
        } else {
          // 신규 사용자인 경우 초대 메시지 표시
          setInviteMessageData({
            email: member.email,
            name: member.name,
            temporaryPassword: result.temporaryPassword || '이메일을 확인해주세요'
          });
          setShowInviteMessage(true);
        }
        // 교인 목록 새로고침
        fetchMembers();
      }

    } catch (error: any) {
      console.error('초대 발송 실패:', error);
      alert(`초대 발송에 실패했습니다.\n오류: ${error.message}`);
    } finally {
      setSmsLoading(null);
    }
  };

  // 관리자 지정 함수
  const handleAssignAdminRole = async (member: Member) => {
    if (!currentUser) {
      alert('사용자 정보를 가져올 수 없습니다.');
      return;
    }

    // Church Super Admin 권한 확인
    if (!isChurchSuperAdmin(currentUser) && !isSuperAdmin(currentUser)) {
      alert('관리자 지정 권한이 없습니다.');
      return;
    }

    const confirmMessage = `${member.name}님을 교회 관리자로 지정하시겠습니까?\n\n이 작업은 해당 교인에게 관리자 페이지 접근 권한을 부여합니다.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setShowRoleModal(true);
  };

  // 역할 변경 처리 함수
  const handleRoleChange = async (newRole: string) => {
    if (!selectedMember || !currentUser) return;

    try {
      setRoleChangeLoading(true);

      // 이메일을 통해 users 테이블에서 역할 변경 (members 테이블 ID와 users 테이블 ID가 다르기 때문)
      if (!selectedMember.email) {
        throw new Error('이메일이 등록되지 않은 교인은 관리자로 지정할 수 없습니다.');
      }
      await supabaseApiService.users.updateRoleByEmail(selectedMember.email, newRole);

      // 성공적으로 변경됨을 알림
      alert(`${selectedMember.name}님의 역할이 ${getRoleDisplayName(newRole)}(으)로 성공적으로 변경되었습니다.`);

      setShowRoleModal(false);
      // fetchMembers(); // 목록 새로고침
    } catch (error: any) {
      console.error('역할 변경 실패:', error);
      alert(`역할 변경에 실패했습니다.\n오류: ${error.message}`);
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const downloadExcelTemplate = () => {
    // 엑셀 헤더 정의 (사용자가 입력 가능한 필드만)
    const headers = [
      '이름',
      '영문명',
      '이메일',
      '성별',
      '생년월일',
      '생년월일 구분',
      '전화번호',
      '주소',
      '직분대분류',
      '직분세부',
      '구역',
      '결혼상태',
      '배우자이름',
      '결혼일',
      '직업분류',
      '직업상세',
      '직책',
      '직함',
      '직장명',
      '직장전화번호',
      '부서',
      '직분코드',
      '임명일',
      '안수교회',
      '사역시작일',
      '인근교회',
      '직분결정',
      '일상활동'
    ];

    // 샘플 데이터 (사용자가 참고할 수 있도록)
    const sampleData = [
      '홍길동',
      'Hong Gil Dong',
      'hong@example.com',
      '남',
      '1990-01-01',  // 또는 19900101, 900101 등 다양한 날짜 형식 가능
      '양력',  // 양력 또는 음력
      '010-1234-5678',
      '서울시 강남구',
      '집사',  // 한글 직분 입력 가능 (직분 목록은 "직분 목록" 시트 참조)
      '집사',  // 한글 세부 직분 입력 가능
      '1구역',
      '기혼',
      '김영희',
      '2015-05-20',
      '회사원',
      'IT 개발자',
      '팀장',
      '부장',
      '삼성전자',
      '02-1234-5678',
      '예배부',
      'DEACON',
      '2020-01-01',
      '중앙교회',
      '2018-03-01',
      '',
      '',
      ''
    ];

    // 워크시트 생성
    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleData]);

    // 열 너비 설정
    const columnWidths = headers.map(() => ({ wch: 15 }));
    worksheet['!cols'] = columnWidths;

    // 직분 목록 시트 생성
    const positionHeaders = ['직분 대분류', '직분 세부', '설명'];
    const positionData: any[] = [positionHeaders];

    // 직분 대분류와 세부 목록 추가
    positionData.push(['성도', '', '일반 성도 (기본값)']);
    positionData.push(['교역자', '담임목사', '']);
    positionData.push(['교역자', '원로목사', '']);
    positionData.push(['교역자', '부목사', '']);
    positionData.push(['교역자', '협동목사', '']);
    positionData.push(['교역자', '전도사', '']);
    positionData.push(['교역자', '전임전도사', '']);
    positionData.push(['교역자', '교육담당전도사', '']);
    positionData.push(['장로', '시무장로', '']);
    positionData.push(['장로', '원로장로', '']);
    positionData.push(['장로', '이명은퇴장로', '']);
    positionData.push(['권사', '시무권사', '']);
    positionData.push(['권사', '명예권사', '']);
    positionData.push(['집사', '집사', '안수집사가 아닌 일반 집사']);
    positionData.push(['집사', '안수집사', '']);
    positionData.push(['집사', '서리집사', '']);
    positionData.push(['집사', '명예집사', '']);
    positionData.push(['교회학교', '영아부', '']);
    positionData.push(['교회학교', '유치부', '']);
    positionData.push(['교회학교', '유년부', '']);
    positionData.push(['교회학교', '초등부', '']);
    positionData.push(['교회학교', '소년부', '']);
    positionData.push(['교회학교', '중등부', '']);
    positionData.push(['교회학교', '고등부', '']);
    positionData.push(['교회학교', '청년부', '']);
    positionData.push(['', '', '']);
    positionData.push(['주의사항:', '', '']);
    positionData.push(['1. 위 표에 나열된 직분만 입력 가능합니다.', '', '']);
    positionData.push(['2. 한글로 정확히 입력하세요 (예: 집사, 시무장로)', '', '']);
    positionData.push(['3. 직분대분류만 입력하면 세부는 비워두셔도 됩니다.', '', '']);

    const positionSheet = XLSX.utils.aoa_to_sheet(positionData);
    positionSheet['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 40 }];

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '교인정보');
    XLSX.utils.book_append_sheet(workbook, positionSheet, '직분 목록');

    // 엑셀 파일 다운로드
    XLSX.writeFile(workbook, '교인정보_엑셀템플릿.xlsx');
  };

  const downloadMembersExcel = () => {
    if (filteredAndSortedMembers.length === 0) {
      alert('다운로드할 교인 데이터가 없습니다.');
      return;
    }

    // 엑셀 헤더 정의
    const headers = [
      '이름',
      '영문명',
      '이메일',
      '성별',
      '생년월일',
      '생년월일 구분',
      '전화번호',
      '주소',
      '직분대분류',
      '직분세부',
      '구역',
      '교인상태',
      '등록일',
      '결혼상태',
      '배우자이름',
      '결혼일',
      '직업분류',
      '직업상세',
      '직책',
      '직함',
      '직장명',
      '직장전화번호',
      '부서',
      '직분코드',
      '임명일',
      '안수교회',
      '사역시작일',
      '인근교회',
      '직분결정',
      '일상활동'
    ];

    // 교인 데이터를 엑셀 행으로 변환 (필터링/정렬된 전체 데이터)
    const data = filteredAndSortedMembers.map(member => [
      member.name || '',
      member.name_eng || '',
      member.email || '',
      member.gender || '',
      member.birthdate || '',
      member.birthdate_type || '양력',
      member.phone || '',
      member.address || '',
      member.position_main || '',  // 직분 대분류
      member.position_detail || '',  // 직분 세부
      member.organization_name || '',
      member.member_status || '',
      member.registration_date || '',
      member.marital_status || '',
      member.spouse_name || '',
      member.married_on || '',
      member.job_category || '',
      member.job_detail || '',
      member.job_position || '',
      member.job_title || '',
      member.workplace || '',
      member.workplace_phone || '',
      member.department || '',
      member.position_code || '',
      member.appointed_on || '',
      member.ordination_church || '',
      member.ministry_start_date || '',
      member.neighboring_church || '',
      member.position_decision || '',
      member.daily_activity || ''
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
    XLSX.utils.book_append_sheet(workbook, worksheet, '교인목록');

    // 파일명 생성 (현재 날짜 포함)
    const today = new Date();
    const dateString = today.toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `교인목록_${dateString}.xlsx`;

    // 엑셀 파일 다운로드
    XLSX.writeFile(workbook, fileName);
  };

  // 엑셀 시리얼 날짜를 YYYY-MM-DD로 변환
  const excelSerialToDate = (serial: number): string | null => {
    // 엑셀 시리얼 번호 범위 검증 (1900-01-01 ~ 2100-12-31 대략)
    if (serial < 1 || serial > 73050) {
      return null;
    }

    // 엑셀은 1900년 1월 1일을 1로 시작 (단, 1900년은 윤년이 아닌데 엑셀은 윤년으로 처리하는 버그가 있음)
    const excelEpoch = new Date(1899, 11, 30); // 1899-12-30
    const date = new Date(excelEpoch.getTime() + serial * 86400 * 1000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // 날짜 형식 자동 변환 함수
  const parseDateField = (dateInput: string | number | null | undefined): string | null => {
    if (!dateInput) {
      return null;
    }

    // 숫자인 경우 엑셀 시리얼 날짜로 간주
    if (typeof dateInput === 'number') {
      return excelSerialToDate(dateInput);
    }

    if (typeof dateInput !== 'string' || !dateInput.trim()) {
      return null;
    }

    const cleanInput = dateInput.trim().replace(/\s/g, '');

    // 알파벳이나 특수문자가 포함된 경우 (숫자, -, /, . 제외)
    if (/[^0-9\-\/.]/.test(cleanInput)) {
      console.warn(`날짜 형식이 올바르지 않습니다: "${dateInput}"`);
      return null;
    }

    // 이미 YYYY-MM-DD 형식인 경우
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanInput)) {
      return cleanInput;
    }

    // YYYY/MM/DD 형식
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(cleanInput)) {
      return cleanInput.replace(/\//g, '-');
    }

    // YYYY.MM.DD 형식
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(cleanInput)) {
      return cleanInput.replace(/\./g, '-');
    }

    // YYYYMMDD 형식 (8자리)
    if (/^\d{8}$/.test(cleanInput)) {
      const year = cleanInput.substring(0, 4);
      const month = cleanInput.substring(4, 6);
      const day = cleanInput.substring(6, 8);
      return `${year}-${month}-${day}`;
    }

    // YYMMDD 형식 (6자리) - 가장 많이 사용되는 케이스
    if (/^\d{6}$/.test(cleanInput)) {
      let year = parseInt(cleanInput.substring(0, 2));
      const month = cleanInput.substring(2, 4);
      const day = cleanInput.substring(4, 6);

      // 월/일 유효성 검증
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
        console.warn(`날짜 값이 올바르지 않습니다: "${dateInput}" (월: ${month}, 일: ${day})`);
        return null;
      }

      // 2000년대 or 1900년대 판단 (50년 기준)
      if (year <= 50) {
        year += 2000;
      } else {
        year += 1900;
      }

      return `${year}-${month}-${day}`;
    }

    // YY-MM-DD, YY/MM/DD, YY.MM.DD 형식
    const yyPattern = /^(\d{2})[-\/.](\d{2})[-\/.](\d{2})$/;
    const yyMatch = cleanInput.match(yyPattern);
    if (yyMatch) {
      let year = parseInt(yyMatch[1]);
      const month = yyMatch[2];
      const day = yyMatch[3];

      if (year <= 50) {
        year += 2000;
      } else {
        year += 1900;
      }

      return `${year}-${month}-${day}`;
    }

    // YYYY-M-D 형식 (월/일이 한 자리)
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleanInput)) {
      const parts = cleanInput.split('-');
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    console.warn(`날짜 형식을 인식할 수 없습니다: "${dateInput}"`);
    return null;
  };

  const handleExcelPreview = async () => {
    if (!excelFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    setIsPreviewLoading(true);

    try {
      // 엑셀 파일 읽기
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // 첫 번째 시트 읽기
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // JSON으로 변환 (헤더 포함)
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',  // 빈 셀을 빈 문자열로 처리 (컬럼 밀림 방지)
        raw: true    // 날짜를 숫자(엑셀 시리얼)로 읽음
      });

      if (jsonData.length < 2) {
        alert('엑셀 파일에 데이터가 없습니다.');
        setIsPreviewLoading(false);
        return;
      }

      // 헤더와 데이터 분리
      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);

      // 헤더 인덱스 매핑
      const headerMap: { [key: string]: number } = {};
      headers.forEach((header: string, index: number) => {
        headerMap[header] = index;
      });

      // 날짜 필드 목록
      const dateFields = ['생년월일', '등록일', '결혼일', '임명일', '사역시작일'];

      // 각 행 검증
      const validatedRows = dataRows.map((row: any[], index: number) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 필수 필드 검증
        if (!row[headerMap['이름']] || !String(row[headerMap['이름']]).trim()) {
          errors.push('이름은 필수입니다');
        }
        // 전화번호와 이메일은 선택사항

        // 날짜 필드 검증
        dateFields.forEach(fieldName => {
          if (headerMap[fieldName] !== undefined) {
            const value = row[headerMap[fieldName]];
            // 숫자 또는 비어있지 않은 문자열인 경우만 검증
            const hasValue = typeof value === 'number' || (typeof value === 'string' && value.trim());
            if (hasValue) {
              const parsed = parseDateField(value); // 숫자 그대로 전달 (String() 제거)
              if (parsed === null) {
                const displayValue = typeof value === 'number' ? value : String(value).trim();
                // 숫자는 항상 엑셀 시리얼로 처리되므로, 문자열만 검증
                if (typeof value === 'string') {
                  const cleanValue = value.trim();
                  if (/[^0-9\-\/.]/.test(cleanValue)) {
                    errors.push(`${fieldName}: "${displayValue}" - 잘못된 형식 (문자/특수기호 포함)`);
                  } else {
                    errors.push(`${fieldName}: "${displayValue}" - 인식할 수 없는 날짜 형식`);
                  }
                } else {
                  errors.push(`${fieldName}: "${displayValue}" - 엑셀 날짜 변환 실패`);
                }
              } else {
                const originalValue = typeof value === 'number' ? value : value.trim();
                if (parsed !== String(originalValue)) {
                  warnings.push(`${fieldName}: "${value}" → "${parsed}" 자동 변환됨`);
                }
              }
            }
          }
        });

        // 직분 대분류 검증
        if (headerMap['직분대분류'] !== undefined) {
          const positionMain = row[headerMap['직분대분류']];
          if (positionMain && String(positionMain).trim()) {
            const positionMainStr = String(positionMain).trim();
            if (!isValidPositionMain(positionMainStr)) {
              const validOptions = Object.values(POSITION_MAIN_LABELS).join(', ');
              errors.push(`직분대분류: "${positionMainStr}" - 인식할 수 없는 직분 (허용: ${validOptions})`);
            } else {
              // 한글로 입력된 경우 변환될 것임을 알림
              const normalized = normalizePositionMain(positionMainStr);
              if (normalized && positionMainStr !== normalized) {
                warnings.push(`직분대분류: "${positionMainStr}" → "${normalized}" 자동 변환됨`);
              }
            }
          }
        }

        // 직분 세부 검증
        if (headerMap['직분세부'] !== undefined) {
          const positionDetail = row[headerMap['직분세부']];
          if (positionDetail && String(positionDetail).trim()) {
            const positionDetailStr = String(positionDetail).trim();
            if (!isValidPositionDetail(positionDetailStr)) {
              errors.push(`직분세부: "${positionDetailStr}" - 인식할 수 없는 직분`);
            } else {
              // 한글로 입력된 경우 변환될 것임을 알림
              const normalized = normalizePositionDetail(positionDetailStr);
              if (normalized && positionDetailStr !== normalized) {
                warnings.push(`직분세부: "${positionDetailStr}" → "${normalized}" 자동 변환됨`);
              }
            }
          }
        }

        return {
          rowNumber: index + 2, // 엑셀 행 번호 (헤더 1 + 데이터)
          data: row,
          errors,
          warnings,
          isValid: errors.length === 0
        };
      });

      // 검증 결과 저장
      setValidationResults(validatedRows);

      // 미리보기 데이터 저장 (날짜 필드 변환)
      const dateFieldNames = ['생년월일', '등록일', '결혼일', '임명일', '사역시작일'];
      const dateFieldIndices = dateFieldNames
        .map(name => headerMap[name])
        .filter(idx => idx !== undefined);

      const transformedDataRows = dataRows.map((row: any[]) => {
        const newRow = [...row];
        dateFieldIndices.forEach(idx => {
          const value = row[idx];
          if (value !== undefined && value !== null && value !== '') {
            const parsed = parseDateField(value);
            if (parsed) {
              newRow[idx] = parsed; // 변환된 날짜로 교체
            }
          }
        });
        return newRow;
      });

      setExcelPreviewData([headers, ...transformedDataRows]);
    } catch (error: any) {
      console.error('파일 검증 실패:', error);
      alert(`파일을 읽는 중 오류가 발생했습니다.\n오류: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleExcelImport = async () => {
    if (!excelFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    if (!currentUser?.church_id) {
      alert('교회 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      return;
    }

    setIsImporting(true);

    try {
      // 엑셀 파일 읽기
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // 첫 번째 시트 읽기
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // JSON으로 변환 (헤더 포함)
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',  // 빈 셀을 빈 문자열로 처리 (컬럼 밀림 방지)
        raw: true    // 날짜를 숫자(엑셀 시리얼)로 읽음
      });

      if (jsonData.length < 2) {
        alert('엑셀 파일에 데이터가 없습니다.');
        return;
      }

      // 헤더와 데이터 분리
      const headers = jsonData[0];
      const rows = jsonData.slice(1);

      // 헤더 인덱스 매핑
      const headerMap: { [key: string]: number } = {};
      headers.forEach((header: string, index: number) => {
        headerMap[header] = index;
      });

      // 필수 헤더 확인
      const requiredHeaders = ['이름'];
      const missingHeaders = requiredHeaders.filter(h => !(h in headerMap));

      if (missingHeaders.length > 0) {
        alert(`필수 컬럼이 누락되었습니다: ${missingHeaders.join(', ')}\n엑셀 템플릿을 다운로드하여 양식을 확인해주세요.`);
        return;
      }

      // 교인 데이터 변환
      const membersToImport = rows
        .filter((row: any[]) => row[headerMap['이름']]) // 이름만 필수
        .map((row: any[]) => ({
          name: row[headerMap['이름']] || '',
          name_eng: row[headerMap['영문명']] || null,
          email: row[headerMap['이메일']] || '',
          gender: row[headerMap['성별']] || '',
          birthdate: parseDateField(row[headerMap['생년월일']]),
          birthdate_type: row[headerMap['생년월일 구분']] || '양력',
          phone: row[headerMap['전화번호']] || '',
          address: row[headerMap['주소']] || null,
          position_main: normalizePositionMain(row[headerMap['직분대분류']]),  // 한글 → 영문 코드 자동 변환
          position_detail: normalizePositionDetail(row[headerMap['직분세부']]),  // 한글 → 영문 코드 자동 변환
          organization_name: row[headerMap['구역']] || null,
          church_id: currentUser.church_id,
          member_status: row[headerMap['교인상태']] || 'active',
          registration_date: parseDateField(row[headerMap['등록일']]),
          marital_status: row[headerMap['결혼상태']] || null,
          spouse_name: row[headerMap['배우자이름']] || null,
          married_on: parseDateField(row[headerMap['결혼일']]),
          job_category: row[headerMap['직업분류']] || null,
          job_detail: row[headerMap['직업상세']] || null,
          job_position: row[headerMap['직책']] || null,
          job_title: row[headerMap['직함']] || null,
          workplace: row[headerMap['직장명']] || null,
          workplace_phone: row[headerMap['직장전화번호']] || null,
          department: row[headerMap['부서']] || null,
          position_code: row[headerMap['직분코드']] || null,
          appointed_on: parseDateField(row[headerMap['임명일']]),
          ordination_church: row[headerMap['안수교회']] || null,
          ministry_start_date: parseDateField(row[headerMap['사역시작일']]),
          neighboring_church: row[headerMap['인근교회']] || null,
          position_decision: row[headerMap['직분결정']] || null,
          daily_activity: row[headerMap['일상활동']] || null,
        }));

      if (membersToImport.length === 0) {
        alert('등록할 유효한 교인 데이터가 없습니다.');
        return;
      }

      // 진행 상황 표시
      const confirmMessage = `총 ${membersToImport.length}명의 교인을 등록하시겠습니까?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }

      // 교인 일괄 등록 (Supabase Edge Function 사용)
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < membersToImport.length; i++) {
        try {
          await supabaseApiService.members.create(membersToImport[i]);
          successCount++;
        } catch (error: any) {
          failCount++;
          const memberName = membersToImport[i].name;
          errors.push(`${memberName}: ${error.message || '등록 실패'}`);
          console.error(`교인 등록 실패 (${memberName}):`, error);
        }
      }

      // 결과 표시
      let resultMessage = `등록 완료:\n성공: ${successCount}명\n실패: ${failCount}명`;

      if (errors.length > 0 && errors.length <= 10) {
        resultMessage += '\n\n실패 상세:\n' + errors.join('\n');
      } else if (errors.length > 10) {
        resultMessage += '\n\n실패 상세 (처음 10개):\n' + errors.slice(0, 10).join('\n');
        resultMessage += `\n... 외 ${errors.length - 10}건`;
      }

      alert(resultMessage);

      if (successCount > 0) {
        setShowExcelImportModal(false);
        setExcelFile(null);
        fetchMembers(); // 목록 새로고침
      }
    } catch (error: any) {
      console.error('엑셀 등록 실패:', error);
      alert(`엑셀 파일 처리 중 오류가 발생했습니다.\n오류: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활동';
      case 'inactive': return '비활동';
      case 'transferred': return '이전';
      case null:
      case undefined:
      case '': return '활동';  // null/undefined는 기본적으로 활동으로 처리
      default: return status;
    }
  };

  const getInvitationStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'sent': return '발송완료';
      case 'failed': return '발송실패';
      case 'active': return '등록완료';
      case null:
      case undefined:
      case '': return '미발송';
      default: return status;
    }
  };

  const getInvitationStatusBadgeVariant = (status: string): 'default' | 'success' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'sent': return 'success';
      case 'failed': return 'destructive';
      case 'pending': return 'secondary';
      case 'active': return 'default';
      default: return 'default';
    }
  };

  // Clean photo URL - handle both relative and absolute URLs
  const cleanPhotoUrl = React.useCallback((url: string | null) => {
    if (!url) return null;
    // Remove trailing '?' if present
    const cleanedUrl = url.endsWith('?') ? url.slice(0, -1) : url;

    // If it's already a full URL (starts with http:// or https://), return as-is
    if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
      return cleanedUrl;
    }

    // Otherwise, prepend the API base URL
    return `${process.env.REACT_APP_API_URL}${cleanedUrl}`;
  }, []);

  // 탑바 부제 설정 (Hook은 early return 전에 호출해야 함)
  // 전체 N명 표시 (시안 매핑 — 새가족 카운트는 별도 데이터 필요)
  usePageSubtitle(pagination.total_count > 0 ? `전체 ${pagination.total_count.toLocaleString()}명` : undefined);

  // 탑바 우측 액션: 엑셀 다운 / 엑셀 등록 / 교인 등록 (시안 매핑)
  // 선택된 교인이 있을 때만 bulk 액션 추가 노출
  usePageActions(
    <>
      {selectedMembers.size > 0 && (
        <>
          <Badge variant="info">{selectedMembers.size}명 선택</Badge>
          <Button
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            variant="destructive-soft"
            size="sm"
            className="gap-2"
          >
            {isBulkDeleting ? <Spinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
            삭제
          </Button>
          <Button
            onClick={handleBulkInvitation}
            disabled={isBulkInviting}
            variant="success-soft"
            size="sm"
            className="gap-2"
          >
            {isBulkInviting ? <Spinner size="sm" /> : <Send className="h-3.5 w-3.5" />}
            앱 초대
          </Button>
          <div className="mx-1 h-5 w-px bg-border" />
        </>
      )}
      <Button
        onClick={downloadMembersExcel}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="h-3.5 w-3.5" />
        엑셀 다운
      </Button>
      {canCreateMember && (
        <>
          <Button
            onClick={() => setShowExcelImportModal(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Upload className="h-3.5 w-3.5" />
            엑셀 등록
          </Button>
          <Button
            onClick={() => navigate('/member-management/add')}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            교인 등록
          </Button>
        </>
      )}
    </>,
    [selectedMembers.size, isBulkDeleting, isBulkInviting, canCreateMember]
  );

  return (
    <PageContainer>
      {/* === 검색·필터 + 테이블을 한 카드로 통합 — 시안 매핑 === */}
      <Card className="overflow-hidden">
        {/* 검색 + 필터 바 (카드 헤더 자리) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF1F6] px-[16px] py-[14px]">
          <Input
            type="text"
            placeholder="이름, 전화번호로 검색"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (isAdvancedSearchActive) {
                setIsAdvancedSearchActive(false);
              }
            }}
            onKeyPress={handleKeyPress}
            className="w-full md:w-[320px]"
            disabled={isAdvancedSearchActive}
          />

          {/* 상세검색 — 검색바 우측에 바로 배치 */}
          <div
            className={cn(
              "inline-flex h-[38px] items-center gap-2 rounded-[8px] border border-border bg-card px-3 text-[13px] text-[#334155] cursor-pointer transition-colors",
              isAdvancedSearchActive && "border-primary/40 text-primary"
            )}
          >
            <div
              onClick={() => setShowAdvancedSearch(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">상세검색</span>
            </div>
            {isAdvancedSearchActive && (
              <X
                className="w-4 h-4 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAdvancedSearchActive(false);
                  setAdvancedSearchData({
                    name: '',
                    email: '',
                    phone: '',
                    gender: 'all',
                    position_main: 'all',
                    position_detail: 'all',
                    organization_id: 'all',
                    age_group: 'all',
                    ageFrom: '',
                    ageTo: '',
                    marital_status: 'all',
                    job_category: 'all'
                  });
                  setPagination(prev => ({ ...prev, current_page: 1 }));
                }}
              />
            )}
          </div>

          {searchTerm && !isAdvancedSearchActive && (
            <Button
              onClick={handleClearSearch}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <X className="w-3.5 h-3.5" />
              초기화
            </Button>
          )}

          <div className="flex-1" />

          {/* 시안 매핑 필터 — 직분 / 구역 / 초대상태 */}
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="h-[38px] w-auto min-w-[120px] gap-2">
              <span className="text-[12.5px] text-muted-foreground">직분</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {ADMIN_POSITION_OPTIONS.map((opt) => (
                <SelectItem key={opt.mainValue} value={opt.mainValue}>
                  {opt.mainLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
            <SelectTrigger className="h-[38px] w-auto min-w-[120px] gap-2">
              <span className="text-[12.5px] text-muted-foreground">구역</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={String(org.id)}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-[38px] w-auto min-w-[140px] items-center justify-between gap-2 rounded-[8px] border border-border bg-card px-3 text-[13px] text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <span className="flex items-center gap-2">
                  <span className="text-[12.5px] text-muted-foreground">초대상태</span>
                  <span className="font-medium">
                    {invitationStatusFilter.length === 0
                      ? '전체'
                      : invitationStatusFilter.length === 1
                        ? getInvitationStatusText(invitationStatusFilter[0])
                        : `${invitationStatusFilter.length}개 선택`}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="end">
              {/* 옵션 리스트 */}
              <div className="py-1.5">
                {[
                  { value: 'pending', label: '대기중' },
                  { value: 'sent', label: '발송완료' },
                  { value: 'active', label: '등록완료' },
                  { value: 'failed', label: '발송실패' }
                ].map((option) => {
                  const checked = invitationStatusFilter.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      htmlFor={`status-${option.value}`}
                      className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-secondary"
                    >
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={checked}
                        onCheckedChange={(c) => {
                          if (c) {
                            setInvitationStatusFilter([...invitationStatusFilter, option.value]);
                          } else {
                            setInvitationStatusFilter(
                              invitationStatusFilter.filter((s) => s !== option.value)
                            );
                          }
                        }}
                      />
                      <span className="flex-1">{option.label}</span>
                    </label>
                  );
                })}
              </div>
              {/* 초기화 — 선택값 있을 때만 하단에 */}
              {invitationStatusFilter.length > 0 && (
                <div className="border-t border-border px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setInvitationStatusFilter([])}
                    className="text-[12px] font-semibold text-primary hover:underline"
                  >
                    선택 초기화
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* === 테이블 (같은 카드 안) === */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-[12.5px]">
            <thead className="bg-[#FAFBFD]">
              <tr>
                <th className="w-[44px] px-[18px] py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedMembers.size === members.length && members.length > 0}
                    onChange={handleToggleAllMembers}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </th>
                {/* 기존 컬럼: 이름 / 성별 / 전화번호 / 직분 대분류 / 직분 세부 / 조직 / 부서 / 초대상태 */}
                {[
                  { key: 'name', label: '이름' },
                  { key: 'gender', label: '성별' },
                  { key: 'phone', label: '전화번호' },
                  { key: 'position_main', label: '직분 대분류' },
                  { key: 'position_detail', label: '직분 세부' },
                  { key: 'organization_name', label: '조직' },
                  { key: 'department', label: '부서' },
                  { key: 'invitation_status', label: '초대상태' },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="cursor-pointer px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
                    onClick={() => handleSort(col.key as any)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortField === col.key && (
                        sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F4F9] bg-card">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-[18px] py-12">
                    <LoadingState text="교인 목록을 불러오는 중..." />
                  </td>
                </tr>
              )}
              {!loading && members.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-[#FAFBFD]">
                  <td className="px-[18px] py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(member.id)}
                      onChange={() => handleToggleMemberSelection(member.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                  </td>
                  {/* 이름 (아바타 + 한글명) */}
                  <td className="cursor-pointer px-[18px] py-3" onClick={() => handleMemberClick(member)}>
                    <div className="flex items-center gap-[11px]">
                      {(() => {
                        const photoUrl = cleanPhotoUrl(member.profile_photo_url);
                        return (
                          <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-[#EEF3FC] text-primary">
                            {photoUrl ? (
                              <img
                                className="h-full w-full object-cover"
                                src={photoUrl}
                                alt={member.name}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    fallback.classList.remove('hidden');
                                  }
                                }}
                              />
                            ) : null}
                            <div className={`flex h-full w-full items-center justify-center text-[13px] font-bold ${photoUrl ? 'hidden' : ''}`}>
                              {member.name?.charAt(0) || <User className="h-4 w-4" />}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="font-semibold text-foreground">{member.name}</div>
                    </div>
                  </td>
                  {/* 성별 */}
                  <td className="cursor-pointer px-[18px] py-3 text-foreground" onClick={() => handleMemberClick(member)}>
                    {getGenderText(member.gender)}
                  </td>
                  {/* 전화번호 */}
                  <td className="cursor-pointer px-[18px] py-3 text-foreground" onClick={() => handleMemberClick(member)}>
                    {member.phone || <span className="text-[#94A3B8]">-</span>}
                  </td>
                  {/* 직분 대분류 */}
                  <td className="cursor-pointer px-[18px] py-3 text-foreground" onClick={() => handleMemberClick(member)}>
                    {member.position_main
                      ? getPositionMainLabel(member.position_main)
                      : <span className="text-[#94A3B8]">-</span>}
                  </td>
                  {/* 직분 세부 */}
                  <td className="cursor-pointer px-[18px] py-3 text-foreground" onClick={() => handleMemberClick(member)}>
                    {getPositionDetailLabel(member.position_detail) || <span className="text-[#94A3B8]">-</span>}
                  </td>
                  {/* 조직 — 루트부터 최하위까지의 계층 경로 */}
                  <td className="cursor-pointer px-[18px] py-3 text-foreground" onClick={() => handleMemberClick(member)}>
                    {(() => {
                      const path = getOrgPath(member.organization_id);
                      if (path.length === 0) {
                        return member.organization_name
                          ? member.organization_name
                          : <span className="text-[#94A3B8]">-</span>;
                      }
                      return (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          {path.map((name, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && (
                                <ChevronRight className="h-3 w-3 flex-shrink-0 text-[#CBD5E1]" />
                              )}
                              <span className={i === path.length - 1 ? 'text-foreground' : 'text-[#94A3B8]'}>
                                {name}
                              </span>
                            </React.Fragment>
                          ))}
                        </span>
                      );
                    })()}
                  </td>
                  {/* 부서 */}
                  <td className="cursor-pointer px-[18px] py-3 text-foreground" onClick={() => handleMemberClick(member)}>
                    {member.department || <span className="text-[#94A3B8]">-</span>}
                  </td>
                  {/* 초대상태 */}
                  <td className="cursor-pointer px-[18px] py-3" onClick={() => handleMemberClick(member)}>
                    <Badge variant={getInvitationStatusBadgeVariant(member.invitation_status || '')}>
                      {getInvitationStatusText(member.invitation_status || '')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {members.length === 0 && !loading && (
        <div className="py-12 text-center">
          <p className="text-[13px] text-muted-foreground">등록된 교인이 없습니다.</p>
        </div>
      )}

      {/* Total Count and Pagination */}
      <div className="mt-4 flex items-center justify-between">
        {/* Total Count Display */}
        <div className="text-[12.5px] text-muted-foreground">
          전체 <b className="text-foreground">{pagination.total_count.toLocaleString()}</b>명
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          itemsPerPage={pagination.per_page}
          totalItems={pagination.total_count}
          onPageChange={(page) => {
            setPagination(prev => ({ ...prev, current_page: page }));
            fetchMembers();
          }}
          onItemsPerPageChange={(itemsPerPage) => {
            setPagination(prev => ({ ...prev, per_page: itemsPerPage, current_page: 1 }));
            fetchMembers();
          }}
        />
      </div>

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 교인 등록</DialogTitle>
            <DialogDescription>
              새 교인의 기본 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">이름 *</label>
              <Input
                type="text"
                required
                value={newMember.name}
                onChange={(e) => setNewMember({...newMember, name: e.target.value})}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">이메일</label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
              />
              <p className="text-xs text-gray-600 mt-1">이메일이 있는 경우 앱 초대 시 임시 비밀번호가 발송됩니다.</p>
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">성별</label>
              <Select value={newMember.gender} onValueChange={(value) => setNewMember({...newMember, gender: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="남">남</SelectItem>
                  <SelectItem value="여">여</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">생년월일</label>
              <DatePicker
                value={newMember.birthdate}
                onChange={(value) => setNewMember({...newMember, birthdate: value})}
                placeholder="예: 1985-01-25 또는 1985.01.25"
                disableFuture={true}
                fromYear={1920}
                toYear={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">생년월일 구분</label>
              <Select
                value={newMember.birthdate_type || '양력'}
                onValueChange={(value) => setNewMember({...newMember, birthdate_type: value})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="양력">양력</SelectItem>
                  <SelectItem value="음력">음력</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">전화번호</label>
              <Input
                type="tel"
                placeholder="010-1234-5678"
                value={newMember.phone}
                onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">주소</label>
              <Input
                type="text"
                value={newMember.address}
                onChange={(e) => setNewMember({...newMember, address: e.target.value})}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직분 대분류</label>
              <Input
                type="text"
                placeholder="교역자, 직분자, 평신도 등"
                value={newMember.position_main}
                onChange={(e) => setNewMember({...newMember, position_main: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                취소
              </Button>
              <Button type="submit">
                등록
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Management Modal */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedMember?.name}님 프로필 사진 관리
            </DialogTitle>
            <DialogDescription>
              프로필 사진을 업로드하거나 삭제할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMember && cleanPhotoUrl(selectedMember.profile_photo_url) && (
              <div className="text-center">
                <img
                  src={cleanPhotoUrl(selectedMember.profile_photo_url)!}
                  alt={selectedMember.name}
                  className="h-32 w-32 rounded-full object-cover mx-auto mb-2"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Modal image load error:', e);
                    alert('사진을 불러올 수 없습니다.');
                  }}
                />
                <Button
                  onClick={() => selectedMember && handleDeletePhoto(selectedMember.id)}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  현재 사진 삭제
                </Button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                새 사진 업로드
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
              <p className="text-xs text-gray-600 mt-1">
                JPG, PNG, GIF, WEBP 파일만 가능 (최대 5MB)
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setShowPhotoModal(false)}
                variant="outline"
              >
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password View Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {passwordInfo?.member_name}님 계정 정보
            </DialogTitle>
            <DialogDescription>
              교인의 로그인 정보를 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {passwordInfo && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900">이메일</label>
                  <p className="mt-1 text-sm text-gray-900">{passwordInfo.email}</p>
                </div>
                
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">비밀번호</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordInfo.password}
                      readOnly
                      className="flex-1 bg-gray-100"
                    />
                    <Button
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      size="icon"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>주의:</strong> 이 비밀번호는 교인의 개인정보입니다. 반드시 필요한 경우에만 확인하고, 타인에게 공유하지 마세요.
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  if (passwordInfo) {
                    navigator.clipboard.writeText(passwordInfo.password);
                    alert('비밀번호가 클립보드에 복사되었습니다.');
                  }
                }}
                variant="secondary"
              >
                복사
              </Button>
              <Button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInfo(null);
                  setShowPassword(false);
                }}
                variant="outline"
              >
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between mb-2">
              <DialogTitle className="flex items-center gap-2 flex-1">
                <User className="w-5 h-5" />
                {selectedMember?.name}님 상세정보
              </DialogTitle>
              <DialogDescription className="sr-only">
                교인의 상세 정보를 보고 수정할 수 있습니다.
              </DialogDescription>
            </div>
            <div className="flex justify-end gap-2 -mt-2 mb-4">
              {!isEditMode ? (
                <>
                  <Button
                    onClick={() => handleSendInvitation(selectedMember!)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={smsLoading === selectedMember?.id || !selectedMember?.phone || selectedMember?.invitation_status === 'active'}
                  >
                    {smsLoading === selectedMember?.id ? (
                      <Spinner size="sm" variant="white" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    앱 사용자 초대
                  </Button>

                  {/* 관리자 지정 버튼 - Church Super Admin에게만 표시 */}
                  {currentUser && (isChurchSuperAdmin(currentUser) || isSuperAdmin(currentUser)) && (
                    <Button
                      onClick={() => handleAssignAdminRole(selectedMember!)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={roleChangeLoading}
                    >
                      {roleChangeLoading ? (
                        <Spinner size="sm" variant="white" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                      관리자 지정
                    </Button>
                  )}

                  {canEditMember && (
                    <Button
                      onClick={() => navigate(`/member-management/edit/${selectedMember!.id}`, {
                        state: {
                          returnPage: pagination.current_page,
                          returnPerPage: pagination.per_page
                        }
                      })}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      수정
                    </Button>
                  )}
                  {canDeleteMember && (
                    <Button
                      onClick={handleDeleteClick}
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSaveMember}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    저장
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    취소
                  </Button>
                </>
              )}
            </div>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-5">
              {/* === Profile Band (시안 매핑: 사진 + 이름+영문 + 칩들 + 메타 한 줄) === */}
              <div className="flex items-center gap-[18px] rounded-[12px] border border-border bg-card p-[18px]">
                {/* 사진 (68px rounded-[16px]) */}
                <div className="relative flex-shrink-0">
                  {cleanPhotoUrl(selectedMember.profile_photo_url) ? (
                    <img
                      src={cleanPhotoUrl(selectedMember.profile_photo_url)!}
                      alt={selectedMember.name}
                      className="h-[68px] w-[68px] rounded-[16px] object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-[68px] w-[68px] items-center justify-center rounded-[16px] bg-[#EEF3FC] text-[27px] font-bold text-primary">
                      {selectedMember.name?.charAt(0) || <User className="h-10 w-10" />}
                    </div>
                  )}
                  {isEditMode && (
                    <div className="absolute -bottom-1.5 -right-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && selectedMember) {
                            handlePhotoUpload(file);
                          }
                        }}
                        className="hidden"
                        id="profile-photo-upload"
                      />
                      <label
                        htmlFor="profile-photo-upload"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </label>
                    </div>
                  )}
                </div>

                {/* 이름·영문명 + 칩들 + 메타 한 줄 */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-[10px] gap-y-1">
                    <span className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-foreground">
                      {selectedMember.name}
                    </span>
                    {selectedMember.name_eng && (
                      <span className="text-[13px] font-medium text-[#94A3B8]">
                        {selectedMember.name_eng}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {/* 직분 칩 (있을 때만) */}
                    {selectedMember.position_main && (
                      <span className="inline-flex items-center rounded-full bg-[#EEF3FC] px-[10px] py-[2px] text-[11.5px] font-bold text-primary whitespace-nowrap">
                        {getPositionMainLabel(selectedMember.position_main)}
                        {getPositionDetailLabel(selectedMember.position_detail) && ` · ${getPositionDetailLabel(selectedMember.position_detail)}`}
                      </span>
                    )}
                    {/* 상태 칩 */}
                    <Badge variant={getStatusBadgeVariant(selectedMember.member_status)}>
                      {getStatusText(selectedMember.member_status)}
                    </Badge>
                    {/* 구역·목장 + 등록일 메타 */}
                    <span className="text-[12.5px] text-muted-foreground whitespace-nowrap">
                      {[
                        selectedMember.organization_name,
                        selectedMember.department,
                        selectedMember.registration_date
                          ? `등록 ${new Date(selectedMember.registration_date).toLocaleDateString('ko-KR').replace(/\. /g, '.').replace(/\.$/, '')}`
                          : null
                      ].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </div>

                {/* 우측 빠른 액션 (전화/문자/메일) — 뷰 모드에서만 */}
                {!isEditMode && (
                  <div className="flex flex-shrink-0 gap-2">
                    {selectedMember.phone && (
                      <a
                        href={`tel:${selectedMember.phone}`}
                        className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 text-[12.5px] font-semibold text-[#334155] transition-colors hover:bg-secondary"
                      >
                        <Phone className="h-3.5 w-3.5 text-[#64748B]" />
                        전화
                      </a>
                    )}
                    {selectedMember.phone && (
                      <a
                        href={`sms:${selectedMember.phone}`}
                        className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 text-[12.5px] font-semibold text-[#334155] transition-colors hover:bg-secondary"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-[#64748B]" />
                        문자
                      </a>
                    )}
                    {selectedMember.email && (
                      <a
                        href={`mailto:${selectedMember.email}`}
                        className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 text-[12.5px] font-semibold text-[#334155] transition-colors hover:bg-secondary"
                      >
                        <Mail className="h-3.5 w-3.5 text-[#64748B]" />
                        메일
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* 기본 정보 */}
              <div className="space-y-4">
                <details open className="rounded-[12px] border border-border bg-card group">
                    <summary className="cursor-pointer list-none flex items-center justify-between px-[18px] py-[14px]">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-primary" />
                        <h3 className="text-[14px] font-bold text-foreground">기본 정보</h3>
                      </div>
                      <ChevronDown className="w-4 h-4 text-[#94A3B8] group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="border-t border-[#EEF1F6] px-[18px] py-[18px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 이름 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">이름</label>
                        {isEditMode ? (
                          <Input
                            value={editedMember.name || ''}
                            onChange={(e) => setEditedMember({...editedMember, name: e.target.value})}
                            placeholder="홍길동"
                          />
                        ) : (
                          <p className="text-[13.5px] text-foreground">{selectedMember.name}</p>
                        )}
                      </div>

                      {/* 영문명 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">영문명</label>
                        {isEditMode ? (
                          <Input
                            value={editedMember.name_eng || ''}
                            onChange={(e) => setEditedMember({...editedMember, name_eng: e.target.value})}
                            placeholder="Hong Gil Dong"
                          />
                        ) : (
                          <p className="text-[13.5px] text-foreground">{selectedMember.name_eng || '-'}</p>
                        )}
                      </div>

                      {/* 이메일 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">이메일</label>
                        {isEditMode ? (
                          <Input
                            type="email"
                            value={editedMember.email || ''}
                            onChange={(e) => setEditedMember({...editedMember, email: e.target.value})}
                            placeholder="example@email.com"
                          />
                        ) : (
                          <p className="text-[13.5px] text-foreground">{selectedMember.email}</p>
                        )}
                      </div>

                      {/* 전화번호 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">전화번호</label>
                        {isEditMode ? (
                          <Input
                            type="tel"
                            value={editedMember.phone || ''}
                            onChange={(e) => setEditedMember({...editedMember, phone: e.target.value})}
                            placeholder="010-1234-5678"
                          />
                        ) : (
                          <p className="text-[13.5px] text-foreground">{selectedMember.phone}</p>
                        )}
                      </div>

                      {/* 생년월일 구분 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">생년월일 구분</label>
                        {isEditMode ? (
                          <Select
                            value={editedMember.birthdate_type || '양력'}
                            onValueChange={(value) => setEditedMember({...editedMember, birthdate_type: value})}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="양력">양력</SelectItem>
                              <SelectItem value="음력">음력</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-[13.5px] text-foreground">{selectedMember.birthdate_type || '양력'}</p>
                        )}
                      </div>

                      {/* 생년월일 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">생년월일</label>
                        {isEditMode ? (
                          <DatePicker
                            value={editedMember.birthdate || ''}
                            onChange={(value) => setEditedMember({...editedMember, birthdate: value})}
                            placeholder="예: 1985-01-25 또는 1985.01.25"
                            disableFuture={true}
                            fromYear={1920}
                            toYear={new Date().getFullYear()}
                          />
                        ) : (
                          <p className="text-[13.5px] text-foreground">{selectedMember.birthdate || '-'}</p>
                        )}
                      </div>

                      {/* 성별 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">성별</label>
                        {isEditMode ? (
                          <Select value={editedMember.gender || ''} onValueChange={(value) => setEditedMember({...editedMember, gender: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="남">남</SelectItem>
                              <SelectItem value="여">여</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-[13.5px] text-foreground">{selectedMember.gender}</p>
                        )}
                      </div>
                      </div>
                    </div>
                  </details>

                {/* 교회 정보 */}
                <details open className="rounded-[12px] border border-border bg-card group">
                    <summary className="cursor-pointer list-none flex items-center justify-between px-[18px] py-[14px]">
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-4 h-4 text-primary" />
                        <h3 className="text-[14px] font-bold text-foreground">교회 정보</h3>
                      </div>
                      <ChevronDown className="w-4 h-4 text-[#94A3B8] group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="border-t border-[#EEF1F6] px-[18px] py-[18px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 직분 대분류 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직분 대분류</label>
                        {isEditMode ? (
                          <Select
                            value={editedMember.position_main || 'none'}
                            onValueChange={(value) => {
                              setEditedMember({
                                ...editedMember,
                                position_main: value === 'none' ? null : value,
                                position_detail: null  // 대분류 변경 시 세부 직분 초기화
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="직분 대분류 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">없음</SelectItem>
                              {ADMIN_POSITION_OPTIONS.map((option) => (
                                <SelectItem key={option.mainValue} value={option.mainValue}>
                                  {option.mainLabel}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-[13.5px] text-foreground">
                            {ADMIN_POSITION_OPTIONS.find(opt => opt.mainValue === selectedMember.position_main)?.mainLabel || '-'}
                          </p>
                        )}
                      </div>

                      {/* 직분 세부 (대분류 선택 시에만 표시) */}
                      {editedMember.position_main && (() => {
                        const mainOption = ADMIN_POSITION_OPTIONS.find(opt => opt.mainValue === editedMember.position_main);
                        if (!mainOption || mainOption.details.length === 0) return null;

                        return (
                          <div>
                            <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">세부 직분</label>
                            {isEditMode ? (
                              <Select
                                value={editedMember.position_detail || 'none'}
                                onValueChange={(value) => setEditedMember({...editedMember, position_detail: value === 'none' ? null : value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="세부 직분 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">없음</SelectItem>
                                  {mainOption.details.map((detail) => (
                                    <SelectItem key={detail.value} value={detail.value}>
                                      {detail.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-[13.5px] text-foreground">
                                {(() => {
                                  const selectedOption = ADMIN_POSITION_OPTIONS.find(opt => opt.mainValue === selectedMember.position_main);
                                  if (!selectedOption || selectedOption.details.length === 0) return '-';
                                  const detailOption = (selectedOption.details as any[]).find((d: any) => d.value === selectedMember.position_detail);
                                  return detailOption?.label || '-';
                                })()}
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* 조직 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">조직</label>
                        {isEditMode ? (
                          <Select
                            value={editedMember.organization_id || 'none'}
                            onValueChange={(value) => setEditedMember({...editedMember, organization_id: value === 'none' ? null : value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="조직 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">없음</SelectItem>
                              {organizations.map(org => (
                                <SelectItem key={org.id} value={org.id}>
                                  {org.level > 0 ? '\u00A0'.repeat((org.level - 1) * 2) + '└ ' : ''}{org.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-[13.5px] text-foreground">{selectedMember.organization_name || '-'}</p>
                        )}
                      </div>

                      {/* 부서 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">부서</label>
                        {isEditMode ? (
                          <Select value={editedMember.department || 'none'} onValueChange={(value) => setEditedMember({...editedMember, department: value === 'none' ? undefined : value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="부서 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">없음</SelectItem>
                              {departments.map(dept => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-[13.5px] text-foreground">{selectedMember.department || '-'}</p>
                        )}
                      </div>

                      {/* 직분 코드 - DB에 해당 컬럼 없음, 주석 처리 */}
                      {/* <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직분 분류</label>
                        {isEditMode ? (
                          <Select value={editedMember.position_code || ''} onValueChange={(value) => setEditedMember({...editedMember, position_code: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="직분 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PASTOR">목사</SelectItem>
                              <SelectItem value="ELDER">장로</SelectItem>
                              <SelectItem value="DEACON">집사</SelectItem>
                              <SelectItem value="TEACHER">교사</SelectItem>
                              <SelectItem value="LEADER">부장/회장</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-[13.5px] text-foreground">
                            {selectedMember.position_code ?
                              ({'PASTOR': '목사', 'ELDER': '장로', 'DEACON': '집사', 'TEACHER': '교사', 'LEADER': '부장/회장'}[selectedMember.position_code] || selectedMember.position_code)
                              : '-'
                            }
                          </p>
                        )}
                      </div> */}

                      {/* 임명일 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">임명일</label>
                        {isEditMode ? (
                          <DatePicker
                            value={editedMember.appointed_on || ''}
                            onChange={(value) => setEditedMember({...editedMember, appointed_on: value})}
                            placeholder="예: 2020-01-01"
                            fromYear={1950}
                            toYear={new Date().getFullYear() + 5}
                          />
                        ) : (
                          <p className="text-[13.5px] text-foreground">{selectedMember.appointed_on || '-'}</p>
                        )}
                      </div>

                      {/* 안수교회 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">안수교회</label>
                        {isEditMode ? (
                          <Input
                            value={editedMember.ordination_church || ''}
                            onChange={(e) => setEditedMember({...editedMember, ordination_church: e.target.value})}
                            placeholder="중앙교회"
                          />
                        ) : (
                          <p className="text-[13.5px] text-foreground">{selectedMember.ordination_church || '-'}</p>
                        )}
                      </div>

                      {/* 상태 */}
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">상태</label>
                        {isEditMode ? (
                          <Select value={editedMember.member_status || ''} onValueChange={(value) => setEditedMember({...editedMember, member_status: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">활동</SelectItem>
                              <SelectItem value="inactive">비활동</SelectItem>
                              <SelectItem value="transferred">이전</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-[13.5px] text-foreground">{getStatusText(selectedMember.member_status)}</p>
                        )}
                      </div>
                      </div>
                    </div>
                  </details>

              {/* 사역 정보 */}
              <details className="rounded-[12px] border border-border bg-card group">
                <summary className="cursor-pointer list-none flex items-center justify-between px-[18px] py-[14px]">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-bold text-foreground">사역 정보</h3>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#94A3B8] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="border-t border-[#EEF1F6] px-[18px] py-[18px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 사역 시작일 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">사역 시작일</label>
                    {isEditMode ? (
                      <DatePicker
                        value={editedMember.ministry_start_date || ''}
                        onChange={(value) => setEditedMember({...editedMember, ministry_start_date: value})}
                        placeholder="예: 2020-01-01"
                        fromYear={1950}
                        toYear={new Date().getFullYear() + 5}
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.ministry_start_date || '-'}</p>
                    )}
                  </div>

                  {/* 이웃교회 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">이웃교회</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.neighboring_church || ''}
                        onChange={(e) => setEditedMember({...editedMember, neighboring_church: e.target.value})}
                        placeholder="협력하는 인근 교회"
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.neighboring_church || '-'}</p>
                    )}
                  </div>

                  {/* 직책 결정 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직책 결정</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.position_decision || ''}
                        onChange={(e) => setEditedMember({...editedMember, position_decision: e.target.value})}
                        placeholder="직책 결정 내용"
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.position_decision || '-'}</p>
                    )}
                  </div>

                  {/* 인도자 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">인도자</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.inviter_name || ''}
                        disabled
                        placeholder="수정 불가 (교인 추가 시에만 설정)"
                        className="bg-gray-100"
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.inviter_name || '-'}</p>
                    )}
                  </div>

                  {/* 일일 활동 */}
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">일일 활동</label>
                    {isEditMode ? (
                      <Textarea
                        value={editedMember.daily_activity || ''}
                        onChange={(e) => setEditedMember({...editedMember, daily_activity: e.target.value})}
                        placeholder="일상적인 사역 활동 내용"
                        rows={3}
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground whitespace-pre-wrap">{selectedMember.daily_activity || '-'}</p>
                    )}
                  </div>
                  </div>
                </div>
              </details>

              {/* 직업 정보 */}
              <details className="rounded-[12px] border border-border bg-card group">
                <summary className="cursor-pointer list-none flex items-center justify-between px-[18px] py-[14px]">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-bold text-foreground">직업 정보</h3>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#94A3B8] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="border-t border-[#EEF1F6] px-[18px] py-[18px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 직업 분류 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직업 분류</label>
                    {isEditMode ? (
                      <Select value={editedMember.job_category || ''} onValueChange={(value) => setEditedMember({...editedMember, job_category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="직업 분류 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="전문직">전문직</SelectItem>
                          <SelectItem value="사무직">사무직</SelectItem>
                          <SelectItem value="기술직">기술직</SelectItem>
                          <SelectItem value="판매/서비스직">판매/서비스직</SelectItem>
                          <SelectItem value="자영업">자영업</SelectItem>
                          <SelectItem value="주부">주부</SelectItem>
                          <SelectItem value="학생">학생</SelectItem>
                          <SelectItem value="기타">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.job_category || '-'}</p>
                    )}
                  </div>

                  {/* 직업 상세 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직업 상세</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.job_detail || ''}
                        onChange={(e) => setEditedMember({...editedMember, job_detail: e.target.value})}
                        placeholder="개발자, 디자이너 등"
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.job_detail || '-'}</p>
                    )}
                  </div>

                  {/* 직급/직위 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직급/직위</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.job_position || ''}
                        onChange={(e) => setEditedMember({...editedMember, job_position: e.target.value})}
                        placeholder="과장, 부장 등"
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.job_position || '-'}</p>
                    )}
                  </div>

                  {/* 직업 (기존 필드) */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직업명</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.job_title || ''}
                        onChange={(e) => setEditedMember({...editedMember, job_title: e.target.value})}
                        placeholder="회사원, 교사 등"
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.job_title || '-'}</p>
                    )}
                  </div>

                  {/* 직장명 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직장명</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.workplace || ''}
                        onChange={(e) => setEditedMember({...editedMember, workplace: e.target.value})}
                        placeholder="삼성전자"
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.workplace || '-'}</p>
                    )}
                  </div>

                  {/* 직장 전화번호 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직장 전화번호</label>
                    {isEditMode ? (
                      <Input
                        type="tel"
                        value={editedMember.workplace_phone || ''}
                        onChange={(e) => setEditedMember({...editedMember, workplace_phone: e.target.value})}
                        placeholder="02-1234-5678"
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.workplace_phone || '-'}</p>
                    )}
                  </div>
                </div>
                </div>
              </details>

              {/* 개인 및 가족 정보 */}
              <details className="rounded-[12px] border border-border bg-card group" open>
                <summary className="cursor-pointer list-none flex items-center justify-between px-[18px] py-[14px]">
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-bold text-foreground">개인 및 가족 정보</h3>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#94A3B8] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="border-t border-[#EEF1F6] px-[18px] py-[18px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 교인 분류 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">교인 분류</label>
                    {isEditMode ? (
                      <Select value={editedMember.member_type || ''} onValueChange={(value) => setEditedMember({...editedMember, member_type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="분류 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="등록교인">등록교인</SelectItem>
                          <SelectItem value="입교인">입교인</SelectItem>
                          <SelectItem value="세례교인">세례교인</SelectItem>
                          <SelectItem value="유아세례교인">유아세례교인</SelectItem>
                          <SelectItem value="학습교인">학습교인</SelectItem>
                          <SelectItem value="원입교인">원입교인</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.member_type || '-'}</p>
                    )}
                  </div>

                  {/* 연령대 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">연령대</label>
                    {isEditMode ? (
                      <Select value={editedMember.age_group || ''} onValueChange={(value) => setEditedMember({...editedMember, age_group: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="연령대 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="유아">유아</SelectItem>
                          <SelectItem value="유치부">유치부</SelectItem>
                          <SelectItem value="유년부">유년부</SelectItem>
                          <SelectItem value="초등부">초등부</SelectItem>
                          <SelectItem value="중등부">중등부</SelectItem>
                          <SelectItem value="고등부">고등부</SelectItem>
                          <SelectItem value="청년">청년</SelectItem>
                          <SelectItem value="장년">장년</SelectItem>
                          <SelectItem value="노년">노년</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.age_group || '-'}</p>
                    )}
                  </div>

                  {/* 신앙 등급 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">신앙 등급</label>
                    {isEditMode ? (
                      <Select value={editedMember.spiritual_grade || ''} onValueChange={(value) => setEditedMember({...editedMember, spiritual_grade: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="등급 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="초신자">초신자</SelectItem>
                          <SelectItem value="새신자">새신자</SelectItem>
                          <SelectItem value="일반신자">일반신자</SelectItem>
                          <SelectItem value="성숙신자">성숙신자</SelectItem>
                          <SelectItem value="리더">리더</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.spiritual_grade || '-'}</p>
                    )}
                  </div>

                  {/* 결혼 상태 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">결혼 상태</label>
                    {isEditMode ? (
                      <Select value={editedMember.marital_status || ''} onValueChange={(value) => setEditedMember({...editedMember, marital_status: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="상태 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="미혼">미혼</SelectItem>
                          <SelectItem value="기혼">기혼</SelectItem>
                          <SelectItem value="이혼">이혼</SelectItem>
                          <SelectItem value="사별">사별</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.marital_status || '-'}</p>
                    )}
                  </div>

                  {/* 배우자 이름 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">배우자 이름</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.spouse_name || ''}
                        onChange={(e) => setEditedMember({...editedMember, spouse_name: e.target.value})}
                        placeholder="배우자 이름"
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.spouse_name || '-'}</p>
                    )}
                  </div>

                  {/* 결혼일 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">결혼일</label>
                    {isEditMode ? (
                      <DatePicker
                        value={editedMember.married_on || ''}
                        onChange={(value) => setEditedMember({...editedMember, married_on: value})}
                        placeholder="예: 2015-05-20"
                        fromYear={1950}
                        toYear={new Date().getFullYear() + 5}
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.married_on || '-'}</p>
                    )}
                  </div>

                  {/* 디버그 정보 */}
                  <div className="md:col-span-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-gray-700">디버그: isEditMode = {isEditMode ? 'true' : 'false'}</p>
                    <p className="text-xs text-gray-700">디버그: marital_status = "{isEditMode ? editedMember.marital_status : selectedMember.marital_status}"</p>
                    <p className="text-xs text-gray-700">디버그: 조건 결과 = {((isEditMode ? editedMember.marital_status : selectedMember.marital_status) === '기혼') ? 'true' : 'false'}</p>
                  </div>

                  {/* 자녀사항 (기혼일 경우에만 표시) */}
                  {((isEditMode ? editedMember.marital_status : selectedMember.marital_status) === '기혼') && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">자녀사항</label>
                    {isEditMode ? (
                      <div className="space-y-3">
                        {(editedMember.children || []).map((child, index) => (
                          <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                              <Input
                                value={child.name}
                                onChange={(e) => {
                                  const newChildren = [...(editedMember.children || [])];
                                  newChildren[index] = { ...child, name: e.target.value };
                                  setEditedMember({...editedMember, children: newChildren});
                                }}
                                placeholder="자녀 이름"
                              />
                              <Select
                                value={child.gender || ''}
                                onValueChange={(value) => {
                                  const newChildren = [...(editedMember.children || [])];
                                  newChildren[index] = { ...child, gender: value };
                                  setEditedMember({...editedMember, children: newChildren});
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="성별" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="남">남</SelectItem>
                                  <SelectItem value="여">여</SelectItem>
                                </SelectContent>
                              </Select>
                              <DatePicker
                                value={child.birthdate || ''}
                                onChange={(value) => {
                                  const newChildren = [...(editedMember.children || [])];
                                  newChildren[index] = { ...child, birthdate: value };
                                  setEditedMember({...editedMember, children: newChildren});
                                }}
                                placeholder="생년월일"
                                fromYear={1950}
                                toYear={new Date().getFullYear()}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newChildren = (editedMember.children || []).filter((_, i) => i !== index);
                                setEditedMember({...editedMember, children: newChildren});
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newChildren = [...(editedMember.children || []), { name: '', gender: '', birthdate: '' }];
                            setEditedMember({...editedMember, children: newChildren});
                          }}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          자녀 추가
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedMember.children && selectedMember.children.length > 0 ? (
                          selectedMember.children.map((child, index) => (
                            <div key={index} className="text-[13.5px] text-foreground p-2 bg-gray-50 rounded">
                              {child.name} {child.gender && `(${child.gender})`} {child.birthdate && `- ${child.birthdate}`}
                            </div>
                          ))
                        ) : (
                          <p className="text-[13.5px] text-foreground">-</p>
                        )}
                      </div>
                    )}
                  </div>
                  )}
                  </div>
                </div>
              </details>

              {/* 주소 정보 */}
              <details className="rounded-[12px] border border-border bg-card group">
                <summary className="cursor-pointer list-none flex items-center justify-between px-[18px] py-[14px]">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-bold text-foreground">주소 정보</h3>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#94A3B8] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="border-t border-[#EEF1F6] px-[18px] py-[18px]">
                <div className="space-y-4">
                  {/* 우편번호 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">우편번호</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.postal_code || ''}
                        onChange={(e) => setEditedMember({...editedMember, postal_code: e.target.value})}
                        placeholder="12345"
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground">{selectedMember.postal_code || '-'}</p>
                    )}
                  </div>

                  {/* 지역 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">시/도</label>
                      {isEditMode ? (
                        <Input
                          value={editedMember.region_1 || ''}
                          onChange={(e) => setEditedMember({...editedMember, region_1: e.target.value})}
                          placeholder="서울특별시"
                        />
                      ) : (
                        <p className="text-[13.5px] text-foreground">{selectedMember.region_1 || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">시/군/구</label>
                      {isEditMode ? (
                        <Input
                          value={editedMember.region_2 || ''}
                          onChange={(e) => setEditedMember({...editedMember, region_2: e.target.value})}
                          placeholder="강남구"
                        />
                      ) : (
                        <p className="text-[13.5px] text-foreground">{selectedMember.region_2 || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">동/읍/면</label>
                      {isEditMode ? (
                        <Input
                          value={editedMember.region_3 || ''}
                          onChange={(e) => setEditedMember({...editedMember, region_3: e.target.value})}
                          placeholder="역삼동"
                        />
                      ) : (
                        <p className="text-[13.5px] text-foreground">{selectedMember.region_3 || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* 상세 주소 */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">상세 주소</label>
                    {isEditMode ? (
                      <Textarea
                        value={editedMember.address || ''}
                        onChange={(e) => setEditedMember({...editedMember, address: e.target.value})}
                        placeholder="상세 주소 입력"
                        rows={3}
                      />
                    ) : (
                      <p className="text-[13.5px] text-foreground whitespace-pre-wrap">
                        {selectedMember.address || '-'}
                      </p>
                    )}
                  </div>
                </div>
                </div>
              </details>

              {/* 자유 필드 (커스텀 정보) */}
              <details className="rounded-[12px] border border-border bg-card group">
                <summary className="cursor-pointer list-none flex items-center justify-between px-[18px] py-[14px]">
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-bold text-foreground">자유 필드 (커스텀 정보)</h3>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#94A3B8] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="border-t border-[#EEF1F6] px-[18px] py-[18px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                    const fieldKey = `custom_field_${num}` as keyof Member;
                    const value = isEditMode
                      ? editedMember[fieldKey]
                      : selectedMember[fieldKey];

                    // 값이 있거나 편집 모드일 때만 표시
                    if (!value && !isEditMode) return null;

                    return (
                      <div key={num}>
                        <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">
                          자유필드 {num}
                        </label>
                        {isEditMode ? (
                          <Input
                            value={(editedMember[fieldKey] as string) || ''}
                            onChange={(e) => setEditedMember({...editedMember, [fieldKey]: e.target.value})}
                            placeholder={`추가 정보 ${num}`}
                          />
                        ) : (
                          <p className="text-[13.5px] text-foreground">{value as string || '-'}</p>
                        )}
                      </div>
                    );
                  })}
                  </div>
                  {!isEditMode && ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].some(num =>
                    selectedMember[`custom_field_${num}` as keyof Member]
                  ) && (
                    <p className="text-[13.5px] text-foreground px-6 pb-6">등록된 추가 정보가 없습니다.</p>
                  )}
                </div>
              </details>

              {/* 특별 사항 */}
              <details className="rounded-[12px] border border-border bg-card group">
                <summary className="cursor-pointer list-none flex items-center justify-between px-[18px] py-[14px]">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-bold text-foreground">특별 사항</h3>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#94A3B8] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="border-t border-[#EEF1F6] px-[18px] py-[18px]">
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">특이사항 및 메모</label>
                  {isEditMode ? (
                    <Textarea
                      value={editedMember.special_notes || ''}
                      onChange={(e) => setEditedMember({...editedMember, special_notes: e.target.value})}
                      placeholder="교인에 대한 특별한 사항이나 메모를 입력하세요"
                      rows={4}
                    />
                  ) : (
                    <p className="text-[13.5px] text-foreground whitespace-pre-wrap">
                      {selectedMember.special_notes || '-'}
                    </p>
                  )}
                </div>
              </details>
            </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              교인 정보 삭제
            </DialogTitle>
            <DialogDescription>
              교인 정보를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-900">
              <strong>{selectedMember?.name}님</strong>의 정보를 정말로 삭제하시겠습니까?
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive">
                <strong>주의:</strong> 삭제된 정보는 복구할 수 없습니다.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
              >
                취소
              </Button>
              <Button
                onClick={handleDeleteMember}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 일괄 삭제 확인 모달 */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              일괄 삭제 확인
            </DialogTitle>
            <DialogDescription>
              선택한 교인들의 정보를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-900">
              선택한 <strong>{selectedMembers.size}명</strong>의 교인 정보를 정말로 삭제하시겠습니까?
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium text-gray-900 mb-2">삭제될 교인:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {members
                  .filter(m => selectedMembers.has(m.id))
                  .map(m => (
                    <li key={m.id}>• {m.name} ({m.email || m.phone})</li>
                  ))
                }
              </ul>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive">
                <strong>경고:</strong> 모든 개인정보가 완전히 삭제됩니다.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setShowBulkDeleteConfirm(false)}
                variant="outline"
              >
                취소
              </Button>
              <Button
                onClick={confirmBulkDelete}
                variant="destructive"
                className="flex items-center gap-2"
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <Spinner size="sm" variant="white" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isBulkDeleting ? '삭제 중...' : `${selectedMembers.size}명 삭제`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excel Import Modal */}
      <Dialog open={showExcelImportModal} onOpenChange={(open) => {
        setShowExcelImportModal(open);
        if (!open) {
          setExcelFile(null);
          setExcelPreviewData(null);
          setValidationResults(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              엑셀 일괄 등록
            </DialogTitle>
            <DialogDescription>
              엑셀 파일을 사용하여 여러 교인을 한번에 등록할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
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
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setExcelFile(file);
                    setExcelPreviewData(null); // 새 파일 선택 시 미리보기 초기화
                    setValidationResults(null); // 검증 결과 초기화
                  }
                }}
              />
              <p className="text-xs text-gray-600 mt-1">
                CSV, XLSX, XLS 파일만 가능
              </p>
            </div>

            {excelFile && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  <strong>선택된 파일:</strong> {excelFile.name}
                </p>
              </div>
            )}

            {excelFile && !excelPreviewData && (
              <div className="flex justify-center">
                <Button
                  onClick={handleExcelPreview}
                  disabled={isPreviewLoading}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  {isPreviewLoading ? (
                    <>
                      <Spinner size="sm" />
                      검증 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      파일 검증
                    </>
                  )}
                </Button>
              </div>
            )}

            {excelPreviewData && validationResults && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-shrink-0">
                  <h3 className="text-sm font-medium text-gray-900">
                    검증 결과
                  </h3>
                  <Button
                    onClick={() => {
                      setExcelPreviewData(null);
                      setValidationResults(null);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    닫기
                  </Button>
                </div>

                {/* 검증 통계 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600">전체</p>
                    <p className="text-xl font-bold">{validationResults.length}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600">유효</p>
                    <p className="text-xl font-bold text-green-600">
                      {validationResults.filter(r => r.isValid).length}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-gray-600">오류</p>
                    <p className="text-xl font-bold text-red-600">
                      {validationResults.filter(r => !r.isValid).length}
                    </p>
                  </div>
                </div>

                {/* 검증 결과 테이블 */}
                <div className="border rounded-md overflow-x-auto bg-white" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">행</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">이름</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">전화번호</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">상태</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {validationResults.map((result, idx) => {
                        const headerMap: { [key: string]: number } = {};
                        excelPreviewData[0].forEach((header: string, index: number) => {
                          headerMap[header] = index;
                        });

                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-gray-50 ${!result.isValid ? 'bg-red-50' : result.warnings.length > 0 ? 'bg-yellow-50' : ''}`}
                          >
                            <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{result.rowNumber}</td>
                            <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                              {result.data[headerMap['이름']] || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                              {result.data[headerMap['전화번호']] || '-'}
                            </td>
                            <td className="px-3 py-2">
                              <div className="space-y-1">
                                {result.errors.map((err, errIdx) => (
                                  <div key={errIdx} className="text-xs text-red-600 flex items-start gap-1">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{err}</span>
                                  </div>
                                ))}
                                {result.warnings.map((warn, warnIdx) => (
                                  <div key={warnIdx} className="text-xs text-yellow-600 flex items-start gap-1">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{warn}</span>
                                  </div>
                                ))}
                                {result.isValid && result.errors.length === 0 && result.warnings.length === 0 && (
                                  <div className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>정상</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 데이터 미리보기 섹션 */}
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    데이터 미리보기 (전체)
                  </h3>
                  <div className="border rounded-md overflow-x-auto bg-white" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          {excelPreviewData[0].map((header: string, index: number) => (
                            <th
                              key={index}
                              className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {excelPreviewData.slice(1).map((row: any[], rowIndex: number) => {
                          const result = validationResults[rowIndex];
                          return (
                            <tr
                              key={rowIndex}
                              className={`hover:bg-gray-50 ${result && !result.isValid ? 'bg-red-50' : result && result.warnings.length > 0 ? 'bg-yellow-50' : ''}`}
                            >
                              {row.map((cell: any, cellIndex: number) => (
                                <td
                                  key={cellIndex}
                                  className="px-3 py-2 text-gray-900 whitespace-nowrap"
                                >
                                  {cell || '-'}
                                </td>
                              ))}
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

          <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
            <Button
              onClick={() => {
                setShowExcelImportModal(false);
                setExcelFile(null);
                setExcelPreviewData(null);
                setValidationResults(null);
              }}
              variant="outline"
              disabled={isImporting}
            >
              취소
            </Button>
            <Button
              onClick={handleExcelImport}
              disabled={!validationResults || validationResults.filter(r => r.isValid).length === 0 || isImporting}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <Spinner size="sm" variant="white" />
                  등록 중...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {validationResults ? `${validationResults.filter(r => r.isValid).length}개 행 등록` : '등록 시작'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Search Modal */}
      <Dialog open={showAdvancedSearch} onOpenChange={setShowAdvancedSearch}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              상세 검색
            </DialogTitle>
            <DialogDescription>
              여러 조건을 조합하여 교인을 검색할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">이름</label>
                  <Input
                    value={advancedSearchData.name}
                    onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">이메일</label>
                  <Input
                    value={advancedSearchData.email}
                    onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">전화번호</label>
                  <Input
                    value={advancedSearchData.phone}
                    onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="010-1234-5678"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">성별</label>
                  <Select value={advancedSearchData.gender} onValueChange={(value) => setAdvancedSearchData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="남">남</SelectItem>
                      <SelectItem value="여">여</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 교회 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">교회 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직분 대분류</label>
                  <Select
                    value={advancedSearchData.position_main}
                    onValueChange={(value) => {
                      setAdvancedSearchData(prev => ({
                        ...prev,
                        position_main: value,
                        position_detail: 'all' // 대분류 변경 시 세부 초기화
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {Object.entries(POSITION_MAIN_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {advancedSearchData.position_main !== 'all' && POSITION_HIERARCHY[advancedSearchData.position_main as keyof typeof POSITION_HIERARCHY] && (
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">세부 직분</label>
                    <Select
                      value={advancedSearchData.position_detail}
                      onValueChange={(value) => setAdvancedSearchData(prev => ({ ...prev, position_detail: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="세부 직분 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {POSITION_HIERARCHY[advancedSearchData.position_main as keyof typeof POSITION_HIERARCHY]?.map((detailKey: string) => (
                          <SelectItem key={detailKey} value={detailKey}>
                            {POSITION_DETAIL_LABELS[detailKey as keyof typeof POSITION_DETAIL_LABELS]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">조직/부서</label>
                  <Select value={advancedSearchData.organization_id} onValueChange={(value) => setAdvancedSearchData(prev => ({ ...prev, organization_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 개인 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">개인 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">연령대</label>
                  <Select value={advancedSearchData.age_group} onValueChange={(value) => setAdvancedSearchData(prev => ({ ...prev, age_group: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="어린이">어린이 (0-12세)</SelectItem>
                      <SelectItem value="학생">학생 (13-19세)</SelectItem>
                      <SelectItem value="청년">청년 (20-35세)</SelectItem>
                      <SelectItem value="성인">성인 (36-65세)</SelectItem>
                      <SelectItem value="시니어">시니어 (65세+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">결혼 상태</label>
                  <Select value={advancedSearchData.marital_status} onValueChange={(value) => setAdvancedSearchData(prev => ({ ...prev, marital_status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="미혼">미혼</SelectItem>
                      <SelectItem value="기혼">기혼</SelectItem>
                      <SelectItem value="이혼">이혼</SelectItem>
                      <SelectItem value="사별">사별</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">나이 범위</label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      value={advancedSearchData.ageFrom}
                      onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, ageFrom: e.target.value }))}
                      placeholder="최소 나이"
                      min="0"
                      max="120"
                    />
                    <Input
                      type="number"
                      value={advancedSearchData.ageTo}
                      onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, ageTo: e.target.value }))}
                      placeholder="최대 나이"
                      min="0"
                      max="120"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 직업 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">직업 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-[#94A3B8]">직업 분류</label>
                  <Select value={advancedSearchData.job_category} onValueChange={(value) => setAdvancedSearchData(prev => ({ ...prev, job_category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="사무직">사무직</SelectItem>
                      <SelectItem value="교육직">교육직</SelectItem>
                      <SelectItem value="의료진">의료진</SelectItem>
                      <SelectItem value="서비스업">서비스업</SelectItem>
                      <SelectItem value="자영업">자영업</SelectItem>
                      <SelectItem value="학생">학생</SelectItem>
                      <SelectItem value="주부">주부</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => {
                setAdvancedSearchData({
                  name: '',
                  email: '',
                  phone: '',
                  gender: 'all',
                  position_main: 'all',
                  position_detail: 'all',
                  organization_id: 'all',
                  age_group: 'all',
                  ageFrom: '',
                  ageTo: '',
                  marital_status: 'all',
                  job_category: 'all'
                });
                setIsAdvancedSearchActive(false);
              }}
              variant="outline"
            >
              초기화
            </Button>
            <Button
              onClick={() => {
                setIsAdvancedSearchActive(true);
                setShowAdvancedSearch(false);
                setSearchTerm(''); // 기본 검색 비활성화
                setPagination(prev => ({ ...prev, current_page: 1 })); // 첫 페이지로 이동
              }}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              검색 실행
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 역할 선택 모달 */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              관리자 역할 지정
            </DialogTitle>
            <DialogDescription>
              {selectedMember?.name}님에게 부여할 관리자 역할을 선택해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={() => handleRoleChange(ROLES.CHURCH_ADMIN)}
                variant="outline"
                className="w-full justify-start"
                disabled={roleChangeLoading}
              >
                <Shield className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">{getRoleDisplayName(ROLES.CHURCH_ADMIN)}</div>
                  <div className="text-xs text-gray-500">교회 관리 기능에 접근 가능</div>
                </div>
              </Button>

              {/* Super Admin만 Church Super Admin 지정 가능 */}
              {currentUser && isSuperAdmin(currentUser) && (
                <Button
                  onClick={() => handleRoleChange(ROLES.CHURCH_SUPER_ADMIN)}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={roleChangeLoading}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{getRoleDisplayName(ROLES.CHURCH_SUPER_ADMIN)}</div>
                    <div className="text-xs text-gray-500">교회 관리 + 다른 관리자 권한 부여 가능</div>
                  </div>
                </Button>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRoleModal(false)}
                disabled={roleChangeLoading}
              >
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 초대 메시지 모달 */}
      <Dialog open={showInviteMessage} onOpenChange={setShowInviteMessage}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              초대 완료 - 메시지
            </DialogTitle>
            <DialogDescription>
              초대 이메일이 발송되었습니다. 아래 메시지를 복사하여 카카오톡이나 문자로 전달할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">초대 이메일이 성공적으로 발송되었습니다!</p>
              <p className="text-sm text-green-700 mt-1">이메일로 임시 비밀번호가 발송되었습니다.</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium mb-2">이메일을 확인하지 못하는 경우</p>
              <p className="text-sm text-yellow-700">
                아래 메시지를 복사하여 휴대폰 문자나 카카오톡으로 전달해주세요.
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 relative">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {generateInviteMessage(inviteMessageData.name, inviteMessageData.email, inviteMessageData.temporaryPassword)}
              </pre>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={handleCopyMessage}
                variant={copySuccess ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                {copySuccess ? (
                  <>
                    복사됨!
                  </>
                ) : (
                  <>
                    메시지 복사
                  </>
                )}
              </Button>
              <Button onClick={() => setShowInviteMessage(false)}>
                확인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 일괄 초대 진행 상황 모달 */}
      <Dialog open={showBulkInviteProgress} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
              일괄 초대 진행 중
            </DialogTitle>
            <DialogDescription>
              초대 발송이 진행 중입니다. 잠시만 기다려주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 전체 진행률 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-900">
                  진행 상황: {bulkInviteProgress.filter(p => p.status === 'success' || p.status === 'failed').length} / {bulkInviteProgress.length}명
                </p>
                <p className="text-sm text-blue-700">
                  {Math.round((bulkInviteProgress.filter(p => p.status === 'success' || p.status === 'failed').length / bulkInviteProgress.length) * 100)}%
                </p>
              </div>
              {/* 프로그레스 바 */}
              <div className="w-full bg-blue-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${(bulkInviteProgress.filter(p => p.status === 'success' || p.status === 'failed').length / bulkInviteProgress.length) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            {/* 각 교인별 처리 상태 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bulkInviteProgress.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    item.status === 'pending' && "bg-gray-50 border-gray-200",
                    item.status === 'processing' && "bg-blue-50 border-blue-300 shadow-sm",
                    item.status === 'success' && "bg-green-50 border-green-300",
                    item.status === 'failed' && "bg-red-50 border-red-300"
                  )}
                >
                  {/* 상태 아이콘 */}
                  <div className="flex-shrink-0">
                    {item.status === 'pending' && (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    {item.status === 'processing' && (
                      <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {item.status === 'failed' && (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  {/* 교인 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-medium text-sm",
                        item.status === 'pending' && "text-gray-700",
                        item.status === 'processing' && "text-blue-900",
                        item.status === 'success' && "text-green-900",
                        item.status === 'failed' && "text-red-900"
                      )}>
                        {item.name}
                      </p>
                      <p className={cn(
                        "text-xs truncate",
                        item.status === 'pending' && "text-gray-500",
                        item.status === 'processing' && "text-blue-700",
                        item.status === 'success' && "text-green-700",
                        item.status === 'failed' && "text-red-700"
                      )}>
                        {item.email}
                      </p>
                    </div>

                    {/* 상태 메시지 */}
                    <p className={cn(
                      "text-xs mt-1",
                      item.status === 'pending' && "text-gray-500",
                      item.status === 'processing' && "text-blue-600 font-medium",
                      item.status === 'success' && "text-green-600",
                      item.status === 'failed' && "text-red-600"
                    )}>
                      {item.status === 'pending' && '대기 중...'}
                      {item.status === 'processing' && '초대 발송 중...'}
                      {item.status === 'success' && '초대 발송 완료'}
                      {item.status === 'failed' && (item.errorMessage || '초대 발송 실패')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 안내 메시지 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>안내:</strong> 창을 닫지 마세요. 모든 초대가 완료되면 자동으로 결과가 표시됩니다.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 일괄 초대 결과 모달 */}
      <Dialog open={showBulkInviteResults} onOpenChange={setShowBulkInviteResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              일괄 초대 완료
            </DialogTitle>
            <DialogDescription>
              초대가 완료되었습니다. 아래 메시지들을 복사하여 카카오톡이나 문자로 각 교인에게 전달할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">
                초대 결과: 성공 {bulkInviteResults.filter(r => r.success).length}명 / 전체 {bulkInviteResults.length}명
              </p>
            </div>

            {bulkInviteResults.filter(r => !r.success).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-2">발송 실패한 교인:</p>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {bulkInviteResults.filter(r => !r.success).map((result, idx) => (
                    <li key={idx}>{result.name} ({result.email})</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium mb-2">각 교인에게 전달할 메시지</p>
              <p className="text-sm text-yellow-700">
                아래 메시지를 복사하여 각 교인에게 개별적으로 카카오톡이나 문자로 전달해주세요.
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 relative">
              <pre className="text-sm whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                {generateBulkInviteMessages()}
              </pre>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={handleCopyBulkMessages}
                variant={bulkCopySuccess ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                {bulkCopySuccess ? (
                  <>
                    복사됨!
                  </>
                ) : (
                  <>
                    전체 메시지 복사
                  </>
                )}
              </Button>
              <Button onClick={() => setShowBulkInviteResults(false)}>
                확인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default MemberManagement;