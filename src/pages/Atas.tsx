import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserTenant } from "@/core/tenant";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, FileText, Lock, ArrowLeft, Save, ShieldCheck, MessageSquarePlus, Sparkles, Download, FilePlus2 } from "lucide-react";
import { gerarBlocosAbertura } from "@/lib/ataAutoBlocks";
import { exportAtaPdf } from "@/lib/ataPdf";

type Estado = "rascunho" | "revisao" | "leitura" | "aprovada" | "travada" | "publicada" | "retificada";
type BlocoTipo = "cabecalho" | "abertura" | "expediente" | "saco_propostas" | "ordem_dia" | "tempo_estudos" | "tronco" | "palavra_bem" | "encerramento" | "outros";

const BLOCO_LABELS: Record<BlocoTipo, string> = {
  cabecalho: "Cabeçalho",
  abertura: "Abertura dos Trabalhos",
  expediente: "Expediente",
  saco_propostas: "Saco de Propostas",
  ordem_dia: "Ordem do Dia",
  tempo_estudos: "Tempo de Estudos",
  tronco: "Tronco de Beneficência",
  palavra_bem: "Palavra a Bem da Ordem",
  encerramento: "Encerramento",
  outros: "Outros",
};
const BLOCOS_PADRAO: BlocoTipo[] = ["cabecalho","abertura","expediente","saco_propostas","ordem_dia","tempo_estudos","tronco","palavra_bem","encerramento"];

const ESTADO_COLOR: Record<Estado, string> = {
  rascunho: "secondary", revisao: "default", leitura: "default",
  aprovada: "default", travada: "destructive", publicada: "default", retificada: "outline",
} as Record<Estado, string>;

const PROXIMO_ESTADO: Record<Estado, Estado | null> = {
  rascunho: "revisao", revisao: "leitura", leitura: "aprovada",
  aprovada: "travada", travada: "publicada", publicada: null, retificada: null,
};

interface Ata { id: string; numero: string | null; titulo: string | null; estado: Estado; versao_atual: number; sessao_id: string; created_at: string; publicada_em?: string | null; travada_em?: string | null; hash_integridade?: string | null; }
interface Sessao { id: string; numero: string | null; data: string; tipo: string; grau: number; }
interface Bloco { id: string; tipo: BlocoTipo; ordem: number; titulo: string | null; conteudo: string | null; }
interface Assinatura { id: string; papel: string; assinado_em: string; user_id: string; versao: number; }
const PAPEIS = ["Venerável Mestre", "Orador", "Secretário", "1º Vigilante", "2º Vigilante"];

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function Atas() {
  const { tenantId, loading: tLoading } = useUserTenant();
  const { config: lodgeConfig } = useLodgeConfig();
  const [atas, setAtas] = useState<Ata[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [selected, setSelected] = useState<Ata | null>(null);
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [open, setOpen] = useState(false);
  const [nova, setNova] = useState({ sessao_id: "", numero: "", titulo: "" });
  const [manifesto, setManifesto] = useState("");
  const [papel, setPapel] = useState(PAPEIS[0]);
  const [retOpen, setRetOpen] = useState(false);
  const [retMotivo, setRetMotivo] = useState("");

  const load = async () => {
    if (!tenantId) return;
    const [a, s] = await Promise.all([
      supabase.from("atas").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("sessoes").select("id, numero, data, tipo, grau").eq("tenant_id", tenantId).order("data", { ascending: false }),
    ]);
    if (a.data) setAtas(a.data as Ata[]);
    if (s.data) setSessoes(s.data as Sessao[]);
  };

  const loadBlocos = async (ataId: string) => {
    const { data } = await supabase.from("blocos_ata").select("*").eq("ata_id", ataId).order("ordem");
    if (data) setBlocos(data as Bloco[]);
  };

  const loadAssinaturas = async (ataId: string) => {
    const { data } = await supabase.from("assinaturas_ata").select("*").eq("ata_id", ataId).order("assinado_em");
    if (data) setAssinaturas(data as Assinatura[]);
  };

  useEffect(() => { if (tenantId) load(); }, [tenantId]);
  useEffect(() => { if (selected) { loadBlocos(selected.id); loadAssinaturas(selected.id); } }, [selected]);

  const criarAta = async () => {
    if (!tenantId || !nova.sessao_id) return toast.error("Sessão é obrigatória");
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("atas").insert({
      tenant_id: tenantId, sessao_id: nova.sessao_id,
      numero: nova.numero || null, titulo: nova.titulo || null,
      created_by: user?.id,
    }).select().single();
    if (error) return toast.error(error.message);
    // cria blocos padrão REAA
    const blocosInsert = BLOCOS_PADRAO.map((tipo, i) => ({
      tenant_id: tenantId, ata_id: data.id, tipo, ordem: i, titulo: BLOCO_LABELS[tipo], conteudo: "",
    }));
    await supabase.from("blocos_ata").insert(blocosInsert);
    toast.success("Ata criada com blocos REAA");
    setOpen(false);
    setNova({ sessao_id: "", numero: "", titulo: "" });
    load();
  };

  const salvarBloco = async (bloco: Bloco, conteudo: string) => {
    const { error } = await supabase.from("blocos_ata").update({ conteudo }).eq("id", bloco.id);
    if (error) return toast.error(error.message);
    toast.success("Bloco salvo");
    if (selected) loadBlocos(selected.id);
  };

  const avancarEstado = async () => {
    if (!selected) return;
    const proximo = PROXIMO_ESTADO[selected.estado];
    if (!proximo) return toast.info("Estado final");

    // Ao travar, gera hash + snapshot na versoes_ata
    if (proximo === "travada") {
      const snapshot = { ata: selected, blocos };
      const hash = await sha256(JSON.stringify(snapshot));
      const { data: { user } } = await supabase.auth.getUser();
      const vErr = await supabase.from("versoes_ata").insert([{
        tenant_id: tenantId!, ata_id: selected.id, versao: selected.versao_atual,
        snapshot: JSON.parse(JSON.stringify(snapshot)), hash, motivo: "Travamento da ata", created_by: user?.id,
      }]);
      if (vErr.error) return toast.error(vErr.error.message);
      await supabase.from("atas").update({
        estado: proximo, hash_integridade: hash, travada_em: new Date().toISOString(),
      }).eq("id", selected.id);
    } else if (proximo === "publicada") {
      await supabase.from("atas").update({
        estado: proximo, publicada_em: new Date().toISOString(),
      }).eq("id", selected.id);
    } else {
      await supabase.from("atas").update({ estado: proximo }).eq("id", selected.id);
    }
    toast.success(`Estado: ${proximo}`);
    setSelected({ ...selected, estado: proximo });
    load();
  };

  const adicionarManifesto = async () => {
    if (!selected || !tenantId || !manifesto.trim()) return;
    const nextOrdem = blocos.length;
    const { error } = await supabase.from("blocos_ata").insert({
      tenant_id: tenantId, ata_id: selected.id, tipo: "outros", ordem: nextOrdem,
      titulo: "Manifesto / Palavra a Bem", conteudo: manifesto,
    });
    if (error) return toast.error(error.message);
    toast.success("Manifesto registrado");
    setManifesto("");
    loadBlocos(selected.id);
  };

  const assinar = async () => {
    if (!selected || !tenantId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Sessão expirada");
    const { error } = await supabase.from("assinaturas_ata").insert({
      tenant_id: tenantId, ata_id: selected.id, user_id: user.id,
      papel, versao: selected.versao_atual,
    });
    if (error) return toast.error(error.message);
    toast.success(`Assinada como ${papel}`);
    loadAssinaturas(selected.id);
  };

  const preencherAberturaAuto = async () => {
    if (!selected || !tenantId) return;
    if (!lodgeConfig.lodge_name) return toast.error("Configure os dados da Loja primeiro.");
    try {
      const result = await gerarBlocosAbertura({
        tenantId,
        sessaoId: selected.sessao_id,
        ataNumero: selected.numero,
        lodgeName: lodgeConfig.lodge_name,
        lodgeNumber: lodgeConfig.lodge_number,
        orient: lodgeConfig.orient,
        potencia: lodgeConfig.potencia,
      });
      const cab = blocos.find(b => b.tipo === "cabecalho");
      const abe = blocos.find(b => b.tipo === "abertura");
      if (cab) await supabase.from("blocos_ata").update({ conteudo: result.cabecalho }).eq("id", cab.id);
      if (abe) await supabase.from("blocos_ata").update({ conteudo: result.abertura }).eq("id", abe.id);
      toast.success(`Abertura preenchida (${result.stats.presentes} presentes, ${result.stats.visitantes} visitantes).`);
      loadBlocos(selected.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao gerar abertura.");
    }
  };

  const exportarPdf = async () => {
    if (!selected) return;
    const { data: { user } } = await supabase.auth.getUser();
    exportAtaPdf({
      config: lodgeConfig,
      ata: selected,
      blocos: blocos.map(b => ({ titulo: b.titulo, tipo: b.tipo, conteudo: b.conteudo, ordem: b.ordem })),
      assinaturas,
      emitidoPor: user?.email ?? undefined,
    });
  };

  const retificar = async () => {
    if (!selected || !tenantId || !retMotivo.trim()) return toast.error("Informe o motivo da retificação.");
    // Verifica prazo configurado
    const referencia = selected.publicada_em ? new Date(selected.publicada_em) : null;
    if (referencia && lodgeConfig && (lodgeConfig as any).dias_prazo_retificacao) {
      const prazoDias = (lodgeConfig as any).dias_prazo_retificacao as number;
      const diff = (Date.now() - referencia.getTime()) / (1000 * 60 * 60 * 24);
      if (diff > prazoDias) {
        return toast.error(`Prazo de retificação (${prazoDias} dias) expirado.`);
      }
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { data: novaAta, error } = await supabase.from("atas").insert({
      tenant_id: tenantId,
      sessao_id: selected.sessao_id,
      numero: selected.numero ? `${selected.numero}-R` : null,
      titulo: `Retificação — ${selected.titulo ?? `Ata ${selected.numero ?? ""}`}`.trim(),
      retificacao_de: selected.id,
      created_by: user?.id,
    }).select().single();
    if (error || !novaAta) return toast.error(error?.message ?? "Falha ao retificar.");
    // Clona blocos da ata original
    const clones = blocos.map(b => ({
      tenant_id: tenantId, ata_id: novaAta.id,
      tipo: b.tipo, ordem: b.ordem,
      titulo: b.titulo, conteudo: b.conteudo,
    }));
    if (clones.length) await supabase.from("blocos_ata").insert(clones);
    // Bloco de motivo
    await supabase.from("blocos_ata").insert({
      tenant_id: tenantId, ata_id: novaAta.id, tipo: "outros",
      ordem: clones.length, titulo: "Motivo da Retificação", conteudo: retMotivo,
    });
    // Marca a original como retificada
    await supabase.from("atas").update({ estado: "retificada" }).eq("id", selected.id);
    toast.success("Ata retificadora criada em rascunho.");
    setRetOpen(false);
    setRetMotivo("");
    await load();
    setSelected({ ...(novaAta as Ata) });
  };

  if (tLoading) return <div className="p-6">Carregando…</div>;

  // ── Detalhe ──
  if (selected) {
    const locked = selected.estado === "travada" || selected.estado === "publicada";
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" onClick={() => setSelected(null)}><ArrowLeft className="h-4 w-4 mr-2"/>Voltar</Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
              <FileText className="h-6 w-6"/> {selected.titulo || `Ata nº ${selected.numero ?? "—"}`}
            </h1>
            <div className="flex gap-2 mt-1">
              <Badge variant={ESTADO_COLOR[selected.estado] as "default"}>{selected.estado}</Badge>
              <Badge variant="outline">v{selected.versao_atual}</Badge>
              {locked && <Badge variant="destructive"><Lock className="h-3 w-3 mr-1"/>Bloqueada</Badge>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {!locked && (
              <Button variant="outline" onClick={preencherAberturaAuto}>
                <Sparkles className="h-4 w-4 mr-2"/>Preencher abertura
              </Button>
            )}
            <Button variant="outline" onClick={exportarPdf}>
              <Download className="h-4 w-4 mr-2"/>PDF oficial
            </Button>
            {(selected.estado === "publicada" || selected.estado === "travada") && (
              <Dialog open={retOpen} onOpenChange={setRetOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><FilePlus2 className="h-4 w-4 mr-2"/>Retificar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Retificar Ata</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Uma nova ata será criada em rascunho, vinculada a esta, e a original ficará marcada como retificada.
                    </p>
                    <div>
                      <Label>Motivo da retificação *</Label>
                      <Textarea rows={4} value={retMotivo} onChange={(e) => setRetMotivo(e.target.value)}
                        placeholder="Descreva o erro material ou omissão a corrigir…"/>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRetOpen(false)}>Cancelar</Button>
                    <Button onClick={retificar} disabled={!retMotivo.trim()}>Criar retificadora</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {PROXIMO_ESTADO[selected.estado] && (
              <Button onClick={avancarEstado}>Avançar → {PROXIMO_ESTADO[selected.estado]}</Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {blocos.map(b => (
            <BlocoEditor key={b.id} bloco={b} locked={locked} onSave={(c) => salvarBloco(b, c)}/>
          ))}
        </div>

        {selected.estado === "leitura" && (
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><MessageSquarePlus className="h-4 w-4"/>Manifesto em Sessão</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Textarea value={manifesto} onChange={(e) => setManifesto(e.target.value)} rows={3} placeholder="Registre uma palavra a bem, observação ou voto…"/>
              <Button size="sm" onClick={adicionarManifesto} disabled={!manifesto.trim()}>Registrar manifesto</Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>Assinaturas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {assinaturas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma assinatura registrada.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {assinaturas.map(a => (
                  <li key={a.id} className="flex justify-between border-b py-1">
                    <span>{a.papel} <Badge variant="outline" className="ml-1">v{a.versao}</Badge></span>
                    <span className="text-muted-foreground">{new Date(a.assinado_em).toLocaleString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            )}
            {(selected.estado === "aprovada" || selected.estado === "travada") && (
              <div className="flex gap-2 items-end pt-2 border-t">
                <div className="flex-1">
                  <Label>Papel</Label>
                  <Select value={papel} onValueChange={setPapel}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{PAPEIS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={assinar}><ShieldCheck className="h-4 w-4 mr-2"/>Assinar</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Lista ──
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-bold">Atas Maçônicas</h1>
          <p className="text-muted-foreground">Atas REAA com blocos, versionamento e máquina de estados.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2"/>Nova Ata</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Ata</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Sessão *</Label>
                <Select value={nova.sessao_id} onValueChange={(v) => setNova({...nova, sessao_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione…"/></SelectTrigger>
                  <SelectContent>
                    {sessoes.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {new Date(s.data).toLocaleDateString("pt-BR")} — {s.tipo} • Grau {s.grau}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Número</Label><Input value={nova.numero} onChange={(e) => setNova({...nova, numero: e.target.value})}/></div>
              <div><Label>Título</Label><Input value={nova.titulo} onChange={(e) => setNova({...nova, titulo: e.target.value})}/></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={criarAta}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Atas</CardTitle></CardHeader>
        <CardContent>
          {atas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma ata registrada.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Número</TableHead><TableHead>Título</TableHead>
                <TableHead>Estado</TableHead><TableHead>Versão</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {atas.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{a.numero ?? "—"}</TableCell>
                    <TableCell>{a.titulo ?? "—"}</TableCell>
                    <TableCell><Badge variant={ESTADO_COLOR[a.estado] as "default"}>{a.estado}</Badge></TableCell>
                    <TableCell>v{a.versao_atual}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => setSelected(a)}>Abrir</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BlocoEditor({ bloco, locked, onSave }: { bloco: Bloco; locked: boolean; onSave: (c: string) => void }) {
  const [val, setVal] = useState(bloco.conteudo ?? "");
  useEffect(() => { setVal(bloco.conteudo ?? ""); }, [bloco.id, bloco.conteudo]);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-base">{bloco.titulo || BLOCO_LABELS[bloco.tipo]}</CardTitle>
        {!locked && (
          <Button size="sm" variant="outline" onClick={() => onSave(val)}>
            <Save className="h-4 w-4 mr-2"/>Salvar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Textarea value={val} onChange={(e) => setVal(e.target.value)} rows={5} disabled={locked}
          placeholder={`Conteúdo de ${BLOCO_LABELS[bloco.tipo]}…`}/>
      </CardContent>
    </Card>
  );
}
