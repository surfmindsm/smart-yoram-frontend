import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { canAccessAdminDashboard, isMember, normalizeRole } from '../utils/userPermissions';
import { Button } from './ui';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await supabaseAuthService.getCurrentUser();

        if (!currentUser) {
          setIsAuthenticated(false);
          setHasAdminAccess(false);
        } else {
          setIsAuthenticated(true);

          // 사용자 역할 정규화
          const normalizedUser = {
            ...currentUser.user,
            role: normalizeRole(currentUser.user.role)
          };

          // 관리자 페이지 접근 권한 확인
          const canAccess = canAccessAdminDashboard(normalizedUser);
          setHasAdminAccess(canAccess);

          console.log('🔐 [인증 확인]', {
            user: normalizedUser.email,
            originalRole: currentUser.user.role,
            normalizedRole: normalizedUser.role,
            church_id: normalizedUser.church_id,
            canAccessAdmin: canAccess,
            isMemberRole: isMember(normalizedUser)
          });
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setIsAuthenticated(false);
        setHasAdminAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 로그인은 했지만 관리자 페이지 접근 권한이 없는 경우 (Member)
  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600 mb-4">
            관리자 페이지에 접근할 수 있는 권한이 없습니다.<br />
            교회 관리자에게 문의해주세요.
          </p>
          <Button
            onClick={() => {
              localStorage.removeItem('supabase_session');
              localStorage.removeItem('access_token');
              window.location.href = '/login';
            }}
          >
            다른 계정으로 로그인
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PrivateRoute;