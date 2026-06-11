import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Check } from 'lucide-react';
import { supabaseApiService } from '../services/supabaseApiService';
import { formatDate as formatDateUtil } from '../utils/dateUtils';
import {
  Button,
  Card,
  LoadingState,
  Input,
  Label,
  Textarea,
  PageContainer,
  ConfirmDialog,
  toast,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui";
import { DatePicker } from "./ui/date-picker";
import { usePageSubtitle, usePageActions } from "../hooks/usePageSubtitle";
import { cn } from "../lib/utils";

interface Announcement {
  id: number;
  title: string;
  content: string;
  category?: string;
  priority: 'urgent' | 'important' | 'normal';
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  author_name?: string;
  is_pinned?: boolean;
  target_audience?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'worship', label: '예배/모임' },
  { value: 'member_news', label: '교우 소식' },
  { value: 'event', label: '행사/공지' },
];

// 카테고리별 칩 색상 (Direction C 톤)
const CATEGORY_CHIP_CLASS: Record<string, string> = {
  worship: 'bg-[#EAF1FE] text-[#2563EB]',       // 파랑 — 예배/모임
  member_news: 'bg-[#E7F6EC] text-[#16A34A]',   // 녹색 — 교우 소식
  event: 'bg-[#F3E8FF] text-[#7E22CE]',         // 보라 — 행사/공지
};

const getCategoryLabel = (category?: string) => {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.label || '행사/공지';
};

const getCategoryChipClass = (category?: string) => {
  return CATEGORY_CHIP_CLASS[category || ''] || 'bg-[#F1F4F9] text-[#64748B]';
};

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
      if (user?.church_id) return user.church_id;
    }
    return 6;
  } catch {
    return 6;
  }
};

const getUserInfo = () => {
  try {
    const sessionStr = localStorage.getItem('supabase_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      return {
        id: session?.user?.id,
        name: session?.user?.name || session?.user?.user_metadata?.name,
      };
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return { id: user?.id, name: user?.name || user?.username };
    }
    return { id: 1, name: '관리자' };
  } catch {
    return { id: 1, name: '관리자' };
  }
};

const AnnouncementManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const churchId = getChurchId();

  // React Query 캐시
  const announcementsQuery = useQuery({
    queryKey: ['announcements', churchId],
    queryFn: async () => {
      const response = await supabaseApiService.announcements.getAll({
        church_id: churchId,
        limit: 100,
      });
      return (response?.data || []) as Announcement[];
    },
    staleTime: 60_000,
  });

  const announcements: Announcement[] = announcementsQuery.data || [];
  const isLoading = announcementsQuery.isLoading;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['announcements'] });

  // 필터
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    priority: 'normal' as 'urgent' | 'important' | 'normal',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const resetForm = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      category: '',
      priority: 'normal',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category || '',
      priority: announcement.priority,
      start_date: announcement.start_date ? announcement.start_date.split('T')[0] : '',
      end_date: announcement.end_date ? announcement.end_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast({ title: '오류', description: '카테고리를 선택해주세요.', variant: 'destructive' });
      return;
    }
    if (!formData.title.trim()) {
      toast({ title: '오류', description: '제목을 입력해주세요.', variant: 'destructive' });
      return;
    }
    if (!formData.content.trim()) {
      toast({ title: '오류', description: '내용을 입력해주세요.', variant: 'destructive' });
      return;
    }

    try {
      setSubmitLoading(true);
      const userInfo = getUserInfo();
      const submitData = {
        ...formData,
        end_date: formData.end_date || undefined,
        church_id: churchId,
        author_id: userInfo.id,
        author_name: userInfo.name,
        target_audience: 'all',
        is_pinned: false,
        is_active: true,
      };

      if (editingAnnouncement) {
        await supabaseApiService.announcements.update(editingAnnouncement.id.toString(), submitData);
        toast({ title: '성공', description: '공지사항이 수정되었습니다.' });
      } else {
        await supabaseApiService.announcements.create(submitData);
        toast({ title: '성공', description: '공지사항이 생성되었습니다.' });
      }
      closeModal();
      invalidate();
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
      toast({ title: '오류', description: '공지사항 저장에 실패했습니다.', variant: 'destructive' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await supabaseApiService.announcements.delete(deleteTarget.id.toString());
      toast({ title: '성공', description: '공지사항이 삭제되었습니다.' });
      setDeleteTarget(null);
      invalidate();
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      toast({ title: '오류', description: '공지사항 삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  const requestDelete = () => {
    if (!editingAnnouncement) return;
    const target = editingAnnouncement;
    closeModal();
    setDeleteTarget(target);
  };

  // 필터 + 최신순 정렬
  const filteredAnnouncements = useMemo(() => {
    let list = [...announcements];
    if (categoryFilter !== 'all') {
      list = list.filter(a => a.category === categoryFilter);
    }
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [announcements, categoryFilter]);

  // 상단바
  usePageSubtitle(`전체 ${announcements.length}건`);
  usePageActions(
    <>
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="h-[38px] w-auto min-w-[160px] gap-2">
          <span className="text-[12.5px] text-muted-foreground">카테고리</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          {CATEGORY_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={openAddModal} size="sm" className="gap-2">
        <Plus className="h-3.5 w-3.5" />
        공지사항 추가
      </Button>
    </>,
    [categoryFilter, announcements.length]
  );

  return (
    <PageContainer>
      {isLoading ? (
        <Card>
          <LoadingState text="공지사항을 불러오는 중..." />
        </Card>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <h3 className="mb-2 text-[15px] font-bold text-foreground">
              {categoryFilter === 'all' ? '등록된 공지사항이 없습니다' : '해당 카테고리에 공지사항이 없습니다'}
            </h3>
            <p className="mb-4 text-[13px] text-muted-foreground">새로운 공지사항을 추가해보세요.</p>
            <Button onClick={openAddModal} size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              공지사항 추가
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[140px]" />
                <col />
                <col className="w-[160px]" />
                <col className="w-[140px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">카테고리</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">제목</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">작성자</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">작성일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {filteredAnnouncements.map((announcement) => (
                  <tr
                    key={announcement.id}
                    className="cursor-pointer transition-colors hover:bg-[#F8FAFD]"
                    onClick={() => openEditModal(announcement)}
                  >
                    <td className="px-4 py-3 text-[13px]">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                        getCategoryChipClass(announcement.category)
                      )}>
                        {getCategoryLabel(announcement.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-foreground truncate" title={announcement.title}>
                      {announcement.title}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground truncate">
                      {announcement.author_name || '관리자'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                      {formatDateUtil(announcement.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 추가/수정 모달 */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? '공지사항 수정' : '공지사항 추가'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-[12.5px] font-semibold">
                카테고리 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category || undefined}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-[12.5px] font-semibold">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="공지사항 제목"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content" className="text-[12.5px] font-semibold">
                내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                required
                placeholder="공지사항 내용을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">
                  게시 시작일 <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  value={formData.start_date}
                  onChange={(value) => setFormData({ ...formData, start_date: value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">게시 종료일</Label>
                <DatePicker
                  value={formData.end_date}
                  onChange={(value) => setFormData({ ...formData, end_date: value })}
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between sm:gap-2">
              {editingAnnouncement ? (
                <Button
                  type="button"
                  variant="destructive-soft"
                  onClick={requestDelete}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={closeModal}>
                  취소
                </Button>
                <Button type="submit" disabled={submitLoading}>
                  <Check className="mr-1 h-3.5 w-3.5" />
                  {submitLoading ? '저장 중...' : (editingAnnouncement ? '수정' : '추가')}
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

export default AnnouncementManagement;
