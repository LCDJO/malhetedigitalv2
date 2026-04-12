import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScopeProvider } from "@/contexts/ScopeContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/domains/security";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { SubdomainRedirect } from "@/components/SubdomainRedirect";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
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
import TotemAdmin from "./pages/TotemAdmin";

import PortalAuth from "./pages/portal/PortalAuth";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalCadastro from "./pages/portal/PortalCadastro";
import PortalJornada from "./pages/portal/PortalJornada";
import PortalFinanceiro from "./pages/portal/PortalFinanceiro";
import PortalPrestacaoContas from "./pages/portal/PortalPrestacaoContas";
import PortalPerfil from "./pages/portal/PortalPerfil";
import PortalMinhaLoja from "./pages/portal/PortalMinhaLoja";
import PortalDocumentos from "./pages/portal/PortalDocumentos";

import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLojas from "./pages/admin/AdminLojas";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminPermissoes from "./pages/admin/AdminPermissoes";
import AdminConfigSuperAdmin from "./pages/admin/AdminConfigSuperAdmin";
import AdminPotenciasRitos from "./pages/admin/AdminPotenciasRitos";

import AdminBannerLogin from "./pages/admin/AdminBannerLogin";
import AdminBannerAnalytics from "./pages/admin/AdminBannerAnalytics";
import AdminIntegracoes from "./pages/admin/AdminIntegracoes";
import AdminIntegracoesWhatsapp from "./pages/admin/AdminIntegracoesWhatsapp";
import AdminIntegracoesTelegram from "./pages/admin/AdminIntegracoesTelegram";
import AdminIntegracoesSicredi from "./pages/admin/AdminIntegracoesSicredi";
import AdminIntegracoesBB from "./pages/admin/AdminIntegracoesBB";
import AdminIntegracoesBradesco from "./pages/admin/AdminIntegracoesBradesco";
import AdminIntegracoesItau from "./pages/admin/AdminIntegracoesItau";
import AdminIntegracoesStripe from "./pages/admin/AdminIntegracoesStripe";
import AdminIntegracesTotem from "./pages/admin/AdminIntegracesTotem";
import AdminAnunciantes from "./pages/admin/AdminAnunciantes";
import AdminAtendimento from "./pages/admin/AdminAtendimento";
import Atendimento from "./pages/Atendimento";
import Chancelaria from "./pages/Chancelaria";
import FinanceiroGeral from "./pages/FinanceiroGeral";

import { AnuncianteLayout } from "@/components/anunciante/AnuncianteLayout";
import AnuncianteAuth from "./pages/anunciante/AnuncianteAuth";
import AnuncianteDashboard from "./pages/anunciante/AnuncianteDashboard";
import AnuncianteCampanhas from "./pages/anunciante/AnuncianteCampanhas";
import AnuncianteCriativos from "./pages/anunciante/AnuncianteCriativos";
import AnuncianteAnalytics from "./pages/anunciante/AnuncianteAnalytics";
import AnunciantePerfil from "./pages/anunciante/AnunciantePerfil";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SubdomainRedirect />
        <AuthProvider>
          <ScopeProvider>
            <Routes>
            <Route path="/auth" element={<Auth />} />
            
            <Route path="/anunciante/auth" element={<AnuncianteAuth />} />
            <Route path="/portal/auth" element={<PortalAuth />} />

            {/* Portal do Anunciante */}
            <Route
              path="/anunciante/*"
              element={
                <AnuncianteLayout>
                  <Routes>
                    <Route path="/" element={<AnuncianteDashboard />} />
                    <Route path="/campanhas" element={<AnuncianteCampanhas />} />
                    <Route path="/criativos" element={<AnuncianteCriativos />} />
                    <Route path="/analytics" element={<AnuncianteAnalytics />} />
                    <Route path="/perfil" element={<AnunciantePerfil />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AnuncianteLayout>
              }
            />

            {/* Painel SuperAdmin */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="superadmin" portalRedirect="/auth">
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/lojas" element={<AdminLojas />} />
                      <Route path="/usuarios" element={<AdminUsuarios />} />
                      <Route path="/permissoes" element={<AdminPermissoes />} />
                      <Route path="/planos" element={<AdminPlanos />} />
                      <Route path="/potencias-ritos" element={<AdminPotenciasRitos />} />
                      <Route path="/banner-login" element={<AdminBannerLogin />} />
                      <Route path="/banner-analytics" element={<AdminBannerAnalytics />} />
                      <Route path="/incidentes" element={<Incidentes />} />
                      <Route path="/gestao-termos" element={<GestaoTermos />} />
                      <Route path="/controle-aceites" element={<ControleAceites />} />
                      <Route path="/configuracoes" element={<AdminConfigSuperAdmin />} />
                      <Route path="/integracoes/email" element={<AdminIntegracoes />} />
                      <Route path="/integracoes/whatsapp" element={<AdminIntegracoesWhatsapp />} />
                      <Route path="/integracoes/telegram" element={<AdminIntegracoesTelegram />} />
                      <Route path="/integracoes/stripe" element={<AdminIntegracoesStripe />} />
                      <Route path="/integracoes/bancos/bb" element={<AdminIntegracoesBB />} />
                      <Route path="/integracoes/bancos/bradesco" element={<AdminIntegracoesBradesco />} />
                      <Route path="/integracoes/bancos/itau" element={<AdminIntegracoesItau />} />
                      <Route path="/integracoes/bancos/sicredi" element={<AdminIntegracoesSicredi />} />
                      <Route path="/integracoes/totem" element={<AdminIntegracesTotem />} />
                      <Route path="/anunciantes" element={<AdminAnunciantes />} />
                      <Route path="/atendimento" element={<AdminAtendimento />} />
                      <Route path="/log-auditoria" element={<LogAuditoria />} />
                      <Route path="/financeiro-geral" element={<FinanceiroGeral />} />
                      <Route path="/relatorios" element={<Relatorios />} />
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
                      <Route path="/" element={<PortalDashboard />} />
                      <Route path="/perfil" element={<PortalCadastro />} />
                      <Route path="/jornada" element={<PortalJornada />} />
                      <Route path="/minha-loja" element={<PortalMinhaLoja />} />
                      <Route path="/financeiro" element={<PortalFinanceiro />} />
                      <Route path="/prestacao-contas" element={<PortalPrestacaoContas />} />
                      <Route path="/documentos" element={<PortalDocumentos />} />
                      <Route path="/seguranca" element={<PortalPerfil />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Painel Administrativo */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/secretaria" element={<ProtectedRoute navKey="secretaria"><Secretaria /></ProtectedRoute>} />
                      <Route path="/tesouraria" element={<ProtectedRoute navKey="tesouraria"><Tesouraria /></ProtectedRoute>} />
                      <Route path="/totem" element={<ProtectedRoute navKey="totem"><TotemAdmin /></ProtectedRoute>} />
                      <Route path="/configuracoes" element={<ProtectedRoute navKey="configuracoes"><Configuracoes /></ProtectedRoute>} />
                      <Route path="/relatorios" element={<ProtectedRoute navKey="relatorios"><Relatorios /></ProtectedRoute>} />
                      <Route path="/gestao-usuarios" element={<ProtectedRoute navKey="gestao_usuarios"><GestaoUsuarios /></ProtectedRoute>} />
                      <Route path="/log-auditoria" element={<ProtectedRoute navKey="log_auditoria"><LogAuditoria /></ProtectedRoute>} />
                      <Route path="/gestao-termos" element={<ProtectedRoute navKey="gestao_termos"><GestaoTermos /></ProtectedRoute>} />
                      <Route path="/controle-aceites" element={<ProtectedRoute navKey="controle_aceites"><ControleAceites /></ProtectedRoute>} />
                      <Route path="/atendimento" element={<ProtectedRoute navKey="atendimento"><Atendimento /></ProtectedRoute>} />
                      <Route path="/chancelaria" element={<ProtectedRoute navKey="chancelaria"><Chancelaria /></ProtectedRoute>} />
                      <Route path="/financeiro-geral" element={<ProtectedRoute navKey="financeiro_geral"><FinanceiroGeral /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </ScopeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
