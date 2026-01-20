import { supabaseAuthService } from './supabaseAuthService';

export interface PermissionGroup {
  id: string;
  church_id: number;
  code: string;
  category: string;
  name: string;
  description?: string;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SystemMenu {
  id: string;
  parent_id?: string;
  code: string;
  name: string;
  path?: string;
  display_order: number;
  is_active: boolean;
  children?: SystemMenu[];
}

export interface MenuPermission {
  id?: string;
  permission_group_id: string;
  menu_id: string;
  can_use: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  menu?: SystemMenu;
}

export interface GroupUser {
  id: string;
  user_id: string;
  permission_group_id: string;
  assigned_at: string;
  assigned_by?: string;
  user_email?: string;
  user_name?: string;
}

export interface ChurchUser {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  role: string;
}

// Edge Function 호출 헬퍼
const callEdgeFunction = async (action: string, body: any = {}) => {
  const token = await supabaseAuthService.getToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const functionsUrl = `${supabaseUrl}/functions/v1/permission-groups?action=${action}`;

  const response = await fetch(functionsUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
      'X-Custom-Auth': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
};

export const permissionGroupService = {
  /**
   * 권한 그룹 목록 조회
   */
  async getGroups(churchId: number): Promise<{ data: PermissionGroup[] }> {
    return await callEdgeFunction('list', { church_id: churchId });
  },

  /**
   * 권한 그룹 상세 조회
   */
  async getGroup(id: string): Promise<{ data: PermissionGroup }> {
    return await callEdgeFunction('get', { id });
  },

  /**
   * 권한 그룹 생성
   */
  async createGroup(data: Omit<PermissionGroup, 'id' | 'created_at' | 'updated_at' | 'user_count'>): Promise<{ data: PermissionGroup }> {
    return await callEdgeFunction('create', data);
  },

  /**
   * 권한 그룹 수정
   */
  async updateGroup(id: string, data: Partial<PermissionGroup>): Promise<{ data: PermissionGroup }> {
    return await callEdgeFunction('update', { id, ...data });
  },

  /**
   * 권한 그룹 삭제
   */
  async deleteGroup(id: string): Promise<{ success: boolean }> {
    return await callEdgeFunction('delete', { id });
  },

  /**
   * 시스템 메뉴 조회 (계층 구조)
   */
  async getSystemMenus(): Promise<{ data: SystemMenu[] }> {
    return await callEdgeFunction('get-menus', {});
  },

  /**
   * 권한 그룹의 메뉴 권한 조회
   */
  async getGroupPermissions(permissionGroupId: string): Promise<{ data: MenuPermission[] }> {
    return await callEdgeFunction('get-group-permissions', {
      permission_group_id: permissionGroupId
    });
  },

  /**
   * 권한 그룹의 메뉴 권한 업데이트
   */
  async updatePermissions(permissionGroupId: string, permissions: Omit<MenuPermission, 'id' | 'permission_group_id'>[]): Promise<{ data: MenuPermission[] }> {
    return await callEdgeFunction('update-permissions', {
      permission_group_id: permissionGroupId,
      permissions
    });
  },

  /**
   * 권한 그룹 사용자 조회
   */
  async getGroupUsers(permissionGroupId: string): Promise<{ data: GroupUser[] }> {
    return await callEdgeFunction('get-group-users', {
      permission_group_id: permissionGroupId
    });
  },

  /**
   * 권한 그룹에 사용자 추가
   */
  async addUsers(permissionGroupId: string, userIds: string[], assignedBy: string): Promise<{ data: GroupUser[] }> {
    return await callEdgeFunction('add-users', {
      permission_group_id: permissionGroupId,
      user_ids: userIds,
      assigned_by: assignedBy
    });
  },

  /**
   * 권한 그룹에서 사용자 제거
   */
  async removeUsers(permissionGroupId: string, userIds: string[]): Promise<{ success: boolean }> {
    return await callEdgeFunction('remove-users', {
      permission_group_id: permissionGroupId,
      user_ids: userIds
    });
  },

  /**
   * 교회의 모든 사용자 조회 (권한 그룹 할당용)
   */
  async getChurchUsers(churchId: number): Promise<{ data: ChurchUser[] }> {
    return await callEdgeFunction('get-church-users', {
      church_id: churchId
    });
  },

  /**
   * 특정 사용자의 권한 조회
   */
  async getUserPermissions(userId: string): Promise<{ data: MenuPermission[] }> {
    return await callEdgeFunction('get-user-permissions', {
      user_id: userId
    });
  }
};
