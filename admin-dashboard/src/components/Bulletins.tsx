import React, { useState, useEffect } from 'react';
import { bulletinService, api } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, FileText, Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

interface Bulletin {
  id: number;
  title: string;
  date: string;
  content?: string;
  file_url?: string;
  created_at: string;
}

const Bulletins: React.FC = () => {
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
  const [churchId] = useState(1); // TODO: Get from user context

  useEffect(() => {
    loadBulletins();
  }, []);

  const loadBulletins = async () => {
    try {
      const data = await bulletinService.getBulletins();
      setBulletins(data);
    } catch (error) {
      console.error('Failed to load bulletins:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!formData.date) {
      alert('날짜를 선택해주세요.');
      return;
    }
    
    try {
      let bulletinId: number;
      
      if (editingBulletin) {
        await bulletinService.updateBulletin(editingBulletin.id, formData);
        bulletinId = editingBulletin.id;
      } else {
        const newBulletin = await bulletinService.createBulletin({ ...formData, church_id: churchId });
        bulletinId = newBulletin.id;
      }
      
      // Upload file if selected
      if (selectedFile && bulletinId) {
        setUploadingFile(true);
        const fileFormData = new FormData();
        fileFormData.append('file', selectedFile);
        
        try {
          await api.post(`/bulletins/${bulletinId}/upload-file`, fileFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (uploadError: any) {
          console.error('Failed to upload file:', uploadError);
          const errorMessage = uploadError.response?.data?.detail || '파일 업로드에 실패했습니다.';
          alert(`파일 업로드 실패: ${errorMessage}`);
        } finally {
          setUploadingFile(false);
        }
      }
      
      loadBulletins();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save bulletin:', error);
      const errorMessage = error.response?.data?.detail || '주보 저장에 실패했습니다.';
      alert(`주보 저장 실패: ${errorMessage}`);
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
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await bulletinService.deleteBulletin(id);
        loadBulletins();
      } catch (error) {
        console.error('Failed to delete bulletin:', error);
      }
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