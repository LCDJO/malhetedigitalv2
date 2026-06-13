import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserTenant } from "@/core/tenant";
import { useAuth } from "@/core/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Estado = "rascunho" | "sindicancia" | "parecer" | "escrutinio" | "aprovada" | "rejeitada" | "arquivada";

interface Proposta {
  id: string;
  tenant_id: string;
  candidato_nome: string;
  candidato_cpf: string | null;
  candidato_email: string | null;
  candidato_telefone: string | null;
  candidato_profissao: string | null;
  padrinho_member_id: string | null;
  apresentacao: string | null;
  estado: Estado;
  observacoes: string | null;
  created_at: string;
}

interface Sindicancia {
  id: string;
  proposta_id: string;
  sindicante_member_id: string;
  relatorio: string | null;
  voto: "favoravel" | "contrario" | "abstencao" | null;
  entregue_em: string | null;
}

interface Escrutinio {
  id: string;
  proposta_id: string;
  estado: "aberto" | "encerrado" | "anulado";
  aberto_em: string;
  encerrado_em: string | null;
  total_brancas: number;
  total_pretas: number;
  resultado: string | null;
}

const estadoLabel: Record<Estado, string> = {
  rascunho: "Rascunho",
  sindicancia: "Em Sindicância",
  parecer: "Parecer",
  escrutinio: "Em Escrutínio",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  arquivada: "Arquivada",
};

const ESTADOS: Estado[] = ["rascunho", "sindicancia", "parecer", "escrutinio", "aprovada", "rejeitada", "arquivada"];

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Propostas() {
  const { tenantId } = useUserTenant();
  const { user } = useAuth();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [selected, setSelected] = useState<Proposta | null>(null);
  const [sindicancias, setSindicancias] = useState<Sindicancia[]>([]);
  const [escrutinios, setEscrutinios] = useState<Escrutinio[]>([]);
  const [loading, setLoading] = useState(false);

  // Novo proposta
  const [nova, setNova] = useState({
    candidato_nome: "",
    candidato_cpf: "",
    candidato_email: "",
    candidato_telefone: "",
    candidato_profissao: "",
    padrinho_member_id: "",
    apresentacao: "",
  });

  const loadAll = async () => {
    if (!tenantId) return;
    setLoading(true);
    const [p, m] = await Promise.all([
      supabase.from("propostas_iniciacao").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("members").select("id, full_name").eq("tenant_id", tenantId).eq("status", "ativo").order("full_name"),
    ]);
    setPropostas((p.data as Proposta[]) || []);
    setMembers((m.data as { id: string; full_name: string }[]) || []);
    setLoading(false);
  };

  const loadDetail = async (proposta: Proposta) => {
    setSelected(proposta);
    const [s, e] = await Promise.all([
      supabase.from("sindicancias").select("*").eq("proposta_id", proposta.id).order("created_at"),
      supabase.from("escrutinios").select("*").eq("proposta_id", proposta.id).order("aberto_em", { ascending: false }),
    ]);
    setSindicancias((s.data as Sindicancia[]) || []);
    setEscrutinios((e.data as Escrutinio[]) || []);
  };

  useEffect(() => { loadAll(); }, [tenantId]);

  const criarProposta = async () => {
    if (!tenantId || !nova.candidato_nome.trim()) {
      toast.error("Informe o nome do candidato.");
      return;
    }
    const { error } = await supabase.from("propostas_iniciacao").insert({
      tenant_id: tenantId,
      candidato_nome: nova.candidato_nome,
      candidato_cpf: nova.candidato_cpf || null,
      candidato_email: nova.candidato_email || null,
      candidato_telefone: nova.candidato_telefone || null,
      candidato_profissao: nova.candidato_profissao || null,
      padrinho_member_id: nova.padrinho_member_id || null,
      apresentacao: nova.apresentacao || null,
      estado: "rascunho",
      created_by: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Proposta criada.");
    setNova({ candidato_nome: "", candidato_cpf: "", candidato_email: "", candidato_telefone: "", candidato_profissao: "", padrinho_member_id: "", apresentacao: "" });
    loadAll();
  };

  const mudarEstado = async (estado: Estado) => {
    if (!selected) return;
    const { error } = await supabase.from("propostas_iniciacao").update({ estado }).eq("id", selected.id);
    if (error) return toast.error(error.message);
    toast.success("Estado atualizado.");
    const updated = { ...selected, estado };
    setSelected(updated);
    setPropostas((prev) => prev.map((p) => p.id === selected.id ? updated : p));
  };

  const adicionarSindicante = async (memberId: string) => {
    if (!selected || !tenantId) return;
    const { error } = await supabase.from("sindicancias").insert({
      tenant_id: tenantId,
      proposta_id: selected.id,
      sindicante_member_id: memberId,
    });
    if (error) return toast.error(error.message);
    toast.success("Sindicante designado.");
    loadDetail(selected);
  };

  const salvarParecer = async (s: Sindicancia, relatorio: string, voto: Sindicancia["voto"]) => {
    const { error } = await supabase.from("sindicancias").update({
      relatorio, voto, entregue_em: new Date().toISOString(),
    }).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Parecer registrado.");
    if (selected) loadDetail(selected);
  };

  const abrirEscrutinio = async () => {
    if (!selected || !tenantId) return;
    const { error } = await supabase.from("escrutinios").insert({
      tenant_id: tenantId,
      proposta_id: selected.id,
      estado: "aberto",
      created_by: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    await mudarEstado("escrutinio");
    toast.success("Escrutínio aberto.");
    loadDetail(selected);
  };

  const votar = async (escrutinio: Escrutinio, cor: "branca" | "preta") => {
    if (!user || !tenantId) return;
    const voterHash = await sha256(`${escrutinio.id}:${user.id}`);
    const { error } = await supabase.from("escrutinio_votos").insert({
      tenant_id: tenantId,
      escrutinio_id: escrutinio.id,
      voter_hash: voterHash,
      cor,
    });
    if (error) {
      if (error.code === "23505") return toast.error("Você já votou neste escrutínio.");
      return toast.error(error.message);
    }
    toast.success("Voto registrado.");
  };

  const encerrarEscrutinio = async (escrutinio: Escrutinio) => {
    const { data: votos, error: vErr } = await supabase
      .from("escrutinio_votos")
      .select("cor")
      .eq("escrutinio_id", escrutinio.id);
    if (vErr) return toast.error(vErr.message);
    const brancas = (votos || []).filter((v) => v.cor === "branca").length;
    const pretas = (votos || []).filter((v) => v.cor === "preta").length;
    const resultado = pretas === 0 ? "Aprovado por unanimidade" : pretas <= 2 ? "Aprovado com restrições" : "Rejeitado";
    const { error } = await supabase.from("escrutinios").update({
      estado: "encerrado",
      encerrado_em: new Date().toISOString(),
      total_brancas: brancas,
      total_pretas: pretas,
      resultado,
    }).eq("id", escrutinio.id);
    if (error) return toast.error(error.message);
    toast.success(`Escrutínio encerrado: ${resultado}`);
    await mudarEstado(pretas > 2 ? "rejeitada" : "aprovada");
    if (selected) loadDetail(selected);
  };

  const memberName = useMemo(() => {
    const map = new Map(members.map((m) => [m.id, m.full_name]));
    return (id: string | null) => (id ? map.get(id) ?? "—" : "—");
  }, [members]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-serif tracking-tight">Propostas de Iniciação</h1>
        <p className="text-muted-foreground">Ficha de proposta, sindicância e escrutínio secreto.</p>
      </header>

      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista">Propostas</TabsTrigger>
          <TabsTrigger value="nova">Nova Proposta</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
            <Card>
              <CardHeader><CardTitle>Lista</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
                {!loading && propostas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma proposta.</p>}
                {propostas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadDetail(p)}
                    className={`w-full text-left p-3 rounded border hover:bg-accent transition ${selected?.id === p.id ? "bg-accent" : ""}`}
                  >
                    <div className="font-medium">{p.candidato_nome}</div>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline">{estadoLabel[p.estado]}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {selected ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selected.candidato_nome}</span>
                    <Badge>{estadoLabel[selected.estado]}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <section className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">CPF:</span> {selected.candidato_cpf || "—"}</div>
                    <div><span className="text-muted-foreground">E-mail:</span> {selected.candidato_email || "—"}</div>
                    <div><span className="text-muted-foreground">Telefone:</span> {selected.candidato_telefone || "—"}</div>
                    <div><span className="text-muted-foreground">Profissão:</span> {selected.candidato_profissao || "—"}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">Padrinho:</span> {memberName(selected.padrinho_member_id)}</div>
                    {selected.apresentacao && (
                      <div className="col-span-2"><span className="text-muted-foreground">Apresentação:</span><p className="mt-1 whitespace-pre-wrap">{selected.apresentacao}</p></div>
                    )}
                  </section>

                  <section className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={selected.estado} onValueChange={(v) => mudarEstado(v as Estado)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((e) => <SelectItem key={e} value={e}>{estadoLabel[e]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Sindicância</h3>
                      <Select onValueChange={adicionarSindicante}>
                        <SelectTrigger className="w-64"><SelectValue placeholder="Designar sindicante…" /></SelectTrigger>
                        <SelectContent>
                          {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {sindicancias.length === 0 && <p className="text-sm text-muted-foreground">Nenhum sindicante designado.</p>}
                    {sindicancias.map((s) => (
                      <SindicanciaItem
                        key={s.id}
                        s={s}
                        nome={memberName(s.sindicante_member_id)}
                        onSave={(rel, v) => salvarParecer(s, rel, v)}
                      />
                    ))}
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Escrutínio Secreto</h3>
                      <Button size="sm" onClick={abrirEscrutinio} disabled={escrutinios.some((e) => e.estado === "aberto")}>
                        Abrir Escrutínio
                      </Button>
                    </div>
                    {escrutinios.length === 0 && <p className="text-sm text-muted-foreground">Nenhum escrutínio registrado.</p>}
                    {escrutinios.map((e) => (
                      <div key={e.id} className="border rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={e.estado === "aberto" ? "default" : "outline"}>{e.estado.toUpperCase()}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(e.aberto_em).toLocaleString()}
                          </span>
                        </div>
                        {e.estado === "aberto" ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => votar(e, "branca")}>⚪ Bola Branca</Button>
                            <Button size="sm" variant="outline" onClick={() => votar(e, "preta")}>⚫ Bola Preta</Button>
                            <Button size="sm" variant="destructive" className="ml-auto" onClick={() => encerrarEscrutinio(e)}>Encerrar e Apurar</Button>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div>Brancas: <strong>{e.total_brancas}</strong> · Pretas: <strong>{e.total_pretas}</strong></div>
                            {e.resultado && <div className="mt-1">Resultado: <strong>{e.resultado}</strong></div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </section>
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="p-6 text-sm text-muted-foreground">Selecione uma proposta.</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="nova">
          <Card>
            <CardHeader><CardTitle>Nova Ficha de Proposta</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Nome completo *</Label><Input value={nova.candidato_nome} onChange={(e) => setNova({ ...nova, candidato_nome: e.target.value })} /></div>
                <div><Label>CPF</Label><Input value={nova.candidato_cpf} onChange={(e) => setNova({ ...nova, candidato_cpf: e.target.value })} /></div>
                <div><Label>E-mail</Label><Input type="email" value={nova.candidato_email} onChange={(e) => setNova({ ...nova, candidato_email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={nova.candidato_telefone} onChange={(e) => setNova({ ...nova, candidato_telefone: e.target.value })} /></div>
                <div><Label>Profissão</Label><Input value={nova.candidato_profissao} onChange={(e) => setNova({ ...nova, candidato_profissao: e.target.value })} /></div>
                <div>
                  <Label>Padrinho</Label>
                  <Select value={nova.padrinho_member_id} onValueChange={(v) => setNova({ ...nova, padrinho_member_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Apresentação / Justificativa</Label>
                <Textarea rows={4} value={nova.apresentacao} onChange={(e) => setNova({ ...nova, apresentacao: e.target.value })} />
              </div>
              <Button onClick={criarProposta}>Criar Proposta</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SindicanciaItem({ s, nome, onSave }: { s: Sindicancia; nome: string; onSave: (rel: string, voto: Sindicancia["voto"]) => void }) {
  const [rel, setRel] = useState(s.relatorio ?? "");
  const [voto, setVoto] = useState<Sindicancia["voto"]>(s.voto ?? null);
  return (
    <div className="border rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">{nome}</div>
        {s.entregue_em && <Badge variant="outline">Entregue {new Date(s.entregue_em).toLocaleDateString()}</Badge>}
      </div>
      <Textarea rows={3} placeholder="Relatório de sindicância…" value={rel} onChange={(e) => setRel(e.target.value)} />
      <div className="flex items-center gap-2">
        <Select value={voto ?? ""} onValueChange={(v) => setVoto(v as Sindicancia["voto"])}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Voto…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="favoravel">Favorável</SelectItem>
            <SelectItem value="contrario">Contrário</SelectItem>
            <SelectItem value="abstencao">Abstenção</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => onSave(rel, voto)}>Salvar Parecer</Button>
      </div>
    </div>
  );
}
