import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Role, useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactElement;
  allowedRoles?: Role[];
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && user?.user_type && !allowedRoles.includes(user.user_type as Role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
