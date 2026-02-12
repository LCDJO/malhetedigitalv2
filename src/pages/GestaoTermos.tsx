import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Plus, Loader2, Eye, Pencil, Send, FileText, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";

interface Termo {
  id: string;
  versao: string;
  conteudo: string;
  ativo: boolean;
  data_publicacao: string;
  created_at: string;
}

interface Politica {
  id: string;
  versao: string;
  conteudo: string;
  ativo: boolean;
  data_publicacao: string;
  created_at: string;
}

const GestaoTermos = () => {
  const [termos, setTermos] = useState<Termo[]>([]);
  const [politicas, setPoliticas] = useState<Politica[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"termo" | "politica">("termo");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [versao, setVersao] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [saving, setSaving] = useState(false);

  // View dialog
  const [viewItem, setViewItem] = useState<Termo | Politica | null>(null);

  // Publish confirm
  const [publishItem, setPublishItem] = useState<{ id: string; type: "termo" | "politica"; versao: string } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [termosRes, politicasRes] = await Promise.all([
      supabase.from("termos_uso").select("*").order("data_publicacao", { ascending: false }),
      supabase.from("politicas_privacidade").select("*").order("data_publicacao", { ascending: false }),
    ]);
    if (termosRes.data) setTermos(termosRes.data);
    if (politicasRes.data) setPoliticas(politicasRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openNew = (type: "termo" | "politica") => {
    setDialogType(type);
    setEditingId(null);
    setVersao("");
    setConteudo("");
    setDialogOpen(true);
  };

  const openEdit = (item: Termo | Politica, type: "termo" | "politica") => {
    if (item.ativo) {
      toast.error("Não é possível editar um documento já publicado. Crie uma nova versão.");
      return;
    }
    setDialogType(type);
    setEditingId(item.id);
    setVersao(item.versao);
    setConteudo(item.conteudo);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!versao.trim()) { toast.error("A versão é obrigatória."); return; }
    if (!conteudo.trim()) { toast.error("O conteúdo é obrigatório."); return; }

    setSaving(true);
    const table = dialogType === "termo" ? "termos_uso" : "politicas_privacidade";

    if (editingId) {
      const { error } = await supabase.from(table).update({
        versao: versao.trim(),
        conteudo: conteudo.trim(),
      }).eq("id", editingId);
      if (error) {
        toast.error("Erro ao atualizar.");
      } else {
        toast.success("Rascunho atualizado.");
        setDialogOpen(false);
        fetchAll();
      }
    } else {
      const { error } = await supabase.from(table).insert({
        versao: versao.trim(),
        conteudo: conteudo.trim(),
        ativo: false,
      });
      if (error) {
        toast.error("Erro ao criar: " + error.message);
      } else {
        toast.success("Rascunho criado com sucesso.");
        setDialogOpen(false);
        fetchAll();
      }
    }
    setSaving(false);
  };

  const handlePublish = async () => {
    if (!publishItem) return;
    const table = publishItem.type === "termo" ? "termos_uso" : "politicas_privacidade";

    // The DB trigger automatically deactivates previous active terms
    const { error } = await supabase.from(table).update({
      ativo: true,
      data_publicacao: new Date().toISOString(),
    }).eq("id", publishItem.id);

    if (error) {
      toast.error("Erro ao publicar: " + error.message);
    } else {
      toast.success(`Versão ${publishItem.versao} publicada com sucesso. Todos os usuários deverão aceitar no próximo acesso.`);
      fetchAll();
    }
    setPublishItem(null);
  };

  const renderTable = (items: (Termo | Politica)[], type: "termo" | "politica") => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Versão</TableHead>
            <TableHead>Data de Publicação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                Nenhum documento cadastrado. Clique em "Criar Novo" para começar.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-sm">{item.versao}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.ativo ? format(new Date(item.data_publicacao), "dd/MM/yyyy 'às' HH:mm") : "—"}
                </TableCell>
                <TableCell>
                  {item.ativo ? (
                    <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Rascunho</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)} title="Visualizar">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!item.ativo && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item, type)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => setPublishItem({ id: item.id, type, versao: item.versao })} title="Publicar">
                          <Send className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Gestão de Termos e LGPD</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie Termos de Uso e Política de Privacidade — versionamento, publicação e conformidade LGPD
        </p>
      </div>

      <Tabs defaultValue="termos" className="space-y-4">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="termos" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" /> Termos de Uso
          </TabsTrigger>
          <TabsTrigger value="politicas" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <ShieldCheck className="h-4 w-4" /> Política de Privacidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="termos">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-sans font-semibold">Termos de Uso</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{termos.length} versão(ões) registrada(s)</p>
              </div>
              <Button size="sm" className="gap-1.5 h-9" onClick={() => openNew("termo")}>
                <Plus className="h-4 w-4" /> Criar Novo Termo
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : renderTable(termos, "termo")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="politicas">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-sans font-semibold">Política de Privacidade</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{politicas.length} versão(ões) registrada(s)</p>
              </div>
              <Button size="sm" className="gap-1.5 h-9" onClick={() => openNew("politica")}>
                <Plus className="h-4 w-4" /> Criar Nova Política
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : renderTable(politicas, "politica")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Criar / Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Editar Rascunho" : dialogType === "termo" ? "Novo Termo de Uso" : "Nova Política de Privacidade"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Versão *</Label>
              <Input value={versao} onChange={(e) => setVersao(e.target.value)} placeholder="Ex: 1.0, 2.0, 2024-01" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label>Conteúdo *</Label>
              <Textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder="Digite o conteúdo completo do documento..."
                rows={15}
                className="font-mono text-sm"
                maxLength={50000}
              />
              <p className="text-[10px] text-muted-foreground text-right">{conteudo.length} / 50.000 caracteres</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : editingId ? "Salvar Alterações" : "Criar Rascunho"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizar */}
      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) setViewItem(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="font-serif">{viewItem?.ativo ? "Documento Publicado" : "Rascunho"}</DialogTitle>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="text-xs">Versão {viewItem?.versao}</Badge>
              {viewItem?.ativo ? (
                <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Ativo
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Rascunho</Badge>
              )}
              {viewItem?.ativo && (
                <span className="text-xs text-muted-foreground">
                  Publicado em {format(new Date(viewItem.data_publicacao), "dd/MM/yyyy 'às' HH:mm")}
                </span>
              )}
            </div>
          </DialogHeader>
          <ScrollArea className="h-[500px] rounded-md border p-4">
            <div className="prose prose-sm max-w-none text-sm text-foreground whitespace-pre-wrap">
              {viewItem?.conteudo}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewItem(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Publish */}
      <ConfirmSensitiveAction
        open={!!publishItem}
        onOpenChange={(o) => { if (!o) setPublishItem(null); }}
        title="Publicar Documento"
        description={`Ao publicar a versão "${publishItem?.versao}", a versão anterior será desativada e todos os usuários precisarão aceitar novamente no próximo login. Esta ação não pode ser desfeita.`}
        confirmLabel="Publicar"
        requireTypedConfirmation="PUBLICAR"
        onConfirm={handlePublish}
      />
    </div>
  );
};

export default GestaoTermos;
