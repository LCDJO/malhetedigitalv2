import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2, Search, CheckCircle2, Clock, ClipboardList } from "lucide-react";

interface AceiteRow {
  id: string;
  usuario_id: string;
  termo_id: string;
  data_hora_aceite: string;
  user_name: string;
  user_role: string | null;
  termo_versao: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
}

interface RoleRow {
  user_id: string;
  role: string;
}

interface TermoRow {
  id: string;
  versao: string;
  ativo: boolean;
}

const roleLabelsMap: Record<string, string> = {
  administrador: "Administrador",
  veneravel: "Venerável Mestre",
  secretario: "Secretário",
  tesoureiro: "Tesoureiro",
  orador: "Orador",
  chanceler: "Chanceler",
  consulta: "Consulta",
};

const ControleAceites = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AceiteRow[]>([]);
  const [pendingUsers, setPendingUsers] = useState<{ id: string; name: string; role: string | null }[]>([]);
  const [termos, setTermos] = useState<TermoRow[]>([]);

  // Filters
  const [searchUser, setSearchUser] = useState("");
  const [filterVersao, setFilterVersao] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [termosRes, aceitesRes, profilesRes, rolesRes] = await Promise.all([
      supabase.from("termos_uso").select("id, versao, ativo").order("data_publicacao", { ascending: false }),
      supabase.from("aceites_termos").select("*").order("data_hora_aceite", { ascending: false }),
      supabase.from("profiles").select("id, full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const termosData = (termosRes.data ?? []) as TermoRow[];
    const aceites = aceitesRes.data ?? [];
    const profiles = (profilesRes.data ?? []) as ProfileRow[];
    const roles = (rolesRes.data ?? []) as RoleRow[];

    setTermos(termosData);

    const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));
    const roleMap = new Map(roles.map((r) => [r.user_id, r.role]));
    const termoMap = new Map(termosData.map((t) => [t.id, t.versao]));

    // Build accepted rows
    const aceiteRows: AceiteRow[] = aceites.map((a) => ({
      id: a.id,
      usuario_id: a.usuario_id,
      termo_id: a.termo_id,
      data_hora_aceite: a.data_hora_aceite,
      user_name: profileMap.get(a.usuario_id) ?? "Usuário desconhecido",
      user_role: roleMap.get(a.usuario_id) ?? null,
      termo_versao: termoMap.get(a.termo_id) ?? "—",
    }));

    setRows(aceiteRows);

    // Find active term and compute pending users
    const activeTermo = termosData.find((t) => t.ativo);
    if (activeTermo) {
      const acceptedUserIds = new Set(
        aceites.filter((a) => a.termo_id === activeTermo.id).map((a) => a.usuario_id)
      );
      const pending = profiles
        .filter((p) => !acceptedUserIds.has(p.id))
        .map((p) => ({
          id: p.id,
          name: p.full_name,
          role: roleMap.get(p.id) ?? null,
        }));
      setPendingUsers(pending);
    } else {
      setPendingUsers([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeTermoVersao = useMemo(() => {
    const active = termos.find((t) => t.ativo);
    return active?.versao ?? null;
  }, [termos]);

  // Combine accepted + pending into a unified view
  const allRows = useMemo(() => {
    const accepted = rows.map((r) => ({
      key: r.id,
      userName: r.user_name,
      userRole: r.user_role,
      versao: r.termo_versao,
      dataAceite: r.data_hora_aceite,
      status: "aceito" as const,
    }));

    const pending = pendingUsers.map((p) => ({
      key: `pending-${p.id}`,
      userName: p.name,
      userRole: p.role,
      versao: activeTermoVersao ?? "—",
      dataAceite: null as string | null,
      status: "pendente" as const,
    }));

    return [...accepted, ...pending];
  }, [rows, pendingUsers, activeTermoVersao]);

  const filtered = useMemo(() => {
    return allRows.filter((r) => {
      if (searchUser && !r.userName.toLowerCase().includes(searchUser.toLowerCase())) return false;
      if (filterVersao !== "all" && r.versao !== filterVersao) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [allRows, searchUser, filterVersao, filterStatus]);

  const versaoOptions = useMemo(() => {
    const set = new Set(termos.map((t) => t.versao));
    return Array.from(set);
  }, [termos]);

  const countAceitos = allRows.filter((r) => r.status === "aceito").length;
  const countPendentes = allRows.filter((r) => r.status === "pendente").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Controle de Aceites</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhamento dos aceites de Termos de Uso por usuário — somente leitura
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allRows.length}</p>
              <p className="text-xs text-muted-foreground">Total de registros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{countAceitos}</p>
              <p className="text-xs text-muted-foreground">Aceitos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{countPendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans font-semibold">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterVersao} onValueChange={setFilterVersao}>
              <SelectTrigger>
                <SelectValue placeholder="Versão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as versões</SelectItem>
                {versaoOptions.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="aceito">Aceito</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans font-semibold">
            Registros de Aceite
            <span className="text-xs text-muted-foreground font-normal ml-2">({filtered.length} resultado(s))</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Data/Hora do Aceite</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.key}>
                        <TableCell className="font-medium text-sm">{r.userName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.userRole ? (roleLabelsMap[r.userRole] ?? r.userRole) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{r.versao}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.dataAceite
                            ? format(new Date(r.dataAceite), "dd/MM/yyyy 'às' HH:mm")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {r.status === "aceito" ? (
                            <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Aceito
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-warning border-warning/30 gap-1">
                              <Clock className="h-3 w-3" /> Pendente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ControleAceites;
