import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui";
import { Plus, Settings, AlertCircle } from 'lucide-react';
import { supabaseApiService } from '../services/supabaseApiService';

interface ChurchLicenseStats {
  church_id: number;
  church_name: string;
  licenses_purchased: number;
  licenses_active: number;
  licenses_assigned: number;
  licenses_available: number;
}

interface GptLicense {
  id: string;
  user_id: string;
  church_id: number;
  user_name: string;
  user_email: string;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
}

interface ChurchAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  has_gpt_license: boolean;
  license_assigned_at?: string | null;
}

export default function GptLicenseManagement() {
  const [churches, setChurches] = useState<ChurchLicenseStats[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<ChurchLicenseStats | null>(null);
  const [licenses, setLicenses] = useState<GptLicense[]>([]);
  const [churchAdmins, setChurchAdmins] = useState<ChurchAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newLicenseCount, setNewLicenseCount] = useState(0);

  const fetchChurchLicenseStats = async () => {
    try {
      setLoading(true);

      // Debug: Check if gptLicenses exists
      console.log('🔍 supabaseApiService:', supabaseApiService);
      // @ts-ignore - Debug only
      console.log('🔍 supabaseApiService.gptLicenses:', supabaseApiService.gptLicenses);

      // @ts-ignore - Debug only
      if (!supabaseApiService.gptLicenses) {
        throw new Error('gptLicenses API is not available');
      }

      // @ts-ignore - GPT license API exists but TypeScript cache issue
      const response = await supabaseApiService.gptLicenses.getChurchStats();
      if (response.success && response.data) {
        setChurches(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch church license stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChurchLicenses = async (churchId: number) => {
    try {
      // @ts-ignore - GPT license API exists but TypeScript cache issue
      const response = await supabaseApiService.gptLicenses.getChurchLicenses(churchId);
      if (response.success) {
        setLicenses(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch church licenses:', error);
    }
  };

  const fetchChurchAdmins = async (churchId: number) => {
    try {
      // @ts-ignore - GPT license API exists but TypeScript cache issue
      const response = await supabaseApiService.gptLicenses.getChurchAdmins(churchId);
      if (response.success) {
        setChurchAdmins((response.data as ChurchAdmin[]) || []);
      }
    } catch (error) {
      console.error('Failed to fetch church admins:', error);
      setChurchAdmins([]);
    }
  };

  const handleUpdateLicenseCount = async () => {
    if (!selectedChurch) return;

    try {
      // @ts-ignore - GPT license API exists but TypeScript cache issue
      const response = await supabaseApiService.gptLicenses.updateChurchLicenseCount(
        selectedChurch.church_id,
        newLicenseCount
      );

      if (response.success) {
        setIsEditDialogOpen(false);
        fetchChurchLicenseStats();
        // If this church is selected, refresh its licenses
        if (selectedChurch) {
          fetchChurchLicenses(selectedChurch.church_id);
        }
      } else {
        alert('라이선스 수량 업데이트 실패: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to update license count:', error);
      alert('라이선스 수량 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleViewChurchLicenses = (church: ChurchLicenseStats) => {
    setSelectedChurch(church);
    fetchChurchLicenses(church.church_id);
    fetchChurchAdmins(church.church_id);
  };

  const handleAssignLicense = async (userId: string, churchId: number) => {
    if (!window.confirm('이 관리자에게 GPT 라이선스를 할당하시겠습니까?')) return;

    try {
      // @ts-ignore - GPT license API exists but TypeScript cache issue
      const response = await supabaseApiService.gptLicenses.assignLicense(userId, churchId);
      if (response.success) {
        alert('라이선스가 성공적으로 할당되었습니다.');
        fetchChurchLicenseStats();
        if (selectedChurch) {
          fetchChurchLicenses(selectedChurch.church_id);
          fetchChurchAdmins(selectedChurch.church_id);
        }
      } else {
        alert('라이선스 할당 실패: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to assign license:', error);
      alert('라이선스 할당 중 오류가 발생했습니다.');
    }
  };

  const handleRevokeLicenseByUser = async (userId: string) => {
    if (!window.confirm('정말로 이 관리자의 GPT 라이선스를 취소하시겠습니까?')) return;

    try {
      // @ts-ignore - GPT license API exists but TypeScript cache issue
      const response = await supabaseApiService.gptLicenses.revokeLicenseByUser(userId);
      if (response.success) {
        alert('라이선스가 성공적으로 취소되었습니다.');
        fetchChurchLicenseStats();
        if (selectedChurch) {
          fetchChurchLicenses(selectedChurch.church_id);
          fetchChurchAdmins(selectedChurch.church_id);
        }
      } else {
        alert('라이선스 취소 실패: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to revoke license by user:', error);
      alert('라이선스 취소 중 오류가 발생했습니다.');
    }
  };

  const handleRevokeLicense = async (licenseId: string) => {
    // Note: In a production app, you would want to use a proper confirm dialog
    // For now, using window.confirm as a temporary solution
    if (!window.confirm('정말로 이 라이선스를 취소하시겠습니까?')) return;

    try {
      // @ts-ignore - GPT license API exists but TypeScript cache issue
      const response = await supabaseApiService.gptLicenses.revokeLicense(licenseId);
      if (response.success) {
        fetchChurchLicenseStats();
        if (selectedChurch) {
          fetchChurchLicenses(selectedChurch.church_id);
          fetchChurchAdmins(selectedChurch.church_id);
        }
      } else {
        alert('라이선스 취소 실패: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to revoke license:', error);
      alert('라이선스 취소 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchChurchLicenseStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">GPT 라이선스 관리</h1>
        <Badge variant="secondary" className="text-sm">
          시스템 관리자 전용
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* Church License Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              교회별 GPT 라이선스 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {churches.map((church) => (
                <div
                  key={church.church_id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{church.church_name}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>구매: {church.licenses_purchased}개</span>
                        <span>활성: {church.licenses_active}개</span>
                        <span>할당: {church.licenses_assigned}개</span>
                        <span>여유: {church.licenses_available}개</span>
                      </div>
                      {church.licenses_assigned > church.licenses_purchased && (
                        <div className="flex items-center gap-1 mt-1 text-amber-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>과할당 상태</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Dialog
                        open={isEditDialogOpen && selectedChurch?.church_id === church.church_id}
                        onOpenChange={(open) => {
                          if (open) {
                            setSelectedChurch(church);
                            setNewLicenseCount(church.licenses_purchased);
                          }
                          setIsEditDialogOpen(open);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-1" />
                            수량 변경
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{church.church_name} GPT 라이선스 수량 변경</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="licenseCount">구매 라이선스 수량</Label>
                              <Input
                                id="licenseCount"
                                type="number"
                                min="0"
                                value={newLicenseCount}
                                onChange={(e) => setNewLicenseCount(parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                취소
                              </Button>
                              <Button onClick={handleUpdateLicenseCount}>
                                변경
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewChurchLicenses(church)}
                      >
                        상세보기
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Church Admins and License Details */}
        {selectedChurch && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Church Admins List */}
            <Card>
              <CardHeader>
                <CardTitle>{selectedChurch.church_name} 수퍼관리자 & 관리자 목록</CardTitle>
              </CardHeader>
              <CardContent>
                {churchAdmins.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    관리자가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {churchAdmins.map((admin) => (
                      <div
                        key={admin.id}
                        className="flex items-center justify-between border rounded-lg p-3"
                      >
                        <div>
                          <div className="font-medium">{admin.name}</div>
                          <div className="text-sm text-gray-600">{admin.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={admin.role === 'church_super_admin' ? 'default' : 'secondary'} className="text-xs">
                              {admin.role === 'church_super_admin' ? '수퍼관리자' : '관리자'}
                            </Badge>
                            <Badge variant={admin.has_gpt_license ? 'default' : 'outline'} className="text-xs">
                              {admin.has_gpt_license ? 'GPT 라이선스 보유' : '라이선스 없음'}
                            </Badge>
                          </div>
                          {admin.has_gpt_license && admin.license_assigned_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              할당일: {new Date(admin.license_assigned_at).toLocaleDateString('ko-KR')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {admin.has_gpt_license ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRevokeLicenseByUser(admin.id)}
                            >
                              라이선스 취소
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAssignLicense(admin.id, selectedChurch.church_id)}
                            >
                              라이선스 할당
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* License Assignment History */}
            <Card>
              <CardHeader>
                <CardTitle>{selectedChurch.church_name} 라이선스 할당 내역</CardTitle>
              </CardHeader>
              <CardContent>
                {licenses.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    할당 내역이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {licenses.map((license) => (
                      <div
                        key={license.id}
                        className="flex items-center justify-between border rounded-lg p-3"
                      >
                        <div>
                          <div className="font-medium">{license.user_name}</div>
                          <div className="text-sm text-gray-600">{license.user_email}</div>
                          <div className="text-xs text-gray-500">
                            할당일: {new Date(license.assigned_at).toLocaleDateString('ko-KR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            할당자: {license.assigned_by}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={license.is_active ? 'default' : 'secondary'}>
                            {license.is_active ? '활성' : '비활성'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}