import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  Megaphone,
  Building2,
  Eye,
  Ban,
  Trash2,
} from "lucide-react";

interface Advertiser {
  id: string;
  user_id: string;
  company_name: string;
  trading_name: string | null;
  document_type: string;
  document_number: string;
  email: string;
  phone: string | null;
  website: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export default function AdminAnunciantes() {
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("todos");
  const [rejectDialog, setRejectDialog] = useState<Advertiser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailDialog, setDetailDialog] = useState<Advertiser | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Advertiser | null>(null);

  const fetchAdvertisers = async () => {
    let query = supabase.from("advertisers").select("*").order("created_at", { ascending: false });
    if (filter !== "todos") query = query.eq("status", filter as "pendente" | "aprovado" | "rejeitado" | "suspenso");
    const { data } = await query;
    setAdvertisers((data as Advertiser[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAdvertisers(); }, [filter]);

  const approve = async (adv: Advertiser) => {
    await supabase.from("advertisers").update({ status: "aprovado" as const, approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", adv.id);
    await logAction({ action: "APPROVE_ADVERTISER", targetTable: "advertisers", targetId: adv.id, details: { company: adv.company_name } });
    toast.success(`${adv.company_name} aprovado!`);
    fetchAdvertisers();
  };

  const reject = async () => {
    if (!rejectDialog) return;
    await supabase.from("advertisers").update({ status: "rejeitado" as const, rejection_reason: rejectReason || null, approved_by: user?.id }).eq("id", rejectDialog.id);
    await logAction({ action: "REJECT_ADVERTISER", targetTable: "advertisers", targetId: rejectDialog.id, details: { company: rejectDialog.company_name, reason: rejectReason } });
    toast.success(`${rejectDialog.company_name} rejeitado.`);
    setRejectDialog(null);
    setRejectReason("");
    fetchAdvertisers();
  };

  const suspend = async (adv: Advertiser) => {
    await supabase.from("advertisers").update({ status: "suspenso" as const }).eq("id", adv.id);
    await logAction({ action: "SUSPEND_ADVERTISER", targetTable: "advertisers", targetId: adv.id, details: { company: adv.company_name } });
    toast.success(`${adv.company_name} suspenso.`);
    fetchAdvertisers();
  };

  const scheduleDelete = async (adv: Advertiser) => {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);
    await supabase.from("advertisers").update({
      status: "aguardando_exclusao" as any,
      scheduled_deletion_at: deletionDate.toISOString(),
    }).eq("id", adv.id);
    await logAction({ action: "SCHEDULE_DELETE_ADVERTISER", targetTable: "advertisers", targetId: adv.id, details: { company: adv.company_name, scheduled_for: deletionDate.toISOString() } });
    toast.success(`${adv.company_name} agendado para exclusão em 30 dias.`);
    fetchAdvertisers();
  };

  const filtered = advertisers.filter((a) =>
    a.company_name.toLowerCase().includes(search.toLowerCase()) ||
    a.document_number.includes(search) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      pendente: { variant: "secondary", label: "Pendente" },
      aprovado: { variant: "default", label: "Aprovado" },
      rejeitado: { variant: "destructive", label: "Rejeitado" },
      suspenso: { variant: "destructive", label: "Suspenso" },
      aguardando_exclusao: { variant: "destructive", label: "Aguardando Exclusão" },
    };
    const s = map[status] || map.pendente;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Anunciantes</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie os cadastros de anunciantes da plataforma</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, documento ou e-mail..." className="pl-10" />
        </div>
        <div className="flex gap-1.5">
          {["todos", "pendente", "aprovado", "rejeitado", "suspenso", "aguardando_exclusao"].map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum anunciante encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((adv) => (
            <Card key={adv.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{adv.company_name}</p>
                        {statusBadge(adv.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {adv.document_type.toUpperCase()}: {adv.document_number} · {adv.email}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Cadastro: {new Date(adv.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailDialog(adv)} title="Detalhes">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {adv.status === "pendente" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => approve(adv)} title="Aprovar">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setRejectDialog(adv); setRejectReason(""); }} title="Rejeitar">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {adv.status === "aprovado" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => suspend(adv)} title="Suspender">
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                    {adv.status === "suspenso" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => approve(adv)} title="Reativar">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog(adv)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={(o) => { if (!o) setRejectDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Rejeitar Anunciante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rejeitar <span className="font-medium text-foreground">{rejectDialog?.company_name}</span>?
            </p>
            <div>
              <Label>Motivo (opcional)</Label>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Informe o motivo da rejeição..." rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectDialog(null)}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={reject}>Rejeitar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(o) => { if (!o) setDeleteDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-destructive">Excluir Anunciante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O anunciante <span className="font-medium text-foreground">{deleteDialog?.company_name}</span> será movido para <Badge variant="destructive">Aguardando Exclusão</Badge> e removido permanentemente após <strong>30 dias</strong>.
            </p>
            <p className="text-xs text-muted-foreground">Esta ação só é possível para anunciantes com status <em>Suspenso</em>.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={() => { if (deleteDialog) { scheduleDelete(deleteDialog); setDeleteDialog(null); } }}>Confirmar Exclusão</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={(o) => { if (!o) setDetailDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Detalhes do Anunciante</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Razão Social:</span><p className="font-medium">{detailDialog.company_name}</p></div>
                <div><span className="text-muted-foreground">Nome Fantasia:</span><p className="font-medium">{detailDialog.trading_name || "—"}</p></div>
                <div><span className="text-muted-foreground">Documento:</span><p className="font-medium">{detailDialog.document_type.toUpperCase()}: {detailDialog.document_number}</p></div>
                <div><span className="text-muted-foreground">E-mail:</span><p className="font-medium">{detailDialog.email}</p></div>
                <div><span className="text-muted-foreground">Telefone:</span><p className="font-medium">{detailDialog.phone || "—"}</p></div>
                <div><span className="text-muted-foreground">Website:</span><p className="font-medium">{detailDialog.website || "—"}</p></div>
                <div><span className="text-muted-foreground">Status:</span><p>{statusBadge(detailDialog.status)}</p></div>
                <div><span className="text-muted-foreground">Cadastro:</span><p className="font-medium">{new Date(detailDialog.created_at).toLocaleString("pt-BR")}</p></div>
              </div>
              {detailDialog.rejection_reason && (
                <div className="p-3 bg-destructive/5 rounded-md border border-destructive/20">
                  <p className="text-xs text-muted-foreground">Motivo da rejeição:</p>
                  <p className="text-sm">{detailDialog.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
