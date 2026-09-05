import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { RoleCode } from "../types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: RoleCode[];
  // A finer-grained gate on top of allowedRoles: within an allowed role, the
  // logged-in employee must also be configured (matrix cell / skill) for
  // this specific module — e.g. a PAINT user who isn't set up for Paint Out
  // shouldn't reach /paint-out even though their role passes allowedRoles.
  requiredModule?: string;
}

export function ProtectedRoute({ children, allowedRoles, requiredModule }: ProtectedRouteProps) {
  const { isAuthenticated, user, capabilities, capabilitiesLoading } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/welcome" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center text-slate-600">
        <h1 className="text-xl font-semibold text-slate-800">Access denied</h1>
        <p className="mt-2">Your role ({user.role}) does not have access to this page.</p>
      </div>
    );
  }

  if (requiredModule) {
    if (capabilitiesLoading) {
      return null;
    }
    if (!capabilities.includes(requiredModule)) {
      return (
        <div className="p-8 text-center text-slate-600">
          <h1 className="text-xl font-semibold text-slate-800">Not configured for this stage</h1>
          <p className="mt-2">
            Your account isn't set up for this module yet. Ask Admin to configure it via the
            assignment matrix/skills.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
