import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus, Loader2, AlertTriangle, Eye, Search } from "lucide-react";
import { toast } from "sonner";

interface Incidente {
  id: string;
  data_incidente: string;
  descricao: string;
  dados_afetados: string | null;
  acoes_tomadas: string | null;
  created_at: string;
}

const Incidentes = () => {
  const { user } = useAuth();
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Incidente | null>(null);
  const [saving, setSaving] = useState(false);

  const [dataIncidente, setDataIncidente] = useState<Date>(new Date());
  const [descricao, setDescricao] = useState("");
  const [dadosAfetados, setDadosAfetados] = useState("");
  const [acoesTomadas, setAcoesTomadas] = useState("");

  const fetchIncidentes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("incidentes")
      .select("id, data_incidente, descricao, dados_afetados, acoes_tomadas, created_at")
      .order("data_incidente", { ascending: false });
    if (!error && data) setIncidentes(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchIncidentes(); }, [fetchIncidentes]);

  const resetForm = () => {
    setDataIncidente(new Date());
    setDescricao("");
    setDadosAfetados("");
    setAcoesTomadas("");
  };

  const handleSave = async () => {
    if (!descricao.trim()) { toast.error("A descrição é obrigatória."); return; }
    setSaving(true);
    const { error } = await supabase.from("incidentes").insert({
      data_incidente: dataIncidente.toISOString(),
      descricao: descricao.trim(),
      dados_afetados: dadosAfetados.trim() || null,
      acoes_tomadas: acoesTomadas.trim() || null,
      registrado_por: user?.id,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao registrar incidente.");
    } else {
      toast.success("Incidente registrado com sucesso.");
      resetForm();
      setDialogOpen(false);
      fetchIncidentes();
    }
  };

  const filtered = incidentes.filter((i) => {
    const q = search.toLowerCase();
    return i.descricao.toLowerCase().includes(q) ||
      (i.dados_afetados?.toLowerCase().includes(q) ?? false);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Registro de Incidentes</h1>
        <p className="text-sm text-muted-foreground mt-1">Registro interno de incidentes de segurança e dados — acesso restrito a administradores</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-base font-sans font-semibold">Incidentes Registrados</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar incidentes..." className="pl-9 w-60 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button size="sm" className="gap-1.5 h-9" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Registrar Incidente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.2} />
              <p className="text-sm text-muted-foreground">
                {incidentes.length === 0 ? "Nenhum incidente registrado." : "Nenhum resultado para a busca."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Dados Afetados</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] font-normal gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(inc.data_incidente), "dd/MM/yyyy HH:mm")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[300px] truncate">{inc.descricao}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{inc.dados_afetados || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(inc)} title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Novo Incidente */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Registrar Incidente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Data do Incidente *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataIncidente, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataIncidente} onSelect={(d) => d && setDataIncidente(d)} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição do Incidente *</Label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o incidente ocorrido..." rows={3} maxLength={2000} />
            </div>
            <div className="space-y-1.5">
              <Label>Dados Afetados</Label>
              <Textarea value={dadosAfetados} onChange={(e) => setDadosAfetados(e.target.value)} placeholder="Quais dados foram impactados..." rows={2} maxLength={1000} />
            </div>
            <div className="space-y-1.5">
              <Label>Ações Tomadas</Label>
              <Textarea value={acoesTomadas} onChange={(e) => setAcoesTomadas(e.target.value)} placeholder="Medidas adotadas para mitigar o incidente..." rows={2} maxLength={1000} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : <><Plus className="h-4 w-4" /> Registrar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizar */}
      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) setViewItem(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Detalhes do Incidente</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Data do Incidente</p>
                <p className="font-medium text-sm">{format(new Date(viewItem.data_incidente), "dd/MM/yyyy 'às' HH:mm")}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Descrição</p>
                <p className="text-sm whitespace-pre-wrap">{viewItem.descricao}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Dados Afetados</p>
                <p className="text-sm whitespace-pre-wrap">{viewItem.dados_afetados || "Não informado"}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Ações Tomadas</p>
                <p className="text-sm whitespace-pre-wrap">{viewItem.acoes_tomadas || "Não informado"}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Registrado em</p>
                <p className="text-sm">{format(new Date(viewItem.created_at), "dd/MM/yyyy 'às' HH:mm")}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewItem(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Incidentes;
