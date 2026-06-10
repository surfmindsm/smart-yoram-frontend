import React, { useState, useEffect } from 'react';
import { formatDate as formatDateUtil } from '../utils/dateUtils';
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
  const formatDate = (dateString: string) => formatDateUtil(dateString);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-64 items-center justify-center">
          <div className="text-center">
            <Spinner size="default" className="mx-auto mb-4" />
            <p className="text-[13px] text-muted-foreground">오늘의 말씀을 불러오는 중...</p>
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
        <div className="rounded-[12px] border border-[#FAD9D9] bg-[#FCEBEB] p-4">
          <p className="text-[13px] text-[#DC2626]">{error}</p>
        </div>
      )}

      {/* 오늘의 말씀 — 다크 히어로 카드 (Direction C) */}
      {todayVerse && (
        <div
          className="relative mb-5 overflow-hidden rounded-[12px] px-10 py-9 text-white"
          style={{ background: 'linear-gradient(135deg, #0E1729, #1B2740)' }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute right-10 top-12 text-[60px] leading-none text-primary/50"
            style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic' }}
          >
            ”
          </span>
          <div className="mb-[18px] inline-flex items-center gap-[7px] rounded-full bg-white/10 px-3 py-[5px] text-[12px] font-semibold text-[#9DB0CC]">
            <BookOpen className="h-3.5 w-3.5" />
            오늘의 말씀
          </div>
          <div className="max-w-[820px] text-[24px] font-semibold leading-[1.55] tracking-[-0.01em]">
            “{todayVerse.verse}”
          </div>
          <div className="mt-[18px] text-[15px] font-bold text-primary">
            — {todayVerse.reference}
          </div>
        </div>
      )}

      {/* 말씀 입력/수정 폼 */}
      {showForm && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>{editingId ? '말씀 수정' : '새 말씀 추가'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-foreground">
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
                <label className="mb-2 block text-[12px] font-semibold text-foreground">
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <label htmlFor="is_active" className="text-[13px] text-foreground">
                  활성화 (오늘의 말씀으로 사용)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            등록된 말씀
            <span className="text-[12px] font-semibold text-[#94A3B8]">총 {verses.length}개</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {verses.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
              <p className="text-[13px] text-muted-foreground">등록된 말씀이 없습니다.</p>
              <p className="mt-1 text-[12px] text-[#94A3B8]">첫 번째 말씀을 추가해보세요.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F4F9]">
              {verses.map((verse) => (
                <div
                  key={verse.id}
                  className="group flex items-start gap-4 px-[18px] py-4 transition-colors hover:bg-[#FAFBFD]"
                >
                  <div className="flex-1 min-w-0">
                    <blockquote className="text-[14px] leading-[1.6] text-foreground">
                      “{verse.verse}”
                    </blockquote>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <cite className="text-[12.5px] font-bold not-italic text-primary">
                        — {verse.reference}
                      </cite>
                      <Badge variant={verse.is_active ? 'success' : 'neutral'}>
                        {verse.is_active ? '오늘 노출' : '대기'}
                      </Badge>
                      <span className="text-[11.5px] text-[#94A3B8]">{formatDate(verse.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-primary hover:bg-accent"
                      onClick={() => startEdit(verse)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-[#DC2626] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                      onClick={() => handleDelete(verse.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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