import React, { useState, useEffect } from 'react';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { permissionGroupService, PermissionGroup, SystemMenu, MenuPermission, GroupUser, ChurchUser } from '../services/permissionGroupService';
import { isChurchSuperAdmin, isSuperAdmin } from '../utils/userPermissions';
import { Shield, Search, Plus, Save, Trash2, UserPlus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from './ui';
import { useToast } from '../hooks/use-toast';

const PermissionGroupManagement: React.FC = () => {
  const { toast } = useToast();

  // 현재 사용자 정보
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 권한 그룹 목록
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 시스템 메뉴
  const [systemMenus, setSystemMenus] = useState<SystemMenu[]>([]);

  // 메뉴 권한
  const [menuPermissions, setMenuPermissions] = useState<Map<string, MenuPermission>>(new Map());

  // 그룹 사용자
  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([]);
  const [churchUsers, setChurchUsers] = useState<ChurchUser[]>([]);

  // UI 상태
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // 그룹 생성/수정 폼
  const [groupForm, setGroupForm] = useState({
    code: '',
    category: '',
    name: '',
    description: ''
  });
  const [isEditingGroup, setIsEditingGroup] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.church_id) {
      loadData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails();
    }
  }, [selectedGroup]);

  const loadCurrentUser = async () => {
    try {
      const user = await supabaseAuthService.getCurrentUser();
      if (user?.user) {
        setCurrentUser(user.user);
      }
    } catch (error) {
      console.error('현재 사용자 정보 로드 실패:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // 권한 그룹 목록 조회
      const groupsResult = await permissionGroupService.getGroups(currentUser.church_id);
      setGroups(groupsResult.data || []);

      // 시스템 메뉴 조회
      const menusResult = await permissionGroupService.getSystemMenus();

      // AI 기능과 보안 & 시스템 메뉴 제외
      const excludedCodes = ['AI', 'SECURITY'];
      const filteredMenus = (menusResult.data || []).filter(menu => !excludedCodes.includes(menu.code));

      setSystemMenus(filteredMenus);

      // 교회 사용자 목록 조회
      const usersResult = await permissionGroupService.getChurchUsers(currentUser.church_id);
      setChurchUsers(usersResult.data || []);

    } catch (error: any) {
      console.error('데이터 로드 실패:', error);
      toast({
        title: '데이터 로드 실패',
        description: error.message || '데이터를 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetails = async () => {
    if (!selectedGroup) return;

    try {
      // 그룹 메뉴 권한 조회
      const permissionsResult = await permissionGroupService.getGroupPermissions(selectedGroup.id);
      const permissionsMap = new Map<string, MenuPermission>();

      permissionsResult.data.forEach(permission => {
        permissionsMap.set(permission.menu_id, permission);
      });

      setMenuPermissions(permissionsMap);

      // 그룹 사용자 조회
      const usersResult = await permissionGroupService.getGroupUsers(selectedGroup.id);
      setGroupUsers(usersResult.data || []);

    } catch (error: any) {
      console.error('그룹 상세 정보 로드 실패:', error);
      toast({
        title: '그룹 상세 정보 로드 실패',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCreateGroup = () => {
    setGroupForm({ code: '', category: '', name: '', description: '' });
    setIsEditingGroup(false);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group: PermissionGroup) => {
    setGroupForm({
      code: group.code,
      category: group.category,
      name: group.name,
      description: group.description || ''
    });
    setIsEditingGroup(true);
    setShowGroupModal(true);
  };

  const handleSaveGroup = async () => {
    try {
      if (!groupForm.code || !groupForm.name) {
        toast({
          title: '입력 오류',
          description: '코드와 그룹명은 필수입니다.',
          variant: 'destructive'
        });
        return;
      }

      if (isEditingGroup && selectedGroup) {
        await permissionGroupService.updateGroup(selectedGroup.id, groupForm);
        toast({
          title: '수정 완료',
          description: '권한 그룹이 수정되었습니다.'
        });
      } else {
        await permissionGroupService.createGroup({
          ...groupForm,
          church_id: currentUser.church_id
        });
        toast({
          title: '생성 완료',
          description: '권한 그룹이 생성되었습니다.'
        });
      }

      setShowGroupModal(false);
      loadData();
    } catch (error: any) {
      toast({
        title: '저장 실패',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('이 권한 그룹을 삭제하시겠습니까?')) return;

    try {
      await permissionGroupService.deleteGroup(groupId);
      toast({
        title: '삭제 완료',
        description: '권한 그룹이 삭제되었습니다.'
      });

      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }

      loadData();
    } catch (error: any) {
      toast({
        title: '삭제 실패',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handlePermissionChange = (menuId: string, field: 'can_use' | 'can_create' | 'can_edit' | 'can_delete', value: boolean) => {
    const newPermissions = new Map(menuPermissions);
    const existing = newPermissions.get(menuId);

    if (existing) {
      newPermissions.set(menuId, { ...existing, [field]: value });
    } else {
      newPermissions.set(menuId, {
        menu_id: menuId,
        permission_group_id: selectedGroup!.id,
        can_use: field === 'can_use' ? value : false,
        can_create: field === 'can_create' ? value : false,
        can_edit: field === 'can_edit' ? value : false,
        can_delete: field === 'can_delete' ? value : false,
      });
    }

    setMenuPermissions(newPermissions);
  };

  const handleSavePermissions = async () => {
    if (!selectedGroup) return;

    try {
      setSaving(true);

      const permissions = Array.from(menuPermissions.values()).map(p => ({
        menu_id: p.menu_id,
        can_use: p.can_use,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete
      }));

      await permissionGroupService.updatePermissions(selectedGroup.id, permissions);

      toast({
        title: '저장 완료',
        description: '메뉴 권한이 저장되었습니다.'
      });
    } catch (error: any) {
      toast({
        title: '저장 실패',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddUsers = async (userIds: string[]) => {
    if (!selectedGroup) return;

    try {
      await permissionGroupService.addUsers(selectedGroup.id, userIds, currentUser.id);
      toast({
        title: '추가 완료',
        description: '사용자가 권한 그룹에 추가되었습니다.'
      });

      setShowUserModal(false);
      loadGroupDetails();
    } catch (error: any) {
      toast({
        title: '추가 실패',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!selectedGroup) return;
    if (!window.confirm('이 사용자를 권한 그룹에서 제거하시겠습니까?')) return;

    try {
      await permissionGroupService.removeUsers(selectedGroup.id, [userId]);
      toast({
        title: '제거 완료',
        description: '사용자가 권한 그룹에서 제거되었습니다.'
      });

      loadGroupDetails();
    } catch (error: any) {
      toast({
        title: '제거 실패',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentUser || (!isChurchSuperAdmin(currentUser) && !isSuperAdmin(currentUser))) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-destructive mb-2">접근 권한 없음</h3>
          <p className="text-destructive">권한 그룹 관리 기능은 Church Super Admin만 사용할 수 있습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8" />
          사용자 권한그룹관리
        </h2>
      </div>

      {/* 3단 레이아웃 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 좌측: 권한 그룹 목록 */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">사용자 권한그룹 목록</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 검색 + 등록 */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="총 0000건"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
                  />
                </div>
                <Button onClick={handleCreateGroup} className="whitespace-nowrap">
                  등록
                </Button>
              </div>

              {/* 권한 그룹 테이블 */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">구분</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">코드</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">권한그룹명</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">사용자수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredGroups.map((group) => (
                      <tr
                        key={group.id}
                        onClick={() => setSelectedGroup(group)}
                        className={`cursor-pointer hover:bg-gray-50 ${selectedGroup?.id === group.id ? 'bg-gray-100' : ''}`}
                      >
                        <td className="px-4 py-3">{group.category}</td>
                        <td className="px-4 py-3">{group.code}</td>
                        <td className="px-4 py-3">{group.name}</td>
                        <td className="px-4 py-3 text-center">{group.user_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredGroups.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  권한 그룹이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 우측: 권한 정보 */}
        <div className="col-span-8 space-y-6">
          {!selectedGroup ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                좌측에서 권한 그룹을 선택해주세요.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 권한 그룹 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">권한그룹 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">구분</label>
                      <div className="mt-1">{selectedGroup.category}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">관리</label>
                      <div className="mt-1 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditGroup(selectedGroup)}>
                          수정
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteGroup(selectedGroup.id)}>
                          삭제
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">코드</label>
                      <div className="mt-1">{selectedGroup.code}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">권한그룹명</label>
                      <div className="mt-1">{selectedGroup.name}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 권한 메뉴 설정 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">권한 메뉴 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">1Depth</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">2Depth</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">사용여부</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">등록</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">수정</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {systemMenus.map((menu1) => (
                          <React.Fragment key={menu1.id}>
                            {menu1.children && menu1.children.length > 0 ? (
                              menu1.children.map((menu2, index) => {
                                const permission = menuPermissions.get(menu2.id);
                                return (
                                  <tr key={menu2.id}>
                                    {index === 0 && (
                                      <td className="px-4 py-3 font-medium" rowSpan={menu1.children!.length}>
                                        {menu1.name}
                                      </td>
                                    )}
                                    <td className="px-4 py-3">{menu2.name}</td>
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={permission?.can_use || false}
                                        onChange={(e) => handlePermissionChange(menu2.id, 'can_use', e.target.checked)}
                                        className="w-4 h-4"
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={permission?.can_create || false}
                                        onChange={(e) => handlePermissionChange(menu2.id, 'can_create', e.target.checked)}
                                        className="w-4 h-4"
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={permission?.can_edit || false}
                                        onChange={(e) => handlePermissionChange(menu2.id, 'can_edit', e.target.checked)}
                                        className="w-4 h-4"
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={permission?.can_delete || false}
                                        onChange={(e) => handlePermissionChange(menu2.id, 'can_delete', e.target.checked)}
                                        className="w-4 h-4"
                                      />
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr key={menu1.id}>
                                <td className="px-4 py-3 font-medium" colSpan={2}>{menu1.name}</td>
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={menuPermissions.get(menu1.id)?.can_use || false}
                                    onChange={(e) => handlePermissionChange(menu1.id, 'can_use', e.target.checked)}
                                    className="w-4 h-4"
                                  />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={menuPermissions.get(menu1.id)?.can_create || false}
                                    onChange={(e) => handlePermissionChange(menu1.id, 'can_create', e.target.checked)}
                                    className="w-4 h-4"
                                  />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={menuPermissions.get(menu1.id)?.can_edit || false}
                                    onChange={(e) => handlePermissionChange(menu1.id, 'can_edit', e.target.checked)}
                                    className="w-4 h-4"
                                  />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={menuPermissions.get(menu1.id)?.can_delete || false}
                                    onChange={(e) => handlePermissionChange(menu1.id, 'can_delete', e.target.checked)}
                                    className="w-4 h-4"
                                  />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={handleSavePermissions} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 권한그룹 사용자 목록 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">권한그룹 사용자 목록</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowUserModal(true)}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      추가
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">사용자 아이디</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">사용자명</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">부서</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">계정상태</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">활성상태</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {groupUsers.map((user) => (
                          <tr key={user.id}>
                            <td className="px-4 py-3">{user.user_email}</td>
                            <td className="px-4 py-3">{user.user_name || '-'}</td>
                            <td className="px-4 py-3 text-center">-</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                정상
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">-</td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveUser(user.user_id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {groupUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      할당된 사용자가 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* 권한 그룹 생성/수정 모달 */}
      <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingGroup ? '권한 그룹 수정' : '권한 그룹 생성'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">코드 *</label>
              <input
                type="text"
                value={groupForm.code}
                onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="예: 0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">구분</label>
              <input
                type="text"
                value={groupForm.category}
                onChange={(e) => setGroupForm({ ...groupForm, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="예: 관리"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">권한그룹명 *</label>
              <input
                type="text"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="예: 시스템관리자"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">설명</label>
              <textarea
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="권한 그룹에 대한 설명을 입력하세요"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGroupModal(false)}>
                취소
              </Button>
              <Button onClick={handleSaveGroup}>
                {isEditingGroup ? '수정' : '생성'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 사용자 추가 모달 */}
      <UserAddModal
        open={showUserModal}
        onClose={() => setShowUserModal(false)}
        churchUsers={churchUsers}
        groupUsers={groupUsers}
        onAdd={handleAddUsers}
      />
    </div>
  );
};

// 사용자 추가 모달 컴포넌트
interface UserAddModalProps {
  open: boolean;
  onClose: () => void;
  churchUsers: ChurchUser[];
  groupUsers: GroupUser[];
  onAdd: (userIds: string[]) => void;
}

const UserAddModal: React.FC<UserAddModalProps> = ({ open, onClose, churchUsers, groupUsers, onAdd }) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const availableUsers = churchUsers.filter(
    user => !groupUsers.some(gu => gu.user_id === user.id)
  );

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAdd = () => {
    if (selectedUserIds.length === 0) {
      alert('추가할 사용자를 선택해주세요.');
      return;
    }
    onAdd(selectedUserIds);
    setSelectedUserIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>사용자 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-center w-12">
                    <input type="checkbox" className="w-4 h-4" />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">이메일</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">이름</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">역할</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {availableUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => handleToggleUser(user.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.full_name || user.username || '-'}</td>
                    <td className="px-4 py-3">{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {availableUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              추가할 수 있는 사용자가 없습니다.
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleAdd} disabled={selectedUserIds.length === 0}>
              추가 ({selectedUserIds.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionGroupManagement;
