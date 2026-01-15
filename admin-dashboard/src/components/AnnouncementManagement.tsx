import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Pin, Filter } from 'lucide-react';
import { supabaseApiService } from '../services/supabaseApiService';
import { Button } from "./ui";
import { useToast } from "./ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { Badge } from "./ui";
import { Input } from "./ui";
import { Label } from "./ui";
import { Textarea } from "./ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui";

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
  view_count: number;
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<LocalAnnouncement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    priority: 'normal' as 'urgent' | 'important' | 'normal',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, categoryFilter]);

  const { toast } = useToast();

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
    } catch (error) {
      console.error('Church ID 가져오기 실패:', error);
      return 6;
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const churchId = getChurchId();
      const response = await supabaseApiService.announcements.getAll({
        church_id: churchId,
        limit: 100
      });
      setAnnouncements(response.data || []);
    } catch (err) {
      setError('공지사항을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];

    // 카테고리 필터 적용
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter);
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
      start_date: announcement.start_date ? announcement.start_date.split('T')[0] : '',
      end_date: announcement.end_date ? announcement.end_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await supabaseApiService.announcements.delete(id.toString());
      toast({
        title: '성공',
        description: '공지사항이 삭제되었습니다.',
      });
      fetchAnnouncements();
    } catch (err) {
      toast({
        title: '오류',
        description: '공지사항 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await supabaseApiService.announcements.update(id.toString(), { is_active: !currentActive });
      toast({
        title: '성공',
        description: '상태가 변경되었습니다.',
      });
      fetchAnnouncements();
    } catch (err) {
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const churchId = getChurchId();

      // 현재 로그인한 사용자 정보 가져오기
      const getUserInfo = () => {
        try {
          const sessionStr = localStorage.getItem('supabase_session');
          if (sessionStr) {
            const session = JSON.parse(sessionStr);
            return {
              id: session?.user?.id,
              name: session?.user?.name || session?.user?.user_metadata?.name
            };
          }

          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            return {
              id: user?.id,
              name: user?.name || user?.username
            };
          }

          return { id: 1, name: '관리자' };
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
          return { id: 1, name: '관리자' };
        }
      };

      const userInfo = getUserInfo();

      const submitData = {
        ...formData,
        church_id: churchId,
        author_id: userInfo.id,
        author_name: userInfo.name,
        target_audience: 'all',
        is_pinned: false,
        is_active: true,
      };

      if (selectedAnnouncement) {
        await supabaseApiService.announcements.update(selectedAnnouncement.id.toString(), submitData);
        toast({
          title: '성공',
          description: '공지사항이 수정되었습니다.',
        });
      } else {
        await supabaseApiService.announcements.create(submitData);
        toast({
          title: '성공',
          description: '공지사항이 생성되었습니다.',
        });
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      toast({
        title: '오류',
        description: '공지사항 저장에 실패했습니다.',
        variant: 'destructive',
      });
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

  return (
    <PageContainer>
      <PageHeader
        title="공지사항 관리"
        description="교회 공지사항을 작성하고 관리합니다."
        actions={
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            새 공지사항
          </Button>
        }
      />

      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">공지사항을 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Category Filter */}
          <div className="mb-6">
            <Label htmlFor="category-filter" className="mb-2 block">카테고리 필터</Label>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger id="category-filter" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="worship">예배/모임</SelectItem>
                <SelectItem value="member_news">교우 소식</SelectItem>
                <SelectItem value="event">행사/공지</SelectItem>
                <SelectItem value="general">일반</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Announcements List */}
          {filteredAnnouncements.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-600">공지사항이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="min-w-[200px]">제목</TableHead>
                      <TableHead className="w-[120px]">카테고리</TableHead>
                      <TableHead className="w-[100px]">작성자</TableHead>
                      <TableHead className="w-[120px]">작성일</TableHead>
                      <TableHead className="w-[80px]">조회수</TableHead>
                      <TableHead className="w-[120px] text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnnouncements.map((announcement) => (
                      <TableRow
                        key={announcement.id}
                        className={`${announcement.is_pinned ? 'bg-yellow-50/50' : ''} ${!announcement.is_active ? 'opacity-60' : ''}`}
                      >
                        <TableCell>
                          {announcement.is_pinned && (
                            <Pin className="w-4 h-4 text-yellow-600 fill-current" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {announcement.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-primary-100 text-primary-800">
                            {getCategoryLabel(announcement.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {announcement.author_name || '관리자'}
                        </TableCell>
                        <TableCell>
                          {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-center">
                          {announcement.view_count?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
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
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
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
                  </SelectContent>
                </Select>
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
    </PageContainer>
  );
};

export default AnnouncementManagement;