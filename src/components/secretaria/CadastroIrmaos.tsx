import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Pencil, Eye, X, User } from "lucide-react";
import { toast } from "sonner";

interface Irmao {
  id: number;
  nome: string;
  cpf: string;
  cim: string;
  foto: string | null;
}

const initialData: Irmao[] = [
  { id: 1, nome: "João Silva", cpf: "123.456.789-00", cim: "123456", foto: null },
  { id: 2, nome: "Carlos Mendes", cpf: "234.567.890-11", cim: "234567", foto: null },
  { id: 3, nome: "Pedro Alves", cpf: "345.678.901-22", cim: "345678", foto: null },
  { id: 4, nome: "Marcos Oliveira", cpf: "456.789.012-33", cim: "456789", foto: null },
  { id: 5, nome: "Antônio Souza", cpf: "567.890.123-44", cim: "567890", foto: null },
];

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

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ── form state ──

const emptyForm = { nome: "", cpf: "", cim: "", foto: null as string | null };

// ── component ──

export function CadastroIrmaos() {
  const [irmaos, setIrmaos] = useState<Irmao[]>(initialData);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewIrmao, setViewIrmao] = useState<Irmao | null>(null);

  const filtered = irmaos.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.nome.toLowerCase().includes(q) ||
      i.cpf.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
      i.cim.includes(q)
    );
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, foto: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.nome.trim()) { toast.error("O campo Nome completo é obrigatório."); return; }
    if (!validateCpf(form.cpf)) { toast.error("CPF inválido. Verifique os dígitos informados."); return; }
    if (!form.cim.trim()) { toast.error("O campo CIM é obrigatório."); return; }

    // CPF deve ser único
    const cpfDigits = form.cpf.replace(/\D/g, "");
    const duplicate = irmaos.find(
      (i) => i.cpf.replace(/\D/g, "") === cpfDigits && i.id !== editingId
    );
    if (duplicate) {
      toast.error(`CPF já cadastrado para ${duplicate.nome}. Cada irmão deve ter um CPF único.`);
      return;
    }

    if (editingId) {
      setIrmaos((prev) =>
        prev.map((i) =>
          i.id === editingId ? { ...i, nome: form.nome.trim(), cpf: form.cpf, cim: form.cim.trim(), foto: form.foto } : i
        )
      );
      toast.success("Cadastro atualizado com sucesso.");
    } else {
      setIrmaos((prev) => [
        { id: Date.now(), nome: form.nome.trim(), cpf: form.cpf, cim: form.cim.trim(), foto: form.foto },
        ...prev,
      ]);
      toast.success("Irmão cadastrado com sucesso no quadro de obreiros.");
    }
    closeDialog();
  };

  const openEdit = (irmao: Irmao) => {
    setEditingId(irmao.id);
    setForm({ nome: irmao.nome, cpf: irmao.cpf, cim: irmao.cim, foto: irmao.foto });
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-base font-sans font-semibold">Quadro de Obreiros</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nome, CPF ou CIM"
                className="pl-9 w-60 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size="sm" className="gap-1.5 h-9" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Cadastrar Novo Irmão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>CIM</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((irmao) => (
                    <TableRow key={irmao.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          {irmao.foto ? (
                            <AvatarImage src={irmao.foto} alt={irmao.nome} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(irmao.nome)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{irmao.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{irmao.cpf}</TableCell>
                      <TableCell className="text-muted-foreground">{irmao.cim}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewIrmao(irmao)} title="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(irmao)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Cadastro / Edição */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingId ? "Editar Irmão" : "Cadastrar Novo Irmão"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Foto upload */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {form.foto ? <AvatarImage src={form.foto} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Label htmlFor="foto-upload" className="cursor-pointer text-sm font-medium text-primary hover:underline">
                  {form.foto ? "Alterar foto" : "Enviar foto"}
                </Label>
                <input id="foto-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <p className="text-xs text-muted-foreground">JPG ou PNG, máximo 2 MB</p>
                {form.foto && (
                  <button onClick={() => setForm((f) => ({ ...f, foto: null }))} className="text-xs text-destructive hover:underline flex items-center gap-1">
                    <X className="h-3 w-3" /> Remover
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={100} placeholder="Ex: João da Silva" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: formatCpf(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cim">CIM *</Label>
                <Input id="cim" value={form.cim} onChange={(e) => setForm({ ...form, cim: e.target.value })} maxLength={20} placeholder="Ex: 123456" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar Alterações" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizar */}
      <Dialog open={!!viewIrmao} onOpenChange={(open) => { if (!open) setViewIrmao(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Dados do Irmão</DialogTitle>
          </DialogHeader>
          {viewIrmao && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="h-20 w-20">
                {viewIrmao.foto ? <AvatarImage src={viewIrmao.foto} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                  {getInitials(viewIrmao.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-3 w-full">
                <p className="font-semibold text-lg">{viewIrmao.nome}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">CPF</p>
                    <p className="font-medium">{viewIrmao.cpf}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">CIM</p>
                    <p className="font-medium">{viewIrmao.cim}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewIrmao(null)}>Fechar</Button>
            <Button onClick={() => { if (viewIrmao) { openEdit(viewIrmao); setViewIrmao(null); } }}>Editar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
