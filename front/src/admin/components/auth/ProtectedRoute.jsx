import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { hasAccess } from "../../config/navigation";

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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
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
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Check if user has access to the current path based on navigation config
  if (!hasAccess(user.role, location.pathname, user.isMasterSales || false)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
