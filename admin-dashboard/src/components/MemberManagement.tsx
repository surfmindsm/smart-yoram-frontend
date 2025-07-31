import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Grid3X3, 
  LayoutGrid, 
  Camera,
  QrCode,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Trash2,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';
import { Textarea } from './ui/textarea';

interface Member {
  id: number;
  name: string;
  email: string;
  gender: string;
  birthdate: string | null;  // Changed from date_of_birth
  phone: string;  // Changed from phone_number
  address: string | null;
  position: string | null;
  district: string | null;
  church_id: number;
  profile_photo_url: string | null;
  member_status: string;
  registration_date: string | null;
}

const MemberManagement: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // View and pagination states
  const [viewType, setViewType] = useState<'card' | 'grid'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<keyof Member | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInfo, setPasswordInfo] = useState<{member_id: number, member_name: string, email: string, password: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    gender: '남',
    birthdate: '',
    phone: '',
    address: '',
    position: '',
    district: ''
  });

  useEffect(() => {
    fetchMembers();
  }, [appliedSearchTerm, statusFilter, currentPage, pageSize, sortField, sortOrder]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (appliedSearchTerm) params.append('search', appliedSearchTerm);
      if (statusFilter !== 'all') params.append('member_status', statusFilter);
      params.append('skip', ((currentPage - 1) * pageSize).toString());
      params.append('limit', pageSize.toString());
      
      const response = await api.get(`/members/?${params.toString()}`);
      
      // Sort data on client side for now
      let sortedData = [...response.data];
      if (sortField) {
        sortedData.sort((a, b) => {
          const aVal = a[sortField] || '';
          const bVal = b[sortField] || '';
          if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
      }
      
      setMembers(sortedData);
      // For now, estimate total count based on returned data
      // In production, API should return total count
      setTotalCount(response.data.length < pageSize ? 
        (currentPage - 1) * pageSize + response.data.length : 
        currentPage * pageSize + 1
      );
    } catch (error) {
      console.error('교인 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on new search
    setAppliedSearchTerm(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Don't send church_id - backend will use current user's church_id
      console.log('Sending member data:', newMember);
      const response = await api.post('/members/', newMember);
      setMembers([...members, response.data]);
      setShowAddModal(false);
      setNewMember({
        name: '',
        email: '',
        gender: '남',
        birthdate: '',
        phone: '',
        address: '',
        position: '',
        district: ''
      });
    } catch (error) {
      console.error('교인 추가 실패:', error);
      alert('교인 추가에 실패했습니다.');
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!selectedMember) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/members/${selectedMember.id}/upload-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update member in list
      setMembers(members.map(m => 
        m.id === selectedMember.id 
          ? { ...m, profile_photo_url: response.data.profile_photo_url }
          : m
      ));
      
      setShowPhotoModal(false);
      alert('프로필 사진이 업로드되었습니다.');
    } catch (error: any) {
      console.error('사진 업로드 실패:', error);
      const errorMessage = error.response?.data?.detail || '사진 업로드에 실패했습니다.';
      alert(`사진 업로드 실패: ${errorMessage}`);
    }
  };

  const handleDeletePhoto = async (memberId: number) => {
    try {
      await api.delete(`/members/${memberId}/delete-photo`);
      setMembers(members.map(m => 
        m.id === memberId 
          ? { ...m, profile_photo_url: null }
          : m
      ));
      alert('프로필 사진이 삭제되었습니다.');
    } catch (error) {
      console.error('사진 삭제 실패:', error);
      alert('사진 삭제에 실패했습니다.');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success' as const;
      case 'inactive': return 'warning' as const;
      case 'transferred': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  const handleGetPassword = async (memberId: number) => {
    try {
      const response = await api.get(`/members/${memberId}/password`);
      setPasswordInfo(response.data);
      setShowPasswordModal(true);
      setShowPassword(false); // Reset to hidden state
    } catch (error: any) {
      console.error('비밀번호 조회 실패:', error);
      if (error.response?.status === 404) {
        alert('이 교인은 아직 계정이 생성되지 않았습니다.');
      } else {
        alert('비밀번호 조회에 실패했습니다.');
      }
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활동';
      case 'inactive': return '비활동';
      case 'transferred': return '이전';
      default: return status;
    }
  };

  // Clean photo URL - handle both relative and absolute URLs
  const cleanPhotoUrl = (url: string | null) => {
    if (!url) return null;
    // Remove trailing '?' if present
    const cleanedUrl = url.endsWith('?') ? url.slice(0, -1) : url;
    
    // If it's already a full URL (starts with http:// or https://), return as-is
    if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
      return cleanedUrl;
    }
    
    // Otherwise, prepend the API base URL
    return `${process.env.REACT_APP_API_URL}${cleanedUrl}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">교인 관리</h2>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          교인 추가
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="border-muted">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">검색</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="이름 또는 전화번호 (초성 검색 가능: ㄱㅊㅅ)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  검색
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">상태</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">활동</SelectItem>
                  <SelectItem value="inactive">비활동</SelectItem>
                  <SelectItem value="transferred">이전</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchMembers}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </Button>
            </div>
          </div>
          
          {/* View Options */}
          <div className="flex justify-between items-center border-t border-border pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">보기 형태:</label>
                <Button
                  variant={viewType === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewType('card')}
                  className="flex items-center gap-1"
                >
                  <LayoutGrid className="w-4 h-4" />
                  카드
                </Button>
                <Button
                  variant={viewType === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewType('grid')}
                  className="flex items-center gap-1"
                >
                  <Grid3X3 className="w-4 h-4" />
                  그리드
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">페이지당:</label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10개</SelectItem>
                    <SelectItem value="20">20개</SelectItem>
                    <SelectItem value="30">30개</SelectItem>
                    <SelectItem value="40">40개</SelectItem>
                    <SelectItem value="50">50개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              전체 {totalCount}명 중 {Math.min((currentPage - 1) * pageSize + 1, totalCount)}-{Math.min(currentPage * pageSize, totalCount)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Display */}
      {viewType === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card key={member.id} className="border-muted overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {cleanPhotoUrl(member.profile_photo_url) ? (
                      <>
                        <img
                          src={cleanPhotoUrl(member.profile_photo_url)!}
                          alt={member.name}
                          className="h-16 w-16 rounded-full object-cover"
                          onLoad={(e) => {
                            console.log('Image loaded:', member.name);
                          }}
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            console.error('Image load error:', {
                              src: target.src,
                              error: e,
                              member: member.name
                            });
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.classList.remove('hidden');
                            }
                          }}
                        />
                        <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center hidden">
                          <span className="text-gray-600 font-medium">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-500">{member.phone}</p>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(member.member_status)}>
                        {getStatusText(member.member_status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {member.position && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">직분:</span> {member.position}
                    </p>
                  )}
                  {member.district && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">구역:</span> {member.district}
                    </p>
                  )}
                  {member.birthdate && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">생년월일:</span> {member.birthdate}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex space-x-2">
                  <Button
                    onClick={() => {
                      setSelectedMember(member);
                      setShowPhotoModal(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <Camera className="w-3 h-3 mr-1" />
                    사진
                  </Button>
                  <Button 
                    onClick={() => navigate('/qr-management')}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <QrCode className="w-3 h-3 mr-1" />
                    QR
                  </Button>
                  <Button 
                    onClick={() => handleGetPassword(member.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <Key className="w-3 h-3 mr-1" />
                    비밀번호
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-muted overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('name')}
                  >
                    <span className="flex items-center gap-1">
                      이름
                      {sortField === 'name' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('gender')}
                  >
                    <span className="flex items-center gap-1">
                      성별
                      {sortField === 'gender' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('phone')}
                  >
                    <span className="flex items-center gap-1">
                      전화번호
                      {sortField === 'phone' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('position')}
                  >
                    <span className="flex items-center gap-1">
                      직분
                      {sortField === 'position' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('district')}
                  >
                    <span className="flex items-center gap-1">
                      구역
                      {sortField === 'district' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('member_status')}
                  >
                    <span className="flex items-center gap-1">
                      상태
                      {sortField === 'member_status' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {cleanPhotoUrl(member.profile_photo_url) ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={cleanPhotoUrl(member.profile_photo_url)!}
                              alt={member.name}
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                  fallback.classList.remove('hidden');
                                }
                              }}
                            />
                          ) : null}
                          <div className={`h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center ${cleanPhotoUrl(member.profile_photo_url) ? 'hidden' : ''}`}>
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {member.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {member.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {member.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {member.district || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(member.member_status)}>
                        {getStatusText(member.member_status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowPhotoModal(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          사진
                        </Button>
                        <Button 
                          onClick={() => navigate('/qr-management')}
                          variant="ghost"
                          size="sm"
                        >
                          QR
                        </Button>
                        <Button 
                          onClick={() => handleGetPassword(member.id)}
                          variant="ghost"
                          size="sm"
                        >
                          비밀번호
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {members.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">등록된 교인이 없습니다.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </Button>
          
          {/* Page numbers */}
          {[...Array(Math.min(5, totalPages))].map((_, idx) => {
            let pageNum = idx + 1;
            if (totalPages > 5) {
              if (currentPage > 3) {
                pageNum = currentPage - 2 + idx;
                if (pageNum > totalPages) return null;
              }
            }
            return (
              <Button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
              >
                {pageNum}
              </Button>
            );
          })}
          
          <Button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 교인 등록</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">이름 *</label>
              <Input
                type="text"
                required
                value={newMember.name}
                onChange={(e) => setNewMember({...newMember, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">이메일 *</label>
              <Input
                type="email"
                required
                placeholder="example@email.com"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">이메일로 임시 비밀번호가 발송됩니다.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">성별</label>
              <Select value={newMember.gender} onValueChange={(value) => setNewMember({...newMember, gender: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="남">남</SelectItem>
                  <SelectItem value="여">여</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">생년월일</label>
              <Input
                type="date"
                value={newMember.birthdate}
                onChange={(e) => setNewMember({...newMember, birthdate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">전화번호 *</label>
              <Input
                type="tel"
                required
                placeholder="010-1234-5678"
                value={newMember.phone}
                onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">주소</label>
              <Input
                type="text"
                value={newMember.address}
                onChange={(e) => setNewMember({...newMember, address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">직분</label>
              <Input
                type="text"
                placeholder="집사, 권사, 장로 등"
                value={newMember.position}
                onChange={(e) => setNewMember({...newMember, position: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">구역</label>
              <Input
                type="text"
                placeholder="1구역, 2구역 등"
                value={newMember.district}
                onChange={(e) => setNewMember({...newMember, district: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                취소
              </Button>
              <Button type="submit">
                등록
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Management Modal */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedMember?.name}님 프로필 사진 관리
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMember && cleanPhotoUrl(selectedMember.profile_photo_url) && (
              <div className="text-center">
                <img
                  src={cleanPhotoUrl(selectedMember.profile_photo_url)!}
                  alt={selectedMember.name}
                  className="h-32 w-32 rounded-full object-cover mx-auto mb-2"
                  onError={(e) => {
                    console.error('Modal image load error:', e);
                    alert('사진을 불러올 수 없습니다.');
                  }}
                />
                <Button
                  onClick={() => selectedMember && handleDeletePhoto(selectedMember.id)}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  현재 사진 삭제
                </Button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                새 사진 업로드
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, GIF, WEBP 파일만 가능 (최대 5MB)
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setShowPhotoModal(false)}
                variant="outline"
              >
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password View Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {passwordInfo?.member_name}님 계정 정보
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {passwordInfo && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground">이메일</label>
                  <p className="mt-1 text-sm text-foreground">{passwordInfo.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">비밀번호</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordInfo.password}
                      readOnly
                      className="flex-1 bg-muted"
                    />
                    <Button
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      size="icon"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>주의:</strong> 이 비밀번호는 교인의 개인정보입니다. 반드시 필요한 경우에만 확인하고, 타인에게 공유하지 마세요.
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  if (passwordInfo) {
                    navigator.clipboard.writeText(passwordInfo.password);
                    alert('비밀번호가 클립보드에 복사되었습니다.');
                  }
                }}
                variant="secondary"
              >
                복사
              </Button>
              <Button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInfo(null);
                  setShowPassword(false);
                }}
                variant="outline"
              >
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberManagement;