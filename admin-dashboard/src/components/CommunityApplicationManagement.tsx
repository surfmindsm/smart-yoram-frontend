import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  FileText,
  Mail,
  Phone,
  MapPin,
  Building,
  User,
  Calendar,
  Download,
  MessageSquare,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  communityApplicationService, 
  CommunityApplication, 
  ApplicationsResponse,
  ApplicationsQueryParams 
} from '../services/communityApplicationService';

const CommunityApplicationManagement: React.FC = () => {
  const [applications, setApplications] = useState<CommunityApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<CommunityApplication[]>([]);
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

  // 데이터 로드 함수
  const loadApplications = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params: ApplicationsQueryParams = {
        page: 1,
        limit: 100, // 일단 많이 가져와서 클라이언트 사이드에서 필터링
        status: statusFilter === 'all' ? undefined : statusFilter as any,
        applicant_type: typeFilter === 'all' ? undefined : typeFilter as any,
        search: searchTerm || undefined,
      };

      const response: ApplicationsResponse = await communityApplicationService.getApplications(params);
      
      // 백엔드에서 오는 데이터 정제
      const processedApplications = response.applications.map(app => ({
        ...app,
        // attachments가 문자열로 오는 경우 JSON 파싱
        attachments: typeof app.attachments === 'string' 
          ? JSON.parse(app.attachments || '[]') 
          : (app.attachments || [])
      }));
      
      setApplications(processedApplications);
      setFilteredApplications(processedApplications);
      setStatistics(response.statistics);
    } catch (err: any) {
      console.error('신청서 목록 조회 실패:', err);
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      setApplications([]);
      setFilteredApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter, typeFilter, searchTerm]);

  useEffect(() => {
    // applications이 undefined이거나 배열이 아닌 경우 안전하게 처리
    if (!applications || !Array.isArray(applications)) {
      setFilteredApplications([]);
      return;
    }

    let filtered = applications.filter(app => {
      const matchesSearch = 
        app.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesType = typeFilter === 'all' || app.applicant_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '검토중', variant: 'secondary' as const, icon: Clock },
      approved: { label: '승인됨', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: '반려됨', variant: 'destructive' as const, icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      company: '업체/회사',
      individual: '개인사업자',
      musician: '연주자/음악가',
      minister: '사역자',
      organization: '단체/기관',
      other: '기타'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const handleViewDetails = (application: CommunityApplication) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleApprove = async (applicationId: number, notes?: string) => {
    setProcessingId(applicationId);
    try {
      const result = await communityApplicationService.approveApplication(applicationId, notes);
      
      // 성공적으로 승인되면 목록 다시 로드
      await loadApplications();
      
      alert('신청이 승인되었습니다.');
      console.log('승인 결과:', result);
      
      // 계정 생성 정보가 있다면 보여주기
      if (result.user_account) {
        alert(`계정이 생성되었습니다.\n아이디: ${result.user_account.username}\n임시 비밀번호: ${result.user_account.temporary_password}`);
      }
    } catch (error: any) {
      console.error('승인 처리 실패:', error);
      setError(error.message || '승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      setError('반려 사유를 입력해주세요.');
      return;
    }

    setProcessingId(selectedApplication.id);
    try {
      const result = await communityApplicationService.rejectApplication(
        selectedApplication.id, 
        rejectionReason
      );
      
      // 성공적으로 반려되면 목록 다시 로드
      await loadApplications();
      
      setShowRejectModal(false);
      setRejectionReason('');
      alert('신청이 반려되었습니다.');
      console.log('반려 결과:', result);
    } catch (error: any) {
      console.error('반려 처리 실패:', error);
      setError(error.message || '반려 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">회원 신청 관리</h1>
          <p className="text-gray-600">커뮤니티 회원 신청서를 검토하고 승인/반려 처리하세요</p>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="신청자명, 단체명, 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">검토중</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="rejected">반려됨</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="유형 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="company">업체/회사</SelectItem>
                <SelectItem value="individual">개인사업자</SelectItem>
                <SelectItem value="musician">연주자/음악가</SelectItem>
                <SelectItem value="minister">사역자</SelectItem>
                <SelectItem value="organization">단체/기관</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">검토중</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(applications || []).filter(app => app.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인됨</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(applications || []).filter(app => app.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">반려됨</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(applications || []).filter(app => app.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-4 w-4 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체</p>
                <p className="text-2xl font-bold text-gray-900">{(applications || []).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 신청 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>신청 목록</CardTitle>
          <CardDescription>
            {(filteredApplications || []).length}개의 신청서가 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(filteredApplications || []).map((application) => (
              <div key={application.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{getTypeLabel(application.applicant_type)}</Badge>
                    {getStatusBadge(application.status)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(application.submitted_at)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{application.organization_name}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-1" />
                      {application.contact_person}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-1" />
                      {application.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-1" />
                      {application.phone}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {application.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {(application.attachments || []).length > 0 && (
                      <span className="flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        첨부파일 {(application.attachments || []).length}개
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(application)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      상세보기
                    </Button>
                    
                    {application.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(application.id)}
                          disabled={processingId === application.id || loading}
                        >
                          {processingId === application.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          {processingId === application.id ? '승인 중...' : '승인'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowRejectModal(true);
                          }}
                          disabled={processingId === application.id || loading}
                        >
                          {processingId === application.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-1" />
                          )}
                          {processingId === application.id ? '반려 중...' : '반려'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading && (filteredApplications || []).length === 0 && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">데이터를 불러오는 중...</h3>
            </div>
          )}

          {!loading && (filteredApplications || []).length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-600">다른 검색어나 필터를 시도해보세요.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세보기 모달 */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              신청서 상세보기
            </DialogTitle>
            <DialogDescription>
              커뮤니티 회원 신청서의 상세 정보를 확인하고 승인 여부를 결정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>신청자 유형</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{getTypeLabel(selectedApplication.applicant_type)}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label>신청 상태</Label>
                    <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                  </div>
                  <div>
                    <Label>단체/회사명</Label>
                    <p className="mt-1 text-sm">{selectedApplication.organization_name}</p>
                  </div>
                  <div>
                    <Label>담당자명</Label>
                    <p className="mt-1 text-sm">{selectedApplication.contact_person}</p>
                  </div>
                  <div>
                    <Label>이메일</Label>
                    <p className="mt-1 text-sm">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <Label>연락처</Label>
                    <p className="mt-1 text-sm">{selectedApplication.phone}</p>
                  </div>
                  {selectedApplication.business_number && (
                    <div>
                      <Label>사업자등록번호</Label>
                      <p className="mt-1 text-sm">{selectedApplication.business_number}</p>
                    </div>
                  )}
                  {selectedApplication.address && (
                    <div>
                      <Label>주소</Label>
                      <p className="mt-1 text-sm">{selectedApplication.address}</p>
                    </div>
                  )}
                  {selectedApplication.service_area && (
                    <div>
                      <Label>서비스 지역</Label>
                      <p className="mt-1 text-sm">{selectedApplication.service_area}</p>
                    </div>
                  )}
                  {selectedApplication.website && (
                    <div>
                      <Label>웹사이트</Label>
                      <p className="mt-1 text-sm">
                        <a href={selectedApplication.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedApplication.website}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 상세 설명 */}
              <div>
                <Label>상세 소개 및 신청 사유</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedApplication.description}</p>
                </div>
              </div>

              {/* 첨부파일 */}
              <div>
                <Label>첨부파일</Label>
                <div className="mt-1 space-y-2">
                  {(selectedApplication.attachments || []).length > 0 ? (
                    (selectedApplication.attachments || []).map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm">{file.filename}</span>
                          <span className="text-xs text-gray-400 ml-2">({(file.size / 1024).toFixed(1)}KB)</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={async () => {
                            try {
                              await communityApplicationService.downloadAttachment(selectedApplication.id, file.filename);
                            } catch (error) {
                              alert('파일 다운로드에 실패했습니다. 백엔드 API가 구현되지 않았거나 파일이 존재하지 않습니다.');
                              console.error('다운로드 에러:', error);
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                      첨부된 파일이 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* 검토 정보 */}
              {(selectedApplication.reviewed_at || selectedApplication.rejection_reason) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">검토 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApplication.reviewed_at && (
                      <div>
                        <Label>검토일시</Label>
                        <p className="mt-1 text-sm">{formatDate(selectedApplication.reviewed_at)}</p>
                      </div>
                    )}
                    {selectedApplication.reviewed_by && (
                      <div>
                        <Label>검토자</Label>
                        <p className="mt-1 text-sm">{selectedApplication.reviewed_by}</p>
                      </div>
                    )}
                  </div>
                  {selectedApplication.rejection_reason && (
                    <div className="mt-4">
                      <Label>반려 사유</Label>
                      <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{selectedApplication.rejection_reason}</p>
                      </div>
                    </div>
                  )}
                  {selectedApplication.notes && (
                    <div className="mt-4">
                      <Label>검토 메모</Label>
                      <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">{selectedApplication.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 액션 버튼 */}
              {selectedApplication.status === 'pending' && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowRejectModal(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    반려
                  </Button>
                  <Button
                    onClick={() => {
                      handleApprove(selectedApplication.id);
                      setShowDetailsModal(false);
                    }}
                    disabled={processingId === selectedApplication.id || loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    승인
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 반려 모달 */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              신청 반려
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                신청을 반려하시려는 이유를 명확히 작성해주세요. 
                신청자에게 이메일로 반려 사유가 전달됩니다.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="rejectionReason">반려 사유 *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="반려 사유를 자세히 입력해주세요..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
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
                <XCircle className="w-4 h-4 mr-1" />
                반려 처리
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityApplicationManagement;