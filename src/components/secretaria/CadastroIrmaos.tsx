import { useState, useEffect, useCallback } from "react";
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
import { Search, Plus, Pencil, Eye, X, User, CalendarIcon, Loader2, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";
import { useAuth } from "@/contexts/AuthContext";

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

const emptyForm = {
  full_name: "", cpf: "", cim: "", email: "", phone: "",
  birth_date: undefined as Date | undefined,
  address: "", degree: "aprendiz", status: "ativo",
  initiation_date: undefined as Date | undefined,
  elevation_date: undefined as Date | undefined,
  exaltation_date: undefined as Date | undefined,
  notes: "", avatar_url: null as string | null,
};

const ITEMS_PER_PAGE = 10;

export function CadastroIrmaos() {
  const { hasPermission } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDegree, setFilterDegree] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterDegree, filterStatus]);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      m.full_name.toLowerCase().includes(q) ||
      m.cpf.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
      m.cim.toLowerCase().includes(q);
    const matchesDegree = filterDegree === "all" || m.degree === filterDegree;
    const matchesStatus = filterStatus === "all" || m.status === filterStatus;
    return matchesSearch && matchesDegree && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  const activeFilters = (filterDegree !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

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
    if (!validateCpf(form.cpf)) { toast.error("CPF inválido. Verifique os dígitos informados."); return; }
    if (!form.cim.trim()) { toast.error("O campo CIM é obrigatório."); return; }

    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      cpf: form.cpf,
      cim: form.cim.trim(),
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      birth_date: form.birth_date ? format(form.birth_date, "yyyy-MM-dd") : null,
      address: form.address?.trim() || null,
      degree: form.degree,
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
        closeDialog();
        fetchMembers();
      }
    } else {
      const { error } = await supabase.from("members").insert(payload);
      if (error) {
        toast.error(error.message.includes("unique") ? "CPF ou CIM já cadastrado." : "Erro ao cadastrar irmão.");
      } else {
        toast.success("Irmão cadastrado com sucesso no quadro de obreiros.");
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
      status: m.status,
      initiation_date: m.initiation_date ? new Date(m.initiation_date + "T12:00:00") : undefined,
      elevation_date: m.elevation_date ? new Date(m.elevation_date + "T12:00:00") : undefined,
      exaltation_date: m.exaltation_date ? new Date(m.exaltation_date + "T12:00:00") : undefined,
      notes: m.notes || "",
      avatar_url: m.avatar_url,
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
                          <TableCell className="text-muted-foreground text-sm">{m.cpf}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{m.cim}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5">{degreeLabels[m.degree] || m.degree}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", statusBadge[m.status])}>{statusLabels[m.status] || m.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMember(m)} title="Visualizar"><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filtered.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">
                    Exibindo {((safePage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length} registro(s)
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
                          <Button key={item} variant={item === safePage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setCurrentPage(item)}>
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
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatCpf(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cim">CIM *</Label>
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
            </div>
            <div className="grid grid-cols-3 gap-4">
              <DateField label="Iniciação" value={form.initiation_date} onChange={(d) => setForm({ ...form, initiation_date: d })} />
              <DateField label="Elevação" value={form.elevation_date} onChange={(d) => setForm({ ...form, elevation_date: d })} />
              <DateField label="Exaltação" value={form.exaltation_date} onChange={(d) => setForm({ ...form, exaltation_date: d })} />
            </div>

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
                  <Badge variant="outline" className={cn("text-[10px]", statusBadge[viewMember.status])}>{statusLabels[viewMember.status]}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3"><p className="text-muted-foreground text-xs">CPF</p><p className="font-medium">{viewMember.cpf}</p></div>
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
    </>
  );
}
