/**
 * Admin Atendimento Analytics — Platform-wide support analytics
 * Adapted from Gestão RH PlatformSupportAnalytics.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Loader2, Trophy, Users, BarChart3, CheckCircle, Timer, PieChart, MessageSquare, AlertCircle, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { TicketService } from '@/domains/support/ticket-service';
import { EvaluationService } from '@/domains/support/evaluation-service';
import type { SupportTicket, SupportEvaluation, TicketStatus } from '@/domains/support/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Aberto', color: 'hsl(210 65% 50%)' },
  awaiting_agent: { label: 'Aguardando Agente', color: 'hsl(35 80% 50%)' },
  awaiting_customer: { label: 'Aguardando Resposta', color: 'hsl(280 60% 55%)' },
  in_progress: { label: 'Em Andamento', color: 'hsl(200 70% 50%)' },
  resolved: { label: 'Resolvido', color: 'hsl(145 60% 42%)' },
  closed: { label: 'Fechado', color: 'hsl(0 0% 50%)' },
  cancelled: { label: 'Cancelado', color: 'hsl(0 60% 50%)' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'hsl(200 50% 55%)' },
  medium: { label: 'Média', color: 'hsl(35 80% 50%)' },
  high: { label: 'Alta', color: 'hsl(20 80% 50%)' },
  urgent: { label: 'Urgente', color: 'hsl(0 70% 50%)' },
};

const CATEGORY_LABELS: Record<string, string> = {
  billing: 'Faturamento', technical: 'Técnico', feature_request: 'Solicitação',
  bug_report: 'Bug', account: 'Conta', general: 'Geral',
};

interface CategoryStats {
  category: string;
  label: string;
  totalTickets: number;
  resolvedTickets: number;
  avgResolutionMin: number | null;
  resolutionRate: number;
}

export default function AdminAtendimento() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [evaluations, setEvaluations] = useState<SupportEvaluation[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [allTickets, evals] = await Promise.all([
          TicketService.listAll(),
          EvaluationService.listAll(),
        ]);
        setTickets(allTickets);
        setEvaluations(evals);

        // Category stats
        const byCat: Record<string, { total: number; resolved: number; resTimes: number[] }> = {};
        for (const t of allTickets) {
          const cat = t.category ?? 'general';
          if (!byCat[cat]) byCat[cat] = { total: 0, resolved: 0, resTimes: [] };
          byCat[cat].total++;
          if (t.resolved_at) {
            byCat[cat].resolved++;
            const mins = (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 60000;
            if (mins > 0) byCat[cat].resTimes.push(mins);
          }
        }
        setCategoryStats(
          Object.entries(byCat)
            .map(([cat, d]) => ({
              category: cat,
              label: CATEGORY_LABELS[cat] ?? cat,
              totalTickets: d.total,
              resolvedTickets: d.resolved,
              avgResolutionMin: d.resTimes.length > 0
                ? Math.round(d.resTimes.reduce((a, b) => a + b, 0) / d.resTimes.length)
                : null,
              resolutionRate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0,
            }))
            .sort((a, b) => b.totalTickets - a.totalTickets),
        );
      } catch { toast.error('Erro ao carregar dados de atendimento'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const resolvedCount = tickets.filter(t => t.resolved_at).length;
  const globalResolutionRate = tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0;
  const globalAgentAvg = evaluations.filter(e => e.agent_score != null).length > 0
    ? evaluations.reduce((s, e) => s + (e.agent_score ?? 0), 0) / evaluations.filter(e => e.agent_score != null).length
    : 0;

  const filteredTickets = statusFilter === 'all'
    ? tickets
    : tickets.filter(t => t.status === statusFilter);

  // Ticket detail view (admin side with reply)
  if (selectedTicket) {
    return <AdminTicketDetail ticket={selectedTicket} onBack={() => { setSelectedTicket(null); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Atendimento</h1>
          <p className="text-sm text-muted-foreground">Gestão de chamados e analytics da plataforma</p>
        </div>
      </div>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList>
          <TabsTrigger value="tickets" className="gap-2">
            <MessageSquare className="h-3.5 w-3.5" /> Chamados
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* ── Tickets Tab ── */}
        <TabsContent value="tickets" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{filteredTickets.length} chamado(s)</p>
          </div>

          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Nenhum chamado encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map(ticket => {
                const st = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
                const pr = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.medium;
                return (
                  <Card
                    key={ticket.id}
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="py-3 px-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {CATEGORY_LABELS[ticket.category]} · {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                          · Tenant: {ticket.tenant_id.slice(0, 8)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]" style={{ backgroundColor: `${pr.color}15`, color: pr.color }}>
                        {pr.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]" style={{ backgroundColor: `${st.color}15`, color: st.color }}>
                        {st.label}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Analytics Tab ── */}
        <TabsContent value="analytics" className="mt-4 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="py-4 px-4 text-center">
                <MessageSquare className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-3xl font-bold text-foreground">{tickets.length}</p>
                <p className="text-xs text-muted-foreground">Total de Chamados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 px-4 text-center">
                <CheckCircle className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                <p className="text-3xl font-bold text-foreground">{globalResolutionRate}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Resolução</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 px-4 text-center">
                <Star className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <p className="text-3xl font-bold text-foreground">{globalAgentAvg > 0 ? globalAgentAvg.toFixed(1) : '—'}</p>
                <p className="text-xs text-muted-foreground">Nota Média</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 px-4 text-center">
                <p className="text-3xl font-bold text-foreground">{evaluations.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Avaliações</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" /> Resolução por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum ticket registrado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Tickets</TableHead>
                      <TableHead className="text-center">Resolvidos</TableHead>
                      <TableHead className="text-center">
                        <span className="flex items-center justify-center gap-1"><Timer className="h-3 w-3" />Tempo Médio</span>
                      </TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryStats.map(cat => (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium text-sm">{cat.label}</TableCell>
                        <TableCell className="text-center text-sm">{cat.totalTickets}</TableCell>
                        <TableCell className="text-center text-sm">{cat.resolvedTickets}</TableCell>
                        <TableCell className="text-center text-sm">
                          {cat.avgResolutionMin !== null ? formatDuration(cat.avgResolutionMin) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <ResolutionBadge rate={cat.resolutionRate} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Admin Ticket Detail (with respond) ──

function AdminTicketDetail({ ticket, onBack }: { ticket: SupportTicket; onBack: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<import('@/domains/support/types').TicketMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const msgs = await TicketService.getMessages(ticket.id);
      setMessages(msgs);
    } catch { toast.error('Erro ao carregar mensagens'); }
    finally { setLoading(false); }
  }, [ticket.id]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !user) return;
    try {
      setSending(true);
      await TicketService.sendMessage({ ticket_id: ticket.id, content: newMsg, sender_type: 'platform_agent' }, user.id);
      setNewMsg('');
      await loadMessages();
    } catch { toast.error('Erro ao enviar mensagem'); }
    finally { setSending(false); }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      setUpdatingStatus(true);
      await TicketService.updateStatus(ticket.id, status);
      toast.success(`Status alterado para ${STATUS_CONFIG[status]?.label ?? status}`);
    } catch { toast.error('Erro ao alterar status'); }
    finally { setUpdatingStatus(false); }
  };

  const st = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <AlertCircle className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex-1" />
        <Select defaultValue={ticket.status} onValueChange={v => handleStatusChange(v as TicketStatus)} disabled={updatingStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Alterar status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="py-4 px-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{ticket.subject}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {CATEGORY_LABELS[ticket.category]} · {new Date(ticket.created_at).toLocaleString('pt-BR')}
                · Tenant: {ticket.tenant_id.slice(0, 8)}
              </p>
            </div>
            <Badge style={{ backgroundColor: `${st.color}15`, color: st.color }}>{st.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-3">{ticket.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Mensagens</h3>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma mensagem ainda.</p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {messages.map(msg => {
                  const isAgent = msg.sender_type === 'platform_agent';
                  return (
                    <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isAgent ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isAgent ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {isAgent ? ' · Você' : ' · Tenant'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Responder ao chamado..."
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <Button size="icon" onClick={handleSend} disabled={sending || !newMsg.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// ── Helpers ──

function ResolutionBadge({ rate }: { rate: number }) {
  const bg = rate >= 80 ? 'hsl(145 60% 42% / 0.1)' : rate >= 50 ? 'hsl(45 90% 55% / 0.1)' : 'hsl(0 70% 55% / 0.1)';
  const fg = rate >= 80 ? 'hsl(145 60% 42%)' : rate >= 50 ? 'hsl(45 90% 55%)' : 'hsl(0 70% 55%)';
  return (
    <Badge variant="secondary" className="text-xs" style={{ backgroundColor: bg, color: fg }}>
      {rate}%
    </Badge>
  );
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return `${h}h${m > 0 ? ` ${m}min` : ''}`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
