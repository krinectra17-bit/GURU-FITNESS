import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell } from 'lucide-react';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'member';
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  // Wait until session AND role are completely verified before deciding access
  if (isLoading || (user && role === null)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gym-dark text-white space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-gym-red border-t-transparent animate-spin flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-gym-red" />
        </div>
        <p className="text-xs uppercase tracking-widest text-gym-muted font-display font-semibold">
          Verifying Permissions...
        </p>
      </div>
    );
  }

  // If user is not authenticated, redirect to login and preserve destination
  if (!user) {
    const returnPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnPath}`} replace />;
  }

  // Diagnostic logging for ProtectedRoute evaluation
  if (user && role) {
    console.log('[Guru Fitness Auth] ProtectedRoute evaluation:', {
      path: location.pathname,
      requiredRole: requiredRole || 'none',
      currentRole: role,
      userId: user.id
    });
  }

  // If route requires admin role and current user is NOT admin
  if (requiredRole === 'admin' && role !== 'admin') {
    console.warn('[Guru Fitness Auth] ProtectedRoute: Access to admin route denied. Redirecting to /dashboard', {
      path: location.pathname,
      requiredRole,
      currentRole: role,
      userId: user.id
    });
    return <Navigate to="/dashboard" replace />;
  }

  // If route is member-only and current user is an admin
  if (requiredRole === 'member' && role === 'admin') {
    console.log('[Guru Fitness Auth] ProtectedRoute: Admin accessed member route. Redirecting to /admin', {
      path: location.pathname
    });
    return <Navigate to="/admin" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
