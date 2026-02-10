import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Search } from "lucide-react";
import { format } from "date-fns";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Member {
  id: string;
  full_name: string;
  cim: string;
  status: string;
  degree: string;
}

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  status: string;
  member_id: string;
}

export default function RelatorioBrothers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("members").select("id, full_name, cim, status, degree").order("full_name");
      setMembers(data ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedMember) { setTransactions([]); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("member_transactions")
        .select("id, tipo, valor, descricao, data, status, member_id")
        .eq("member_id", selectedMember)
        .order("data", { ascending: false });
      setTransactions(data ?? []);
      setLoading(false);
    })();
  }, [selectedMember]);

  const member = members.find((m) => m.id === selectedMember);
  const totalPago = transactions.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0);
  const totalAberto = transactions.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);

  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Filtros do Relatório Individual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CIM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="sm:w-[280px]">
                <SelectValue placeholder="Selecione um irmão" />
              </SelectTrigger>
              <SelectContent>
                {filteredMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name} — CIM {m.cim}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!selectedMember && (
        <div className="text-center py-12 text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Selecione um irmão para visualizar seu relatório financeiro individual.</p>
        </div>
      )}

      {selectedMember && loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {member && !loading && (
        <>
          {/* Resumo do irmão */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-lg font-serif font-bold">{member.full_name}</p>
                  <p className="text-sm text-muted-foreground">CIM: {member.cim} · Grau: {member.degree} · Status: {member.status}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Pago</p>
                    <p className="font-bold text-success">{formatCurrency(totalPago)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Em Aberto</p>
                    <p className="font-bold text-destructive">{formatCurrency(totalAberto)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lançamentos</p>
                    <p className="font-bold">{transactions.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-sans font-semibold">Histórico Completo</CardTitle>
              <CardDescription>Todos os lançamentos financeiros deste irmão</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum lançamento encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(t.data + "T12:00:00"), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {t.tipo === "mensalidade" ? "Mensalidade" : t.tipo === "taxa" ? "Taxa" : t.tipo === "avulso" ? "Avulso" : t.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">{t.descricao}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={t.status === "pago"
                                ? "bg-success/10 text-success border-success/20 text-[10px]"
                                : "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                              }
                            >
                              {t.status === "pago" ? "Pago" : "Em Aberto"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(Number(t.valor))}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
