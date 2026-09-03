import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { RoleCode } from "../types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: RoleCode[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center text-slate-600">
        <h1 className="text-xl font-semibold text-slate-800">Access denied</h1>
        <p className="mt-2">Your role ({user.role}) does not have access to this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
