import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserTenant } from "@/core/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Sessao { id: string; numero: string | null; data: string; tipo: string; grau: number; status: string; }
interface Member { id: string; full_name: string; }
interface Presenca {
  id: string; member_id: string; sessao_id: string;
  presente: boolean; justificada: boolean; observacao: string | null;
}
interface Visitante {
  id: string; sessao_id: string; nome: string; cim: string | null; grau: number | null;
  loja_origem: string | null; oriente: string | null; potencia: string | null; rito: string | null;
  observacao: string | null;
}

export default function Presencas() {
  const { tenantId } = useUserTenant();
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [sessaoId, setSessaoId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [novoVisitante, setNovoVisitante] = useState({
    nome: "", cim: "", grau: 1, loja_origem: "", oriente: "", potencia: "", rito: "", observacao: "",
  });

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const [s, m] = await Promise.all([
        supabase.from("sessoes").select("id, numero, data, tipo, grau, status").eq("tenant_id", tenantId).order("data", { ascending: false }),
        supabase.from("members").select("id, full_name").eq("tenant_id", tenantId).eq("status", "ativo").order("full_name"),
      ]);
      setSessoes((s.data as Sessao[]) || []);
      setMembers((m.data as Member[]) || []);
    })();
  }, [tenantId]);

  useEffect(() => {
    if (!sessaoId) { setPresencas([]); setVisitantes([]); return; }
    (async () => {
      const [p, v] = await Promise.all([
        supabase.from("presencas").select("*").eq("sessao_id", sessaoId),
        supabase.from("visitantes").select("*").eq("sessao_id", sessaoId).order("nome"),
      ]);
      setPresencas((p.data as Presenca[]) || []);
      setVisitantes((v.data as Visitante[]) || []);
    })();
  }, [sessaoId]);

  const presencaMap = useMemo(() => {
    const m = new Map<string, Presenca>();
    presencas.forEach((p) => m.set(p.member_id, p));
    return m;
  }, [presencas]);

  const togglePresenca = async (member_id: string, field: "presente" | "justificada", value: boolean) => {
    if (!tenantId || !sessaoId) return;
    const existing = presencaMap.get(member_id);
    if (existing) {
      const patch: Partial<Presenca> = { [field]: value };
      if (field === "presente" && value) patch.justificada = false;
      const { error } = await supabase.from("presencas").update(patch).eq("id", existing.id);
      if (error) return toast.error(error.message);
      setPresencas((prev) => prev.map((p) => p.id === existing.id ? { ...p, ...patch } : p));
    } else {
      const insert = {
        tenant_id: tenantId, sessao_id: sessaoId, member_id,
        presente: field === "presente" ? value : false,
        justificada: field === "justificada" ? value : false,
        observacao: null,
      };
      const { data, error } = await supabase.from("presencas").insert(insert).select().single();
      if (error) return toast.error(error.message);
      setPresencas((prev) => [...prev, data as Presenca]);
    }
  };

  const addVisitante = async () => {
    if (!tenantId || !sessaoId || !novoVisitante.nome.trim()) return toast.error("Nome do visitante é obrigatório.");
    const { data, error } = await supabase.from("visitantes").insert({
      tenant_id: tenantId, sessao_id: sessaoId,
      nome: novoVisitante.nome,
      cim: novoVisitante.cim || null,
      grau: novoVisitante.grau,
      loja_origem: novoVisitante.loja_origem || null,
      oriente: novoVisitante.oriente || null,
      potencia: novoVisitante.potencia || null,
      rito: novoVisitante.rito || null,
      observacao: novoVisitante.observacao || null,
    }).select().single();
    if (error) return toast.error(error.message);
    toast.success("Visitante registrado.");
    setVisitantes((prev) => [...prev, data as Visitante]);
    setNovoVisitante({ nome: "", cim: "", grau: 1, loja_origem: "", oriente: "", potencia: "", rito: "", observacao: "" });
  };

  const removeVisitante = async (id: string) => {
    const { error } = await supabase.from("visitantes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setVisitantes((prev) => prev.filter((v) => v.id !== id));
  };

  const stats = useMemo(() => {
    const total = members.length;
    const presentes = presencas.filter((p) => p.presente).length;
    const justificadas = presencas.filter((p) => !p.presente && p.justificada).length;
    const ausentes = total - presentes - justificadas;
    return { total, presentes, justificadas, ausentes, visitantes: visitantes.length };
  }, [members, presencas, visitantes]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-serif tracking-tight">Presenças & Visitantes</h1>
        <p className="text-muted-foreground">Lista de presença, justificativas e registro de visitantes por sessão.</p>
      </header>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <Label>Sessão</Label>
            <Select value={sessaoId} onValueChange={setSessaoId}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {sessoes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.numero ? `#${s.numero} · ` : ""}{new Date(s.data).toLocaleDateString()} · {s.tipo} · Gr {s.grau}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {sessaoId && (
            <div className="flex gap-2 flex-wrap text-sm">
              <Badge variant="default">Presentes {stats.presentes}/{stats.total}</Badge>
              <Badge variant="outline">Justificados {stats.justificadas}</Badge>
              <Badge variant="secondary">Ausentes {stats.ausentes}</Badge>
              <Badge>Visitantes {stats.visitantes}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {sessaoId && (
        <Tabs defaultValue="lista">
          <TabsList>
            <TabsTrigger value="lista">Lista de Presença</TabsTrigger>
            <TabsTrigger value="visitantes">Visitantes</TabsTrigger>
          </TabsList>

          <TabsContent value="lista">
            <Card>
              <CardHeader><CardTitle>Quadro de Irmãos</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {members.map((m) => {
                  const p = presencaMap.get(m.id);
                  return (
                    <div key={m.id} className="flex items-center justify-between border rounded p-2">
                      <span className="text-sm">{m.full_name}</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={p?.presente ?? false} onCheckedChange={(v) => togglePresenca(m.id, "presente", !!v)} />
                          Presente
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={p?.justificada ?? false} onCheckedChange={(v) => togglePresenca(m.id, "justificada", !!v)} disabled={p?.presente ?? false} />
                          Justificado
                        </label>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visitantes" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Novo Visitante</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-3">
                <div><Label>Nome *</Label><Input value={novoVisitante.nome} onChange={(e) => setNovoVisitante({ ...novoVisitante, nome: e.target.value })} /></div>
                <div><Label>CIM</Label><Input value={novoVisitante.cim} onChange={(e) => setNovoVisitante({ ...novoVisitante, cim: e.target.value })} /></div>
                <div><Label>Grau</Label><Input type="number" min={1} max={33} value={novoVisitante.grau} onChange={(e) => setNovoVisitante({ ...novoVisitante, grau: parseInt(e.target.value || "1") })} /></div>
                <div><Label>Loja de Origem</Label><Input value={novoVisitante.loja_origem} onChange={(e) => setNovoVisitante({ ...novoVisitante, loja_origem: e.target.value })} /></div>
                <div><Label>Oriente</Label><Input value={novoVisitante.oriente} onChange={(e) => setNovoVisitante({ ...novoVisitante, oriente: e.target.value })} /></div>
                <div><Label>Potência</Label><Input value={novoVisitante.potencia} onChange={(e) => setNovoVisitante({ ...novoVisitante, potencia: e.target.value })} /></div>
                <div><Label>Rito</Label><Input value={novoVisitante.rito} onChange={(e) => setNovoVisitante({ ...novoVisitante, rito: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Observação</Label><Input value={novoVisitante.observacao} onChange={(e) => setNovoVisitante({ ...novoVisitante, observacao: e.target.value })} /></div>
                <div className="md:col-span-3"><Button onClick={addVisitante}>Registrar Visitante</Button></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Visitantes da Sessão</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {visitantes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum visitante.</p>}
                {visitantes.map((v) => (
                  <div key={v.id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="font-medium">{v.nome} {v.cim && <span className="text-xs text-muted-foreground">CIM {v.cim}</span>}</div>
                      <div className="text-xs text-muted-foreground">
                        {[v.loja_origem, v.oriente, v.potencia, v.rito].filter(Boolean).join(" · ")}
                        {v.grau ? ` · Grau ${v.grau}` : ""}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => removeVisitante(v.id)}>Remover</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
