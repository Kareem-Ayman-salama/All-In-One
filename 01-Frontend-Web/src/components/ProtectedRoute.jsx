import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { applicationRoleForMembership } from "../domain/organization";

export function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();
  const { loading, memberships, activeMembership } = useOrganization();
  const location = useLocation();
  const requestedPath = `${location.pathname}${location.search}`;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: requestedPath }} />;
  }

  if (loading && user.role !== "super-admin") return null;

  if (user.role !== "super-admin" && memberships.length === 0 && !["/no-workspace", "/workspaces"].includes(location.pathname)) {
    return <Navigate to="/no-workspace" replace />;
  }

  const effectiveRole = user.role === "super-admin"
    ? "super-admin"
    : activeMembership
      ? applicationRoleForMembership(activeMembership.role)
      : user.role;

  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    return <Navigate to={effectiveRole === "tenant-admin" ? "/tenant-admin" : effectiveRole === "end-user" ? "/end-user" : "/super-admin"} replace />;
  }

  return <Outlet />;
}
