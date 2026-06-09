import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { Button } from "./ui";
import { Input } from "./ui";
import { Textarea } from "./ui";
import { Badge } from "./ui";
import { Spinner } from "./ui/spinner";
import { supabaseApiService } from '../services/supabaseApiService';
import { BookOpen, Plus, Edit, Trash2, Save, X, Calendar } from 'lucide-react';

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
      <div className="p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Spinner size="default" className="mx-auto mb-4" />
            <p className="text-gray-500">오늘의 말씀을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">오늘의 말씀</h1>
            <p className="text-gray-500">매일의 은혜로운 말씀을 나누어요</p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          새 말씀 추가
        </Button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 오늘의 말씀 카드 */}
      {todayVerse && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Calendar className="h-5 w-5" />
              <span>오늘의 말씀</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {formatDate(todayVerse.created_at)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote className="text-lg text-gray-800 font-medium leading-relaxed mb-3">
              "{todayVerse.verse}"
            </blockquote>
            <cite className="text-blue-600 font-semibold">
              - {todayVerse.reference}
            </cite>
          </CardContent>
        </Card>
      )}

      {/* 말씀 입력/수정 폼 */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>{editingId ? '말씀 수정' : '새 말씀 추가'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
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

              <div className="flex space-x-3 pt-4">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? '수정' : '저장'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForm}>
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 말씀 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>등록된 말씀 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {verses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>등록된 말씀이 없습니다.</p>
              <p className="text-sm">첫 번째 말씀을 추가해보세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verses.map((verse) => (
                <div
                  key={verse.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <blockquote className="text-gray-800 mb-2 leading-relaxed">
                        "{verse.verse}"
                      </blockquote>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <cite className="font-medium text-blue-600">
                          - {verse.reference}
                        </cite>
                        <Badge
                          variant={verse.is_active ? "default" : "secondary"}
                          className={verse.is_active ? "bg-green-100 text-green-800" : ""}
                        >
                          {verse.is_active ? '활성' : '비활성'}
                        </Badge>
                        <span>
                          {formatDate(verse.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(verse)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  );
};

export default DailyVerse;