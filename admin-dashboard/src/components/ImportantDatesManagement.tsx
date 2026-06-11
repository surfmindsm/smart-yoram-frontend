import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Button,
  Input,
  Card,
  LoadingState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  PageContainer,
  Checkbox,
  ConfirmDialog,
} from "./ui";
import { DatePicker } from "./ui/date-picker";
import {
  Calendar,
  Plus,
  Trash2,
  Bell,
  Search,
} from 'lucide-react';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { useToast } from '../hooks/use-toast';
import { usePageSubtitle, usePageActions } from '../hooks/usePageSubtitle';
import { formatDate as formatDateUtil } from '../utils/dateUtils';
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
  const { toast } = useToast();
  const location = useLocation();
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<ImportantDate | null>(null);

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📅 Important Dates API 에러:', errorText);
        throw new Error(`일정 목록 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      setDates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching dates:', error);
      toast({
        title: '일정 목록 조회 실패',
        description: '일정 목록을 불러오는데 실패했습니다',
        variant: 'destructive',
      });
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
        toast({
          title: '입력 오류',
          description: '제목은 필수입니다',
          variant: 'destructive',
        });
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

      // 낙관적 업데이트: UI 먼저 업데이트
      const tempId = editingDate?.id || Date.now();
      const memberData = formData.member_id ? members.find(m => m.id === parseInt(formData.member_id)) : undefined;

      const optimisticDate: ImportantDate = {
        id: tempId,
        church_id: editingDate?.church_id || 0,
        member_id: formData.member_id ? parseInt(formData.member_id) : undefined,
        title: formData.title,
        event_date: formData.event_date,
        enable_dday_alert: formData.event_date ? formData.enable_dday_alert : false,
        alert_days_before: parseInt(formData.alert_days_before.toString()),
        is_active: true,
        is_completed: editingDate?.is_completed || false,
        created_at: editingDate?.created_at || new Date().toISOString(),
        notes: formData.notes,
        members: memberData
      };

      if (editingDate) {
        // 수정: 기존 항목 업데이트
        setDates(prev => prev.map(d => d.id === editingDate.id ? optimisticDate : d));
      } else {
        // 추가: 목록 맨 위에 새 항목 추가
        setDates(prev => [optimisticDate, ...prev]);
      }

      setShowModal(false);
      resetForm();

      const toastInstance = toast({
        title: editingDate ? '일정 수정 완료' : '일정 등록 완료',
        description: editingDate ? '일정이 수정되었습니다' : '일정이 등록되었습니다',
      });
      setTimeout(() => toastInstance.dismiss(), 2000);

      // 백그라운드에서 서버에 저장
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

      // 서버 응답으로 실제 데이터 업데이트
      const savedData = await response.json();
      if (editingDate) {
        setDates(prev => prev.map(d => d.id === editingDate.id ? savedData : d));
      } else {
        setDates(prev => prev.map(d => d.id === tempId ? savedData : d));
      }
    } catch (error) {
      console.error('Error saving date:', error);
      const toastInstance = toast({
        title: '일정 저장 실패',
        description: '일정 저장에 실패했습니다',
        variant: 'destructive',
      });
      setTimeout(() => toastInstance.dismiss(), 2000);
      // 실패 시 롤백: 데이터 다시 불러오기
      fetchDates();
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // 낙관적 업데이트: UI에서 먼저 제거
      const prevDates = dates;
      setDates(prev => prev.filter(d => d.id !== id));

      const toastInstance = toast({
        title: '일정 삭제 완료',
        description: '일정이 삭제되었습니다',
      });
      setTimeout(() => toastInstance.dismiss(), 2000);

      // 백그라운드에서 서버에서 삭제
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
    } catch (error) {
      console.error('Error deleting date:', error);
      const toastInstance = toast({
        title: '일정 삭제 실패',
        description: '일정 삭제에 실패했습니다',
        variant: 'destructive',
      });
      setTimeout(() => toastInstance.dismiss(), 2000);
      // 실패 시 롤백
      fetchDates();
    }
  };

  const handleComplete = async (date: ImportantDate) => {
    try {
      // 낙관적 업데이트: UI에서 먼저 상태 변경
      const newCompletedStatus = !date.is_completed;
      setDates(prev => prev.map(d =>
        d.id === date.id
          ? { ...d, is_completed: newCompletedStatus, completed_at: newCompletedStatus ? new Date().toISOString() : undefined }
          : d
      ));

      const toastInstance = toast({
        title: date.is_completed ? '미완료로 변경' : '완료 처리',
        description: date.is_completed ? '일정이 미완료로 변경되었습니다' : '일정이 완료되었습니다',
      });
      setTimeout(() => toastInstance.dismiss(), 2000);

      // 백그라운드에서 서버에 저장
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
          is_completed: newCompletedStatus
        })
      });

      if (!response.ok) throw new Error('상태 변경 실패');

      // 서버 응답으로 실제 데이터 업데이트
      const updatedData = await response.json();
      setDates(prev => prev.map(d => d.id === date.id ? updatedData : d));
    } catch (error) {
      console.error('Error updating status:', error);
      const toastInstance = toast({
        title: '상태 변경 실패',
        description: '상태 변경에 실패했습니다',
        variant: 'destructive',
      });
      setTimeout(() => toastInstance.dismiss(), 2000);
      // 실패 시 롤백
      fetchDates();
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

  // 검색 + 상태 필터 + 정렬
  const filteredDates = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return dates
      .filter(d => {
        if (statusFilter === 'active' && (d.is_completed || !d.is_active)) return false;
        if (statusFilter === 'completed' && !d.is_completed) return false;
        if (search) {
          return (
            d.title.toLowerCase().includes(search) ||
            d.members?.name.toLowerCase().includes(search)
          );
        }
        return true;
      })
      .sort((a, b) => {
        // 미완료 우선, 그 다음 날짜순(가까운 것부터)
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        return (a.event_date || '').localeCompare(b.event_date || '');
      });
  }, [dates, searchTerm, statusFilter]);

  const getDaysUntil = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDdayLabel = (days: number) => {
    if (days < 0) return `D+${Math.abs(days)}`;
    if (days === 0) return 'D-Day';
    return `D-${days}`;
  };

  const getDdayClass = (days: number) => {
    if (days < 0) return 'bg-[#F1F4F9] text-[#64748B]';     // 지난 일정
    if (days === 0) return 'bg-[#FCEBEB] text-[#DC2626]';   // 오늘
    if (days <= 7) return 'bg-[#FBF1E3] text-[#B45309]';    // 7일 이내
    return 'bg-[#EAF1FE] text-[#2563EB]';                    // 일반
  };

  // 상단바
  usePageSubtitle(`전체 ${dates.length}건`);
  usePageActions(
    <Button onClick={handleAdd} size="sm" className="gap-2">
      <Plus className="h-3.5 w-3.5" />
      일정 추가
    </Button>,
    [dates.length]
  );

  return (
    <PageContainer>
      {loading ? (
        <Card>
          <LoadingState text="일정 목록을 불러오는 중..." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* 검색 + 필터 바 */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF1F6] px-[16px] py-[14px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                type="text"
                placeholder="제목·교인 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:w-[320px]"
              />
            </div>

            <div className="flex-1" />

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-[38px] w-auto min-w-[140px] gap-2">
                <span className="text-[12.5px] text-muted-foreground">상태</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 빈 상태 또는 테이블 */}
          {filteredDates.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
              <h3 className="mb-2 text-[15px] font-bold text-foreground">
                {searchTerm || statusFilter !== 'all' ? '조건에 맞는 일정이 없습니다' : '일정이 없습니다'}
              </h3>
              <p className="mb-4 text-[13px] text-muted-foreground">
                {searchTerm || statusFilter !== 'all' ? '검색어나 필터를 조정해보세요.' : '새로운 일정을 추가해보세요.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={handleAdd} size="sm" className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  일정 추가
                </Button>
              )}
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[44px]" />
                <col />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[100px]" />
                <col className="w-[60px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                  <th className="px-3 py-3"></th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">제목</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">날짜</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">교인</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">D-day</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">알림</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {filteredDates.map((date) => {
                  const daysUntil = date.event_date ? getDaysUntil(date.event_date) : null;
                  return (
                    <tr
                      key={date.id}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-[#F8FAFD]',
                        date.is_completed && 'opacity-60'
                      )}
                      onClick={() => handleEdit(date)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={date.is_completed}
                          onCheckedChange={() => handleComplete(date)}
                        />
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-[13px] font-semibold text-foreground truncate',
                          date.is_completed && 'line-through text-muted-foreground'
                        )}
                        title={date.title}
                      >
                        {date.title}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                        {date.event_date ? formatDateUtil(date.event_date) : <span className="text-[#CBD5E1]">-</span>}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground truncate">
                        {date.members?.name || <span className="text-[#CBD5E1]">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {daysUntil !== null && !date.is_completed ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                              getDdayClass(daysUntil)
                            )}
                          >
                            {getDdayLabel(daysUntil)}
                          </span>
                        ) : (
                          <span className="text-[#CBD5E1]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {date.enable_dday_alert && (
                          <Bell className="mx-auto h-3.5 w-3.5 text-primary" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </Card>
      )}

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
          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between sm:gap-2">
            {!viewOnly && editingDate ? (
              <Button
                type="button"
                variant="destructive-soft"
                onClick={() => {
                  const target = editingDate;
                  setShowModal(false);
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
              <Button variant="ghost" onClick={() => { setShowModal(false); setViewOnly(false); }}>
                {viewOnly ? '닫기' : '취소'}
              </Button>
              {!viewOnly && (
                <Button onClick={handleSave}>
                  {editingDate ? '수정' : '저장'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="일정 삭제"
        description={
          <span>
            <span className="font-semibold">"{deleteTarget?.title}"</span> 일정을 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </span>
        }
        confirmText="삭제"
        variant="destructive"
        onConfirm={async () => {
          if (deleteTarget) {
            await handleDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </PageContainer>
  );
};

export default ImportantDatesManagement;
