import React, { useState, useEffect } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { Button } from "./ui";
import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { Input } from "./ui";
import { Textarea } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { Calendar, FileText, Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { useToast } from "./ui";

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
  const [isLoading, setIsLoading] = useState(true);
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
          return churchId;
        }
      }

      // Fallback to old 'user' key
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const churchId = user?.church_id;
        if (churchId) {
          return churchId;
        }
      }

      // Final fallback
      return 9998;
    } catch (error) {
      console.error('📰 Error getting church_id from localStorage:', error);
      return 9998;
    }
  };

  const churchId = getChurchId();

  useEffect(() => {
    loadBulletins();
  }, []);

  const loadBulletins = async () => {
    try {
      setIsLoading(true);
      const response = await supabaseApiService.bulletins.getAll({
        church_id: churchId,
        page: 1,
        limit: 100
      });

      const bulletinsData = response?.data || [];
      setBulletins(bulletinsData);

    } catch (error) {
      console.error('📰 주보 목록 조회 실패:', error);
      toast({
        title: '오류',
        description: '주보 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
      let fileUrl = formData.file_url;

      // 파일이 새로 선택된 경우 업로드
      if (selectedFile) {
        setUploadingFile(true);

        try {
          // Supabase Storage에 파일 업로드
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `${formData.date}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `bulletins/${churchId}/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabaseApiService.supabase.storage
            .from('bulletins')
            .upload(filePath, selectedFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('파일 업로드 실패:', uploadError);
            throw new Error('파일 업로드에 실패했습니다.');
          }

          // 업로드된 파일의 공개 URL 가져오기
          const { data: publicUrlData } = supabaseApiService.supabase.storage
            .from('bulletins')
            .getPublicUrl(filePath);

          fileUrl = publicUrlData.publicUrl;
        } catch (uploadError) {
          console.error('파일 업로드 오류:', uploadError);
          toast({
            title: '오류',
            description: '파일 업로드에 실패했습니다.',
            variant: 'destructive',
          });
          setUploadingFile(false);
          return;
        } finally {
          setUploadingFile(false);
        }
      }

      if (editingBulletin) {
        // 수정
        await supabaseApiService.bulletins.update(editingBulletin.id.toString(), {
          title: formData.title,
          date: formData.date,
          content: formData.content || undefined,
          file_url: fileUrl || undefined
        });
      } else {
        // 생성
        await supabaseApiService.bulletins.create({
          church_id: churchId,
          title: formData.title,
          date: formData.date,
          content: formData.content || undefined,
          file_url: fileUrl || undefined
        });
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
      await supabaseApiService.bulletins.delete(id.toString());

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
    <PageContainer>
      <PageHeader
        title="주보 관리"
        description="교회 주보를 관리하고 파일을 업로드합니다."
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            주보 추가
          </Button>
        }
      />

      {/* Bulletins Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">주보 목록을 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      ) : bulletins.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">등록된 주보가 없습니다.</p>
            <p className="text-sm text-gray-500 mt-1">첫 번째 주보를 추가해보세요.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bulletins.map((bulletin) => (
            <Card key={bulletin.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bulletin.title}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(bulletin.date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>

                  {bulletin.content && (
                    <p className="text-sm text-gray-600 line-clamp-3">{bulletin.content}</p>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t">
                    {bulletin.file_url ? (
                      <a
                        href={bulletin.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        파일 보기
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">첨부파일 없음</span>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(bulletin)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(bulletin.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
              <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
              <Input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
              <Textarea
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">파일 업로드</label>
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
                <Upload className="w-4 h-4 text-gray-400" />
              </div>
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  선택된 파일: {selectedFile.name}
                </p>
              )}
              {editingBulletin?.file_url && !selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  현재 파일: <a href={editingBulletin.file_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">보기</a>
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
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
    </PageContainer>
  );
};

export default Bulletins;