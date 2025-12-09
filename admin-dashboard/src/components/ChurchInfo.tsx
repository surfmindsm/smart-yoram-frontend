import React, { useState, useEffect } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { Button } from "./ui";
import { Card, CardContent } from "./ui";
import { Input } from "./ui";
import { Alert, AlertDescription } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { Building2, Phone, Mail, MapPin, Edit2 } from 'lucide-react';

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
  subscription_status: string;
  subscription_end_date?: string | null;
  member_limit: number;
  is_active: boolean;
  subscription_plan?: string | null;
  gpt_api_key?: string;
  gpt_model?: string;
  max_tokens?: number;
  temperature?: number;
  gpt_last_test?: string | null;
  max_agents?: number | null;
  monthly_token_limit?: number | null;
  current_month_tokens?: number;
  current_month_cost?: number;
  business_no?: string | null;
  rrn_encrypted?: string | null;
  district_scheme?: string | null;
  created_at?: string;
  updated_at?: string;
}

const ChurchInfo: React.FC = () => {
  const [church, setChurch] = useState<Church | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    pastor_name: '',
    homepage_url: '',
    youtube_channel: '',
    business_no: '',
    district_scheme: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChurchInfo();
  }, []);

  const loadChurchInfo = async () => {
    try {
      setLoading(true);
      const data = await supabaseApiService.churches.getMyChurch();
      setChurch(data);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        pastor_name: data.pastor_name || '',
        homepage_url: data.homepage_url || '',
        youtube_channel: data.youtube_channel || '',
        business_no: data.business_no || '',
        district_scheme: data.district_scheme || ''
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
      const updated = await supabaseApiService.churches.update(church.id, formData);
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
        pastor_name: church.pastor_name || '',
        homepage_url: church.homepage_url || '',
        youtube_channel: church.youtube_channel || '',
        business_no: church.business_no || '',
        district_scheme: church.district_scheme || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">로딩 중...</p>
        </div>
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

  return (
    <PageContainer>
      <PageHeader
        title="교회 정보"
        description="교회의 기본 정보를 확인하고 수정합니다."
        actions={
          !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              수정
            </Button>
          )
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
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
                  <label className="block text-sm font-medium text-gray-900 mb-2">담임목사</label>
                  <Input
                    type="text"
                    value={formData.pastor_name}
                    onChange={(e) => setFormData({ ...formData, pastor_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
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
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    이메일
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    사업자등록번호
                  </label>
                  <Input
                    type="text"
                    placeholder="000-00-00000"
                    value={formData.business_no}
                    onChange={(e) => setFormData({ ...formData, business_no: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    주소
                  </label>
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    교회 홈페이지
                  </label>
                  <Input
                    type="url"
                    placeholder="https://church.com"
                    value={formData.homepage_url}
                    onChange={(e) => setFormData({ ...formData, homepage_url: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    유튜브 채널
                  </label>
                  <Input
                    type="url"
                    placeholder="https://youtube.com/@channel"
                    value={formData.youtube_channel}
                    onChange={(e) => setFormData({ ...formData, youtube_channel: e.target.value })}
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
                <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  교회명
                </h3>
                <p className="mt-1 text-lg text-gray-900">{church?.name || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">담임목사</h3>
                <p className="mt-1 text-lg text-gray-900">{church?.pastor_name || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  전화번호
                </h3>
                <p className="mt-1 text-lg text-gray-900">{church?.phone || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  이메일
                </h3>
                <p className="mt-1 text-lg text-gray-900">{church?.email || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">
                  사업자등록번호
                </h3>
                <p className="mt-1 text-lg text-gray-900">{church?.business_no || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  주소
                </h3>
                <p className="mt-1 text-lg text-gray-900">{church?.address || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">교회 홈페이지</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {church?.homepage_url ? (
                    <a href={church.homepage_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {church.homepage_url}
                    </a>
                  ) : '-'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">유튜브 채널</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {church?.youtube_channel ? (
                    <a href={church.youtube_channel} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {church.youtube_channel}
                    </a>
                  ) : '-'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default ChurchInfo;