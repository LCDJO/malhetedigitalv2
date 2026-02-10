import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  module?: string;
}

export function ProtectedRoute({ children, module }: Props) {
  const { user, loading, hasModuleAccess } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (module && !hasModuleAccess(module)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <p className="text-lg font-semibold text-foreground">Acesso Restrito</p>
        <p className="text-sm text-muted-foreground">Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  return <>{children}</>;
}
