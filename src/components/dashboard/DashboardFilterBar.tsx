import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DashboardFilters, PeriodoFilter, TipoLancamento, SituacaoFilter } from "./DashboardFilterTypes";
import { defaultFilters } from "./DashboardFilterTypes";

interface Props {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

const periodoLabels: Record<PeriodoFilter, string> = {
  mes_atual: "Mês Atual",
  ultimo_trimestre: "Último Trimestre",
  personalizado: "Personalizado",
};

const tipoLabels: Record<TipoLancamento, string> = {
  todos: "Todos os tipos",
  mensalidade: "Mensalidade",
  taxa: "Taxa",
  avulso: "Avulso",
};

const situacaoLabels: Record<SituacaoFilter, string> = {
  todos: "Todas",
  pago: "Pago",
  em_aberto: "Em Aberto",
};

export function DashboardFilterBar({ filters, onChange }: Props) {
  const activeCount = [
    filters.periodo !== "mes_atual",
    filters.tipoLancamento !== "todos",
    filters.situacao !== "todos",
  ].filter(Boolean).length;

  const update = (partial: Partial<DashboardFilters>) =>
    onChange({ ...filters, ...partial });

  const reset = () => onChange(defaultFilters);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border rounded-lg shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground mr-1">
        <Filter className="h-4 w-4" strokeWidth={1.8} />
        <span className="text-xs font-semibold uppercase tracking-wide">Filtros</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-bold">
            {activeCount}
          </Badge>
        )}
      </div>

      {/* Período */}
      <Select
        value={filters.periodo}
        onValueChange={(v) => update({ periodo: v as PeriodoFilter, dataInicio: undefined, dataFim: undefined })}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(periodoLabels).map(([k, v]) => (
            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Datas personalizadas */}
      {filters.periodo === "personalizado" && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5 font-normal", !filters.dataInicio && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {filters.dataInicio ? format(filters.dataInicio, "dd/MM/yyyy") : "Data início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dataInicio}
                onSelect={(d) => update({ dataInicio: d || undefined })}
                locale={ptBR}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5 font-normal", !filters.dataFim && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {filters.dataFim ? format(filters.dataFim, "dd/MM/yyyy") : "Data fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dataFim}
                onSelect={(d) => update({ dataFim: d || undefined })}
                locale={ptBR}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Tipo */}
      <Select
        value={filters.tipoLancamento}
        onValueChange={(v) => update({ tipoLancamento: v as TipoLancamento })}
      >
        <SelectTrigger className="w-[155px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(tipoLabels).map(([k, v]) => (
            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Situação */}
      <Select
        value={filters.situacao}
        onValueChange={(v) => update({ situacao: v as SituacaoFilter })}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(situacaoLabels).map(([k, v]) => (
            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset */}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={reset}>
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
