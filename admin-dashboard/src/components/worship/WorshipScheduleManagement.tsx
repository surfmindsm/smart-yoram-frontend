import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, MapPin, Users, Monitor } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from '../ui/use-toast';
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

const SERVICE_TYPES = [
  { value: 'sunday_worship', label: '주일예배' },
  { value: 'wednesday_worship', label: '수요예배' },
  { value: 'dawn_prayer', label: '새벽기도회' },
  { value: 'friday_worship', label: '금요철야예배' },
  { value: 'special', label: '특별예배' },
];

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<WorshipService | null>(null);
  const [editingCategory, setEditingCategory] = useState<WorshipCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    day_of_week: '',
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
          console.log('⛪ Church ID from supabase_session:', churchId);
          return churchId;
        }
      }

      // Fallback to old 'user' key
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const churchId = user?.church_id;
        if (churchId) {
          console.log('⛪ Church ID from user:', churchId);
          return churchId;
        }
      }

      // Final fallback
      console.log('⛪ No church_id found in localStorage, using fallback: 6');
      return 6;
    } catch (error) {
      console.error('⛪ Error getting church_id from localStorage:', error);
      return 6;
    }
  };

  const churchId = getChurchId();

  useEffect(() => {
    fetchWorshipSchedule();
    // fetchCategories(); // Disable categories for now
  }, []);

  const fetchWorshipSchedule = async () => {
    try {
      console.log('⛪ 예배 서비스 목록 조회 시작, church_id:', churchId);

      const response = await supabaseApiService.worshipServices.getAll({
        church_id: churchId,
        page: 1,
        limit: 100
      });

      const servicesData = response?.data || [];
      console.log('⛪ 예배 서비스 조회 성공:', servicesData.length, '개');
      setServices(servicesData);

    } catch (error) {
      console.error('⛪ 예배 일정 조회 실패:', error);
      toast({
        title: '오류',
        description: '예배 일정을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.surfmind-team.com/api/v1';
      const response = await fetch(`${API_BASE_URL}/worship/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const serviceData = {
        church_id: churchId,
        name: formData.name,
        location: formData.location || undefined,
        day_of_week: formData.day_of_week ? parseInt(formData.day_of_week) : undefined,
        start_time: formData.start_time,
        end_time: formData.end_time || undefined,
        service_type: formData.service_type || undefined,
        target_group: formData.target_group || undefined,
        is_online: formData.is_online,
        is_active: formData.is_active,
        order_index: formData.order_index
      };

      console.log('⛪ 예배 서비스 저장 시작:', editingService ? '수정' : '생성', serviceData);

      if (editingService) {
        // 수정
        await supabaseApiService.worshipServices.update(editingService.id.toString(), serviceData);
        console.log('✅ 예배 서비스 수정 성공');
      } else {
        // 생성
        await supabaseApiService.worshipServices.create(serviceData as any);
        console.log('✅ 예배 서비스 생성 성공');
      }

      toast({
        title: '성공',
        description: editingService ? '예배 일정이 수정되었습니다.' : '예배 일정이 추가되었습니다.',
      });

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
      console.log('⛪ 예배 서비스 삭제 시작:', id);

      await supabaseApiService.worshipServices.delete(id.toString());

      console.log('✅ 예배 서비스 삭제 성공');
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
      day_of_week: service.day_of_week?.toString() || '',
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
      day_of_week: '',
      start_time: '',
      end_time: '',
      service_type: '',
      target_group: '',
      is_online: false,
      is_active: true,
      order_index: 0,
    });
  };

  const groupServicesByType = () => {
    const grouped: Record<string, WorshipService[]> = {};
    services.forEach(service => {
      const type = service.service_type || 'other';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(service);
    });
    return grouped;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">예배 시간 관리</h2>
        <div className="space-x-2">
          <Button onClick={() => setIsCategoryDialogOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            카테고리 관리
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            예배 추가
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="sunday">주일예배</TabsTrigger>
          <TabsTrigger value="weekday">주중예배</TabsTrigger>
          <TabsTrigger value="online">온라인</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {Object.entries(groupServicesByType()).map(([type, typeServices]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle>{SERVICE_TYPES.find(t => t.value === type)?.label || '기타'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {typeServices.map(service => (
                    <ServiceCard 
                      key={service.id} 
                      service={service} 
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sunday" className="space-y-4">
          {services
            .filter(s => s.service_type === 'sunday_worship')
            .map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
        </TabsContent>

        <TabsContent value="weekday" className="space-y-4">
          {services
            .filter(s => s.service_type !== 'sunday_worship')
            .map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
        </TabsContent>

        <TabsContent value="online" className="space-y-4">
          {services
            .filter(s => s.is_online)
            .map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
        </TabsContent>
      </Tabs>

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
                  {SERVICE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="day_of_week">요일</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="요일 선택" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">시작 시간</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">종료 시간</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
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
    </div>
  );
}

function ServiceCard({ 
  service, 
  onEdit, 
  onDelete 
}: { 
  service: WorshipService; 
  onEdit: (service: WorshipService) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{service.name}</h4>
          {service.is_online && <Monitor className="h-4 w-4 text-blue-500" />}
          {!service.is_active && <span className="text-xs text-gray-500">(비활성)</span>}
        </div>
        <div className="mt-1 space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            {service.day_of_week !== undefined && (
              <span>{DAY_OF_WEEK_MAPPING[service.day_of_week as keyof typeof DAY_OF_WEEK_MAPPING] || DAYS_OF_WEEK[service.day_of_week]}</span>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{service.start_time}</span>
              {service.end_time && <span>- {service.end_time}</span>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {service.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{service.location}</span>
              </div>
            )}
            {service.target_group && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{TARGET_GROUPS.find(g => g.value === service.target_group)?.label}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => onEdit(service)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(service.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}