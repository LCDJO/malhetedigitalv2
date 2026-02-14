import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { AppRole, PermissionAction } from "./types";
import { permissionsMatrix, moduleAccess } from "@/core/rbac/permissions";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: { full_name: string; avatar_url: string | null } | null;
  role: AppRole | null;
  isAdmin: boolean;
  loading: boolean;
  termsAccepted: boolean | null;
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
    const { data: activeTerm } = await supabase
      .from("termos_uso")
      .select("id")
      .eq("ativo", true)
      .order("data_publicacao", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!activeTerm) {
      setTermsAccepted(true);
      return;
    }

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
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (profileData) setProfile(profileData);

    const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: userId });
    setRole(roleData ? (roleData as AppRole) : null);
  }, []);

  const refreshRole = useCallback(async () => {
    if (user) await fetchProfileAndRole(user.id);
  }, [user, fetchProfileAndRole]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
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

  const isAdmin = role === "superadmin" || role === "administrador" || role === "veneravel" || role === "secretario";

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
