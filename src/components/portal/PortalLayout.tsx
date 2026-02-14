import { useState, createContext, useContext } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import { usePortalMember, PortalMember } from "@/hooks/usePortalMember";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  ChevronRight,
  ChevronDown,
  Loader2,
  UserX,
  Building2,
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

const navItems: NavItem[] = [
  { to: "/portal", icon: User, label: "Meu Perfil", end: true },
  {
    to: "/portal/minha-loja",
    icon: Building2,
    label: "Minha Loja",
    children: [
      { to: "/portal/prestacao-contas", icon: FileBarChart, label: "Prestação de Contas" },
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive || childActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {hasChildren ? (
                <ChevronDown className={cn("h-3.5 w-3.5 ml-auto transition-transform", !isOpen && "-rotate-90")} />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-40" />
              )}
            </NavLink>
            {hasChildren && isOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/50 pl-2">
                {item.children!.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                        isActive
                          ? "bg-muted text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No valid member link — block access entirely
  if (notFound || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <UserX className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-serif font-bold">Acesso Indisponível</h2>
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

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-border/50">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">Portal do Irmão</h2>
        {config && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {config.lodge_name} nº {config.lodge_number}
          </p>
        )}
      </div>

      {/* User card */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{member.full_name}</p>
            <p className="text-[11px] text-muted-foreground">Membro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <PortalNav items={navItems} onNavigate={() => setMobileOpen(false)} />
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
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
      <div className="min-h-[100dvh] bg-background flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 border-r bg-card shrink-0 flex-col sticky top-0 h-screen">
          {sidebar}
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-card shadow-2xl flex flex-col animate-in slide-in-from-left duration-250">
              <div className="absolute right-3 top-3 z-10">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setMobileOpen(false)}>
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
          <header className="h-14 border-b bg-card/90 backdrop-blur-md flex items-center px-4 md:hidden shrink-0 sticky top-0 z-40">
            <Button variant="ghost" size="icon" className="h-10 w-10 -ml-1" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="ml-2 text-sm font-semibold truncate">Portal do Irmão</span>
            <Avatar className="h-8 w-8 ml-auto">
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </header>

          <main className="flex-1 overflow-auto p-4 sm:p-5 md:p-7">
            {children}
          </main>
        </div>
      </div>
    </PortalMemberContext.Provider>
  );
}
