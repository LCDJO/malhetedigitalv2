import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Search, Plus, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

interface Irmao {
  id: number;
  nome: string;
  cim: string;
  grau: string;
  cargo: string;
  status: "ativo" | "inativo";
  email: string;
  telefone: string;
}

const initialData: Irmao[] = [
  { id: 1, nome: "João Silva", cim: "123456", grau: "Mestre", cargo: "Venerável Mestre", status: "ativo", email: "joao@email.com", telefone: "(11) 99999-0001" },
  { id: 2, nome: "Carlos Mendes", cim: "234567", grau: "Companheiro", cargo: "1º Vigilante", status: "ativo", email: "carlos@email.com", telefone: "(11) 99999-0002" },
  { id: 3, nome: "Pedro Alves", cim: "345678", grau: "Mestre", cargo: "Tesoureiro", status: "ativo", email: "pedro@email.com", telefone: "(11) 99999-0003" },
  { id: 4, nome: "Marcos Oliveira", cim: "456789", grau: "Aprendiz", cargo: "—", status: "ativo", email: "marcos@email.com", telefone: "(11) 99999-0004" },
  { id: 5, nome: "Antônio Souza", cim: "567890", grau: "Mestre", cargo: "Secretário", status: "inativo", email: "antonio@email.com", telefone: "(11) 99999-0005" },
];

const emptyForm = { nome: "", cim: "", grau: "", cargo: "", email: "", telefone: "" };

export function CadastroIrmaos() {
  const [irmaos, setIrmaos] = useState<Irmao[]>(initialData);
  const [search, setSearch] = useState("");
  const [filterGrau, setFilterGrau] = useState("todos");
  const [form, setForm] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = irmaos.filter((i) => {
    const matchSearch = i.nome.toLowerCase().includes(search.toLowerCase()) || i.cim.includes(search);
    const matchGrau = filterGrau === "todos" || i.grau === filterGrau;
    return matchSearch && matchGrau;
  });

  const handleAdd = () => {
    if (!form.nome.trim() || !form.cim.trim()) {
      toast.error("Nome e CIM são obrigatórios.");
      return;
    }
    const novo: Irmao = {
      id: Date.now(),
      nome: form.nome.trim(),
      cim: form.cim.trim(),
      grau: form.grau || "Aprendiz",
      cargo: form.cargo.trim() || "—",
      status: "ativo",
      email: form.email.trim(),
      telefone: form.telefone.trim(),
    };
    setIrmaos((prev) => [novo, ...prev]);
    setForm(emptyForm);
    setDialogOpen(false);
    toast.success("Irmão cadastrado com sucesso.");
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="text-base font-sans font-semibold">Quadro de Obreiros</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CIM" className="pl-9 w-56 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterGrau} onValueChange={setFilterGrau}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="Grau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os graus</SelectItem>
              <SelectItem value="Aprendiz">Aprendiz</SelectItem>
              <SelectItem value="Companheiro">Companheiro</SelectItem>
              <SelectItem value="Mestre">Mestre</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-9">
                <Plus className="h-4 w-4" />
                Novo Irmão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Cadastrar Novo Irmão</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome completo *</Label>
                    <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cim">CIM *</Label>
                    <Input id="cim" value={form.cim} onChange={(e) => setForm({ ...form, cim: e.target.value })} maxLength={20} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="grau">Grau</Label>
                    <Select value={form.grau} onValueChange={(v) => setForm({ ...form, grau: v })}>
                      <SelectTrigger id="grau"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                        <SelectItem value="Companheiro">Companheiro</SelectItem>
                        <SelectItem value="Mestre">Mestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input id="cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} maxLength={50} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} maxLength={20} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleAdd}>Cadastrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CIM</TableHead>
                <TableHead>Grau</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
              ) : (
                filtered.map((irmao) => (
                  <TableRow key={irmao.id}>
                    <TableCell className="font-medium">{irmao.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{irmao.cim}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{irmao.grau}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{irmao.cargo}</TableCell>
                    <TableCell>
                      {irmao.status === "ativo" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success font-medium"><UserCheck className="h-3 w-3" />Ativo</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium"><UserX className="h-3 w-3" />Inativo</span>
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
  );
}
