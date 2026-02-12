import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "administrador" | "veneravel" | "secretario" | "tesoureiro" | "orador" | "chanceler" | "consulta";

export type PermissionAction = "read" | "write" | "approve" | "manage_users";

export const roleLabels: Record<AppRole, string> = {
  administrador: "Administrador",
  veneravel: "Venerável Mestre",
  secretario: "Secretário",
  tesoureiro: "Tesoureiro",
  orador: "Orador",
  chanceler: "Chanceler",
  consulta: "Usuário de Consulta",
};

// Granular permissions matrix: role → module → allowed actions
export const permissionsMatrix: Record<AppRole, Record<string, PermissionAction[]>> = {
  administrador: {
    dashboard: ["read", "write", "approve", "manage_users"],
    secretaria: ["read", "write", "approve", "manage_users"],
    tesouraria: ["read", "write", "approve", "manage_users"],
    chancelaria: ["read", "write", "approve", "manage_users"],
    configuracoes: ["read", "write", "approve", "manage_users"],
  },
  veneravel: {
    dashboard: ["read"],
    secretaria: ["read"],
    tesouraria: ["read", "approve"],
    chancelaria: ["read"],
    configuracoes: ["read"],
  },
  secretario: {
    dashboard: ["read"],
    secretaria: ["read", "write"],
    tesouraria: ["read"],
    chancelaria: [],
    configuracoes: [],
  },
  tesoureiro: {
    dashboard: ["read"],
    secretaria: ["read"],
    tesouraria: ["read", "write"],
    chancelaria: [],
    configuracoes: [],
  },
  orador: {
    dashboard: ["read"],
    secretaria: [],
    tesouraria: [],
    chancelaria: [],
    configuracoes: [],
  },
  chanceler: {
    dashboard: ["read"],
    secretaria: [],
    tesouraria: [],
    chancelaria: ["read", "write"],
    configuracoes: [],
  },
  consulta: {
    dashboard: ["read"],
    secretaria: [],
    tesouraria: [],
    chancelaria: [],
    configuracoes: [],
  },
};

// Derived module access (has at least "read" permission)
export const moduleAccess: Record<string, AppRole[]> = Object.keys(
  permissionsMatrix.administrador
).reduce((acc, module) => {
  acc[module] = (Object.keys(permissionsMatrix) as AppRole[]).filter(
    (role) => (permissionsMatrix[role][module]?.length ?? 0) > 0
  );
  return acc;
}, {} as Record<string, AppRole[]>);

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: { full_name: string; avatar_url: string | null } | null;
  role: AppRole | null;
  isAdmin: boolean;
  loading: boolean;
  termsAccepted: boolean | null; // null = still checking, true/false = resolved
  hasModuleAccess: (module: string) => boolean;
  hasPermission: (module: string, action: PermissionAction) => boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  acceptTerms: (termoId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);

  const checkTermsAcceptance = useCallback(async (userId: string) => {
    // Find the active term
    const { data: activeTerm } = await supabase
      .from("termos_uso")
      .select("id")
      .eq("ativo", true)
      .order("data_publicacao", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!activeTerm) {
      // No active term exists — no blocking needed
      setTermsAccepted(true);
      return;
    }

    // Check if user has accepted this specific term
    const { data: acceptance } = await supabase
      .from("aceites_termos")
      .select("id")
      .eq("usuario_id", userId)
      .eq("termo_id", activeTerm.id)
      .limit(1)
      .maybeSingle();

    setTermsAccepted(!!acceptance);
  }, []);

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch role via RPC
    const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: userId });
    if (roleData) {
      setRole(roleData as AppRole);
    } else {
      setRole(null);
    }
  }, []);

  const refreshRole = useCallback(async () => {
    if (user) await fetchProfileAndRole(user.id);
  }, [user, fetchProfileAndRole]);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Use setTimeout to prevent potential deadlock with Supabase client
        setTimeout(() => {
          fetchProfileAndRole(session.user.id);
          checkTermsAcceptance(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRole(null);
        setTermsAccepted(null);
      }
      setLoading(false);
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRole(session.user.id);
        checkTermsAcceptance(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndRole, checkTermsAcceptance]);

  const isAdmin = role === "administrador" || role === "veneravel" || role === "secretario";

  const hasModuleAccess = useCallback(
    (module: string) => {
      if (!role) return false;
      const allowed = moduleAccess[module];
      return allowed ? allowed.includes(role) : false;
    },
    [role]
  );

  const hasPermission = useCallback(
    (module: string, action: PermissionAction) => {
      if (!role) return false;
      const actions = permissionsMatrix[role]?.[module];
      return actions ? actions.includes(action) : false;
    },
    [role]
  );

  const acceptTerms = useCallback(async (termoId: string): Promise<boolean> => {
    if (!user) return false;
    const { error, data } = await supabase.from("aceites_termos").insert({
      usuario_id: user.id,
      termo_id: termoId,
    }).select("id").single();
    if (error) return false;

    // Audit log
    await supabase.from("audit_log").insert({
      user_id: user.id,
      user_name: profile?.full_name ?? user.email,
      action: "ACEITE_TERMO",
      target_table: "aceites_termos",
      target_id: data.id,
      details: { termo_id: termoId },
    });

    setTermsAccepted(true);
    return true;
  }, [user, profile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setTermsAccepted(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, isAdmin, loading, termsAccepted, hasModuleAccess, hasPermission, signOut, refreshRole, acceptTerms }}>
      {children}
    </AuthContext.Provider>
  );
}
