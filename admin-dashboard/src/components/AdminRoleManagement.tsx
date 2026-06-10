import React, { useState, useEffect } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { formatDate as formatDateUtil } from '../utils/dateUtils';
import { supabaseAuthService } from '../services/supabaseAuthService';
import {
  ROLES,
  getRoleDisplayName,
  canManageUserRoles,
  isChurchSuperAdmin,
  isSuperAdmin,
  normalizeRole
} from '../utils/userPermissions';
import {
  Users,
  Shield,
  Edit3,
  Save,
  X,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, Button, LoadingState } from "./ui/index";
import { Spinner } from "./ui/spinner";

interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  role?: string;
  church_id?: number;
  created_at: string;
}

const AdminRoleManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await supabaseAuthService.getCurrentUser();
      if (user?.user) {
        // 역할 정규화
        const normalizedUser = {
          ...user.user,
          role: normalizeRole(user.user.role)
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

      // 현재 사용자가 관리할 수 있는 사용자들만 조회
      const currentUser = await supabaseAuthService.getCurrentUser();
      if (!currentUser || !canManageUserRoles(currentUser.user)) {
        throw new Error('권한이 없습니다');
      }

      let response;
      if (isSuperAdmin(currentUser.user)) {
        // Super Admin은 모든 사용자 조회
        response = await supabaseApiService.users.getAll();
      } else if (isChurchSuperAdmin(currentUser.user)) {
        // Church Super Admin은 해당 교회의 관리자들만 조회
        response = await supabaseApiService.users.getChurchAdmins(currentUser.user.church_id);
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      if (!currentUser || !canManageUserRoles(currentUser)) {
        alert('권한이 없습니다.');
        return;
      }

      // 자기 자신의 권한은 변경할 수 없음
      if (userId === currentUser.id) {
        alert('자기 자신의 권한은 변경할 수 없습니다.');
        return;
      }

      // Church Super Admin은 자신보다 높은 권한을 부여할 수 없음
      if (isChurchSuperAdmin(currentUser) &&
          (newRole === ROLES.SUPER_ADMIN || newRole === ROLES.CHURCH_SUPER_ADMIN)) {
        alert('자신보다 높은 권한을 부여할 수 없습니다.');
        return;
      }

      await supabaseApiService.users.updateRole(userId, newRole);

      // 목록에서 member로 변경된 사용자는 제거 (Church Super Admin 뷰에서)
      if (isChurchSuperAdmin(currentUser) && newRole === ROLES.MEMBER) {
        setUsers(users.filter(user => user.id !== userId));
      } else {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        ));
      }

      setEditingUser(null);
      const actionText = newRole === ROLES.MEMBER ? '관리자 권한이 해제되었습니다' : '역할이 성공적으로 변경되었습니다';
      alert(actionText);
    } catch (error: any) {
      console.error('역할 변경 실패:', error);
      alert(`역할 변경에 실패했습니다: ${error.message}`);
    }
  };

  // 관리자 권한 해제 (member로 변경)
  const handleRemoveAdmin = async (userId: string, userName: string) => {
    if (!window.confirm(`${userName}님의 관리자 권한을 해제하시겠습니까?\n\n해제 후에는 일반 교인으로 변경됩니다.`)) {
      return;
    }
    await handleRoleChange(userId, ROLES.MEMBER);
  };

  const getAvailableRoles = () => {
    if (!currentUser) return [];

    if (isSuperAdmin(currentUser)) {
      // Super Admin은 모든 역할 할당 가능
      return [
        { value: ROLES.SUPER_ADMIN, label: getRoleDisplayName(ROLES.SUPER_ADMIN) },
        { value: ROLES.CHURCH_SUPER_ADMIN, label: getRoleDisplayName(ROLES.CHURCH_SUPER_ADMIN) },
        { value: ROLES.CHURCH_ADMIN, label: getRoleDisplayName(ROLES.CHURCH_ADMIN) },
        { value: ROLES.COMMUNITY_ADMIN, label: getRoleDisplayName(ROLES.COMMUNITY_ADMIN) },
        { value: ROLES.MEMBER, label: getRoleDisplayName(ROLES.MEMBER) }
      ];
    } else if (isChurchSuperAdmin(currentUser)) {
      // Church Super Admin은 자신보다 낮은 권한만 할당 가능
      return [
        { value: ROLES.CHURCH_ADMIN, label: getRoleDisplayName(ROLES.CHURCH_ADMIN) },
        { value: ROLES.MEMBER, label: getRoleDisplayName(ROLES.MEMBER) }
      ];
    }

    return [];
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="flex items-center gap-2 text-[23px] font-bold leading-tight tracking-[-0.02em] text-foreground">
            <Shield className="h-6 w-6" />
            관리자 권한 관리
          </h1>
        </div>
        <Card>
          <LoadingState text="관리자 목록을 불러오는 중..." />
        </Card>
      </div>
    );
  }

  if (!currentUser || !canManageUserRoles(currentUser)) {
    return (
      <div>
        <Card className="border-[#FAD9D9] bg-[#FCEBEB]">
          <CardContent className="p-[18px]">
            <h3 className="mb-2 text-[14px] font-bold text-[#DC2626]">접근 권한 없음</h3>
            <p className="text-[13px] text-[#DC2626]">관리자 권한 관리에 접근할 수 있는 권한이 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-[23px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          <Shield className="h-6 w-6" />
          {isSuperAdmin(currentUser) ? '관리자 권한 관리' : '교회 관리자 현황'}
        </h1>
        <p className="mt-[3px] text-[13px] text-muted-foreground">
          {isSuperAdmin(currentUser)
            ? '교회 관리자들의 역할과 권한을 관리합니다.'
            : '현재 지정된 교회 관리자들을 확인하고 관리할 수 있습니다.'}
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="이메일 또는 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-[38px] w-full rounded-[8px] border border-border bg-card pl-10 pr-4 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-[38px] rounded-[8px] border border-border bg-card pl-10 pr-8 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">모든 역할</option>
            {getAvailableRoles().map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 사용자 목록 */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12.5px]">
              <thead className="bg-[#FAFBFD]">
                <tr>
                  <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">사용자</th>
                  <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">현재 역할</th>
                  <th className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">가입일</th>
                  <th className="px-[18px] py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-[#FAFBFD]">
                    <td className="px-[18px] py-3 whitespace-nowrap">
                      <div className="flex items-center gap-[11px]">
                        <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[9px] bg-[#EEF3FC] text-primary">
                          <span className="text-[13px] font-bold">
                            {(user.full_name || user.name || 'U').charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {user.full_name || user.name || '이름 없음'}
                          </div>
                          <div className="font-mono text-[11.5px] text-[#94A3B8]">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-[18px] py-3 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          defaultValue={user.role || ROLES.MEMBER}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="h-[34px] rounded-[8px] border border-border bg-card px-3 text-[13px] text-foreground focus:ring-2 focus:ring-primary"
                        >
                          {getAvailableRoles().map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex rounded-full px-[11px] py-[3px] text-[11px] font-bold whitespace-nowrap ${
                          user.role === ROLES.SUPER_ADMIN ? 'bg-[#F0E6EF] text-[#8A5A86]' :
                          user.role === ROLES.CHURCH_SUPER_ADMIN ? 'bg-[#EAF1FE] text-[#2563EB]' :
                          user.role === ROLES.CHURCH_ADMIN ? 'bg-[#E7F6EC] text-[#16A34A]' :
                          user.role === ROLES.COMMUNITY_ADMIN ? 'bg-[#FBF1E3] text-[#B45309]' :
                          'bg-[#F1F4F9] text-[#64748B]'
                        }`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-[18px] py-3 whitespace-nowrap text-muted-foreground">
                      {formatDateUtil(user.created_at)}
                    </td>
                    <td className="px-[18px] py-3 whitespace-nowrap text-right">
                      {editingUser === user.id ? (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            onClick={() => setEditingUser(null)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            onClick={() => setEditingUser(user.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 px-2.5 text-primary hover:bg-accent"
                            disabled={user.id === currentUser.id}
                            title={user.id === currentUser.id ? "자기 자신의 권한은 변경할 수 없습니다" : "역할 변경"}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span className="text-[12px] font-semibold">역할 변경</span>
                          </Button>
                          {/* 자신이 아니고 Church Super Admin 권한이 있으면 관리자 해제 버튼 표시 */}
                          {user.id !== currentUser.id && isChurchSuperAdmin(currentUser) && (
                            <Button
                              onClick={() => handleRemoveAdmin(user.id, user.full_name || user.name || '사용자')}
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 px-2.5 text-[#DC2626] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                              title="관리자 권한 해제"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span className="text-[12px] font-semibold">해제</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-[13px] text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 역할 안내 — 시안의 se-tip 패턴 */}
      <div className="flex gap-[13px] rounded-[12px] border border-[#D6E6FE] bg-[#F0F6FF] p-[18px]">
        <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[9px] bg-[#DBE8FF] text-[#2563EB]">
          <Shield className="h-[17px] w-[17px]" />
        </div>
        <div>
          <div className="mb-1 text-[13px] font-bold text-[#1E3A8A]">역할 설명</div>
          <ul className="space-y-1 pl-4 text-[12.5px] leading-[1.7] text-[#3B5BA5] list-disc">
            <li><strong>교회 최고 관리자:</strong> 모든 교회 기능 관리 + 다른 관리자 권한 부여</li>
            <li><strong>교회 관리자:</strong> 교회 관리 기능 접근 (교인 관리, 출석, 헌금 등)</li>
            <li><strong>교인:</strong> 관리자 페이지 접근 불가 (일반 앱 사용자)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminRoleManagement;