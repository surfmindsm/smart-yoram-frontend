import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, MapPin, Monitor } from 'lucide-react';
import { Button } from "../ui";
import { Card, CardContent } from "../ui";
import { Input } from "../ui";
import { Label } from "../ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui";
import { Switch } from "../ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui";
import { PageContainer, PageHeader } from "../ui";
import { toast } from "../ui";
import { TimePicker } from "../ui/time-picker";
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
  is_online: boolean;
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
  6: '일요일'
};

const TARGET_GROUPS = [
  { value: 'all', label: '전체' },
  { value: 'children', label: '어린이부' },
  { value: 'youth', label: '청소년부' },
  { value: 'college', label: '대학청년부' },
  { value: 'adult', label: '장년부' },
];

export default function WorshipScheduleManagement() {
  const [services, setServices] = useState<WorshipService[]>([]);
  const [categories, setCategories] = useState<WorshipCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<WorshipService | null>(null);
  const [editingCategory, setEditingCategory] = useState<WorshipCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    day_of_week: [] as string[],
    start_time: '',
    end_time: '',
    service_type: '',
    target_group: '',
    is_online: false,
    is_active: true,
    order_index: 0,
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    order_index: 0,
  });
  
  // Get church_id from localStorage - user's actual church
  const getChurchId = () => {
    try {
      // First try to get from supabase_session (new authentication)
      const sessionStr = localStorage.getItem('supabase_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const churchId = session?.user?.church_id;
        if (churchId) {
          return churchId;
        }
      }

      // Fallback to old 'user' key
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const churchId = user?.church_id;
        if (churchId) {
          return churchId;
        }
      }

      // Final fallback
      return 9998;
    } catch (error) {
      console.error('⛪ Error getting church_id from localStorage:', error);
      return 9998;
    }
  };

  const churchId = getChurchId();

  useEffect(() => {
    fetchWorshipSchedule();
    fetchCategories();
  }, []);

  const fetchWorshipSchedule = async () => {
    try {
      setIsLoading(true);
      const response = await supabaseApiService.worshipServices.getAll({
        church_id: churchId,
        page: 1,
        limit: 100
      });

      const servicesData = response?.data || [];
      setServices(servicesData);

    } catch (error) {
      console.error('⛪ 예배 일정 조회 실패:', error);
      toast({
        title: '오류',
        description: '예배 일정을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await supabaseApiService.worshipServices.categories.getAll(churchId);

      // 카테고리가 없으면 기본 카테고리 생성
      if (data.length === 0) {
        const defaultCategories = [
          { name: '주일예배', description: '주일 정기 예배', order_index: 0 },
          { name: '주중예배', description: '주중 정기 예배', order_index: 1 },
          { name: '수요예배', description: '수요일 정기 예배', order_index: 2 },
          { name: '새벽기도회', description: '새벽 기도 모임', order_index: 3 },
          { name: '금요철야예배', description: '금요일 철야 예배', order_index: 4 },
          { name: '특별예배', description: '특별 행사 예배', order_index: 5 },
        ];

        for (const category of defaultCategories) {
          try {
            await supabaseApiService.worshipServices.categories.create({
              church_id: churchId,
              ...category
            });
          } catch (err) {
            console.error('📂 기본 카테고리 생성 실패:', category.name, err);
          }
        }

        // 다시 조회
        const updatedData = await supabaseApiService.worshipServices.categories.getAll(churchId);
        setCategories(updatedData);
      } else {
        setCategories(data);
      }
    } catch (error) {
      console.error('📂 카테고리 조회 실패:', error);
      toast({
        title: '오류',
        description: '카테고리를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const categoryData = {
        church_id: churchId,
        name: categoryFormData.name,
        description: categoryFormData.description || undefined,
        order_index: categoryFormData.order_index
      };

      if (editingCategory) {
        // 수정
        await supabaseApiService.worshipServices.categories.update(editingCategory.id, categoryData);
      } else {
        // 생성
        await supabaseApiService.worshipServices.categories.create(categoryData as any);
      }

      toast({
        title: '성공',
        description: editingCategory ? '카테고리가 수정되었습니다.' : '카테고리가 추가되었습니다.',
      });

      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      await fetchCategories();

    } catch (error) {
      console.error('📂 카테고리 저장 실패:', error);
      toast({
        title: '오류',
        description: '카테고리 저장에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCategoryDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      // Try using Supabase client directly as a fallback
      const { error } = await supabaseApiService.supabase
        .from('worship_service_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('📂 Supabase 직접 삭제 오류:', error);
        // Fallback to API service
        await supabaseApiService.worshipServices.categories.delete(id);
      }

      toast({
        title: '성공',
        description: '카테고리가 삭제되었습니다.',
      });

      await fetchCategories();

    } catch (error) {
      console.error('📂 카테고리 삭제 실패:', error);
      toast({
        title: '오류',
        description: '카테고리 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCategoryEdit = (category: WorshipCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      order_index: category.order_index,
    });
    setIsCategoryDialogOpen(true);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      order_index: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate start_time
    if (!formData.start_time || formData.start_time.trim() === '') {
      toast({
        title: '오류',
        description: '시작 시간을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingService) {
        // 수정 모드: 단일 레코드 업데이트
        const serviceData = {
          church_id: churchId,
          name: formData.name,
          location: formData.location || undefined,
          day_of_week: formData.day_of_week.length > 0 ? parseInt(formData.day_of_week[0]) : undefined,
          start_time: formData.start_time,
          end_time: formData.end_time || undefined,
          service_type: formData.service_type || undefined,
          target_group: formData.target_group || undefined,
          is_online: formData.is_online,
          is_active: formData.is_active,
          order_index: formData.order_index
        };

        await supabaseApiService.worshipServices.update(editingService.id.toString(), serviceData);

        toast({
          title: '성공',
          description: '예배 일정이 수정되었습니다.',
        });
      } else {
        // 생성 모드: 선택된 각 요일에 대해 레코드 생성
        if (formData.day_of_week.length === 0) {
          toast({
            title: '오류',
            description: '최소 하나의 요일을 선택해주세요.',
            variant: 'destructive',
          });
          return;
        }

        // 선택된 각 요일에 대해 레코드 생성
        for (const dayStr of formData.day_of_week) {
          const serviceData = {
            church_id: churchId,
            name: formData.name,
            location: formData.location || undefined,
            day_of_week: parseInt(dayStr),
            start_time: formData.start_time,
            end_time: formData.end_time || undefined,
            service_type: formData.service_type || undefined,
            target_group: formData.target_group || undefined,
            is_online: formData.is_online,
            is_active: formData.is_active,
            order_index: formData.order_index
          };

          await supabaseApiService.worshipServices.create(serviceData as any);
        }

        toast({
          title: '성공',
          description: `예배 일정이 ${formData.day_of_week.length}개 추가되었습니다.`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
      await fetchWorshipSchedule();

    } catch (error) {
      console.error('⛪ 예배 일정 저장 실패:', error);
      toast({
        title: '오류',
        description: '예배 일정 저장에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await supabaseApiService.worshipServices.delete(id.toString());

      toast({
        title: '성공',
        description: '예배 일정이 삭제되었습니다.',
      });

      await fetchWorshipSchedule();

    } catch (error) {
      console.error('⛪ 예배 일정 삭제 실패:', error);
      toast({
        title: '오류',
        description: '예배 일정 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (service: WorshipService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      location: service.location || '',
      day_of_week: service.day_of_week !== undefined ? [service.day_of_week.toString()] : [],
      start_time: service.start_time,
      end_time: service.end_time || '',
      service_type: service.service_type || '',
      target_group: service.target_group || '',
      is_online: service.is_online,
      is_active: service.is_active,
      order_index: service.order_index,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      name: '',
      location: '',
      day_of_week: [],
      start_time: '',
      end_time: '',
      service_type: '',
      target_group: '',
      is_online: false,
      is_active: true,
      order_index: 0,
    });
  };

  // 예배 시간 정렬: 요일 순 -> 시간 순
  const sortedServices = [...services].sort((a, b) => {
    // 1. 요일로 정렬 (월요일=0 ~ 일요일=6)
    if (a.day_of_week !== undefined && b.day_of_week !== undefined) {
      if (a.day_of_week !== b.day_of_week) {
        return a.day_of_week - b.day_of_week;
      }
    } else if (a.day_of_week !== undefined) {
      return -1;
    } else if (b.day_of_week !== undefined) {
      return 1;
    }

    // 2. 같은 요일이면 시작 시간으로 정렬
    if (a.start_time && b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }

    return 0;
  });

  return (
    <PageContainer>
      <PageHeader
        title="예배 시간 관리"
        description="교회의 정기 예배 일정을 관리합니다."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setIsCategoryDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              카테고리 관리
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              예배 추가
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">예배 일정을 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">등록된 예배가 없습니다</h3>
            <p className="text-gray-600 mb-4">
              아직 등록된 예배 일정이 없습니다.<br />
              새로운 예배 일정을 추가해보세요.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              첫 번째 예배 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="sunday">주일예배</TabsTrigger>
            <TabsTrigger value="weekday">주중예배</TabsTrigger>
            <TabsTrigger value="online">온라인</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">예배명</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">유형</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">요일</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">시간</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">장소</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">대상</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-[100px]">상태</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-[120px]">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedServices.map(service => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              {service.name}
                              {service.is_online && <Monitor className="h-4 w-4 text-primary-600" />}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {service.service_type || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {service.day_of_week !== undefined ?
                              (DAY_OF_WEEK_MAPPING[service.day_of_week as keyof typeof DAY_OF_WEEK_MAPPING] || DAYS_OF_WEEK[service.day_of_week])
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{service.start_time}</span>
                              {service.end_time && <span>- {service.end_time}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {service.location ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{service.location}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {service.target_group ?
                              TARGET_GROUPS.find(g => g.value === service.target_group)?.label
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              service.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {service.is_active ? '활성' : '비활성'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(service)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(service.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sunday" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {services.filter(s => s.service_type === '주일예배').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">주일예배가 등록되지 않았습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">예배명</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">요일</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">시간</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">장소</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">대상</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-[100px]">상태</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-[120px]">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sortedServices
                          .filter(s => s.service_type === '주일예배')
                          .map(service => (
                            <tr key={service.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                  {service.name}
                                  {service.is_online && <Monitor className="h-4 w-4 text-primary-600" />}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {service.day_of_week !== undefined ?
                                  (DAY_OF_WEEK_MAPPING[service.day_of_week as keyof typeof DAY_OF_WEEK_MAPPING] || DAYS_OF_WEEK[service.day_of_week])
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{service.start_time}</span>
                                  {service.end_time && <span>- {service.end_time}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {service.location ? (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{service.location}</span>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {service.target_group ?
                                  TARGET_GROUPS.find(g => g.value === service.target_group)?.label
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  service.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {service.is_active ? '활성' : '비활성'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(service)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(service.id)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekday" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {services.filter(s => s.service_type !== '주일예배' && s.service_type).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">주중예배가 등록되지 않았습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">예배명</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">유형</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">요일</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">시간</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">장소</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">대상</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-[100px]">상태</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-[120px]">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sortedServices
                          .filter(s => s.service_type !== '주일예배' && s.service_type)
                          .map(service => (
                            <tr key={service.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                  {service.name}
                                  {service.is_online && <Monitor className="h-4 w-4 text-primary-600" />}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {service.service_type || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {service.day_of_week !== undefined ?
                                  (DAY_OF_WEEK_MAPPING[service.day_of_week as keyof typeof DAY_OF_WEEK_MAPPING] || DAYS_OF_WEEK[service.day_of_week])
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{service.start_time}</span>
                                  {service.end_time && <span>- {service.end_time}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {service.location ? (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{service.location}</span>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {service.target_group ?
                                  TARGET_GROUPS.find(g => g.value === service.target_group)?.label
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  service.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {service.is_active ? '활성' : '비활성'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(service)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(service.id)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="online" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {services.filter(s => s.is_online).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">온라인 예배가 등록되지 않았습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">예배명</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">유형</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">요일</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">시간</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">장소</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">대상</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-[100px]">상태</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-[120px]">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sortedServices
                          .filter(s => s.is_online)
                          .map(service => (
                            <tr key={service.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                  {service.name}
                                  <Monitor className="h-4 w-4 text-primary-600" />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {service.service_type || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {service.day_of_week !== undefined ?
                                  (DAY_OF_WEEK_MAPPING[service.day_of_week as keyof typeof DAY_OF_WEEK_MAPPING] || DAYS_OF_WEEK[service.day_of_week])
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{service.start_time}</span>
                                  {service.end_time && <span>- {service.end_time}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {service.location ? (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{service.location}</span>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {service.target_group ?
                                  TARGET_GROUPS.find(g => g.value === service.target_group)?.label
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  service.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {service.is_active ? '활성' : '비활성'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(service)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(service.id)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingService ? '예배 수정' : '새 예배 추가'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">예배 이름</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="service_type">예배 유형</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) => setFormData({ ...formData, service_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="예배 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                  {categories.length === 0 && (
                    <SelectItem value="" disabled>
                      카테고리가 없습니다
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">카테고리 관리에서 예배 유형을 추가/수정할 수 있습니다</p>
            </div>

            <div>
              <Label htmlFor="location">장소</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <Label>요일 (중복 선택 가능)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`day-${index}`}
                      checked={formData.day_of_week.includes(index.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            day_of_week: [...formData.day_of_week, index.toString()]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            day_of_week: formData.day_of_week.filter(d => d !== index.toString())
                          });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Label htmlFor={`day-${index}`} className="cursor-pointer font-normal">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="start_time">시작 시간 <span className="text-red-500">*</span></Label>
              <TimePicker
                value={formData.start_time}
                onChange={(value) => setFormData({ ...formData, start_time: value })}
              />
            </div>

            <div>
              <Label htmlFor="target_group">대상</Label>
              <Select
                value={formData.target_group}
                onValueChange={(value) => setFormData({ ...formData, target_group: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="대상 선택" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_GROUPS.map(group => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_online"
                checked={formData.is_online}
                onCheckedChange={(checked) => setFormData({ ...formData, is_online: checked })}
              />
              <Label htmlFor="is_online">온라인 예배</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">활성화</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit">
                {editingService ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 카테고리 관리 다이얼로그 */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
        setIsCategoryDialogOpen(open);
        if (!open) resetCategoryForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>카테고리 관리</DialogTitle>
          </DialogHeader>

          {/* 카테고리 목록 */}
          <div className="space-y-4">
            <h3 className="font-semibold">등록된 카테고리</h3>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">등록된 카테고리가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-gray-600">{category.description}</div>
                      )}
                      <div className="text-xs text-gray-500">순서: {category.order_index}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleCategoryEdit(category)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleCategoryDelete(category.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 카테고리 추가/수정 폼 */}
          <form onSubmit={handleCategorySubmit} className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">{editingCategory ? '카테고리 수정' : '새 카테고리 추가'}</h3>

            <div>
              <Label htmlFor="category_name">카테고리 이름 <span className="text-red-500">*</span></Label>
              <Input
                id="category_name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                required
                placeholder="예: 주일예배, 수요예배"
              />
            </div>

            <div>
              <Label htmlFor="category_description">설명</Label>
              <Input
                id="category_description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder="카테고리 설명 (선택사항)"
              />
            </div>

            <div>
              <Label htmlFor="category_order">정렬 순서</Label>
              <Input
                id="category_order"
                type="number"
                value={categoryFormData.order_index}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, order_index: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                resetCategoryForm();
              }}>
                {editingCategory ? '취소' : '초기화'}
              </Button>
              <Button type="submit">
                {editingCategory ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}