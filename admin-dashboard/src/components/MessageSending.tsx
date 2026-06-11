import React, { useState, useEffect } from 'react';
import { Send, Search, RotateCcw } from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  toast,
  Badge,
  PageContainer,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  LoadingState,
} from "./ui";
import { supabaseApiService } from '../services/supabaseApiService';
import { formatDateTime as formatDateTimeUtil } from '../utils/dateUtils';
import { usePageSubtitle } from '../hooks/usePageSubtitle';
import { cn } from '../lib/utils';

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

  // 상단바 부제
  usePageSubtitle(
    activeTab === 'send'
      ? `${selectedMembers.length}명 선택 · 전체 ${members.length}명`
      : `전체 ${messageHistory.length}건`
  );

  return (
    <PageContainer>
      {/* 탭 — 헌금/조직/심방 화면과 동일한 언더라인 스타일 */}
      <div className="mb-4 inline-flex items-center gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('send')}
          className={cn(
            'relative px-4 py-2.5 text-[13px] font-semibold transition-colors',
            activeTab === 'send'
              ? 'text-foreground after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          메시지 보내기
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={cn(
            'relative px-4 py-2.5 text-[13px] font-semibold transition-colors',
            activeTab === 'history'
              ? 'text-foreground after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          전송 기록
        </button>
      </div>

      {activeTab === 'send' && (
        <div className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Member Selection */}
          <div className="space-y-4 lg:col-span-2">
            <Card className="overflow-hidden">
              {/* 헤더 */}
              <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F6] px-4 py-3">
                <div className="text-[14px] font-bold leading-tight text-foreground">발송 대상 선택</div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted-foreground">
                    {selectedMembers.length}명 선택
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isAllSelected ? handleDeselectAll : handleSelectAll}
                    className="h-8 gap-1.5 text-[12px]"
                  >
                    {isAllSelected ? '전체 해제' : '전체 선택'}
                  </Button>
                </div>
              </div>

              {/* 필터 */}
              <div className="space-y-3 border-b border-[#EEF1F6] px-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <Input
                    placeholder="이름 또는 전화번호 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-semibold text-muted-foreground">직분 (대분류)</Label>
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

                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-semibold text-muted-foreground">직분 (세부)</Label>
                    <Select
                      value={selectedPositionDetail}
                      onValueChange={setSelectedPositionDetail}
                      disabled={selectedPosition === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedPosition === 'all' ? '대분류 먼저 선택' : '직분 세부'} />
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

                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-semibold text-muted-foreground">부서</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="부서 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-semibold text-muted-foreground">조직</Label>
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

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-8 gap-1.5 text-[12px] text-muted-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    필터 초기화
                  </Button>
                </div>
              </div>

              {/* 교인 목록 */}
              <div className="max-h-[500px] overflow-auto">
                {filteredMembers.length === 0 ? (
                  <div className="py-10 text-center text-[13px] text-muted-foreground">
                    교인 목록이 없습니다.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-[#F8FAFD]">
                      <tr className="border-b border-[#EEF1F6]">
                        <th className="w-[44px] px-3 py-2.5 text-left">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={isAllSelected ? handleDeselectAll : handleSelectAll}
                          />
                        </th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">이름</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">직분</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">부서</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">조직</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">전화번호</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F4F9] bg-card">
                      {filteredMembers.map((member) => {
                        const isSelected = selectedMembers.includes(member.id);
                        return (
                          <tr
                            key={member.id}
                            className={cn(
                              'cursor-pointer transition-colors',
                              isSelected ? 'bg-[#EEF3FC] hover:bg-[#E0EAFA]' : 'hover:bg-[#F8FAFD]'
                            )}
                            onClick={() => handleMemberSelect(member.id)}
                          >
                            <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                id={`member-${member.id}`}
                                checked={isSelected}
                                onCheckedChange={() => handleMemberSelect(member.id)}
                              />
                            </td>
                            <td className="px-3 py-2.5 text-[13px] font-semibold text-foreground">
                              {member.name}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-foreground">
                              {member.position_main ? (
                                <>
                                  <div>
                                    {POSITION_MAIN_OPTIONS.find(p => p.value === member.position_main)?.label || member.position_main}
                                  </div>
                                  {member.position_detail && (
                                    <div className="text-[11.5px] text-[#94A3B8]">
                                      {POSITION_DETAIL_LABELS[member.position_detail] || member.position_detail}
                                    </div>
                                  )}
                                </>
                              ) : <span className="text-[#CBD5E1]">-</span>}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-foreground">
                              {member.department || <span className="text-[#CBD5E1]">-</span>}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-foreground">
                              {member.organization_name || <span className="text-[#CBD5E1]">-</span>}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-foreground tabular-nums">
                              {member.phone}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 푸터 */}
              <div className="border-t border-[#EEF1F6] bg-[#F8FAFD] px-4 py-2 text-[12px] text-muted-foreground">
                전체 {members.length}명 중 {filteredMembers.length}명 표시
              </div>
            </Card>
          </div>

        {/* Right: Message Content */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-[#EEF1F6] px-4 py-3 text-[14px] font-bold leading-tight text-foreground">
              메시지 내용
            </div>
            <div className="space-y-4 px-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-[12.5px] font-semibold">
                  제목 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="메시지 제목"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="body" className="text-[12.5px] font-semibold">
                  내용 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="메시지 내용을 입력하세요"
                  rows={10}
                />
              </div>

              <div className="border-t border-[#EEF1F6] pt-3">
                <Button
                  onClick={handleSendNotification}
                  disabled={isLoading || selectedMembers.length === 0}
                  size="lg"
                  className="w-full gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isLoading ? '발송 중...' : `${selectedMembers.length}명에게 발송`}
                </Button>
              </div>
            </div>
          </Card>
        </div>
        </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="mt-0">
          <Card className="overflow-hidden">
            {historyLoading ? (
              <LoadingState text="전송 기록을 불러오는 중..." />
            ) : messageHistory.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-muted-foreground">
                전송 기록이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[160px]" />
                    <col className="w-[120px]" />
                    <col className="w-[200px]" />
                    <col />
                    <col className="w-[140px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">발송 일시</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">발송자</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">제목</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">내용</th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">수신자</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F4F9] bg-card">
                    {messageHistory.map((history) => (
                      <tr
                        key={history.id}
                        className="cursor-pointer transition-colors hover:bg-[#F8FAFD]"
                        onClick={() => setSelectedHistoryDetail(history)}
                      >
                        <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                          {formatDateTimeUtil(history.sent_at)}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-foreground truncate">
                          {history.sender_name}
                        </td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-foreground truncate" title={history.title}>
                          {history.title}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-foreground truncate" title={history.content}>
                          {history.content}
                        </td>
                        <td className="px-4 py-3 text-right text-[13px] text-foreground tabular-nums">
                          {history.recipient_count}명
                          <span className="ml-1 text-[11px] text-[#94A3B8]">(앱 {history.app_user_count})</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Message History Detail Dialog */}
      <Dialog open={!!selectedHistoryDetail} onOpenChange={() => setSelectedHistoryDetail(null)}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          {selectedHistoryDetail && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedHistoryDetail.title}</DialogTitle>
                <div className="mt-1 text-[12px] text-muted-foreground tabular-nums">
                  {formatDateTimeUtil(selectedHistoryDetail.sent_at)}
                </div>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* 발송 정보 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-[8px] bg-[#F8FAFD] px-3 py-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">발송자</div>
                    <div className="mt-1 text-[13px] font-semibold text-foreground">{selectedHistoryDetail.sender_name}</div>
                  </div>
                  <div className="rounded-[8px] bg-[#F8FAFD] px-3 py-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">선택된 교인</div>
                    <div className="mt-1 text-[13px] font-semibold text-foreground tabular-nums">{selectedHistoryDetail.recipient_count}명</div>
                  </div>
                  <div className="rounded-[8px] bg-[#F8FAFD] px-3 py-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">앱 사용자</div>
                    <div className="mt-1 text-[13px] font-semibold text-foreground tabular-nums">{selectedHistoryDetail.app_user_count}명</div>
                  </div>
                </div>

                {/* 메시지 내용 */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">메시지 내용</div>
                  <div className="rounded-[8px] border border-border bg-[#FAFBFD] px-3 py-2.5">
                    <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                      {selectedHistoryDetail.content}
                    </div>
                  </div>
                </div>

                {/* 받는 사용자 */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">
                    받는 사용자 ({selectedHistoryDetail.recipient_member_ids.length}명)
                  </div>
                  <div className="max-h-60 overflow-y-auto rounded-[8px] border border-border bg-[#FAFBFD] px-3 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedHistoryDetail.recipient_member_ids.map((memberId) => {
                        const member = members.find((m) => m.id === memberId);
                        return (
                          <Badge key={memberId} variant="secondary" className="text-[11px]">
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
