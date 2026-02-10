import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, CheckCircle2, Users, AlertCircle, Filter, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportInadimplenciaPdf } from "./ExportPanel";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const GRAUS = [
  { value: "todos", label: "Todos os Graus" },
  { value: "aprendiz", label: "Aprendiz" },
  { value: "companheiro", label: "Companheiro" },
  { value: "mestre", label: "Mestre" },
];

const VALID_STATUSES = ["pago", "em_aberto"];

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  data: string;
  status: string;
  member_id: string;
}

interface Member {
  id: string;
  full_name: string;
  cim: string;
  status: string;
  degree: string;
}

function getLabelGrau(degree: string) {
  const found = GRAUS.find((g) => g.value === degree);
  return found?.label ?? degree;
}

export default function RelatorioInadimplencia() {
  const { config } = useLodgeConfig();
  const { profile } = useAuth();
  const now = new Date();

  const [mes, setMes] = useState((now.getMonth() + 1).toString());
  const [ano, setAno] = useState(now.getFullYear().toString());
  const [grauFiltro, setGrauFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const anos = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - 2 + i).toString());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const startDate = `${ano}-${mes.padStart(2, "0")}-01`;
      const endMonth = parseInt(mes);
      const endYear = parseInt(ano);
      const lastDay = new Date(endYear, endMonth, 0).getDate();
      const endDate = `${ano}-${mes.padStart(2, "0")}-${lastDay}`;

      const [txRes, memRes] = await Promise.all([
        supabase.from("member_transactions")
          .select("id, tipo, valor, data, status, member_id")
          .in("status", VALID_STATUSES)
          .gte("data", startDate).lte("data", endDate),
        supabase.from("members").select("id, full_name, cim, status, degree"),
      ]);

      setTransactions(txRes.data ?? []);
      setMembers(memRes.data ?? []);
      setLoading(false);
    })();
  }, [ano, mes]);

  const periodoLabel = `${meses[parseInt(mes) - 1]} de ${ano}`;

  // Filter members by degree
  const filteredMembers = grauFiltro === "todos"
    ? members
    : members.filter((m) => m.degree === grauFiltro);

  // Compute inadimplentes
  const memberIdsComAberto = new Set(
    transactions.filter((t) => t.status === "em_aberto").map((t) => t.member_id)
  );

  const inadimplentes = filteredMembers
    .filter((m) => memberIdsComAberto.has(m.id))
    .map((m) => {
      const txs = transactions.filter((t) => t.member_id === m.id && t.status === "em_aberto");
      return {
        ...m,
        totalAberto: txs.reduce((s, t) => s + Number(t.valor), 0),
        qtdAberto: txs.length,
      };
    })
    .sort((a, b) => b.totalAberto - a.totalAberto);

  const totalGeralAberto = inadimplentes.reduce((s, m) => s + m.totalAberto, 0);
  const totalPendencias = inadimplentes.reduce((s, m) => s + m.qtdAberto, 0);
  const membrosAtivos = filteredMembers.filter((m) => m.status === "ativo");
  const percentInadimplentes = membrosAtivos.length > 0
    ? ((inadimplentes.length / membrosAtivos.length) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" /> Filtros — Situação Financeira dos Irmãos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Mês</Label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meses.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ano</Label>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anos.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Grau Maçônico</Label>
              <Select value={grauFiltro} onValueChange={setGrauFiltro}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRAUS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!loading && inadimplentes.length > 0 && (
        <div className="flex justify-end print:hidden">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => exportInadimplenciaPdf(config, inadimplentes, periodoLabel, profile?.full_name)}
          >
            <FileText className="h-3.5 w-3.5" /> Exportar PDF
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
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
                  Situação Financeira dos Irmãos — {periodoLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {profile?.full_name}
                </p>
                {grauFiltro !== "todos" && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Filtrado: {getLabelGrau(grauFiltro)}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Irmãos com Pendência</p>
                </div>
                <p className="text-xl font-bold font-serif">{inadimplentes.length}</p>
                <p className="text-[10px] text-muted-foreground">{percentInadimplentes}% do quadro ativo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 space-y-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Pendências</p>
                </div>
                <p className="text-xl font-bold font-serif">{totalPendencias}</p>
                <p className="text-[10px] text-muted-foreground">lançamentos em aberto</p>
              </CardContent>
            </Card>
            <Card className={totalGeralAberto > 0 ? "border-warning/30" : "border-success/30"}>
              <CardContent className="pt-5 space-y-1">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-warning" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Valor Pendente</p>
                </div>
                <p className="text-xl font-bold font-serif text-warning">{formatCurrency(totalGeralAberto)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Em Dia</p>
                </div>
                <p className="text-xl font-bold font-serif text-success">
                  {membrosAtivos.length - inadimplentes.length}
                </p>
                <p className="text-[10px] text-muted-foreground">irmãos sem pendências</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-sans font-semibold">
                Irmãos com Contribuições Pendentes
              </CardTitle>
              <CardDescription>
                Relação de irmãos que possuem valores em aberto no período de {periodoLabel}.
                Este relatório tem caráter informativo e visa auxiliar na regularização fraterna.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Irmão</TableHead>
                      <TableHead>CIM</TableHead>
                      <TableHead>Grau</TableHead>
                      <TableHead className="text-center">Pendências</TableHead>
                      <TableHead className="text-right">Valor Pendente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inadimplentes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-success" />
                          <p className="text-sm text-muted-foreground font-medium">
                            Todos os irmãos estão em dia com suas contribuições.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Nenhuma pendência encontrada para o período selecionado.
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {inadimplentes.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.full_name}</TableCell>
                            <TableCell className="text-sm">{m.cim}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {getLabelGrau(m.degree)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">{m.qtdAberto}</TableCell>
                            <TableCell className="text-right font-medium text-warning">
                              {formatCurrency(m.totalAberto)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell colSpan={3}>
                            Total ({inadimplentes.length} irmão{inadimplentes.length > 1 ? "s" : ""})
                          </TableCell>
                          <TableCell className="text-center">{totalPendencias}</TableCell>
                          <TableCell className="text-right text-warning">
                            {formatCurrency(totalGeralAberto)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Nota fraterna */}
          <Card className="bg-muted/30 border-muted">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground leading-relaxed text-center italic">
                "Este relatório tem finalidade exclusivamente administrativa e deve ser tratado com a discrição
                e a fraternidade que caracterizam nossa Ordem. Recomenda-se que a regularização seja conduzida
                de forma reservada, respeitando a dignidade de cada Irmão."
              </p>
            </CardContent>
          </Card>

          {/* Rodapé */}
          <div className="text-center text-[10px] text-muted-foreground pt-4 border-t space-y-1">
            <p>Documento de uso interno — Malhete Digital</p>
            <p>{config.lodge_name} — Nº {config.lodge_number} — Or∴ de {config.orient}</p>
            <p>Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </>
      )}
    </div>
  );
}
