import React from 'react';
import { supabaseApiService } from '../services/supabaseApiService';

export interface UserGptLicenseStatus {
  hasLicense: boolean;
  licenseId?: string;
  assignedAt?: string;
  isActive?: boolean;
}

/**
 * Check if the current user has an active GPT license
 */
export async function checkUserGptLicense(userId: string, churchId: number): Promise<UserGptLicenseStatus> {
  try {
    // @ts-ignore - GPT license API exists but TypeScript cache issue
    const response = await supabaseApiService.gptLicenses.getUserLicenseStatus(userId, churchId);

    if (response.success && response.data) {
      return {
        hasLicense: true,
        licenseId: response.data.id,
        assignedAt: response.data.assigned_at,
        isActive: response.data.is_active
      };
    }

    return { hasLicense: false };
  } catch (error) {
    console.error('Failed to check user GPT license:', error);
    return { hasLicense: false };
  }
}

/**
 * Hook to get user's GPT license status
 */
export function useGptLicense(user: { id: string; church_id: number } | null) {
  const [licenseStatus, setLicenseStatus] = React.useState<UserGptLicenseStatus>({ hasLicense: false });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.id || !user?.church_id) {
      setLicenseStatus({ hasLicense: false });
      setLoading(false);
      return;
    }

    const checkLicense = async () => {
      setLoading(true);
      const status = await checkUserGptLicense(user.id, user.church_id);
      setLicenseStatus(status);
      setLoading(false);
    };

    checkLicense();
  }, [user?.id, user?.church_id]);

  return { licenseStatus, loading };
}

/**
 * Check if a user role should have AI features visible regardless of license
 * (System admins and church super admins always see AI features)
 */
export function shouldBypassGptLicenseCheck(userRole: string | undefined): boolean {
  if (!userRole) return false;

  const normalizedRole = userRole.toLowerCase();
  return normalizedRole === 'super_admin' ||
         normalizedRole === 'system_admin' ||
         normalizedRole === 'church_super_admin';
}