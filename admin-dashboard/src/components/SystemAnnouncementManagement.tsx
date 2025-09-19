import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Megaphone, 
  Info,
  Calendar,
  Users,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { announcementService, Announcement, AnnouncementCreate, Church } from '../services/announcementService';

const SystemAnnouncementManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementCreate>({
    title: '',
    content: '',
    category: 'system',
    priority: 'normal',
    target_type: 'all',
    start_date: new Date().toISOString().split('T')[0],
    is_active: true
  });

  useEffect(() => {
    loadAnnouncements();
    loadChurches();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      // 시스템 관리자용: 시스템 공지사항 조회
      const data = await announcementService.getSystemAnnouncementsAdmin();
      setAnnouncements(data);
    } catch (error: any) {
      // API가 아직 구현되지 않은 경우 조용히 처리
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
      // API가 아직 구현되지 않은 경우 조용히 처리
      if (error?.response?.status !== 404) {
        console.error('교회 목록 로드 실패:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await announcementService.updateSystemAnnouncement(editingAnnouncement.id, formData);
      } else {
        await announcementService.createSystemAnnouncement(formData);
      }
      await loadAnnouncements();
      handleCloseDialog();
    } catch (error) {
      console.error('시스템 공지사항 저장 실패:', error);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      priority: announcement.priority,
      target_type: announcement.target_type,
      target_church_ids: announcement.target_church_ids,
      church_id: announcement.church_id,
      start_date: announcement.start_date.split('T')[0],
      end_date: announcement.end_date?.split('T')[0],
      is_active: announcement.is_active
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('이 시스템 공지사항을 삭제하시겠습니까?')) {
      try {
        await announcementService.deleteSystemAnnouncement(id);
        await loadAnnouncements();
      } catch (error) {
        console.error('시스템 공지사항 삭제 실패:', error);
      }
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      await announcementService.updateSystemAnnouncement(announcement.id, {
        is_active: !announcement.is_active
      });
      await loadAnnouncements();
    } catch (error) {
      console.error('시스템 공지사항 상태 변경 실패:', error);
    }
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      category: 'system',
      priority: 'normal',
      target_type: 'all',
      start_date: new Date().toISOString().split('T')[0],
      is_active: true
    });
  };

  const handleTargetTypeChange = (targetType: 'all' | 'specific' | 'single') => {
    setFormData(prev => ({
      ...prev,
      target_type: targetType,
      target_church_ids: targetType === 'specific' ? [] : undefined,
      church_id: targetType === 'single' ? undefined : undefined
    }));
  };

  const handleChurchSelection = (churchId: number, selected: boolean) => {
    if (formData.target_type === 'specific') {
      const currentIds = formData.target_church_ids || [];
      if (selected) {
        setFormData(prev => ({
          ...prev,
          target_church_ids: [...currentIds, churchId]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          target_church_ids: currentIds.filter(id => id !== churchId)
        }));
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
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      important: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800'
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

  const getTargetBadge = (announcement: Announcement) => {
    switch (announcement.target_type) {
      case 'all':
        return (
          <Badge className="bg-gray-600 text-white">
            <Globe className="w-3 h-3 mr-1" />
            전체 공지
          </Badge>
        );
      case 'specific':
        const count = announcement.target_church_ids?.length || 0;
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Users className="w-3 h-3 mr-1" />
            선택 교회 {count}개
          </Badge>
        );
      case 'single':
        return (
          <Badge className="bg-green-100 text-green-800">
            <Users className="w-3 h-3 mr-1" />
            교회 #{announcement.church_id}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">시스템 공지사항 관리</h1>
          <p className="text-muted-foreground">모든 교회에 보여질 시스템 공지와 특정 교회 공지를 관리합니다.</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              새 공지 작성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? '공지사항 수정' : '새 공지사항 작성'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">공지 대상</label>
                  <Select
                    value={formData.target_type}
                    onValueChange={handleTargetTypeChange}
                  >
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
                
                <div>
                  <label className="block text-sm font-medium mb-2">우선순위</label>
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
              
              {/* 교회 선택 UI */}
              {formData.target_type === 'specific' && (
                <div>
                  <label className="block text-sm font-medium mb-2">대상 교회 선택</label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                    {churches.length > 0 ? (
                      churches.map((church) => (
                        <label key={church.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={formData.target_church_ids?.includes(church.id) || false}
                            onChange={(e) => handleChurchSelection(church.id, e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">{church.name}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">교회 목록을 불러오는 중...</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    선택된 교회: {formData.target_church_ids?.length || 0}개
                  </p>
                </div>
              )}

              {formData.target_type === 'single' && (
                <div>
                  <label className="block text-sm font-medium mb-2">대상 교회</label>
                  <Select
                    value={formData.church_id?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, church_id: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="교회를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id.toString()}>
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">제목</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="공지사항 제목을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">내용</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={5}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">시작일</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">종료일 (선택)</label>
                  <Input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value || undefined }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  취소
                </Button>
                <Button type="submit">
                  {editingAnnouncement ? '수정' : '작성'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 공지사항 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>공지사항 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">로딩 중...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">등록된 공지사항이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`border rounded-lg p-4 ${
                    announcement.is_active ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getPriorityIcon(announcement.priority)}
                        <h3 className={`font-medium ${
                          announcement.is_active ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {announcement.title}
                        </h3>
                        {getTargetBadge(announcement)}
                        {getPriorityBadge(announcement.priority)}
                        {!announcement.is_active && (
                          <Badge variant="secondary">비활성</Badge>
                        )}
                      </div>
                      
                      <p className={`text-sm mb-3 ${
                        announcement.is_active ? 'text-muted-foreground' : 'text-gray-400'
                      }`}>
                        {announcement.content}
                      </p>
                      
                      <div className="flex items-center text-xs text-muted-foreground space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(announcement.start_date).toLocaleDateString()}
                          {announcement.end_date && 
                            ` ~ ${new Date(announcement.end_date).toLocaleDateString()}`
                          }
                        </div>
                        <div>
                          작성: {new Date(announcement.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(announcement)}
                      >
                        {announcement.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAnnouncementManagement;