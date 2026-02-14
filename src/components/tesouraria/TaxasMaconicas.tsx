import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Receipt } from "lucide-react";
import { toast } from "sonner";
import {
  type TaxaMaconica,
  type GrauMaconico,
  taxasMaconicasMock,
  grauLabels,
  formatCurrency,
} from "@/components/dashboard/DashboardData";

const grauBadgeClass: Record<GrauMaconico, string> = {
  aprendiz: "bg-primary/8 text-primary border-primary/20",
  companheiro: "bg-accent/15 text-accent-foreground border-accent/25",
  mestre: "bg-warning/10 text-warning border-warning/20",
  todos: "bg-muted text-muted-foreground border-border",
};

export function TaxasMaconicas() {
  const [taxas, setTaxas] = useState<TaxaMaconica[]>(taxasMaconicasMock);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // form
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [grau, setGrau] = useState<GrauMaconico | "">("");

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setValor("");
    setGrau("");
    setEditingId(null);
  };

  const openNew = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (taxa: TaxaMaconica) => {
    setEditingId(taxa.id);
    setNome(taxa.nome);
    setDescricao(taxa.descricao);
    setValor(taxa.valorPadrao.toString().replace(".", ","));
    setGrau(taxa.grauAplicavel);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!nome.trim()) { toast.error("Informe o nome da taxa."); return; }
    if (!grau) { toast.error("Selecione o grau aplicável."); return; }
    const v = parseFloat(valor.replace(",", ".")) || 0;
    if (v <= 0) { toast.error("O valor deve ser maior que zero."); return; }

    if (editingId) {
      setTaxas((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? { ...t, nome: nome.trim(), descricao: descricao.trim(), valorPadrao: v, grauAplicavel: grau as GrauMaconico }
            : t
        )
      );
      toast.success("Taxa atualizada com sucesso.");
    } else {
      const nova: TaxaMaconica = {
        id: Date.now(),
        nome: nome.trim(),
        descricao: descricao.trim(),
        valorPadrao: v,
        grauAplicavel: grau as GrauMaconico,
        categoriaFinanceira: "taxa",
        ativa: true,
      };
      setTaxas((prev) => [nova, ...prev]);
      toast.success("Nova taxa cadastrada com sucesso.");
    }
    setDialogOpen(false);
    resetForm();
  };

  const toggleAtiva = (id: number) => {
    setTaxas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ativa: !t.ativa } : t))
    );
  };

  const ativas = taxas.filter((t) => t.ativa);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/8">
              <Receipt className="h-5 w-5 text-primary" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Total de Taxas</p>
              <p className="text-xl font-bold font-serif">{taxas.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <Receipt className="h-5 w-5 text-success" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Taxas Ativas</p>
              <p className="text-xl font-bold font-serif">{ativas.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15">
              <Receipt className="h-5 w-5 text-accent" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Valor Médio</p>
              <p className="text-xl font-bold font-serif">
                {ativas.length > 0 ? formatCurrency(ativas.reduce((s, t) => s + t.valorPadrao, 0) / ativas.length) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-base font-sans font-semibold">Catálogo de Taxas Maçônicas</CardTitle>
          <Button size="sm" className="gap-1.5 h-9" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nova Taxa
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wide font-semibold">Nome</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide font-semibold">Grau Aplicável</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide font-semibold text-right">Valor Padrão</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide font-semibold text-center">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      Nenhuma taxa cadastrada. Clique em "Nova Taxa" para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  taxas.map((taxa) => (
                    <TableRow key={taxa.id} className={!taxa.ativa ? "opacity-50" : ""}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{taxa.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{taxa.descricao}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${grauBadgeClass[taxa.grauAplicavel]}`}>
                          {grauLabels[taxa.grauAplicavel]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {formatCurrency(taxa.valorPadrao)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={taxa.ativa}
                          onCheckedChange={() => toggleAtiva(taxa.id)}
                          aria-label={`${taxa.ativa ? "Desativar" : "Ativar"} ${taxa.nome}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(taxa)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingId ? "Editar Taxa" : "Nova Taxa Maçônica"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome da Taxa *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Taxa de Iniciação" maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da taxa..." maxLength={200} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor Padrão (R$) *</Label>
                <Input
                  value={valor}
                  onChange={(e) => setValor(e.target.value.replace(/[^\d,]/g, ""))}
                  placeholder="0,00"
                  maxLength={12}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Grau Aplicável *</Label>
                <Select value={grau} onValueChange={(v) => setGrau(v as GrauMaconico)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(grauLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar Alterações" : "Cadastrar Taxa"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
