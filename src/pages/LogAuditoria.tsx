import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface AuditEntry {
  id: number;
  user_id: string | null;
  user_name: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  LOGIN: "Login",
  LOGOUT: "Logout",
  GRANT_EXEMPTION: "Concessão de Isenção",
  REVOKE_EXEMPTION: "Revogação de Isenção",
  DELETE_ENTRY: "Exclusão de Lançamento",
  EDIT_VALUE: "Alteração de Valor",
  CREATE_USER: "Criação de Usuário",
  UPDATE_USER: "Atualização de Usuário",
  TOGGLE_USER_STATUS: "Alteração de Status de Usuário",
  ASSIGN_ROLE: "Atribuição de Perfil",
};

const tableLabels: Record<string, string> = {
  profiles: "Perfis",
  user_roles: "Cargos",
  audit_log: "Log de Auditoria",
};

const PAGE_SIZE = 25;

export default function LogAuditoria() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailEntry, setDetailEntry] = useState<AuditEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: "list",
        limit: PAGE_SIZE.toString(),
        offset: (page * PAGE_SIZE).toString(),
      });
      if (search) params.set("search", search);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-log?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const result = await resp.json();
      if (resp.ok) {
        setEntries(result.data || []);
        setTotal(result.count || 0);
      } else {
        toast.error(result.error || "Erro ao carregar logs");
      }
    } catch {
      toast.error("Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, page, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Log de Auditoria
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro somente leitura de todas as ações realizadas no sistema
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ScrollText className="h-4 w-4 text-muted-foreground" />
              Registros ({total})
            </CardTitle>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ação, usuário..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button type="submit" variant="outline" size="sm" className="h-9">
                Buscar
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[10px] uppercase tracking-wide font-semibold">
                  Data/Hora
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wide font-semibold">
                  Usuário
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wide font-semibold">
                  Ação
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wide font-semibold">
                  Entidade
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wide font-semibold text-right">
                  Detalhes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(
                        new Date(entry.created_at),
                        "dd/MM/yyyy HH:mm:ss",
                        { locale: ptBR }
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {entry.user_name || "Sistema"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5"
                      >
                        {actionLabels[entry.action] || entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.target_table && (
                        <span>
                          {tableLabels[entry.target_table] ||
                            entry.target_table}
                          {entry.target_id && (
                            <span className="ml-1 font-mono text-[10px]">
                              #{entry.target_id.slice(0, 8)}
                            </span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.details && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setDetailEntry(entry)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Página {page + 1} de {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={detailEntry !== null}
        onOpenChange={(open) => {
          if (!open) setDetailEntry(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Detalhes do Registro
            </DialogTitle>
          </DialogHeader>
          {detailEntry && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Usuário
                  </p>
                  <p>{detailEntry.user_name || "Sistema"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Data/Hora
                  </p>
                  <p>
                    {format(
                      new Date(detailEntry.created_at),
                      "dd/MM/yyyy HH:mm:ss",
                      { locale: ptBR }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Ação
                  </p>
                  <p>
                    {actionLabels[detailEntry.action] || detailEntry.action}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Entidade
                  </p>
                  <p>
                    {detailEntry.target_table
                      ? `${tableLabels[detailEntry.target_table] || detailEntry.target_table}${detailEntry.target_id ? ` #${detailEntry.target_id.slice(0, 8)}` : ""}`
                      : "—"}
                  </p>
                </div>
              </div>
              {detailEntry.ip_address && (
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                    IP
                  </p>
                  <p className="font-mono text-xs">{detailEntry.ip_address}</p>
                </div>
              )}
              {detailEntry.details && (
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">
                    Dados
                  </p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64 font-mono">
                    {JSON.stringify(detailEntry.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
