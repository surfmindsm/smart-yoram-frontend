import React, { useState, useEffect } from 'react';
import { Button } from "./ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui";
import { Input } from "./ui";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { Badge } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { AlertTriangle, Plus, Edit2, Trash2, BookOpen, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from "./ui";
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
    <PageContainer>
      <PageHeader
        title="오늘의 말씀 관리"
        description="교회 앱에서 표시될 오늘의 말씀을 관리합니다."
        actions={
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
        }
      />

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">전체 말씀</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_verses}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">활성 말씀</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_verses}</p>
                </div>
                <Eye className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">비활성 말씀</p>
                  <p className="text-2xl font-bold text-red-600">{stats.inactive_verses}</p>
                </div>
                <EyeOff className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 현재 랜덤 말씀 */}
      {currentRandomVerse && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">현재 오늘의 말씀</h3>
            </div>
            <blockquote className="text-lg italic text-gray-900 mb-2 pl-4 border-l-4 border-primary-600">
              {currentRandomVerse.verse}
            </blockquote>
            <p className="text-right text-gray-600 font-medium">
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
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">로딩 중...</p>
              </div>
            ) : verses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">등록된 말씀이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y">
                {verses.map((verse) => (
                  <div key={verse.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <blockquote className="text-base italic text-gray-900 mb-2">
                          {verse.verse}
                        </blockquote>
                        <p className="text-sm text-gray-600 mb-2">
                          - {verse.reference}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant={verse.is_active ? "success" : "secondary"}>
                            {verse.is_active ? "활성" : "비활성"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(verse.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
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
    </PageContainer>
  );
};

export default DailyVerses;