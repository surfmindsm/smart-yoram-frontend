import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Clock, Settings2, Check, X } from 'lucide-react';
import {
  Button,
  Card,
  LoadingState,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  PageContainer,
  ConfirmDialog,
  toast,
} from "../ui";
import { TimePicker } from "../ui/time-picker";
import { usePageSubtitle, usePageActions } from "../../hooks/usePageSubtitle";
import { cn } from "../../lib/utils";
import { supabaseApiService } from '../../services/supabaseApiService';

interface WorshipService {
  id: number;
  church_id: number;
  name: string;
  location?: string;
  day_of_week?: number;
  start_time: string;
  end_time?: string;
  service_type?: string;
  target_group?: string;
  is_active: boolean;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

interface WorshipCategory {
  id: number;
  name: string;
  description?: string;
  order_index: number;
}

const DAYS_OF_WEEK = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

// Note: Backend uses 0=Monday through 6=Sunday for day_of_week
const DAY_OF_WEEK_MAPPING = {
  0: '월요일',
  1: '화요일',
  2: '수요일',
  3: '목요일',
  4: '금요일',
  5: '토요일',
  6: '일요일',
};

const TARGET_GROUPS = [
  { value: 'all', label: '전체' },
  { value: 'children', label: '어린이부' },
  { value: 'youth', label: '청소년부' },
  { value: 'college', label: '대학청년부' },
  { value: 'adult', label: '장년부' },
];

// "HH:MM:SS" / "HH:MM" → "HH:MM"
const formatTime = (t?: string | null) => (t ? t.slice(0, 5) : '');

const getChurchId = () => {
  try {
    const sessionStr = localStorage.getItem('supabase_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      const churchId = session?.user?.church_id;
      if (churchId) return churchId;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const churchId = user?.church_id;
      if (churchId) return churchId;
    }
    return 9998;
  } catch {
    return 9998;
  }
};

export default function WorshipScheduleManagement() {
  const churchId = getChurchId();
  const queryClient = useQueryClient();

  // 예배 일정 — React Query 캐시
  const servicesQuery = useQuery({
    queryKey: ['worshipServices', 'manage', churchId],
    queryFn: async () => {
      const response = await supabaseApiService.worshipServices.getAll({
        church_id: churchId,
        page: 1,
        limit: 100,
      });
      return (response?.data || []) as WorshipService[];
    },
    staleTime: 5 * 60_000,
  });

  // 카테고리 — React Query 캐시
  const categoriesQuery = useQuery({
    queryKey: ['worshipCategories', churchId],
    queryFn: async () => {
      const data = await supabaseApiService.worshipServices.categories.getAll(churchId);
      // 카테고리가 없으면 기본값 자동 생성
      if (!data || data.length === 0) {
        const defaults = [
          { name: '주일예배', description: '주일 정기 예배', order_index: 0 },
          { name: '주중예배', description: '주중 정기 예배', order_index: 1 },
          { name: '수요예배', description: '수요일 정기 예배', order_index: 2 },
          { name: '새벽기도회', description: '새벽 기도 모임', order_index: 3 },
          { name: '금요철야예배', description: '금요일 철야 예배', order_index: 4 },
          { name: '특별예배', description: '특별 행사 예배', order_index: 5 },
        ];
        for (const c of defaults) {
          try {
            await supabaseApiService.worshipServices.categories.create({ church_id: churchId, ...c });
          } catch (e) {
            console.error('기본 카테고리 생성 실패:', c.name, e);
          }
        }
        return (await supabaseApiService.worshipServices.categories.getAll(churchId)) as WorshipCategory[];
      }
      return data as WorshipCategory[];
    },
    staleTime: 10 * 60_000,
  });

  const services: WorshipService[] = servicesQuery.data || [];
  const categories: WorshipCategory[] = categoriesQuery.data || [];
  const isLoading = servicesQuery.isLoading || categoriesQuery.isLoading;

  const invalidateServices = () => queryClient.invalidateQueries({ queryKey: ['worshipServices'] });
  const invalidateCategories = () => queryClient.invalidateQueries({ queryKey: ['worshipCategories'] });

  // 추가/수정 모달
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<WorshipService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    day_of_week: [] as string[],
    start_time: '',
    service_type: '',
    target_group: '',
    order_index: 0,
  });

  // 카테고리 관리 모달
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<WorshipService | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<WorshipCategory | null>(null);

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      name: '',
      location: '',
      day_of_week: [],
      start_time: '',
      service_type: '',
      target_group: '',
      order_index: 0,
    });
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
    setNewCategoryName('');
  };

  const handleEdit = (service: WorshipService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      location: service.location || '',
      day_of_week: service.day_of_week !== undefined ? [service.day_of_week.toString()] : [],
      start_time: service.start_time,
      service_type: service.service_type || '',
      target_group: service.target_group || '',
      order_index: service.order_index,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_time?.trim()) {
      toast({ title: '오류', description: '시작 시간을 입력해주세요.', variant: 'destructive' });
      return;
    }

    try {
      if (editingService) {
        const serviceData = {
          church_id: churchId,
          name: formData.name,
          location: formData.location || undefined,
          day_of_week: formData.day_of_week.length > 0 ? parseInt(formData.day_of_week[0]) : undefined,
          start_time: formData.start_time,
          service_type: formData.service_type || undefined,
          target_group: formData.target_group || undefined,
          is_active: true,
          order_index: formData.order_index,
        };
        await supabaseApiService.worshipServices.update(editingService.id.toString(), serviceData);
        toast({ title: '성공', description: '예배 일정이 수정되었습니다.' });
      } else {
        if (formData.day_of_week.length === 0) {
          toast({ title: '오류', description: '최소 하나의 요일을 선택해주세요.', variant: 'destructive' });
          return;
        }
        for (const dayStr of formData.day_of_week) {
          const serviceData = {
            church_id: churchId,
            name: formData.name,
            location: formData.location || undefined,
            day_of_week: parseInt(dayStr),
            start_time: formData.start_time,
              service_type: formData.service_type || undefined,
            target_group: formData.target_group || undefined,
            is_active: true,
            order_index: formData.order_index,
          };
          await supabaseApiService.worshipServices.create(serviceData as any);
        }
        toast({ title: '성공', description: `예배 일정이 ${formData.day_of_week.length}개 추가되었습니다.` });
      }

      setIsDialogOpen(false);
      resetForm();
      invalidateServices();
    } catch (error) {
      console.error('예배 일정 저장 실패:', error);
      toast({ title: '오류', description: '예배 일정 저장에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await supabaseApiService.worshipServices.delete(deleteTarget.id.toString());
      toast({ title: '성공', description: '예배 일정이 삭제되었습니다.' });
      setDeleteTarget(null);
      invalidateServices();
    } catch (error) {
      console.error('예배 일정 삭제 실패:', error);
      toast({ title: '오류', description: '예배 일정 삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  // 카테고리 인라인 편집 시작
  const startCategoryEdit = (category: WorshipCategory) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const cancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const saveCategoryEdit = async () => {
    if (editingCategoryId == null) return;
    const target = categories.find(c => c.id === editingCategoryId);
    if (!target) {
      cancelCategoryEdit();
      return;
    }
    const newName = editingCategoryName.trim();
    if (!newName) {
      toast({ title: '오류', description: '유형 이름을 입력해주세요.', variant: 'destructive' });
      return;
    }
    if (newName === target.name) {
      cancelCategoryEdit();
      return;
    }
    try {
      await supabaseApiService.worshipServices.categories.update(editingCategoryId, {
        name: newName,
        description: target.description,
        order_index: target.order_index,
      });
      toast({ title: '성공', description: '예배 유형이 수정되었습니다.' });
      cancelCategoryEdit();
      invalidateCategories();
    } catch (error) {
      console.error('유형 수정 실패:', error);
      toast({ title: '오류', description: '예배 유형 수정에 실패했습니다.', variant: 'destructive' });
    }
  };

  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast({ title: '오류', description: '유형 이름을 입력해주세요.', variant: 'destructive' });
      return;
    }
    try {
      await supabaseApiService.worshipServices.categories.create({
        church_id: churchId,
        name,
        order_index: categories.length,
      } as any);
      toast({ title: '성공', description: '예배 유형이 추가되었습니다.' });
      setNewCategoryName('');
      invalidateCategories();
    } catch (error) {
      console.error('유형 추가 실패:', error);
      toast({ title: '오류', description: '예배 유형 추가에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleCategoryDelete = async () => {
    if (!deleteCategoryTarget) return;
    try {
      const { error } = await (supabaseApiService as any).supabase
        .from('worship_service_categories')
        .delete()
        .eq('id', deleteCategoryTarget.id);
      if (error) {
        await supabaseApiService.worshipServices.categories.delete(deleteCategoryTarget.id);
      }
      toast({ title: '성공', description: '예배 유형이 삭제되었습니다.' });
      setDeleteCategoryTarget(null);
      invalidateCategories();
    } catch (error) {
      console.error('유형 삭제 실패:', error);
      toast({ title: '오류', description: '예배 유형 삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  // 정렬: 요일 → 시작 시간
  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      if (a.day_of_week !== undefined && b.day_of_week !== undefined) {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      } else if (a.day_of_week !== undefined) return -1;
      else if (b.day_of_week !== undefined) return 1;
      if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
      return 0;
    });
  }, [services]);

  const filteredServices = sortedServices;

  // 상단바
  usePageSubtitle(`전체 ${services.length}건`);
  usePageActions(
    <>
      <Button
        onClick={() => setIsCategoryDialogOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Settings2 className="h-3.5 w-3.5" />
        예배 유형 관리
      </Button>
      <Button
        onClick={() => { resetForm(); setIsDialogOpen(true); }}
        size="sm"
        className="gap-2"
      >
        <Plus className="h-3.5 w-3.5" />
        예배 추가
      </Button>
    </>,
    [services.length]
  );

  return (
    <PageContainer>
      {isLoading ? (
        <Card>
          <LoadingState text="예배 일정을 불러오는 중..." />
        </Card>
      ) : filteredServices.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
            <h3 className="mb-2 text-[15px] font-bold text-foreground">
              등록된 예배가 없습니다
            </h3>
            <p className="mb-4 text-[13px] text-muted-foreground">
              새로운 예배 일정을 추가해보세요.
            </p>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              예배 추가
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[160px]" />
                <col />
                <col className="w-[100px]" />
                <col className="w-[140px]" />
                <col className="w-[180px]" />
                <col className="w-[120px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">유형</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">예배명</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">요일</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">시간</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">장소</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">대상</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {filteredServices.map(service => {
                  const dayLabel = service.day_of_week !== undefined
                    ? (DAY_OF_WEEK_MAPPING[service.day_of_week as keyof typeof DAY_OF_WEEK_MAPPING] || DAYS_OF_WEEK[service.day_of_week])
                    : '-';
                  return (
                    <tr
                      key={service.id}
                      className="cursor-pointer transition-colors hover:bg-[#F8FAFD]"
                      onClick={() => handleEdit(service)}
                    >
                      <td className="px-4 py-3 text-[13px] text-foreground">
                        {service.service_type || <span className="text-[#CBD5E1]">-</span>}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-foreground truncate" title={service.name}>
                        {service.name}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground">
                        {dayLabel}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                        {formatTime(service.start_time) || '-'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground truncate" title={service.location || ''}>
                        {service.location || <span className="text-[#CBD5E1]">-</span>}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground">
                        {service.target_group
                          ? (TARGET_GROUPS.find(g => g.value === service.target_group)?.label || service.target_group)
                          : <span className="text-[#CBD5E1]">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 예배 추가/수정 모달 */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{editingService ? '예배 수정' : '예배 추가'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[12.5px] font-semibold">
                예배명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="예: 1부 예배"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="service_type" className="text-[12.5px] font-semibold">예배 유형</Label>
              <Select
                value={formData.service_type || undefined}
                onValueChange={(value) => setFormData({ ...formData, service_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="예배 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                  ))}
                  {/* 카테고리 목록에 없는 값도 표시되도록 폴백 옵션 추가 */}
                  {formData.service_type &&
                    !categories.some(c => c.name === formData.service_type) && (
                      <SelectItem value={formData.service_type}>{formData.service_type}</SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12.5px] font-semibold">
                요일 {!editingService && <span className="text-[11px] font-normal text-muted-foreground">(중복 선택 가능)</span>}
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {DAYS_OF_WEEK.map((day, index) => {
                  const checked = formData.day_of_week.includes(index.toString());
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (editingService) {
                          // 수정 모드: 단일 선택
                          setFormData({ ...formData, day_of_week: [index.toString()] });
                        } else {
                          // 추가 모드: 멀티 선택
                          if (checked) {
                            setFormData({
                              ...formData,
                              day_of_week: formData.day_of_week.filter(d => d !== index.toString()),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              day_of_week: [...formData.day_of_week, index.toString()],
                            });
                          }
                        }
                      }}
                      className={cn(
                        "h-9 rounded-[8px] border text-[12.5px] font-medium transition-colors",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-[#CBD5E1]"
                      )}
                    >
                      {day.replace('요일', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12.5px] font-semibold">
                시간 <span className="text-destructive">*</span>
              </Label>
              <TimePicker
                value={formData.start_time}
                onChange={(value) => setFormData({ ...formData, start_time: value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-[12.5px] font-semibold">장소</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="예: 본당"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="target_group" className="text-[12.5px] font-semibold">대상</Label>
              <Select
                value={formData.target_group}
                onValueChange={(value) => setFormData({ ...formData, target_group: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="대상 선택" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_GROUPS.map(group => (
                    <SelectItem key={group.value} value={group.value}>{group.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between sm:gap-2">
              {editingService ? (
                <Button
                  type="button"
                  variant="destructive-soft"
                  onClick={() => {
                    const target = editingService;
                    setIsDialogOpen(false);
                    setDeleteTarget(target);
                  }}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  취소
                </Button>
                <Button type="submit">
                  {editingService ? '수정' : '추가'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 예배 유형 관리 모달 — 인라인 편집 */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={(open) => { setIsCategoryDialogOpen(open); if (!open) resetCategoryForm(); }}
      >
        <DialogContent className="sm:max-w-[460px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>예배 유형 관리</DialogTitle>
          </DialogHeader>

          {/* 인라인 편집 목록 */}
          <div className="divide-y divide-[#EEF1F6] overflow-hidden rounded-[8px] border border-border">
            {categories.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-muted-foreground">등록된 유형이 없습니다.</p>
            ) : (
              categories.map(category => {
                const isEditing = editingCategoryId === category.id;
                return (
                  <div
                    key={category.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 transition-colors",
                      isEditing ? "bg-[#F8FAFD]" : "hover:bg-[#F8FAFD]"
                    )}
                  >
                    {isEditing ? (
                      <>
                        <Input
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveCategoryEdit();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelCategoryEdit();
                            }
                          }}
                          autoFocus
                          className="h-8 flex-1 text-[13px]"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={saveCategoryEdit}
                          className="h-8 w-8 p-0 text-[#16A34A] hover:bg-[#E7F6EC] hover:text-[#16A34A]"
                          title="저장"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelCategoryEdit}
                          className="h-8 w-8 p-0 text-[#94A3B8] hover:bg-secondary hover:text-foreground"
                          title="취소"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startCategoryEdit(category)}
                          className="flex min-w-0 flex-1 items-center rounded-[6px] px-1 py-1 text-left text-[13px] font-medium text-foreground hover:text-primary"
                          title="클릭하여 수정"
                        >
                          <span className="truncate">{category.name}</span>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteCategoryTarget(category)}
                          className="h-8 w-8 p-0 text-[#94A3B8] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 새 유형 추가 — 인라인 한 줄 */}
          <div className="flex items-center gap-2 pt-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="새 유형 이름 (예: 청년예배)"
              className="h-9 flex-1 text-[13px]"
            />
            <Button onClick={addCategory} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              추가
            </Button>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setIsCategoryDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 예배 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="예배 삭제"
        description={
          <span>
            <span className="font-semibold">"{deleteTarget?.name}"</span> 예배를 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </span>
        }
        confirmText="삭제"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* 카테고리 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteCategoryTarget}
        onOpenChange={(open) => { if (!open) setDeleteCategoryTarget(null); }}
        title="유형 삭제"
        description={
          <span>
            <span className="font-semibold">"{deleteCategoryTarget?.name}"</span> 유형을 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </span>
        }
        confirmText="삭제"
        variant="destructive"
        onConfirm={handleCategoryDelete}
      />
    </PageContainer>
  );
}
