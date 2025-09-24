import React, { useState, useEffect } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
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
import { Card, CardContent } from './ui/card';

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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentUser || !canManageUserRoles(currentUser)) {
    return (
      <div className="p-6">
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">접근 권한 없음</h3>
            <p className="text-destructive">관리자 권한 관리에 접근할 수 있는 권한이 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6" />
          {isSuperAdmin(currentUser) ? '관리자 권한 관리' : '교회 관리자 현황'}
        </h2>
      </div>

      <p className="text-muted-foreground">
        {isSuperAdmin(currentUser)
          ? '교회 관리자들의 역할과 권한을 관리합니다.'
          : '현재 지정된 교회 관리자들을 확인하고 관리할 수 있습니다.'
        }
      </p>

      {/* 검색 및 필터 */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="이메일 또는 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-muted rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-muted rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
          >
            <option value="all">모든 역할</option>
            {getAvailableRoles().map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 사용자 목록 */}
      <Card className="border-muted">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-muted">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    현재 역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-muted">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Users className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {user.full_name || user.name || '이름 없음'}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          defaultValue={user.role || ROLES.MEMBER}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="border border-muted rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                        >
                          {getAvailableRoles().map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === ROLES.SUPER_ADMIN ? 'bg-purple-100 text-purple-800' :
                          user.role === ROLES.CHURCH_SUPER_ADMIN ? 'bg-blue-100 text-blue-800' :
                          user.role === ROLES.CHURCH_ADMIN ? 'bg-green-100 text-green-800' :
                          user.role === ROLES.COMMUNITY_ADMIN ? 'bg-orange-100 text-orange-800' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingUser === user.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(user.id)}
                            className="text-primary hover:text-primary/80"
                            disabled={user.id === currentUser.id}
                            title="역할 변경"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {/* 자신이 아니고 Church Super Admin 권한이 있으면 관리자 해제 버튼 표시 */}
                          {user.id !== currentUser.id && isChurchSuperAdmin(currentUser) && (
                            <button
                              onClick={() => handleRemoveAdmin(user.id, user.full_name || user.name || '사용자')}
                              className="text-destructive hover:text-destructive/80 ml-2"
                              title="관리자 권한 해제"
                            >
                              <X className="w-4 h-4" />
                            </button>
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
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-muted bg-blue-50/50">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">역할 설명</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>교회 최고 관리자:</strong> 모든 교회 기능 관리 + 다른 관리자 권한 부여</li>
            <li><strong>교회 관리자:</strong> 교회 관리 기능 접근 (교인 관리, 출석, 헌금 등)</li>
            <li><strong>교인:</strong> 관리자 페이지 접근 불가 (일반 앱 사용자)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRoleManagement;