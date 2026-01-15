import React, { useState, useEffect } from 'react';
import { Button } from "./ui";
import { Input } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui";
import { Textarea } from "./ui";
import { DatePicker } from "./ui";
import {
  ContactRound,
  Briefcase,
  Church,
  Heart,
  Plus,
  Trash2,
  UserPlus,
  MapPin,
  Save,
  X,
  Camera,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { activityLogger } from '../services/activityLogger';
import { organizationService } from '../services/organizationService';
import { ChurchOrganization } from '../types/organization';
import { supabase } from '../lib/supabase';
import { ADMIN_POSITION_OPTIONS } from '../constants/memberPositions';

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberAdded?: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  open,
  onOpenChange,
  onMemberAdded
}) => {
  console.log('🔥 AddMemberModal 컴포넌트 로드됨');
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<ChurchOrganization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [members, setMembers] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInviteMessage, setShowInviteMessage] = useState(false);
  const [inviteMessageData, setInviteMessageData] = useState({ email: '', name: '' });
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  
  const [formData, setFormData] = useState({
    // 기본 정보
    name: '', name_eng: '', email: '', gender: '남', birthdate: '', birthdate_type: '양력', phone: '',
    // 사역 정보
    position_main: 'MEMBER', position_detail: '', organization_id: '', department: '', position_code: '', appointed_on: '',
    ordination_church: '', workplace: '', workplace_phone: '',
    // 개인 정보
    address: '', marital_status: '', spouse_name: '', married_on: '',
    // 새로 추가된 필드들
    // 교회 정보
    member_type: '', confirmation_date: '', sub_district: '', age_group: '',
    // 지역 정보
    region_1: '', region_2: '', region_3: '', postal_code: '',
    // 인도자 정보
    inviter3_member_id: '',
    // 연락 정보
    last_contact_date: '',
    // 신앙 정보
    spiritual_grade: '',
    // 직업 정보 확장
    job_category: '', job_detail: '', job_position: '', job_title: '',
    // 사역 정보 확장
    ministry_start_date: '', neighboring_church: '', position_decision: '', daily_activity: '',
    // 자유 필드
    custom_field_1: '', custom_field_2: '', custom_field_3: '', custom_field_4: '',
    custom_field_5: '', custom_field_6: '', custom_field_7: '', custom_field_8: '',
    custom_field_9: '', custom_field_10: '', custom_field_11: '', custom_field_12: '',
    // 특별 사항
    special_notes: ''
  });

  // 코드 데이터
  const maritalStatuses = [
    { value: '미혼', label: '미혼' },
    { value: '기혼', label: '기혼' },
    { value: '이혼', label: '이혼' },
    { value: '사별', label: '사별' }
  ];

  // 새로 추가된 드롭다운 옵션들
  const memberTypeOptions = [
    { value: '정교인', label: '정교인' },
    { value: '학습교인', label: '학습교인' },
    { value: '세례교인', label: '세례교인' },
    { value: '방문자', label: '방문자' }
  ];

  const ageGroupOptions = [
    { value: '어린이', label: '어린이 (0-12세)' },
    { value: '학생', label: '학생 (13-19세)' },
    { value: '청년', label: '청년 (20-35세)' },
    { value: '성인', label: '성인 (36-65세)' },
    { value: '시니어', label: '시니어 (65세+)' }
  ];

  const spiritualGradeOptions = [
    { value: '초신자', label: '초신자' },
    { value: 'B급', label: 'B급' },
    { value: 'A급', label: 'A급' },
    { value: '리더', label: '리더' }
  ];

  const jobCategoryOptions = [
    { value: '사무직', label: '사무직' },
    { value: '교육직', label: '교육직' },
    { value: '의료진', label: '의료진' },
    { value: '서비스업', label: '서비스업' },
    { value: '자영업', label: '자영업' },
    { value: '학생', label: '학생' },
    { value: '주부', label: '주부' },
    { value: '기타', label: '기타' }
  ];

  const isFormValid = () => {
    return formData.name && formData.email && formData.phone;
  };

  // 초대 메시지 생성 함수
  const generateInviteMessage = (name: string, email: string) => {
    const appUrl = process.env.REACT_APP_PRODUCTION_URL || 'https://churchround.com';
    return `[Church Round 교인 초대]

${name}님, 안녕하세요!
Church Round 앱에 초대되셨습니다.

📱 앱 다운로드:
- iOS: App Store에서 "Church Round" 검색
- Android: Google Play에서 "Church Round" 검색

🔑 로그인 정보:
- 이메일: ${email}
- 임시 비밀번호: 이메일로 발송됨

⚠️ 첫 로그인 후 반드시 비밀번호를 변경해주세요.

앱 다운로드 링크: ${appUrl}/download

문의사항이 있으시면 담당자에게 연락주세요.`;
  };

  // 클립보드 복사 함수
  const handleCopyMessage = async () => {
    const message = generateInviteMessage(inviteMessageData.name, inviteMessageData.email);
    try {
      await navigator.clipboard.writeText(message);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
      alert('메시지 복사에 실패했습니다.');
    }
  };

  const handlePhotoUpload = (file: File) => {
    setProfilePhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
  };

  // Load organizations, departments, and members
  useEffect(() => {
    if (open) {
      loadOrganizations();
      loadDepartments();
      loadMembers();
    }
  }, [open]);

  const loadOrganizations = async () => {
    try {
      setLoadingOrganizations(true);
      const result = await supabaseAuthService.getCurrentUser();
      if (result?.user?.church_id) {
        const orgResult = await organizationService.getOrganizations(result.user.church_id);
        // Flatten the tree structure
        const flatOrgs = flattenOrganizations(orgResult.organizations);
        setOrganizations(flatOrgs);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const result = await supabaseAuthService.getCurrentUser();
      if (result?.user?.church_id) {
        const { data, error } = await supabase
          .from('departments')
          .select('name')
          .eq('church_id', result.user.church_id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Error loading departments:', error);
        } else {
          setDepartments(data?.map(d => d.name) || []);
        }
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const result = await supabaseAuthService.getCurrentUser();
      if (result?.user?.church_id) {
        const { data, error } = await supabase
          .from('members')
          .select('id, name')
          .eq('church_id', result.user.church_id)
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error loading members:', error);
        } else {
          setMembers(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

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

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      name: '', name_eng: '', email: '', gender: '남', birthdate: '', birthdate_type: '양력', phone: '',
      position_main: 'MEMBER', position_detail: '', organization_id: '', department: '', position_code: '', appointed_on: '',
      ordination_church: '', workplace: '', workplace_phone: '',
      address: '', marital_status: '', spouse_name: '', married_on: '',
      // 새로 추가된 필드들 리셋
      member_type: '', confirmation_date: '', sub_district: '', age_group: '',
      region_1: '', region_2: '', region_3: '', postal_code: '',
      inviter3_member_id: '', last_contact_date: '', spiritual_grade: '',
      job_category: '', job_detail: '', job_position: '', job_title: '',
      ministry_start_date: '', neighboring_church: '', position_decision: '', daily_activity: '',
      custom_field_1: '', custom_field_2: '', custom_field_3: '', custom_field_4: '',
      custom_field_5: '', custom_field_6: '', custom_field_7: '', custom_field_8: '',
      custom_field_9: '', custom_field_10: '', custom_field_11: '', custom_field_12: '',
      special_notes: ''
    });
    // Reset photo states
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    onOpenChange(false);
  };

  const handleCloseInviteMessage = () => {
    setShowInviteMessage(false);
    setCopySuccess(false);
    setIsExistingUser(false);
    handleClose();
    if (onMemberAdded) onMemberAdded();
  };

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit 함수 시작');
    console.log('📋 formData:', formData);

    if (!isFormValid()) {
      alert('필수 정보를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 현재 사용자의 church_id 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998;

      // 인원 제한 체크 제거 - 모든 교회에서 무제한 등록 가능
      const memberData = {
        // 기본 정보
        name: formData.name,
        name_eng: formData.name_eng || null,
        email: formData.email || null,
        gender: formData.gender || null,
        birthdate: formData.birthdate || null,
        birthdate_type: formData.birthdate_type || '양력',
        phone: formData.phone || null,
        address: formData.address || null,

        // 교회 정보
        position_main: formData.position_main || null,
        position_detail: formData.position_detail || null,
        organization_id: formData.organization_id || null,
        department: formData.department || null,
        appointed_on: formData.appointed_on || null,
        ordination_church: formData.ordination_church || null,

        // 직장 정보
        workplace: formData.workplace || null,
        workplace_phone: formData.workplace_phone || null,

        // 개인 및 가족 정보
        marital_status: formData.marital_status || null,
        spouse_name: formData.spouse_name || null,
        married_on: formData.married_on || null,

        status: 'active',  // 신규 등록 시 항상 활동 상태

        // 새로 추가된 25개 필드들
        // 교회 정보 확장
        member_type: formData.member_type || null,
        confirmation_date: formData.confirmation_date || null,
        sub_district: formData.sub_district || null,
        age_group: formData.age_group || null,

        // 지역 정보
        region_1: formData.region_1 || null,
        region_2: formData.region_2 || null,
        region_3: formData.region_3 || null,
        postal_code: formData.postal_code || null,

        // 인도자 정보
        inviter3_member_id: formData.inviter3_member_id ? parseInt(formData.inviter3_member_id) : null,

        // 연락 정보
        last_contact_date: formData.last_contact_date || null,

        // 신앙 정보
        spiritual_grade: formData.spiritual_grade || null,

        // 직업 정보 확장
        job_category: formData.job_category || null,
        job_detail: formData.job_detail || null,
        job_position: formData.job_position || null,
        job_title: formData.job_title || null,

        // 사역 정보 확장
        ministry_start_date: formData.ministry_start_date || null,
        neighboring_church: formData.neighboring_church || null,
        position_decision: formData.position_decision || null,
        daily_activity: formData.daily_activity || null,

        // 자유 필드들 (12개)
        custom_field_1: formData.custom_field_1 || null,
        custom_field_2: formData.custom_field_2 || null,
        custom_field_3: formData.custom_field_3 || null,
        custom_field_4: formData.custom_field_4 || null,
        custom_field_5: formData.custom_field_5 || null,
        custom_field_6: formData.custom_field_6 || null,
        custom_field_7: formData.custom_field_7 || null,
        custom_field_8: formData.custom_field_8 || null,
        custom_field_9: formData.custom_field_9 || null,
        custom_field_10: formData.custom_field_10 || null,
        custom_field_11: formData.custom_field_11 || null,
        custom_field_12: formData.custom_field_12 || null,

        // 특별 사항
        special_notes: formData.special_notes || null
      };

      // church_id를 포함한 최종 멤버 데이터 생성
      const finalMemberData = {
        ...memberData,
        church_id: userChurchId
      };

      const response = await supabaseApiService.members.create(finalMemberData);
      const newMemberId = response.data.id;
      
      // 교인 생성 로그 기록
      activityLogger.logMemberCreate(finalMemberData);
      
      // Upload profile photo if selected
      if (profilePhoto && newMemberId) {
        try {
          // Generate unique file path
          const fileExt = profilePhoto.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `members/${newMemberId}/${fileName}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('member-photos')
            .upload(filePath, profilePhoto, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('member-photos')
            .getPublicUrl(filePath);

          // Update member record with photo URL
          await supabaseApiService.members.update({
            id: newMemberId,
            profile_photo_url: publicUrl
          });

          // 사진 업로드 로그 기록
          activityLogger.log({
            action: 'create',
            resource: 'member',
            target_id: newMemberId,
            target_name: memberData.name,
            page_path: '/member-management',
            page_name: '교인 등록 - 프로필 사진 업로드',
            details: { photo_uploaded: true, file_name: profilePhoto.name, file_size: profilePhoto.size }
          });
        } catch (photoError) {
          console.warn('사진 업로드 실패:', photoError);
          // 사진 업로드 실패는 경고만 표시하고 교인 등록은 성공으로 처리
        }
      }

      // 이메일로 초대 - users 테이블에 사용자 생성 및 임시 비밀번호 발송
      if (formData.email) {
        try {
          console.log('👤 [교인 초대] 시작:', { email: formData.email, name: formData.name });

          // 1. 임시 비밀번호 생성 (8자리: 대소문자 + 숫자)
          const generateTempPassword = (): string => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let password = '';
            for (let i = 0; i < 8; i++) {
              password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
          };
          const temporaryPassword = generateTempPassword();

          // 2. invite-user Edge Function 호출 - users 테이블에 사용자 생성
          console.log('👤 [invite-user] Edge Function 호출');
          const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-user', {
            body: {
              email: formData.email,
              temporaryPassword: temporaryPassword,
              memberData: {
                name: formData.name,
                church_id: userChurchId,
                member_id: newMemberId
              }
            }
          });

          if (inviteError) {
            console.error('👤 [invite-user] 실패:', inviteError);
            throw new Error('사용자 계정 생성 실패: ' + inviteError.message);
          }
          console.log('✅ [invite-user] 성공:', inviteData);
          console.log('📊 [invite-user] 응답 데이터 전체:', JSON.stringify(inviteData, null, 2));

          // 기존 사용자 계정과 연결된 경우 체크 (플래그 우선, 메시지는 fallback)
          const isExisting = inviteData?.is_existing_user === true ||
                            inviteData?.message?.includes('기존 사용자 계정과 연결');

          if (isExisting) {
            console.log('⚠️ 이미 users 테이블에 존재하는 사용자입니다.');
            console.log('⚠️ 기존 계정이므로 임시 비밀번호 이메일을 발송하지 않습니다.');
            setIsExistingUser(true);
          } else {
            console.log('✅ 신규 사용자 생성 → 임시 비밀번호 이메일 발송');
            setIsExistingUser(false);

            // 3. send-temp-password Edge Function 호출 - 이메일 발송 (신규 사용자만)
            console.log('📧 [send-temp-password] Edge Function 호출');
            const { data: emailData, error: emailError } = await supabase.functions.invoke('send-temp-password', {
              body: {
                email: formData.email,
                temporary_password: temporaryPassword,
                contact_person: formData.name,
                organization_name: 'Church Round' // TODO: 실제 교회명으로 교체
              }
            });

            if (emailError) {
              console.error('📧 [send-temp-password] 실패:', emailError);
              console.warn('이메일 발송 실패했지만 사용자 계정은 생성됨');
            } else {
              console.log('✅ [send-temp-password] 성공:', emailData);
            }
          }
        } catch (inviteError) {
          console.error('❌ [교인 초대] 전체 실패:', inviteError);
          // 초대 실패는 경고만 표시하고 교인 등록은 성공으로 처리
          alert('교인은 등록되었지만 초대 이메일 발송에 실패했습니다. 나중에 다시 초대해주세요.');
        }
      }

      // 초대 메시지 데이터 설정 및 모달 표시
      setInviteMessageData({ email: formData.email, name: formData.name });
      setShowInviteMessage(true);
    } catch (error) {
      console.error('교인 추가 실패:', error);
      alert('교인 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between mb-2">
              <DialogTitle className="flex items-center gap-2 flex-1">
                <UserPlus className="w-5 h-5" />
                새 교인 등록
              </DialogTitle>
            </div>
            <div className="flex justify-end gap-2 -mt-2 mb-4">
              <Button
                onClick={handleClose}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                취소
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !isFormValid()}
                size="sm"
                className="flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                {loading ? '등록 중...' : '등록 완료'}
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* 프로필 사진 */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-4">프로필 사진</h3>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {profilePhotoPreview ? (
                    <img
                      src={profilePhotoPreview}
                      alt="프로필 미리보기"
                      className="h-32 w-32 rounded-full object-cover border-4 border-border"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                      <UserPlus className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePhotoUpload(file);
                      }
                    }}
                    className="hidden"
                    id="add-member-photo-upload"
                  />
                  <label
                    htmlFor="add-member-photo-upload"
                    className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                  >
                    <Camera className="w-4 h-4" />
                    사진 선택
                  </label>
                  
                  {profilePhotoPreview && (
                    <Button
                      onClick={handleRemovePhoto}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      제거
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 기본 정보 */}
            <details open className="border rounded-lg group">
              <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ContactRound className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    기본 정보 <span className="text-red-500">*</span>
                  </h3>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">이름 *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="홍길동"
                    />
                  </div>

                  {/* 영문명 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">영문명</label>
                    <Input
                      value={formData.name_eng}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_eng: e.target.value }))}
                      placeholder="Hong Gil Dong"
                    />
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">이메일 *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="example@email.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">이메일로 임시 비밀번호가 발송됩니다.</p>
                  </div>

                  {/* 전화번호 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">전화번호 *</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="010-1234-5678"
                    />
                  </div>

                  {/* 성별 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">성별</label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="남">남</SelectItem>
                        <SelectItem value="여">여</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 생년월일 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">생년월일</label>
                    <DatePicker
                      value={formData.birthdate}
                      onChange={(value) => setFormData(prev => ({ ...prev, birthdate: value }))}
                      placeholder="생년월일 선택"
                      disableFuture={true}
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                    />
                  </div>

                  {/* 생년월일 구분 (양력/음력) */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">생년월일 구분</label>
                    <Select value={formData.birthdate_type} onValueChange={(value) => setFormData(prev => ({ ...prev, birthdate_type: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="양력">양력</SelectItem>
                        <SelectItem value="음력">음력</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 주소 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">주소</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="서울시 강남구 역삼동 123-45"
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* 교회 정보 */}
            <details open className="border rounded-lg group">
              <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Church className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    교회 정보
                  </h3>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 직분 대분류 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직분 대분류</label>
                    <Select
                      value={formData.position_main}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        position_main: value,
                        position_detail: '' // 대분류 변경 시 세부 초기화
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ADMIN_POSITION_OPTIONS.map((option) => (
                          <SelectItem key={option.mainValue} value={option.mainValue}>
                            {option.mainLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 직분 세부 (대분류 선택 시에만 표시) */}
                  {formData.position_main && (() => {
                    const selectedOption = ADMIN_POSITION_OPTIONS.find(opt => opt.mainValue === formData.position_main);
                    if (!selectedOption || selectedOption.details.length === 0) return null;

                    return (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">세부 직분</label>
                        <Select
                          value={formData.position_detail}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, position_detail: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="세부 직분 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedOption.details.map((detail) => (
                              <SelectItem key={detail.value} value={detail.value}>
                                {detail.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })()}

                  {/* 조직 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">조직</label>
                    <Select
                      value={formData.organization_id || 'none'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, organization_id: value === 'none' ? '' : value }))}
                      disabled={loadingOrganizations}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingOrganizations ? "조직 불러오는 중..." : "조직 선택"} />
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
                  </div>

                  {/* 부서 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">부서</label>
                    <Select
                      value={formData.department || 'none'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, department: value === 'none' ? '' : value }))}
                    >
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
                  </div>

                  {/* 임명일 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">임명일</label>
                    <DatePicker
                      value={formData.appointed_on}
                      onChange={(value) => setFormData(prev => ({ ...prev, appointed_on: value }))}
                      placeholder="임명일 선택"
                      fromYear={1950}
                      toYear={new Date().getFullYear() + 5}
                    />
                  </div>

                  {/* 안수교회 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">안수교회</label>
                    <Input
                      value={formData.ordination_church}
                      onChange={(e) => setFormData(prev => ({ ...prev, ordination_church: e.target.value }))}
                      placeholder="안수받은 교회"
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* 개인 및 가족 정보 */}
            <details className="border rounded-lg group">
              <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    개인 및 가족 정보
                  </h3>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 결혼 상태 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">결혼 상태</label>
                    <Select value={formData.marital_status} onValueChange={(value) => setFormData(prev => ({ ...prev, marital_status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {maritalStatuses.map(status => (
                          <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 배우자 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">배우자 이름</label>
                    <Input
                      value={formData.spouse_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, spouse_name: e.target.value }))}
                      placeholder="배우자 이름"
                    />
                  </div>

                  {/* 결혼일 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">결혼일</label>
                    <DatePicker
                      value={formData.married_on}
                      onChange={(value) => setFormData(prev => ({ ...prev, married_on: value }))}
                      placeholder="결혼일 선택"
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* 교회 정보 확장 */}
            <details className="border rounded-lg group">
              <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Church className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    교회 정보 확장
                  </h3>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 교인구분 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">교인구분</label>
                    <Select value={formData.member_type} onValueChange={(value) => setFormData(prev => ({ ...prev, member_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="구분 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberTypeOptions.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 입교일 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">입교일</label>
                    <DatePicker
                      value={formData.confirmation_date}
                      onChange={(value) => setFormData(prev => ({ ...prev, confirmation_date: value }))}
                      placeholder="입교일 선택"
                    />
                  </div>

                  {/* 나이그룹 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">나이그룹</label>
                    <Select value={formData.age_group} onValueChange={(value) => setFormData(prev => ({ ...prev, age_group: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="그룹 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {ageGroupOptions.map(age => (
                          <SelectItem key={age.value} value={age.value}>{age.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 신급 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">신급</label>
                    <Select value={formData.spiritual_grade} onValueChange={(value) => setFormData(prev => ({ ...prev, spiritual_grade: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="신급 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {spiritualGradeOptions.map(grade => (
                          <SelectItem key={grade.value} value={grade.value}>{grade.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 마지막 연락일 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">마지막 연락일</label>
                    <DatePicker
                      value={formData.last_contact_date}
                      onChange={(value) => setFormData(prev => ({ ...prev, last_contact_date: value }))}
                      placeholder="마지막 연락일 선택"
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* 직업 및 직장 정보 */}
            <details className="border rounded-lg group">
              <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    직업 정보
                  </h3>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 직업분류 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직업분류</label>
                    <Select value={formData.job_category} onValueChange={(value) => setFormData(prev => ({ ...prev, job_category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="분류 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobCategoryOptions.map(job => (
                          <SelectItem key={job.value} value={job.value}>{job.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 구체적 업무 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">구체적 업무</label>
                    <Input
                      value={formData.job_detail}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_detail: e.target.value }))}
                      placeholder="소프트웨어 개발, 초등학교 교사 등"
                    />
                  </div>

                  {/* 직책/직위 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직책/직위</label>
                    <Input
                      value={formData.job_position}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_position: e.target.value }))}
                      placeholder="팀장, 과장, 원장 등"
                    />
                  </div>

                  {/* 직업명 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직업명</label>
                    <Input
                      value={formData.job_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                      placeholder="회사원, 교사 등"
                    />
                  </div>

                  {/* 직장명 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직장명</label>
                    <Input
                      value={formData.workplace}
                      onChange={(e) => setFormData(prev => ({ ...prev, workplace: e.target.value }))}
                      placeholder="삼성전자"
                    />
                  </div>

                  {/* 직장 전화번호 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직장 전화번호</label>
                    <Input
                      type="tel"
                      value={formData.workplace_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, workplace_phone: e.target.value }))}
                      placeholder="02-1234-5678"
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* 사역 정보 확장 */}
            <details className="border rounded-lg group">
              <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Church className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    사역 정보 확장
                  </h3>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 사역 시작일 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">사역 시작일</label>
                    <DatePicker
                      value={formData.ministry_start_date}
                      onChange={(value) => setFormData(prev => ({ ...prev, ministry_start_date: value }))}
                      placeholder="사역 시작일 선택"
                    />
                  </div>

                  {/* 이웃교회 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">이웃교회</label>
                    <Input
                      value={formData.neighboring_church}
                      onChange={(e) => setFormData(prev => ({ ...prev, neighboring_church: e.target.value }))}
                      placeholder="은혜교회, 사랑교회 등"
                    />
                  </div>

                  {/* 직분 결정 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직분 결정</label>
                    <Input
                      value={formData.position_decision}
                      onChange={(e) => setFormData(prev => ({ ...prev, position_decision: e.target.value }))}
                      placeholder="장로 추천, 권사 임명 등"
                    />
                  </div>

                  {/* 인도자 (전도한 사람) */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">인도자</label>
                    <Select
                      value={formData.inviter3_member_id || 'none'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, inviter3_member_id: value === 'none' ? '' : value }))}
                      disabled={loadingMembers}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingMembers ? "교인 목록 불러오는 중..." : "인도자 선택"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">없음</SelectItem>
                        {members.map(member => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">이 교인을 전도하거나 교회로 인도한 사람</p>
                  </div>
                </div>

                {/* 일상 활동 */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-1">일상 활동</label>
                  <Textarea
                    value={formData.daily_activity}
                    onChange={(e) => setFormData(prev => ({ ...prev, daily_activity: e.target.value }))}
                    placeholder="새벽기도 참석, 구역모임 리더 등"
                    rows={3}
                  />
                </div>
              </div>
            </details>

            {/* 자유 필드 */}
            <details className="border rounded-lg group">
              <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    자유 필드 (커스텀 정보)
                  </h3>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 자유필드 1-6 */}
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <div key={num}>
                      <label className="block text-sm font-medium text-foreground mb-1">자유필드 {num}</label>
                      <Input
                        value={(formData as any)[`custom_field_${num}`]}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`custom_field_${num}`]: e.target.value }))}
                        placeholder={`추가 정보 ${num}`}
                      />
                    </div>
                  ))}
                </div>

                {/* 자유필드 7-12 (접을 수 있는 영역) */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-foreground mb-2">추가 자유필드 (7-12)</summary>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    {[7, 8, 9, 10, 11, 12].map(num => (
                      <div key={num}>
                        <label className="block text-sm font-medium text-foreground mb-1">자유필드 {num}</label>
                        <Input
                          value={(formData as any)[`custom_field_${num}`]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`custom_field_${num}`]: e.target.value }))}
                          placeholder={`추가 정보 ${num}`}
                        />
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </details>

            {/* 특별 사항 */}
            <details className="border rounded-lg group">
              <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ContactRound className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    특별 사항
                  </h3>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">개인 특별사항</label>
                  <Textarea
                    value={formData.special_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, special_notes: e.target.value }))}
                    placeholder="건강상 주의사항, 가족관계 특이사항 등"
                    rows={4}
                  />
                </div>
              </div>
            </details>
          </div>
        </DialogContent>
      </Dialog>

      {/* 초대 메시지 모달 */}
      <Dialog open={showInviteMessage} onOpenChange={handleCloseInviteMessage}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              교인 등록 완료 - 초대 메시지
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isExistingUser ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">✅ 교인 정보가 성공적으로 등록되었습니다!</p>
                  <p className="text-sm text-green-700 mt-1">기존 사용자 계정과 연결되었습니다.</p>
                </div>

                <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                  <p className="text-orange-900 font-semibold mb-1">⚠️ 주의: 기존 사용자 계정과 연결됨</p>
                  <p className="text-sm text-orange-800 mb-2">
                    이 이메일은 이미 users 테이블에 등록되어 있습니다.
                    새로운 계정이 생성되지 않고, 기존 계정과 이 교인 정보가 연결되었습니다.
                  </p>
                  <p className="text-sm text-orange-800">
                    <strong>※ 앱에서 이미 가입했거나, 이전에 초대받은 사용자입니다.</strong>
                  </p>
                  <p className="text-sm text-orange-800 mt-2">
                    <strong>※ 임시 비밀번호 이메일이 발송되지 않았습니다. 사용자는 기존 비밀번호로 로그인할 수 있습니다.</strong>
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✅ 교인 정보가 성공적으로 등록되었습니다!</p>
                <p className="text-sm text-green-700 mt-1">이메일로 임시 비밀번호가 발송되었습니다.</p>
              </div>
            )}

            {!isExistingUser && (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium mb-2">📱 이메일을 확인하지 못하는 경우</p>
                  <p className="text-sm text-yellow-700">
                    아래 메시지를 복사하여 휴대폰 문자나 카카오톡으로 전달해주세요.
                  </p>
                </div>

                <div className="bg-muted rounded-lg p-4 relative">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {generateInviteMessage(inviteMessageData.name, inviteMessageData.email)}
                  </pre>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              {!isExistingUser && (
                <Button
                  onClick={handleCopyMessage}
                  variant={copySuccess ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  {copySuccess ? (
                    <>
                      <span className="text-green-600">✓</span>
                      복사됨!
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      메시지 복사
                    </>
                  )}
                </Button>
              )}
              <Button onClick={handleCloseInviteMessage}>
                확인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddMemberModal;