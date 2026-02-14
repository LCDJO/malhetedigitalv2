import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";
import { Plus, Pencil, Ban, Loader2, ChevronRight, ChevronDown, FolderOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conta {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  conta_pai_id: string | null;
  status: string;
}

interface TreeNode extends Conta {
  children: TreeNode[];
  depth: number;
}

const emptyForm = { codigo: "", nome: "", tipo: "", contaPaiId: "" };

function buildTree(contas: Conta[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create nodes
  for (const c of contas) {
    map.set(c.id, { ...c, children: [], depth: 0 });
  }

  // Build hierarchy
  for (const c of contas) {
    const node = map.get(c.id)!;
    if (c.conta_pai_id && map.has(c.conta_pai_id)) {
      const parent = map.get(c.conta_pai_id)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children and assign depth
  function sortAndDepth(nodes: TreeNode[], depth: number) {
    nodes.sort((a, b) => a.codigo.localeCompare(b.codigo));
    for (const n of nodes) {
      n.depth = depth;
      sortAndDepth(n.children, depth + 1);
    }
  }
  sortAndDepth(roots, 0);
  return roots;
}

function flattenTree(nodes: TreeNode[], expanded: Set<string>): TreeNode[] {
  const result: TreeNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children.length > 0 && expanded.has(node.id)) {
      result.push(...flattenTree(node.children, expanded));
    }
  }
  return result;
}

function getAllIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  for (const n of nodes) {
    if (n.children.length > 0) ids.push(n.id);
    ids.push(...getAllIds(n.children));
  }
  return ids;
}

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const tree = useMemo(() => buildTree(contas), [contas]);

  // Expand all on first load
  useEffect(() => {
    if (contas.length > 0 && expanded.size === 0) {
      setExpanded(new Set(getAllIds(tree)));
    }
  }, [contas, tree]);

  const visibleNodes = useMemo(() => flattenTree(tree, expanded), [tree, expanded]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(getAllIds(tree)));
  const collapseAll = () => setExpanded(new Set());

  const openCreate = (parentId?: string) => {
    setEditing(null);
    setForm({ ...emptyForm, contaPaiId: parentId ?? "" });
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
      const { error } = await supabase.from("plano_contas").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar conta."); setSaving(false); return; }
      logAction({ action: "UPDATE_CONTA", targetTable: "plano_contas", targetId: editing.id, details: payload });
      toast.success("Conta atualizada com sucesso.");
    } else {
      const { error } = await supabase.from("plano_contas").insert(payload);
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
    const newStatus = inactivateTarget.status === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase.from("plano_contas").update({ status: newStatus }).eq("id", inactivateTarget.id);
    if (error) { toast.error("Erro ao alterar status."); return; }
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

  const availableParents = (excludeId?: string) =>
    contas.filter((c) => c.status === "ativo" && c.id !== excludeId);

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
          <p className="text-sm text-muted-foreground">Estrutura contábil hierárquica da Loja.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} className="text-xs">Expandir</Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="text-xs">Recolher</Button>
          {canWrite && (
            <Button onClick={() => openCreate()} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Nova Conta
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          {visibleNodes.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Nenhuma conta cadastrada.</p>
          ) : (
            <div className="space-y-0.5">
              {visibleNodes.map((node) => {
                const hasChildren = node.children.length > 0;
                const isExpanded = expanded.has(node.id);
                const isInactive = node.status === "inativo";

                return (
                  <div
                    key={node.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 transition-colors group",
                      isInactive && "opacity-45",
                      node.depth === 0 && "bg-muted/30"
                    )}
                    style={{ paddingLeft: `${node.depth * 24 + 8}px` }}
                  >
                    {/* Expand/collapse toggle */}
                    <button
                      className={cn("flex h-5 w-5 items-center justify-center rounded shrink-0", hasChildren ? "hover:bg-muted cursor-pointer" : "cursor-default")}
                      onClick={() => hasChildren && toggleExpand(node.id)}
                      tabIndex={hasChildren ? 0 : -1}
                    >
                      {hasChildren ? (
                        isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <span className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* Icon */}
                    {hasChildren ? (
                      <FolderOpen className={cn("h-4 w-4 shrink-0", node.tipo === "receita" ? "text-success" : "text-destructive")} />
                    ) : (
                      <FileText className={cn("h-4 w-4 shrink-0", node.tipo === "receita" ? "text-success/70" : "text-destructive/70")} />
                    )}

                    {/* Code */}
                    <span className="text-xs font-mono text-muted-foreground shrink-0 w-16">{node.codigo}</span>

                    {/* Name */}
                    <span className={cn("text-sm flex-1 truncate", hasChildren ? "font-semibold" : "font-medium")}>
                      {node.nome}
                    </span>

                    {/* Type badge */}
                    <Badge variant="outline" className={cn("text-[9px] shrink-0", node.tipo === "receita" ? "text-success border-success/30" : "text-destructive border-destructive/30")}>
                      {node.tipo === "receita" ? "Receita" : "Despesa"}
                    </Badge>

                    {/* Status badge */}
                    {isInactive && (
                      <Badge variant="outline" className="text-[9px] text-muted-foreground border-muted shrink-0">Inativo</Badge>
                    )}

                    {/* Actions */}
                    {canWrite && (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {hasChildren && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Adicionar subconta" onClick={() => openCreate(node.id)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Editar" onClick={() => openEdit(node)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-6 w-6", node.status === "ativo" ? "text-warning hover:text-warning" : "text-success hover:text-success")}
                          title={node.status === "ativo" ? "Inativar" : "Reativar"}
                          onClick={() => setInactivateTarget(node)}
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
