import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from "./ui";
import { Input } from "./ui";
import { Card, CardContent } from "./ui";
import { Badge } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { DatePicker } from "./ui/date-picker";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  Bell,
  Search
} from 'lucide-react';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';

interface Member {
  id: number;
  name: string;
  phone?: string;
}

interface ImportantDate {
  id: number;
  church_id: number;
  member_id?: number;
  title: string;
  event_date: string;
  description?: string;
  enable_dday_alert: boolean;
  alert_days_before: number;
  is_active: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  notes?: string;
  members?: Member;
}

const ImportantDatesManagement: React.FC = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    member_id: '',
    title: '',
    event_date: '',
    enable_dday_alert: true,
    alert_days_before: 7,
    notes: ''
  });

  useEffect(() => {
    fetchDates();
    fetchMembers();
  }, []);

  // location.state로 전달된 항목이 있으면 자동으로 다이얼로그 열기
  useEffect(() => {
    const state = location.state as { dateId?: number; action?: string } | null;
    if (state?.dateId && dates.length > 0) {
      const targetDate = dates.find(d => d.id === state.dateId);
      if (targetDate) {
        setEditingDate(targetDate);
        setFormData({
          member_id: targetDate.member_id?.toString() || '',
          title: targetDate.title,
          event_date: targetDate.event_date,
          enable_dday_alert: targetDate.enable_dday_alert,
          alert_days_before: targetDate.alert_days_before,
          notes: targetDate.notes || ''
        });
        setViewOnly(state.action === 'view');
        setShowModal(true);
        // state 초기화 (뒤로가기 시 재실행 방지)
        window.history.replaceState({}, document.title);
      }
    }
  }, [dates, location.state]);

  const fetchDates = async () => {
    try {
      setLoading(true);
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const token = await supabaseAuthService.getToken();

      const response = await fetch(`${supabaseUrl}/functions/v1/important-dates`, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token || '',
          'Content-Type': 'application/json'
        }
      });

      console.log('📅 Important Dates API 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📅 Important Dates API 에러:', errorText);
        throw new Error(`일정 목록 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('📅 Important Dates API 응답:', data);
      setDates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching dates:', error);
      showToast('일정 목록을 불러오는데 실패했습니다', 'error');
      setDates([]); // 에러 시 빈 배열로 설정
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const token = await supabaseAuthService.getToken();

      const response = await fetch(`${supabaseUrl}/functions/v1/members`, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('교인 목록 조회 실패');

      const data = await response.json();
      console.log('📋 Members API 응답:', data);
      // data.data 배열 추출 또는 빈 배열
      const membersArray = data?.data || data;
      setMembers(Array.isArray(membersArray) ? membersArray : []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]); // 에러 시 빈 배열로 설정
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.title) {
        showToast('제목은 필수입니다', 'error');
        return;
      }

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const token = await supabaseAuthService.getToken();

      const url = editingDate
        ? `${supabaseUrl}/functions/v1/important-dates/${editingDate.id}`
        : `${supabaseUrl}/functions/v1/important-dates`;

      const method = editingDate ? 'PUT' : 'POST';

      // 날짜가 없으면 D-day 알림을 자동으로 비활성화
      const dataToSave = {
        ...formData,
        member_id: formData.member_id ? parseInt(formData.member_id) : null,
        enable_dday_alert: formData.event_date ? formData.enable_dday_alert : false,
        alert_days_before: parseInt(formData.alert_days_before.toString())
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ 저장 실패:', errorData);
        throw new Error(errorData.error || '일정 저장 실패');
      }

      showToast(
        editingDate ? '일정이 수정되었습니다' : '일정이 등록되었습니다',
        'success'
      );

      setShowModal(false);
      resetForm();
      fetchDates();
    } catch (error) {
      console.error('Error saving date:', error);
      showToast('일정 저장에 실패했습니다', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const token = await supabaseAuthService.getToken();

      const response = await fetch(`${supabaseUrl}/functions/v1/important-dates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('일정 삭제 실패');

      showToast('일정이 삭제되었습니다', 'success');
      fetchDates();
    } catch (error) {
      console.error('Error deleting date:', error);
      showToast('일정 삭제에 실패했습니다', 'error');
    }
  };

  const handleComplete = async (date: ImportantDate) => {
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const token = await supabaseAuthService.getToken();

      const response = await fetch(`${supabaseUrl}/functions/v1/important-dates/${date.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_completed: !date.is_completed
        })
      });

      if (!response.ok) throw new Error('상태 변경 실패');

      showToast(
        date.is_completed ? '일정이 미완료로 변경되었습니다' : '일정이 완료되었습니다',
        'success'
      );
      fetchDates();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('상태 변경에 실패했습니다', 'error');
    }
  };

  const handleEdit = (date: ImportantDate) => {
    setEditingDate(date);
    setFormData({
      member_id: date.member_id?.toString() || '',
      title: date.title,
      event_date: date.event_date,
      enable_dday_alert: date.enable_dday_alert,
      alert_days_before: date.alert_days_before,
      notes: date.notes || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingDate(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      member_id: '',
      title: '',
      event_date: '',
      enable_dday_alert: true,
      alert_days_before: 7,
      notes: ''
    });
    setEditingDate(null);
  };

  // 검색 필터
  const searchFilter = (date: ImportantDate) => {
    if (!searchTerm) return true;
    return (
      date.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      date.members?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 활성 항목 (미완료)
  const activeDates = dates.filter(date =>
    date.is_active && !date.is_completed && searchFilter(date)
  );

  // 완료된 항목
  const completedDates = dates.filter(date =>
    date.is_completed && searchFilter(date)
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDaysUntil = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <PageContainer>
      <PageHeader title="중요 일정 관리" />

      {/* Add and Search */}
      <div className="mb-6 flex gap-3">
        <Button onClick={handleAdd} size="lg" className="text-base px-6">
          <Plus className="h-5 w-5 mr-2" />
          일정 추가
        </Button>
        <div className="relative flex-1 max-w-sm ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Active Dates List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              불러오는 중...
            </CardContent>
          </Card>
        ) : activeDates.length === 0 && completedDates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>일정이 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 활성 일정 */}
            <div className="space-y-3">
              {activeDates.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground text-sm">
                    활성 일정이 없습니다
                  </CardContent>
                </Card>
              ) : (
                activeDates.map((date) => {
                  const daysUntil = getDaysUntil(date.event_date);
                  return (
                    <Card key={date.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* 좌측 체크박스 */}
                          <button
                            onClick={() => handleComplete(date)}
                            className="mt-1 flex-shrink-0 transition-colors hover:text-primary"
                          >
                            <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                          </button>

                          {/* 중앙 콘텐츠 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{date.title}</h3>
                              {date.enable_dday_alert && (
                                <Bell className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {date.event_date && <p>날짜: {formatDate(date.event_date)}</p>}
                              {date.members && <p>교인: {date.members.name}</p>}
                              {date.notes && <p>메모: {date.notes}</p>}
                              {date.enable_dday_alert && (
                                <p>알림: {date.alert_days_before}일 전부터</p>
                              )}
                            </div>
                          </div>

                          {/* 우측 액션 버튼과 D-day */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {date.event_date && (
                              <Badge
                                variant={daysUntil < 0 ? "secondary" : daysUntil === 0 ? "destructive" : "default"}
                              >
                                {daysUntil < 0 ? `D+${Math.abs(daysUntil)}` : daysUntil === 0 ? 'D-Day' : `D-${daysUntil}`}
                              </Badge>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(date)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(date.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* 완료된 항목 토글 버튼 */}
            {completedDates.length > 0 && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  완료된 항목 {completedDates.length}개 {showCompleted ? '숨기기' : '보기'}
                </Button>
              </div>
            )}

            {/* 완료된 일정 */}
            {showCompleted && completedDates.length > 0 && (
              <div className="space-y-3 pt-2">
                {completedDates.map((date) => (
                  <Card key={date.id} className="hover:shadow-md transition-shadow opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* 좌측 체크박스 */}
                        <button
                          onClick={() => handleComplete(date)}
                          className="mt-1 flex-shrink-0 transition-colors hover:text-primary"
                        >
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        </button>

                        {/* 중앙 콘텐츠 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold line-through text-muted-foreground">
                              {date.title}
                            </h3>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {date.event_date && <p>날짜: {formatDate(date.event_date)}</p>}
                            {date.members && <p>교인: {date.members.name}</p>}
                            {date.notes && <p>메모: {date.notes}</p>}
                          </div>
                        </div>

                        {/* 우측 액션 버튼 */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(date)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(date.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) setViewOnly(false); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewOnly ? '일정 상세' : editingDate ? '일정 수정' : '일정 추가'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="예: 홍길동 집사님 회갑연"
                disabled={viewOnly}
              />
            </div>
            <div>
              <Label htmlFor="member_id">교인 (선택)</Label>
              <Select
                value={formData.member_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, member_id: value === "none" ? "" : value })}
                disabled={viewOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="교인 선택..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안함</SelectItem>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name} {member.phone && `(${member.phone})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">메모</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="추가 메모 사항"
                rows={3}
                disabled={viewOnly}
              />
            </div>
            <div>
              <Label htmlFor="event_date">날짜</Label>
              <DatePicker
                value={formData.event_date}
                onChange={(value) => setFormData({ ...formData, event_date: value })}
                disabled={viewOnly}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable_dday_alert"
                checked={formData.enable_dday_alert}
                onChange={(e) => setFormData({ ...formData, enable_dday_alert: e.target.checked })}
                disabled={!formData.event_date || viewOnly}
                className="rounded disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Label htmlFor="enable_dday_alert" className={!formData.event_date ? 'opacity-50' : ''}>
                D-day 알림 활성화 {!formData.event_date && '(날짜 선택 필요)'}
              </Label>
            </div>
            {formData.enable_dday_alert && formData.event_date && (
              <div>
                <Label htmlFor="alert_days_before">며칠 전부터 알림 표시</Label>
                <Input
                  id="alert_days_before"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.alert_days_before}
                  onChange={(e) => setFormData({ ...formData, alert_days_before: parseInt(e.target.value) || 7 })}
                  disabled={viewOnly}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); setViewOnly(false); }}>
              {viewOnly ? '닫기' : '취소'}
            </Button>
            {!viewOnly && (
              <Button onClick={handleSave}>
                {editingDate ? '수정' : '저장'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default ImportantDatesManagement;
