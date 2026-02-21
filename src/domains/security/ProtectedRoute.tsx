/**
 * Security Middleware - Route Guard
 *
 * Uses permission matrix for access checks.
 * Supports nav-level, entity-level, feature-flag, and module guards.
 *
 * Adapted from Gestão RH pattern.
 */

import { type ReactNode, useEffect, useRef } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessNavItem, type NavKey, type PermissionEntity } from "./permissions";
import { hasPermission } from "./permissions";
import type { FeatureKey } from "./feature-flags";
import { SECURITY_FEATURES } from "./feature-flags";
import { AceiteTermos } from "@/components/AceiteTermos";
import { useAuditLog } from "@/hooks/useAuditLog";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PermissionAction } from "@/domains/shared/types";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Check nav-level access (new pattern) */
  navKey?: NavKey;
  /** Check entity-level access (new pattern) */
  entity?: PermissionEntity;
  action?: PermissionAction;
  /** Gate by feature flag */
  featureFlag?: FeatureKey;
  /** Legacy: module-based access (backward compat) */
  module?: string;
  /** Legacy: required app role */
  requiredRole?: string;
  /** Custom redirect for unauthenticated users */
  portalRedirect?: string;
  /** Fallback when denied */
  fallback?: ReactNode;
}

function AccessDenied() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4 animate-fade-in">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-sm">
          Você não tem permissão para acessar esta página.
          Contate o administrador da sua Loja.
        </p>
        <Button variant="outline" size="sm" className="gap-1.5 mt-2" onClick={() => navigate("/")}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  );
}

function FeatureDisabled() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4 animate-fade-in">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted">
          <ShieldX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Módulo Indisponível</h2>
        <p className="text-muted-foreground max-w-sm">
          Este módulo não está habilitado para sua organização. Contate o administrador.
        </p>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  children,
  navKey,
  entity,
  action = "read",
  featureFlag,
  module,
  requiredRole,
  portalRedirect,
  fallback,
}: ProtectedRouteProps) {
  const { user, role, loading, hasModuleAccess, termsAccepted } = useAuth();
  const location = useLocation();
  const { logAction } = useAuditLog();
  const loggedRef = useRef(false);

  // Log blocked access when terms pending
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
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={portalRedirect || "/auth"} replace />;
  }

  // Terms acceptance gate
  if (termsAccepted === false) return <AceiteTermos />;
  if (termsAccepted === null) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Feature flag gate
  if (featureFlag) {
    const secFeature = SECURITY_FEATURES[featureFlag as keyof typeof SECURITY_FEATURES];
    if (secFeature && !(secFeature as { enabled: boolean }).enabled) {
      return <>{fallback || <FeatureDisabled />}</>;
    }
  }

  // ── New pattern: nav-level access ──
  if (navKey && !canAccessNavItem(navKey, role)) {
    return <>{fallback || <AccessDenied />}</>;
  }

  // ── New pattern: entity-level access ──
  if (entity && !hasPermission(entity, action, role)) {
    return <>{fallback || <AccessDenied />}</>;
  }

  // ── Legacy: required role ──
  if (requiredRole && role !== requiredRole) {
    return <>{fallback || <AccessDenied />}</>;
  }

  // ── Legacy: module access ──
  if (module && !hasModuleAccess(module)) {
    return <>{fallback || <AccessDenied />}</>;
  }

  return <>{children}</>;
}
