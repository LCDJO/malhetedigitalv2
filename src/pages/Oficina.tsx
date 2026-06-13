import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserTenant } from "@/core/tenant";
import { useAuth } from "@/core/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Grau = "aprendiz" | "companheiro" | "mestre";
type EstadoAumento = "proposto" | "instruido" | "escrutinio" | "aprovado" | "rejeitado" | "realizado" | "arquivado";

interface Cargo { id: string; nome: string; ordem: number; grau_minimo: number | null; ativo: boolean; }
interface Member { id: string; full_name: string; degree: string | null; }
interface MembroCargo {
  id: string; cargo_id: string; member_id: string;
  mandato_inicio: string | null; mandato_fim: string | null; ativo: boolean;
}
interface Aumento {
  id: string; member_id: string; grau_origem: Grau; grau_destino: Grau;
  estado: EstadoAumento; data_prevista: string | null; data_realizado: string | null;
  justificativa: string | null; created_at: string;
}

const GRAUS: Grau[] = ["aprendiz", "companheiro", "mestre"];
const grauLabel: Record<Grau, string> = { aprendiz: "Aprendiz", companheiro: "Companheiro", mestre: "Mestre" };
const ESTADOS: EstadoAumento[] = ["proposto","instruido","escrutinio","aprovado","rejeitado","realizado","arquivado"];

export default function Oficina() {
  const { tenantId } = useUserTenant();
  const { user } = useAuth();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [vinculos, setVinculos] = useState<MembroCargo[]>([]);
  const [aumentos, setAumentos] = useState<Aumento[]>([]);

  const [novoCargo, setNovoCargo] = useState({ nome: "", ordem: 0, grau_minimo: 1 });
  const [novoVinculo, setNovoVinculo] = useState({ cargo_id: "", member_id: "", mandato_inicio: "", mandato_fim: "" });
  const [novoAumento, setNovoAumento] = useState({ member_id: "", grau_destino: "companheiro" as Grau, data_prevista: "", justificativa: "" });

  const load = async () => {
    if (!tenantId) return;
    const [c, m, v, a] = await Promise.all([
      supabase.from("cargos_oficina").select("*").eq("tenant_id", tenantId).order("ordem"),
      supabase.from("members").select("id, full_name, degree").eq("tenant_id", tenantId).eq("status", "ativo").order("full_name"),
      supabase.from("membro_cargos").select("*").eq("tenant_id", tenantId).eq("ativo", true),
      supabase.from("aumentos_salario").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
    ]);
    setCargos((c.data as Cargo[]) || []);
    setMembers((m.data as Member[]) || []);
    setVinculos((v.data as MembroCargo[]) || []);
    setAumentos((a.data as Aumento[]) || []);
  };

  useEffect(() => { load(); }, [tenantId]);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const cargoMap = useMemo(() => new Map(cargos.map((c) => [c.id, c])), [cargos]);

  const criarCargo = async () => {
    if (!tenantId || !novoCargo.nome.trim()) return toast.error("Nome do cargo é obrigatório.");
    const { error } = await supabase.from("cargos_oficina").insert({
      tenant_id: tenantId, nome: novoCargo.nome, ordem: novoCargo.ordem, grau_minimo: novoCargo.grau_minimo,
    });
    if (error) return toast.error(error.message);
    toast.success("Cargo criado.");
    setNovoCargo({ nome: "", ordem: 0, grau_minimo: 1 });
    load();
  };

  const vincularCargo = async () => {
    if (!tenantId || !novoVinculo.cargo_id || !novoVinculo.member_id) return toast.error("Selecione cargo e irmão.");
    const { error } = await supabase.from("membro_cargos").insert({
      tenant_id: tenantId,
      cargo_id: novoVinculo.cargo_id,
      member_id: novoVinculo.member_id,
      mandato_inicio: novoVinculo.mandato_inicio || null,
      mandato_fim: novoVinculo.mandato_fim || null,
      ativo: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Cargo atribuído.");
    setNovoVinculo({ cargo_id: "", member_id: "", mandato_inicio: "", mandato_fim: "" });
    load();
  };

  const encerrarMandato = async (id: string) => {
    const { error } = await supabase.from("membro_cargos")
      .update({ ativo: false, mandato_fim: new Date().toISOString().slice(0, 10) }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Mandato encerrado.");
    load();
  };

  const proporAumento = async () => {
    if (!tenantId || !novoAumento.member_id) return toast.error("Selecione o irmão.");
    const m = memberMap.get(novoAumento.member_id);
    const origem = (m?.degree as Grau) || "aprendiz";
    if (origem === novoAumento.grau_destino) return toast.error("Grau de destino igual ao atual.");
    const { error } = await supabase.from("aumentos_salario").insert({
      tenant_id: tenantId,
      member_id: novoAumento.member_id,
      grau_origem: origem,
      grau_destino: novoAumento.grau_destino,
      data_prevista: novoAumento.data_prevista || null,
      justificativa: novoAumento.justificativa || null,
      estado: "proposto",
      created_by: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Aumento de salário proposto.");
    setNovoAumento({ member_id: "", grau_destino: "companheiro", data_prevista: "", justificativa: "" });
    load();
  };

  const mudarEstadoAumento = async (a: Aumento, estado: EstadoAumento) => {
    const { error } = await supabase.from("aumentos_salario").update({ estado }).eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Estado atualizado.");
    load();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-serif tracking-tight">Oficina</h1>
        <p className="text-muted-foreground">Quadro de oficiais, mandatos e aumentos de salário.</p>
      </header>

      <Tabs defaultValue="quadro">
        <TabsList>
          <TabsTrigger value="quadro">Quadro de Oficiais</TabsTrigger>
          <TabsTrigger value="cargos">Cargos</TabsTrigger>
          <TabsTrigger value="aumentos">Aumentos de Salário</TabsTrigger>
        </TabsList>

        <TabsContent value="quadro" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Atribuir Cargo</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-5 gap-3">
              <Select value={novoVinculo.cargo_id} onValueChange={(v) => setNovoVinculo({ ...novoVinculo, cargo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Cargo" /></SelectTrigger>
                <SelectContent>{cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={novoVinculo.member_id} onValueChange={(v) => setNovoVinculo({ ...novoVinculo, member_id: v })}>
                <SelectTrigger><SelectValue placeholder="Irmão" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="date" value={novoVinculo.mandato_inicio} onChange={(e) => setNovoVinculo({ ...novoVinculo, mandato_inicio: e.target.value })} />
              <Input type="date" value={novoVinculo.mandato_fim} onChange={(e) => setNovoVinculo({ ...novoVinculo, mandato_fim: e.target.value })} />
              <Button onClick={vincularCargo}>Atribuir</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Mandatos Ativos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {vinculos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum mandato ativo.</p>}
              {vinculos.map((v) => (
                <div key={v.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{cargoMap.get(v.cargo_id)?.nome || "—"}</div>
                    <div className="text-sm text-muted-foreground">
                      {memberMap.get(v.member_id)?.full_name || "—"}
                      {v.mandato_inicio && ` • ${new Date(v.mandato_inicio).toLocaleDateString()}`}
                      {v.mandato_fim && ` → ${new Date(v.mandato_fim).toLocaleDateString()}`}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => encerrarMandato(v.id)}>Encerrar</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cargos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Novo Cargo</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-3">
              <div className="md:col-span-2"><Label>Nome</Label><Input value={novoCargo.nome} onChange={(e) => setNovoCargo({ ...novoCargo, nome: e.target.value })} /></div>
              <div><Label>Ordem</Label><Input type="number" value={novoCargo.ordem} onChange={(e) => setNovoCargo({ ...novoCargo, ordem: parseInt(e.target.value || "0") })} /></div>
              <div><Label>Grau mínimo</Label><Input type="number" min={1} max={3} value={novoCargo.grau_minimo} onChange={(e) => setNovoCargo({ ...novoCargo, grau_minimo: parseInt(e.target.value || "1") })} /></div>
              <div className="md:col-span-4"><Button onClick={criarCargo}>Criar Cargo</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Cargos Cadastrados</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {cargos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cargo.</p>}
              {cargos.map((c) => (
                <div key={c.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{c.nome}</div>
                    <div className="text-xs text-muted-foreground">Ordem {c.ordem} · Grau mínimo {c.grau_minimo ?? "—"}</div>
                  </div>
                  <Badge variant={c.ativo ? "default" : "outline"}>{c.ativo ? "Ativo" : "Inativo"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aumentos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Propor Aumento de Salário</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <Select value={novoAumento.member_id} onValueChange={(v) => setNovoAumento({ ...novoAumento, member_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Irmão" /></SelectTrigger>
                  <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name} ({m.degree ?? "—"})</SelectItem>)}</SelectContent>
                </Select>
                <Select value={novoAumento.grau_destino} onValueChange={(v) => setNovoAumento({ ...novoAumento, grau_destino: v as Grau })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GRAUS.map((g) => <SelectItem key={g} value={g}>{grauLabel[g]}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="date" value={novoAumento.data_prevista} onChange={(e) => setNovoAumento({ ...novoAumento, data_prevista: e.target.value })} />
              </div>
              <Textarea rows={2} placeholder="Justificativa…" value={novoAumento.justificativa} onChange={(e) => setNovoAumento({ ...novoAumento, justificativa: e.target.value })} />
              <Button onClick={proporAumento}>Propor</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Aumentos em Andamento</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {aumentos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum aumento.</p>}
              {aumentos.map((a) => (
                <div key={a.id} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{memberMap.get(a.member_id)?.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {grauLabel[a.grau_origem]} → {grauLabel[a.grau_destino]}
                        {a.data_prevista && ` · prev. ${new Date(a.data_prevista).toLocaleDateString()}`}
                        {a.data_realizado && ` · realizado ${new Date(a.data_realizado).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Select value={a.estado} onValueChange={(v) => mudarEstadoAumento(a, v as EstadoAumento)}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>{ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {a.justificativa && <p className="text-sm text-muted-foreground">{a.justificativa}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
