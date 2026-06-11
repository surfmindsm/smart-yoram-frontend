import React, { useState, useEffect, useMemo } from 'react';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { permissionGroupService, PermissionGroup, SystemMenu, MenuPermission, GroupUser, ChurchUser } from '../services/permissionGroupService';
import { isChurchSuperAdmin, isSuperAdmin } from '../utils/userPermissions';
import { Shield, Search, Plus, Trash2, UserPlus, Users, X } from 'lucide-react';
import {
  Card,
  Button,
  LoadingState,
  Input,
  Label,
  Textarea,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  ConfirmDialog,
  PageContainer,
  toast,
} from "./ui";
import { usePageSubtitle, usePageActions } from '../hooks/usePageSubtitle';
import { cn } from '../lib/utils';

const PermissionGroupManagement: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [systemMenus, setSystemMenus] = useState<SystemMenu[]>([]);
  const [menuPermissions, setMenuPermissions] = useState<Map<string, MenuPermission>>(new Map());

  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([]);
  const [churchUsers, setChurchUsers] = useState<ChurchUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 그룹 추가/수정 모달
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({
    code: '',
    category: '',
    name: '',
    description: '',
  });

  // 사용자 추가 모달
  const [showUserModal, setShowUserModal] = useState(false);

  // 삭제 확인
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<PermissionGroup | null>(null);
  const [removeUserTarget, setRemoveUserTarget] = useState<GroupUser | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.church_id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails();
    } else {
      setMenuPermissions(new Map());
      setGroupUsers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const groupsResult = await permissionGroupService.getGroups(currentUser.church_id);
      setGroups(groupsResult.data || []);

      const menusResult = await permissionGroupService.getSystemMenus();
      const excludedCodes = ['AI', 'SECURITY'];
      const filteredMenus = (menusResult.data || []).filter(menu => !excludedCodes.includes(menu.code));
      setSystemMenus(filteredMenus);

      const usersResult = await permissionGroupService.getChurchUsers(currentUser.church_id);
      setChurchUsers(usersResult.data || []);
    } catch (error: any) {
      console.error('데이터 로드 실패:', error);
      toast({ title: '데이터 로드 실패', description: error.message || '데이터를 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetails = async () => {
    if (!selectedGroup) return;
    try {
      const permissionsResult = await permissionGroupService.getGroupPermissions(selectedGroup.id);
      const permissionsMap = new Map<string, MenuPermission>();
      permissionsResult.data.forEach(permission => {
        permissionsMap.set(permission.menu_id, permission);
      });
      setMenuPermissions(permissionsMap);

      const usersResult = await permissionGroupService.getGroupUsers(selectedGroup.id);
      setGroupUsers(usersResult.data || []);
    } catch (error: any) {
      console.error('그룹 상세 정보 로드 실패:', error);
      toast({ title: '그룹 상세 정보 로드 실패', description: error.message, variant: 'destructive' });
    }
  };

  const openCreateGroupModal = () => {
    setGroupForm({ code: '', category: '', name: '', description: '' });
    setIsEditingGroup(false);
    setShowGroupModal(true);
  };

  const openEditGroupModal = (group: PermissionGroup) => {
    setGroupForm({
      code: group.code,
      category: group.category,
      name: group.name,
      description: group.description || '',
    });
    setIsEditingGroup(true);
    setShowGroupModal(true);
  };

  const handleSaveGroup = async () => {
    if (!groupForm.code.trim() || !groupForm.name.trim()) {
      toast({ title: '입력 오류', description: '코드와 그룹명은 필수입니다.', variant: 'destructive' });
      return;
    }
    try {
      if (isEditingGroup && selectedGroup) {
        await permissionGroupService.updateGroup(selectedGroup.id, groupForm);
        toast({ title: '수정 완료', description: '권한 그룹이 수정되었습니다.' });
      } else {
        await permissionGroupService.createGroup({ ...groupForm, church_id: currentUser.church_id });
        toast({ title: '생성 완료', description: '권한 그룹이 생성되었습니다.' });
      }
      setShowGroupModal(false);
      loadData();
    } catch (error: any) {
      toast({ title: '저장 실패', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupTarget) return;
    try {
      await permissionGroupService.deleteGroup(deleteGroupTarget.id);
      toast({ title: '삭제 완료', description: '권한 그룹이 삭제되었습니다.' });
      if (selectedGroup?.id === deleteGroupTarget.id) setSelectedGroup(null);
      setDeleteGroupTarget(null);
      loadData();
    } catch (error: any) {
      toast({ title: '삭제 실패', description: error.message, variant: 'destructive' });
    }
  };

  const handlePermissionChange = (
    menuId: string,
    field: 'can_use' | 'can_create' | 'can_edit' | 'can_delete',
    value: boolean
  ) => {
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
        can_delete: p.can_delete,
      }));
      await permissionGroupService.updatePermissions(selectedGroup.id, permissions);
      toast({ title: '저장 완료', description: '메뉴 권한이 저장되었습니다.' });
    } catch (error: any) {
      toast({ title: '저장 실패', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddUsers = async (userIds: string[]) => {
    if (!selectedGroup) return;
    try {
      await permissionGroupService.addUsers(selectedGroup.id, userIds, currentUser.id);
      toast({ title: '추가 완료', description: '사용자가 권한 그룹에 추가되었습니다.' });
      setShowUserModal(false);
      loadGroupDetails();
    } catch (error: any) {
      toast({ title: '추가 실패', description: error.message, variant: 'destructive' });
    }
  };

  const handleRemoveUser = async () => {
    if (!selectedGroup || !removeUserTarget) return;
    try {
      await permissionGroupService.removeUsers(selectedGroup.id, [removeUserTarget.user_id]);
      toast({ title: '제거 완료', description: '사용자가 권한 그룹에서 제거되었습니다.' });
      setRemoveUserTarget(null);
      loadGroupDetails();
    } catch (error: any) {
      toast({ title: '제거 실패', description: error.message, variant: 'destructive' });
    }
  };

  const filteredGroups = useMemo(() => {
    const search = searchTerm.toLowerCase();
    if (!search) return groups;
    return groups.filter(g =>
      g.name.toLowerCase().includes(search) || g.code.toLowerCase().includes(search)
    );
  }, [groups, searchTerm]);

  // 상단바
  usePageSubtitle(`전체 ${groups.length}개`);
  usePageActions(
    <Button onClick={openCreateGroupModal} size="sm" className="gap-2">
      <Plus className="h-3.5 w-3.5" />
      그룹 추가
    </Button>,
    [groups.length]
  );

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <LoadingState text="권한 그룹을 불러오는 중..." />
        </Card>
      </PageContainer>
    );
  }

  if (!currentUser || (!isChurchSuperAdmin(currentUser) && !isSuperAdmin(currentUser))) {
    return (
      <PageContainer>
        <Card className="border-[#FAD9D9] bg-[#FCEBEB]">
          <div className="p-[18px]">
            <h3 className="mb-2 text-[14px] font-bold text-[#DC2626]">접근 권한 없음</h3>
            <p className="text-[13px] text-[#DC2626]">
              권한 그룹 관리 기능은 Church Super Admin만 사용할 수 있습니다.
            </p>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* 좌측: 그룹 목록 */}
        <div className="lg:col-span-4">
          <Card className="overflow-hidden">
            {/* 헤더 + 검색 */}
            <div className="flex items-center justify-between gap-2 border-b border-[#EEF1F6] px-4 py-3">
              <div className="text-[14px] font-bold leading-tight text-foreground">권한 그룹</div>
              <span className="text-[12px] text-muted-foreground">{filteredGroups.length}개</span>
            </div>
            <div className="border-b border-[#EEF1F6] px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  type="text"
                  placeholder="이름·코드 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="py-12 text-center">
                <Shield className="mx-auto mb-3 h-10 w-10 text-[#94A3B8]" />
                <p className="text-[13px] text-muted-foreground">
                  {searchTerm ? '검색 결과가 없습니다.' : '등록된 권한 그룹이 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="max-h-[640px] overflow-y-auto">
                {filteredGroups.map((group) => {
                  const isSelected = selectedGroup?.id === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroup(group)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 border-b border-[#EEF1F6] px-4 py-3 text-left transition-colors last:border-b-0',
                        isSelected
                          ? 'bg-[#EEF3FC] hover:bg-[#E0EAFA]'
                          : 'hover:bg-[#F8FAFD]'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {group.category && (
                            <span className="inline-flex items-center rounded-full bg-[#F1F4F9] px-2 py-0.5 text-[10.5px] font-semibold text-[#64748B]">
                              {group.category}
                            </span>
                          )}
                          <span className="truncate text-[13px] font-semibold text-foreground">
                            {group.name}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-[#94A3B8] tabular-nums">{group.code}</div>
                      </div>
                      <span className="inline-flex flex-shrink-0 items-center gap-1 text-[11.5px] text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {group.user_count || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* 우측: 상세 */}
        <div className="space-y-4 lg:col-span-8">
          {!selectedGroup ? (
            <Card>
              <div className="py-16 text-center">
                <Shield className="mx-auto mb-3 h-10 w-10 text-[#94A3B8]" />
                <p className="text-[13px] text-muted-foreground">
                  좌측에서 권한 그룹을 선택해주세요.
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* 그룹 정보 */}
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between gap-2 border-b border-[#EEF1F6] px-4 py-3">
                  <div className="text-[14px] font-bold leading-tight text-foreground">그룹 정보</div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditGroupModal(selectedGroup)}
                      className="h-8 text-[12px]"
                    >
                      수정
                    </Button>
                    <Button
                      variant="destructive-soft"
                      size="sm"
                      onClick={() => setDeleteGroupTarget(selectedGroup)}
                      className="h-8 gap-1.5 text-[12px]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-4 py-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">구분</div>
                    <div className="mt-1.5 text-[13px] text-foreground">{selectedGroup.category || <span className="text-[#CBD5E1]">-</span>}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">코드</div>
                    <div className="mt-1.5 text-[13px] text-foreground tabular-nums">{selectedGroup.code}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">그룹명</div>
                    <div className="mt-1.5 text-[13px] font-semibold text-foreground">{selectedGroup.name}</div>
                  </div>
                  {selectedGroup.description && (
                    <div className="col-span-2">
                      <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">설명</div>
                      <div className="mt-1.5 text-[13px] text-foreground">{selectedGroup.description}</div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 메뉴 권한 */}
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between gap-2 border-b border-[#EEF1F6] px-4 py-3">
                  <div className="text-[14px] font-bold leading-tight text-foreground">메뉴 권한</div>
                  <Button onClick={handleSavePermissions} disabled={saving} size="sm">
                    {saving ? '저장 중...' : '권한 저장'}
                  </Button>
                </div>
                <div className="max-h-[480px] overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-[#F8FAFD]">
                      <tr className="border-b border-[#EEF1F6]">
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">대분류</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">메뉴</th>
                        <th className="w-[70px] px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">사용</th>
                        <th className="w-[70px] px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">등록</th>
                        <th className="w-[70px] px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">수정</th>
                        <th className="w-[70px] px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F4F9] bg-card">
                      {systemMenus.map((menu1) => {
                        if (menu1.children && menu1.children.length > 0) {
                          return menu1.children.map((menu2, index) => {
                            const permission = menuPermissions.get(menu2.id);
                            return (
                              <tr key={menu2.id} className="transition-colors hover:bg-[#F8FAFD]">
                                {index === 0 && (
                                  <td
                                    className="px-4 py-2.5 text-[13px] font-semibold text-foreground align-top"
                                    rowSpan={menu1.children!.length}
                                  >
                                    {menu1.name}
                                  </td>
                                )}
                                <td className="px-4 py-2.5 text-[13px] text-foreground">{menu2.name}</td>
                                <td className="px-2 py-2.5 text-center">
                                  <Checkbox
                                    checked={permission?.can_use || false}
                                    onCheckedChange={(c) => handlePermissionChange(menu2.id, 'can_use', c === true)}
                                  />
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  <Checkbox
                                    checked={permission?.can_create || false}
                                    onCheckedChange={(c) => handlePermissionChange(menu2.id, 'can_create', c === true)}
                                  />
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  <Checkbox
                                    checked={permission?.can_edit || false}
                                    onCheckedChange={(c) => handlePermissionChange(menu2.id, 'can_edit', c === true)}
                                  />
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  <Checkbox
                                    checked={permission?.can_delete || false}
                                    onCheckedChange={(c) => handlePermissionChange(menu2.id, 'can_delete', c === true)}
                                  />
                                </td>
                              </tr>
                            );
                          });
                        }
                        return (
                          <tr key={menu1.id} className="transition-colors hover:bg-[#F8FAFD]">
                            <td className="px-4 py-2.5 text-[13px] font-semibold text-foreground" colSpan={2}>
                              {menu1.name}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <Checkbox
                                checked={menuPermissions.get(menu1.id)?.can_use || false}
                                onCheckedChange={(c) => handlePermissionChange(menu1.id, 'can_use', c === true)}
                              />
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <Checkbox
                                checked={menuPermissions.get(menu1.id)?.can_create || false}
                                onCheckedChange={(c) => handlePermissionChange(menu1.id, 'can_create', c === true)}
                              />
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <Checkbox
                                checked={menuPermissions.get(menu1.id)?.can_edit || false}
                                onCheckedChange={(c) => handlePermissionChange(menu1.id, 'can_edit', c === true)}
                              />
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <Checkbox
                                checked={menuPermissions.get(menu1.id)?.can_delete || false}
                                onCheckedChange={(c) => handlePermissionChange(menu1.id, 'can_delete', c === true)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* 사용자 목록 */}
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between gap-2 border-b border-[#EEF1F6] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="text-[14px] font-bold leading-tight text-foreground">소속 사용자</div>
                    <span className="text-[12px] text-muted-foreground">{groupUsers.length}명</span>
                  </div>
                  <Button onClick={() => setShowUserModal(true)} size="sm" className="gap-2">
                    <UserPlus className="h-3.5 w-3.5" />
                    사용자 추가
                  </Button>
                </div>

                {groupUsers.length === 0 ? (
                  <div className="py-10 text-center text-[13px] text-muted-foreground">
                    할당된 사용자가 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                          <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">이름</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">이메일</th>
                          <th className="w-[60px] px-4 py-2.5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F4F9] bg-card">
                        {groupUsers.map((user) => (
                          <tr key={user.id} className="transition-colors hover:bg-[#F8FAFD]">
                            <td className="px-4 py-2.5 text-[13px] font-semibold text-foreground truncate">
                              {user.user_name || <span className="text-[#CBD5E1]">-</span>}
                            </td>
                            <td className="px-4 py-2.5 text-[13px] text-foreground truncate">
                              {user.user_email}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRemoveUserTarget(user)}
                                className="h-7 w-7 p-0 text-[#94A3B8] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                                title="제거"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>

      {/* 그룹 추가/수정 모달 */}
      <Dialog open={showGroupModal} onOpenChange={(open) => { if (!open) setShowGroupModal(false); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{isEditingGroup ? '권한 그룹 수정' : '권한 그룹 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="group-code" className="text-[12.5px] font-semibold">
                  코드 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="group-code"
                  value={groupForm.code}
                  onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value })}
                  placeholder="예: 0001"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="group-category" className="text-[12.5px] font-semibold">구분</Label>
                <Input
                  id="group-category"
                  value={groupForm.category}
                  onChange={(e) => setGroupForm({ ...groupForm, category: e.target.value })}
                  placeholder="예: 관리"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group-name" className="text-[12.5px] font-semibold">
                그룹명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="group-name"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder="예: 시스템관리자"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group-desc" className="text-[12.5px] font-semibold">설명</Label>
              <Textarea
                id="group-desc"
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                rows={3}
                placeholder="권한 그룹에 대한 설명"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowGroupModal(false)}>취소</Button>
            <Button onClick={handleSaveGroup}>{isEditingGroup ? '수정' : '생성'}</Button>
          </DialogFooter>
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

      {/* 그룹 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteGroupTarget}
        onOpenChange={(open) => { if (!open) setDeleteGroupTarget(null); }}
        title="권한 그룹 삭제"
        description={
          <span>
            <span className="font-semibold">"{deleteGroupTarget?.name}"</span> 권한 그룹을 삭제하시겠습니까?
            <br />
            소속된 사용자의 권한이 함께 제거됩니다.
          </span>
        }
        confirmText="삭제"
        variant="destructive"
        onConfirm={handleDeleteGroup}
      />

      {/* 사용자 제거 확인 */}
      <ConfirmDialog
        open={!!removeUserTarget}
        onOpenChange={(open) => { if (!open) setRemoveUserTarget(null); }}
        title="사용자 제거"
        description={
          <span>
            <span className="font-semibold">{removeUserTarget?.user_name || removeUserTarget?.user_email}</span>님을
            이 권한 그룹에서 제거하시겠습니까?
          </span>
        }
        confirmText="제거"
        variant="destructive"
        onConfirm={handleRemoveUser}
      />
    </PageContainer>
  );
};

// 사용자 추가 모달
interface UserAddModalProps {
  open: boolean;
  onClose: () => void;
  churchUsers: ChurchUser[];
  groupUsers: GroupUser[];
  onAdd: (userIds: string[]) => void;
}

const UserAddModal: React.FC<UserAddModalProps> = ({ open, onClose, churchUsers, groupUsers, onAdd }) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const availableUsers = useMemo(() => {
    const groupUserIds = new Set(groupUsers.map(gu => gu.user_id));
    const search = searchTerm.toLowerCase();
    return churchUsers.filter(user => {
      if (groupUserIds.has(user.id)) return false;
      if (!search) return true;
      return (
        user.email.toLowerCase().includes(search) ||
        (user.full_name && user.full_name.toLowerCase().includes(search)) ||
        (user.username && user.username.toLowerCase().includes(search))
      );
    });
  }, [churchUsers, groupUsers, searchTerm]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAdd = () => {
    if (selectedUserIds.length === 0) {
      toast({ title: '안내', description: '추가할 사용자를 선택해주세요.' });
      return;
    }
    onAdd(selectedUserIds);
    setSelectedUserIds([]);
    setSearchTerm('');
  };

  const handleClose = () => {
    setSelectedUserIds([]);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>사용자 추가</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            type="text"
            placeholder="이름·이메일 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto rounded-[8px] border border-border">
          {availableUsers.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-muted-foreground">
              {searchTerm ? '검색 결과가 없습니다.' : '추가할 수 있는 사용자가 없습니다.'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-[#F8FAFD]">
                <tr className="border-b border-[#EEF1F6]">
                  <th className="w-[44px] px-3 py-2.5"></th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">이름</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">이메일</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">역할</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {availableUsers.map((user) => {
                  const checked = selectedUserIds.includes(user.id);
                  return (
                    <tr
                      key={user.id}
                      onClick={() => handleToggleUser(user.id)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        checked ? 'bg-[#EEF3FC] hover:bg-[#E0EAFA]' : 'hover:bg-[#F8FAFD]'
                      )}
                    >
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => handleToggleUser(user.id)}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-[13px] font-semibold text-foreground truncate">
                        {user.full_name || user.username || <span className="text-[#CBD5E1]">-</span>}
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-foreground truncate">{user.email}</td>
                      <td className="px-3 py-2.5 text-[13px] text-muted-foreground">{user.role}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between sm:gap-2">
          <span className="text-[12px] text-muted-foreground">
            {selectedUserIds.length}명 선택
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>취소</Button>
            <Button onClick={handleAdd} disabled={selectedUserIds.length === 0}>
              추가
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionGroupManagement;
