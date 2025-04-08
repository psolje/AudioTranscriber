import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Redirect, useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

/**
 * Protected route component that requires authentication
 * @param children Components to render when authenticated
 * @param adminOnly If true, route requires admin privileges
 */
export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  // Store the current path in session storage when redirecting to auth page
  useEffect(() => {
    if (!isLoading && !user) {
      try {
        sessionStorage.setItem("returnPath", window.location.pathname);
      } catch (e) {
        console.error("Failed to save return path:", e);
      }
    }
  }, [isLoading, user, setLocation]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Redirect to home if admin-only and user is not admin
  if (adminOnly && !isAdmin) {
    return <Redirect to="/" />;
  }

  // Render children when authentication passes
  return <>{children}</>;
}