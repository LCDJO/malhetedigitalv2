import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Megaphone,
  ImagePlus,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Loader2,
  ShieldAlert,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Advertiser {
  id: string;
  company_name: string;
  trading_name: string | null;
  document_type: string;
  document_number: string;
  email: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  logo_url: string | null;
  status: string;
  rejection_reason: string | null;
  representative_name: string | null;
  representative_cpf: string | null;
  representative_email: string | null;
  representative_phone: string | null;
  representative_address: string | null;
}

const AdvertiserContext = createContext<Advertiser | null>(null);
export function useAdvertiser() {
  const ctx = useContext(AdvertiserContext);
  if (!ctx) throw new Error("useAdvertiser must be used within AnuncianteLayout");
  return ctx;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  aprovado: { label: "Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
  suspenso: { label: "Suspenso", variant: "destructive" },
};

const navItems = [
  { to: "/anunciante", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/anunciante/campanhas", icon: Megaphone, label: "Campanhas" },
  { to: "/anunciante/criativos", icon: ImagePlus, label: "Criativos" },
  { to: "/anunciante/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/anunciante/perfil", icon: Building2, label: "Minha Empresa" },
];

export function AnuncianteLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("advertisers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setAdvertiser(data as Advertiser | null);
        setLoading(false);
      });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/anunciante/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-serif font-bold text-foreground">Conta Não Encontrada</h2>
          <p className="text-sm text-muted-foreground">
            Seu usuário não está vinculado a nenhum anunciante. Cadastre-se primeiro.
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5" /> Sair
          </Button>
        </div>
      </div>
    );
  }

  if (advertiser.status !== "aprovado") {
    const st = statusLabels[advertiser.status] || statusLabels.pendente;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <Megaphone className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-lg font-serif font-bold text-foreground">Cadastro {st.label}</h2>
          <Badge variant={st.variant}>{st.label}</Badge>
          <p className="text-sm text-muted-foreground">
            {advertiser.status === "pendente" && "Seu cadastro está em análise pela equipe administrativa. Você será notificado quando for aprovado."}
            {advertiser.status === "rejeitado" && `Seu cadastro foi rejeitado. ${advertiser.rejection_reason || "Entre em contato com o suporte."}`}
            {advertiser.status === "suspenso" && "Sua conta está suspensa. Entre em contato com o suporte."}
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5" /> Sair
          </Button>
        </div>
      </div>
    );
  }

  const initials = advertiser.company_name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Brand */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground font-bold text-lg shadow-sm">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-sidebar-accent-foreground tracking-tight">Malhete Ads</span>
            <span className="text-[11px] text-sidebar-foreground/50 font-medium">Portal do Anunciante</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-sidebar-border mx-4 opacity-50" />

      {/* Nav */}
      <ScrollArea className="flex-1 pt-5 px-2">
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4">
        <div className="h-px bg-sidebar-border mb-3 opacity-50" />
        <div className="flex items-center gap-3 px-1 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-[11px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[12px] font-medium text-sidebar-accent-foreground truncate">
              {advertiser.trading_name || advertiser.company_name}
            </span>
            <Badge variant="outline" className="mt-0.5 w-fit text-[9px] px-1.5 py-0 border-accent/40 text-accent">
              Anunciante
            </Badge>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-1 w-full text-left rounded-md hover:bg-destructive/10 transition-colors py-1.5 text-sidebar-foreground/50 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 ml-2" />
          <span className="text-[12px] font-medium">Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <AdvertiserContext.Provider value={advertiser}>
      <div className="min-h-[100dvh] bg-background flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-screen border-r border-sidebar-border bg-sidebar">
          {sidebar}
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] shadow-2xl flex flex-col bg-sidebar">
              <div className="absolute right-3 top-3 z-10">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-sidebar-foreground/50" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {sidebar}
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-[52px] border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-5 shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden text-muted-foreground" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <span className="text-[13px] font-semibold text-foreground tracking-tight">
                {advertiser.trading_name || advertiser.company_name}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-medium leading-none text-foreground">{advertiser.company_name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Anunciante</p>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent text-accent-foreground text-[11px] font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-7">
            {children}
          </div>

          <footer className="h-10 border-t bg-card/60 flex items-center justify-center px-5 shrink-0">
            <span className="text-[11px] text-muted-foreground">Malhete Ads — Portal do Anunciante</span>
          </footer>
        </div>
      </div>
    </AdvertiserContext.Provider>
  );
}
