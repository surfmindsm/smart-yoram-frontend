import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertTriangle, Plus, Edit2, Trash2, BookOpen, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { api } from '../services/api';

interface DailyVerse {
  id: number;
  verse: string;
  reference: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DailyVerseStats {
  total_verses: number;
  active_verses: number;
  inactive_verses: number;
}

const DailyVerses: React.FC = () => {
  const [verses, setVerses] = useState<DailyVerse[]>([]);
  const [stats, setStats] = useState<DailyVerseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVerse, setEditingVerse] = useState<DailyVerse | null>(null);
  const [currentRandomVerse, setCurrentRandomVerse] = useState<DailyVerse | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    verse: '',
    reference: '',
    is_active: true
  });

  useEffect(() => {
    fetchVerses();
    fetchStats();
    fetchRandomVerse();
  }, []);

  const fetchVerses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/daily-verses/');
      setVerses(response.data);
    } catch (error: any) {
      setError('말씀 목록을 불러오는데 실패했습니다.');
      console.error('말씀 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/daily-verses/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('통계 조회 실패:', error);
    }
  };

  const fetchRandomVerse = async () => {
    try {
      const response = await api.get('/daily-verses/random');
      setCurrentRandomVerse(response.data);
    } catch (error: any) {
      console.error('랜덤 말씀 조회 실패:', error);
    }
  };

  const handleAddVerse = async () => {
    if (!formData.verse.trim() || !formData.reference.trim()) {
      setError('말씀과 출처를 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/daily-verses/', formData);
      setFormData({ verse: '', reference: '', is_active: true });
      setShowAddModal(false);
      setError('');
      await fetchVerses();
      await fetchStats();
    } catch (error: any) {
      setError('말씀 추가에 실패했습니다.');
      console.error('말씀 추가 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditVerse = async () => {
    if (!editingVerse || !formData.verse.trim() || !formData.reference.trim()) {
      setError('말씀과 출처를 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/daily-verses/${editingVerse.id}`, formData);
      setShowEditModal(false);
      setEditingVerse(null);
      setError('');
      await fetchVerses();
      await fetchStats();
    } catch (error: any) {
      setError('말씀 수정에 실패했습니다.');
      console.error('말씀 수정 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVerse = async (id: number) => {
    if (!window.confirm('정말로 이 말씀을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/daily-verses/${id}`);
      await fetchVerses();
      await fetchStats();
    } catch (error: any) {
      setError('말씀 삭제에 실패했습니다.');
      console.error('말씀 삭제 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (verse: DailyVerse) => {
    setEditingVerse(verse);
    setFormData({
      verse: verse.verse,
      reference: verse.reference,
      is_active: verse.is_active
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingVerse(null);
    setFormData({ verse: '', reference: '', is_active: true });
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">오늘의 말씀 관리</h2>
        <div className="flex gap-2">
          <Button onClick={fetchRandomVerse} variant="outline">
            <BookOpen className="w-4 h-4 mr-2" />
            새 말씀 보기
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            말씀 추가
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 말씀</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_verses}</div>
            </CardContent>
          </Card>
          <Card className="border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 말씀</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active_verses}</div>
            </CardContent>
          </Card>
          <Card className="border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">비활성 말씀</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inactive_verses}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 현재 랜덤 말씀 */}
      {currentRandomVerse && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              현재 오늘의 말씀
            </CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote className="text-lg italic text-foreground mb-2">
              {currentRandomVerse.verse}
            </blockquote>
            <p className="text-right text-muted-foreground font-medium">
              - {currentRandomVerse.reference}
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 말씀 목록 */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle>말씀 목록</CardTitle>
          <CardDescription>등록된 모든 말씀을 관리할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : verses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">등록된 말씀이 없습니다.</p>
              </div>
            ) : (
              verses.map((verse) => (
                <div key={verse.id} className="border border-muted rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <blockquote className="text-base italic text-foreground mb-2">
                        {verse.verse}
                      </blockquote>
                      <p className="text-sm text-muted-foreground mb-2">
                        - {verse.reference}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant={verse.is_active ? "success" : "secondary"}>
                          {verse.is_active ? "활성" : "비활성"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(verse.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(verse)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVerse(verse.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 말씀 추가 모달 */}
      <Dialog open={showAddModal} onOpenChange={closeModals}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 말씀 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verse">말씀 내용</Label>
              <Textarea
                id="verse"
                value={formData.verse}
                onChange={(e) => setFormData({ ...formData, verse: e.target.value })}
                placeholder="말씀 내용을 입력하세요"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="reference">출처</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="예: 시편 23:1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">활성 상태</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={closeModals}>
                취소
              </Button>
              <Button onClick={handleAddVerse} disabled={loading}>
                {loading ? "추가 중..." : "추가"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 말씀 편집 모달 */}
      <Dialog open={showEditModal} onOpenChange={closeModals}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>말씀 편집</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-verse">말씀 내용</Label>
              <Textarea
                id="edit-verse"
                value={formData.verse}
                onChange={(e) => setFormData({ ...formData, verse: e.target.value })}
                placeholder="말씀 내용을 입력하세요"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-reference">출처</Label>
              <Input
                id="edit-reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="예: 시편 23:1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit_is_active">활성 상태</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={closeModals}>
                취소
              </Button>
              <Button onClick={handleEditVerse} disabled={loading}>
                {loading ? "수정 중..." : "수정"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyVerses;