import React, { createContext, useContext } from 'react';
import { MenuPermission, User, canUseMenu, canCreate, canEdit, canDelete } from '../utils/userPermissions';

interface PermissionContextType {
  user: User | null;
  permissions: MenuPermission[];
  canUseMenu: (menuPath: string) => boolean;
  canCreate: (menuPath: string) => boolean;
  canEdit: (menuPath: string) => boolean;
  canDelete: (menuPath: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: React.ReactNode;
  user: User | null;
  permissions: MenuPermission[];
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children, user, permissions }) => {
  const value: PermissionContextType = {
    user,
    permissions,
    canUseMenu: (menuPath: string) => user ? canUseMenu(user, permissions, menuPath) : false,
    canCreate: (menuPath: string) => user ? canCreate(user, permissions, menuPath) : false,
    canEdit: (menuPath: string) => user ? canEdit(user, permissions, menuPath) : false,
    canDelete: (menuPath: string) => user ? canDelete(user, permissions, menuPath) : false,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};
