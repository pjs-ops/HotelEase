import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserRole, User } from '../App';
import { authService } from '../lib/services';

interface ProtectedRouteProps {
  user: User | null;
  requiredRole?: UserRole;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  user, 
  requiredRole, 
  children 
}) => {
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user has the required role
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;