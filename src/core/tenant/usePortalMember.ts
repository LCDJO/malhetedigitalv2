import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/core/auth";

export interface PortalMember {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  cim: string | null;
  address: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  degree: string;
  status: string;
  initiation_date: string | null;
  elevation_date: string | null;
  exaltation_date: string | null;
  master_installed: boolean;
}

interface UsePortalMemberReturn {
  member: PortalMember | null;
  loading: boolean;
  notFound: boolean;
}

export function usePortalMember(): UsePortalMemberReturn {
  const { user } = useAuth();
  const [member, setMember] = useState<PortalMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchMember = async () => {
      if (!user?.email) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("members")
        .select("id, full_name, email, phone, cpf, cim, address, avatar_url, birth_date, degree, status, initiation_date, elevation_date, exaltation_date, master_installed")
        .eq("email", user.email)
        .eq("status", "ativo")
        .maybeSingle();

      if (!data) {
        setNotFound(true);
      } else {
        setMember(data);
      }
      setLoading(false);
    };

    fetchMember();
  }, [user?.email]);

  return { member, loading, notFound };
}
