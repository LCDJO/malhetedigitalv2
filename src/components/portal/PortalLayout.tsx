import { useState, createContext, useContext } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { usePortalMember, PortalMember } from "@/hooks/usePortalMember";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Wallet,
  FileBarChart,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Loader2,
  UserX,
  Building2,
  LayoutDashboard,
  Compass,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Context to share member data across portal pages
const PortalMemberContext = createContext<PortalMember | null>(null);
export function usePortalMemberContext() {
  const ctx = useContext(PortalMemberContext);
  if (!ctx) throw new Error("usePortalMemberContext must be used within PortalLayout");
  return ctx;
}

interface NavItem {
  to: string;
  icon: any;
  label: string;
  end?: boolean;
  children?: NavItem[];
}

const degreeLabels: Record<string, string> = {
  aprendiz: "Aprendiz",
  companheiro: "Companheiro",
  mestre: "Mestre Maçom",
};

const navItems: NavItem[] = [
  { to: "/portal", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/portal/perfil", icon: User, label: "Meu Perfil" },
  { to: "/portal/jornada", icon: Compass, label: "Minha Jornada" },
  {
    to: "/portal/minha-loja",
    icon: Building2,
    label: "Minha Loja",
    children: [
      { to: "/portal/prestacao-contas", icon: FileBarChart, label: "Prestação de Contas" },
      { to: "/portal/documentos", icon: FileText, label: "Documentos" },
    ],
  },
  { to: "/portal/financeiro", icon: Wallet, label: "Meu Financeiro" },
  { to: "/portal/seguranca", icon: ShieldCheck, label: "Segurança" },
];

function PortalNav({ items, onNavigate }: { items: NavItem[]; onNavigate: () => void }) {
  const location = useLocation();

  return (
    <nav className="space-y-0.5 px-2">
      {items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const childActive = hasChildren && item.children!.some((c) => location.pathname === c.to);
        const parentActive = location.pathname === item.to;
        const isOpen = parentActive || childActive;

        return (
          <div key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-150",
                  isActive || childActive
                    ? "portal-nav-active font-medium"
                    : "text-[hsl(220_10%_55%)] hover:text-[hsl(40_20%_85%)] hover:bg-[hsl(220_18%_14%)]"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {hasChildren && (
                <ChevronDown className={cn("h-3.5 w-3.5 ml-auto transition-transform duration-200", !isOpen && "-rotate-90")} />
              )}
            </NavLink>
            {hasChildren && isOpen && (
              <div className="ml-5 mt-0.5 space-y-0.5 border-l border-[hsl(42_40%_22%/0.3)] pl-3">
                {item.children!.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                        isActive
                          ? "text-[hsl(42_60%_68%)] font-medium"
                          : "text-[hsl(220_10%_50%)] hover:text-[hsl(40_20%_80%)]"
                      )
                    }
                  >
                    <child.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{child.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { config } = useLodgeConfig();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { member, loading, notFound } = usePortalMember();

  const handleSignOut = async () => {
    await signOut();
    navigate("/portal/auth");
  };

  // Loading state
  if (loading) {
    return (
      <div className="portal-theme min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No valid member link
  if (notFound || !member) {
    return (
      <div className="portal-theme min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <UserX className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-serif font-bold text-foreground">Acesso Indisponível</h2>
          <p className="text-sm text-muted-foreground">
            Seu usuário não está vinculado a nenhum cadastro de Irmão ativo.
            Entre em contato com o Secretário da Loja para regularizar seu acesso.
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  const initials = member.full_name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const degreeName = degreeLabels[member.degree] ?? member.degree;
  const lodgeInfo = config ? `${config.lodge_name} nº ${config.lodge_number}` : "";

  const sidebar = (
    <div className="flex flex-col h-full portal-sidebar">
      {/* User profile card */}
      <div className="p-5 border-b border-[hsl(42_40%_22%/0.3)]">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-[hsl(42_65%_50%/0.4)] ring-offset-2 ring-offset-[hsl(220_25%_7%)]">
            {member.avatar_url ? (
              <AvatarImage src={member.avatar_url} alt={member.full_name} />
            ) : null}
            <AvatarFallback className="bg-[hsl(42_65%_50%/0.2)] text-[hsl(42_60%_68%)] text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[hsl(40_20%_90%)] truncate">
              Ir∴ {member.full_name.split(" ")[0]}
            </p>
            <p className="text-[11px] text-[hsl(42_50%_55%)] truncate">
              {degreeName}
            </p>
            {lodgeInfo && (
              <p className="text-[10px] text-[hsl(220_10%_45%)] truncate mt-0.5">
                {lodgeInfo}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <PortalNav items={navItems} onNavigate={() => setMobileOpen(false)} />
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-[hsl(42_40%_22%/0.2)]">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-[hsl(220_10%_50%)] hover:text-[hsl(40_20%_85%)] hover:bg-[hsl(220_18%_14%)]"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <PortalMemberContext.Provider value={member}>
      <div className="portal-theme min-h-[100dvh] bg-background flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-screen border-r portal-gold-border portal-sidebar">
          {sidebar}
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-[3px] animate-in fade-in duration-200"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] shadow-2xl flex flex-col animate-in slide-in-from-left duration-250 portal-sidebar bg-[hsl(220_25%_7%)]">
              <div className="absolute right-3 top-3 z-10">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-[hsl(220_10%_55%)] hover:text-[hsl(40_20%_85%)]" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {sidebar}
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="h-14 portal-header-bar flex items-center px-4 md:hidden shrink-0 sticky top-0 z-40">
            <Button variant="ghost" size="icon" className="h-10 w-10 -ml-1 text-[hsl(220_10%_55%)] hover:text-[hsl(42_60%_68%)]" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="ml-2 text-sm font-semibold text-[hsl(40_20%_90%)] truncate">
              Portal do Irmão
            </span>
            <Avatar className="h-8 w-8 ml-auto ring-1 ring-[hsl(42_65%_50%/0.3)]">
              {member.avatar_url ? (
                <AvatarImage src={member.avatar_url} alt={member.full_name} />
              ) : null}
              <AvatarFallback className="bg-[hsl(42_65%_50%/0.2)] text-[hsl(42_60%_68%)] text-[10px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </header>

          {/* Desktop top header with user info */}
          <header className="hidden md:flex h-16 portal-header-bar items-center px-7 shrink-0">
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right">
                <p className="text-sm font-medium text-[hsl(40_20%_90%)]">
                  Ir∴ {member.full_name}
                </p>
                <p className="text-[11px] text-[hsl(42_50%_55%)]">
                  {degreeName} — {lodgeInfo}
                </p>
              </div>
              <Avatar className="h-10 w-10 ring-2 ring-[hsl(42_65%_50%/0.3)]">
                {member.avatar_url ? (
                  <AvatarImage src={member.avatar_url} alt={member.full_name} />
                ) : null}
                <AvatarFallback className="bg-[hsl(42_65%_50%/0.2)] text-[hsl(42_60%_68%)] text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 sm:p-5 md:p-7">
            {children}
          </main>
        </div>
      </div>
    </PortalMemberContext.Provider>
  );
}
