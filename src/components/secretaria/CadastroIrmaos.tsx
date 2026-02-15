import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Search, Plus, Pencil, Eye, X, User, Users, CalendarIcon, Loader2, ChevronLeft, ChevronRight, Filter, Upload, Trash2, KeyRound, Copy, Check, ShieldCheck, Crown } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";
import { useAuth, roleLabels, type AppRole } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { ImportarCSV } from "./ImportarCSV";
import { ConfirmSensitiveAction } from "@/components/ConfirmSensitiveAction";

const systemRoles: AppRole[] = [
  "administrador",
];

interface Member {
  id: string;
  full_name: string;
  cpf: string;
  cim: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  degree: string;
  master_installed: boolean;
  initiation_date: string | null;
  elevation_date: string | null;
  exaltation_date: string | null;
  status: string;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
}

const degreeLabels: Record<string, string> = {
  aprendiz: "Aprendiz (1°)",
  companheiro: "Companheiro (2°)",
  mestre: "Mestre (3°)",
};

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  licenciado: "Licenciado",
  suspenso: "Suspenso",
  falecido: "Falecido",
};

const statusBadge: Record<string, string> = {
  ativo: "bg-success/10 text-success border-success/20",
  inativo: "bg-muted text-muted-foreground border-border",
  licenciado: "bg-warning/10 text-warning border-warning/20",
  suspenso: "bg-destructive/10 text-destructive border-destructive/20",
  falecido: "bg-muted text-muted-foreground border-border",
};

// ── helpers ──

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits[10]);
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return "—";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "•••.•••.•••-••";
  return `•••.${digits.slice(3, 6)}.•••-••`;
}

const emptyForm = {
  full_name: "", cpf: "", cim: "", email: "", phone: "",
  birth_date: undefined as Date | undefined,
  address: "", degree: "aprendiz", master_installed: false, status: "ativo",
  initiation_date: undefined as Date | undefined,
  elevation_date: undefined as Date | undefined,
  exaltation_date: undefined as Date | undefined,
  notes: "", avatar_url: null as string | null,
  is_system_user: false,
  system_role: "administrador" as AppRole,
  system_password: "",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 0] as const; // 0 = todos

export function CadastroIrmaos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission, session } = useAuth();
  const { logAction } = useAuditLog();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDegree, setFilterDegree] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [systemUserEmails, setSystemUserEmails] = useState<Set<string>>(new Set());
  const [promotingMember, setPromotingMember] = useState<Member | null>(null);
  const [promoteSaving, setPromoteSaving] = useState(false);
  // Password management
  const [portalPassword, setPortalPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Resolve tenant
  useEffect(() => {
    const resolveTenant = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (data) setTenantId(data.tenant_id);
    };
    resolveTenant();
  }, [session?.user?.id]);

  // Fetch emails of members who already have system access
  const fetchSystemUserEmails = useCallback(async () => {
    if (!tenantId || !session?.access_token) return;
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list&tenant_id=${tenantId}`;
      const resp = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (resp.ok) {
        const users = await resp.json();
        const emails = new Set<string>(users.map((u: { email: string }) => u.email?.toLowerCase()).filter(Boolean));
        setSystemUserEmails(emails);
      }
    } catch { /* silent */ }
  }, [tenantId, session?.access_token]);

  useEffect(() => { fetchSystemUserEmails(); }, [fetchSystemUserEmails]);
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("full_name");
    if (error) {
      toast.error("Erro ao carregar membros.");
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Auto-open edit dialog when navigated from GestaoUsuarios with edit_email param
  useEffect(() => {
    const editEmail = searchParams.get("edit_email");
    if (editEmail && members.length > 0 && !dialogOpen) {
      const member = members.find((m) => m.email?.toLowerCase() === editEmail.toLowerCase());
      if (member) {
        openEdit(member);
        setSearchParams({}, { replace: true }); // clean URL
      }
    }
  }, [members, searchParams]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterDegree, filterStatus, pageSize]);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      m.full_name.toLowerCase().includes(q) ||
      (m.cpf || "").replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
      (m.cim || "").toLowerCase().includes(q);
    const matchesDegree = filterDegree === "all" || m.degree === filterDegree;
    const matchesStatus = filterStatus === "all" || m.status === filterStatus;
    return matchesSearch && matchesDegree && matchesStatus;
  });

  const effectivePageSize = pageSize === 0 ? filtered.length : pageSize;
  const totalPages = Math.max(1, Math.ceil(filtered.length / (effectivePageSize || 1)));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = pageSize === 0 ? filtered : filtered.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize);
  const activeFilters = (filterDegree !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);
  const activeCount = members.filter((m) => m.status === "ativo").length;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 2 MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("member-photos").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar foto.");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("member-photos").getPublicUrl(path);
    setForm((f) => ({ ...f, avatar_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error("O campo Nome completo é obrigatório."); return; }
    if (form.cpf && !validateCpf(form.cpf)) { toast.error("CPF inválido. Verifique os dígitos informados."); return; }

    // Validate system user fields (new member or editing member that doesn't have system access yet)
    const isNewSystemUser = form.is_system_user && !(form.email && systemUserEmails.has(form.email.toLowerCase()));
    if (isNewSystemUser) {
      if (!form.email?.trim()) { toast.error("Email é obrigatório para criar acesso ao sistema."); return; }
      if (!form.system_password || form.system_password.length < 6) { toast.error("Senha do sistema deve ter no mínimo 6 caracteres."); return; }
      if (!tenantId) { toast.error("Loja não identificada. Contate o administrador."); return; }
    }

    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      cpf: form.cpf?.trim() || null,
      cim: form.cim?.trim() || null,
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      birth_date: form.birth_date ? format(form.birth_date, "yyyy-MM-dd") : null,
      address: form.address?.trim() || null,
      degree: form.degree,
      master_installed: form.master_installed,
      status: form.status,
      initiation_date: form.initiation_date ? format(form.initiation_date, "yyyy-MM-dd") : null,
      elevation_date: form.elevation_date ? format(form.elevation_date, "yyyy-MM-dd") : null,
      exaltation_date: form.exaltation_date ? format(form.exaltation_date, "yyyy-MM-dd") : null,
      notes: form.notes?.trim() || null,
      avatar_url: form.avatar_url,
    };

    if (editingId) {
      const { error } = await supabase.from("members").update(payload).eq("id", editingId);
      if (error) {
        toast.error(error.message.includes("unique") ? "CPF ou CIM já cadastrado para outro irmão." : "Erro ao atualizar cadastro.");
      } else {
        toast.success("Cadastro atualizado com sucesso.");
        logAction({ action: "UPDATE_MEMBER", targetTable: "members", targetId: editingId, details: { full_name: payload.full_name } });

        // Create system user if flag is newly checked during edit
        if (isNewSystemUser && form.email?.trim() && tenantId && session?.access_token) {
          try {
            const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=create`;
            const resp = await fetch(url, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: form.email.trim(),
                full_name: form.full_name.trim(),
                password: form.system_password,
                role: form.system_role,
                tenant_id: tenantId,
                tenant_role: "member",
                cpf: form.cpf?.trim() || undefined,
                phone: form.phone?.trim() || undefined,
                address: form.address?.trim() || undefined,
                birth_date: form.birth_date ? format(form.birth_date, "yyyy-MM-dd") : undefined,
              }),
            });
            const result = await resp.json();
            if (resp.ok) {
              toast.success(`Acesso ao sistema criado! Cargo: ${roleLabels[form.system_role]}`);
              logAction({ action: "CREATE_SYSTEM_USER", targetTable: "profiles", details: { email: form.email.trim(), role: form.system_role } });
              fetchSystemUserEmails();
            } else {
              toast.error(`Erro ao criar acesso ao sistema: ${result.error || "Erro desconhecido"}`);
            }
          } catch {
            toast.error("Cadastro atualizado, mas erro de conexão ao criar acesso ao sistema.");
          }
        }

        closeDialog();
        fetchMembers();
      }
    } else {
      const { data: inserted, error } = await supabase.from("members").insert(payload).select("id").single();
      if (error) {
        toast.error(error.message.includes("unique") ? "CPF ou CIM já cadastrado." : "Erro ao cadastrar irmão.");
      } else {
        toast.success("Irmão cadastrado com sucesso no quadro de obreiros.");
        logAction({ action: "CREATE_MEMBER", targetTable: "members", targetId: inserted?.id, details: { full_name: payload.full_name } });

        // Auto-create system user if flag is checked
        if (form.is_system_user && form.email?.trim() && tenantId && session?.access_token) {
          try {
            const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=create`;
            const resp = await fetch(url, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: form.email.trim(),
                full_name: form.full_name.trim(),
                password: form.system_password,
                role: form.system_role,
                tenant_id: tenantId,
                tenant_role: "member",
                cpf: form.cpf?.trim() || undefined,
                phone: form.phone?.trim() || undefined,
                address: form.address?.trim() || undefined,
                birth_date: form.birth_date ? format(form.birth_date, "yyyy-MM-dd") : undefined,
              }),
            });
            const result = await resp.json();
            if (resp.ok) {
              toast.success(`Acesso ao sistema criado! Cargo: ${roleLabels[form.system_role]}`);
              logAction({ action: "CREATE_SYSTEM_USER", targetTable: "profiles", details: { email: form.email.trim(), role: form.system_role } });
              fetchSystemUserEmails();
            } else {
              toast.error(`Membro cadastrado, mas erro ao criar acesso: ${result.error || "Erro desconhecido"}`);
            }
          } catch {
            toast.error("Membro cadastrado, mas erro de conexão ao criar acesso ao sistema.");
          }
        }

        closeDialog();
        fetchMembers();
      }
    }
    setSaving(false);
  };

  const openEdit = (m: Member) => {
    setEditingId(m.id);
    setForm({
      full_name: m.full_name,
      cpf: m.cpf,
      cim: m.cim,
      email: m.email || "",
      phone: m.phone || "",
      birth_date: m.birth_date ? new Date(m.birth_date + "T12:00:00") : undefined,
      address: m.address || "",
      degree: m.degree,
      master_installed: m.master_installed ?? false,
      status: m.status,
      initiation_date: m.initiation_date ? new Date(m.initiation_date + "T12:00:00") : undefined,
      elevation_date: m.elevation_date ? new Date(m.elevation_date + "T12:00:00") : undefined,
      exaltation_date: m.exaltation_date ? new Date(m.exaltation_date + "T12:00:00") : undefined,
      notes: m.notes || "",
      avatar_url: m.avatar_url,
      is_system_user: !!(m.email && systemUserEmails.has(m.email.toLowerCase())),
      system_role: "administrador",
      system_password: "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setPortalPassword("");
    setGeneratedPassword(null);
    setCopiedPassword(false);
  };

  const handleCreateOrResetPassword = async (action: "create" | "reset") => {
    if (!editingId) return;
    if (!form.email?.trim()) {
      toast.error("É necessário informar o e-mail do irmão para criar acesso ao portal.");
      return;
    }
    if (action === "create" && portalPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setSavingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-portal-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            member_id: editingId,
            email: form.email.trim(),
            password: action === "create" ? portalPassword : undefined,
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erro ao gerenciar acesso.");
        return;
      }
      if (action === "reset") {
        setGeneratedPassword(result.temp_password);
        toast.success("Senha provisória gerada! Copie e envie ao irmão.");
      } else {
        toast.success("Acesso ao portal criado com sucesso.");
        setPortalPassword("");
      }
    } catch {
      toast.error("Erro de conexão ao criar acesso.");
    } finally {
      setSavingPassword(false);
    }
  };

  const copyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopiedPassword(true);
      toast.success("Senha copiada para a área de transferência!");
      setTimeout(() => setCopiedPassword(false), 3000);
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!promotingMember || !tenantId || !session?.access_token) return;
    if (!promotingMember.email?.trim()) {
      toast.error("O membro precisa ter um e-mail cadastrado para receber acesso ao sistema.");
      return;
    }
    setPromoteSaving(true);
    try {
      const tempPassword = crypto.randomUUID().slice(0, 12);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=create`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: promotingMember.email.trim(),
          full_name: promotingMember.full_name.trim(),
          password: tempPassword,
          role: "administrador",
          tenant_id: tenantId,
          tenant_role: "admin",
          cpf: promotingMember.cpf || undefined,
          phone: promotingMember.phone || undefined,
          address: promotingMember.address || undefined,
          birth_date: promotingMember.birth_date || undefined,
        }),
      });
      const result = await resp.json();
      if (resp.ok) {
        toast.success(`${promotingMember.full_name} agora é Administrador! Senha temporária: ${tempPassword}`);
        logAction({ action: "PROMOTE_MEMBER_ADMIN", targetTable: "members", targetId: promotingMember.id, details: { email: promotingMember.email, role: "administrador" } });
        fetchSystemUserEmails();
      } else {
        toast.error(result.error || "Erro ao promover membro.");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setPromoteSaving(false);
      setPromotingMember(null);
    }
  };

  const DateField = ({ label, value, onChange }: { label: string; value: Date | undefined; onChange: (d: Date | undefined) => void }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd/MM/yyyy") : "Selecione"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} locale={ptBR} className="p-3 pointer-events-auto" captionLayout="dropdown-buttons" fromYear={1930} toYear={2030} />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-3 px-1 py-2">
        <Badge variant="outline" className="text-xs px-3 py-1 gap-1.5 bg-success/10 text-success border-success/20">
          <Users className="h-3.5 w-3.5" /> {activeCount} obreiro(s) ativo(s)
        </Badge>
        <span className="text-xs text-muted-foreground">de {members.length} cadastrado(s)</span>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-sans font-semibold">Quadro de Obreiros</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{members.length} membro(s) cadastrado(s)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar nome, CPF ou CIM" className="pl-9 w-60 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterDegree} onValueChange={setFilterDegree}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Grau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os graus</SelectItem>
                {Object.entries(degreeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
              </SelectContent>
            </Select>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="h-9 text-xs gap-1 text-muted-foreground" onClick={() => { setFilterDegree("all"); setFilterStatus("all"); }}>
                <X className="h-3.5 w-3.5" /> Limpar filtros
              </Button>
            )}
            <PermissionGate module="secretaria" action="write">
              <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => setCsvDialogOpen(true)}>
                <Upload className="h-4 w-4" />
                Importar CSV
              </Button>
              <Button size="sm" className="gap-1.5 h-9" onClick={openNew}>
                <Plus className="h-4 w-4" />
                Cadastrar Novo Irmão
              </Button>
            </PermissionGate>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Foto</TableHead>
                      <TableHead>Nome completo</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>CIM</TableHead>
                      <TableHead>Grau</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                          {members.length === 0 ? "Nenhum irmão cadastrado. Clique em \"Cadastrar Novo Irmão\" para começar." : "Nenhum registro encontrado para os filtros aplicados."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            <Avatar className="h-9 w-9">
                              {m.avatar_url ? <AvatarImage src={m.avatar_url} alt={m.full_name} /> : null}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{getInitials(m.full_name)}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{m.full_name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{hasPermission("secretaria", "write") ? (m.cpf || "—") : maskCpf(m.cpf)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{m.cim}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5">{degreeLabels[m.degree] || m.degree}</Badge>
                              {m.master_installed && <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/30 text-primary">MI</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", statusBadge[m.status])}>{statusLabels[m.status] || m.status}</Badge>
                              {m.email && systemUserEmails.has(m.email.toLowerCase()) && (
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/30 bg-primary/10 text-primary gap-0.5">
                                  <ShieldCheck className="h-3 w-3" /> Sistema
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMember(m)} title="Visualizar"><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                              <PermissionGate module="secretaria" action="manage_users">
                                {m.email && !systemUserEmails.has(m.email.toLowerCase()) && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPromotingMember(m)} title="Tornar Administrador">
                                    <Crown className="h-4 w-4 text-amber-500" />
                                  </Button>
                                )}
                              </PermissionGate>
                              <PermissionGate module="secretaria" action="approve">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingMember(m)} title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                              </PermissionGate>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Exibir</span>
                  <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger className="w-[80px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={String(opt)}>{opt === 0 ? "Todos" : String(opt)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">por página</span>
                </div>
                {pageSize > 0 && filtered.length > pageSize && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {((safePage - 1) * effectivePageSize) + 1}–{Math.min(safePage * effectivePageSize, filtered.length)} de {filtered.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                        .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push("ellipsis");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === "ellipsis" ? (
                            <span key={`e-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                          ) : (
                            <Button key={item} variant={item === safePage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setCurrentPage(item as number)}>
                              {item}
                            </Button>
                          )
                        )}
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Cadastro / Edição */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingId ? "Editar Irmão" : "Cadastrar Novo Irmão"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            {/* Foto */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {form.avatar_url ? <AvatarImage src={form.avatar_url} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary"><User className="h-6 w-6" /></AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Label htmlFor="foto-upload" className="cursor-pointer text-sm font-medium text-primary hover:underline">
                  {uploading ? "Enviando..." : form.avatar_url ? "Alterar foto" : "Enviar foto"}
                </Label>
                <input id="foto-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                <p className="text-xs text-muted-foreground">JPG ou PNG, máximo 2 MB</p>
                {form.avatar_url && (
                  <button onClick={() => setForm((f) => ({ ...f, avatar_url: null }))} className="text-xs text-destructive hover:underline flex items-center gap-1">
                    <X className="h-3 w-3" /> Remover
                  </button>
                )}
              </div>
            </div>

            {/* Dados Pessoais */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Pessoais</p>
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input id="nome" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={100} placeholder="Ex: João da Silva" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatCpf(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cim">CIM</Label>
                <Input id="cim" value={form.cim} onChange={(e) => setForm({ ...form, cim: e.target.value })} maxLength={20} placeholder="Ex: 123456" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} placeholder="irmao@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} maxLength={15} placeholder="(11) 99999-0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DateField label="Data de Nascimento" value={form.birth_date} onChange={(d) => setForm({ ...form, birth_date: d })} />
              <div className="space-y-1.5">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={200} placeholder="Cidade, Estado" />
              </div>
            </div>

            {/* Dados Maçônicos */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">Dados Maçônicos</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Grau * {editingId && !hasPermission("secretaria", "approve") && <span className="text-[10px] text-muted-foreground font-normal">(sem permissão para alterar)</span>}</Label>
                <Select value={form.degree} onValueChange={(v) => setForm({ ...form, degree: v })} disabled={!!editingId && !hasPermission("secretaria", "approve")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(degreeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status *</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Checkbox
                id="master_installed"
                checked={form.master_installed}
                onCheckedChange={(checked) => setForm({ ...form, master_installed: !!checked })}
              />
              <Label htmlFor="master_installed" className="text-sm font-normal cursor-pointer">Mestre Instalado</Label>
            </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <DateField label="Iniciação" value={form.initiation_date} onChange={(d) => setForm({ ...form, initiation_date: d })} />
              <DateField label="Elevação" value={form.elevation_date} onChange={(d) => setForm({ ...form, elevation_date: d })} />
              <DateField label="Exaltação" value={form.exaltation_date} onChange={(d) => setForm({ ...form, exaltation_date: d })} />
            </div>

            {/* Acesso ao Sistema */}
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">Acesso ao Sistema</p>
              <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_system_user"
                    checked={form.is_system_user}
                    onCheckedChange={(checked) => setForm({ ...form, is_system_user: !!checked })}
                    disabled={editingId && form.is_system_user && !!(form.email && systemUserEmails.has(form.email.toLowerCase()))}
                  />
                  <Label htmlFor="is_system_user" className="text-sm font-normal cursor-pointer flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {editingId ? "Administrador do Sistema (Gestão da Loja)" : "Criar como usuário do sistema (Gestão da Loja)"}
                  </Label>
                  {editingId && form.email && systemUserEmails.has(form.email.toLowerCase()) && (
                    <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary">Já possui acesso</Badge>
                  )}
                </div>
                {form.is_system_user && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {editingId && form.email && systemUserEmails.has(form.email.toLowerCase())
                        ? "Este membro já possui acesso ao painel administrativo da Loja."
                        : "Este membro terá acesso ao painel administrativo da Loja com o cargo selecionado abaixo. O email informado será usado como login."}
                    </p>
                    {!(editingId && form.email && systemUserEmails.has(form.email.toLowerCase())) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Cargo no Sistema *</Label>
                          <Select value={form.system_role} onValueChange={(v) => setForm({ ...form, system_role: v as AppRole })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {systemRoles.map((r) => (
                                <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Senha de Acesso *</Label>
                          <Input
                            type="password"
                            value={form.system_password}
                            onChange={(e) => setForm({ ...form, system_password: e.target.value })}
                            placeholder="Mínimo 6 caracteres"
                            maxLength={50}
                          />
                        </div>
                      </div>
                    )}
                    {!form.email?.trim() && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        ⚠ Informe o email do membro acima para criar o acesso ao sistema.
                      </p>
                    )}
                  </>
                )}
              </div>
            </>

            {/* Acesso ao Portal */}
            {editingId && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">Acesso ao Portal do Irmão</p>
                {!generatedPassword ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1.5">
                      <Label>Senha do Portal</Label>
                      <Input
                        type="text"
                        value={portalPassword}
                        onChange={(e) => setPortalPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        maxLength={50}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="gap-1.5"
                        disabled={savingPassword || !form.email}
                        onClick={() => handleCreateOrResetPassword("create")}
                      >
                        {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        Criar / Atualizar Senha
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={savingPassword || !form.email}
                        onClick={() => handleCreateOrResetPassword("reset")}
                      >
                        <KeyRound className="h-4 w-4" />
                        Redefinir Senha
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-3">
                    <p className="text-sm font-medium text-warning">Senha provisória gerada</p>
                    <p className="text-xs text-muted-foreground">
                      Copie e envie ao irmão por e-mail, WhatsApp ou SMS. Ao fazer login, ele será solicitado a criar uma nova senha.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-background border rounded px-3 py-2 text-lg font-mono font-bold tracking-widest select-all">
                        {generatedPassword}
                      </code>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={copyPassword}>
                        {copiedPassword ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                        {copiedPassword ? "Copiado!" : "Copiar"}
                      </Button>
                    </div>
                  </div>
                )}
                {!form.email && (
                  <p className="text-xs text-destructive">É necessário informar o e-mail do irmão para criar acesso ao portal.</p>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações adicionais..." maxLength={500} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Salvando...</> : editingId ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizar */}
      <Dialog open={!!viewMember} onOpenChange={(open) => { if (!open) setViewMember(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Dados do Irmão</DialogTitle>
          </DialogHeader>
          {viewMember && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20">
                  {viewMember.avatar_url ? <AvatarImage src={viewMember.avatar_url} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">{getInitials(viewMember.full_name)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-lg">{viewMember.full_name}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px]">{degreeLabels[viewMember.degree]}</Badge>
                  {viewMember.master_installed && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Mestre Instalado</Badge>}
                  <Badge variant="outline" className={cn("text-[10px]", statusBadge[viewMember.status])}>{statusLabels[viewMember.status]}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3"><p className="text-muted-foreground text-xs">CPF</p><p className="font-medium">{hasPermission("secretaria", "write") ? (viewMember.cpf || "—") : maskCpf(viewMember.cpf)}</p></div>
                <div className="bg-muted/50 rounded-lg p-3"><p className="text-muted-foreground text-xs">CIM</p><p className="font-medium">{viewMember.cim}</p></div>
                {viewMember.email && <div className="bg-muted/50 rounded-lg p-3 col-span-2"><p className="text-muted-foreground text-xs">Email</p><p className="font-medium">{viewMember.email}</p></div>}
                {viewMember.phone && <div className="bg-muted/50 rounded-lg p-3"><p className="text-muted-foreground text-xs">Telefone</p><p className="font-medium">{viewMember.phone}</p></div>}
                {viewMember.birth_date && <div className="bg-muted/50 rounded-lg p-3"><p className="text-muted-foreground text-xs">Nascimento</p><p className="font-medium">{format(new Date(viewMember.birth_date + "T12:00:00"), "dd/MM/yyyy")}</p></div>}
                {viewMember.initiation_date && <div className="bg-muted/50 rounded-lg p-3"><p className="text-muted-foreground text-xs">Iniciação</p><p className="font-medium">{format(new Date(viewMember.initiation_date + "T12:00:00"), "dd/MM/yyyy")}</p></div>}
                {viewMember.elevation_date && <div className="bg-muted/50 rounded-lg p-3"><p className="text-muted-foreground text-xs">Elevação</p><p className="font-medium">{format(new Date(viewMember.elevation_date + "T12:00:00"), "dd/MM/yyyy")}</p></div>}
                {viewMember.exaltation_date && <div className="bg-muted/50 rounded-lg p-3"><p className="text-muted-foreground text-xs">Exaltação</p><p className="font-medium">{format(new Date(viewMember.exaltation_date + "T12:00:00"), "dd/MM/yyyy")}</p></div>}
                {viewMember.address && <div className="bg-muted/50 rounded-lg p-3 col-span-2"><p className="text-muted-foreground text-xs">Endereço</p><p className="font-medium">{viewMember.address}</p></div>}
                {viewMember.notes && <div className="bg-muted/50 rounded-lg p-3 col-span-2"><p className="text-muted-foreground text-xs">Observações</p><p className="font-medium">{viewMember.notes}</p></div>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewMember(null)}>Fechar</Button>
            <Button onClick={() => { if (viewMember) { openEdit(viewMember); setViewMember(null); } }}>Editar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog Importar CSV */}
      <ImportarCSV open={csvDialogOpen} onOpenChange={setCsvDialogOpen} onSuccess={fetchMembers} />
      {/* Dialog Confirmar Exclusão */}
      <ConfirmSensitiveAction
        open={!!deletingMember}
        onOpenChange={(open) => { if (!open) setDeletingMember(null); }}
        title="Excluir Cadastro"
        description={`Tem certeza que deseja excluir o cadastro de "${deletingMember?.full_name}"? Esta ação é irreversível e removerá todos os dados associados.`}
        confirmLabel="Excluir"
        requireTypedConfirmation="EXCLUIR"
        destructive
        onConfirm={async () => {
          if (!deletingMember) return;
          const { error } = await supabase.from("members").delete().eq("id", deletingMember.id);
          if (error) {
            toast.error("Erro ao excluir: " + error.message);
          } else {
            toast.success("Cadastro excluído com sucesso.");
            logAction({ action: "DELETE_MEMBER", targetTable: "members", targetId: deletingMember.id, details: { full_name: deletingMember.full_name } });
            fetchMembers();
          }
          setDeletingMember(null);
        }}
      />
      {/* Dialog Tornar Administrador */}
      <ConfirmSensitiveAction
        open={!!promotingMember}
        onOpenChange={(open) => { if (!open) setPromotingMember(null); }}
        title="Tornar Administrador"
        description={`Deseja conceder acesso de administrador do sistema a "${promotingMember?.full_name}"? Uma senha temporária será gerada automaticamente.`}
        confirmLabel={promoteSaving ? "Processando..." : "Confirmar Promoção"}
        requireTypedConfirmation="PROMOVER"
        onConfirm={handlePromoteToAdmin}
      />
    </>
  );
}
