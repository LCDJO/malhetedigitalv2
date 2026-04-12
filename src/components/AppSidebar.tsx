/**
 * App Sidebar — Section-based professional navigation
 *
 * Follows Gestão RH pattern with:
 *   - Uppercase section labels with separators
 *   - Permission-aware visibility via useScope
 *   - Collapsible sub-groups with border-left indicators
 */

import { useState } from "react";
import {
  BookOpen,
  Stamp,
  Wallet,
  DollarSign,
  MessageSquare,
  Settings,
  LayoutDashboard,
  Users,
  ScrollText,
  FileBarChart,
  Shield,
  Scale,
  ClipboardCheck,
  LogOut,
  Monitor,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, roleLabels } from "@/contexts/AuthContext";
import { useScope } from "@/contexts/ScopeContext";
import { MeuPerfilDialog } from "@/components/MeuPerfilDialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { NavKey } from "@/domains/security/permissions";

// ════════════════════════════════════
// TYPES
// ════════════════════════════════════

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  navKey: NavKey;
  children?: NavItem[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// ════════════════════════════════════
// NAV STRUCTURE — Section-based
// ════════════════════════════════════

const navSections: NavSection[] = [
  // ── OVERVIEW ──
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, navKey: "dashboard" },
    ],
  },

  // ── OPERAÇÃO ──
  {
    label: "Operação",
    items: [
      { title: "Secretaria", url: "/dashboard/secretaria", icon: BookOpen, navKey: "secretaria" },
      { title: "Chancelaria", url: "/dashboard/chancelaria", icon: Stamp, navKey: "chancelaria" },
      { title: "Tesouraria", url: "/dashboard/tesouraria", icon: Wallet, navKey: "tesouraria" },
      { title: "Financeiro Geral", url: "/dashboard/financeiro-geral", icon: DollarSign, navKey: "financeiro_geral" },
      { title: "Totem", url: "/dashboard/totem", icon: Monitor, navKey: "totem" },
      { title: "Relatórios", url: "/dashboard/relatorios", icon: FileBarChart, navKey: "relatorios" },
      { title: "Atendimento", url: "/dashboard/atendimento", icon: MessageSquare, navKey: "atendimento" },
    ],
  },

  // ── CONFIGURAÇÕES ──
  {
    label: "Configurações",
    items: [
      { title: "Usuários & Permissões", url: "/dashboard/gestao-usuarios", icon: Users, navKey: "gestao_usuarios" },
      { title: "Log de Auditoria", url: "/dashboard/log-auditoria", icon: ScrollText, navKey: "log_auditoria" },
      { title: "Preferências", url: "/dashboard/configuracoes", icon: Settings, navKey: "configuracoes" },
    ],
  },

  // ── COMPLIANCE ──
  {
    label: "Compliance",
    items: [
      { title: "Termos e LGPD", url: "/dashboard/gestao-terms", icon: Scale, navKey: "gestao_termos" },
      { title: "Controle de Aceites", url: "/dashboard/controle-aceites", icon: ClipboardCheck, navKey: "controle_aceites" },
    ],
  },
];

// ════════════════════════════════════
// SIDEBAR COMPONENT
// ════════════════════════════════════

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, role, signOut } = useAuth();
  const { canAccessNav, loading: scopeLoading } = useScope();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  // Filter sections to only show items user can access
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (scopeLoading) return true; // show all while loading
        return canAccessNav(item.navKey);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-serif font-bold text-lg shadow-sm">
            M
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-sidebar-accent-foreground tracking-tight">Malhete Digital</span>
              <span className="text-[11px] text-sidebar-foreground/50 font-medium">Gestão Maçônica</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-sidebar-border mx-4 w-auto opacity-50" />

      <SidebarContent className="pt-5 px-2">
        {visibleSections.map((section) => (
          <SidebarGroup key={section.label} className="mt-1">
            <SidebarGroupLabel className="admin-section-title text-sidebar-foreground/40 px-3 mb-1">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className="text-sidebar-foreground/65 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-all duration-150 rounded-md"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="bg-sidebar-border mb-3 opacity-50" />
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-3 px-1 w-full text-left rounded-md hover:bg-sidebar-accent/60 transition-colors py-1.5 -my-1.5"
          title="Meu Perfil"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-[11px] font-semibold">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[12px] font-medium text-sidebar-accent-foreground truncate">
                {profile?.full_name ?? "Carregando..."}
              </span>
              {role && (
                <Badge variant="outline" className="mt-0.5 w-fit text-[9px] px-1.5 py-0 border-sidebar-border text-sidebar-foreground/60">
                  {roleLabels[role]}
                </Badge>
              )}
              {!role && (
                <span className="text-[10px] text-sidebar-foreground/40 truncate">Sem cargo atribuído</span>
              )}
            </div>
          )}
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-1 w-full text-left rounded-md hover:bg-destructive/10 transition-colors py-1.5 mt-1 text-sidebar-foreground/50 hover:text-destructive"
          title="Sair"
        >
          <LogOut className="h-4 w-4 ml-2" />
          {!collapsed && <span className="text-[12px] font-medium">Sair</span>}
        </button>
      </SidebarFooter>

      <MeuPerfilDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </Sidebar>
  );
}
