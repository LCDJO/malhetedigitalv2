/**
 * Scoped Query Builder
 *
 * DATA ISOLATION LAYER — ensures every query automatically applies:
 *   WHERE tenant_id = scope.tenantId
 *
 * DEFENSE IN DEPTH on top of RLS policies.
 * Adapted from Gestão RH pattern (simplified: no group/company scopes).
 */

export interface QueryScope {
  tenantId: string;
}

/**
 * Apply tenant scope to a Supabase query builder.
 *
 * Usage:
 *   const query = supabase.from('members').select('*');
 *   const scoped = applyScope(query, { tenantId });
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyScope<Q extends { eq: any; is: any }>(
  query: Q,
  scope: QueryScope,
  opts: {
    tenantColumn?: string;
  } = {}
): Q {
  const { tenantColumn = "tenant_id" } = opts;
  return query.eq(tenantColumn, scope.tenantId);
}

/**
 * Create a scoped INSERT payload that automatically injects tenant_id.
 * Strips any client-supplied tenant_id to prevent injection.
 */
export function scopedInsert<T>(dto: T, scope: QueryScope): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = { ...dto } as any;
  result.tenant_id = scope.tenantId;
  return result as T;
}
