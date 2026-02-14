import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
}

interface TenantContextValue {
  tenant: Tenant | null;
  tenants: Tenant[];
  loading: boolean;
  setCurrentTenant: (tenantId: string) => void;
  refreshTenants: () => Promise<void>;
  tenantRole: string | null;
  isTenantAdmin: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(() => localStorage.getItem("gamify_tenant_id"));
  const [tenantRole, setTenantRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTenants = useCallback(async () => {
    if (!user) {
      setTenants([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("tenants").select("*");
    setTenants((data as Tenant[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refreshTenants();
  }, [refreshTenants]);

  // Fetch role for current tenant
  useEffect(() => {
    if (!user || !tenantId) {
      setTenantRole(null);
      return;
    }
    supabase
      .from("tenant_users")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setTenantRole(data?.role ?? null);
      });
  }, [user, tenantId]);

  const setCurrentTenant = useCallback((id: string) => {
    setTenantId(id);
    localStorage.setItem("gamify_tenant_id", id);
  }, []);

  const tenant = tenants.find((t) => t.id === tenantId) ?? null;
  const isTenantAdmin = tenantRole === "owner" || tenantRole === "admin";

  return (
    <TenantContext.Provider value={{ tenant, tenants, loading, setCurrentTenant, refreshTenants, tenantRole, isTenantAdmin }}>
      {children}
    </TenantContext.Provider>
  );
}
