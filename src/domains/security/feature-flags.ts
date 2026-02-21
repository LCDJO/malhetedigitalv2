/**
 * Security Feature Flags
 *
 * Two layers:
 *   1. SECURITY_FEATURES — static config (code-level defaults)
 *   2. BUSINESS_FEATURES — dynamic per-tenant (DB-driven, future)
 *
 * Adapted from Gestão RH pattern.
 */

export const SECURITY_FEATURES = {
  /** Multi-Factor Authentication */
  MFA: {
    enabled: false,
    promptOnLogin: false,
    methods: ["totp"] as const,
  },

  /** LGPD (Lei Geral de Proteção de Dados) Compliance */
  LGPD: {
    enabled: true,
    requireConsent: true,
    dataExportEnabled: true,
    anonymizeOnDelete: false,
    consentExpiryDays: 365,
  },

  /** Data Masking for sensitive fields */
  DATA_MASKING: {
    enabled: true,
    maskedFields: {
      cpf: true,
      cim: true,
    },
  },
} as const;

export type SecurityFeatureKey = keyof typeof SECURITY_FEATURES;

/**
 * Known business feature names (future DB-driven flags).
 */
export const BUSINESS_FEATURES = [
  "portal_do_irmao",
  "tesouraria_avancada",
  "relatorios_avancados",
  "totem",
  "ads_module",
  "gamification",
] as const;

export type BusinessFeatureKey = (typeof BUSINESS_FEATURES)[number];

/** Union of all feature keys */
export type FeatureKey = SecurityFeatureKey | BusinessFeatureKey;
