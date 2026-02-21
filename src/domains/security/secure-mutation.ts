/**
 * Security Middleware - Secure Mutation Wrapper
 *
 * Pre-validates permissions and rate limits before executing mutations.
 * Domain services call this instead of checking roles directly.
 *
 * Adapted from Gestão RH pattern.
 */

import { checkRateLimit, RATE_LIMITS } from "./rate-limiter";
import type { PermissionEntity } from "./permissions";
import { hasPermission } from "./permissions";
import type { AppRole, TenantRole, PermissionAction } from "@/domains/shared/types";

export class SecurityError extends Error {
  public code: "PERMISSION_DENIED" | "RATE_LIMITED" | "UNAUTHENTICATED";
  public retryAfterMs?: number;

  constructor(
    code: "PERMISSION_DENIED" | "RATE_LIMITED" | "UNAUTHENTICATED",
    message: string,
    retryAfterMs?: number
  ) {
    super(message);
    this.name = "SecurityError";
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

interface SecureMutationOptions {
  entity: PermissionEntity;
  action: PermissionAction;
  appRole: AppRole | null;
  tenantRole?: TenantRole | null;
  rateLimitKey?: string;
  rateLimitConfig?: { windowMs: number; maxRequests: number };
}

/**
 * Validate security constraints before executing a mutation.
 * Throws SecurityError if any check fails.
 */
export function validateMutation(opts: SecureMutationOptions): void {
  const resource = `${opts.entity}:${opts.action}`;

  // Permission check
  if (!hasPermission(opts.entity, opts.action, opts.appRole, opts.tenantRole)) {
    throw new SecurityError(
      "PERMISSION_DENIED",
      `Acesso negado: ${opts.action} em ${opts.entity}.`
    );
  }

  // Rate limit check
  const rateLimitKey = opts.rateLimitKey || resource;
  const rateLimitConfig = opts.rateLimitConfig || RATE_LIMITS.create;
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, rateLimitConfig);

  if (!allowed) {
    throw new SecurityError(
      "RATE_LIMITED",
      `Muitas requisições. Tente novamente em ${Math.ceil((retryAfterMs || 0) / 1000)}s.`,
      retryAfterMs
    );
  }
}

/**
 * Wraps a mutation function with security validation.
 */
export function secureMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  getSecurityOpts: (args: TArgs) => SecureMutationOptions
): (args: TArgs) => Promise<TResult> {
  return async (args: TArgs) => {
    validateMutation(getSecurityOpts(args));
    return mutationFn(args);
  };
}
