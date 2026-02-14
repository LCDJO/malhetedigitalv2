import {
  BookOpen,
  Stamp,
  Wallet,
  Settings,
  LayoutDashboard,
  Users,
  ScrollText,
  FileBarChart,
  ShieldAlert,
  Scale,
  ClipboardCheck,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, roleLabels } from "@/contexts/AuthContext";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard, module: "dashboard" },
  { title: "Secretaria", url: "/secretaria", icon: BookOpen, module: "secretaria" },
  { title: "Chancelaria", url: "/chancelaria", icon: Stamp, module: "chancelaria" },
  { title: "Tesouraria", url: "/tesouraria", icon: Wallet, module: "tesouraria" },
  
  { title: "Relatórios", url: "/relatorios", icon: FileBarChart, module: "dashboard" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, module: "configuracoes" },
  { title: "Gestão de Usuários", url: "/gestao-usuarios", icon: Users, module: "configuracoes" },
  { title: "Log de Auditoria", url: "/log-auditoria", icon: ScrollText, module: "configuracoes" },
  { title: "Incidentes", url: "/incidentes", icon: ShieldAlert, module: "configuracoes" },
  { title: "Termos e LGPD", url: "/gestao-termos", icon: Scale, module: "configuracoes" },
  { title: "Controle de Aceites", url: "/controle-aceites", icon: ClipboardCheck, module: "configuracoes" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, role, hasModuleAccess } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "??";

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
        <SidebarGroup>
          <SidebarGroupLabel className="admin-section-title text-sidebar-foreground/40 px-3 mb-1">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const hasAccess = hasModuleAccess(item.module);
                if (!hasAccess) return null; // Ocultar menus não autorizados
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="text-sidebar-foreground/65 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-all duration-150 rounded-md"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === "superadmin" && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="admin-section-title text-sidebar-foreground/40 px-3 mb-1">
              Super Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Painel SuperAdmin">
                    <NavLink
                      to="/admin"
                      className="text-accent/80 hover:bg-sidebar-accent/80 hover:text-accent transition-all duration-150 rounded-md"
                      activeClassName="bg-sidebar-accent text-accent font-semibold shadow-sm"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Painel SuperAdmin</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="bg-sidebar-border mb-3 opacity-50" />
        <div className="flex items-center gap-3 px-1">
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
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
