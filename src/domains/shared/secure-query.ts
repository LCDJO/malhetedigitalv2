/**
 * Secure Query Builder
 *
 * Builds query scopes from tenant context.
 * Domain services use this instead of raw QueryScope.
 *
 * ╔═══════════════════════════════════════════╗
 * ║  EVERY query gets automatic isolation:    ║
 * ║    WHERE tenant_id = currentTenantId      ║
 * ╚═══════════════════════════════════════════╝
 */

import type { QueryScope } from "./scoped-query";
import { applyScope, scopedInsert } from "./scoped-query";

/**
 * Apply security scope to a Supabase query using tenant ID.
 * This is the PREFERRED way to scope queries.
 *
 * Usage:
 *   const q = secureQuery(supabase.from('members').select('*'), tenantId);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function secureQuery<Q extends { eq: any; is: any }>(
  query: Q,
  tenantId: string,
  opts: { tenantColumn?: string } = {}
): Q {
  const scope: QueryScope = { tenantId };
  return applyScope(query, scope, opts);
}

/**
 * Build a secure INSERT payload with tenant_id injection.
 * Overrides any client-supplied tenant_id.
 */
export function secureInsert<T>(dto: T, tenantId: string): T {
  const scope: QueryScope = { tenantId };
  return scopedInsert(dto, scope);
}

/**
 * Build a QueryScope from tenantId (utility for custom cases).
 */
export function buildSecureQueryScope(tenantId: string): QueryScope {
  return { tenantId };
}
