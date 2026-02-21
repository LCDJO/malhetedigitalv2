/**
 * Admin Sidebar — Section-based navigation for SuperAdmin
 *
 * Follows Gestão RH PlatformLayout pattern with:
 *   - Uppercase section labels
 *   - Collapsible sub-groups with border-left indicators
 *   - Segurança section with Usuários & Permissões
 */

import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Building2,
  Users,
  CreditCard,
  Settings,
  ArrowLeft,
  Monitor,
  ShieldAlert,
  Scale,
  ClipboardCheck,
  Megaphone,
  BarChart3,
  DollarSign,
  FileBarChart,
  Plug,
  Mail,
  MessageCircle,
  Send,
  ChevronDown,
  ShieldCheck,
  ScrollText,
  KeyRound,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
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

// ════════════════════════════════════
// NAV STRUCTURE — Section-based (RH pattern)
// ════════════════════════════════════

interface SimpleNavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
}

// ── GERAL ──
const geralItems: SimpleNavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Lojas", url: "/admin/lojas", icon: Building2 },
  { title: "Planos", url: "/admin/planos", icon: CreditCard },
];

// ── FINANCEIRO ──
const financeiroItems: SimpleNavItem[] = [
  { title: "Financeiro Geral", url: "/admin/financeiro-geral", icon: DollarSign },
  { title: "Relatórios", url: "/admin/relatorios", icon: FileBarChart },
];

// ── COMUNICAÇÃO ──
const comunicacaoMenuItems: SimpleNavItem[] = [
  { title: "Chat ao Vivo", url: "/admin/atendimento", icon: MessageSquare },
];

// ── SEGURANÇA ──
const segurancaItems: SimpleNavItem[] = [
  { title: "Usuários", url: "/admin/usuarios", icon: Users },
  { title: "Permissões", url: "/admin/permissoes", icon: ShieldCheck },
  { title: "Log de Auditoria", url: "/admin/log-auditoria", icon: ScrollText },
];

// ── COMPLIANCE ──
const complianceItems: SimpleNavItem[] = [
  { title: "Incidentes", url: "/admin/incidentes", icon: ShieldAlert },
  { title: "Termos e LGPD", url: "/admin/gestao-termos", icon: Scale },
  { title: "Controle de Aceites", url: "/admin/controle-aceites", icon: ClipboardCheck },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

const integracaoComunicacao: SimpleNavItem[] = [
  { title: "Email", url: "/admin/integracoes/email", icon: Mail },
  { title: "WhatsApp", url: "/admin/integracoes/whatsapp", icon: MessageCircle },
  { title: "Telegram", url: "/admin/integracoes/telegram", icon: Send },
];

const integracaoPagamentos: SimpleNavItem[] = [
  { title: "Stripe", url: "/admin/integracoes/stripe", icon: CreditCard },
];

const integracaoBancos: SimpleNavItem[] = [
  { title: "Banco do Brasil", url: "/admin/integracoes/bancos/bb", icon: Building2 },
  { title: "Bradesco", url: "/admin/integracoes/bancos/bradesco", icon: Building2 },
  { title: "Itaú", url: "/admin/integracoes/bancos/itau", icon: Building2 },
  { title: "Sicredi", url: "/admin/integracoes/bancos/sicredi", icon: Building2 },
];

const integracaoTotem: SimpleNavItem[] = [
  { title: "Totem", url: "/admin/integracoes/totem", icon: Monitor },
];

const marketingItems: SimpleNavItem[] = [
  { title: "Anunciantes", url: "/admin/anunciantes", icon: Megaphone },
  { title: "Banner", url: "/admin/banner-login", icon: Monitor },
  { title: "Ads Analytics", url: "/admin/banner-analytics", icon: BarChart3 },
];

// ════════════════════════════════════
// SIDEBAR COMPONENT
// ════════════════════════════════════

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile } = useAuth();
  const location = useLocation();

  // Auto-open collapsibles based on current route
  const isComunicacaoRoute = location.pathname.startsWith("/admin/integracoes/email") || location.pathname.startsWith("/admin/integracoes/whatsapp") || location.pathname.startsWith("/admin/integracoes/telegram");
  const isPagamentosRoute = location.pathname.startsWith("/admin/integracoes/stripe") || location.pathname.startsWith("/admin/integracoes/bancos");
  const isBancosRoute = location.pathname.startsWith("/admin/integracoes/bancos");
  const isTotemRoute = location.pathname.startsWith("/admin/integracoes/totem");

  const [comunicacaoOpen, setComunicacaoOpen] = useState(isComunicacaoRoute);
  const [pagamentosOpen, setPagamentosOpen] = useState(isPagamentosRoute);
  const [bancosOpen, setBancosOpen] = useState(isBancosRoute);
  const [totemOpen, setTotemOpen] = useState(isTotemRoute);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  const renderSimpleSection = (label: string, items: SimpleNavItem[]) => (
    <SidebarGroup className="mt-1">
      <SidebarGroupLabel className="admin-section-title text-sidebar-foreground/40 px-3 mb-1">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <NavLink
                  to={item.url}
                  end={item.url === "/admin"}
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
  );

  const renderCollapsible = (
    label: string,
    icon: typeof LayoutDashboard,
    items: SimpleNavItem[],
    open: boolean,
    onOpenChange: (v: boolean) => void,
    fontSize = "text-[13px]",
    iconSize = "h-3.5 w-3.5",
    marginLeft = "ml-4"
  ) => (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={label}
            className={cn(
              "text-sidebar-foreground/65 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-all duration-150 rounded-md",
              open && "bg-sidebar-accent/50 text-sidebar-accent-foreground"
            )}
          >
            {(() => { const Icon = icon; return <Icon className="h-4 w-4" />; })()}
            <span>{label}</span>
            <ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition-transform duration-200", !open && "-rotate-90")} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu className={cn(marginLeft, "mt-0.5 border-l border-sidebar-border pl-2")}>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink
                    to={item.url}
                    className={cn("text-sidebar-foreground/65 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-all duration-150 rounded-md", fontSize)}
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                  >
                    <item.icon className={iconSize} />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground font-serif font-bold text-lg shadow-sm">
            S
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-sidebar-accent-foreground tracking-tight">Malhete Digital</span>
              <Badge variant="outline" className="w-fit text-[9px] px-1.5 py-0 border-accent/30 text-accent mt-0.5">
                Plataforma
              </Badge>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-sidebar-border mx-4 w-auto opacity-50" />

      <SidebarContent className="pt-5 px-2">
        {/* Geral */}
        {renderSimpleSection("Geral", geralItems)}

        {/* Financeiro */}
        {renderSimpleSection("Financeiro", financeiroItems)}

        {/* Comunicação */}
        {renderSimpleSection("Comunicação", comunicacaoMenuItems)}

        {/* Segurança */}
        {renderSimpleSection("Segurança", segurancaItems)}

        {/* Compliance */}
        {renderSimpleSection("Compliance", complianceItems)}

        {/* Integrações */}
        <SidebarGroup className="mt-1">
          <SidebarGroupLabel className="admin-section-title text-sidebar-foreground/40 px-3 mb-1">
            Integrações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderCollapsible("Comunicação", MessageCircle, integracaoComunicacao, comunicacaoOpen, setComunicacaoOpen)}

              <Collapsible open={pagamentosOpen} onOpenChange={setPagamentosOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Pagamentos"
                      className={cn(
                        "text-sidebar-foreground/65 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-all duration-150 rounded-md",
                        pagamentosOpen && "bg-sidebar-accent/50 text-sidebar-accent-foreground"
                      )}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Pagamentos</span>
                      <ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition-transform duration-200", !pagamentosOpen && "-rotate-90")} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="ml-4 mt-0.5 border-l border-sidebar-border pl-2">
                      {integracaoPagamentos.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild tooltip={item.title}>
                            <NavLink
                              to={item.url}
                              className="text-sidebar-foreground/65 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-all duration-150 rounded-md text-[13px]"
                              activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                            >
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}

                      {/* Sub-submenu: Bancos */}
                      <Collapsible open={bancosOpen} onOpenChange={setBancosOpen}>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip="Bancos"
                              className={cn(
                                "text-sidebar-foreground/65 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-all duration-150 rounded-md text-[13px]",
                                bancosOpen && "bg-sidebar-accent/50 text-sidebar-accent-foreground"
                              )}
                            >
                              <Building2 className="h-3.5 w-3.5" />
                              <span>Bancos</span>
                              <ChevronDown className={cn("ml-auto h-3 w-3 transition-transform duration-200", !bancosOpen && "-rotate-90")} />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenu className="ml-3 mt-0.5 border-l border-sidebar-border pl-2">
                              {integracaoBancos.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                  <SidebarMenuButton asChild tooltip={item.title}>
                                    <NavLink
                                      to={item.url}
                                      className="text-sidebar-foreground/65 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-all duration-150 rounded-md text-[12px]"
                                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                                    >
                                      <item.icon className="h-3 w-3" />
                                      <span>{item.title}</span>
                                    </NavLink>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                            </SidebarMenu>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {renderCollapsible("Totem", Monitor, integracaoTotem, totemOpen, setTotemOpen)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Marketing */}
        {renderSimpleSection("Marketing", marketingItems)}

        {/* Voltar ao Painel */}
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Voltar ao Painel">
                  <NavLink
                    to="/"
                    className="text-sidebar-foreground/50 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-all duration-150 rounded-md"
                    activeClassName=""
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Voltar ao Painel</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="bg-sidebar-border mb-3 opacity-50" />
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-[11px] font-semibold">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[12px] font-medium text-sidebar-accent-foreground truncate">
                {profile?.full_name ?? "Carregando..."}
              </span>
              <Badge variant="outline" className="mt-0.5 w-fit text-[9px] px-1.5 py-0 border-sidebar-border text-sidebar-foreground/60">
                SuperAdmin
              </Badge>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
