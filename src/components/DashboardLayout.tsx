import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          <header className="h-[52px] border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-5 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              <div className="h-4 w-px bg-border" />
              <span className="text-[13px] font-semibold text-foreground tracking-tight">Loja Estrela do Oriente nº 123</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground relative">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
              </Button>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <p className="text-[13px] font-medium leading-none text-foreground">Ir∴ João Silva</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Secretário</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-semibold">JS</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {/* Área central dinâmica */}
          <div className="flex-1 overflow-auto p-7">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
