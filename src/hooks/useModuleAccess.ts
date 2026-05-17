import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useModuleAccess(tenantId: string | null, moduleKey: string) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.rpc("has_module_enabled", {
        _tenant_id: tenantId,
        _module: moduleKey,
      });
      setEnabled(Boolean(data));
      setLoading(false);
    })();
  }, [tenantId, moduleKey]);

  return { enabled, loading };
}
