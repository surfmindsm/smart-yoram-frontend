import React, { useState, useEffect } from 'react';
import { Send, Search, CheckSquare, Square, RotateCcw, Clock } from 'lucide-react';
import { Button } from "./ui";
import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { Input } from "./ui";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Checkbox } from "./ui";
import { toast } from "./ui";
import { Badge } from "./ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui";
import { supabaseApiService } from '../services/supabaseApiService';

interface Member {
  id: number;
  name: string;
  phone: string;
  position_main?: string;
  position_detail?: string;
  district?: string;
  sub_district?: string;
  department?: string;
  organization_id?: string;
  organization_name?: string;
}

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  description?: string;
}

interface MessageHistory {
  id: string;
  church_id: number;
  sender_id: number;
  sender_name: string;
  title: string;
  content: string;
  recipient_member_ids: number[];
  recipient_count: number;
  app_user_count: number;
  devices_sent: number;
  devices_failed: number;
  sent_at: string;
  created_at: string;
}

const POSITION_MAIN_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'CLERGY', label: '교역자' },
  { value: 'ELDER', label: '장로' },
  { value: 'DEACONESS', label: '권사' },
  { value: 'DEACON', label: '집사' },
  { value: 'MEMBER', label: '성도' },
];

// Position detail 한글 매핑
const POSITION_DETAIL_LABELS: { [key: string]: string } = {
  // 교역자
  'SENIOR_PASTOR': '담임목사',
  'ASSOCIATE_PASTOR': '부목사',
  'ASSISTANT_PASTOR': '전도사',
  'PASTOR': '목사',
  'EDUCATION_PASTOR': '교육전도사',
  'WORSHIP_PASTOR': '찬양사역자',

  // 장로
  'EMERITUS_ELDER': '원로장로',
  'ACTIVE_ELDER': '시무장로',

  // 권사
  'HONORARY_DEACONESS': '명예권사',
  'ACTIVE_DEACONESS': '시무권사',

  // 집사
  'ORDAINED_DEACON': '안수집사',
  'EXHORTER': '권찰',
  'DISTRICT_LEADER': '구역장',

  // 기타
  'TEACHER': '교사',
  'DIRECTOR': '부장',
  'PRESIDENT': '회장',
};

// 직분 대분류별 세부 직분 매핑
const POSITION_DETAIL_BY_MAIN: { [key: string]: string[] } = {
  'CLERGY': ['SENIOR_PASTOR', 'ASSOCIATE_PASTOR', 'ASSISTANT_PASTOR', 'PASTOR', 'EDUCATION_PASTOR', 'WORSHIP_PASTOR'],
  'ELDER': ['EMERITUS_ELDER', 'ACTIVE_ELDER'],
  'DEACONESS': ['HONORARY_DEACONESS', 'ACTIVE_DEACONESS'],
  'DEACON': ['ORDAINED_DEACON', 'EXHORTER', 'DISTRICT_LEADER'],
  'MEMBER': ['TEACHER', 'DIRECTOR', 'PRESIDENT'],
};

export default function MessageSending() {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [positionDetails, setPositionDetails] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<MessageHistory | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedPositionDetail, setSelectedPositionDetail] = useState<string>('all');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // 직분 대분류에 따른 세부 직분 필터링
  const availablePositionDetails = selectedPosition === 'all'
    ? positionDetails
    : positionDetails.filter(detail =>
        POSITION_DETAIL_BY_MAIN[selectedPosition]?.includes(detail)
      );

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'announcement',
  });

  useEffect(() => {
    fetchMembers();
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMessageHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    let filtered = members;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm)
      );
    }

    // Position main filter
    if (selectedPosition && selectedPosition !== 'all') {
      filtered = filtered.filter(m => m.position_main === selectedPosition);
    }

    // Position detail filter
    if (selectedPositionDetail && selectedPositionDetail !== 'all') {
      filtered = filtered.filter(m => m.position_detail === selectedPositionDetail);
    }

    // Department filter
    if (selectedDepartment && selectedDepartment !== 'all') {
      filtered = filtered.filter(m => m.department === selectedDepartment);
    }

    // Organization filter
    if (selectedOrganization && selectedOrganization !== 'all') {
      filtered = filtered.filter(m => m.organization_id === selectedOrganization);
    }

    setFilteredMembers(filtered);
  }, [searchTerm, selectedPosition, selectedPositionDetail, selectedDepartment, selectedOrganization, members]);

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
        if (user?.church_id) return user.church_id;
      }

      return 6;
    } catch (error) {
      console.error('Church ID 가져오기 실패:', error);
      return 6;
    }
  };

  const getUserId = () => {
    try {
      const sessionStr = localStorage.getItem('supabase_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const userId = session?.user?.id;
        if (userId) return userId;
      }

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.id) return user.id;
      }

      return null;
    } catch (error) {
      console.error('User ID 가져오기 실패:', error);
      return null;
    }
  };

  const fetchMembers = async () => {
    try {
      const churchId = getChurchId();
      const { data, error } = await supabaseApiService.supabase
        .from('members')
        .select(`
          id,
          name,
          phone,
          position_main,
          position_detail,
          district,
          sub_district,
          department,
          organization_id,
          church_organizations(name)
        `)
        .eq('church_id', churchId)
        .order('name');

      if (error) throw error;

      // Map the data to include organization_name
      const membersWithOrgs = data?.map(member => ({
        ...member,
        organization_name: (member.church_organizations as any)?.name || null
      })) || [];

      setMembers(membersWithOrgs);

      // Extract unique position details
      const detailList = data?.map(m => m.position_detail).filter(Boolean) as string[];
      const uniqueDetails = Array.from(new Set(detailList));
      setPositionDetails(uniqueDetails);

      // Extract unique departments
      const deptList = data?.map(m => m.department).filter(Boolean) as string[];
      const uniqueDepts = Array.from(new Set(deptList));
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast({
        title: '오류',
        description: '교인 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const fetchOrganizations = async () => {
    try {
      const churchId = getChurchId();
      const { data, error } = await supabaseApiService.supabase
        .from('church_organizations')
        .select('id, name, organization_type, description')
        .eq('church_id', churchId)
        .order('organization_type, name');

      if (error) throw error;

      // Sort by type and name
      const sorted = (data || []).sort((a, b) => {
        if (a.organization_type !== b.organization_type) {
          return a.organization_type.localeCompare(b.organization_type);
        }
        return a.name.localeCompare(b.name);
      });

      setOrganizations(sorted);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const fetchMessageHistory = async () => {
    try {
      setHistoryLoading(true);
      const churchId = getChurchId();

      const { data, error } = await supabaseApiService.supabase
        .from('message_send_history')
        .select('*')
        .eq('church_id', churchId)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setMessageHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch message history:', error);
      toast({
        title: '오류',
        description: '전송 기록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const getOrganizationLabel = (org: Organization) => {
    const typeLabels: { [key: string]: string } = {
      'district': '구역',
      'sub_district': '소구역',
      'cell_group': '셀그룹',
      'ministry_team': '사역팀',
      'custom': '기타'
    };

    const typeLabel = typeLabels[org.organization_type] || org.organization_type;

    return `${org.name} [${typeLabel}]`;
  };

  const handleSendNotification = async () => {
    if (!formData.title || !formData.body) {
      toast({
        title: '오류',
        description: '제목과 내용을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        title: '오류',
        description: '발송 대상을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const churchId = getChurchId();
      const userId = getUserId();

      console.log('📨 메시지 발송 시작:', {
        churchId,
        memberCount: selectedMembers.length,
        title: formData.title,
        userId,
      });

      // Edge Function 호출
      const { data, error } = await supabaseApiService.supabase.functions.invoke(
        'send-custom-notification',
        {
          body: {
            church_id: churchId,
            member_ids: selectedMembers,
            title: formData.title,
            content: formData.body,
            sender_user_id: userId,
          },
        }
      );

      console.log('Edge Function 응답:', { data, error });

      if (error) {
        throw error;
      }

      if (data && data.success) {
        const stats = data.stats || {};
        let description = data.message || '알림 발송 완료';

        if (stats.totalMembers) {
          description = `선택: ${stats.totalMembers}명, 앱 사용자: ${stats.appUsers}명, 발송 성공: ${stats.devicesSent}/${stats.appUsers}개 디바이스`;
        }

        toast({
          title: '✅ 발송 완료',
          description,
        });

        // Reset form
        setFormData({
          title: '',
          body: '',
          type: 'announcement',
        });
        setSelectedMembers([]);

        // 발송 기록 새로고침
        if (activeTab === 'history') {
          fetchMessageHistory();
        }
      } else {
        throw new Error(data?.error || '알림 발송에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ 메시지 발송 오류:', error);
      toast({
        title: '오류',
        description: error.message || '푸시 알림 발송에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberSelect = (memberId: number) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleSelectAll = () => {
    const allIds = filteredMembers.map(m => m.id);
    setSelectedMembers(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedMembers([]);
  };

  const isAllSelected = filteredMembers.length > 0 &&
    filteredMembers.every(m => selectedMembers.includes(m.id));

  // 직분 대분류 변경 시 세부 직분 리셋
  const handlePositionChange = (value: string) => {
    setSelectedPosition(value);
    setSelectedPositionDetail('all');
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedPosition('all');
    setSelectedPositionDetail('all');
    setSelectedOrganization('all');
    setSelectedDepartment('all');
  };

  return (
    <PageContainer>
      <PageHeader
        title="메시지 보내기"
        description="교인들에게 푸시 알림 메시지를 발송합니다."
      />

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('send')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'send'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Send className="inline-block w-4 h-4 mr-2" />
            메시지 보내기
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Clock className="inline-block w-4 h-4 mr-2" />
            메시지 전송 기록
          </button>
        </div>
      </div>

      {/* Message Send Tab */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Member Selection */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>발송 대상 선택</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isAllSelected ? handleDeselectAll : handleSelectAll}
                  >
                    {isAllSelected ? (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        전체 해제
                      </>
                    ) : (
                      <>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        전체 선택
                      </>
                    )}
                  </Button>
                  <span className="text-sm text-slate-600">
                    {selectedMembers.length}명 선택됨
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="이름 또는 전화번호 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Position Filters */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-600 mb-1">직분 (대분류)</Label>
                    <Select value={selectedPosition} onValueChange={handlePositionChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="직분 대분류" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITION_MAIN_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-600 mb-1">직분 (세부)</Label>
                    <Select
                      value={selectedPositionDetail}
                      onValueChange={setSelectedPositionDetail}
                      disabled={selectedPosition === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedPosition === 'all' ? '대분류를 먼저 선택하세요' : '직분 세부'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {availablePositionDetails.map(detail => (
                          <SelectItem key={detail} value={detail}>
                            {POSITION_DETAIL_LABELS[detail] || detail}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Department and Organization Filters */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-600 mb-1">부서</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="부서 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-600 mb-1">조직</Label>
                    <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                      <SelectTrigger>
                        <SelectValue placeholder="조직 선택" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        <SelectItem value="all">전체</SelectItem>
                        {organizations.map(org => (
                          <SelectItem key={org.id} value={org.id}>
                            {getOrganizationLabel(org)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-slate-600"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    필터 초기화
                  </Button>
                </div>
              </div>

              {/* Member List - Table Format */}
              <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    교인 목록이 없습니다
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="text-xs text-slate-600 border-b">
                        <th className="p-2 text-left w-10">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={isAllSelected ? handleDeselectAll : handleSelectAll}
                          />
                        </th>
                        <th className="p-2 text-left">이름</th>
                        <th className="p-2 text-left">직분</th>
                        <th className="p-2 text-left">부서</th>
                        <th className="p-2 text-left">조직</th>
                        <th className="p-2 text-left">전화번호</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredMembers.map((member) => (
                        <tr
                          key={member.id}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => handleMemberSelect(member.id)}
                        >
                          <td className="p-2" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              id={`member-${member.id}`}
                              checked={selectedMembers.includes(member.id)}
                              onCheckedChange={() => handleMemberSelect(member.id)}
                            />
                          </td>
                          <td className="p-2">
                            <span className="font-medium text-slate-900">{member.name}</span>
                          </td>
                          <td className="p-2 text-sm text-slate-600">
                            {member.position_main && (
                              <div>
                                {POSITION_MAIN_OPTIONS.find(p => p.value === member.position_main)?.label || member.position_main}
                              </div>
                            )}
                            {member.position_detail && (
                              <div className="text-xs text-slate-500">
                                {POSITION_DETAIL_LABELS[member.position_detail] || member.position_detail}
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-sm text-slate-600">
                            {member.department || '-'}
                          </td>
                          <td className="p-2 text-sm text-slate-600">
                            {member.organization_name || '-'}
                          </td>
                          <td className="p-2 text-xs text-slate-500">
                            {member.phone}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="text-sm text-slate-600">
                전체 {members.length}명 중 {filteredMembers.length}명 표시
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Message Content */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>메시지 내용</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="메시지 제목"
                />
              </div>

              <div>
                <Label htmlFor="body">내용</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="메시지 내용을 입력하세요"
                  rows={10}
                />
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleSendNotification}
                  disabled={isLoading || selectedMembers.length === 0}
                  size="lg"
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isLoading ? '발송 중...' : `${selectedMembers.length}명에게 메시지 발송`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Message History Tab */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>메시지 전송 기록</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-slate-600">로딩 중...</div>
              </div>
            ) : messageHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                전송 기록이 없습니다.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">발송 일시</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">발송자</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 w-1/5">제목</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 w-1/4">내용</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">받는 사용자</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {messageHistory.map((history) => (
                      <tr
                        key={history.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedHistoryDetail(history)}
                      >
                        <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                          {new Date(history.sent_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {history.sender_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                          <div className="line-clamp-2">{history.title}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <div className="line-clamp-2">{history.content}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <div className="flex flex-col gap-1">
                            <span>선택: {history.recipient_count}명</span>
                            <span className="text-xs text-slate-500">앱: {history.app_user_count}명</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Message History Detail Dialog */}
      <Dialog open={!!selectedHistoryDetail} onOpenChange={() => setSelectedHistoryDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedHistoryDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedHistoryDetail.title}
                </DialogTitle>
                <DialogDescription className="mt-2">
                  {new Date(selectedHistoryDetail.sent_at).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* 발송 정보 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-sm text-slate-600 mb-1">발송자</div>
                    <div className="font-medium text-slate-900">{selectedHistoryDetail.sender_name}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-sm text-slate-600 mb-1">선택된 교인</div>
                    <div className="font-medium text-slate-900">{selectedHistoryDetail.recipient_count}명</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-sm text-slate-600 mb-1">앱 사용자</div>
                    <div className="font-medium text-slate-900">{selectedHistoryDetail.app_user_count}명</div>
                  </div>
                </div>

                {/* 메시지 내용 */}
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-2">메시지 내용</div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedHistoryDetail.content}
                    </div>
                  </div>
                </div>

                {/* 받는 사용자 목록 */}
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-2">
                    받는 사용자 목록 ({selectedHistoryDetail.recipient_member_ids.length}명)
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {selectedHistoryDetail.recipient_member_ids.map((memberId) => {
                        const member = members.find((m) => m.id === memberId);
                        return (
                          <Badge key={memberId} variant="secondary" className="text-xs">
                            {member ? `${member.name} (${member.phone})` : `ID: ${memberId}`}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
