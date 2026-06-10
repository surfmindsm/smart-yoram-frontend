import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseApiService } from '../services/supabaseApiService';
import {
  Button,
  Card,
  LoadingState,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  PageContainer,
  ConfirmDialog,
  toast,
} from "./ui";
import { DatePicker } from "./ui/date-picker";
import { FileText, Plus, Trash2, Upload, ExternalLink, X, Image as ImageIcon, Paperclip } from 'lucide-react';
import { usePageSubtitle, usePageActions } from "../hooks/usePageSubtitle";
import { formatDate } from "../utils/dateUtils";
import { cn } from "../lib/utils";

interface Bulletin {
  id: number;
  title: string;
  date: string;
  content?: string;
  file_url?: string;
  created_at: string;
  view_count: number;
}

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
      const churchId = user?.church_id;
      if (churchId) return churchId;
    }
    return 9998;
  } catch {
    return 9998;
  }
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageUrl = (url?: string): boolean => {
  if (!url) return false;
  const lower = url.split('?')[0].toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => lower.endsWith(ext));
};

const getFileNameFromUrl = (url?: string): string => {
  if (!url) return '';
  try {
    const path = decodeURIComponent(url.split('?')[0]);
    return path.split('/').pop() || '파일';
  } catch {
    return '파일';
  }
};

const Bulletins: React.FC = () => {
  const churchId = getChurchId();
  const queryClient = useQueryClient();

  // React Query 캐시
  const bulletinsQuery = useQuery({
    queryKey: ['bulletins', churchId],
    queryFn: async () => {
      const response = await supabaseApiService.bulletins.getAll({
        church_id: churchId,
        page: 1,
        limit: 100,
      });
      return (response?.data || []) as Bulletin[];
    },
    staleTime: 60_000,
  });

  const bulletins: Bulletin[] = bulletinsQuery.data || [];
  const isLoading = bulletinsQuery.isLoading;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bulletins'] });

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState<Bulletin | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    file_url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Bulletin | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  const resetForm = () => {
    setEditingBulletin(null);
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      content: '',
      file_url: '',
    });
    setSelectedFile(null);
    setRemoveExistingFile(false);
    setIsDragOver(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (bulletin: Bulletin) => {
    setEditingBulletin(bulletin);
    setFormData({
      title: bulletin.title,
      date: bulletin.date,
      content: bulletin.content || '',
      file_url: bulletin.file_url || '',
    });
    setSelectedFile(null);
    setRemoveExistingFile(false);
    setIsDragOver(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // 파일 검증 + 선택
  const pickFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast({
        title: '지원하지 않는 파일 형식',
        description: `${ACCEPTED_EXTENSIONS.join(', ')} 형식만 업로드 가능합니다.`,
        variant: 'destructive',
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: '파일이 너무 큽니다',
        description: `최대 ${formatFileSize(MAX_FILE_SIZE)}까지 업로드할 수 있습니다.`,
        variant: 'destructive',
      });
      return;
    }
    setSelectedFile(file);
    setRemoveExistingFile(false);
  };

  // 드래그 앤 드롭
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) pickFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: '오류', description: '제목을 입력해주세요.', variant: 'destructive' });
      return;
    }
    if (!formData.date) {
      toast({ title: '오류', description: '날짜를 선택해주세요.', variant: 'destructive' });
      return;
    }

    try {
      // 새 파일 업로드 우선, 그게 없고 "기존 파일 제거" 플래그가 켜져 있으면 빈 값으로
      let fileUrl = removeExistingFile && !selectedFile ? '' : formData.file_url;

      if (selectedFile) {
        setUploadingFile(true);
        try {
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `${formData.date}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `bulletins/${churchId}/${fileName}`;

          const { error: uploadError } = await (supabaseApiService as any).supabase.storage
            .from('bulletins')
            .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

          if (uploadError) throw new Error('파일 업로드에 실패했습니다.');

          const { data: publicUrlData } = (supabaseApiService as any).supabase.storage
            .from('bulletins')
            .getPublicUrl(filePath);
          fileUrl = publicUrlData.publicUrl;
        } catch (uploadError) {
          console.error('파일 업로드 오류:', uploadError);
          toast({ title: '오류', description: '파일 업로드에 실패했습니다.', variant: 'destructive' });
          setUploadingFile(false);
          return;
        } finally {
          setUploadingFile(false);
        }
      }

      if (editingBulletin) {
        await supabaseApiService.bulletins.update(editingBulletin.id.toString(), {
          title: formData.title,
          date: formData.date,
          content: formData.content || undefined,
          file_url: fileUrl || undefined,
        });
      } else {
        await supabaseApiService.bulletins.create({
          church_id: churchId,
          title: formData.title,
          date: formData.date,
          content: formData.content || undefined,
          file_url: fileUrl || undefined,
        });
      }

      toast({ title: '성공', description: editingBulletin ? '주보가 수정되었습니다.' : '주보가 추가되었습니다.' });
      closeModal();
      invalidate();
    } catch (error) {
      console.error('주보 저장 실패:', error);
      toast({ title: '오류', description: '주보 저장에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await supabaseApiService.bulletins.delete(deleteTarget.id.toString());
      toast({ title: '성공', description: '주보가 삭제되었습니다.' });
      setDeleteTarget(null);
      invalidate();
    } catch (error) {
      console.error('주보 삭제 실패:', error);
      toast({ title: '오류', description: '주보 삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  const requestDelete = () => {
    if (!editingBulletin) return;
    const target = editingBulletin;
    closeModal();
    setDeleteTarget(target);
  };

  // 최신순 정렬
  const sortedBulletins = useMemo(
    () => [...bulletins].sort((a, b) => b.date.localeCompare(a.date)),
    [bulletins]
  );

  // 상단바
  usePageSubtitle(`전체 ${bulletins.length}건`);
  usePageActions(
    <Button onClick={openAddModal} size="sm" className="gap-2">
      <Plus className="h-3.5 w-3.5" />
      주보 추가
    </Button>,
    [bulletins.length]
  );

  return (
    <PageContainer>
      {isLoading ? (
        <Card>
          <LoadingState text="주보 목록을 불러오는 중..." />
        </Card>
      ) : sortedBulletins.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
            <h3 className="mb-2 text-[15px] font-bold text-foreground">등록된 주보가 없습니다</h3>
            <p className="mb-4 text-[13px] text-muted-foreground">새로운 주보를 추가해보세요.</p>
            <Button onClick={openAddModal} size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              주보 추가
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[200px]" />
                <col />
                <col className="w-[140px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">날짜</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">제목</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">파일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {sortedBulletins.map((bulletin) => (
                  <tr
                    key={bulletin.id}
                    className="cursor-pointer transition-colors hover:bg-[#F8FAFD]"
                    onClick={() => openEditModal(bulletin)}
                  >
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                      {formatDate(bulletin.date)}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-foreground truncate" title={bulletin.title}>
                      {bulletin.title}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {bulletin.file_url ? (
                        <a
                          href={bulletin.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-primary transition-colors hover:bg-accent"
                          title={getFileNameFromUrl(bulletin.file_url) || '파일 보기'}
                        >
                          <Paperclip className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-[#CBD5E1]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 추가/수정 모달 */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingBulletin ? '주보 수정' : '주보 추가'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-[12.5px] font-semibold">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="예: 2026년 6월 둘째 주 주보"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12.5px] font-semibold">
                날짜 <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content" className="text-[12.5px] font-semibold">내용</Label>
              <Textarea
                id="content"
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="(선택) 주보에 대한 간단한 설명"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12.5px] font-semibold">파일</Label>
              <div className="space-y-2">
                {/* 새로 선택된 파일 */}
                {selectedFile ? (
                  <div className="flex items-center gap-2 rounded-[8px] border border-border bg-[#F8FAFD] px-3 py-2.5">
                    {/* 이미지 썸네일 */}
                    {selectedFile.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt={selectedFile.name}
                        className="h-10 w-10 flex-shrink-0 rounded-[6px] object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[6px] bg-[#EEF3FC] text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-foreground">{selectedFile.name}</div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {formatFileSize(selectedFile.size)} · 새로 업로드됨
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[6px] text-[#94A3B8] transition-colors hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                      title="취소"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : editingBulletin?.file_url && !removeExistingFile ? (
                  /* 기존 파일 */
                  <div className="flex items-center gap-2 rounded-[8px] border border-border bg-[#F8FAFD] px-3 py-2.5">
                    {isImageUrl(editingBulletin.file_url) ? (
                      <img
                        src={editingBulletin.file_url}
                        alt="첨부 이미지"
                        className="h-10 w-10 flex-shrink-0 rounded-[6px] object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[6px] bg-[#EEF3FC] text-primary">
                        {isImageUrl(editingBulletin.file_url) ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-foreground">
                        {getFileNameFromUrl(editingBulletin.file_url)}
                      </div>
                      <a
                        href={editingBulletin.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        새 탭에서 보기
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRemoveExistingFile(true)}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[6px] text-[#94A3B8] transition-colors hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                      title="파일 제거"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}

                {/* 드롭존 — 새 파일이 없거나, 기존 파일을 제거한 경우에 표시 */}
                {(!selectedFile && (!editingBulletin?.file_url || removeExistingFile)) && (
                  <label
                    htmlFor="bulletin-file"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "flex h-[88px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[8px] border-2 border-dashed text-[12.5px] transition-colors",
                      isDragOver
                        ? "border-primary bg-[#EEF3FC] text-primary"
                        : "border-border bg-[#F8FAFD] text-muted-foreground hover:border-primary hover:bg-[#EEF3FC] hover:text-primary"
                    )}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="font-medium">
                      {isDragOver ? '여기에 놓으세요' : '파일을 드래그하거나 클릭해서 업로드'}
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">
                      PDF · 이미지 · 문서 · 최대 {formatFileSize(MAX_FILE_SIZE)}
                    </span>
                    <input
                      id="bulletin-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) pickFile(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                )}

                {/* 기존 파일을 제거 표시한 상태 안내 */}
                {removeExistingFile && !selectedFile && (
                  <div className="flex items-center justify-between gap-2 rounded-[8px] border border-[#FCEBEB] bg-[#FFF8F8] px-3 py-2 text-[12px]">
                    <span className="text-[#DC2626]">기존 파일이 제거됩니다.</span>
                    <button
                      type="button"
                      onClick={() => setRemoveExistingFile(false)}
                      className="text-[11.5px] font-semibold text-primary hover:underline"
                    >
                      되돌리기
                    </button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between sm:gap-2">
              {editingBulletin ? (
                <Button
                  type="button"
                  variant="destructive-soft"
                  onClick={requestDelete}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={closeModal}>
                  취소
                </Button>
                <Button type="submit" disabled={uploadingFile}>
                  {uploadingFile ? '업로드 중...' : (editingBulletin ? '수정' : '추가')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="주보 삭제"
        description={
          <span>
            <span className="font-semibold">"{deleteTarget?.title}"</span> 주보를 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </span>
        }
        confirmText="삭제"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
};

export default Bulletins;
