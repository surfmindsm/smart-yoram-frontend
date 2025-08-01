import React, { useState, useEffect } from 'react';
import { Send, History, Users, User, Bell, Image, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { toast } from './ui/use-toast';
import { Badge } from './ui/badge';

interface Member {
  id: number;
  name: string;
  phone: string;
  department?: string;
}

interface NotificationHistory {
  id: number;
  type: string;
  title: string;
  body: string;
  target_type: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  sent_at: string;
  created_at: string;
}

const NOTIFICATION_TYPES = [
  { value: 'announcement', label: '공지사항' },
  { value: 'worship_reminder', label: '예배 알림' },
  { value: 'attendance', label: '출석 관련' },
  { value: 'birthday', label: '생일 축하' },
  { value: 'prayer_request', label: '기도 요청' },
  { value: 'custom', label: '일반 알림' },
];

export default function PushNotifications() {
  const [activeTab, setActiveTab] = useState('send');
  const [targetType, setTargetType] = useState('all');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'announcement',
    image_url: '',
    link_url: '',
    schedule_type: 'now',
    schedule_date: '',
    schedule_time: '',
  });

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (targetType === 'individual' || targetType === 'group') {
      fetchMembers();
    }
  }, [targetType]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/v1/members', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://packs-holds-marc-extended.trycloudflare.com/api/v1';
      const response = await fetch(`${API_BASE_URL}/notifications/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
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

    setIsLoading(true);
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://packs-holds-marc-extended.trycloudflare.com/api/v1';
    
    try {
      let endpoint = '';
      let payload: any = {
        title: formData.title,
        body: formData.body,
        type: formData.type,
        data: {},
      };

      if (formData.image_url) {
        payload.image_url = formData.image_url;
      }

      if (formData.link_url) {
        payload.data.link = formData.link_url;
      }

      // Determine endpoint based on target type
      if (targetType === 'all') {
        endpoint = `${API_BASE_URL}/notifications/send-to-church`;
      } else if (targetType === 'individual' && selectedMembers.length === 1) {
        endpoint = `${API_BASE_URL}/notifications/send`;
        payload.user_id = selectedMembers[0];
      } else if (selectedMembers.length > 0) {
        endpoint = `${API_BASE_URL}/notifications/send-batch`;
        payload.user_ids = selectedMembers;
      } else {
        toast({
          title: '오류',
          description: '대상을 선택해주세요.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: '성공',
          description: `푸시 알림이 발송되었습니다. ${result.success || result.total || 0}명에게 전송`,
        });
        
        // Reset form
        setFormData({
          title: '',
          body: '',
          type: 'announcement',
          image_url: '',
          link_url: '',
          schedule_type: 'now',
          schedule_date: '',
          schedule_time: '',
        });
        setSelectedMembers([]);
        
        // Refresh history
        if (activeTab === 'history') {
          fetchHistory();
        }
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '푸시 알림 발송에 실패했습니다.',
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

  const getTypeLabel = (type: string) => {
    const found = NOTIFICATION_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getTargetLabel = (targetType: string, totalRecipients: number) => {
    switch (targetType) {
      case 'all':
        return `전체 (${totalRecipients}명)`;
      case 'group':
        return `그룹 (${totalRecipients}명)`;
      case 'individual':
        return `개인`;
      default:
        return targetType;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">푸시 알림</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">
            <Send className="mr-2 h-4 w-4" />
            알림 발송
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            발송 이력
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>알림 대상 선택</CardTitle>
              <CardDescription>
                푸시 알림을 받을 대상을 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={targetType} onValueChange={setTargetType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer">
                    전체 교인
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="group" id="group" />
                  <Label htmlFor="group" className="cursor-pointer">
                    그룹 선택
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="cursor-pointer">
                    개별 선택
                  </Label>
                </div>
              </RadioGroup>

              {(targetType === 'individual' || targetType === 'group') && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMemberDialogOpen(true)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    교인 선택 ({selectedMembers.length}명 선택됨)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>알림 내용</CardTitle>
              <CardDescription>
                발송할 푸시 알림의 내용을 작성하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="type">알림 유형</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="알림 제목을 입력하세요"
                />
              </div>

              <div>
                <Label htmlFor="body">내용</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="알림 내용을 입력하세요"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="image_url">
                  <Image className="inline mr-2 h-4 w-4" />
                  이미지 URL (선택사항)
                </Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="link_url">
                  링크 URL (선택사항)
                </Label>
                <Input
                  id="link_url"
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button
              variant="default"
              onClick={handleSendNotification}
              disabled={isLoading}
            >
              <Send className="mr-2 h-4 w-4" />
              {isLoading ? '발송 중...' : '알림 발송'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">발송한 알림이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            history.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.body}</p>
                      </div>
                      <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{getTargetLabel(item.target_type, item.total_recipients)}</span>
                      <span>•</span>
                      <span>발송: {item.sent_count}</span>
                      <span>•</span>
                      <span>전달: {item.delivered_count}</span>
                      <span>•</span>
                      <span>읽음: {item.read_count}</span>
                      {item.failed_count > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-500">실패: {item.failed_count}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-400">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(item.sent_at || item.created_at).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>교인 선택</DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh] pr-4">
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50"
                >
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={() => handleMemberSelect(member.id)}
                  />
                  <Label
                    htmlFor={`member-${member.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{member.name}</span>
                        {member.department && (
                          <span className="ml-2 text-sm text-gray-500">
                            ({member.department})
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{member.phone}</span>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMemberDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={() => setIsMemberDialogOpen(false)}
            >
              선택 완료 ({selectedMembers.length}명)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}