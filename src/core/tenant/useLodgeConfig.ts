import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LodgeConfigData {
  id: string;
  lodge_name: string;
  lodge_number: string;
  orient: string;
  potencia: string;
  logotipo_url: string;
  mensalidade_padrao: number;
  dia_vencimento: number;
  meses_tolerancia_inadimplencia: number;
  permitir_juros: boolean;
  percentual_multa: number;
  percentual_juros: number;
  permitir_lancamento_retroativo: boolean;
  exigir_aprovacao_tesouraria: boolean;
  notificar_inadimplencia: boolean;
}

const defaults: LodgeConfigData = {
  id: "",
  lodge_name: "",
  lodge_number: "",
  orient: "",
  potencia: "",
  logotipo_url: "",
  mensalidade_padrao: 0,
  dia_vencimento: 10,
  meses_tolerancia_inadimplencia: 3,
  permitir_juros: false,
  percentual_multa: 2,
  percentual_juros: 1,
  permitir_lancamento_retroativo: true,
  exigir_aprovacao_tesouraria: false,
  notificar_inadimplencia: true,
};

/**
 * Fetches lodge_config once on mount.
 * Returns current config values to be used as defaults/suggestions.
 */
export function useLodgeConfig() {
  const [config, setConfig] = useState<LodgeConfigData>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("lodge_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) {
        setConfig({ ...defaults, ...(data as any) });
      }
      setLoading(false);
    })();
  }, []);

  return { config, loading };
}
