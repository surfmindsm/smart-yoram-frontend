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
    ordination_church: '', job_title: '', workplace: '', workplace_phone: '',
    // 개인 정보
    address: '', marital_status: '', spouse_name: '', married_on: ''
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

  const isFormValid = () => {
    return formData.name && formData.email && formData.phone;
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      name: '', name_eng: '', email: '', gender: '남', birthdate: '', phone: '',
      position: '', district: '', department_code: '', position_code: '', appointed_on: '',
      ordination_church: '', job_title: '', workplace: '', workplace_phone: '',
      address: '', marital_status: '', spouse_name: '', married_on: ''
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
        job_title: formData.job_title,
        workplace: formData.workplace,
        workplace_phone: formData.workplace_phone,
        marital_status: formData.marital_status,
        spouse_name: formData.spouse_name,
        married_on: formData.married_on
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
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">주소</label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="상세 주소 입력"
                rows={3}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberModal;