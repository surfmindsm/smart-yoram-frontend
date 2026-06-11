import React, { useState, useEffect, useMemo } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { formatDate as formatDateUtil } from '../utils/dateUtils';
import { supabaseAuthService } from '../services/supabaseAuthService';
import {
  ROLES,
  getRoleDisplayName,
  canManageUserRoles,
  isChurchSuperAdmin,
  isSuperAdmin,
  normalizeRole,
} from '../utils/userPermissions';
import { Shield, Search, UserMinus } from 'lucide-react';
import {
  Card,
  Button,
  LoadingState,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  ConfirmDialog,
  PageContainer,
  toast,
} from "./ui";
import { usePageSubtitle } from '../hooks/usePageSubtitle';
import { cn } from '../lib/utils';

interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  role?: string;
  church_id?: number;
  created_at: string;
}

// 역할별 칩 컬러
const ROLE_CHIP_CLASS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: 'bg-[#F0E6EF] text-[#8A5A86]',
  [ROLES.CHURCH_SUPER_ADMIN]: 'bg-[#EAF1FE] text-[#2563EB]',
  [ROLES.CHURCH_ADMIN]: 'bg-[#E7F6EC] text-[#16A34A]',
  [ROLES.COMMUNITY_ADMIN]: 'bg-[#FBF1E3] text-[#B45309]',
  [ROLES.MEMBER]: 'bg-[#F1F4F9] text-[#64748B]',
};

const getRoleChipClass = (role?: string) =>
  ROLE_CHIP_CLASS[role || ROLES.MEMBER] || ROLE_CHIP_CLASS[ROLES.MEMBER];

const AdminRoleManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 필터
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // 역할 변경 모달
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<string>(ROLES.MEMBER);

  // 권한 해제 확인
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await supabaseAuthService.getCurrentUser();
      if (user?.user) {
        const normalizedUser = {
          ...user.user,
          role: normalizeRole(user.user.role),
        };
        setCurrentUser(normalizedUser);
      }
    } catch (error) {
      console.error('현재 사용자 정보 로드 실패:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const cu = await supabaseAuthService.getCurrentUser();
      if (!cu || !canManageUserRoles(cu.user)) {
        throw new Error('권한이 없습니다');
      }

      let response;
      if (isSuperAdmin(cu.user)) {
        response = await supabaseApiService.users.getAll();
      } else if (isChurchSuperAdmin(cu.user)) {
        response = await supabaseApiService.users.getChurchAdmins(cu.user.church_id);
      } else {
        throw new Error('권한이 없습니다');
      }

      setUsers(response.data || []);
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableRoles = () => {
    if (!currentUser) return [];
    if (isSuperAdmin(currentUser)) {
      return [
        { value: ROLES.SUPER_ADMIN, label: getRoleDisplayName(ROLES.SUPER_ADMIN) },
        { value: ROLES.CHURCH_SUPER_ADMIN, label: getRoleDisplayName(ROLES.CHURCH_SUPER_ADMIN) },
        { value: ROLES.CHURCH_ADMIN, label: getRoleDisplayName(ROLES.CHURCH_ADMIN) },
        { value: ROLES.COMMUNITY_ADMIN, label: getRoleDisplayName(ROLES.COMMUNITY_ADMIN) },
        { value: ROLES.MEMBER, label: getRoleDisplayName(ROLES.MEMBER) },
      ];
    }
    if (isChurchSuperAdmin(currentUser)) {
      return [
        { value: ROLES.CHURCH_ADMIN, label: getRoleDisplayName(ROLES.CHURCH_ADMIN) },
        { value: ROLES.MEMBER, label: getRoleDisplayName(ROLES.MEMBER) },
      ];
    }
    return [];
  };

  const openEditModal = (user: User) => {
    if (user.id === currentUser?.id) {
      toast({ title: '안내', description: '자기 자신의 권한은 변경할 수 없습니다.' });
      return;
    }
    setEditingUser(user);
    setEditingRole(user.role || ROLES.MEMBER);
  };

  const handleRoleChange = async () => {
    if (!editingUser) return;
    if (!currentUser || !canManageUserRoles(currentUser)) {
      toast({ title: '오류', description: '권한이 없습니다.', variant: 'destructive' });
      return;
    }
    if (
      isChurchSuperAdmin(currentUser) &&
      (editingRole === ROLES.SUPER_ADMIN || editingRole === ROLES.CHURCH_SUPER_ADMIN)
    ) {
      toast({ title: '오류', description: '자신보다 높은 권한을 부여할 수 없습니다.', variant: 'destructive' });
      return;
    }

    try {
      await supabaseApiService.users.updateRole(editingUser.id, editingRole);
      if (isChurchSuperAdmin(currentUser) && editingRole === ROLES.MEMBER) {
        setUsers(users.filter(u => u.id !== editingUser.id));
      } else {
        setUsers(users.map(u => (u.id === editingUser.id ? { ...u, role: editingRole } : u)));
      }
      const actionText = editingRole === ROLES.MEMBER ? '관리자 권한이 해제되었습니다.' : '역할이 변경되었습니다.';
      toast({ title: '성공', description: actionText });
      setEditingUser(null);
    } catch (error: any) {
      console.error('역할 변경 실패:', error);
      toast({ title: '오류', description: `역할 변경 실패: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleRemoveAdmin = async () => {
    if (!removeTarget) return;
    try {
      await supabaseApiService.users.updateRole(removeTarget.id, ROLES.MEMBER);
      if (isChurchSuperAdmin(currentUser)) {
        setUsers(users.filter(u => u.id !== removeTarget.id));
      } else {
        setUsers(users.map(u => (u.id === removeTarget.id ? { ...u, role: ROLES.MEMBER } : u)));
      }
      toast({ title: '성공', description: '관리자 권한이 해제되었습니다.' });
      setRemoveTarget(null);
    } catch (error: any) {
      console.error('권한 해제 실패:', error);
      toast({ title: '오류', description: `권한 해제 실패: ${error.message}`, variant: 'destructive' });
    }
  };

  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return users.filter(user => {
      const matchesSearch =
        !search ||
        user.email.toLowerCase().includes(search) ||
        (user.name && user.name.toLowerCase().includes(search)) ||
        (user.full_name && user.full_name.toLowerCase().includes(search));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // 상단바
  usePageSubtitle(
    !loading && currentUser ? `전체 ${users.length}명` : undefined
  );

  // 권한 없을 때
  if (!loading && currentUser && !canManageUserRoles(currentUser)) {
    return (
      <PageContainer>
        <Card className="border-[#FAD9D9] bg-[#FCEBEB]">
          <div className="p-[18px]">
            <h3 className="mb-2 text-[14px] font-bold text-[#DC2626]">접근 권한 없음</h3>
            <p className="text-[13px] text-[#DC2626]">관리자 권한 관리에 접근할 수 있는 권한이 없습니다.</p>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {loading ? (
        <Card>
          <LoadingState text="관리자 목록을 불러오는 중..." />
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            {/* 검색 + 필터 바 */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF1F6] px-[16px] py-[14px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  type="text"
                  placeholder="이름·이메일 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 md:w-[320px]"
                />
              </div>

              <div className="flex-1" />

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-[38px] w-auto min-w-[160px] gap-2">
                  <span className="text-[12.5px] text-muted-foreground">역할</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {getAvailableRoles().map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 테이블 */}
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center">
                <Shield className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
                <h3 className="mb-2 text-[15px] font-bold text-foreground">
                  {searchTerm || roleFilter !== 'all' ? '조건에 맞는 사용자가 없습니다' : '관리자가 없습니다'}
                </h3>
                <p className="text-[13px] text-muted-foreground">
                  {searchTerm || roleFilter !== 'all' ? '검색어나 필터를 조정해보세요.' : '아직 등록된 관리자가 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col />
                    <col className="w-[180px]" />
                    <col className="w-[140px]" />
                    <col className="w-[180px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">사용자</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">역할</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">가입일</th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F4F9] bg-card">
                    {filteredUsers.map((user) => {
                      const isSelf = user.id === currentUser?.id;
                      return (
                        <tr
                          key={user.id}
                          className={cn(
                            'transition-colors',
                            isSelf ? 'bg-[#F8FAFD]' : 'cursor-pointer hover:bg-[#F8FAFD]'
                          )}
                          onClick={() => !isSelf && openEditModal(user)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-[11px]">
                              <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[9px] bg-[#EEF3FC] text-primary">
                                <span className="text-[13px] font-bold">
                                  {(user.full_name || user.name || 'U').charAt(0)}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-[13px] font-semibold text-foreground">
                                  {user.full_name || user.name || '이름 없음'}
                                  {isSelf && (
                                    <span className="ml-2 text-[11px] font-normal text-muted-foreground">(나)</span>
                                  )}
                                </div>
                                <div className="truncate font-mono text-[11.5px] text-[#94A3B8]">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
                              getRoleChipClass(user.role)
                            )}>
                              {getRoleDisplayName(user.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                            {formatDateUtil(user.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            {!isSelf && isChurchSuperAdmin(currentUser) && user.role !== ROLES.MEMBER && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRemoveTarget(user)}
                                className="h-8 gap-1.5 text-[12px] text-[#DC2626] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                                해제
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* 역할 안내 */}
          <div className="mt-4 flex gap-[13px] rounded-[12px] border border-[#D6E6FE] bg-[#F0F6FF] p-[18px]">
            <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[9px] bg-[#DBE8FF] text-[#2563EB]">
              <Shield className="h-[17px] w-[17px]" />
            </div>
            <div>
              <div className="mb-1 text-[13px] font-bold text-[#1E3A8A]">역할 설명</div>
              <ul className="list-disc space-y-1 pl-4 text-[12.5px] leading-[1.7] text-[#3B5BA5]">
                <li><strong>교회 최고 관리자:</strong> 모든 교회 기능 관리 + 다른 관리자 권한 부여</li>
                <li><strong>교회 관리자:</strong> 교회 관리 기능 접근 (교인 관리, 출석, 헌금 등)</li>
                <li><strong>교인:</strong> 관리자 페이지 접근 불가 (일반 앱 사용자)</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* 역할 변경 모달 */}
      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>역할 변경</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-2">
              <div className="rounded-[8px] bg-[#F8FAFD] px-3 py-2.5">
                <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">대상</div>
                <div className="mt-1 text-[14px] font-semibold text-foreground">
                  {editingUser.full_name || editingUser.name || '이름 없음'}
                </div>
                <div className="font-mono text-[11.5px] text-muted-foreground">{editingUser.email}</div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">새 역할</Label>
                <Select value={editingRole} onValueChange={setEditingRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingUser(null)}>취소</Button>
            <Button onClick={handleRoleChange}>변경</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 권한 해제 확인 */}
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
        title="관리자 권한 해제"
        description={
          <span>
            <span className="font-semibold">{removeTarget?.full_name || removeTarget?.name || '사용자'}</span>님의
            관리자 권한을 해제하시겠습니까?
            <br />
            해제 후에는 일반 교인으로 변경됩니다.
          </span>
        }
        confirmText="해제"
        variant="destructive"
        onConfirm={handleRemoveAdmin}
      />
    </PageContainer>
  );
};

export default AdminRoleManagement;
