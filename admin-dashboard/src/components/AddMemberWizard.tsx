import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { ArrowLeft, ArrowRight, Check, ContactRound, Briefcase, Church, Heart, Plus, Trash2, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/api';

const AddMemberWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // 기본 정보
    name: '', name_eng: '', email: '', gender: '남', birthdate: '', phone: '',
    // 사역 정보  
    position: '', district: '', department_code: '', position_code: '', appointed_on: '',
    ordination_church: '', job_title: '', workplace: '', workplace_phone: '',
    // 추가 연락처
    contacts: [] as { type: string; value: string }[],
    // 성례/이명 기록
    sacraments: [] as { type: string; date: string; church_name: string }[],
    transfers: [] as { type: string; church_name: string; date: string }[],
    // 기타 정보
    address: '', marital_status: '', spouse_name: '', married_on: '',
    vehicles: [] as { car_type: string; plate_no: string }[]
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
  
  const contactTypes = [
    { value: 'mobile', label: '휴대폰' },
    { value: 'home_phone', label: '집 전화' },
    { value: 'work_phone', label: '직장 전화' },
    { value: 'email', label: '이메일' },
    { value: 'fax', label: '팩스' }
  ];
  
  const sacramentTypes = [
    { value: '유아세례', label: '유아세례' },
    { value: '세례', label: '세례 (침례)' },
    { value: '입교', label: '입교' },
    { value: '성찬', label: '성찬' }
  ];
  
  const maritalStatuses = [
    { value: '미혼', label: '미혼' },
    { value: '기혼', label: '기혼' },
    { value: '이혼', label: '이혼' },
    { value: '사별', label: '사별' }
  ];

  const steps = [
    { id: 1, title: '기본 정보', icon: ContactRound, required: true },
    { id: 2, title: '사역 정보', icon: Briefcase, required: false },
    { id: 3, title: '추가 연락처', icon: ContactRound, required: false },
    { id: 4, title: '성례/이명 기록', icon: Church, required: false },
    { id: 5, title: '기타 정보', icon: Heart, required: false }
  ];

  const isStepValid = (step: number) => {
    return step === 1 ? (formData.name && formData.email && formData.phone) : true;
  };

  const nextStep = () => {
    if (currentStep < 5 && isStepValid(currentStep)) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!isStepValid(1)) {
      alert('필수 정보를 입력해주세요.');
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    try {
      const basicData = {
        name: formData.name, name_eng: formData.name_eng, email: formData.email,
        gender: formData.gender, birthdate: formData.birthdate, phone: formData.phone,
        address: formData.address, position: formData.position, district: formData.district
      };
      
      const memberResponse = await api.post('/members/', basicData);
      const memberId = memberResponse.data.id;
      
      // 추가 정보 등록
      const promises = [];
      
      // 연락처 정보
      formData.contacts.forEach(contact => {
        if (contact.type && contact.value) {
          promises.push(api.post(`/members/${memberId}/contacts`, contact));
        }
      });
      
      // 사역 정보
      if (formData.department_code && formData.position_code) {
        const ministryData = {
          department_code: formData.department_code,
          position_code: formData.position_code,
          appointed_on: formData.appointed_on,
          ordination_church: formData.ordination_church,
          job_title: formData.job_title,
          workplace: formData.workplace,
          workplace_phone: formData.workplace_phone
        };
        promises.push(api.post(`/members/${memberId}/ministries`, ministryData));
      }
      
      // 성례 기록
      formData.sacraments.forEach(sacrament => {
        if (sacrament.type && sacrament.date && sacrament.church_name) {
          promises.push(api.post(`/members/${memberId}/sacraments`, sacrament));
        }
      });
      
      // 이명 기록
      formData.transfers.forEach(transfer => {
        if (transfer.type && transfer.church_name && transfer.date) {
          promises.push(api.post(`/members/${memberId}/transfers`, transfer));
        }
      });
      
      await Promise.all(promises);
      
      alert('교인 정보가 성공적으로 등록되었습니다.');
      navigate('/member-management');
    } catch (error) {
      console.error('교인 추가 실패:', error);
      alert('교인 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper functions for arrays
  const addContact = () => setFormData(prev => ({ ...prev, contacts: [...prev.contacts, { type: '', value: '' }] }));
  const removeContact = (index: number) => setFormData(prev => ({ ...prev, contacts: prev.contacts.filter((_, i) => i !== index) }));
  const addSacrament = () => setFormData(prev => ({ ...prev, sacraments: [...prev.sacraments, { type: '', date: '', church_name: '' }] }));
  const removeSacrament = (index: number) => setFormData(prev => ({ ...prev, sacraments: prev.sacraments.filter((_, i) => i !== index) }));
  const addTransfer = () => setFormData(prev => ({ ...prev, transfers: [...prev.transfers, { type: 'in', church_name: '', date: '' }] }));
  const removeTransfer = (index: number) => setFormData(prev => ({ ...prev, transfers: prev.transfers.filter((_, i) => i !== index) }));
  const addVehicle = () => setFormData(prev => ({ ...prev, vehicles: [...prev.vehicles, { car_type: '', plate_no: '' }] }));
  const removeVehicle = (index: number) => setFormData(prev => ({ ...prev, vehicles: prev.vehicles.filter((_, i) => i !== index) }));

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/member-management')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-primary" />
              새 교인 등록
            </h1>
            <p className="text-muted-foreground mt-1">{currentStep}/5단계 - {steps[currentStep - 1].title}</p>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors",
                    step.id === currentStep ? "bg-primary text-primary-foreground border-primary" 
                    : step.id < currentStep ? "bg-green-500 text-white border-green-500"
                    : "bg-background text-muted-foreground border-muted"
                  )}>
                    {step.id < currentStep ? <Check className="w-6 h-6" /> : React.createElement(step.icon, { className: "w-6 h-6" })}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={cn("text-sm font-medium", step.id === currentStep ? "text-primary" : "text-muted-foreground")}>
                      {step.title}
                    </p>
                    {step.required && <p className="text-xs text-red-500">필수</p>}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn("w-24 h-0.5 mx-4 mt-[-20px] transition-colors", step.id < currentStep ? "bg-green-500" : "bg-muted")} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5 text-primary" })}
            {steps[currentStep - 1].title}
            {steps[currentStep - 1].required && <span className="text-red-500">*</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: 기본 정보 */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">이름 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">영문명</label>
                <Input
                  value={formData.name_eng}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_eng: e.target.value }))}
                  placeholder="Hong Gil Dong"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">이메일 *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@email.com"
                />
                <p className="text-xs text-muted-foreground mt-1">이메일로 임시 비밀번호가 발송됩니다.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">전화번호 *</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="010-1234-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">성별</label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="남">남</SelectItem>
                    <SelectItem value="여">여</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">생년월일</label>
                <Input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthdate: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 2: 사역 정보 */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">부서</label>
                <Select value={formData.department_code} onValueChange={(value) => setFormData(prev => ({ ...prev, department_code: value }))}>
                  <SelectTrigger><SelectValue placeholder="부서 선택" /></SelectTrigger>
                  <SelectContent>
                    {departmentCodes.map(dept => (
                      <SelectItem key={dept.code} value={dept.code}>{dept.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">직분</label>
                <Select value={formData.position_code} onValueChange={(value) => setFormData(prev => ({ ...prev, position_code: value }))}>
                  <SelectTrigger><SelectValue placeholder="직분 선택" /></SelectTrigger>
                  <SelectContent>
                    {positionCodes.map(pos => (
                      <SelectItem key={pos.code} value={pos.code}>{pos.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">임명일</label>
                <Input type="date" value={formData.appointed_on} onChange={(e) => setFormData(prev => ({ ...prev, appointed_on: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">안수교회</label>
                <Input value={formData.ordination_church} onChange={(e) => setFormData(prev => ({ ...prev, ordination_church: e.target.value }))} placeholder="중앙교회" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">직업</label>
                <Input value={formData.job_title} onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))} placeholder="회사원, 교사 등" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">직장명</label>
                <Input value={formData.workplace} onChange={(e) => setFormData(prev => ({ ...prev, workplace: e.target.value }))} placeholder="삼성전자" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">직장 전화번호</label>
                <Input type="tel" value={formData.workplace_phone} onChange={(e) => setFormData(prev => ({ ...prev, workplace_phone: e.target.value }))} placeholder="02-1234-5678" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">구역</label>
                <Input value={formData.district} onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))} placeholder="1구역, 2구역 등" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">기타 직분</label>
                <Input value={formData.position} onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))} placeholder="권사, 기타 직분" />
              </div>
            </div>
          )}

          {/* Step 3: 추가 연락처 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {formData.contacts.map((contact, index) => (
                <div key={index} className="flex gap-3 items-end p-4 border rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">연락처 유형</label>
                    <Select value={contact.type} onValueChange={(value) => {
                      const newContacts = [...formData.contacts];
                      newContacts[index].type = value;
                      setFormData(prev => ({ ...prev, contacts: newContacts }));
                    }}>
                      <SelectTrigger><SelectValue placeholder="유형 선택" /></SelectTrigger>
                      <SelectContent>
                        {contactTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-2">
                    <label className="block text-sm font-medium mb-2">연락처</label>
                    <Input value={contact.value} onChange={(e) => {
                      const newContacts = [...formData.contacts];
                      newContacts[index].value = e.target.value;
                      setFormData(prev => ({ ...prev, contacts: newContacts }));
                    }} placeholder="연락처 입력" />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeContact(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addContact} className="w-full">
                <Plus className="w-4 h-4 mr-2" />연락처 추가
              </Button>
            </div>
          )}

          {/* Step 4: 성례/이명 기록 */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4">성례 기록</h3>
                <div className="space-y-4">
                  {formData.sacraments.map((sacrament, index) => (
                    <div key={index} className="flex gap-3 items-end p-4 border rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">성례 유형</label>
                        <Select value={sacrament.type} onValueChange={(value) => {
                          const newSacraments = [...formData.sacraments];
                          newSacraments[index].type = value;
                          setFormData(prev => ({ ...prev, sacraments: newSacraments }));
                        }}>
                          <SelectTrigger><SelectValue placeholder="성례 선택" /></SelectTrigger>
                          <SelectContent>
                            {sacramentTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">날짜</label>
                        <Input type="date" value={sacrament.date} onChange={(e) => {
                          const newSacraments = [...formData.sacraments];
                          newSacraments[index].date = e.target.value;
                          setFormData(prev => ({ ...prev, sacraments: newSacraments }));
                        }} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">교회명</label>
                        <Input value={sacrament.church_name} onChange={(e) => {
                          const newSacraments = [...formData.sacraments];
                          newSacraments[index].church_name = e.target.value;
                          setFormData(prev => ({ ...prev, sacraments: newSacraments }));
                        }} placeholder="교회명" />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeSacrament(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addSacrament} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />성례 기록 추가
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">이명 기록</h3>
                <div className="space-y-4">
                  {formData.transfers.map((transfer, index) => (
                    <div key={index} className="flex gap-3 items-end p-4 border rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">유형</label>
                        <Select value={transfer.type} onValueChange={(value) => {
                          const newTransfers = [...formData.transfers];
                          newTransfers[index].type = value;
                          setFormData(prev => ({ ...prev, transfers: newTransfers }));
                        }}>
                          <SelectTrigger><SelectValue placeholder="유형 선택" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in">전입</SelectItem>
                            <SelectItem value="out">전출</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">교회명</label>
                        <Input value={transfer.church_name} onChange={(e) => {
                          const newTransfers = [...formData.transfers];
                          newTransfers[index].church_name = e.target.value;
                          setFormData(prev => ({ ...prev, transfers: newTransfers }));
                        }} placeholder="교회명" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">날짜</label>
                        <Input type="date" value={transfer.date} onChange={(e) => {
                          const newTransfers = [...formData.transfers];
                          newTransfers[index].date = e.target.value;
                          setFormData(prev => ({ ...prev, transfers: newTransfers }));
                        }} />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeTransfer(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addTransfer} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />이명 기록 추가
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: 기타 정보 */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">주소</label>
                  <Textarea value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="상세 주소 입력" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">결혼 상태</label>
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
                  <label className="block text-sm font-medium mb-2">배우자 이름</label>
                  <Input value={formData.spouse_name} onChange={(e) => setFormData(prev => ({ ...prev, spouse_name: e.target.value }))} placeholder="배우자 이름" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">결혼일</label>
                  <Input type="date" value={formData.married_on} onChange={(e) => setFormData(prev => ({ ...prev, married_on: e.target.value }))} />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">차량 정보</h3>
                <div className="space-y-4">
                  {formData.vehicles.map((vehicle, index) => (
                    <div key={index} className="flex gap-3 items-end p-4 border rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">차종</label>
                        <Input value={vehicle.car_type} onChange={(e) => {
                          const newVehicles = [...formData.vehicles];
                          newVehicles[index].car_type = e.target.value;
                          setFormData(prev => ({ ...prev, vehicles: newVehicles }));
                        }} placeholder="소나타, 아반떼 등" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">번호판</label>
                        <Input value={vehicle.plate_no} onChange={(e) => {
                          const newVehicles = [...formData.vehicles];
                          newVehicles[index].plate_no = e.target.value;
                          setFormData(prev => ({ ...prev, vehicles: newVehicles }));
                        }} placeholder="12가3456" />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeVehicle(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addVehicle} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />차량 정보 추가
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          이전
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/member-management')}>
            취소
          </Button>
          {currentStep === 5 ? (
            <Button onClick={handleSubmit} disabled={loading || !isStepValid(1)}>
              {loading ? '등록 중...' : '등록 완료'}
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!isStepValid(currentStep)}>
              다음
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMemberWizard;
