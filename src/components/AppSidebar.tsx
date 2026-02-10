import {
  LayoutDashboard,
  Users,
  DollarSign,
  Calendar,
  FileText,
  Settings,
  Building2,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const mainItems = [
  { title: "Painel", url: "/", icon: LayoutDashboard },
  { title: "Membros", url: "/membros", icon: Users },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Sessões", url: "/sessoes", icon: Calendar },
  { title: "Documentos", url: "/documentos", icon: FileText },
];

const adminItems = [
  { title: "Loja", url: "/loja", icon: Building2 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-serif font-bold text-lg">
            M
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">Malhete Digital</span>
              <span className="text-xs text-sidebar-foreground/60">Gestão Maçônica</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="bg-sidebar-border mx-3 w-auto" />

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">
            Administração
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
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
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Separator className="bg-sidebar-border mb-3" />
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium">
            VS
          </div>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-medium text-sidebar-foreground truncate">Venerável Secretário</span>
              <span className="text-[10px] text-sidebar-foreground/50 truncate">secretario@loja.org</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
