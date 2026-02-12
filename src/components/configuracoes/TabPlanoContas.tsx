import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";
import { Plus, Pencil, Ban, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conta {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  conta_pai_id: string | null;
  status: string;
}

const emptyForm = { codigo: "", nome: "", tipo: "", contaPaiId: "" };

export function TabPlanoContas() {
  const { hasPermission } = useAuth();
  const { logAction } = useAuditLog();
  const canWrite = hasPermission("configuracoes", "write");

  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Conta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [inactivateTarget, setInactivateTarget] = useState<Conta | null>(null);

  const fetchContas = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("plano_contas")
      .select("id, codigo, nome, tipo, conta_pai_id, status")
      .order("codigo", { ascending: true });
    setContas(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchContas(); }, [fetchContas]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Conta) => {
    setEditing(c);
    setForm({ codigo: c.codigo, nome: c.nome, tipo: c.tipo, contaPaiId: c.conta_pai_id ?? "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.codigo.trim()) { toast.error("Informe o código da conta."); return; }
    if (!form.nome.trim()) { toast.error("Informe o nome da conta."); return; }
    if (!form.tipo) { toast.error("Selecione o tipo da conta."); return; }

    // Check unique code
    const duplicate = contas.find((c) => c.codigo === form.codigo.trim() && c.id !== editing?.id);
    if (duplicate) { toast.error("Já existe uma conta com este código."); return; }

    setSaving(true);
    const payload = {
      codigo: form.codigo.trim(),
      nome: form.nome.trim(),
      tipo: form.tipo,
      conta_pai_id: form.contaPaiId || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("plano_contas")
        .update(payload)
        .eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar conta."); setSaving(false); return; }
      logAction({ action: "UPDATE_CONTA", targetTable: "plano_contas", targetId: editing.id, details: payload });
      toast.success("Conta atualizada com sucesso.");
    } else {
      const { error } = await supabase
        .from("plano_contas")
        .insert(payload);
      if (error) { toast.error("Erro ao criar conta."); setSaving(false); return; }
      logAction({ action: "CREATE_CONTA", targetTable: "plano_contas", details: payload });
      toast.success("Conta criada com sucesso.");
    }

    setSaving(false);
    setDialogOpen(false);
    fetchContas();
  };

  const handleInactivate = async () => {
    if (!inactivateTarget) return;
    const { error } = await supabase
      .from("plano_contas")
      .update({ status: inactivateTarget.status === "ativo" ? "inativo" : "ativo" })
      .eq("id", inactivateTarget.id);
    if (error) { toast.error("Erro ao alterar status."); return; }
    const newStatus = inactivateTarget.status === "ativo" ? "inativo" : "ativo";
    logAction({
      action: "TOGGLE_CONTA_STATUS",
      targetTable: "plano_contas",
      targetId: inactivateTarget.id,
      details: { conta: inactivateTarget.nome, novo_status: newStatus },
    });
    toast.success(`Conta ${newStatus === "ativo" ? "reativada" : "inativada"} com sucesso.`);
    setInactivateTarget(null);
    fetchContas();
  };

  // Build hierarchy helpers
  const contaPaiNome = (id: string | null) => {
    if (!id) return "—";
    return contas.find((c) => c.id === id)?.nome ?? "—";
  };

  const availableParents = (excludeId?: string) =>
    contas.filter((c) => c.status === "ativo" && c.id !== excludeId);

  // Indent level based on code dots
  const indentLevel = (codigo: string) => (codigo.match(/\./g) || []).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Plano de Contas</h3>
          <p className="text-sm text-muted-foreground">Estrutura contábil da Loja com hierarquia e classificação.</p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova Conta
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Conta Pai</TableHead>
                  <TableHead>Status</TableHead>
                  {canWrite && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canWrite ? 6 : 5} className="text-center text-muted-foreground py-10">
                      Nenhuma conta cadastrada.
                    </TableCell>
                  </TableRow>
                ) : contas.map((c) => {
                  const indent = indentLevel(c.codigo);
                  return (
                    <TableRow key={c.id} className={c.status === "inativo" ? "opacity-50" : ""}>
                      <TableCell className="text-sm font-mono">
                        <span style={{ paddingLeft: `${indent * 16}px` }} className="flex items-center gap-1">
                          {indent > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                          {c.codigo}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{c.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", c.tipo === "receita" ? "text-success border-success/30" : "text-destructive border-destructive/30")}>
                          {c.tipo === "receita" ? "Receita" : "Despesa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{contaPaiNome(c.conta_pai_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", c.status === "ativo" ? "text-success border-success/30" : "text-muted-foreground border-muted")}>
                          {c.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      {canWrite && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEdit(c)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn("h-7 w-7", c.status === "ativo" ? "text-warning hover:text-warning" : "text-success hover:text-success")}
                              title={c.status === "ativo" ? "Inativar" : "Reativar"}
                              onClick={() => setInactivateTarget(c)}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Conta" : "Nova Conta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Código estruturado *</Label>
              <Input placeholder="Ex: 1.1.01" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Mensalidades" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conta pai (opcional)</Label>
              <Select value={form.contaPaiId} onValueChange={(v) => setForm((f) => ({ ...f, contaPaiId: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhuma (conta raiz)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (conta raiz)</SelectItem>
                  {availableParents(editing?.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar" : "Criar Conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inactivate confirmation */}
      <ConfirmSensitiveAction
        open={inactivateTarget !== null}
        onOpenChange={(open) => { if (!open) setInactivateTarget(null); }}
        title={inactivateTarget?.status === "ativo" ? "Inativar Conta" : "Reativar Conta"}
        description={`Deseja ${inactivateTarget?.status === "ativo" ? "inativar" : "reativar"} a conta "${inactivateTarget?.codigo} — ${inactivateTarget?.nome}"? Esta ação será registrada no log de auditoria.`}
        confirmLabel={inactivateTarget?.status === "ativo" ? "Inativar" : "Reativar"}
        requireTypedConfirmation={inactivateTarget?.status === "ativo" ? "INATIVAR" : "REATIVAR"}
        destructive={inactivateTarget?.status === "ativo"}
        onConfirm={handleInactivate}
      />
    </div>
  );
}
