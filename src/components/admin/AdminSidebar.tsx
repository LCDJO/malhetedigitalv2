import {
  LayoutDashboard,
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
  Plug,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
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

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Lojas", url: "/admin/lojas", icon: Building2 },
  { title: "Usuários", url: "/admin/usuarios", icon: Users },
  { title: "Planos", url: "/admin/planos", icon: CreditCard },
];

const complianceItems = [
  { title: "Incidentes", url: "/admin/incidentes", icon: ShieldAlert },
  { title: "Termos e LGPD", url: "/admin/gestao-termos", icon: Scale },
  { title: "Controle de Aceites", url: "/admin/controle-aceites", icon: ClipboardCheck },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
  { title: "Integrações", url: "/admin/integracoes", icon: Plug },
];

const adsItems = [
  { title: "Banner", url: "/admin/banner-login", icon: Monitor },
  { title: "Analytics", url: "/admin/banner-analytics", icon: BarChart3 },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "??";

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
              <span className="text-[11px] text-sidebar-foreground/50 font-medium">SuperAdmin</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-sidebar-border mx-4 w-auto opacity-50" />

      <SidebarContent className="pt-5 px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="admin-section-title text-sidebar-foreground/40 px-3 mb-1">
            Gestão
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="admin-section-title text-sidebar-foreground/40 px-3 mb-1">
            Compliance
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {complianceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
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


        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="admin-section-title text-sidebar-foreground/40 px-3 mb-1">
            ADS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
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
              <Badge variant="outline" className="mt-0.5 w-fit text-[9px] px-1.5 py-0 border-accent/40 text-accent">
                SuperAdmin
              </Badge>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
