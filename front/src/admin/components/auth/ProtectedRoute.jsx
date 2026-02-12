import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { hasAccess, getDefaultRoute } from "../../config/navigation";

/**
 * Protected route component that checks authentication and role-based access
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isLoading, isLoggingOut } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a1f0f]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#15803d]/30 border-t-[#15803d]" />
      </div>
    );
  }

  // Show logout overlay while signing out
  if (isLoggingOut) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-base font-medium text-foreground">
            Signing out...
          </p>
          <p className="text-sm text-muted-foreground">
            Please wait while we securely log you out.
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  // Check if user has access to the current path based on navigation config
  if (!hasAccess(user.role, location.pathname, user.isMasterSales || false)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return children;
}
