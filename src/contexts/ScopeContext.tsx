/**
 * ScopeContext — Provides role-aware scope for the current tenant.
 *
 * Adapted from Gestão RH pattern.
 * Simplified: no group/company scopes (Lojas are flat tenants).
 */

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTenant } from "@/core/tenant/useUserTenant";
import { supabase } from "@/integrations/supabase/client";
import { canAccessNavItem, type NavKey } from "@/domains/security/permissions";
import type { AppRole, TenantRole } from "@/domains/shared/types";

interface ScopeContextType {
  tenantId: string | null;
  tenantRole: TenantRole | null;
  appRole: AppRole | null;
  effectiveRoles: { appRole: AppRole | null; tenantRole: TenantRole | null };
  hasRole: (...roles: Array<AppRole | TenantRole>) => boolean;
  canAccessNav: (navKey: string) => boolean;
  loading: boolean;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

export function ScopeProvider({ children }: { children: ReactNode }) {
  const { user, role: appRole } = useAuth();
  const { tenantId, loading: tenantLoading } = useUserTenant();
  const [tenantRole, setTenantRole] = useState<TenantRole | null>(null);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    if (!user || !tenantId) {
      setTenantRole(null);
      setRolesLoading(false);
      return;
    }

    const fetchTenantRole = async () => {
      setRolesLoading(true);
      const { data } = await supabase
        .from("tenant_users")
        .select("role")
        .eq("user_id", user.id)
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .maybeSingle();
      setTenantRole((data?.role as TenantRole) || null);
      setRolesLoading(false);
    };

    fetchTenantRole();
  }, [user, tenantId]);

  const effectiveRoles = useMemo(
    () => ({ appRole: appRole as AppRole | null, tenantRole }),
    [appRole, tenantRole]
  );

  const hasRole = (...roles: Array<AppRole | TenantRole>) => {
    if (appRole && roles.includes(appRole as AppRole)) return true;
    if (tenantRole && roles.includes(tenantRole as TenantRole)) return true;
    return false;
  };

  const canAccessNav = (navKey: string) => {
    return canAccessNavItem(navKey as NavKey, appRole as AppRole | null, tenantRole);
  };

  const loading = tenantLoading || rolesLoading;

  return (
    <ScopeContext.Provider
      value={{ tenantId, tenantRole, appRole: appRole as AppRole | null, effectiveRoles, hasRole, canAccessNav, loading }}
    >
      {children}
    </ScopeContext.Provider>
  );
}

export function useScope() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error("useScope must be used within ScopeProvider");
  return ctx;
}
