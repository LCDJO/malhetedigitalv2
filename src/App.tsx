import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PortalLayout } from "@/components/portal/PortalLayout";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Secretaria from "./pages/Secretaria";
import Tesouraria from "./pages/Tesouraria";

import GestaoUsuarios from "./pages/GestaoUsuarios";
import LogAuditoria from "./pages/LogAuditoria";
import Configuracoes from "./pages/Configuracoes";
import Relatorios from "./pages/Relatorios";
import Incidentes from "./pages/Incidentes";
import GestaoTermos from "./pages/GestaoTermos";
import ControleAceites from "./pages/ControleAceites";
import NotFound from "./pages/NotFound";

import PortalAuth from "./pages/portal/PortalAuth";
import PortalCadastro from "./pages/portal/PortalCadastro";
import PortalFinanceiro from "./pages/portal/PortalFinanceiro";
import PortalPrestacaoContas from "./pages/portal/PortalPrestacaoContas";
import PortalPerfil from "./pages/portal/PortalPerfil";

import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLojas from "./pages/admin/AdminLojas";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminConfigSuperAdmin from "./pages/admin/AdminConfigSuperAdmin";
import AdminAuth from "./pages/admin/AdminAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/auth" element={<AdminAuth />} />
            <Route path="/portal/auth" element={<PortalAuth />} />

            {/* Painel SuperAdmin */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="superadmin">
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/lojas" element={<AdminLojas />} />
                      <Route path="/usuarios" element={<AdminUsuarios />} />
                      <Route path="/planos" element={<AdminPlanos />} />
                      <Route path="/configuracoes" element={<AdminConfigSuperAdmin />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Portal do Irmão */}
            <Route
              path="/portal/*"
              element={
                <ProtectedRoute portalRedirect="/portal/auth">
                  <PortalLayout>
                    <Routes>
                      <Route path="/" element={<PortalCadastro />} />
                      <Route path="/financeiro" element={<PortalFinanceiro />} />
                      <Route path="/prestacao-contas" element={<PortalPrestacaoContas />} />
                      <Route path="/perfil" element={<PortalPerfil />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Painel Administrativo */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route
                        path="/secretaria"
                        element={
                          <ProtectedRoute module="secretaria">
                            <Secretaria />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/tesouraria"
                        element={
                          <ProtectedRoute module="tesouraria">
                            <Tesouraria />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/configuracoes"
                        element={
                          <ProtectedRoute module="configuracoes">
                            <Configuracoes />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/relatorios"
                        element={
                          <ProtectedRoute module="dashboard">
                            <Relatorios />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/gestao-usuarios"
                        element={
                          <ProtectedRoute module="configuracoes">
                            <GestaoUsuarios />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/log-auditoria"
                        element={
                          <ProtectedRoute module="configuracoes">
                            <LogAuditoria />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/incidentes"
                        element={
                          <ProtectedRoute module="configuracoes">
                            <Incidentes />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/gestao-termos"
                        element={
                          <ProtectedRoute module="configuracoes">
                            <GestaoTermos />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/controle-aceites"
                        element={
                          <ProtectedRoute module="configuracoes">
                            <ControleAceites />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
