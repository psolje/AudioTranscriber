import { ReactNode } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { admin, isLoading } = useAdminAuth();
  const [location] = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!admin) {
    return <Redirect to="/admin/login" state={{ from: location }} />;
  }
  
  if (!admin.isAdmin) {
    return <Redirect to="/" />;
  }
  
  return <>{children}</>;
}