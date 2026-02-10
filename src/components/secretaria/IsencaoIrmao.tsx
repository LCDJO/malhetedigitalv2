import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus, ShieldCheck, ShieldOff, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";
import { useAuditLog } from "@/hooks/useAuditLog";
import { PermissionGate } from "@/components/PermissionGate";
import { type Isencao, type TipoIsencao } from "@/components/dashboard/DashboardData";

interface MemberOption {
  id: string;
  full_name: string;
  cim: string;
}

export function IsencaoIrmao() {
  const { hasPermission } = useAuth();
  const { logAction } = useAuditLog();

  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [isencoes, setIsencoes] = useState<Isencao[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [revogarTarget, setRevogarTarget] = useState<number | null>(null);
  const [concederConfirmOpen, setConcederConfirmOpen] = useState(false);

  const canApprove = hasPermission("secretaria", "approve");
  const canWrite = hasPermission("secretaria", "write");

  // form
  const [irmaoId, setIrmaoId] = useState("");
  const [tipoIsencao, setTipoIsencao] = useState<TipoIsencao | "">("");
  const [motivo, setMotivo] = useState("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(new Date());
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from("members")
      .select("id, full_name, cim")
      .eq("status", "ativo")
      .order("full_name");
    if (!error && data) setMembers(data);
    setLoadingMembers(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const resetForm = () => {
    setIrmaoId("");
    setTipoIsencao("");
    setMotivo("");
    setDataInicio(new Date());
    setDataFim(undefined);
  };

  const validateForm = () => {
    if (!irmaoId) { toast.error("Selecione um irmão."); return false; }
    if (!tipoIsencao) { toast.error("Selecione o tipo de isenção."); return false; }
    if (!motivo.trim()) { toast.error("Informe o motivo da isenção."); return false; }
    if (!dataInicio) { toast.error("Informe a data de início."); return false; }
    if (tipoIsencao === "temporaria" && !dataFim) { toast.error("Isenções temporárias exigem data final."); return false; }
    if (tipoIsencao === "temporaria" && dataFim && dataFim <= dataInicio) { toast.error("A data final deve ser posterior à data inicial."); return false; }
    const irmao = members.find((m) => m.id === irmaoId);
    if (!irmao) return false;
    const existing = isencoes.find((i) => i.irmaoId.toString() === irmao.id && i.ativa);
    if (existing) { toast.error(`${irmao.full_name} já possui uma isenção ativa.`); return false; }
    return true;
  };

  const handleSaveClick = () => {
    if (!canApprove && !canWrite) {
      toast.error("Você não tem permissão para conceder isenções.");
      return;
    }
    if (!validateForm()) return;
    setConcederConfirmOpen(true);
  };

  const handleSaveConfirmed = () => {
    const irmao = members.find((m) => m.id === irmaoId);
    if (!irmao) return;

    const nova: Isencao = {
      id: Date.now(),
      irmaoId: parseInt(irmaoId) || Date.now(),
      irmaoNome: irmao.full_name,
      tipo: tipoIsencao as TipoIsencao,
      motivo: motivo.trim(),
      dataInicio: format(dataInicio!, "dd/MM/yyyy"),
      dataFim: tipoIsencao === "temporaria" && dataFim ? format(dataFim, "dd/MM/yyyy") : undefined,
      ativa: true,
    };

    setIsencoes((prev) => [nova, ...prev]);
    toast.success(`Isenção ${tipoIsencao === "temporaria" ? "temporária" : "permanente"} registrada para ${irmao.full_name}.`);
    logAction({ action: "GRANT_EXEMPTION", targetTable: "isencoes", targetId: irmao.id, details: { irmao: irmao.full_name, tipo: tipoIsencao, motivo: motivo.trim() } });
    setDialogOpen(false);
    resetForm();
  };

  const handleRevogarClick = (id: number) => {
    if (!canApprove && !canWrite) {
      toast.error("Você não tem permissão para revogar isenções.");
      return;
    }
    setRevogarTarget(id);
  };

  const handleRevogarConfirmed = () => {
    if (revogarTarget === null) return;
    const isencao = isencoes.find((i) => i.id === revogarTarget);
    setIsencoes((prev) =>
      prev.map((i) => (i.id === revogarTarget ? { ...i, ativa: false } : i))
    );
    toast.success("Isenção revogada com sucesso.");
    logAction({ action: "REVOKE_EXEMPTION", targetTable: "isencoes", targetId: revogarTarget.toString(), details: { irmao: isencao?.irmaoNome } });
    setRevogarTarget(null);
  };

  const ativas = isencoes.filter((i) => i.ativa);
  const inativas = isencoes.filter((i) => !i.ativa);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <ShieldCheck className="h-5 w-5 text-success" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Isenções Ativas</p>
              <p className="text-xl font-bold font-serif">{ativas.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Temporárias</p>
              <p className="text-xl font-bold font-serif">{ativas.filter((i) => i.tipo === "temporaria").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <ShieldOff className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Revogadas / Expiradas</p>
              <p className="text-xl font-bold font-serif">{inativas.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-base font-sans font-semibold">Registro de Isenções</CardTitle>
          <PermissionGate module="secretaria" action="write" message="Apenas perfis com permissão de escrita podem conceder isenções.">
            <Button size="sm" className="gap-1.5 h-9" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Nova Isenção
            </Button>
          </PermissionGate>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wide font-semibold">Irmão</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide font-semibold">Tipo</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide font-semibold">Motivo</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide font-semibold">Período</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide font-semibold text-center">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isencoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Nenhuma isenção registrada. Clique em "Nova Isenção" para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  isencoes.map((isencao) => (
                    <TableRow key={isencao.id} className={cn(!isencao.ativa && "opacity-50")}>
                      <TableCell className="font-medium text-sm">{isencao.irmaoNome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", isencao.tipo === "permanente" ? "bg-primary/8 text-primary border-primary/20" : "bg-warning/10 text-warning border-warning/20")}>
                          {isencao.tipo === "permanente" ? "Permanente" : "Temporária"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{isencao.motivo}</TableCell>
                      <TableCell className="text-xs">
                        <span>{isencao.dataInicio}</span>
                        {isencao.dataFim && <span className="text-muted-foreground"> → {isencao.dataFim}</span>}
                        {isencao.tipo === "permanente" && <span className="text-muted-foreground"> → Indeterminado</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", isencao.ativa ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border")}>
                          {isencao.ativa ? "Ativa" : "Revogada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isencao.ativa && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRevogarClick(isencao.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Revogar
                          </Button>
                        )}
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
            <DialogTitle className="font-serif">Nova Isenção Financeira</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Irmão *</Label>
              {loadingMembers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
              ) : (
                <Select value={irmaoId} onValueChange={setIrmaoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o irmão" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name} — CIM {m.cim}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de Isenção *</Label>
              <Select value={tipoIsencao} onValueChange={(v) => setTipoIsencao(v as TipoIsencao)}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporaria">Temporária — com prazo definido</SelectItem>
                  <SelectItem value="permanente">Permanente — sem prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Motivo da Isenção *</Label>
              <Textarea placeholder="Descreva o motivo da isenção..." value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} rows={3} />
              <p className="text-[10px] text-muted-foreground text-right">{motivo.length}/300</p>
            </div>

            <div className={cn("grid gap-4", tipoIsencao === "temporaria" ? "grid-cols-2" : "grid-cols-1")}>
              <div className="space-y-1.5">
                <Label>Data Inicial *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataInicio && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} locale={ptBR} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {tipoIsencao === "temporaria" && (
                <div className="space-y-1.5">
                  <Label>Data Final *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataFim && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dataFim} onSelect={setDataFim} locale={ptBR} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {tipoIsencao === "permanente" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" strokeWidth={1.6} />
                <p className="text-xs text-muted-foreground">
                  Isenções permanentes não expiram. O irmão ficará isento de todos os lançamentos automáticos até que a isenção seja revogada.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSaveClick}>Registrar Isenção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de concessão */}
      <ConfirmSensitiveAction
        open={concederConfirmOpen}
        onOpenChange={setConcederConfirmOpen}
        title="Conceder Isenção Financeira"
        description="Isenções financeiras impactam diretamente a arrecadação da Loja. Esta ação será registrada no log de auditoria. Deseja confirmar a concessão?"
        confirmLabel="Confirmar Isenção"
        requireTypedConfirmation="CONCEDER"
        onConfirm={handleSaveConfirmed}
      />

      {/* Confirmação de revogação */}
      <ConfirmSensitiveAction
        open={revogarTarget !== null}
        onOpenChange={(open) => { if (!open) setRevogarTarget(null); }}
        title="Revogar Isenção"
        description="Ao revogar esta isenção, o irmão voltará a ter obrigações financeiras normais. Deseja continuar?"
        confirmLabel="Revogar Isenção"
        requireTypedConfirmation="REVOGAR"
        destructive
        onConfirm={handleRevogarConfirmed}
      />
    </div>
  );
}
