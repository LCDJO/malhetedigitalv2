import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth, roleLabels } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { AceiteTermos } from "@/components/AceiteTermos";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  module?: string;
  portalRedirect?: string;
  requiredRole?: string;
}

export function ProtectedRoute({ children, module, portalRedirect, requiredRole }: Props) {
  const { user, role, loading, hasModuleAccess, termsAccepted } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { logAction } = useAuditLog();
  const loggedRef = useRef(false);

  // Log blocked access attempt when terms are pending
  useEffect(() => {
    if (user && termsAccepted === false && !loggedRef.current) {
      loggedRef.current = true;
      logAction({
        action: "ACESSO_BLOQUEADO_TERMO_PENDENTE",
        targetTable: "termos_uso",
        details: { rota_tentada: location.pathname },
      });
    }
  }, [user, termsAccepted, location.pathname, logAction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={portalRedirect || "/auth"} replace />;
  }

  // Block access until terms are accepted
  if (termsAccepted === false) {
    return <AceiteTermos />;
  }

  // Still checking terms acceptance
  if (termsAccepted === null) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Check required role (e.g. superadmin)
  if (requiredRole && role !== requiredRole) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-serif font-bold text-foreground">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Esta área requer permissão de <span className="font-semibold text-foreground">SuperAdmin</span>.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 mt-2" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  if (module && !hasModuleAccess(module)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-serif font-bold text-foreground">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            O módulo <span className="font-semibold text-foreground">{module}</span> não está disponível para o perfil{" "}
            <span className="font-semibold text-foreground">{role ? roleLabels[role] : "atual"}</span>.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Se você acredita que deveria ter acesso, entre em contato com o Administrador da Loja.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 mt-2" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
