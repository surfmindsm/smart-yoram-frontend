import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseApiService } from '../services/supabaseApiService';
import {
  Button,
  Card,
  LoadingState,
  Input,
  Label,
  Alert,
  AlertDescription,
  PageContainer,
  toast,
} from "./ui";
import { Edit2, ExternalLink } from 'lucide-react';
import { usePageActions } from '../hooks/usePageSubtitle';

interface Church {
  idx?: number;
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  pastor_name?: string;
  homepage_url?: string;
  youtube_channel?: string;
  account?: string;
  subscription_status: string;
  subscription_end_date?: string | null;
  member_limit: number;
  is_active: boolean;
  subscription_plan?: string | null;
  business_no?: string | null;
  district_scheme?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface FormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  pastor_name: string;
  homepage_url: string;
  youtube_channel: string;
  account: string;
  business_no: string;
  district_scheme: string;
}

const emptyForm: FormData = {
  name: '',
  address: '',
  phone: '',
  email: '',
  pastor_name: '',
  homepage_url: '',
  youtube_channel: '',
  account: '',
  business_no: '',
  district_scheme: '',
};

const ChurchInfo: React.FC = () => {
  const queryClient = useQueryClient();
  const churchQuery = useQuery({
    queryKey: ['myChurch'],
    queryFn: () => supabaseApiService.churches.getMyChurch(),
    staleTime: 5 * 60_000,
  });

  const church: Church | null = churchQuery.data || null;
  const loading = churchQuery.isLoading;
  const error = churchQuery.error ? '교회 정보를 불러올 수 없습니다.' : '';

  const [isEditing, setIsEditing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  // church 데이터 도착 시 formData 동기화
  useEffect(() => {
    if (church && !isEditing) {
      setFormData({
        name: church.name || '',
        address: church.address || '',
        phone: church.phone || '',
        email: church.email || '',
        pastor_name: church.pastor_name || '',
        homepage_url: church.homepage_url || '',
        youtube_channel: church.youtube_channel || '',
        account: church.account || '',
        business_no: church.business_no || '',
        district_scheme: church.district_scheme || '',
      });
    }
  }, [church, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!church) return;
    if (!formData.name.trim()) {
      toast({ title: '오류', description: '교회명을 입력해주세요.', variant: 'destructive' });
      return;
    }

    try {
      setSubmitLoading(true);
      await supabaseApiService.churches.update(church.id, formData);
      toast({ title: '성공', description: '교회 정보가 저장되었습니다.' });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['myChurch'] });
    } catch (err) {
      console.error('교회 정보 저장 실패:', err);
      toast({ title: '오류', description: '교회 정보 저장에 실패했습니다.', variant: 'destructive' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    if (church) {
      setFormData({
        name: church.name || '',
        address: church.address || '',
        phone: church.phone || '',
        email: church.email || '',
        pastor_name: church.pastor_name || '',
        homepage_url: church.homepage_url || '',
        youtube_channel: church.youtube_channel || '',
        account: church.account || '',
        business_no: church.business_no || '',
        district_scheme: church.district_scheme || '',
      });
    }
    setIsEditing(false);
  };

  // 상단바 — 편집 모드면 취소/저장, 아니면 수정 버튼
  usePageActions(
    church ? (
      isEditing ? (
        <>
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={submitLoading}>
            취소
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const formEl = document.getElementById('church-info-form') as HTMLFormElement | null;
              if (formEl) formEl.requestSubmit();
            }}
            disabled={submitLoading}
          >
            {submitLoading ? '저장 중...' : '저장'}
          </Button>
        </>
      ) : (
        <Button onClick={() => setIsEditing(true)} size="sm" className="gap-2">
          <Edit2 className="h-3.5 w-3.5" />
          수정
        </Button>
      )
    ) : null,
    [isEditing, !!church, submitLoading]
  );

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <LoadingState text="교회 정보를 불러오는 중..." />
        </Card>
      </PageContainer>
    );
  }

  if (error && !church) {
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  // 정보 표시(읽기 전용) 행 렌더
  const renderInfoRow = (label: string, value?: React.ReactNode, fullWidth = false) => (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">{label}</div>
      <div className="mt-1.5 text-[13.5px] text-foreground">
        {value || <span className="text-[#CBD5E1]">-</span>}
      </div>
    </div>
  );

  const renderLink = (url?: string) =>
    url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
      >
        <span className="truncate">{url}</span>
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </a>
    ) : null;

  return (
    <PageContainer>
      {isEditing ? (
        /* 편집 모드 — 단일 카드 폼 */
        <form id="church-info-form" onSubmit={handleSubmit}>
          <Card className="overflow-hidden">
            <div className="space-y-6 px-6 py-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">
                  기본 정보
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-[12.5px] font-semibold">
                      교회명 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pastor_name" className="text-[12.5px] font-semibold">담임목사</Label>
                    <Input
                      id="pastor_name"
                      value={formData.pastor_name}
                      onChange={(e) => setFormData({ ...formData, pastor_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[12.5px] font-semibold">전화번호</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="예: 02-123-4567"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[12.5px] font-semibold">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="address" className="text-[12.5px] font-semibold">주소</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="business_no" className="text-[12.5px] font-semibold">사업자등록번호</Label>
                    <Input
                      id="business_no"
                      value={formData.business_no}
                      onChange={(e) => setFormData({ ...formData, business_no: e.target.value })}
                      placeholder="000-00-00000"
                    />
                  </div>
                </div>
              </div>

              {/* 온라인 채널 */}
              <div className="space-y-4 border-t border-[#EEF1F6] pt-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">
                  온라인 채널
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="homepage_url" className="text-[12.5px] font-semibold">홈페이지</Label>
                    <Input
                      id="homepage_url"
                      type="url"
                      value={formData.homepage_url}
                      onChange={(e) => setFormData({ ...formData, homepage_url: e.target.value })}
                      placeholder="https://church.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="youtube_channel" className="text-[12.5px] font-semibold">유튜브 채널</Label>
                    <Input
                      id="youtube_channel"
                      type="url"
                      value={formData.youtube_channel}
                      onChange={(e) => setFormData({ ...formData, youtube_channel: e.target.value })}
                      placeholder="https://youtube.com/@channel"
                    />
                  </div>
                </div>
              </div>

              {/* 헌금 계좌 */}
              <div className="space-y-4 border-t border-[#EEF1F6] pt-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">
                  헌금 계좌
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="account" className="text-[12.5px] font-semibold">계좌 정보</Label>
                  <Input
                    id="account"
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                    placeholder="예: 국민은행 123-456-789012 (교회명)"
                  />
                </div>
              </div>
            </div>
          </Card>
        </form>
      ) : (
        /* 읽기 전용 모드 */
        <Card className="overflow-hidden">
          <div className="space-y-6 px-6 py-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">
                기본 정보
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                {renderInfoRow('교회명', church?.name && <span className="font-semibold">{church.name}</span>)}
                {renderInfoRow('담임목사', church?.pastor_name)}
                {renderInfoRow('전화번호', church?.phone)}
                {renderInfoRow('이메일', church?.email)}
                {renderInfoRow('주소', church?.address, true)}
                {renderInfoRow('사업자등록번호', church?.business_no)}
              </div>
            </div>

            {/* 온라인 채널 */}
            <div className="space-y-4 border-t border-[#EEF1F6] pt-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">
                온라인 채널
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                {renderInfoRow('홈페이지', renderLink(church?.homepage_url))}
                {renderInfoRow('유튜브 채널', renderLink(church?.youtube_channel))}
              </div>
            </div>

            {/* 헌금 계좌 */}
            <div className="space-y-4 border-t border-[#EEF1F6] pt-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">
                헌금 계좌
              </div>
              <div>{renderInfoRow('계좌 정보', church?.account)}</div>
            </div>
          </div>
        </Card>
      )}
    </PageContainer>
  );
};

export default ChurchInfo;
