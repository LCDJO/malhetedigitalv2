import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserTenant } from "@/core/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Calendar } from "lucide-react";

interface Sessao {
  id: string;
  numero: string | null;
  data: string;
  hora_inicio: string | null;
  tipo: string;
  grau: number;
  local: string | null;
  status: string;
}

interface Cargo {
  id: string;
  nome: string;
  ordem: number;
  grau_minimo: number;
  ativo: boolean;
}

const TIPOS = ["ordinaria", "magna", "branca", "iniciacao", "elevacao", "exaltacao", "instalacao", "luto"];
const STATUS = ["agendada", "realizada", "cancelada"];

export default function Sessoes() {
  const { tenantId, loading: tenantLoading } = useUserTenant();
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSessao, setOpenSessao] = useState(false);
  const [openCargo, setOpenCargo] = useState(false);

  const [novaSessao, setNovaSessao] = useState({
    numero: "", data: "", hora_inicio: "", tipo: "ordinaria",
    grau: 1, local: "", observacoes: "",
  });
  const [novoCargo, setNovoCargo] = useState({
    nome: "", ordem: 0, grau_minimo: 1, descricao: "",
  });

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    const [s, c] = await Promise.all([
      supabase.from("sessoes").select("*").eq("tenant_id", tenantId).order("data", { ascending: false }),
      supabase.from("cargos_oficina").select("*").eq("tenant_id", tenantId).order("ordem"),
    ]);
    if (s.data) setSessoes(s.data as Sessao[]);
    if (c.data) setCargos(c.data as Cargo[]);
    setLoading(false);
  };

  useEffect(() => { if (tenantId) load(); }, [tenantId]);

  const criarSessao = async () => {
    if (!tenantId || !novaSessao.data) return toast.error("Data obrigatória");
    const { error } = await supabase.from("sessoes").insert({
      tenant_id: tenantId,
      numero: novaSessao.numero || null,
      data: novaSessao.data,
      hora_inicio: novaSessao.hora_inicio || null,
      tipo: novaSessao.tipo,
      grau: novaSessao.grau,
      local: novaSessao.local || null,
      observacoes: novaSessao.observacoes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Sessão criada");
    setOpenSessao(false);
    setNovaSessao({ numero: "", data: "", hora_inicio: "", tipo: "ordinaria", grau: 1, local: "", observacoes: "" });
    load();
  };

  const criarCargo = async () => {
    if (!tenantId || !novoCargo.nome) return toast.error("Nome obrigatório");
    const { error } = await supabase.from("cargos_oficina").insert({
      tenant_id: tenantId, ...novoCargo,
    });
    if (error) return toast.error(error.message);
    toast.success("Cargo criado");
    setOpenCargo(false);
    setNovoCargo({ nome: "", ordem: 0, grau_minimo: 1, descricao: "" });
    load();
  };

  if (tenantLoading) return <div className="p-6">Carregando…</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Sessões da Loja</h1>
        <p className="text-muted-foreground">Gestão de sessões, presenças, visitantes e cargos de oficina.</p>
      </div>

      <Tabs defaultValue="sessoes">
        <TabsList>
          <TabsTrigger value="sessoes">Sessões</TabsTrigger>
          <TabsTrigger value="cargos">Cargos de Oficina</TabsTrigger>
        </TabsList>

        <TabsContent value="sessoes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5"/> Sessões</CardTitle>
              <Dialog open={openSessao} onOpenChange={setOpenSessao}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2"/>Nova Sessão</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova Sessão</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Número</Label><Input value={novaSessao.numero} onChange={(e) => setNovaSessao({...novaSessao, numero: e.target.value})}/></div>
                      <div><Label>Data *</Label><Input type="date" value={novaSessao.data} onChange={(e) => setNovaSessao({...novaSessao, data: e.target.value})}/></div>
                      <div><Label>Hora início</Label><Input type="time" value={novaSessao.hora_inicio} onChange={(e) => setNovaSessao({...novaSessao, hora_inicio: e.target.value})}/></div>
                      <div>
                        <Label>Grau</Label>
                        <Select value={String(novaSessao.grau)} onValueChange={(v) => setNovaSessao({...novaSessao, grau: Number(v)})}>
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>{[1,2,3].map(g => <SelectItem key={g} value={String(g)}>Grau {g}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label>Tipo</Label>
                        <Select value={novaSessao.tipo} onValueChange={(v) => setNovaSessao({...novaSessao, tipo: v})}>
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2"><Label>Local</Label><Input value={novaSessao.local} onChange={(e) => setNovaSessao({...novaSessao, local: e.target.value})}/></div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenSessao(false)}>Cancelar</Button>
                    <Button onClick={criarSessao}>Criar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? <p>Carregando…</p> : sessoes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma sessão registrada.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Número</TableHead><TableHead>Data</TableHead><TableHead>Tipo</TableHead>
                    <TableHead>Grau</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {sessoes.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.numero ?? "—"}</TableCell>
                        <TableCell>{new Date(s.data).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="capitalize">{s.tipo}</TableCell>
                        <TableCell><Badge variant="secondary">Grau {s.grau}</Badge></TableCell>
                        <TableCell><Badge>{s.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cargos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cargos de Oficina</CardTitle>
              <Dialog open={openCargo} onOpenChange={setOpenCargo}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2"/>Novo Cargo</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Cargo</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nome *</Label><Input value={novoCargo.nome} onChange={(e) => setNovoCargo({...novoCargo, nome: e.target.value})} placeholder="Ex: Venerável Mestre"/></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Ordem</Label><Input type="number" value={novoCargo.ordem} onChange={(e) => setNovoCargo({...novoCargo, ordem: Number(e.target.value)})}/></div>
                      <div><Label>Grau mínimo</Label><Input type="number" min={1} max={33} value={novoCargo.grau_minimo} onChange={(e) => setNovoCargo({...novoCargo, grau_minimo: Number(e.target.value)})}/></div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenCargo(false)}>Cancelar</Button>
                    <Button onClick={criarCargo}>Criar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {cargos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum cargo cadastrado.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Ordem</TableHead><TableHead>Nome</TableHead>
                    <TableHead>Grau mín.</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {cargos.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>{c.ordem}</TableCell>
                        <TableCell>{c.nome}</TableCell>
                        <TableCell>{c.grau_minimo}</TableCell>
                        <TableCell>{c.ativo ? <Badge>Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
