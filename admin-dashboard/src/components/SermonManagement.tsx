import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Play,
  Calendar,
  User,
  BookOpen,
  Tag,
  BarChart3,
  Search,
  X,
  Clock,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui';
import { Button } from './ui';
import { Input } from './ui';
import { Textarea } from './ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui';
import { Badge } from './ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui';
import { Spinner } from './ui/spinner';
import { sermonService, Sermon, SermonCreate, SermonCategory } from '../services/sermonService';

// 미리 정의된 설교 주제 (다중 선택 가능)
const SERMON_TOPICS = [
  '믿음',
  '사랑',
  '은혜',
  '소망',
  '섬김'
] as const;

const SermonManagement: React.FC = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [categories, setCategories] = useState<SermonCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);

  // 필터 및 검색 상태
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPreacher, setFilterPreacher] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDurationMin, setFilterDurationMin] = useState<string>('');
  const [filterDurationMax, setFilterDurationMax] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('all');

  const [formData, setFormData] = useState<SermonCreate>({
    title: '',
    youtube_url: '',
    preacher_name: '',
    description: '',
    scripture_reference: '',
    category_id: undefined,
    sermon_date: new Date().toISOString().split('T')[0],
    tags: [],
    language: 'ko',
    is_featured: false,
    display_order: 0,
  });
  const [durationInput, setDurationInput] = useState({ minutes: '', seconds: '' });

  useEffect(() => {
    loadSermons();
    loadCategories();
  }, []);

  const loadSermons = async () => {
    try {
      setLoading(true);
      // 모든 설교를 가져오고 클라이언트 사이드에서 필터링
      const data = await sermonService.getAll({});
      setSermons(data);
    } catch (error) {
      console.error('설교 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await sermonService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    }
  };

  // 설교자 목록 추출
  const preachers = useMemo(() => {
    const uniquePreachers = new Set<string>();
    sermons.forEach(sermon => {
      if (sermon.preacher_name) {
        uniquePreachers.add(sermon.preacher_name);
      }
    });
    return Array.from(uniquePreachers).sort();
  }, [sermons]);

  // 모든 태그 목록 추출
  const allTags = useMemo(() => {
    const uniqueTags = new Set<string>();
    sermons.forEach(sermon => {
      sermon.tags?.forEach(tag => uniqueTags.add(tag));
    });
    return Array.from(uniqueTags).sort();
  }, [sermons]);

  // 필터링 및 검색 로직
  const filteredSermons = useMemo(() => {
    return sermons.filter(sermon => {
      // 상태 필터
      if (filterStatus === 'active' && !sermon.is_active) return false;
      if (filterStatus === 'inactive' && sermon.is_active) return false;

      // 카테고리 필터
      if (filterCategory !== 'all' && sermon.category_id?.toString() !== filterCategory) return false;

      // 설교자 필터
      if (filterPreacher !== 'all' && sermon.preacher_name !== filterPreacher) return false;

      // 태그 필터
      if (filterTag !== 'all' && !sermon.tags?.includes(filterTag)) return false;

      // 길이 필터
      if (filterDurationMin && sermon.duration_seconds) {
        const minSeconds = parseInt(filterDurationMin) * 60;
        if (sermon.duration_seconds < minSeconds) return false;
      }
      if (filterDurationMax && sermon.duration_seconds) {
        const maxSeconds = parseInt(filterDurationMax) * 60;
        if (sermon.duration_seconds > maxSeconds) return false;
      }

      // 검색 쿼리 (제목, 설교자, 본문, 태그)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = sermon.title.toLowerCase().includes(query);
        const matchPreacher = sermon.preacher_name?.toLowerCase().includes(query);
        const matchScripture = sermon.scripture_reference?.toLowerCase().includes(query);
        const matchTags = sermon.tags?.some(tag => tag.toLowerCase().includes(query));
        const matchDescription = sermon.description?.toLowerCase().includes(query);

        if (!matchTitle && !matchPreacher && !matchScripture && !matchTags && !matchDescription) {
          return false;
        }
      }

      return true;
    });
  }, [sermons, filterStatus, filterCategory, filterPreacher, filterTag, filterDurationMin, filterDurationMax, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = 1; // TODO: 실제 로그인 사용자 ID 사용

      // 길이(분:초)를 초로 변환
      const minutes = parseInt(durationInput.minutes) || 0;
      const seconds = parseInt(durationInput.seconds) || 0;
      const totalSeconds = minutes * 60 + seconds;

      const submitData = {
        ...formData,
        duration_seconds: totalSeconds > 0 ? totalSeconds : undefined,
      };

      if (editingSermon) {
        await sermonService.update(editingSermon.id, submitData, userId);
      } else {
        await sermonService.create(submitData, userId);
      }

      await loadSermons();
      handleCloseDialog();
    } catch (error) {
      console.error('설교 저장 실패:', error);
      alert('설교 저장에 실패했습니다.');
    }
  };

  const handleEdit = (sermon: Sermon) => {
    setEditingSermon(sermon);

    // 길이를 분:초로 분리
    const minutes = sermon.duration_seconds ? Math.floor(sermon.duration_seconds / 60) : 0;
    const seconds = sermon.duration_seconds ? sermon.duration_seconds % 60 : 0;

    setFormData({
      title: sermon.title,
      youtube_url: sermon.youtube_url,
      preacher_name: sermon.preacher_name || '',
      description: sermon.description || '',
      scripture_reference: sermon.scripture_reference || '',
      category_id: sermon.category_id,
      sermon_date: sermon.sermon_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      tags: sermon.tags || [],
      language: sermon.language || 'ko',
      is_featured: sermon.is_featured,
      display_order: sermon.display_order,
    });

    setDurationInput({
      minutes: minutes > 0 ? minutes.toString() : '',
      seconds: seconds > 0 ? seconds.toString() : '',
    });

    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('이 설교를 삭제하시겠습니까?')) {
      try {
        const userId = 1; // TODO: 실제 로그인 사용자 ID 사용
        await sermonService.delete(id, userId);
        await loadSermons();
      } catch (error) {
        console.error('설교 삭제 실패:', error);
        alert('설교 삭제에 실패했습니다.');
      }
    }
  };

  const handleToggleActive = async (sermon: Sermon) => {
    try {
      const userId = 1; // TODO: 실제 로그인 사용자 ID 사용
      await sermonService.update(sermon.id, { is_active: !sermon.is_active }, userId);
      await loadSermons();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleToggleFeatured = async (sermon: Sermon) => {
    try {
      const userId = 1; // TODO: 실제 로그인 사용자 ID 사용
      await sermonService.update(sermon.id, { is_featured: !sermon.is_featured }, userId);
      await loadSermons();
    } catch (error) {
      console.error('추천 설정 변경 실패:', error);
      alert('추천 설정 변경에 실패했습니다.');
    }
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingSermon(null);
    setFormData({
      title: '',
      youtube_url: '',
      preacher_name: '',
      description: '',
      scripture_reference: '',
      category_id: undefined,
      sermon_date: new Date().toISOString().split('T')[0],
      tags: [],
      language: 'ko',
      is_featured: false,
      display_order: 0,
    });
    setDurationInput({ minutes: '', seconds: '' });
  };

  const resetFilters = () => {
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterPreacher('all');
    setFilterTag('all');
    setFilterDurationMin('');
    setFilterDurationMax('');
    setSearchQuery('');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">명설교 관리</h1>
          <p className="text-muted-foreground">
            시스템 전체에 배포되는 명설교 영상을 관리합니다.
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              설교 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSermon ? '설교 수정' : '새 설교 추가'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  설교 제목 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="설교 제목을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  유튜브 URL <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.youtube_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  유튜브 영상 URL을 입력하세요. (watch?v= 또는 youtu.be 형식)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    설교자 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.preacher_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, preacher_name: e.target.value }))}
                    placeholder="설교자 이름"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">설교 날짜</label>
                  <Input
                    type="date"
                    value={formData.sermon_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, sermon_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">본문 말씀</label>
                <Input
                  value={formData.scripture_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, scripture_reference: e.target.value }))}
                  placeholder="예: 요한복음 3:16-21"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">카테고리</label>
                  <Select
                    value={formData.category_id?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">설교 길이</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        value={durationInput.minutes}
                        onChange={(e) => setDurationInput(prev => ({ ...prev, minutes: e.target.value }))}
                        placeholder="분"
                      />
                    </div>
                    <span className="self-center">:</span>
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={durationInput.seconds}
                        onChange={(e) => setDurationInput(prev => ({ ...prev, seconds: e.target.value }))}
                        placeholder="초"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    예: 45분 30초
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="설교 내용에 대한 설명을 입력하세요"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">주제 선택 (다중 선택 가능)</label>
                <div className="flex flex-wrap gap-2">
                  {SERMON_TOPICS.map((topic) => {
                    const isSelected = formData.tags?.includes(topic);
                    return (
                      <Badge
                        key={topic}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1.5 text-sm hover:bg-primary/90"
                        onClick={() => {
                          if (isSelected) {
                            // 선택 해제
                            setFormData(prev => ({
                              ...prev,
                              tags: (prev.tags || []).filter(t => t !== topic)
                            }));
                          } else {
                            // 선택
                            setFormData(prev => ({
                              ...prev,
                              tags: [...(prev.tags || []), topic]
                            }));
                          }
                        }}
                      >
                        {topic}
                      </Badge>
                    );
                  })}
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    선택된 주제: {formData.tags.join(', ')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">추천 설교로 설정</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">표시 순서</label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  취소
                </Button>
                <Button type="submit">
                  {editingSermon ? '수정' : '추가'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>검색 및 필터</CardTitle>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <X className="w-4 h-4 mr-2" />
              초기화
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 검색 */}
          <div>
            <label className="block text-sm font-medium mb-2">통합 검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목, 설교자, 본문, 태그, 설명 검색..."
                className="pl-10"
              />
            </div>
          </div>

          {/* 필터 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">상태</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">카테고리</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">설교자</label>
              <Select value={filterPreacher} onValueChange={setFilterPreacher}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {preachers.map((preacher) => (
                    <SelectItem key={preacher} value={preacher}>
                      {preacher}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">태그</label>
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 길이 필터 */}
          <div>
            <label className="block text-sm font-medium mb-2">설교 길이 (분)</label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="0"
                value={filterDurationMin}
                onChange={(e) => setFilterDurationMin(e.target.value)}
                placeholder="최소"
                className="w-24"
              />
              <span>~</span>
              <Input
                type="number"
                min="0"
                value={filterDurationMax}
                onChange={(e) => setFilterDurationMax(e.target.value)}
                placeholder="최대"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">분</span>
            </div>
          </div>

          {/* 필터 결과 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Filter className="w-4 h-4" />
            <span>
              전체 {sermons.length}개 중 {filteredSermons.length}개 표시
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체 설교</p>
                <p className="text-2xl font-bold">{sermons.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">활성 설교</p>
                <p className="text-2xl font-bold">
                  {sermons.filter(s => s.is_active).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">추천 설교</p>
                <p className="text-2xl font-bold">
                  {sermons.filter(s => s.is_featured && s.is_active).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">총 조회수</p>
                <p className="text-2xl font-bold">
                  {sermons.reduce((sum, s) => sum + s.view_count, 0).toLocaleString()}
                </p>
              </div>
              <Play className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 설교 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>설교 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Spinner size="lg" />
              <p className="text-muted-foreground mt-2">로딩 중...</p>
            </div>
          ) : filteredSermons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery || filterPreacher !== 'all' || filterCategory !== 'all' || filterTag
                  ? '검색 결과가 없습니다.'
                  : '등록된 설교가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSermons.map((sermon) => (
                <div
                  key={sermon.id}
                  className={`border rounded-lg p-4 ${
                    sermon.is_active ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* 썸네일 */}
                    <div className="flex-shrink-0">
                      <img
                        src={sermon.thumbnail_url}
                        alt={sermon.title}
                        className="w-48 h-28 object-cover rounded"
                      />
                    </div>

                    {/* 정보 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium text-lg ${
                              sermon.is_active ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {sermon.title}
                            </h3>
                            {sermon.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                추천
                              </Badge>
                            )}
                            {!sermon.is_active && (
                              <Badge variant="secondary">비활성</Badge>
                            )}
                          </div>

                          {sermon.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {sermon.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {sermon.preacher_name && (
                              <div className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {sermon.preacher_name}
                              </div>
                            )}
                            {sermon.scripture_reference && (
                              <div className="flex items-center">
                                <BookOpen className="w-3 h-3 mr-1" />
                                {sermon.scripture_reference}
                              </div>
                            )}
                            {sermon.sermon_date && (
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(sermon.sermon_date).toLocaleDateString('ko-KR')}
                              </div>
                            )}
                            {sermon.duration_seconds && (
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDuration(sermon.duration_seconds)}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Play className="w-3 h-3 mr-1" />
                              조회수 {sermon.view_count.toLocaleString()}
                            </div>
                          </div>

                          {sermon.tags && sermon.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {sermon.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="w-2 h-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleFeatured(sermon)}
                            title={sermon.is_featured ? '추천 해제' : '추천 설정'}
                          >
                            {sermon.is_featured ? (
                              <StarOff className="w-4 h-4" />
                            ) : (
                              <Star className="w-4 h-4" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(sermon)}
                            title={sermon.is_active ? '비활성화' : '활성화'}
                          >
                            {sermon.is_active ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(sermon)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(sermon.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
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

export default SermonManagement;
