/**
 * Shared Domain — Public API
 */
export * from "./types";
export { applyScope, scopedInsert } from "./scoped-query";
export type { QueryScope } from "./scoped-query";
export { secureQuery, secureInsert, buildSecureQueryScope } from "./secure-query";
