import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import TenantSelect from "./pages/TenantSelect";
import Dashboard from "./pages/Dashboard";
import Plans from "./pages/Plans";
import Ranking from "./pages/Ranking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Navigate to="/tenants" replace />} />

              {/* Tenant selection */}
              <Route
                path="/tenants"
                element={
                  <ProtectedRoute>
                    <TenantSelect />
                  </ProtectedRoute>
                }
              />

              {/* App routes (tenant-scoped) */}
              <Route
                path="/app/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/plans" element={<Plans />} />
                        <Route path="/ranking" element={<Ranking />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
