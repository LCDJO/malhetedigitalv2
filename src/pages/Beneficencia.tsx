import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserTenant } from "@/core/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, HandHeart, Wallet, Undo2 } from "lucide-react";

type Tipo = "entrada" | "saida" | "estorno";
type Origem = "tronco_sessao" | "doacao" | "transferencia" | "assistencia" | "outro";
type HospTipo = "visita" | "auxilio_financeiro" | "oracao" | "cesta_basica" | "acompanhamento_familia" | "outro";
type HospStatus = "aberto" | "em_acompanhamento" | "concluido" | "cancelado";

interface Lanc { id: string; data: string; tipo: Tipo; origem: Origem; valor: number; descricao: string | null; beneficiario_member_id: string | null; estorno_de: string | null; }
interface Hosp { id: string; member_id: string; tipo: HospTipo; status: HospStatus; data_abertura: string; motivo: string; observacoes: string | null; valor: number | null; }
interface Member { id: string; full_name: string; }

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Beneficencia() {
  const { tenantId, loading } = useUserTenant();
  const [lancs, setLancs] = useState<Lanc[]>([]);
  const [hosps, setHosps] = useState<Hosp[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [openL, setOpenL] = useState(false);
  const [openH, setOpenH] = useState(false);
  const [novoL, setNovoL] = useState({ tipo: "entrada" as Tipo, origem: "tronco_sessao" as Origem, valor: "", descricao: "", beneficiario: "" });
  const [novoH, setNovoH] = useState({ member_id: "", tipo: "visita" as HospTipo, motivo: "", observacoes: "", valor: "" });

  const load = async () => {
    if (!tenantId) return;
    const [l, h, m] = await Promise.all([
      supabase.from("beneficencia_lancamentos").select("*").eq("tenant_id", tenantId).order("data", { ascending: false }),
      supabase.from("hospitalaria_assistencias").select("*").eq("tenant_id", tenantId).order("data_abertura", { ascending: false }),
      supabase.from("members").select("id, full_name").eq("tenant_id", tenantId).eq("status", "ativo").order("full_name"),
    ]);
    if (l.data) setLancs(l.data as Lanc[]);
    if (h.data) setHosps(h.data as Hosp[]);
    if (m.data) setMembers(m.data as Member[]);
  };
  useEffect(() => { if (tenantId) load(); }, [tenantId]);

  const saldo = lancs.reduce((s, l) => s + (l.tipo === "entrada" ? Number(l.valor) : -Number(l.valor)), 0);

  const criarLanc = async () => {
    if (!tenantId || !novoL.valor) return toast.error("Valor obrigatório");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("beneficencia_lancamentos").insert({
      tenant_id: tenantId, tipo: novoL.tipo, origem: novoL.origem,
      valor: Number(novoL.valor), descricao: novoL.descricao || null,
      beneficiario_member_id: novoL.beneficiario || null, created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Lançamento registrado");
    setOpenL(false); setNovoL({ tipo: "entrada", origem: "tronco_sessao", valor: "", descricao: "", beneficiario: "" });
    load();
  };

  const estornar = async (l: Lanc) => {
    if (!tenantId) return;
    const motivo = prompt("Motivo do estorno:");
    if (!motivo) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("beneficencia_lancamentos").insert({
      tenant_id: tenantId, tipo: "estorno", origem: l.origem, valor: l.valor,
      descricao: `Estorno: ${motivo}`, estorno_de: l.id, created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Estorno registrado"); load();
  };

  const criarHosp = async () => {
    if (!tenantId || !novoH.member_id || !novoH.motivo) return toast.error("Irmão e motivo obrigatórios");
    const { data: { user } } = await supabase.auth.getUser();
    let benef_id: string | null = null;
    if (novoH.tipo === "auxilio_financeiro" && novoH.valor) {
      // Cria saída no caixa de beneficência
      const { data, error } = await supabase.from("beneficencia_lancamentos").insert({
        tenant_id: tenantId, tipo: "saida", origem: "assistencia",
        valor: Number(novoH.valor), descricao: `Auxílio: ${novoH.motivo}`,
        beneficiario_member_id: novoH.member_id, created_by: user?.id,
      }).select().single();
      if (error) return toast.error(error.message);
      benef_id = data.id;
    }
    const { error } = await supabase.from("hospitalaria_assistencias").insert({
      tenant_id: tenantId, member_id: novoH.member_id, tipo: novoH.tipo, motivo: novoH.motivo,
      observacoes: novoH.observacoes || null, valor: novoH.valor ? Number(novoH.valor) : null,
      beneficencia_lancamento_id: benef_id, created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Assistência registrada");
    setOpenH(false); setNovoH({ member_id: "", tipo: "visita", motivo: "", observacoes: "", valor: "" });
    load();
  };

  const atualizarStatus = async (h: Hosp, status: HospStatus) => {
    const upd: { status: HospStatus; data_encerramento?: string } = { status };
    if (status === "concluido" || status === "cancelado") upd.data_encerramento = new Date().toISOString().slice(0,10);
    const { error } = await supabase.from("hospitalaria_assistencias").update(upd).eq("id", h.id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado"); load();
  };

  const memberName = (id: string | null) => members.find(m => m.id === id)?.full_name ?? "—";

  if (loading) return <div className="p-6">Carregando…</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Beneficência & Hospitalaria</h1>
        <p className="text-muted-foreground">Caixa segregado do Tronco de Beneficência e registro de assistências.</p>
      </div>

      <Card>
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-primary"/>
            <div>
              <div className="text-sm text-muted-foreground">Saldo da Beneficência</div>
              <div className="text-2xl font-bold">{fmt(saldo)}</div>
            </div>
          </div>
          <Badge variant="outline">{lancs.length} lançamentos</Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue="caixa">
        <TabsList>
          <TabsTrigger value="caixa">Caixa Beneficência</TabsTrigger>
          <TabsTrigger value="hospitalaria">Hospitalaria</TabsTrigger>
        </TabsList>

        <TabsContent value="caixa" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openL} onOpenChange={setOpenL}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2"/>Novo Lançamento</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Lançamento de Beneficência</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={novoL.tipo} onValueChange={(v: Tipo) => setNovoL({...novoL, tipo: v})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Origem</Label>
                      <Select value={novoL.origem} onValueChange={(v: Origem) => setNovoL({...novoL, origem: v})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tronco_sessao">Tronco de Sessão</SelectItem>
                          <SelectItem value="doacao">Doação</SelectItem>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                          <SelectItem value="assistencia">Assistência</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={novoL.valor} onChange={(e) => setNovoL({...novoL, valor: e.target.value})}/></div>
                  <div>
                    <Label>Beneficiário (opcional)</Label>
                    <Select value={novoL.beneficiario} onValueChange={(v) => setNovoL({...novoL, beneficiario: v})}>
                      <SelectTrigger><SelectValue placeholder="—"/></SelectTrigger>
                      <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Descrição</Label><Textarea value={novoL.descricao} onChange={(e) => setNovoL({...novoL, descricao: e.target.value})}/></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenL(false)}>Cancelar</Button>
                  <Button onClick={criarLanc}>Registrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card><CardContent className="pt-4">
            {lancs.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhum lançamento.</p> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Origem</TableHead>
                  <TableHead>Valor</TableHead><TableHead>Beneficiário</TableHead><TableHead>Descrição</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {lancs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>{new Date(l.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell><Badge variant={l.tipo === "entrada" ? "default" : l.tipo === "estorno" ? "outline" : "secondary"}>{l.tipo}</Badge></TableCell>
                      <TableCell className="text-xs">{l.origem}</TableCell>
                      <TableCell className={l.tipo === "entrada" ? "text-green-600" : "text-red-600"}>{fmt(Number(l.valor))}</TableCell>
                      <TableCell>{memberName(l.beneficiario_member_id)}</TableCell>
                      <TableCell className="max-w-xs truncate">{l.descricao ?? "—"}</TableCell>
                      <TableCell>
                        {l.tipo !== "estorno" && !l.estorno_de && (
                          <Button size="sm" variant="ghost" onClick={() => estornar(l)}><Undo2 className="h-3 w-3 mr-1"/>Estornar</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="hospitalaria" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openH} onOpenChange={setOpenH}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2"/>Nova Assistência</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Assistência</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Irmão *</Label>
                    <Select value={novoH.member_id} onValueChange={(v) => setNovoH({...novoH, member_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione…"/></SelectTrigger>
                      <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={novoH.tipo} onValueChange={(v: HospTipo) => setNovoH({...novoH, tipo: v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visita">Visita</SelectItem>
                        <SelectItem value="auxilio_financeiro">Auxílio Financeiro</SelectItem>
                        <SelectItem value="oracao">Oração</SelectItem>
                        <SelectItem value="cesta_basica">Cesta Básica</SelectItem>
                        <SelectItem value="acompanhamento_familia">Acompanhamento Família</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Motivo *</Label><Input value={novoH.motivo} onChange={(e) => setNovoH({...novoH, motivo: e.target.value})}/></div>
                  {novoH.tipo === "auxilio_financeiro" && (
                    <div>
                      <Label>Valor do auxílio (R$) — cria saída no Caixa</Label>
                      <Input type="number" step="0.01" value={novoH.valor} onChange={(e) => setNovoH({...novoH, valor: e.target.value})}/>
                    </div>
                  )}
                  <div><Label>Observações</Label><Textarea value={novoH.observacoes} onChange={(e) => setNovoH({...novoH, observacoes: e.target.value})}/></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenH(false)}>Cancelar</Button>
                  <Button onClick={criarHosp}>Registrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card><CardContent className="pt-4">
            {hosps.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhuma assistência registrada.</p> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Abertura</TableHead><TableHead>Irmão</TableHead><TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {hosps.map(h => (
                    <TableRow key={h.id}>
                      <TableCell>{new Date(h.data_abertura).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="flex items-center gap-1"><HandHeart className="h-3 w-3"/>{memberName(h.member_id)}</TableCell>
                      <TableCell className="text-xs">{h.tipo}</TableCell>
                      <TableCell className="max-w-xs truncate">{h.motivo}</TableCell>
                      <TableCell>{h.valor != null ? fmt(Number(h.valor)) : "—"}</TableCell>
                      <TableCell><Badge>{h.status}</Badge></TableCell>
                      <TableCell>
                        <Select value={h.status} onValueChange={(v: HospStatus) => atualizarStatus(h, v)}>
                          <SelectTrigger className="h-8 w-40"><SelectValue/></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
