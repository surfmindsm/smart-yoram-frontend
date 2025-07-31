import React, { useState, useEffect } from 'react';
import { churchService } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Building2, Phone, Mail, MapPin, Edit2, Calendar, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface Church {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  pastor_name?: string;
  subscription_status: string;
  subscription_end_date?: string;
  member_limit: number;
  is_active: boolean;
}

const ChurchInfo: React.FC = () => {
  const [church, setChurch] = useState<Church | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    pastor_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChurchInfo();
  }, []);

  const loadChurchInfo = async () => {
    try {
      setLoading(true);
      const data = await churchService.getMyChurch();
      setChurch(data);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        pastor_name: data.pastor_name || ''
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || '교회 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!church) return;

    try {
      const updated = await churchService.updateChurch(church.id, formData);
      setChurch(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || '저장 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    if (church) {
      setFormData({
        name: church.name || '',
        address: church.address || '',
        phone: church.phone || '',
        email: church.email || '',
        pastor_name: church.pastor_name || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error && !church) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">교회 정보</h2>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            수정
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-muted">
        <CardContent className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    교회명
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">담임목사</label>
                  <Input
                    type="text"
                    value={formData.pastor_name}
                    onChange={(e) => setFormData({ ...formData, pastor_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    전화번호
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    이메일
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    주소
                  </label>
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  취소
                </Button>
                <Button type="submit">
                  저장
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  교회명
                </h3>
                <p className="mt-1 text-lg text-foreground">{church?.name || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">담임목사</h3>
                <p className="mt-1 text-lg text-foreground">{church?.pastor_name || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  전화번호
                </h3>
                <p className="mt-1 text-lg text-foreground">{church?.phone || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  이메일
                </h3>
                <p className="mt-1 text-lg text-foreground">{church?.email || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  주소
                </h3>
                <p className="mt-1 text-lg text-foreground">{church?.address || '-'}</p>
              </div>
            </div>
          )}

          {/* Subscription Info */}
          {church && (
            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">구독 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-muted">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">구독 상태</h4>
                    <Badge 
                      variant={church.subscription_status === 'active' ? 'success' : 
                               church.subscription_status === 'trial' ? 'warning' : 'destructive'}
                    >
                      {church.subscription_status === 'active' ? '활성' : 
                       church.subscription_status === 'trial' ? '체험판' : '만료'}
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      만료일
                    </h4>
                    <p className="text-foreground">
                      {church.subscription_end_date 
                        ? new Date(church.subscription_end_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      교인 수 제한
                    </h4>
                    <p className="text-foreground">{church.member_limit}명</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChurchInfo;