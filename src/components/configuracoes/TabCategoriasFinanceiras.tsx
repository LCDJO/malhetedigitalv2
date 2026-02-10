import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tags, Plus, Trash2 } from "lucide-react";

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: "entrada" | "saida";
  ativa: boolean;
}

interface Props {
  categorias: CategoriaFinanceira[];
  canWrite: boolean;
  onChange: (categorias: CategoriaFinanceira[]) => void;
}

export function TabCategoriasFinanceiras({ categorias, canWrite, onChange }: Props) {
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novoTipo, setNovoTipo] = useState<"entrada" | "saida">("entrada");

  const handleAdd = () => {
    const nome = novaCategoria.trim();
    if (!nome) return;
    if (categorias.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) return;
    onChange([
      ...categorias,
      { id: crypto.randomUUID(), nome, tipo: novoTipo, ativa: true },
    ]);
    setNovaCategoria("");
  };

  const handleToggle = (id: string) => {
    onChange(categorias.map((c) => (c.id === id ? { ...c, ativa: !c.ativa } : c)));
  };

  const handleRemove = (id: string) => {
    onChange(categorias.filter((c) => c.id !== id));
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Tags className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Categorias Financeiras</CardTitle>
        </div>
        <CardDescription>
          Categorias utilizadas nos lançamentos da Tesouraria. Adicione ou desative conforme necessário.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Add new */}
        {canWrite && (
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Nome da categoria"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <Select value={novoTipo} onValueChange={(v) => setNovoTipo(v as "entrada" | "saida")}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} className="gap-1">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                {canWrite && <TableHead className="w-[80px]">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canWrite ? 4 : 3} className="text-center text-muted-foreground py-6">
                    Nenhuma categoria cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {categorias.map((cat) => (
                <TableRow key={cat.id} className={!cat.ativa ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{cat.nome}</TableCell>
                  <TableCell>
                    <Badge variant={cat.tipo === "entrada" ? "default" : "secondary"} className="text-[10px]">
                      {cat.tipo === "entrada" ? "Entrada" : "Saída"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canWrite ? (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleToggle(cat.id)}>
                        {cat.ativa ? "Ativa" : "Inativa"}
                      </Button>
                    ) : (
                      <span className="text-xs">{cat.ativa ? "Ativa" : "Inativa"}</span>
                    )}
                  </TableCell>
                  {canWrite && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(cat.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
