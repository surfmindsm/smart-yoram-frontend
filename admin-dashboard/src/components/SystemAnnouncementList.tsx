import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Megaphone,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { Badge } from "./ui";
import { Dialog, DialogContent } from "./ui";
import { Spinner } from "./ui/spinner";
import { announcementService, Announcement } from '../services/announcementService';

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
      // 활성화된 시스템 공지사항만 조회 (교회 관리자용)
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

    // 읽음 처리
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'important':
        return <Megaphone className="w-4 h-4 text-orange-500" />;
      default:
        return <Info className="w-4 h-4 text-primary-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      important: 'bg-orange-100 text-orange-800',
      normal: 'bg-primary-100 text-primary-800'
    };
    const labels = {
      urgent: '긴급',
      important: '중요',
      normal: '일반'
    };

    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const isRead = (announcementId: number) => {
    return readAnnouncements.has(announcementId);
  };

  const unreadCount = announcements.filter(a => !isRead(a.id)).length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">시스템 공지사항</h1>
          <p className="text-muted-foreground">
            Church Round 시스템 공지사항을 확인하세요
            {unreadCount > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                (읽지 않은 공지 {unreadCount}개)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 공지사항 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>공지사항 목록</span>
            <Badge variant="secondary">
              총 {announcements.length}개
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Spinner size="lg" />
              <p className="text-muted-foreground mt-4">로딩 중...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">현재 활성화된 공지사항이 없습니다.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-20">구분</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">제목</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">등록일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {announcements.map((announcement, index) => {
                    const read = isRead(announcement.id);

                    return (
                      <tr
                        key={announcement.id}
                        onClick={() => handleViewDetail(announcement)}
                        className={`cursor-pointer transition-colors ${
                          read
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-blue-50 hover:bg-blue-100'
                        }`}
                      >
                        {/* 구분 (우선순위) */}
                        <td className="px-4 py-3">
                          {getPriorityBadge(announcement.priority)}
                        </td>

                        {/* 제목 */}
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {getPriorityIcon(announcement.priority)}
                            <span className={`font-medium ${
                              read ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                              {announcement.title}
                            </span>
                            {!read && (
                              <Badge className="bg-red-500 text-white text-xs ml-2">N</Badge>
                            )}
                          </div>
                        </td>

                        {/* 등록일 */}
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(announcement.start_date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세보기 다이얼로그 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          {selectedAnnouncement && (
            <div className="space-y-6">
              {/* 헤더 */}
              <div className="border-b pb-4">
                <div className="flex items-center space-x-2 mb-3">
                  {getPriorityBadge(selectedAnnouncement.priority)}
                  {!isRead(selectedAnnouncement.id) && (
                    <Badge className="bg-red-500 text-white">NEW</Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-foreground flex items-center space-x-2">
                  {getPriorityIcon(selectedAnnouncement.priority)}
                  <span>{selectedAnnouncement.title}</span>
                </h2>
                <div className="text-sm text-muted-foreground mt-2">
                  등록일: {formatDate(selectedAnnouncement.start_date)}
                  {selectedAnnouncement.end_date &&
                    ` ~ ${formatDate(selectedAnnouncement.end_date)}`
                  }
                </div>
              </div>

              {/* 내용 */}
              <div className="py-4">
                <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {selectedAnnouncement.content}
                </p>
              </div>

              {/* 하단 버튼 */}
              <div className="border-t pt-4 flex justify-center">
                <button
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemAnnouncementList;
