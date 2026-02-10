import {
  BookOpen,
  Stamp,
  Wallet,
  Settings,
  Lock,
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
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { title: "Secretaria", url: "/secretaria", icon: BookOpen, disabled: false },
  { title: "Chancelaria", url: "/chancelaria", icon: Stamp, disabled: true },
  { title: "Tesouraria", url: "/tesouraria", icon: Wallet, disabled: false },
  { title: "Configurações da Loja", url: "/configuracoes", icon: Settings, disabled: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

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
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.disabled ? (
                    <SidebarMenuButton
                      tooltip={`${item.title} (em breve)`}
                      className="opacity-30 cursor-not-allowed pointer-events-none select-none"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {!collapsed && <Lock className="h-3 w-3 ml-auto opacity-60" />}
                    </SidebarMenuButton>
                  ) : (
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
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="bg-sidebar-border mb-3 opacity-50" />
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-[11px] font-semibold">
            VS
          </div>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[12px] font-medium text-sidebar-accent-foreground truncate">Venerável Secretário</span>
              <span className="text-[10px] text-sidebar-foreground/40 truncate">secretario@loja.org</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
