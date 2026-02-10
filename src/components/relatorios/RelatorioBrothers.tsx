import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, User, Search, Filter, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, FileText as FileTextIcon,
} from "lucide-react";
import { exportIndividualPdf } from "./ExportPanel";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getLabelTipo(tipo: string) {
  switch (tipo) {
    case "mensalidade": return "Mensalidade";
    case "taxa": return "Taxa";
    case "avulso": return "Avulso";
    case "despesa": return "Despesa";
    default: return tipo;
  }
}

function getLabelGrau(degree: string) {
  switch (degree) {
    case "aprendiz": return "Aprendiz";
    case "companheiro": return "Companheiro";
    case "mestre": return "Mestre";
    default: return degree;
  }
}

function getLabelStatus(status: string) {
  switch (status) {
    case "ativo": return "Ativo";
    case "inativo": return "Inativo";
    case "suspenso": return "Suspenso";
    case "remido": return "Remido";
    default: return status;
  }
}

const TIPOS = [
  { value: "todos", label: "Todos os Tipos" },
  { value: "mensalidade", label: "Mensalidade" },
  { value: "taxa", label: "Taxa" },
  { value: "avulso", label: "Avulso" },
  { value: "despesa", label: "Despesa" },
];

const SITUACOES = [
  { value: "todas", label: "Todas as Situações" },
  { value: "pago", label: "Pago" },
  { value: "em_aberto", label: "Em Aberto" },
];

interface Member {
  id: string;
  full_name: string;
  cim: string;
  cpf: string;
  status: string;
  degree: string;
  email: string | null;
  phone: string | null;
  initiation_date: string | null;
  elevation_date: string | null;
  exaltation_date: string | null;
}

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  status: string;
  member_id: string;
  created_at?: string;
}

export default function RelatorioBrothers() {
  const { config } = useLodgeConfig();
  const { profile } = useAuth();
  const now = new Date();

  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [situacaoFiltro, setSituacaoFiltro] = useState("todas");
  const [loading, setLoading] = useState(true);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("members")
        .select("id, full_name, cim, cpf, status, degree, email, phone, initiation_date, elevation_date, exaltation_date")
        .order("full_name");
      setMembers(data ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedMember) { setTransactions([]); return; }
    (async () => {
      setLoadingTx(true);
      const { data } = await supabase
        .from("member_transactions")
        .select("id, tipo, valor, descricao, data, status, member_id, created_at")
        .eq("member_id", selectedMember)
        .in("status", ["pago", "em_aberto"])
        .order("data", { ascending: false });
      setTransactions(data ?? []);
      setLoadingTx(false);
    })();
  }, [selectedMember]);

  const member = members.find((m) => m.id === selectedMember);

  // Apply filters
  const filtered = transactions
    .filter((t) => tipoFiltro === "todos" || t.tipo === tipoFiltro)
    .filter((t) => situacaoFiltro === "todas" || t.status === situacaoFiltro);

  const totalPago = transactions.filter((t) => t.status === "pago" && t.tipo !== "despesa").reduce((s, t) => s + Number(t.valor), 0);
  const totalAberto = transactions.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesas = transactions.filter((t) => t.tipo === "despesa" && t.status === "pago").reduce((s, t) => s + Number(t.valor), 0);

  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filtro de seleção */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Selecionar Irmão
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
              <SelectTrigger className="sm:w-[300px]">
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

      {!selectedMember && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Selecione um irmão para gerar seu relatório financeiro individual.</p>
          <p className="text-xs mt-1">O relatório pode ser utilizado para acompanhamento interno ou solicitação formal.</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {member && (
        <>
          {/* Cabeçalho institucional */}
          <Card className="border-primary/20">
            <CardContent className="pt-6 pb-5">
              <div className="text-center space-y-1.5">
                <p className="text-lg font-bold font-serif tracking-wide">{config.lodge_name || "Loja Maçônica"}</p>
                <p className="text-sm text-muted-foreground">Nº {config.lodge_number} — Or∴ de {config.orient}</p>
                {config.potencia && <p className="text-xs text-muted-foreground">{config.potencia}</p>}
                <Separator className="my-3" />
                <p className="text-base font-semibold uppercase tracking-wider">
                  Relatório Financeiro Individual
                </p>
                <p className="text-xs text-muted-foreground">
                  Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {profile?.full_name}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dados do irmão */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Dados do Irmão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex justify-between border-b border-dashed border-border pb-2">
                  <span className="text-muted-foreground">Nome Completo</span>
                  <span className="font-medium">{member.full_name}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-border pb-2">
                  <span className="text-muted-foreground">CIM</span>
                  <span className="font-medium">{member.cim}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-border pb-2">
                  <span className="text-muted-foreground">Grau Maçônico</span>
                  <Badge variant="outline" className="text-xs">{getLabelGrau(member.degree)}</Badge>
                </div>
                <div className="flex justify-between border-b border-dashed border-border pb-2">
                  <span className="text-muted-foreground">Situação Cadastral</span>
                  <Badge
                    variant="outline"
                    className={
                      member.status === "ativo"
                        ? "bg-success/10 text-success border-success/20 text-xs"
                        : "bg-warning/10 text-warning border-warning/20 text-xs"
                    }
                  >
                    {getLabelStatus(member.status)}
                  </Badge>
                </div>
                {member.initiation_date && (
                  <div className="flex justify-between border-b border-dashed border-border pb-2">
                    <span className="text-muted-foreground">Iniciação</span>
                    <span className="font-medium">{format(new Date(member.initiation_date + "T12:00:00"), "dd/MM/yyyy")}</span>
                  </div>
                )}
                {member.elevation_date && (
                  <div className="flex justify-between border-b border-dashed border-border pb-2">
                    <span className="text-muted-foreground">Elevação</span>
                    <span className="font-medium">{format(new Date(member.elevation_date + "T12:00:00"), "dd/MM/yyyy")}</span>
                  </div>
                )}
                {member.exaltation_date && (
                  <div className="flex justify-between border-b border-dashed border-border pb-2">
                    <span className="text-muted-foreground">Exaltação</span>
                    <span className="font-medium">{format(new Date(member.exaltation_date + "T12:00:00"), "dd/MM/yyyy")}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex justify-between border-b border-dashed border-border pb-2">
                    <span className="text-muted-foreground">E-mail</span>
                    <span className="font-medium">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex justify-between border-b border-dashed border-border pb-2">
                    <span className="text-muted-foreground">Telefone</span>
                    <span className="font-medium">{member.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resumo financeiro */}
          {loadingTx ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-5 space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Pago</p>
                    </div>
                    <p className="text-xl font-bold font-serif text-success">{formatCurrency(totalPago)}</p>
                  </CardContent>
                </Card>
                <Card className={totalAberto > 0 ? "border-warning/30" : "border-success/30"}>
                  <CardContent className="pt-5 space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Em Aberto</p>
                    </div>
                    <p className="text-xl font-bold font-serif text-warning">{formatCurrency(totalAberto)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Despesas</p>
                    </div>
                    <p className="text-xl font-bold font-serif">{formatCurrency(totalDespesas)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 space-y-1">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4 text-primary" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Lançamentos</p>
                    </div>
                    <p className="text-xl font-bold font-serif">{transactions.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Situação */}
              <Card className="border-primary/20">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {totalAberto === 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-warning" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {totalAberto === 0
                            ? "Irmão em dia com todas as contribuições"
                            : "Existem contribuições pendentes de regularização"
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {totalAberto === 0
                            ? "Nenhuma pendência financeira registrada no sistema."
                            : `${transactions.filter((t) => t.status === "em_aberto").length} lançamento(s) pendente(s) totalizando ${formatCurrency(totalAberto)}.`
                          }
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={totalAberto === 0
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-warning/10 text-warning border-warning/20"
                      }
                    >
                      {totalAberto === 0 ? "Regular" : "Pendente"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Export button */}
              <div className="flex justify-end print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => exportIndividualPdf(config, member as any, transactions, profile?.full_name)}
                >
                  <FileTextIcon className="h-3.5 w-3.5" /> Exportar PDF Individual
                </Button>
              </div>

              {/* Filtros da tabela */}
              <Card className="print:hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" /> Filtros do Histórico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Situação</Label>
                      <Select value={situacaoFiltro} onValueChange={setSituacaoFiltro}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SITUACOES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {(tipoFiltro !== "todos" || situacaoFiltro !== "todas") && (
                      <p className="text-xs text-muted-foreground self-center">
                        Exibindo {filtered.length} de {transactions.length} lançamentos
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de histórico */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-sans font-semibold">Histórico Financeiro Completo</CardTitle>
                  <CardDescription>
                    Lançamentos financeiros de {member.full_name} — CIM {member.cim}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Ref.</TableHead>
                          <TableHead className="w-[90px]">Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-center">Situação</TableHead>
                          <TableHead>Observações</TableHead>
                          <TableHead className="w-[100px]">Registrado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              Nenhum lançamento encontrado com os filtros aplicados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {filtered.map((t) => (
                              <TableRow key={t.id}>
                                <TableCell>
                                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                    {t.id.slice(0, 8).toUpperCase()}
                                  </code>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm">
                                  {format(new Date(t.data + "T12:00:00"), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[10px]">
                                    {getLabelTipo(t.tipo)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium text-sm">
                                  {formatCurrency(Number(t.valor))}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={t.status === "pago"
                                      ? "bg-success/10 text-success border-success/20 text-[10px]"
                                      : "bg-warning/10 text-warning border-warning/20 text-[10px]"
                                    }
                                  >
                                    {t.status === "pago" ? "Pago" : "Em Aberto"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">
                                  {t.descricao || "—"}
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                                  {t.created_at ? format(new Date(t.created_at), "dd/MM/yy HH:mm") : "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/30 font-semibold">
                              <TableCell colSpan={3} className="text-right text-sm">
                                Total ({filtered.length} lançamentos)
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(filtered.reduce((s, t) => s + Number(t.valor), 0))}
                              </TableCell>
                              <TableCell colSpan={3} />
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-[10px] text-muted-foreground">
                    <FileTextIcon className="h-3 w-3 mt-0.5 shrink-0" />
                    <p>
                      Ref. = identificador único para rastreabilidade até o lançamento original.
                      Apenas registros com status válido são exibidos.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Rodapé */}
              <div className="text-center text-[10px] text-muted-foreground pt-4 border-t space-y-1">
                <Separator className="mb-4" />
                <p className="font-medium">Documento para acompanhamento interno ou solicitação formal</p>
                <p>Gerado automaticamente pelo sistema Malhete Digital</p>
                <p>{config.lodge_name} — Nº {config.lodge_number} — Or∴ de {config.orient}</p>
                <p>Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
