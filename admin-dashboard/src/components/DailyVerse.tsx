import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { Button } from "./ui";
import { Input } from "./ui";
import { Textarea } from "./ui";
import { Badge } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { Spinner } from "./ui/spinner";
import { supabaseApiService } from '../services/supabaseApiService';
import { BookOpen, Plus, Edit, Trash2 } from 'lucide-react';

interface DailyVerse {
  id: number;
  verse: string;
  reference: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DailyVerse: React.FC = () => {
  const [todayVerse, setTodayVerse] = useState<DailyVerse | null>(null);
  const [verses, setVerses] = useState<DailyVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    verse: '',
    reference: '',
    is_active: true
  });

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 오늘의 말씀과 전체 말씀 목록을 병렬로 조회
      const [todayResponse, allVersesResponse] = await Promise.allSettled([
        supabaseApiService.dailyVerses.getToday(),
        supabaseApiService.dailyVerses.getAll({ page: 1, limit: 20 })
      ]);

      if (todayResponse.status === 'fulfilled') {
        setTodayVerse(todayResponse.value);
        console.log('✅ 오늘의 말씀 로드 성공:', todayResponse.value);
      } else {
        console.error('❌ 오늘의 말씀 로드 실패:', todayResponse.reason);
      }

      if (allVersesResponse.status === 'fulfilled') {
        const versesData = allVersesResponse.value?.data || allVersesResponse.value || [];
        setVerses(versesData);
        console.log('✅ 말씀 목록 로드 성공:', versesData.length, '개');
      } else {
        console.error('❌ 말씀 목록 로드 실패:', allVersesResponse.reason);
      }

    } catch (error) {
      console.error('❌ 데이터 로드 전체 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // 수정
        await supabaseApiService.dailyVerses.update(editingId.toString(), formData);
        console.log('✅ 말씀 수정 성공');
      } else {
        // 생성
        await supabaseApiService.dailyVerses.create(formData);
        console.log('✅ 말씀 생성 성공');
      }

      // 폼 초기화 및 데이터 새로고침
      setFormData({ verse: '', reference: '', is_active: true });
      setShowForm(false);
      setEditingId(null);
      await loadData();

    } catch (error) {
      console.error('❌ 말씀 저장 실패:', error);
      setError('말씀 저장에 실패했습니다.');
    }
  };

  // 편집 시작
  const startEdit = (verse: DailyVerse) => {
    setFormData({
      verse: verse.verse,
      reference: verse.reference,
      is_active: verse.is_active
    });
    setEditingId(verse.id);
    setShowForm(true);
  };

  // 폼 취소
  const cancelForm = () => {
    setFormData({ verse: '', reference: '', is_active: true });
    setShowForm(false);
    setEditingId(null);
  };

  // 말씀 삭제
  const handleDelete = async (id: number) => {
    if (window.confirm('이 말씀을 삭제하시겠습니까?')) {
      try {
        await supabaseApiService.dailyVerses.delete(id.toString());
        console.log('✅ 말씀 삭제 성공');
        await loadData();
      } catch (error) {
        console.error('❌ 말씀 삭제 실패:', error);
        setError('말씀 삭제에 실패했습니다.');
      }
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Spinner size="default" className="mx-auto mb-4" />
            <p className="text-gray-500">오늘의 말씀을 불러오는 중...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="오늘의 말씀"
        description="매일의 은혜로운 말씀을 나누어요"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 말씀 추가
          </Button>
        }
      />

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 오늘의 말씀 카드 */}
      {todayVerse && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">오늘의 말씀</h3>
            </div>
            <blockquote className="text-lg text-gray-900 italic mb-3 pl-4 border-l-4 border-primary-600 leading-relaxed">
              "{todayVerse.verse}"
            </blockquote>
            <cite className="text-primary-600 font-medium">
              - {todayVerse.reference}
            </cite>
          </CardContent>
        </Card>
      )}

      {/* 말씀 입력/수정 폼 */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? '말씀 수정' : '새 말씀 추가'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  말씀 내용
                </label>
                <Textarea
                  value={formData.verse}
                  onChange={(e) => setFormData({ ...formData, verse: e.target.value })}
                  placeholder="하나님의 말씀을 입력해주세요..."
                  required
                  rows={4}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  성경 구절
                </label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="예: 요한복음 3:16"
                  required
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  활성화 (오늘의 말씀으로 사용)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  {editingId ? '수정' : '저장'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForm}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 말씀 목록 */}
      <Card>
        <CardContent className="p-6">
          {verses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>등록된 말씀이 없습니다.</p>
              <p className="text-sm">첫 번째 말씀을 추가해보세요.</p>
            </div>
          ) : (
            <div className="divide-y">
              {verses.map((verse) => (
                <div
                  key={verse.id}
                  className="py-4 first:pt-0 last:pb-0 group hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <blockquote className="text-gray-900 mb-2 leading-relaxed">
                        "{verse.verse}"
                      </blockquote>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <cite className="font-medium text-primary-600">
                          - {verse.reference}
                        </cite>
                        <Badge
                          variant={verse.is_active ? "success" : "secondary"}
                        >
                          {verse.is_active ? '활성' : '비활성'}
                        </Badge>
                        <span>
                          {formatDate(verse.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(verse)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(verse.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default DailyVerse;