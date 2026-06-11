import React, { useState, useEffect, useMemo } from 'react';
import { formatDate as formatDateUtil } from '../utils/dateUtils';
import {
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Megaphone,
  Globe,
  Users,
  Check,
} from 'lucide-react';
import {
  Card,
  LoadingState,
  Button,
  Input,
  Textarea,
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
  ConfirmDialog,
  PageContainer,
  Checkbox,
  toast,
} from "./ui";
import { DatePicker } from "./ui/date-picker";
import { announcementService, Announcement, AnnouncementCreate, Church } from '../services/announcementService';
import { usePageSubtitle, usePageActions } from '../hooks/usePageSubtitle';
import { cn } from '../lib/utils';

const PRIORITY_CHIP: Record<string, string> = {
  urgent: 'bg-[#FCEBEB] text-[#DC2626]',
  important: 'bg-[#FBF1E3] text-[#B45309]',
  normal: 'bg-[#EAF1FE] text-[#2563EB]',
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: '긴급',
  important: '중요',
  normal: '일반',
};

const SystemAnnouncementManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementCreate>({
    title: '',
    content: '',
    priority: 'normal',
    target_type: 'all',
    start_date: new Date().toISOString().split('T')[0],
    is_active: true,
  });

  useEffect(() => {
    loadAnnouncements();
    loadChurches();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getSystemAnnouncementsAdmin();
      setAnnouncements(data);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error('시스템 공지사항 로드 실패:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadChurches = async () => {
    try {
      const data = await announcementService.getChurches();
      setChurches(data);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error('교회 목록 로드 실패:', error);
      }
    }
  };

  const resetForm = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      target_type: 'all',
      start_date: new Date().toISOString().split('T')[0],
      is_active: true,
    });
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      target_type: announcement.target_type,
      target_church_ids: announcement.target_church_ids,
      church_id: announcement.church_id,
      start_date: announcement.start_date.split('T')[0],
      end_date: announcement.end_date?.split('T')[0],
      is_active: announcement.is_active,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: '오류', description: '제목을 입력해주세요.', variant: 'destructive' });
      return;
    }
    if (!formData.content.trim()) {
      toast({ title: '오류', description: '내용을 입력해주세요.', variant: 'destructive' });
      return;
    }
    try {
      if (editingAnnouncement) {
        await announcementService.updateSystemAnnouncement(editingAnnouncement.id, formData);
        toast({ title: '성공', description: '공지사항이 수정되었습니다.' });
      } else {
        await announcementService.createSystemAnnouncement(formData);
        toast({ title: '성공', description: '공지사항이 등록되었습니다.' });
      }
      await loadAnnouncements();
      closeDialog();
    } catch (error) {
      console.error('시스템 공지사항 저장 실패:', error);
      toast({ title: '오류', description: '저장에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await announcementService.deleteSystemAnnouncement(deleteTarget.id);
      toast({ title: '성공', description: '공지사항이 삭제되었습니다.' });
      setDeleteTarget(null);
      await loadAnnouncements();
    } catch (error) {
      console.error('시스템 공지사항 삭제 실패:', error);
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (announcement: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await announcementService.updateSystemAnnouncement(announcement.id, {
        is_active: !announcement.is_active,
      });
      await loadAnnouncements();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      toast({ title: '오류', description: '상태 변경에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleTargetTypeChange = (targetType: 'all' | 'specific' | 'single') => {
    setFormData(prev => ({
      ...prev,
      target_type: targetType,
      target_church_ids: targetType === 'specific' ? [] : undefined,
      church_id: undefined,
    }));
  };

  const handleChurchSelection = (churchId: number, selected: boolean) => {
    if (formData.target_type !== 'specific') return;
    const currentIds = formData.target_church_ids || [];
    setFormData(prev => ({
      ...prev,
      target_church_ids: selected
        ? [...currentIds, churchId]
        : currentIds.filter(id => id !== churchId),
    }));
  };

  const getPriorityChipClass = (priority?: string) =>
    PRIORITY_CHIP[priority || 'normal'] || PRIORITY_CHIP.normal;
  const getPriorityLabel = (priority?: string) =>
    PRIORITY_LABEL[priority || 'normal'] || PRIORITY_LABEL.normal;

  const getTargetLabel = (a: Announcement) => {
    if (a.target_type === 'all') return '전체 교회';
    if (a.target_type === 'specific') return `선택 ${a.target_church_ids?.length || 0}개`;
    if (a.target_type === 'single') return `교회 #${a.church_id}`;
    return '-';
  };

  const getTargetIcon = (target_type: string) => {
    if (target_type === 'all') return <Globe className="h-3 w-3 text-[#94A3B8]" />;
    return <Users className="h-3 w-3 text-[#94A3B8]" />;
  };

  const sortedAnnouncements = useMemo(
    () => [...announcements].sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [announcements]
  );

  // 상단바
  usePageSubtitle(`전체 ${announcements.length}건`);
  usePageActions(
    <Button onClick={openAddDialog} size="sm" className="gap-2">
      <Plus className="h-3.5 w-3.5" />
      공지 작성
    </Button>,
    [announcements.length]
  );

  return (
    <PageContainer>
      {loading ? (
        <Card>
          <LoadingState text="공지사항을 불러오는 중..." />
        </Card>
      ) : sortedAnnouncements.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Megaphone className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
            <h3 className="mb-2 text-[15px] font-bold text-foreground">등록된 공지사항이 없습니다</h3>
            <p className="mb-4 text-[13px] text-muted-foreground">새로운 시스템 공지를 작성해보세요.</p>
            <Button onClick={openAddDialog} size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              공지 작성
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[80px]" />
                <col />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[100px]" />
                <col className="w-[80px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">우선</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">제목</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">대상</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">게시 기간</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">상태</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">노출</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {sortedAnnouncements.map((announcement) => (
                  <tr
                    key={announcement.id}
                    onClick={() => openEditDialog(announcement)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-[#F8FAFD]',
                      !announcement.is_active && 'opacity-60'
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                        getPriorityChipClass(announcement.priority)
                      )}>
                        {getPriorityLabel(announcement.priority)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-foreground truncate" title={announcement.title}>
                      {announcement.title}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {getTargetIcon(announcement.target_type)}
                        {getTargetLabel(announcement)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                      {formatDateUtil(announcement.start_date)}
                      {announcement.end_date && (
                        <span className="text-[#94A3B8]"> ~ {formatDateUtil(announcement.end_date)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      {announcement.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-[#E7F6EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#16A34A]">
                          활성
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-[#F1F4F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">
                          비활성
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleToggleActive(announcement, e)}
                        className="h-7 w-7 p-0 text-[#94A3B8] hover:bg-secondary hover:text-foreground"
                        title={announcement.is_active ? '비활성화' : '활성화'}
                      >
                        {announcement.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 추가/수정 모달 */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? '시스템 공지 수정' : '시스템 공지 작성'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* 대상 + 우선순위 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">공지 대상</Label>
                <Select value={formData.target_type} onValueChange={handleTargetTypeChange as any}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 교회</SelectItem>
                    <SelectItem value="specific">선택된 교회들</SelectItem>
                    <SelectItem value="single">단일 교회</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">우선순위</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'urgent' | 'important' | 'normal') =>
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">일반</SelectItem>
                    <SelectItem value="important">중요</SelectItem>
                    <SelectItem value="urgent">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 교회 선택 (specific) */}
            {formData.target_type === 'specific' && (
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">
                  대상 교회 선택 <span className="ml-1 text-[11px] font-normal text-muted-foreground">({formData.target_church_ids?.length || 0}개)</span>
                </Label>
                <div className="max-h-40 overflow-y-auto rounded-[8px] border border-border bg-[#FAFBFD] p-2.5">
                  {churches.length > 0 ? (
                    churches.map((church) => (
                      <label
                        key={church.id}
                        className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 hover:bg-[#F8FAFD]"
                      >
                        <Checkbox
                          checked={formData.target_church_ids?.includes(church.id) || false}
                          onCheckedChange={(c) => handleChurchSelection(church.id, c === true)}
                        />
                        <span className="text-[13px] text-foreground">{church.name}</span>
                      </label>
                    ))
                  ) : (
                    <p className="py-3 text-center text-[12px] text-muted-foreground">교회 목록을 불러오는 중...</p>
                  )}
                </div>
              </div>
            )}

            {/* 단일 교회 선택 */}
            {formData.target_type === 'single' && (
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">대상 교회</Label>
                <Select
                  value={formData.church_id?.toString() || undefined}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, church_id: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="교회를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {churches.map((church) => (
                      <SelectItem key={church.id} value={church.id.toString()}>{church.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 제목 */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-[12.5px] font-semibold">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="공지사항 제목"
                required
              />
            </div>

            {/* 내용 */}
            <div className="space-y-1.5">
              <Label htmlFor="content" className="text-[12.5px] font-semibold">
                내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="공지사항 내용"
                rows={6}
                required
              />
            </div>

            {/* 게시 기간 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">
                  시작일 <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  value={formData.start_date}
                  onChange={(value) => setFormData(prev => ({ ...prev, start_date: value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">종료일</Label>
                <DatePicker
                  value={formData.end_date || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, end_date: value || undefined }))}
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between sm:gap-2">
              {editingAnnouncement ? (
                <Button
                  type="button"
                  variant="destructive-soft"
                  onClick={() => {
                    const target = editingAnnouncement;
                    closeDialog();
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
                <Button type="button" variant="ghost" onClick={closeDialog}>
                  취소
                </Button>
                <Button type="submit">
                  <Check className="mr-1 h-3.5 w-3.5" />
                  {editingAnnouncement ? '수정' : '등록'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="공지사항 삭제"
        description={
          <span>
            <span className="font-semibold">"{deleteTarget?.title}"</span> 공지사항을 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </span>
        }
        confirmText="삭제"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
};

export default SystemAnnouncementManagement;
