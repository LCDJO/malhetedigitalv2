import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/core/auth";

/**
 * Returns the tenant_id of the current authenticated user.
 * If the user belongs to multiple tenants, returns the first one.
 */
export function useUserTenant() {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTenantId(null);
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      setTenantId(data?.tenant_id ?? null);
      setLoading(false);
    })();
  }, [user]);

  return { tenantId, loading };
}
