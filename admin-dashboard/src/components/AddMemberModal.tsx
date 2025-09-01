import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
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
  X
} from 'lucide-react';
import { api } from '../services/api';

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
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // 기본 정보
    name: '', name_eng: '', email: '', gender: '남', birthdate: '', phone: '',
    // 사역 정보  
    position: '', district: '', department_code: '', position_code: '', appointed_on: '',
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
    job_category: '', job_detail: '', job_position: '',
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
  const positionCodes = [
    { code: 'PASTOR', label: '목사' },
    { code: 'ELDER', label: '장로' },
    { code: 'DEACON', label: '집사' },
    { code: 'TEACHER', label: '교사' },
    { code: 'LEADER', label: '부장/회장' }
  ];
  
  const departmentCodes = [
    { code: 'WORSHIP', label: '예배부' },
    { code: 'EDUCATION', label: '교육부' },
    { code: 'MISSION', label: '선교부' },
    { code: 'YOUTH', label: '청년부' },
    { code: 'CHILDREN', label: '아동부' }
  ];
  
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

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      name: '', name_eng: '', email: '', gender: '남', birthdate: '', phone: '',
      position: '', district: '', department_code: '', position_code: '', appointed_on: '',
      ordination_church: '', workplace: '', workplace_phone: '',
      address: '', marital_status: '', spouse_name: '', married_on: '',
      // 새로 추가된 필드들 리셋
      member_type: '', confirmation_date: '', sub_district: '', age_group: '',
      region_1: '', region_2: '', region_3: '', postal_code: '',
      inviter3_member_id: '', last_contact_date: '', spiritual_grade: '',
      job_category: '', job_detail: '', job_position: '',
      ministry_start_date: '', neighboring_church: '', position_decision: '', daily_activity: '',
      custom_field_1: '', custom_field_2: '', custom_field_3: '', custom_field_4: '',
      custom_field_5: '', custom_field_6: '', custom_field_7: '', custom_field_8: '',
      custom_field_9: '', custom_field_10: '', custom_field_11: '', custom_field_12: '',
      special_notes: ''
    });
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      alert('필수 정보를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const memberData = {
        // 기존 필드들
        name: formData.name, 
        name_eng: formData.name_eng, 
        email: formData.email,
        gender: formData.gender, 
        birthdate: formData.birthdate, 
        phone: formData.phone,
        address: formData.address, 
        position: formData.position, 
        district: formData.district,
        department_code: formData.department_code,
        position_code: formData.position_code,
        appointed_on: formData.appointed_on,
        ordination_church: formData.ordination_church,
        workplace: formData.workplace,
        workplace_phone: formData.workplace_phone,
        marital_status: formData.marital_status,
        spouse_name: formData.spouse_name,
        married_on: formData.married_on,
        
        // 새로 추가된 25개 필드들
        // 교회 정보 확장
        member_type: formData.member_type,
        confirmation_date: formData.confirmation_date,
        sub_district: formData.sub_district,
        age_group: formData.age_group,
        
        // 지역 정보
        region_1: formData.region_1,
        region_2: formData.region_2,
        region_3: formData.region_3,
        postal_code: formData.postal_code,
        
        // 인도자 정보
        inviter3_member_id: formData.inviter3_member_id ? parseInt(formData.inviter3_member_id) : null,
        
        // 연락 정보
        last_contact_date: formData.last_contact_date,
        
        // 신앙 정보
        spiritual_grade: formData.spiritual_grade,
        
        // 직업 정보 확장
        job_category: formData.job_category,
        job_detail: formData.job_detail,
        job_position: formData.job_position,
        
        // 사역 정보 확장
        ministry_start_date: formData.ministry_start_date,
        neighboring_church: formData.neighboring_church,
        position_decision: formData.position_decision,
        daily_activity: formData.daily_activity,
        
        // 자유 필드들 (12개)
        custom_field_1: formData.custom_field_1,
        custom_field_2: formData.custom_field_2,
        custom_field_3: formData.custom_field_3,
        custom_field_4: formData.custom_field_4,
        custom_field_5: formData.custom_field_5,
        custom_field_6: formData.custom_field_6,
        custom_field_7: formData.custom_field_7,
        custom_field_8: formData.custom_field_8,
        custom_field_9: formData.custom_field_9,
        custom_field_10: formData.custom_field_10,
        custom_field_11: formData.custom_field_11,
        custom_field_12: formData.custom_field_12,
        
        // 특별 사항
        special_notes: formData.special_notes
      };
      
      await api.post('/members/', memberData);
      
      alert('교인 정보가 성공적으로 등록되었습니다.');
      handleClose();
      if (onMemberAdded) onMemberAdded();
    } catch (error) {
      console.error('교인 추가 실패:', error);
      alert('교인 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
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

        <div className="space-y-8">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ContactRound className="w-5 h-5" />
                  기본 정보
                </h3>
                <div className="space-y-4">
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
                    <Input
                      type="date"
                      value={formData.birthdate}
                      onChange={(e) => setFormData(prev => ({ ...prev, birthdate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* 교회 정보 */}
              <div className="bg-primary/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Church className="w-5 h-5" />
                  교회 정보
                </h3>
                <div className="space-y-4">
                  {/* 직분 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직분</label>
                    <Input
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="집사, 권사, 장로 등"
                    />
                  </div>

                  {/* 구역 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">구역</label>
                    <Input
                      value={formData.district}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      placeholder="1구역, 2구역 등"
                    />
                  </div>

                  {/* 부서 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">부서</label>
                    <Select value={formData.department_code} onValueChange={(value) => setFormData(prev => ({ ...prev, department_code: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="부서 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentCodes.map(dept => (
                          <SelectItem key={dept.code} value={dept.code}>{dept.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 직분 분류 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">직분 분류</label>
                    <Select value={formData.position_code} onValueChange={(value) => setFormData(prev => ({ ...prev, position_code: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="직분 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {positionCodes.map(pos => (
                          <SelectItem key={pos.code} value={pos.code}>{pos.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 임명일 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">임명일</label>
                    <Input
                      type="date"
                      value={formData.appointed_on}
                      onChange={(e) => setFormData(prev => ({ ...prev, appointed_on: e.target.value }))}
                    />
                  </div>

                  {/* 안수교회 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">안수교회</label>
                    <Input
                      value={formData.ordination_church}
                      onChange={(e) => setFormData(prev => ({ ...prev, ordination_church: e.target.value }))}
                      placeholder="중앙교회"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 직장 정보 */}
          <div className="bg-blue-50/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              직장 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Input
                  type="date"
                  value={formData.married_on}
                  onChange={(e) => setFormData(prev => ({ ...prev, married_on: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* 주소 정보 */}
          <div className="bg-yellow-50/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              주소 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">우편번호</label>
                <Input
                  value={formData.postal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="06234"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-foreground mb-1">주소</label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="상세 주소 입력"
                  rows={3}
                />
              </div>
            </div>
            
            {/* 지역 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">지역 1</label>
                <Input
                  value={formData.region_1}
                  onChange={(e) => setFormData(prev => ({ ...prev, region_1: e.target.value }))}
                  placeholder="서울시"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">지역 2</label>
                <Input
                  value={formData.region_2}
                  onChange={(e) => setFormData(prev => ({ ...prev, region_2: e.target.value }))}
                  placeholder="강남구"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">지역 3</label>
                <Input
                  value={formData.region_3}
                  onChange={(e) => setFormData(prev => ({ ...prev, region_3: e.target.value }))}
                  placeholder="역삼동"
                />
              </div>
            </div>
          </div>

          {/* 교회 정보 확장 */}
          <div className="bg-purple-50/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Church className="w-5 h-5" />
              교회 정보 확장
            </h3>
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
                <Input
                  type="date"
                  value={formData.confirmation_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmation_date: e.target.value }))}
                />
              </div>

              {/* 부구역 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">부구역</label>
                <Input
                  value={formData.sub_district}
                  onChange={(e) => setFormData(prev => ({ ...prev, sub_district: e.target.value }))}
                  placeholder="A구역, B구역 등"
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
                <Input
                  type="date"
                  value={formData.last_contact_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_contact_date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* 직업 정보 */}
          <div className="bg-indigo-50/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              직업 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
          </div>

          {/* 사역 정보 확장 */}
          <div className="bg-teal-50/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Church className="w-5 h-5" />
              사역 정보 확장
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 사역 시작일 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">사역 시작일</label>
                <Input
                  type="date"
                  value={formData.ministry_start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, ministry_start_date: e.target.value }))}
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

              {/* 인도자3 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">인도자3 ID</label>
                <Input
                  type="number"
                  value={formData.inviter3_member_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, inviter3_member_id: e.target.value }))}
                  placeholder="교인 ID 입력"
                />
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

          {/* 자유 필드 */}
          <div className="bg-pink-50/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              자유 필드 (커스텀 정보)
            </h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* 특별 사항 */}
          <div className="bg-red-50/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ContactRound className="w-5 h-5" />
              특별 사항
            </h3>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberModal;