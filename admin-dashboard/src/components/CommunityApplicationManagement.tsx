import React, { useState, useEffect, useMemo } from 'react';
import { formatDateTime as formatDateTimeUtil } from '../utils/dateUtils';
import {
  Button,
  Card,
  LoadingState,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Alert,
  AlertDescription,
  PageContainer,
  toast,
} from "./ui";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Spinner } from './ui/spinner';
import {
  communityApplicationService,
  CommunityApplication,
  ApplicationsResponse,
  ApplicationsQueryParams,
} from '../services/communityApplicationService';
import { usePageSubtitle } from '../hooks/usePageSubtitle';
import { cn } from '../lib/utils';

const STATUS_CHIP_CLASS: Record<string, string> = {
  pending: 'bg-[#FBF1E3] text-[#B45309]',
  approved: 'bg-[#E7F6EC] text-[#16A34A]',
  rejected: 'bg-[#FCEBEB] text-[#DC2626]',
};

const STATUS_LABEL: Record<string, string> = {
  pending: '검토중',
  approved: '승인됨',
  rejected: '반려됨',
};

const TYPE_LABEL: Record<string, string> = {
  company: '업체/회사',
  individual: '개인사업자',
  musician: '연주자/음악가',
  minister: '사역자',
  organization: '단체/기관',
  other: '기타',
};

const TYPE_CHIP_CLASS: Record<string, string> = {
  company: 'bg-[#EAF1FE] text-[#2563EB]',
  individual: 'bg-[#E7F6EC] text-[#16A34A]',
  musician: 'bg-[#F3E8FF] text-[#7E22CE]',
  minister: 'bg-[#FBF1E3] text-[#B45309]',
  organization: 'bg-[#F0E6EF] text-[#8A5A86]',
  other: 'bg-[#F1F4F9] text-[#64748B]',
};

const CommunityApplicationManagement: React.FC = () => {
  const [applications, setApplications] = useState<CommunityApplication[]>([]);
  const [statistics, setStatistics] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<CommunityApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const params: ApplicationsQueryParams = {
        page: 1,
        limit: 100,
        status: statusFilter === 'all' ? undefined : (statusFilter as any),
        applicant_type: typeFilter === 'all' ? undefined : (typeFilter as any),
        search: searchTerm || undefined,
      };
      const response: ApplicationsResponse = await communityApplicationService.getApplications(params);
      const processed = response.applications.map(app => ({
        ...app,
        attachments: typeof app.attachments === 'string'
          ? JSON.parse(app.attachments || '[]')
          : (app.attachments || []),
      }));
      setApplications(processed);
      setStatistics(response.statistics);
    } catch (err: any) {
      console.error('신청서 목록 조회 실패:', err);
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, searchTerm]);

  const filteredApplications = useMemo(() => {
    if (!applications || !Array.isArray(applications)) return [];
    const search = searchTerm.toLowerCase();
    return applications.filter(app => {
      const matchesSearch =
        !search ||
        app.organization_name.toLowerCase().includes(search) ||
        app.contact_person.toLowerCase().includes(search) ||
        app.email.toLowerCase().includes(search);
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesType = typeFilter === 'all' || app.applicant_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [applications, searchTerm, statusFilter, typeFilter]);

  const handleViewDetails = (application: CommunityApplication) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleApprove = async (applicationId: number) => {
    setProcessingId(applicationId);
    try {
      await communityApplicationService.approveApplication(applicationId);
      await loadApplications();
      toast({ title: '승인 완료', description: '신청이 승인되었습니다.' });
    } catch (error: any) {
      console.error('승인 처리 실패:', error);
      toast({ title: '승인 실패', description: error.message || '승인 처리 중 오류가 발생했습니다.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      toast({ title: '오류', description: '반려 사유를 입력해주세요.', variant: 'destructive' });
      return;
    }
    setProcessingId(selectedApplication.id);
    try {
      await communityApplicationService.rejectApplication(selectedApplication.id, rejectionReason);
      await loadApplications();
      setShowRejectModal(false);
      setRejectionReason('');
      toast({ title: '반려 완료', description: '신청이 반려되었습니다.' });
    } catch (error: any) {
      console.error('반려 처리 실패:', error);
      toast({ title: '반려 실패', description: error.message || '반려 처리 중 오류가 발생했습니다.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  usePageSubtitle(
    statistics.pending > 0
      ? `검토 대기 ${statistics.pending}건 · 전체 ${statistics.total}건`
      : `전체 ${statistics.total}건`
  );

  const renderStatusChip = (status: string) => (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
      STATUS_CHIP_CLASS[status] || 'bg-[#F1F4F9] text-[#64748B]'
    )}>
      {STATUS_LABEL[status] || status}
    </span>
  );

  const renderTypeChip = (type: string) => (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
      TYPE_CHIP_CLASS[type] || TYPE_CHIP_CLASS.other
    )}>
      {TYPE_LABEL[type] || type}
    </span>
  );

  return (
    <PageContainer>
      {/* KPI strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FBF1E3] text-[#B45309]">
              <Clock className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground">검토중</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-[#B45309]">
                {statistics.pending}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#E7F6EC] text-[#16A34A]">
              <CheckCircle className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground">승인됨</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-[#16A34A]">
                {statistics.approved}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FCEBEB] text-[#DC2626]">
              <XCircle className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground">반려됨</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-[#DC2626]">
                {statistics.rejected}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#EAF1FE] text-[#2563EB]">
              <FileText className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground">전체</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-foreground">
                {statistics.total}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        {/* 검색 + 필터 바 */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF1F6] px-[16px] py-[14px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              type="text"
              placeholder="단체명·담당자·이메일 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 md:w-[320px]"
            />
          </div>
          <div className="flex-1" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-[38px] w-auto min-w-[160px] gap-2">
              <span className="text-[12.5px] text-muted-foreground">유형</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-[38px] w-auto min-w-[140px] gap-2">
              <span className="text-[12.5px] text-muted-foreground">상태</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">검토중</SelectItem>
              <SelectItem value="approved">승인됨</SelectItem>
              <SelectItem value="rejected">반려됨</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 */}
        {loading ? (
          <LoadingState text="신청서를 불러오는 중..." />
        ) : filteredApplications.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
            <h3 className="mb-2 text-[15px] font-bold text-foreground">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? '조건에 맞는 신청서가 없습니다' : '신청서가 없습니다'}
            </h3>
            <p className="text-[13px] text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? '검색어나 필터를 조정해보세요.' : '아직 등록된 신청서가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[100px]" />
                <col className="w-[120px]" />
                <col />
                <col className="w-[120px]" />
                <col className="w-[200px]" />
                <col className="w-[160px]" />
                <col className="w-[180px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">상태</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">유형</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">단체/회사명</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">담당자</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">이메일</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">신청일시</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => handleViewDetails(app)}
                    className="cursor-pointer transition-colors hover:bg-[#F8FAFD]"
                  >
                    <td className="px-4 py-3">{renderStatusChip(app.status)}</td>
                    <td className="px-4 py-3">{renderTypeChip(app.applicant_type)}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-foreground truncate" title={app.organization_name}>
                      {app.organization_name}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground truncate">{app.contact_person}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground truncate" title={app.email}>{app.email}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                      {formatDateTimeUtil(app.submitted_at)}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {app.status === 'pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="success-soft"
                            onClick={() => handleApprove(app.id)}
                            disabled={processingId === app.id || loading}
                            className="h-8 gap-1.5 text-[12px]"
                          >
                            {processingId === app.id ? <Spinner size="sm" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            승인
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive-soft"
                            onClick={() => {
                              setSelectedApplication(app);
                              setShowRejectModal(true);
                            }}
                            disabled={processingId === app.id || loading}
                            className="h-8 gap-1.5 text-[12px]"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            반려
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">처리 완료</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 상세보기 모달 */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>신청서 상세</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-5 py-2">
              {/* 상태·유형·신청일 */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[#F8FAFD] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {renderStatusChip(selectedApplication.status)}
                  {renderTypeChip(selectedApplication.applicant_type)}
                </div>
                <div className="text-[12px] text-muted-foreground tabular-nums">
                  신청 {formatDateTimeUtil(selectedApplication.submitted_at)}
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">기본 정보</div>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-[13px] md:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">단체/회사명</dt>
                    <dd className="font-semibold text-foreground">{selectedApplication.organization_name}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">담당자</dt>
                    <dd className="text-foreground">{selectedApplication.contact_person}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">이메일</dt>
                    <dd className="truncate text-foreground">{selectedApplication.email}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">연락처</dt>
                    <dd className="text-foreground tabular-nums">{selectedApplication.phone}</dd>
                  </div>
                  {selectedApplication.business_number && (
                    <div className="flex gap-2">
                      <dt className="w-[90px] text-muted-foreground">사업자번호</dt>
                      <dd className="text-foreground tabular-nums">{selectedApplication.business_number}</dd>
                    </div>
                  )}
                  {selectedApplication.service_area && (
                    <div className="flex gap-2">
                      <dt className="w-[90px] text-muted-foreground">서비스 지역</dt>
                      <dd className="text-foreground">{selectedApplication.service_area}</dd>
                    </div>
                  )}
                  {selectedApplication.address && (
                    <div className="flex gap-2 md:col-span-2">
                      <dt className="w-[90px] flex-shrink-0 text-muted-foreground">주소</dt>
                      <dd className="text-foreground">{selectedApplication.address}</dd>
                    </div>
                  )}
                  {selectedApplication.website && (
                    <div className="flex gap-2 md:col-span-2">
                      <dt className="w-[90px] flex-shrink-0 text-muted-foreground">웹사이트</dt>
                      <dd>
                        <a
                          href={selectedApplication.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          <span className="truncate">{selectedApplication.website}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* 신청 사유 */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">신청 사유</div>
                <div className="rounded-[8px] border border-border bg-[#FAFBFD] px-3 py-2.5">
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                    {selectedApplication.description}
                  </p>
                </div>
              </div>

              {/* 첨부 파일 */}
              {(selectedApplication.attachments || []).length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">첨부 파일</div>
                  <div className="space-y-1.5">
                    {(selectedApplication.attachments || []).map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 rounded-[8px] border border-border bg-[#FAFBFD] px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText className="h-4 w-4 flex-shrink-0 text-[#94A3B8]" />
                          <span className="truncate text-[13px] font-medium text-foreground">{file.filename}</span>
                          <span className="flex-shrink-0 text-[11.5px] text-[#94A3B8] tabular-nums">
                            {(file.size / 1024).toFixed(1)}KB
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 flex-shrink-0 p-0 text-primary"
                          onClick={async () => {
                            try {
                              await communityApplicationService.downloadAttachment(selectedApplication.id, file.filename);
                            } catch (error) {
                              toast({ title: '오류', description: '파일 다운로드에 실패했습니다.', variant: 'destructive' });
                              console.error('다운로드 에러:', error);
                            }
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 검토 정보 */}
              {(selectedApplication.reviewed_at || selectedApplication.rejection_reason) && (
                <div className="space-y-3 border-t border-[#EEF1F6] pt-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">검토 정보</div>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-[13px] md:grid-cols-2">
                    {selectedApplication.reviewed_at && (
                      <div className="flex gap-2">
                        <dt className="w-[90px] text-muted-foreground">검토일</dt>
                        <dd className="text-foreground tabular-nums">{formatDateTimeUtil(selectedApplication.reviewed_at)}</dd>
                      </div>
                    )}
                    {selectedApplication.reviewed_by && (
                      <div className="flex gap-2">
                        <dt className="w-[90px] text-muted-foreground">검토자</dt>
                        <dd className="text-foreground">{selectedApplication.reviewed_by}</dd>
                      </div>
                    )}
                  </dl>
                  {selectedApplication.rejection_reason && (
                    <div className="rounded-[8px] border border-[#FAD9D9] bg-[#FFF8F8] px-3 py-2.5">
                      <div className="mb-1 text-[11.5px] font-semibold text-[#DC2626]">반려 사유</div>
                      <p className="whitespace-pre-wrap text-[13px] text-[#DC2626]">{selectedApplication.rejection_reason}</p>
                    </div>
                  )}
                  {selectedApplication.notes && (
                    <div className="rounded-[8px] border border-[#D6E6FE] bg-[#F0F6FF] px-3 py-2.5">
                      <div className="mb-1 text-[11.5px] font-semibold text-[#2563EB]">검토 메모</div>
                      <p className="whitespace-pre-wrap text-[13px] text-[#2563EB]">{selectedApplication.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between sm:gap-2">
            {selectedApplication?.status === 'pending' ? (
              <>
                <Button
                  variant="destructive-soft"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowRejectModal(true);
                  }}
                  className="gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  반려
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setShowDetailsModal(false)}>닫기</Button>
                  <Button
                    onClick={() => {
                      if (selectedApplication) {
                        handleApprove(selectedApplication.id);
                        setShowDetailsModal(false);
                      }
                    }}
                    disabled={processingId === selectedApplication?.id || loading}
                    className="gap-1.5"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    승인
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div />
                <Button variant="ghost" onClick={() => setShowDetailsModal(false)}>닫기</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 모달 */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>신청 반려</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-[8px] border border-[#FAD9D9] bg-[#FFF8F8] px-3 py-2 text-[12.5px] text-[#DC2626]">
              반려 사유를 명확히 작성해주세요. 신청자에게 이메일로 전달됩니다.
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rejectionReason" className="text-[12.5px] font-semibold">
                반려 사유 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="반려 사유를 자세히 입력해주세요"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingId !== null || loading || !rejectionReason.trim()}
            >
              반려 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default CommunityApplicationManagement;
