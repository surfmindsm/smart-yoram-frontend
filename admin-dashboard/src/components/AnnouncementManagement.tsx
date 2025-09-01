import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Pin, Filter } from 'lucide-react';
import { announcementService } from '../services/announcementService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

// 로컬 Announcement 인터페이스 (백엔드 API 응답에 맞게 수정)
interface LocalAnnouncement {
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
  // UI용 추가 필드 (기본값 제공)
  author_name?: string;
  is_pinned?: boolean;
  target_audience?: string;
}

const AnnouncementManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<LocalAnnouncement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<LocalAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'pinned'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<LocalAnnouncement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    priority: 'normal' as 'urgent' | 'important' | 'normal',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    target_audience: 'all',
    is_pinned: false,
    is_active: true,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, filter]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAnnouncementsAdmin();
      setAnnouncements(data);
    } catch (err) {
      setError('공지사항을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];
    
    switch (filter) {
      case 'active':
        filtered = announcements.filter(a => a.is_active);
        break;
      case 'pinned':
        filtered = announcements.filter(a => a.is_pinned);
        break;
    }
    
    setFilteredAnnouncements(filtered);
  };

  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      category: '',
      priority: 'normal' as 'urgent' | 'important' | 'normal',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      target_audience: 'all',
      is_pinned: false,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (announcement: LocalAnnouncement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category || '',
      priority: announcement.priority,
      start_date: announcement.start_date.split('T')[0],
      end_date: announcement.end_date?.split('T')[0] || '',
      target_audience: announcement.target_audience || 'all',
      is_pinned: announcement.is_pinned || false,
      is_active: announcement.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await announcementService.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert('공지사항 삭제에 실패했습니다.');
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await announcementService.updateAnnouncement(id, { is_active: !currentActive });
      fetchAnnouncements();
    } catch (err) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedAnnouncement) {
        await announcementService.updateAnnouncement(selectedAnnouncement.id, formData);
      } else {
        await announcementService.createAnnouncement(formData);
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      alert('공지사항 저장에 실패했습니다.');
    }
  };

  const getCategoryLabel = (category?: string) => {
    const map: { [key: string]: string } = {
      'worship': '예배/모임',
      'member_news': '교우 소식',
      'event': '행사/공지',
      'general': '일반',
    };
    return map[category || ''] || '일반';
  };

  const getTargetAudienceText = (audience: string) => {
    const map: { [key: string]: string } = {
      'all': '전체',
      'member': '일반 교인',
      'youth': '청소년부',
      'leader': '리더',
    };
    return map[audience] || audience;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-900">공지사항 관리</h2>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          새 공지사항
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          전체
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
          size="sm"
        >
          활성
        </Button>
        <Button
          variant={filter === 'pinned' ? 'default' : 'outline'}
          onClick={() => setFilter('pinned')}
          size="sm"
        >
          고정
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <Card 
            key={announcement.id} 
            className={`${announcement.is_pinned ? 'border-yellow-400 bg-yellow-50/50' : ''} ${!announcement.is_active ? 'opacity-60' : ''}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {announcement.is_pinned && (
                      <Pin className="w-4 h-4 text-yellow-600 fill-current" />
                    )}
                    {announcement.title}
                    {!announcement.is_active && (
                      <Badge variant="secondary">비활성</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    <Badge className="bg-blue-100 text-blue-800">
                      {getCategoryLabel(announcement.category)}
                    </Badge> | 
                    작성자: {announcement.author_name || '관리자'} | 
                    작성일: {new Date(announcement.created_at).toLocaleDateString('ko-KR')} | 
                    대상: {getTargetAudienceText(announcement.target_audience || 'all')}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(announcement)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                  >
                    <Pin className={`w-4 h-4 ${announcement.is_active ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(announcement.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 whitespace-pre-wrap">{announcement.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-slate-500">공지사항이 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[625px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {selectedAnnouncement ? '공지사항 수정' : '새 공지사항'}
              </DialogTitle>
              <DialogDescription>
                공지사항 내용을 입력하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">내용</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worship">예배/모임</SelectItem>
                    <SelectItem value="member_news">교우 소식</SelectItem>
                    <SelectItem value="event">행사/공지</SelectItem>
                    <SelectItem value="general">일반</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="target">대상</Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                  >
                    <SelectTrigger id="target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="member">일반 교인</SelectItem>
                      <SelectItem value="youth">청소년부</SelectItem>
                      <SelectItem value="leader">리더</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 pt-8">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pinned"
                      checked={formData.is_pinned}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, is_pinned: checked as boolean })
                      }
                    />
                    <Label htmlFor="pinned" className="text-sm font-normal cursor-pointer">
                      상단 고정
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, is_active: checked as boolean })
                      }
                    />
                    <Label htmlFor="active" className="text-sm font-normal cursor-pointer">
                      활성화
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                취소
              </Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementManagement;