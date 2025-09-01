import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { announcementService, Announcement } from '../services/announcementService';

interface AnnouncementModalProps {
  className?: string;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ className = '' }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // 공지사항 로드 및 모달 표시 결정
  useEffect(() => {
    loadActiveSystemAnnouncements();
  }, []);

  // 공지사항이 로드되면 모달 표시 여부 결정
  useEffect(() => {
    if (announcements.length > 0) {
      // 로컬 스토리지에서 읽지 않은 공지사항 체크
      const hiddenAnnouncements = JSON.parse(localStorage.getItem('hiddenAnnouncements') || '[]');
      const unreadAnnouncements = announcements.filter(a => !hiddenAnnouncements.includes(a.id));
      
      if (unreadAnnouncements.length > 0) {
        // 읽지 않은 공지사항이 있으면 모달 표시
        setAnnouncements(unreadAnnouncements);
        setIsOpen(true);
        setCurrentIndex(0);
      }
    }
  }, [announcements.length]);

  const loadActiveSystemAnnouncements = async () => {
    try {
      // 시스템 공지사항만 가져오기
      const data = await announcementService.getActiveSystemAnnouncements();
      // 우선순위별 정렬: urgent > important > normal
      const sorted = data.sort((a, b) => {
        const priorityOrder = { urgent: 3, important: 2, normal: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      setAnnouncements(sorted);
    } catch (error: any) {
      // API가 아직 구현되지 않은 경우 조용히 처리
      if (error?.response?.status !== 404) {
        console.error('시스템 공지사항 로드 실패:', error);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDontShowAgain = () => {
    // 현재 공지사항을 로컬 스토리지에 숨김 처리
    const currentAnnouncement = announcements[currentIndex];
    if (currentAnnouncement) {
      const hiddenAnnouncements = JSON.parse(localStorage.getItem('hiddenAnnouncements') || '[]');
      hiddenAnnouncements.push(currentAnnouncement.id);
      localStorage.setItem('hiddenAnnouncements', JSON.stringify(hiddenAnnouncements));
      
      // 시스템 공지사항 읽음 처리
      announcementService.markSystemAnnouncementAsRead(currentAnnouncement.id);
    }
    
    // 다음 공지사항으로 이동 또는 모달 닫기
    moveToNextOrClose();
  };

  const handleMarkRead = () => {
    const currentAnnouncement = announcements[currentIndex];
    if (currentAnnouncement) {
      // 시스템 공지사항 읽음 처리
      announcementService.markSystemAnnouncementAsRead(currentAnnouncement.id);
    }
    
    // 다음 공지사항으로 이동 또는 모달 닫기
    moveToNextOrClose();
  };

  const moveToNextOrClose = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsOpen(false);
    }
  };

  const moveToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const moveToNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'important':
        return <Megaphone className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  if (announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getPriorityIcon(currentAnnouncement.priority)}
              <DialogTitle className="text-lg font-semibold">
                시스템 공지사항
              </DialogTitle>
            </div>
            {announcements.length > 1 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {currentIndex + 1} / {announcements.length}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* 제목 */}
          <div className="mb-3">
            <h3 className="font-medium text-base mb-2">
              {currentAnnouncement.title}
            </h3>
            <div className="flex items-center space-x-2">
              {currentAnnouncement.target_type === 'all' && (
                <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                  전체 공지
                </span>
              )}
              {currentAnnouncement.target_type === 'specific' && (
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  선택 교회
                </span>
              )}
              {currentAnnouncement.target_type === 'single' && (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                  개별 교회
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded ${
                currentAnnouncement.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                currentAnnouncement.priority === 'important' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {currentAnnouncement.priority === 'urgent' ? '긴급' :
                 currentAnnouncement.priority === 'important' ? '중요' : '일반'}
              </span>
            </div>
          </div>

          {/* 내용 */}
          <div className="mb-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {currentAnnouncement.content}
            </p>
          </div>

          {/* 날짜 정보 */}
          <div className="text-xs text-gray-500 border-t pt-3">
            게시일: {new Date(currentAnnouncement.created_at).toLocaleString()}
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex items-center justify-between pt-4 border-t">
          {/* 네비게이션 버튼 */}
          <div className="flex space-x-2">
            {announcements.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={moveToPrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={moveToNext}
                  disabled={currentIndex === announcements.length - 1}
                >
                  다음
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDontShowAgain}
            >
              다시 보지 않기
            </Button>
            <Button
              size="sm"
              onClick={handleMarkRead}
            >
              확인
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementModal;