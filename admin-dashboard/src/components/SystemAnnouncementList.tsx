import React, { useState, useEffect } from 'react';
import { formatDate as formatDateUtil } from '../utils/dateUtils';
import { Megaphone } from 'lucide-react';
import {
  Card,
  LoadingState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  PageContainer,
} from "./ui";
import { announcementService, Announcement } from '../services/announcementService';
import { usePageSubtitle } from '../hooks/usePageSubtitle';
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

const getPriorityChipClass = (priority?: string) =>
  PRIORITY_CHIP[priority || 'normal'] || PRIORITY_CHIP.normal;
const getPriorityLabel = (priority?: string) =>
  PRIORITY_LABEL[priority || 'normal'] || PRIORITY_LABEL.normal;

const SystemAnnouncementList: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [readAnnouncements, setReadAnnouncements] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadAnnouncements();
    loadReadStatus();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getActiveSystemAnnouncements();
      setAnnouncements(data);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error('시스템 공지사항 로드 실패:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReadStatus = () => {
    try {
      const stored = localStorage.getItem('readSystemAnnouncements');
      if (stored) {
        setReadAnnouncements(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('읽음 상태 로드 실패:', error);
    }
  };

  const handleViewDetail = async (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDetailDialogOpen(true);

    if (!readAnnouncements.has(announcement.id)) {
      try {
        await announcementService.markSystemAnnouncementAsRead(announcement.id);
        const newReadSet = new Set(readAnnouncements);
        newReadSet.add(announcement.id);
        setReadAnnouncements(newReadSet);
        localStorage.setItem('readSystemAnnouncements', JSON.stringify(Array.from(newReadSet)));
      } catch (error) {
        console.error('읽음 처리 실패:', error);
      }
    }
  };

  const isRead = (announcementId: number) => readAnnouncements.has(announcementId);
  const unreadCount = announcements.filter(a => !isRead(a.id)).length;

  usePageSubtitle(
    unreadCount > 0
      ? `전체 ${announcements.length}건 · 읽지 않음 ${unreadCount}건`
      : `전체 ${announcements.length}건`
  );

  return (
    <PageContainer>
      {loading ? (
        <Card>
          <LoadingState text="공지사항을 불러오는 중..." />
        </Card>
      ) : announcements.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Megaphone className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
            <h3 className="mb-2 text-[15px] font-bold text-foreground">활성화된 공지사항이 없습니다</h3>
            <p className="text-[13px] text-muted-foreground">새로운 시스템 공지가 등록되면 여기에 표시됩니다.</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[100px]" />
                <col />
                <col className="w-[140px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">구분</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">제목</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">등록일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {announcements.map((announcement) => {
                  const read = isRead(announcement.id);
                  return (
                    <tr
                      key={announcement.id}
                      onClick={() => handleViewDetail(announcement)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        read ? 'hover:bg-[#F8FAFD]' : 'bg-[#EEF3FC] hover:bg-[#E0EAFA]'
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
                      <td className="px-4 py-3 text-[13px] truncate" title={announcement.title}>
                        <span className={cn(
                          'font-semibold',
                          read ? 'text-foreground' : 'text-foreground'
                        )}>
                          {announcement.title}
                        </span>
                        {!read && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-[#DC2626] px-1.5 py-0 text-[10px] font-bold text-white">
                            NEW
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                        {formatDateUtil(announcement.start_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 상세보기 다이얼로그 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[80vh] overflow-y-auto">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    getPriorityChipClass(selectedAnnouncement.priority)
                  )}>
                    {getPriorityLabel(selectedAnnouncement.priority)}
                  </span>
                </div>
                <DialogTitle>{selectedAnnouncement.title}</DialogTitle>
                <div className="mt-1 text-[12px] text-muted-foreground tabular-nums">
                  {formatDateUtil(selectedAnnouncement.start_date)}
                  {selectedAnnouncement.end_date && ` ~ ${formatDateUtil(selectedAnnouncement.end_date)}`}
                </div>
              </DialogHeader>

              <div className="rounded-[8px] border border-border bg-[#FAFBFD] px-4 py-3 mt-4">
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                  {selectedAnnouncement.content}
                </p>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDetailDialogOpen(false)}>
                  닫기
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default SystemAnnouncementList;
