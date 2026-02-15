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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Building2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

function generateCode(): string {
  const chars = "0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function AdminIntegracesTotem() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: tenants = [] } = useQuery({
    queryKey: ["admin-tenants-totem"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, lodge_number")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["totem-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("totem_codes")
        .select("*, tenants(name, lodge_number)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ tenant_id, label }: { tenant_id: string; label: string }) => {
      const code = generateCode();
      const { error } = await supabase.from("totem_codes").insert({
        tenant_id,
        code,
        label: label || null,
      });
      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      queryClient.invalidateQueries({ queryKey: ["totem-codes"] });
      toast.success(`Código ${code.slice(0, 4)}-${code.slice(4)} gerado com sucesso`);
      setDialogOpen(false);
      setNewLabel("");
      setSelectedTenant("");
    },
    onError: () => toast.error("Erro ao gerar código"),
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
      queryClient.invalidateQueries({ queryKey: ["totem-codes"] });
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
      queryClient.invalidateQueries({ queryKey: ["totem-codes"] });
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
            <h1 className="text-2xl font-serif font-bold text-foreground">Totem</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie códigos de ativação para vincular totens às Lojas
            </p>
          </div>
          <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Gerar Código
          </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 shrink-0 mt-0.5">
              <KeyRound className="h-4 w-4 text-blue-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Como funciona</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gere um código de 8 dígitos e informe ao responsável pelo totem. Ao digitar o código no aplicativo{" "}
                <a
                  href="https://telamalhete.lovable.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5"
                >
                  telamalhete.lovable.app
                  <ExternalLink className="h-3 w-3" />
                </a>
                , o totem será vinculado automaticamente à Loja, carregando seus dados e permitindo consultas financeiras pelos Irmãos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10">
            <Building2 className="h-4 w-4 text-accent-foreground" />
          </div>
          <h2 className="text-base font-serif font-semibold text-foreground">
            Códigos Gerados
          </h2>
          <Badge variant="secondary" className="text-[10px]">
            {codes.length} {codes.length === 1 ? "código" : "códigos"}
          </Badge>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : codes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Monitor className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhum código gerado ainda</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 mt-2"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Gerar primeiro código
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Identificação</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
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
                      <TableCell className="text-sm">
                        {(item as any).tenants?.name ?? "—"}
                        {(item as any).tenants?.lodge_number && (
                          <span className="text-muted-foreground ml-1">
                            nº {(item as any).tenants.lodge_number}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.label || "—"}
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
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Gerar Código de Totem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Loja *
              </Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Loja" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.lodge_number ? `nº ${t.lodge_number}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              disabled={!selectedTenant || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({ tenant_id: selectedTenant, label: newLabel })
              }
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
