import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { activityLogger } from '../services/activityLogger';
import { Pagination } from './common/Pagination';
import axios from 'axios';
import {
  Search,
  Plus,
  RefreshCw,
  Camera,
  QrCode,
  ChevronUp,
  ChevronDown,
  User,
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
  Shield
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from "@/components/ui3";
import { Input } from "@/components/ui3";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui3";
import { Card, CardContent } from "@/components/ui3";
import { Badge } from "@/components/ui3";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui3";
import { Textarea } from "@/components/ui3";
import AddMemberModal from './AddMemberModal';
import { isChurchSuperAdmin, isSuperAdmin, ROLES, getRoleDisplayName } from '../utils/userPermissions';
import { StandardPagination } from '../types/community-common';

interface Member {
  id: number;
  name: string;
  name_eng?: string;
  email: string;
  gender: string;
  birthdate: string | null;
  phone: string;
  address: string | null;
  position: string | null;
  district: string | null;
  church_id: number;
  profile_photo_url: string | null;
  member_status: string;
  registration_date: string | null;
  
  // 사역 정보
  department_code?: string;
  position_code?: string;
  appointed_on?: string;
  ordination_church?: string;
  job_title?: string;
  workplace?: string;
  workplace_phone?: string;
  
  // 개인 정보
  marital_status?: string;
  spouse_name?: string;
  married_on?: string;
  
  // 연락처 정보
  contacts?: Array<{ type: string; value: string; }>;
  
  // 성례 기록
  sacraments?: Array<{ type: string; date: string; church_name: string; }>;
  
  // 이명 기록
  transfers?: Array<{ type: string; church_name: string; date: string; }>;
  
  // 차량 정보
  vehicles?: Array<{ car_type: string; plate_no: string; }>;
}

const MemberManagement: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedMember, setEditedMember] = useState<Partial<Member>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
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

  // Advanced search states
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearchData, setAdvancedSearchData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'all',
    position: '',
    district: '',
    ageFrom: '',
    ageTo: '',
    member_type: 'all',
    spiritual_grade: 'all'
  });


  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    gender: '남',
    birthdate: '',
    phone: '',
    address: '',
    position: '',
    district: ''
  });

  useEffect(() => {
    // 페이지 접근 로그 (최초 마운트 시에만)
    if (pagination.current_page === 1 && !appliedSearchTerm) {
      activityLogger.logPageAccess('/member-management', '교인 관리');
    }
    fetchMembers();
  }, [appliedSearchTerm, statusFilter, pagination.current_page, pagination.per_page, sortField, sortOrder]);


  const fetchMembers = async () => {
    console.log('⚡⚡⚡ fetchMembers 함수 시작!', { appliedSearchTerm });
    try {
      setLoading(true);

      // 현재 사용자의 church_id 가져오기
      const currentUserData = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUserData?.user?.church_id || 9998; // 기본값 9998

      // 현재 사용자 정보를 상태에 저장
      setCurrentUser(currentUserData?.user);

      // Use Supabase Edge Function for members data
      const response = await supabaseApiService.members.getAll();
      console.log('📊 Supabase API 응답:', {
        dataLength: response.data.length,
        sampleData: response.data.slice(0, 3).map((m: any) => ({ id: m.id, name: m.name || m.full_name }))
      });

      let filteredData = response.data;

      // Apply search filter on client side for now
      if (appliedSearchTerm) {
        const searchLower = appliedSearchTerm.toLowerCase();
        filteredData = response.data.filter((member: any) =>
          (member.name && member.name.toLowerCase().includes(searchLower)) ||
          (member.full_name && member.full_name.toLowerCase().includes(searchLower)) ||
          (member.email && member.email.toLowerCase().includes(searchLower)) ||
          (member.phone && member.phone.toLowerCase().includes(searchLower))
        );
        console.log('🔍 검색 필터 적용 후:', filteredData.length);
      }

      // Apply status filter on client side
      if (statusFilter !== 'all') {
        filteredData = filteredData.filter((member: any) => {
          if (statusFilter === 'active') return member.is_active !== false;
          if (statusFilter === 'inactive') return member.is_active === false;
          return true;
        });
      }

      const actualTotalCount = filteredData.length;

      // Apply pagination on client side
      const startIndex = (pagination.current_page - 1) * pagination.per_page;
      const endIndex = startIndex + pagination.per_page;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      // Sort paginated data on client side
      let sortedData = [...paginatedData];
      if (sortField) {
        sortedData.sort((a, b) => {
          const aVal = a[sortField] || '';
          const bVal = b[sortField] || '';
          if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
      }

      setMembers(sortedData);

      // Update pagination state
      const totalPages = Math.ceil(actualTotalCount / pagination.per_page);
      setPagination(prev => ({
        ...prev,
        total_count: actualTotalCount,
        total_pages: totalPages,
        has_prev: prev.current_page > 1,
        has_next: prev.current_page < totalPages
      }));
      
      // 검색 로그 기록 (실제 결과와 함께)
      if (appliedSearchTerm) {
        activityLogger.logMemberSearch(appliedSearchTerm, actualTotalCount);
      }
    } catch (error) {
      console.error('교인 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current_page: 1 })); // Reset to first page on new search
    setAppliedSearchTerm(searchTerm);

    // 검색 로그 기록 (실제 검색 수행 후에 결과 개수와 함께 기록)
    if (searchTerm.trim()) {
      // 검색 로그는 fetchMembers에서 실제 결과 개수를 알 수 있을 때 기록
      console.log('🔍 Search initiated for:', searchTerm);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
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
        phone: '',
        address: '',
        position: '',
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
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      console.log('🔍 Photo upload debug:', {
        memberId: selectedMember.id,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        endpoint: `/members/${selectedMember.id}/upload-photo`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        hasFile: !!file,
        formDataEntries: Array.from(formData.entries()),
        tokenFirst10: token ? token.substring(0, 10) + '...' : null
      });

      // Test if token works with a simple API call first
      try {
        const testResponse = await axios.get(
          `https://api.surfmind-team.com/api/v1/members/${selectedMember.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        console.log('✅ Token works - member data retrieved:', testResponse.status);
      } catch (testError) {
        console.error('❌ Token test failed:', testError);
        alert('토큰이 유효하지 않습니다. 다시 로그인해주세요.');
        return;
      }

      // Try direct axios call without api instance
      const response = await axios.post(
        `https://api.surfmind-team.com/api/v1/members/${selectedMember.id}/upload-photo`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('✅ Photo upload response:', response.data);
      console.log('🔄 Updating member photo URL:', response.data.profile_photo_url);

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
      const updatedMembers = members.map(m => 
        m.id === selectedMember.id 
          ? { ...m, profile_photo_url: response.data.profile_photo_url }
          : m
      );
      
      console.log('📝 Updated members array:', updatedMembers.find(m => m.id === selectedMember.id));
      setMembers(updatedMembers);
      
      // Also update selectedMember for immediate UI feedback
      setSelectedMember(prev => prev ? { ...prev, profile_photo_url: response.data.profile_photo_url } : prev);
      
      // Verify if the photo was actually saved in DB by re-fetching the member
      setTimeout(async () => {
        try {
          const verifyResponse = await axios.get(
            `https://api.surfmind-team.com/api/v1/members/${selectedMember.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          console.log('🔍 DB verification - member data after upload:', verifyResponse.data);
          console.log('🔍 DB verification - profile_photo_url:', verifyResponse.data.profile_photo_url);
          
          if (!verifyResponse.data.profile_photo_url) {
            console.error('❌ Photo URL not saved to database!');
            alert('경고: 사진 업로드는 성공했지만 데이터베이스 저장에 실패했을 수 있습니다.');
          } else {
            console.log('✅ Photo URL successfully saved to database');
          }
        } catch (error) {
          console.error('DB verification failed:', error);
        }
      }, 1000); // 1초 후 검증
      
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

  const handleMemberClick = (member: Member) => {
    // 교인 상세 조회 로그 기록
    const viewedFields = ['name', 'email', 'phone', 'gender', 'birthdate', 'address', 'position', 'district', 'member_status'];
    activityLogger.logMemberView(member.id, member.name, viewedFields);
    
    setSelectedMember(member);
    setEditedMember(member);
    setIsEditMode(false);
    setShowDetailModal(true);
  };

  const handleEditMember = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (selectedMember) {
      setEditedMember(selectedMember);
    }
    setIsEditMode(false);
  };

  const handleSaveMember = async () => {
    if (!selectedMember) return;
    
    try {
      // Preserve profile_photo_url from selectedMember to prevent overwriting
      const memberDataToSave = {
        ...editedMember,
        profile_photo_url: selectedMember.profile_photo_url
      };
      
      console.log('💾 Saving member with preserved photo URL:', memberDataToSave.profile_photo_url);
      
      const response = await supabaseApiService.members.update(memberDataToSave);
      
      // 수정된 필드들 확인
      const updatedFields = Object.keys(editedMember).filter(key => 
        editedMember[key as keyof Member] !== selectedMember[key as keyof Member]
      );
      
      // 교인 정보 수정 로그 기록
      activityLogger.logMemberUpdate(selectedMember.id, selectedMember.name, updatedFields);
      
      // Update member in list
      setMembers(members.map(m => 
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
      setMembers(members.filter(m => m.id !== selectedMember.id));
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

  // SMS 초대 발송 함수
  const handleSendInvitation = async (member: Member) => {
    if (!member.phone) {
      alert('전화번호가 등록되지 않은 교인입니다.');
      return;
    }

    const inviteMessage = member.email
      ? `${member.name}님에게 앱 초대를 발송하시겠습니까?\nSMS: ${member.phone}\n이메일: ${member.email}`
      : `${member.name}님에게 앱 초대 SMS를 발송하시겠습니까?\n전화번호: ${member.phone}`;

    if (!window.confirm(inviteMessage)) {
      return;
    }

    try {
      setSmsLoading(member.id);

      // SMS + 이메일 초대 발송
      const result = await supabaseApiService.smsInvitation.send(
        member.id,
        member.phone,
        member.name || member.phone, // 이름이 있으면 이름, 없으면 전화번호를 username으로 사용
        member.email, // 이메일 주소 추가
        '요람교회' // 교회명
      );

      if (result.success) {
        const statusText = result.message || '초대 발송 완료';
        alert(`${statusText}\n임시 비밀번호: ${result.temporaryPassword}`);
        // 교인 목록 새로고침
        fetchMembers();
      }

    } catch (error: any) {
      console.error('SMS 초대 발송 실패:', error);
      alert(`SMS 초대 발송에 실패했습니다.\n오류: ${error.message}`);
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
    const headers = [
      '이름',
      '영문명',
      '이메일',
      '성별',
      '생년월일',
      '전화번호',
      '주소',
      '직분',
      '구역',
      '부서코드',
      '직분코드',
      '임명일',
      '안수교회',
      '직업',
      '직장명',
      '직장전화번호',
      '결혼상태',
      '배우자이름',
      '결혼일'
    ];
    
    const sampleData = [
      '홍길동',
      'Hong Gil Dong',
      'hong@email.com',
      '남',
      '1990-01-01',
      '010-1234-5678',
      '서울시 강남구',
      '집사',
      '1구역',
      'WORSHIP',
      'DEACON',
      '2020-01-01',
      '중앙교회',
      '회사원',
      '삼성전자',
      '02-1234-5678',
      '기혼',
      '김영희',
      '2015-05-20'
    ];
    
    // CSV 형식으로 생성
    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');
    
    // BOM을 추가하여 한글 인코딩 문제 해결
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '교인정보_엑셀템플릿.csv';
    link.click();
    
    URL.revokeObjectURL(link.href);
  };

  const handleExcelImport = async () => {
    if (!excelFile) {
      alert('파일을 선택해주세요.');
      return;
    }
    
    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      
      // TODO: 엑셀 일괄 등록 기능을 Supabase Edge Function에 구현 필요
      alert('엑셀 일괄 등록 기능은 현재 마이그레이션 중입니다.');
      return;
      // const response = await api.post('/members/bulk-import', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });

      // alert(`총 ${response.data.imported_count}명의 교인이 성공적으로 등록되었습니다.`);
      setShowExcelImportModal(false);
      setExcelFile(null);
      fetchMembers(); // 목록 새로고침
    } catch (error: any) {
      console.error('엑셀 등록 실패:', error);
      const errorMessage = error.response?.data?.detail || '엑셀 등록에 실패했습니다.';
      alert(`엑셀 등록 실패: ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활동';
      case 'inactive': return '비활동';
      case 'transferred': return '이전';
      default: return status;
    }
  };

  // Clean photo URL - handle both relative and absolute URLs
  const cleanPhotoUrl = (url: string | null) => {
    if (!url) return null;
    // Remove trailing '?' if present
    const cleanedUrl = url.endsWith('?') ? url.slice(0, -1) : url;
    
    // If it's already a full URL (starts with http:// or https://), return as-is
    if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
      return cleanedUrl;
    }
    
    // Otherwise, prepend the API base URL
    return `${process.env.REACT_APP_API_URL}${cleanedUrl}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">교인 관리</h2>
        <div className="flex gap-2">
          <Button 
            onClick={downloadExcelTemplate}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            엑셀 템플릿 다운로드
          </Button>
          <Button
            onClick={() => setShowExcelImportModal(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            엑셀 일괄 등록
          </Button>
          <Button
            onClick={() => setShowAddMemberModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            교인 추가
          </Button>
        </div>
      </div>


      {/* Search and Filter */}
      <Card className="border-muted">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-foreground mb-1">검색</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="이름 또는 전화번호 (초성 검색 가능: ㄱㅊㅅ)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  검색
                </Button>
                {appliedSearchTerm && (
                  <Button
                    onClick={handleClearSearch}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    전체보기
                  </Button>
                )}
                <Button
                  onClick={() => setShowAdvancedSearch(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  상세검색
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">상태</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">활동</SelectItem>
                  <SelectItem value="inactive">비활동</SelectItem>
                  <SelectItem value="transferred">이전</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchMembers}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </Button>
            </div>
          </div>
          
          {/* Total Count Display */}
          <div className="flex justify-end items-center border-t border-border pt-4">
            <div className="text-sm text-muted-foreground">
              전체 {pagination.total_count}명
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Display */}
      <Card className="border-muted overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-muted/50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center gap-1">
                    이름
                    {sortField === 'name' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('gender')}
                >
                  <span className="flex items-center gap-1">
                    성별
                    {sortField === 'gender' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('phone')}
                >
                  <span className="flex items-center gap-1">
                    전화번호
                    {sortField === 'phone' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('position')}
                >
                  <span className="flex items-center gap-1">
                    직분
                    {sortField === 'position' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('district')}
                >
                  <span className="flex items-center gap-1">
                    구역
                    {sortField === 'district' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('member_status')}
                >
                  <span className="flex items-center gap-1">
                    상태
                    {sortField === 'member_status' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30 cursor-pointer" 
                    onClick={() => handleMemberClick(member)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {cleanPhotoUrl(member.profile_photo_url) ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={cleanPhotoUrl(member.profile_photo_url)!}
                            alt={member.name}
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
                        <div className={`h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center ${cleanPhotoUrl(member.profile_photo_url) ? 'hidden' : ''}`}>
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {getGenderText(member.gender)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {member.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {member.position || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {member.district || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(member.member_status)}>
                      {getStatusText(member.member_status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {members.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">등록된 교인이 없습니다.</p>
        </div>
      )}

      {/* Pagination 사용 */}
      <div className="mt-6">
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
              <label className="block text-sm font-medium text-foreground mb-1">이름 *</label>
              <Input
                type="text"
                required
                value={newMember.name}
                onChange={(e) => setNewMember({...newMember, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">이메일 *</label>
              <Input
                type="email"
                required
                placeholder="example@email.com"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">이메일로 임시 비밀번호가 발송됩니다.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">성별</label>
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
              <label className="block text-sm font-medium text-foreground mb-1">생년월일</label>
              <Input
                type="date"
                value={newMember.birthdate}
                onChange={(e) => setNewMember({...newMember, birthdate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">전화번호 *</label>
              <Input
                type="tel"
                required
                placeholder="010-1234-5678"
                value={newMember.phone}
                onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">주소</label>
              <Input
                type="text"
                value={newMember.address}
                onChange={(e) => setNewMember({...newMember, address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">직분</label>
              <Input
                type="text"
                placeholder="집사, 권사, 장로 등"
                value={newMember.position}
                onChange={(e) => setNewMember({...newMember, position: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">구역</label>
              <Input
                type="text"
                placeholder="1구역, 2구역 등"
                value={newMember.district}
                onChange={(e) => setNewMember({...newMember, district: e.target.value})}
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
              <label className="block text-sm font-medium text-foreground mb-2">
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
              <p className="text-xs text-muted-foreground mt-1">
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
                  <label className="block text-sm font-medium text-foreground">이메일</label>
                  <p className="mt-1 text-sm text-foreground">{passwordInfo.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">비밀번호</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordInfo.password}
                      readOnly
                      className="flex-1 bg-muted"
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    disabled={smsLoading === selectedMember?.id || !selectedMember?.phone}
                  >
                    {smsLoading === selectedMember?.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    초대
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
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                      관리자 지정
                    </Button>
                  )}

                  <Button
                    onClick={handleEditMember}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Edit3 className="w-4 h-4" />
                    수정
                  </Button>
                  <Button
                    onClick={handleDeleteClick}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </Button>
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
            <div className="space-y-8">
              {/* Profile Photo & Status Section */}
              <div className="text-center">
                <div className="relative inline-block">
                  {cleanPhotoUrl(selectedMember.profile_photo_url) ? (
                    <img
                      src={cleanPhotoUrl(selectedMember.profile_photo_url)!}
                      alt={selectedMember.name}
                      className="h-32 w-32 rounded-full object-cover mx-auto border-4 border-border"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center mx-auto border-4 border-border">
                      <User className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Photo upload button in edit mode */}
                  {isEditMode && (
                    <div className="absolute -bottom-2 -right-2">
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
                        className="bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-lg hover:bg-primary/90 flex items-center justify-center"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Badge variant={getStatusBadgeVariant(selectedMember.member_status)} className="text-sm px-3 py-1">
                    {getStatusText(selectedMember.member_status)}
                  </Badge>
                  {selectedMember.registration_date && (
                    <span className="text-sm text-muted-foreground">
                      등록일: {new Date(selectedMember.registration_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      기본 정보
                    </h3>
                    <div className="space-y-4">
                      {/* 이름 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">이름</label>
                        {isEditMode ? (
                          <Input
                            value={editedMember.name || ''}
                            onChange={(e) => setEditedMember({...editedMember, name: e.target.value})}
                            placeholder="홍길동"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{selectedMember.name}</p>
                        )}
                      </div>

                      {/* 영문명 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">영문명</label>
                        {isEditMode ? (
                          <Input
                            value={editedMember.name_eng || ''}
                            onChange={(e) => setEditedMember({...editedMember, name_eng: e.target.value})}
                            placeholder="Hong Gil Dong"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{selectedMember.name_eng || '-'}</p>
                        )}
                      </div>

                      {/* 이메일 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">이메일</label>
                        {isEditMode ? (
                          <Input
                            type="email"
                            value={editedMember.email || ''}
                            onChange={(e) => setEditedMember({...editedMember, email: e.target.value})}
                            placeholder="example@email.com"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                        )}
                      </div>

                      {/* 전화번호 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">전화번호</label>
                        {isEditMode ? (
                          <Input
                            type="tel"
                            value={editedMember.phone || ''}
                            onChange={(e) => setEditedMember({...editedMember, phone: e.target.value})}
                            placeholder="010-1234-5678"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{selectedMember.phone}</p>
                        )}
                      </div>

                      {/* 성별 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">성별</label>
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
                          <p className="text-sm text-muted-foreground">{selectedMember.gender}</p>
                        )}
                      </div>

                      {/* 생년월일 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">생년월일</label>
                        {isEditMode ? (
                          <Input
                            type="date"
                            value={editedMember.birthdate || ''}
                            onChange={(e) => setEditedMember({...editedMember, birthdate: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{selectedMember.birthdate || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 교회 정보 */}
                  <div className="bg-primary/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      교회 정보
                    </h3>
                    <div className="space-y-4">
                      {/* 직분 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">직분</label>
                        {isEditMode ? (
                          <Input
                            value={editedMember.position || ''}
                            onChange={(e) => setEditedMember({...editedMember, position: e.target.value})}
                            placeholder="집사, 권사, 장로 등"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{selectedMember.position || '-'}</p>
                        )}
                      </div>

                      {/* 구역 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">구역</label>
                        {isEditMode ? (
                          <Input
                            value={editedMember.district || ''}
                            onChange={(e) => setEditedMember({...editedMember, district: e.target.value})}
                            placeholder="1구역, 2구역 등"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{selectedMember.district || '-'}</p>
                        )}
                      </div>

                      {/* 부서 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">부서</label>
                        {isEditMode ? (
                          <Select value={editedMember.department_code || ''} onValueChange={(value) => setEditedMember({...editedMember, department_code: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="부서 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WORSHIP">예배부</SelectItem>
                              <SelectItem value="EDUCATION">교육부</SelectItem>
                              <SelectItem value="MISSION">선교부</SelectItem>
                              <SelectItem value="YOUTH">청년부</SelectItem>
                              <SelectItem value="CHILDREN">아동부</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {selectedMember.department_code ? 
                              ({'WORSHIP': '예배부', 'EDUCATION': '교육부', 'MISSION': '선교부', 'YOUTH': '청년부', 'CHILDREN': '아동부'}[selectedMember.department_code] || selectedMember.department_code) 
                              : '-'
                            }
                          </p>
                        )}
                      </div>

                      {/* 직분 코드 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">직분 분류</label>
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
                          <p className="text-sm text-muted-foreground">
                            {selectedMember.position_code ? 
                              ({'PASTOR': '목사', 'ELDER': '장로', 'DEACON': '집사', 'TEACHER': '교사', 'LEADER': '부장/회장'}[selectedMember.position_code] || selectedMember.position_code) 
                              : '-'
                            }
                          </p>
                        )}
                      </div>

                      {/* 임명일 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">임명일</label>
                        {isEditMode ? (
                          <Input
                            type="date"
                            value={editedMember.appointed_on || ''}
                            onChange={(e) => setEditedMember({...editedMember, appointed_on: e.target.value})}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{selectedMember.appointed_on || '-'}</p>
                        )}
                      </div>

                      {/* 안수교회 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">안수교회</label>
                        {isEditMode ? (
                          <Input
                            value={editedMember.ordination_church || ''}
                            onChange={(e) => setEditedMember({...editedMember, ordination_church: e.target.value})}
                            placeholder="중앙교회"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{selectedMember.ordination_church || '-'}</p>
                        )}
                      </div>

                      {/* 상태 */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">상태</label>
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
                          <p className="text-sm text-muted-foreground">{getStatusText(selectedMember.member_status)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 사역 및 직업 정보 */}
              <div className="bg-blue-50/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  사역 및 직업 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 직업 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직업</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.job_title || ''}
                        onChange={(e) => setEditedMember({...editedMember, job_title: e.target.value})}
                        placeholder="회사원, 교사 등"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{selectedMember.job_title || '-'}</p>
                    )}
                  </div>

                  {/* 직장명 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직장명</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.workplace || ''}
                        onChange={(e) => setEditedMember({...editedMember, workplace: e.target.value})}
                        placeholder="삼성전자"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{selectedMember.workplace || '-'}</p>
                    )}
                  </div>

                  {/* 직장 전화번호 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직장 전화번호</label>
                    {isEditMode ? (
                      <Input
                        type="tel"
                        value={editedMember.workplace_phone || ''}
                        onChange={(e) => setEditedMember({...editedMember, workplace_phone: e.target.value})}
                        placeholder="02-1234-5678"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{selectedMember.workplace_phone || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 개인 및 가족 정보 */}
              <div className="bg-green-50/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  개인 및 가족 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 결혼 상태 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">결혼 상태</label>
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
                      <p className="text-sm text-muted-foreground">{selectedMember.marital_status || '-'}</p>
                    )}
                  </div>

                  {/* 배우자 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">배우자 이름</label>
                    {isEditMode ? (
                      <Input
                        value={editedMember.spouse_name || ''}
                        onChange={(e) => setEditedMember({...editedMember, spouse_name: e.target.value})}
                        placeholder="배우자 이름"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{selectedMember.spouse_name || '-'}</p>
                    )}
                  </div>

                  {/* 결혼일 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">결혼일</label>
                    {isEditMode ? (
                      <Input
                        type="date"
                        value={editedMember.married_on || ''}
                        onChange={(e) => setEditedMember({...editedMember, married_on: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{selectedMember.married_on || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 주소 정보 */}
              <div className="bg-yellow-50/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  주소 정보
                </h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">주소</label>
                  {isEditMode ? (
                    <Textarea
                      value={editedMember.address || ''}
                      onChange={(e) => setEditedMember({...editedMember, address: e.target.value})}
                      placeholder="상세 주소 입력"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedMember.address || '-'}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!isEditMode && (
                <div className="flex gap-3 pt-6 border-t border-border">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPhotoModal(true);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    사진 관리
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/qr-management');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    QR 코드
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetPassword(selectedMember.id);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    비밀번호 조회
                  </Button>
                </div>
              )}
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
            <p className="text-sm text-foreground">
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

      {/* Excel Import Modal */}
      <Dialog open={showExcelImportModal} onOpenChange={setShowExcelImportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              엑셀 일괄 등록
            </DialogTitle>
            <DialogDescription>
              엑셀 파일을 사용하여 여러 교인을 한번에 등록할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>안내:</strong> 엑셀 템플릿을 먼저 다운로드하여 작성한 후 업로드해주세요.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                엑셀 파일 선택
              </label>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setExcelFile(file);
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
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
            
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setShowExcelImportModal(false);
                  setExcelFile(null);
                }}
                variant="outline"
                disabled={isImporting}
              >
                취소
              </Button>
              <Button
                onClick={handleExcelImport}
                disabled={!excelFile || isImporting}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    등록 중...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    등록 시작
                  </>
                )}
              </Button>
            </div>
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
                  <label className="block text-sm font-medium text-foreground mb-1">이름</label>
                  <Input
                    value={advancedSearchData.name}
                    onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">이메일</label>
                  <Input
                    value={advancedSearchData.email}
                    onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">전화번호</label>
                  <Input
                    value={advancedSearchData.phone}
                    onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="010-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">성별</label>
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
                  <label className="block text-sm font-medium text-foreground mb-1">직분</label>
                  <Input
                    value={advancedSearchData.position}
                    onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="집사, 권사, 장로 등"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">구역</label>
                  <Input
                    value={advancedSearchData.district}
                    onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, district: e.target.value }))}
                    placeholder="1구역, 2구역 등"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">교인구분</label>
                  <Select value={advancedSearchData.member_type} onValueChange={(value) => setAdvancedSearchData(prev => ({ ...prev, member_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="정교인">정교인</SelectItem>
                      <SelectItem value="학습교인">학습교인</SelectItem>
                      <SelectItem value="세례교인">세례교인</SelectItem>
                      <SelectItem value="방문자">방문자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">신급</label>
                  <Select value={advancedSearchData.spiritual_grade} onValueChange={(value) => setAdvancedSearchData(prev => ({ ...prev, spiritual_grade: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="초신자">초신자</SelectItem>
                      <SelectItem value="B급">B급</SelectItem>
                      <SelectItem value="A급">A급</SelectItem>
                      <SelectItem value="리더">리더</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 나이 범위 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">나이 범위</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">최소 나이</label>
                  <Input
                    type="number"
                    value={advancedSearchData.ageFrom}
                    onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, ageFrom: e.target.value }))}
                    placeholder="0"
                    min="0"
                    max="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">최대 나이</label>
                  <Input
                    type="number"
                    value={advancedSearchData.ageTo}
                    onChange={(e) => setAdvancedSearchData(prev => ({ ...prev, ageTo: e.target.value }))}
                    placeholder="120"
                    min="0"
                    max="120"
                  />
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
                  position: '',
                  district: '',
                  ageFrom: '',
                  ageTo: '',
                  member_type: 'all',
                  spiritual_grade: 'all'
                });
              }}
              variant="outline"
            >
              초기화
            </Button>
            <Button
              onClick={() => {
                setShowAdvancedSearch(false);
                // TODO: 실제 상세 검색 실행 로직 구현
                console.log('Advanced search with:', advancedSearchData);
              }}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              검색 실행
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <AddMemberModal
        open={showAddMemberModal}
        onOpenChange={setShowAddMemberModal}
        onMemberAdded={fetchMembers}
      />

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
    </div>
  );
};

export default MemberManagement;