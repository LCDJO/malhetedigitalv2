import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePortalMember } from "@/core/tenant/usePortalMember";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, ShieldCheck } from "lucide-react";

interface Ata { id: string; numero: string | null; titulo: string | null; publicada_em: string | null; hash_integridade: string | null; versao_atual: number; }
interface Bloco { id: string; tipo: string; ordem: number; titulo: string | null; conteudo: string | null; }
interface Assinatura { id: string; papel: string; assinado_em: string; user_id: string; }

export default function PortalAtas() {
  const { member } = usePortalMember();
  const tenantId = member?.tenant_id;
  const [atas, setAtas] = useState<Ata[]>([]);
  const [sel, setSel] = useState<Ata | null>(null);
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);

  useEffect(() => {
    if (!tenantId) return;
    supabase.from("atas").select("id, numero, titulo, publicada_em, hash_integridade, versao_atual")
      .eq("tenant_id", tenantId).eq("estado", "publicada")
      .order("publicada_em", { ascending: false })
      .then(({ data }) => data && setAtas(data as Ata[]));
  }, [tenantId]);

  useEffect(() => {
    if (!sel) return;
    supabase.from("blocos_ata").select("*").eq("ata_id", sel.id).order("ordem")
      .then(({ data }) => data && setBlocos(data as Bloco[]));
    supabase.from("assinaturas_ata").select("*").eq("ata_id", sel.id)
      .then(({ data }) => data && setAssinaturas(data as Assinatura[]));
  }, [sel]);

  if (sel) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => setSel(null)}><ArrowLeft className="h-4 w-4 mr-2"/>Voltar</Button>
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <FileText className="h-6 w-6"/>{sel.titulo || `Ata nº ${sel.numero ?? "—"}`}
          </h1>
          <div className="flex gap-2 mt-2 items-center text-sm text-muted-foreground">
            <Badge variant="default">Publicada</Badge>
            <Badge variant="outline">v{sel.versao_atual}</Badge>
            {sel.publicada_em && <span>{new Date(sel.publicada_em).toLocaleDateString("pt-BR")}</span>}
          </div>
        </div>
        {blocos.map(b => (
          <Card key={b.id}>
            <CardHeader className="py-3"><CardTitle className="text-base">{b.titulo}</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">{b.conteudo || <em className="text-muted-foreground">—</em>}</CardContent>
          </Card>
        ))}
        {assinaturas.length > 0 && (
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>Assinaturas</CardTitle></CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {assinaturas.map(a => (
                  <li key={a.id}>{a.papel} — {new Date(a.assinado_em).toLocaleString("pt-BR")}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {sel.hash_integridade && (
          <p className="text-xs text-muted-foreground break-all">Hash SHA-256: {sel.hash_integridade}</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-serif font-bold">Atas Publicadas</h1>
        <p className="text-muted-foreground text-sm">Atas oficiais da Loja, com hash de integridade.</p>
      </div>
      {atas.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhuma ata publicada.</p>
      ) : (
        <div className="grid gap-3">
          {atas.map(a => (
            <Card key={a.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSel(a)}>
              <CardContent className="py-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{a.titulo || `Ata nº ${a.numero ?? "—"}`}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.publicada_em && new Date(a.publicada_em).toLocaleDateString("pt-BR")} • v{a.versao_atual}
                  </div>
                </div>
                <Badge variant="outline">Ler</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
