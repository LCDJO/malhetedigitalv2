/**
 * Security Domain — Public API
 *
 * Single import point for all security concerns.
 * Adapted from Gestão RH pattern.
 */

// ══════════════════════════════════════
// PERMISSIONS
// ══════════════════════════════════════
export {
  PERMISSION_MATRIX,
  hasPermission,
  canAccessNavItem,
  permissionsMatrix,
  moduleAccess,
} from "./permissions";
export type { PermissionEntity, NavKey } from "./permissions";

// ══════════════════════════════════════
// ROUTE GUARD
// ══════════════════════════════════════
export { ProtectedRoute } from "./ProtectedRoute";

// ══════════════════════════════════════
// SECURE MUTATION
// ══════════════════════════════════════
export { validateMutation, secureMutation, SecurityError } from "./secure-mutation";

// ══════════════════════════════════════
// RATE LIMITER
// ══════════════════════════════════════
export { checkRateLimit, resetRateLimit, RATE_LIMITS } from "./rate-limiter";

// ══════════════════════════════════════
// FEATURE FLAGS
// ══════════════════════════════════════
export { SECURITY_FEATURES, BUSINESS_FEATURES } from "./feature-flags";
export type { SecurityFeatureKey, BusinessFeatureKey, FeatureKey } from "./feature-flags";
