import { useEffect, useState } from "react";
import { listRegras, createRegra, updateRegra, deleteRegra, type Regra } from "@/services/admin-regras";
import { listPotencias, type Potencia } from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TIPOS = ["VALIDACAO", "BLOQUEIO", "ALERTA"] as const;
const ENTIDADES = ["LOJA", "MEMBRO", "TRANSACAO", "GRAU"] as const;

export default function RegrasTab() {
  const [regras, setRegras] = useState<Regra[]>([]);
  const [potencias, setPotencias] = useState<Potencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Regra | null>(null);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<string>("VALIDACAO");
  const [entidade, setEntidade] = useState<string>("LOJA");
  const [regraJson, setRegraJson] = useState("{}");
  const [potenciaId, setPotenciaId] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([listRegras(), listPotencias()]);
      setRegras(r);
      setPotencias(p.filter((x) => x.ativo));
    } catch {
      toast.error("Erro ao carregar regras.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setNome("");
    setDescricao("");
    setTipo("VALIDACAO");
    setEntidade("LOJA");
    setRegraJson("{}");
    setPotenciaId("");
    setDialogOpen(true);
  };

  const openEdit = (r: Regra) => {
    setEditing(r);
    setNome(r.nome);
    setDescricao(r.descricao || "");
    setTipo(r.tipo);
    setEntidade(r.entidade);
    setRegraJson(JSON.stringify(r.regra_json, null, 2));
    setPotenciaId(r.potencia_id || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) { toast.error("Nome é obrigatório."); return; }
    let parsedJson: Record<string, unknown>;
    try { parsedJson = JSON.parse(regraJson); } catch { toast.error("JSON inválido."); return; }

    setSaving(true);
    try {
      if (editing) {
        await updateRegra(editing.id, {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          tipo,
          entidade,
          regra_json: parsedJson,
          potencia_id: potenciaId || null,
        });
        toast.success("Regra atualizada.");
      } else {
        await createRegra({
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          tipo,
          entidade,
          regra_json: parsedJson,
          potencia_id: potenciaId || null,
        });
        toast.success("Regra criada.");
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Desativar esta regra?")) return;
    try {
      await deleteRegra(id);
      toast.success("Regra desativada.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao desativar.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tipoColor = (t: string) => {
    if (t === "BLOQUEIO") return "destructive";
    if (t === "ALERTA") return "secondary";
    return "default";
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Motor de Regras Institucionais</CardTitle>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Nova Regra
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Defina regras de validação, bloqueio e alerta que serão aplicadas automaticamente pelo sistema.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Potência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regras.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <div>
                      <span>{r.nome}</span>
                      {r.descricao && (
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{r.descricao}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tipoColor(r.tipo) as any}>{r.tipo}</Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.entidade}</Badge></TableCell>
                  <TableCell className="text-sm">
                    {r.potencias ? (r.potencias.sigla ? `${r.potencias.sigla}` : r.potencias.nome) : "Global"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.ativo ? "default" : "secondary"}>
                      {r.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {r.ativo && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {regras.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma regra cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Regra" : "Nova Regra"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da regra" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Explicação da regra" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entidade *</Label>
                <Select value={entidade} onValueChange={setEntidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTIDADES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Potência (opcional — vazio = global)</Label>
              <Select value={potenciaId} onValueChange={setPotenciaId}>
                <SelectTrigger><SelectValue placeholder="Global (todas)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Global (todas)</SelectItem>
                  {potencias.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.sigla ? `${p.sigla} — ${p.nome}` : p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Regra (JSON)</Label>
              <Textarea
                value={regraJson}
                onChange={(e) => setRegraJson(e.target.value)}
                placeholder='{"condicao": {...}, "acao": {...}}'
                rows={5}
                className="font-mono text-xs"
              />
            </div>
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
    </>
  );
}
