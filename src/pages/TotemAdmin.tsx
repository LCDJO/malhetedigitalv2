import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Monitor,
  Plus,
  Copy,
  Trash2,
  Loader2,
  CheckCircle,
  KeyRound,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

function generateCode(): string {
  const chars = "0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function TotemAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get current user's tenant
  const { data: tenantData } = useQuery({
    queryKey: ["my-tenant"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("tenant_users")
        .select("tenant_id, tenants(id, name, lodge_number, plan_features)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const tenantId = tenantData?.tenant_id;
  const tenant = tenantData?.tenants as any;
  const planFeatures = tenant?.plan_features as any;
  const maxTotems = planFeatures?.max_totems ?? 0; // 0 = unlimited

  // Get totem codes for this tenant
  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["tenant-totem-codes", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("totem_codes")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const atLimit = maxTotems > 0 && codes.length >= maxTotems;

  const createMutation = useMutation({
    mutationFn: async (label: string) => {
      if (atLimit) throw new Error("Limite de totens atingido");
      const code = generateCode();
      const { error } = await supabase.from("totem_codes").insert({
        tenant_id: tenantId!,
        code,
        label: label || null,
        created_by: user?.id,
      });
      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-totem-codes"] });
      toast.success(`Código ${code.slice(0, 4)}-${code.slice(4)} gerado com sucesso`);
      setDialogOpen(false);
      setNewLabel("");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao gerar código"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("totem_codes")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-totem-codes"] });
      toast.success("Status atualizado");
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("totem_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-totem-codes"] });
      toast.success("Código removido");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const handleCopy = (code: string, id: string) => {
    const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(id);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCode = (code: string) =>
    code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600/10">
            <Monitor className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-serif font-bold text-foreground">Totens</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie os totens vinculados à sua Loja
            </p>
          </div>
          <Button
            className="gap-1.5"
            size="sm"
            onClick={() => setDialogOpen(true)}
            disabled={atLimit}
          >
            <Plus className="h-4 w-4" />
            Gerar Código
          </Button>
        </div>
      </div>

      {/* Limits info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
              <Monitor className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Totens ativos</p>
              <p className="text-lg font-bold text-foreground">
                {codes.filter((c) => c.is_active).length}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {maxTotems === 0 ? "∞" : maxTotems}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 shrink-0 mt-0.5">
                <KeyRound className="h-4 w-4 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold text-foreground">Como vincular</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Gere um código e digite-o no app{" "}
                  <a
                    href="https://telamalhete.lovable.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5"
                  >
                    telamalhete.lovable.app
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {atLimit && (
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Limite de totens do seu plano atingido ({maxTotems}). Para adicionar mais, entre em contato com o administrador da plataforma.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Codes table */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : codes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <Monitor className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum totem cadastrado</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 mt-2"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Cadastrar primeiro totem
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Identificação</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Última atividade</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm font-semibold tracking-wider bg-muted px-2 py-0.5 rounded">
                          {formatCode(item.code)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(item.code, item.id)}
                        >
                          {copiedId === item.id ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.label || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {(item as any).device_id
                        ? (item as any).device_id.slice(0, 12) + "…"
                        : <span className="text-muted-foreground/40">Não vinculado</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(item as any).last_seen_at
                        ? format(new Date((item as any).last_seen_at), "dd/MM/yyyy HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: item.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Generate dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Gerar Código de Totem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Identificação (opcional)
              </Label>
              <Input
                placeholder="Ex: Totem Entrada Principal"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Nome para identificar o totem internamente
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(newLabel)}
              className="gap-1.5"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Gerar Código
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
