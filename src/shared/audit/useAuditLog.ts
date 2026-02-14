import { useCallback } from "react";
import { useAuth } from "@/core/auth";

interface LogActionParams {
  action: string;
  targetTable?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}

/**
 * Hook to log sensitive actions to the audit log.
 * Fires and forgets — does not block the calling action.
 */
export function useAuditLog() {
  const { session, profile } = useAuth();

  const logAction = useCallback(
    async ({ action, targetTable, targetId, details }: LogActionParams) => {
      if (!session?.access_token) return;

      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-log?action=log`;
        await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            target_table: targetTable,
            target_id: targetId,
            details,
            user_name: profile?.full_name,
          }),
        });
      } catch {
        // Silently fail — audit logging should never block user actions
      }
    },
    [session?.access_token, profile?.full_name]
  );

  return { logAction };
}
