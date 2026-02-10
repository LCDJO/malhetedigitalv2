import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground" />
              <div className="h-5 w-px bg-border" />
              <span className="text-sm font-semibold text-foreground">Loja Estrela do Oriente nº 123</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">Ir∴ João Silva</p>
                <p className="text-xs text-muted-foreground">Secretário</p>
              </div>
              <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">JS</AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Área central dinâmica */}
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
