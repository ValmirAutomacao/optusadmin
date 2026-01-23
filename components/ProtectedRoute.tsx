import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  isMobile: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  isMobile
}) => {
  const { user, userProfile, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Login isMobile={isMobile} />;
  }

  // Role-based access control
  if (requiredRole && userProfile) {
    const userRole = userProfile.role;
    if (!requiredRole.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar esta área.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Role necessário: {requiredRole.join(' ou ')}
            </p>
            <p className="text-sm text-gray-500">
              Seu role: {userRole}
            </p>
          </div>
        </div>
      );
    }
  }

  // Authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;