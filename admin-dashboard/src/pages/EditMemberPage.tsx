import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "../components/ui";
import { Input } from "../components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui";
import { Textarea } from "../components/ui";
import { DatePicker } from "../components/ui";
import { Spinner } from "../components/ui/spinner";
import {
  ContactRound,
  Briefcase,
  Church,
  Heart,
  Plus,
  MapPin,
  Save,
  X,
  Camera,
  ChevronDown,
  ArrowLeft,
  Edit3,
} from 'lucide-react';
import { api } from '../services/api';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { activityLogger } from '../services/activityLogger';
import { organizationService } from '../services/organizationService';
import { ChurchOrganization } from '../types/organization';
import { supabase } from '../lib/supabase';
import { ADMIN_POSITION_OPTIONS } from '../constants/memberPositions';

interface Member {
  id: number;
  name: string;
  name_eng?: string;
  email: string;
  gender: string;
  birthdate: string | null;
  birthdate_type?: string;
  phone: string;
  address: string | null;
  position_main?: string | null;
  position_detail?: string | null;
  organization_id?: string | null;
  church_id: number;
  profile_photo_url: string | null;
  member_status: string;
  department?: string;
  appointed_on?: string;
  ordination_church?: string;
  workplace?: string;
  workplace_phone?: string;
  marital_status?: string;
  spouse_name?: string;
  married_on?: string;
  member_type?: string;
  confirmation_date?: string;
  sub_district?: string;
  age_group?: string;
  baptism_date?: string;
  baptism_church?: string;
  region_1?: string;
  region_2?: string;
  region_3?: string;
  postal_code?: string;
  inviter3_member_id?: number;
  last_contact_date?: string;
  spiritual_grade?: string;
  job_category?: string;
  job_detail?: string;
  job_position?: string;
  job_title?: string;
  ministry_start_date?: string;
  neighboring_church?: string;
  position_decision?: string;
  daily_activity?: string;
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
  special_notes?: string;
  children?: Array<{ id?: number; name: string; gender: string; birthdate: string; birthdate_type: string; notes: string }>;
}

const EditMemberPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<ChurchOrganization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [members, setMembers] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [member, setMember] = useState<Member | null>(null);

  const [formData, setFormData] = useState({
    // 기본 정보
    name: '', name_eng: '', email: '', gender: '남', birthdate: '', birthdate_type: '양력', phone: '',
    // 사역 정보
    position_main: 'MEMBER', position_detail: '', organization_id: '', department: '', position_code: '', appointed_on: '',
    ordination_church: '', workplace: '', workplace_phone: '',
    // 개인 정보
    address: '', marital_status: '', spouse_name: '', married_on: '',
    // 자녀 정보
    children: [] as { id?: number; name: string; gender: string; birthdate: string; birthdate_type: string; notes: string }[],
    // 새로 추가된 필드들
    member_type: '', confirmation_date: '', sub_district: '', age_group: '',
    baptism_date: '', baptism_church: '',
    region_1: '', region_2: '', region_3: '', postal_code: '',
    inviter3_member_id: '',
    last_contact_date: '',
    spiritual_grade: '',
    job_category: '', job_detail: '', job_position: '', job_title: '',
    ministry_start_date: '', neighboring_church: '', position_decision: '', daily_activity: '',
    custom_field_1: '', custom_field_2: '', custom_field_3: '', custom_field_4: '',
    custom_field_5: '', custom_field_6: '', custom_field_7: '', custom_field_8: '',
    custom_field_9: '', custom_field_10: '', custom_field_11: '', custom_field_12: '',
    special_notes: ''
  });

  // 코드 데이터
  const maritalStatuses = [
    { value: '미혼', label: '미혼' },
    { value: '기혼', label: '기혼' },
    { value: '이혼', label: '이혼' },
    { value: '사별', label: '사별' }
  ];

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

  // Helper functions for children array
  const addChild = () => setFormData(prev => ({ ...prev, children: [...prev.children, { name: '', gender: '남', birthdate: '', birthdate_type: '양력', notes: '' }] }));
  const removeChild = (index: number) => setFormData(prev => ({ ...prev, children: prev.children.filter((_, i) => i !== index) }));

  // Load member data
  useEffect(() => {
    if (id) {
      loadMemberData();
      loadOrganizations();
      loadDepartments();
      loadMembers();
    }
  }, [id]);

  const loadMemberData = async () => {
    try {
      setLoading(true);
      // Use supabase client directly to get member by ID
      const { data: memberData, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', parseInt(id!))
        .single();

      if (error) {
        throw error;
      }

      setMember(memberData);

      // Load children data
      const { data: childrenData, error: childrenError } = await supabase
        .from('member_children')
        .select('*')
        .eq('member_id', parseInt(id!))
        .order('id', { ascending: true });

      if (childrenError) {
        console.error('자녀 정보 조회 실패:', childrenError);
      }

      // Set form data
      setFormData({
        name: memberData.name || '',
        name_eng: memberData.name_eng || '',
        email: memberData.email || '',
        gender: memberData.gender || '남',
        birthdate: memberData.birthdate || '',
        birthdate_type: memberData.birthdate_type || '양력',
        phone: memberData.phone || '',
        position_main: memberData.position_main || 'MEMBER',
        position_detail: memberData.position_detail || '',
        organization_id: memberData.organization_id || '',
        department: memberData.department || '',
        position_code: memberData.position_code || '',
        appointed_on: memberData.appointed_on || '',
        ordination_church: memberData.ordination_church || '',
        workplace: memberData.workplace || '',
        workplace_phone: memberData.workplace_phone || '',
        address: memberData.address || '',
        marital_status: memberData.marital_status || '',
        spouse_name: memberData.spouse_name || '',
        married_on: memberData.married_on || '',
        children: childrenData?.map(c => ({
          id: c.id,
          name: c.name || '',
          gender: c.gender || '남',
          birthdate: c.birthdate || '',
          birthdate_type: c.birthdate_type || '양력',
          notes: c.notes || ''
        })) || [],
        member_type: memberData.member_type || '',
        confirmation_date: memberData.confirmation_date || '',
        sub_district: memberData.sub_district || '',
        age_group: memberData.age_group || '',
        baptism_date: memberData.baptism_date || '',
        baptism_church: memberData.baptism_church || '',
        region_1: memberData.region_1 || '',
        region_2: memberData.region_2 || '',
        region_3: memberData.region_3 || '',
        postal_code: memberData.postal_code || '',
        inviter3_member_id: memberData.inviter3_member_id?.toString() || '',
        last_contact_date: memberData.last_contact_date || '',
        spiritual_grade: memberData.spiritual_grade || '',
        job_category: memberData.job_category || '',
        job_detail: memberData.job_detail || '',
        job_position: memberData.job_position || '',
        job_title: memberData.job_title || '',
        ministry_start_date: memberData.ministry_start_date || '',
        neighboring_church: memberData.neighboring_church || '',
        position_decision: memberData.position_decision || '',
        daily_activity: memberData.daily_activity || '',
        custom_field_1: memberData.custom_field_1 || '',
        custom_field_2: memberData.custom_field_2 || '',
        custom_field_3: memberData.custom_field_3 || '',
        custom_field_4: memberData.custom_field_4 || '',
        custom_field_5: memberData.custom_field_5 || '',
        custom_field_6: memberData.custom_field_6 || '',
        custom_field_7: memberData.custom_field_7 || '',
        custom_field_8: memberData.custom_field_8 || '',
        custom_field_9: memberData.custom_field_9 || '',
        custom_field_10: memberData.custom_field_10 || '',
        custom_field_11: memberData.custom_field_11 || '',
        custom_field_12: memberData.custom_field_12 || '',
        special_notes: memberData.special_notes || ''
      });

      // Set profile photo preview if exists
      if (memberData.profile_photo_url) {
        setProfilePhotoPreview(memberData.profile_photo_url);
      }
    } catch (error) {
      console.error('교인 정보 조회 실패:', error);
      alert('교인 정보를 불러오는데 실패했습니다.');
      navigate('/member-management');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      setLoadingOrganizations(true);
      const result = await supabaseAuthService.getCurrentUser();
      if (result?.user?.church_id) {
        const orgResult = await organizationService.getOrganizations(result.user.church_id);
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

  const handleSubmit = async () => {
    if (!isFormValid()) {
      alert('필수 정보를 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const memberData = {
        name: formData.name,
        name_eng: formData.name_eng || null,
        email: formData.email || null,
        gender: formData.gender || null,
        birthdate: formData.birthdate || null,
        birthdate_type: formData.birthdate_type || '양력',
        phone: formData.phone || null,
        address: formData.address || null,
        position_main: formData.position_main || null,
        position_detail: formData.position_detail || null,
        organization_id: formData.organization_id || null,
        department: formData.department || null,
        appointed_on: formData.appointed_on || null,
        ordination_church: formData.ordination_church || null,
        workplace: formData.workplace || null,
        workplace_phone: formData.workplace_phone || null,
        marital_status: formData.marital_status || null,
        spouse_name: formData.spouse_name || null,
        married_on: formData.married_on || null,
        member_type: formData.member_type || null,
        confirmation_date: formData.confirmation_date || null,
        sub_district: formData.sub_district || null,
        age_group: formData.age_group || null,
        baptism_date: formData.baptism_date || null,
        baptism_church: formData.baptism_church || null,
        region_1: formData.region_1 || null,
        region_2: formData.region_2 || null,
        region_3: formData.region_3 || null,
        postal_code: formData.postal_code || null,
        inviter3_member_id: formData.inviter3_member_id ? parseInt(formData.inviter3_member_id) : null,
        last_contact_date: formData.last_contact_date || null,
        spiritual_grade: formData.spiritual_grade || null,
        job_category: formData.job_category || null,
        job_detail: formData.job_detail || null,
        job_position: formData.job_position || null,
        job_title: formData.job_title || null,
        ministry_start_date: formData.ministry_start_date || null,
        neighboring_church: formData.neighboring_church || null,
        position_decision: formData.position_decision || null,
        daily_activity: formData.daily_activity || null,
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
        special_notes: formData.special_notes || null
      };

      // Include id in memberData for update
      const memberDataWithId = {
        id: parseInt(id!),
        ...memberData
      };

      await supabaseApiService.members.update(memberDataWithId);

      // 교인 수정 로그 기록
      activityLogger.logMemberUpdate(parseInt(id!), memberData.name, Object.keys(memberData));

      // 자녀 정보 저장 (기존 자녀 데이터 삭제 후 새로 저장)
      // 1. 기존 자녀 데이터 삭제
      const { error: deleteError } = await supabase
        .from('member_children')
        .delete()
        .eq('member_id', parseInt(id!));

      if (deleteError) {
        console.error('기존 자녀 정보 삭제 실패:', deleteError);
      }

      // 2. 새로운 자녀 데이터 저장
      if (formData.children.length > 0) {
        const childrenData = formData.children
          .filter(c => c.name) // 이름이 입력된 자녀만 저장
          .map(c => ({
            member_id: parseInt(id!),
            name: c.name,
            gender: c.gender || null,
            birthdate: c.birthdate || null,
            birthdate_type: c.birthdate_type || '양력',
            notes: c.notes || null
          }));

        if (childrenData.length > 0) {
          const { error: childrenError } = await supabase
            .from('member_children')
            .insert(childrenData);

          if (childrenError) {
            console.error('자녀 정보 저장 실패:', childrenError);
          }
        }
      }

      // Upload profile photo if changed
      if (profilePhoto) {
        try {
          // Generate unique file path
          const fileExt = profilePhoto.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `members/${id}/${fileName}`;

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
            id: parseInt(id!),
            profile_photo_url: publicUrl
          });

          activityLogger.log({
            action: 'update',
            resource: 'member',
            target_id: parseInt(id!),
            target_name: memberData.name,
            page_path: `/member-management/edit/${id}`,
            page_name: '교인 수정 - 프로필 사진 업데이트',
            details: { photo_uploaded: true, file_name: profilePhoto.name, file_size: profilePhoto.size }
          });
        } catch (photoError) {
          console.warn('사진 업로드 실패:', photoError);
        }
      }

      alert('교인 정보가 성공적으로 수정되었습니다.');
      navigate('/member-management');
    } catch (error) {
      console.error('교인 수정 실패:', error);
      alert('교인 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/member-management')}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                뒤로
              </Button>
              <div className="flex items-center gap-3">
                <Edit3 className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">교인 정보 수정</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/member-management')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                취소
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || !isFormValid()}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 프로필 사진 */}
          <div className="bg-card border rounded-lg p-6">
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
                    <Edit3 className="w-16 h-16 text-muted-foreground" />
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
                  id="edit-member-photo-upload"
                />
                <label
                  htmlFor="edit-member-photo-upload"
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                >
                  <Camera className="w-4 h-4" />
                  사진 변경
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
          <details open className="bg-card border rounded-lg group">
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">이름 *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="홍길동"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">영문명</label>
                  <Input
                    value={formData.name_eng}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_eng: e.target.value }))}
                    placeholder="Hong Gil Dong"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">이메일 *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">전화번호 *</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="010-1234-5678"
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
          <details open className="bg-card border rounded-lg group">
            <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Church className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-medium">교회 정보</h3>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">직분 대분류</label>
                  <Select
                    value={formData.position_main}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      position_main: value,
                      position_detail: ''
                    }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ADMIN_POSITION_OPTIONS.map((option) => (
                        <SelectItem key={option.mainValue} value={option.mainValue}>
                          {option.mainLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                        <SelectTrigger><SelectValue placeholder="세부 직분 선택" /></SelectTrigger>
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

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">부서</label>
                  <Select
                    value={formData.department || 'none'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value === 'none' ? '' : value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="부서 선택" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">없음</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
          <details className="bg-card border rounded-lg group">
            <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-medium">개인 및 가족 정보</h3>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-6 pb-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">결혼 상태</label>
                  <Select value={formData.marital_status} onValueChange={(value) => setFormData(prev => ({ ...prev, marital_status: value }))}>
                    <SelectTrigger><SelectValue placeholder="상태 선택" /></SelectTrigger>
                    <SelectContent>
                      {maritalStatuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">배우자 이름</label>
                  <Input
                    value={formData.spouse_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, spouse_name: e.target.value }))}
                    placeholder="배우자 이름"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">결혼일</label>
                  <DatePicker
                    value={formData.married_on}
                    onChange={(value) => setFormData(prev => ({ ...prev, married_on: value }))}
                    placeholder="결혼일 선택"
                  />
                </div>
              </div>

              {/* 자녀 정보 (기혼, 이혼, 사별인 경우 표시) */}
              {['기혼', '이혼', '사별'].includes(formData.marital_status) && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-foreground">자녀 정보</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addChild} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      자녀 추가
                    </Button>
                  </div>

                  {formData.children.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">자녀 정보를 추가하려면 위의 버튼을 클릭하세요.</p>
                  ) : (
                    <div className="space-y-4">
                      {formData.children.map((child, index) => (
                        <div key={index} className="p-4 bg-muted/30 rounded-lg border space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">자녀 {index + 1}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeChild(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* 자녀 이름 */}
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">이름</label>
                              <Input
                                value={child.name}
                                onChange={(e) => {
                                  const newChildren = [...formData.children];
                                  newChildren[index].name = e.target.value;
                                  setFormData(prev => ({ ...prev, children: newChildren }));
                                }}
                                placeholder="자녀 이름"
                              />
                            </div>

                            {/* 성별 */}
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">성별</label>
                              <Select
                                value={child.gender}
                                onValueChange={(value) => {
                                  const newChildren = [...formData.children];
                                  newChildren[index].gender = value;
                                  setFormData(prev => ({ ...prev, children: newChildren }));
                                }}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="남">남</SelectItem>
                                  <SelectItem value="여">여</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* 생년월일 구분 */}
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">생년월일 구분</label>
                              <Select
                                value={child.birthdate_type}
                                onValueChange={(value) => {
                                  const newChildren = [...formData.children];
                                  newChildren[index].birthdate_type = value;
                                  setFormData(prev => ({ ...prev, children: newChildren }));
                                }}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="양력">양력</SelectItem>
                                  <SelectItem value="음력">음력</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* 생년월일 */}
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">생년월일</label>
                              <DatePicker
                                value={child.birthdate}
                                onChange={(value) => {
                                  const newChildren = [...formData.children];
                                  newChildren[index].birthdate = value;
                                  setFormData(prev => ({ ...prev, children: newChildren }));
                                }}
                                placeholder="생년월일 선택"
                                disableFuture={true}
                                fromYear={1950}
                                toYear={new Date().getFullYear()}
                              />
                            </div>
                          </div>

                          {/* 비고 */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">비고</label>
                            <Textarea
                              value={child.notes}
                              onChange={(e) => {
                                const newChildren = [...formData.children];
                                newChildren[index].notes = e.target.value;
                                setFormData(prev => ({ ...prev, children: newChildren }));
                              }}
                              placeholder="특이사항이나 메모 입력"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </details>

          {/* 교회 정보 확장 */}
          <details className="bg-card border rounded-lg group">
            <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Church className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-medium">교회 정보 확장</h3>
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

                {/* 세례일 */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">세례일</label>
                  <DatePicker
                    value={formData.baptism_date}
                    onChange={(value) => setFormData(prev => ({ ...prev, baptism_date: value }))}
                    placeholder="세례일 선택"
                  />
                </div>

                {/* 세례교회 */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">세례교회</label>
                  <Input
                    value={formData.baptism_church}
                    onChange={(e) => setFormData(prev => ({ ...prev, baptism_church: e.target.value }))}
                    placeholder="세례받은 교회"
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

          {/* 직업 정보 */}
          <details className="bg-card border rounded-lg group">
            <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-medium">직업 정보</h3>
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
          <details className="bg-card border rounded-lg group">
            <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Church className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-medium">사역 정보 확장</h3>
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
          <details className="bg-card border rounded-lg group">
            <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-medium">자유 필드 (커스텀 정보)</h3>
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
          <details className="bg-card border rounded-lg group">
            <summary className="cursor-pointer p-4 list-none flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ContactRound className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-medium">특별 사항</h3>
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
      </div>
    </div>
  );
};

export default EditMemberPage;
