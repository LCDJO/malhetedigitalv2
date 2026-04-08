import { useEffect, useState } from "react";
import {
  listPotencias, createPotencia, updatePotencia, deletePotencia,
  listRitos, createRito, updateRito, deleteRito,
  type Potencia, type Rito,
} from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Shield, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function AdminPotenciasRitos() {
  const [potencias, setPotencias] = useState<Potencia[]>([]);
  const [ritos, setRitos] = useState<Rito[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"potencia" | "rito">("potencia");
  const [editingItem, setEditingItem] = useState<Potencia | Rito | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formSigla, setFormSigla] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([listPotencias(), listRitos()]);
      setPotencias(p);
      setRitos(r);
    } catch {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = (type: "potencia" | "rito") => {
    setDialogType(type);
    setEditingItem(null);
    setFormNome("");
    setFormSigla("");
    setFormDescricao("");
    setDialogOpen(true);
  };

  const openEdit = (type: "potencia" | "rito", item: Potencia | Rito) => {
    setDialogType(type);
    setEditingItem(item);
    setFormNome(item.nome);
    if (type === "potencia") setFormSigla((item as Potencia).sigla || "");
    if (type === "rito") setFormDescricao((item as Rito).descricao || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formNome.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    try {
      if (dialogType === "potencia") {
        if (editingItem) {
          await updatePotencia(editingItem.id, { nome: formNome.trim(), sigla: formSigla.trim() });
          toast.success("Potência atualizada.");
        } else {
          await createPotencia({ nome: formNome.trim(), sigla: formSigla.trim() });
          toast.success("Potência criada.");
        }
      } else {
        if (editingItem) {
          await updateRito(editingItem.id, { nome: formNome.trim(), descricao: formDescricao.trim() });
          toast.success("Rito atualizado.");
        } else {
          await createRito({ nome: formNome.trim(), descricao: formDescricao.trim() });
          toast.success("Rito criado.");
        }
      }
      setDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: "potencia" | "rito", id: string) => {
    if (!confirm("Desativar este registro?")) return;
    try {
      if (type === "potencia") await deletePotencia(id);
      else await deleteRito(id);
      toast.success("Registro desativado.");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Erro ao desativar.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold tracking-tight">Potências & Ritos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as potências maçônicas e ritos disponíveis para seleção pelas Lojas.
        </p>
      </div>

      <Tabs defaultValue="potencias">
        <TabsList>
          <TabsTrigger value="potencias" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Potências
          </TabsTrigger>
          <TabsTrigger value="ritos" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Ritos
          </TabsTrigger>
        </TabsList>

        {/* ── POTÊNCIAS ── */}
        <TabsContent value="potencias">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Potências Maçônicas</CardTitle>
              <Button size="sm" className="gap-1.5" onClick={() => openCreate("potencia")}>
                <Plus className="h-3.5 w-3.5" /> Nova Potência
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Sigla</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {potencias.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell><Badge variant="outline">{p.sigla || "—"}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={p.ativo ? "default" : "secondary"}>
                          {p.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit("potencia", p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {p.ativo && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete("potencia", p.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {potencias.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhuma potência cadastrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RITOS ── */}
        <TabsContent value="ritos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Ritos Maçônicos</CardTitle>
              <Button size="sm" className="gap-1.5" onClick={() => openCreate("rito")}>
                <Plus className="h-3.5 w-3.5" /> Novo Rito
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ritos.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.descricao || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.ativo ? "default" : "secondary"}>
                          {r.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit("rito", r)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {r.ativo && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete("rito", r.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ritos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum rito cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── DIALOG CREATE/EDIT ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar" : "Nova"} {dialogType === "potencia" ? "Potência" : "Rito"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={formNome} onChange={(e) => setFormNome(e.target.value)} placeholder="Nome" maxLength={200} />
            </div>
            {dialogType === "potencia" && (
              <div className="space-y-2">
                <Label>Sigla</Label>
                <Input value={formSigla} onChange={(e) => setFormSigla(e.target.value)} placeholder="Ex: GOB" maxLength={20} />
              </div>
            )}
            {dialogType === "rito" && (
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} placeholder="Descrição opcional" rows={3} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
