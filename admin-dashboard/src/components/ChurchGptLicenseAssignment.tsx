import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui3";
import { Button } from "@/components/ui3";
import { Badge } from "@/components/ui3";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui3";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui3";
import { UserPlus, UserMinus, AlertCircle, Users } from 'lucide-react';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';

interface ChurchAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  has_gpt_license: boolean;
  license_assigned_at: string | null | undefined;
}

interface ChurchLicenseStats {
  licenses_purchased: number;
  licenses_active: number;
  licenses_assigned: number;
  licenses_available: number;
}

export default function ChurchGptLicenseAssignment() {
  const [user, setUser] = useState<any>(null);
  const [admins, setAdmins] = useState<ChurchAdmin[]>([]);
  const [licenseStats, setLicenseStats] = useState<ChurchLicenseStats>({
    licenses_purchased: 0,
    licenses_active: 0,
    licenses_assigned: 0,
    licenses_available: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await supabaseAuthService.getCurrentUser();
      if (currentUser?.user) {
        setUser(currentUser.user);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchChurchAdmins = async () => {
    if (!user?.church_id) return;

    try {
      setLoading(true);
      // @ts-ignore - GPT license API exists but TypeScript cache issue
      const response = await supabaseApiService.gptLicenses.getChurchAdmins(user.church_id);
      if (response.success) {
        setAdmins((response.data as ChurchAdmin[]) || []);
      }
    } catch (error) {
      console.error('Failed to fetch church admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLicenseStats = async () => {
    if (!user?.church_id) return;

    try {
      // @ts-ignore - GPT license API exists but TypeScript cache issue
      const response = await supabaseApiService.gptLicenses.getChurchStats(user.church_id);
      if (response.success && response.data && response.data.length > 0) {
        const stats = response.data[0];
        setLicenseStats({
          licenses_purchased: stats.licenses_purchased || 0,
          licenses_active: stats.licenses_active || 0,
          licenses_assigned: stats.licenses_assigned || 0,
          licenses_available: stats.licenses_available || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch license stats:', error);
    }
  };

  const handleAssignLicense = async () => {
    if (!selectedAdminId || !user?.church_id) return;

    try {
      // @ts-ignore - GPT license API exists but TypeScript cache issue
      const response = await supabaseApiService.gptLicenses.assignLicense(
        selectedAdminId,
        user.church_id
      );

      if (response.success) {
        setIsAssignDialogOpen(false);
        setSelectedAdminId('');
        fetchChurchAdmins();
        fetchLicenseStats();
      } else {
        alert('라이선스 할당 실패: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to assign license:', error);
      alert('라이선스 할당 중 오류가 발생했습니다.');
    }
  };

  const handleRevokeLicense = async (adminId: string, adminName: string) => {
    // Note: In a production app, you would want to use a proper confirm dialog
    // For now, using window.confirm as a temporary solution
    if (!window.confirm(`${adminName}의 GPT 라이선스를 취소하시겠습니까?`)) return;

    try {
      // @ts-ignore - GPT license API exists but TypeScript cache issue
      const response = await supabaseApiService.gptLicenses.revokeLicenseByUser(adminId);
      if (response.success) {
        fetchChurchAdmins();
        fetchLicenseStats();
      } else {
        alert('라이선스 취소 실패: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to revoke license:', error);
      alert('라이선스 취소 중 오류가 발생했습니다.');
    }
  };

  const unassignedAdmins = admins.filter(admin => !admin.has_gpt_license);
  const assignedAdmins = admins.filter(admin => admin.has_gpt_license);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user?.church_id) {
      fetchChurchAdmins();
      fetchLicenseStats();
    }
  }, [user?.church_id]);

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
        <h1 className="text-3xl font-bold">GPT 라이선스 할당</h1>
        <Badge variant="secondary" className="text-sm">
          교회 관리자 전용
        </Badge>
      </div>

      {/* License Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            라이선스 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {licenseStats.licenses_purchased}
              </div>
              <div className="text-sm text-gray-600">구매한 라이선스</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {licenseStats.licenses_assigned}
              </div>
              <div className="text-sm text-gray-600">할당된 라이선스</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {licenseStats.licenses_available}
              </div>
              <div className="text-sm text-gray-600">사용 가능</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {licenseStats.licenses_active}
              </div>
              <div className="text-sm text-gray-600">활성 라이선스</div>
            </div>
          </div>

          {licenseStats.licenses_assigned > licenseStats.licenses_purchased && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">과할당 상태</span>
              </div>
              <div className="text-sm text-amber-700 mt-1">
                구매한 라이선스보다 더 많은 라이선스가 할당되었습니다.
                시스템 관리자에게 라이선스 추가 구매를 요청해주세요.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* License Assignment */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Assigned Licenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>GPT 라이선스 보유 관리자</CardTitle>
            <Badge variant="default">{assignedAdmins.length}명</Badge>
          </CardHeader>
          <CardContent>
            {assignedAdmins.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                GPT 라이선스를 보유한 관리자가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {assignedAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                  >
                    <div>
                      <div className="font-medium">{admin.name}</div>
                      <div className="text-sm text-gray-600">{admin.email}</div>
                      <div className="text-xs text-gray-500">
                        할당: {admin.license_assigned_at ?
                          new Date(admin.license_assigned_at).toLocaleDateString('ko-KR') :
                          '알 수 없음'
                        }
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevokeLicense(admin.id, admin.name)}
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      취소
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Admins */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>라이선스 미보유 관리자</CardTitle>
            <Badge variant="secondary">{unassignedAdmins.length}명</Badge>
          </CardHeader>
          <CardContent>
            {unassignedAdmins.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                모든 관리자가 GPT 라이선스를 보유하고 있습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {unassignedAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{admin.name}</div>
                      <div className="text-sm text-gray-600">{admin.email}</div>
                      <div className="text-xs text-gray-500">
                        역할: {admin.role === 'admin' ? '관리자' : '교회 관리자'}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Assign License Dialog */}
                <div className="mt-4">
                  <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        disabled={licenseStats.licenses_available <= 0}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        라이선스 할당하기
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>GPT 라이선스 할당</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">관리자 선택</label>
                          <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="라이선스를 할당할 관리자를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {unassignedAdmins.map((admin) => (
                                <SelectItem key={admin.id} value={admin.id}>
                                  {admin.name} ({admin.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                            취소
                          </Button>
                          <Button onClick={handleAssignLicense} disabled={!selectedAdminId}>
                            할당하기
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}