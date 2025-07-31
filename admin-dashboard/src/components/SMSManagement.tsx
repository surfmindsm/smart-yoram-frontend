import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MessageSquare, Send } from 'lucide-react';

interface Member {
  id: number;
  name: string;
  phone_number: string;
  position: string | null;
  district: string | null;
}

interface SMSHistory {
  id: number;
  recipient_phone: string;
  recipient_member_id: number | null;
  message: string;
  sms_type: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

interface SMSTemplate {
  id: number;
  name: string;
  message: string;
}

const SMSManagement: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [smsType, setSmsType] = useState('general');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [smsHistory, setSmsHistory] = useState<SMSHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');

  useEffect(() => {
    fetchMembers();
    fetchTemplates();
    if (activeTab === 'history') {
      fetchSMSHistory();
    }
  }, [activeTab]);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members/?member_status=active');
      setMembers(response.data);
    } catch (error) {
      console.error('교인 목록 조회 실패:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/sms/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('SMS 템플릿 조회 실패:', error);
    }
  };

  const fetchSMSHistory = async () => {
    try {
      const response = await api.get('/sms/history?limit=50');
      setSmsHistory(response.data);
    } catch (error) {
      console.error('SMS 발송 기록 조회 실패:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(m => m.id));
    }
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleTemplateSelect = (template: SMSTemplate) => {
    setMessage(template.message);
  };

  const handleSendSMS = async () => {
    if (selectedMembers.length === 0) {
      alert('발송할 교인을 선택해주세요.');
      return;
    }

    if (!message.trim()) {
      alert('메시지를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/sms/send-bulk', {
        recipient_member_ids: selectedMembers,
        message: message,
        sms_type: smsType
      });

      alert(`${response.data.length}명에게 SMS를 발송했습니다.`);
      setSelectedMembers([]);
      setMessage('');
      
      // Refresh history if on history tab
      if (activeTab === 'history') {
        fetchSMSHistory();
      }
    } catch (error) {
      console.error('SMS 발송 실패:', error);
      alert('SMS 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent': return 'success' as const;
      case 'failed': return 'destructive' as const;
      case 'pending': return 'warning' as const;
      default: return 'secondary' as const;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return '발송완료';
      case 'failed': return '발송실패';
      case 'pending': return '발송대기';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">SMS 관리</h2>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'send' | 'history')}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            SMS 발송
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            발송 기록
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member Selection */}
            <Card className="border-muted">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    교인 선택 ({selectedMembers.length}/{members.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedMembers.length === members.length ? '전체 해제' : '전체 선택'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto border border-border rounded-md">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center p-3 border-b border-border hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => handleMemberToggle(member.id)}
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.phone_number}</p>
                          </div>
                          <div className="text-right">
                            {member.position && (
                              <p className="text-xs text-muted-foreground">{member.position}</p>
                            )}
                            {member.district && (
                              <p className="text-xs text-muted-foreground">{member.district}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message Composition */}
            <Card className="border-muted">
              <CardHeader>
                <CardTitle className="text-lg">메시지 작성</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Templates */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">템플릿 선택</label>
                  <Select
                    onValueChange={(value) => {
                      const template = templates.find(t => t.id === parseInt(value));
                      if (template) handleTemplateSelect(template);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="직접 작성" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">직접 작성</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">메시지 유형</label>
                  <Select value={smsType} onValueChange={setSmsType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">일반</SelectItem>
                      <SelectItem value="invitation">초대</SelectItem>
                      <SelectItem value="notice">공지</SelectItem>
                      <SelectItem value="emergency">긴급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message Text */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    메시지 내용 ({message.length}/1000자)
                  </label>
                  <Textarea
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="발송할 메시지를 입력하세요..."
                    maxLength={1000}
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendSMS}
                  disabled={loading || selectedMembers.length === 0 || !message.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      발송 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {selectedMembers.length}명에게 SMS 발송
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-muted overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">발송 기록</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        발송일시
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        수신자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        메시지
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        유형
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {smsHistory.map((sms) => (
                      <tr key={sms.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {new Date(sms.created_at).toLocaleString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {sms.recipient_phone}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">
                          {sms.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {sms.sms_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(sms.status)}>
                            {getStatusText(sms.status)}
                          </Badge>
                          {sms.error_message && (
                            <p className="text-xs text-destructive mt-1">{sms.error_message}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {smsHistory.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">발송 기록이 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SMSManagement;