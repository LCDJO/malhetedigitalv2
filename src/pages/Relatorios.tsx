import { useState, useEffect, useRef } from "react";
import { getReportTransactions, getReportMembers } from "@/services/dashboard";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Printer, Loader2, AlertTriangle, DollarSign,
  User, CalendarRange, ClipboardList, Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import RelatorioBalancete from "@/components/relatorios/RelatorioBalancete";
import RelatorioInadimplencia from "@/components/relatorios/RelatorioInadimplencia";
import RelatorioMovimentacao from "@/components/relatorios/RelatorioMovimentacao";
import RelatorioBrothers from "@/components/relatorios/RelatorioBrothers";
import RelatorioAnual from "@/components/relatorios/RelatorioAnual";
import RelatorioPrestacaoContas from "@/components/relatorios/RelatorioPrestacaoContas";
import ExportPanel from "@/components/relatorios/ExportPanel";

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const VALID_STATUSES = ["pago", "em_aberto"];

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  data: string;
  status: string;
  member_id: string;
  created_by: string | null;
  created_at: string;
}

interface Member {
  id: string;
  full_name: string;
  cim: string;
  status: string;
}

export default function Relatorios() {
  const { config } = useLodgeConfig();
  const { profile } = useAuth();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear().toString());
  const [mes, setMes] = useState((now.getMonth() + 1).toString());
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState("balancete");

  // Shared data for Balancete, Inadimplência, Movimentação (month-filtered)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const startDate = `${ano}-${mes.padStart(2, "0")}-01`;
      const endMonth = parseInt(mes);
      const endYear = parseInt(ano);
      const lastDay = new Date(endYear, endMonth, 0).getDate();
      const endDate = `${ano}-${mes.padStart(2, "0")}-${lastDay}`;

      try {
        const [txData, memData] = await Promise.all([
          getReportTransactions({ start_date: startDate, end_date: endDate, statuses: VALID_STATUSES }),
          getReportMembers("id,full_name,cim,status"),
        ]);
        setTransactions(txData ?? []);
        setMembers(memData ?? []);
      } catch {
        // silently fail
      }
      setLoading(false);
    })();
  }, [ano, mes]);

  const handlePrint = () => window.print();
  const membrosAtivos = members.filter((m) => m.status === "ativo");
  const periodoLabel = `${meses[parseInt(mes) - 1]} de ${ano}`;
  const anos = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - 2 + i).toString());

  // Tabs that use shared month filter
  const usesMonthFilter = ["balancete", "movimentacao"].includes(activeTab);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold">Relatórios Oficiais</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prestação de contas — dados consolidados do sistema
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {usesMonthFilter && (
            <>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <Button variant="outline" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center space-y-1 mb-8">
        <p className="text-lg font-bold font-serif">{config.lodge_name || "Loja Maçônica"}</p>
        <p className="text-sm">Nº {config.lodge_number} — Or∴ de {config.orient}</p>
        {config.potencia && <p className="text-xs text-muted-foreground">{config.potencia}</p>}
        <Separator className="my-3" />
        <p className="text-base font-semibold">DEMONSTRATIVO FINANCEIRO — {periodoLabel.toUpperCase()}</p>
        <p className="text-xs text-muted-foreground">
          Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {profile?.full_name}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full print:block">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1 print:hidden">
          <TabsTrigger value="balancete" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5" /> Balancete
          </TabsTrigger>
          <TabsTrigger value="prestacao" className="gap-1.5 text-xs sm:text-sm">
            <ClipboardList className="h-3.5 w-3.5" /> Prestação de Contas
          </TabsTrigger>
          <TabsTrigger value="inadimplencia" className="gap-1.5 text-xs sm:text-sm">
            <AlertTriangle className="h-3.5 w-3.5" /> Inadimplência
          </TabsTrigger>
          <TabsTrigger value="individual" className="gap-1.5 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5" /> Individual
          </TabsTrigger>
          <TabsTrigger value="anual" className="gap-1.5 text-xs sm:text-sm">
            <CalendarRange className="h-3.5 w-3.5" /> Resumo Anual
          </TabsTrigger>
          <TabsTrigger value="movimentacao" className="gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-3.5 w-3.5" /> Movimentação
          </TabsTrigger>
          <TabsTrigger value="exportacao" className="gap-1.5 text-xs sm:text-sm">
            <Download className="h-3.5 w-3.5" /> Exportação
          </TabsTrigger>
        </TabsList>

        {/* Month-filtered tabs share loading */}
        {usesMonthFilter && loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="balancete" className="mt-6 print:block print:mt-4">
              <RelatorioBalancete
                transactions={transactions}
                activeMembers={membrosAtivos.length}
                periodoLabel={periodoLabel}
              />
            </TabsContent>

          </>
        )}

        {/* Self-managed tabs */}
        <TabsContent value="inadimplencia" className="mt-6">
          <RelatorioInadimplencia />
        </TabsContent>

        <TabsContent value="movimentacao" className="mt-6">
          <RelatorioMovimentacao
            transactions={transactions}
            members={members}
            periodoLabel={periodoLabel}
          />
        </TabsContent>

        {/* Self-managed tabs */}
        <TabsContent value="prestacao" className="mt-6">
          <RelatorioPrestacaoContas />
        </TabsContent>

        <TabsContent value="individual" className="mt-6">
          <RelatorioBrothers />
        </TabsContent>

        <TabsContent value="anual" className="mt-6">
          <RelatorioAnual />
        </TabsContent>

        <TabsContent value="exportacao" className="mt-6">
          <ExportPanel
            config={config}
            transactions={transactions}
            members={members}
            periodoLabel={periodoLabel}
            emitidoPor={profile?.full_name}
            ano={ano}
          />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-[10px] text-muted-foreground pt-4 border-t space-y-1 print:mt-8">
        <p>Documento gerado automaticamente pelo sistema Malhete Digital</p>
        <p>{config.lodge_name} — Nº {config.lodge_number} — Or∴ de {config.orient}</p>
        <p>Emitido em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>
    </div>
  );
}
