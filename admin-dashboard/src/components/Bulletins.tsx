import React, { useState, useEffect } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, FileText, Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface Bulletin {
  id: number;
  title: string;
  date: string;
  content?: string;
  file_url?: string;
  created_at: string;
}

const Bulletins: React.FC = () => {
  const { toast } = useToast();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState<Bulletin | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    file_url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Get church_id from localStorage - user's actual church
  const getChurchId = () => {
    try {
      // First try to get from supabase_session (new authentication)
      const sessionStr = localStorage.getItem('supabase_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const churchId = session?.user?.church_id;
        if (churchId) {
          console.log('📰 Church ID from supabase_session:', churchId);
          return churchId;
        }
      }

      // Fallback to old 'user' key
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const churchId = user?.church_id;
        if (churchId) {
          console.log('📰 Church ID from user:', churchId);
          return churchId;
        }
      }

      // Final fallback
      console.log('📰 No church_id found in localStorage, using fallback: 6');
      return 6;
    } catch (error) {
      console.error('📰 Error getting church_id from localStorage:', error);
      return 6;
    }
  };

  const churchId = getChurchId();

  useEffect(() => {
    loadBulletins();
  }, []);

  const loadBulletins = async () => {
    try {
      console.log('📰 주보 목록 조회 시작, church_id:', churchId);

      const response = await supabaseApiService.bulletins.getAll({
        church_id: churchId,
        page: 1,
        limit: 100
      });

      const bulletinsData = response?.data || [];
      console.log('📰 주보 조회 성공:', bulletinsData.length, '개');
      setBulletins(bulletinsData);

    } catch (error) {
      console.error('📰 주보 목록 조회 실패:', error);
      toast({
        title: '오류',
        description: '주보 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      toast({
        title: '오류',
        description: '제목을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.date) {
      toast({
        title: '오류',
        description: '날짜를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('📰 주보 저장 시작:', editingBulletin ? '수정' : '생성', formData);

      if (editingBulletin) {
        // 수정
        await supabaseApiService.bulletins.update(editingBulletin.id.toString(), {
          title: formData.title,
          date: formData.date,
          content: formData.content || undefined,
          file_url: formData.file_url || undefined
        });
        console.log('✅ 주보 수정 성공');
      } else {
        // 생성
        await supabaseApiService.bulletins.create({
          church_id: churchId,
          title: formData.title,
          date: formData.date,
          content: formData.content || undefined,
          file_url: formData.file_url || undefined
        });
        console.log('✅ 주보 생성 성공');
      }

      toast({
        title: '성공',
        description: editingBulletin ? '주보가 수정되었습니다.' : '주보가 추가되었습니다.',
      });

      loadBulletins();
      handleCloseModal();
    } catch (error: any) {
      console.error('📰 주보 저장 실패:', error);
      toast({
        title: '오류',
        description: '주보 저장에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (bulletin: Bulletin) => {
    setEditingBulletin(bulletin);
    setFormData({
      title: bulletin.title,
      date: bulletin.date,
      content: bulletin.content || '',
      file_url: bulletin.file_url || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      console.log('📰 주보 삭제 시작:', id);

      await supabaseApiService.bulletins.delete(id.toString());

      console.log('✅ 주보 삭제 성공');
      toast({
        title: '성공',
        description: '주보가 삭제되었습니다.',
      });

      loadBulletins();
    } catch (error) {
      console.error('📰 주보 삭제 실패:', error);
      toast({
        title: '오류',
        description: '주보 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingBulletin(null);
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      content: '',
      file_url: ''
    });
    setSelectedFile(null);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">주보 관리</h2>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          주보 추가
        </Button>
      </div>

      {/* Bulletins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bulletins.map((bulletin) => (
          <Card key={bulletin.id} className="border-muted overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">{bulletin.title}</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(bulletin.date).toLocaleDateString('ko-KR')}
              </p>
            </CardHeader>
            <CardContent>
              {bulletin.content && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{bulletin.content}</p>
              )}
              <div className="flex justify-between items-center">
                {bulletin.file_url ? (
                  <a
                    href={bulletin.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    파일 보기
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">첨부파일 없음</span>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(bulletin)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(bulletin.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBulletin ? '주보 수정' : '주보 추가'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">제목</label>
              <Input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">날짜</label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">내용</label>
              <Textarea
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">파일 업로드</label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                  className="flex-1"
                />
                <Upload className="w-4 h-4 text-muted-foreground" />
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  선택된 파일: {selectedFile.name}
                </p>
              )}
              {editingBulletin?.file_url && !selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  현재 파일: <a href={editingBulletin.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">보기</a>
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={uploadingFile}
              >
                {uploadingFile ? '업로드 중...' : '저장'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bulletins;