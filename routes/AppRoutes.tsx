import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { TenantProvider } from '../contexts/TenantContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Agenda from '../pages/Agenda';
import Clientes from '../pages/Clientes';
import Profissionais from '../pages/Profissionais';
import Servicos from '../pages/Servicos';
import Usuarios from '../pages/Usuarios';
import Whatsapp from '../pages/Whatsapp';
import MvpManagement from '../pages/MvpManagement';
import Conhecimento from '../pages/Conhecimento';
import ManagerOnboarding from '../pages/ManagerOnboarding';
import Leads from '../pages/Leads';
import Especialidades from '../pages/Especialidades';

const AppRoutes: React.FC = () => {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AuthProvider>
      <TenantProvider>
        <Router>
          <Routes>
            {/* Rotas públicas de Onboarding (sem autenticação) */}
            <Route path="/onboarding/manager" element={<ManagerOnboarding />} />

            {/* Dashboard - Acesso para todos os usuários logados */}
            <Route
              path="/"
              element={
                <ProtectedRoute isMobile={isMobile}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Agenda - Acesso para admin, secretaria, profissional */}
            <Route
              path="/agenda"
              element={
                <ProtectedRoute
                  isMobile={isMobile}
                  requiredRole={['developer', 'admin', 'secretaria', 'profissional']}
                >
                  <Agenda />
                </ProtectedRoute>
              }
            />

            {/* Clientes - Acesso para admin, secretaria */}
            <Route
              path="/clientes"
              element={
                <ProtectedRoute
                  isMobile={isMobile}
                  requiredRole={['developer', 'admin', 'secretaria']}
                >
                  <Clientes />
                </ProtectedRoute>
              }
            />

            {/* Leads - Acesso para admin, secretaria */}
            <Route
              path="/leads"
              element={
                <ProtectedRoute
                  isMobile={isMobile}
                  requiredRole={['developer', 'admin', 'secretaria']}
                >
                  <Leads />
                </ProtectedRoute>
              }
            />

            {/* Especialidades - Acesso apenas para admin */}
            <Route
              path="/especialidades"
              element={
                <ProtectedRoute
                  isMobile={isMobile}
                  requiredRole={['developer', 'admin']}
                >
                  <Especialidades />
                </ProtectedRoute>
              }
            />

            {/* Profissionais - Acesso apenas para admin */}
            <Route
              path="/profissionais"
              element={
                <ProtectedRoute
                  isMobile={isMobile}
                  requiredRole={['developer', 'admin']}
                >
                  <Profissionais />
                </ProtectedRoute>
              }
            />

            {/* Serviços - Acesso apenas para admin */}
            <Route
              path="/servicos"
              element={
                <ProtectedRoute
                  isMobile={isMobile}
                  requiredRole={['developer', 'admin']}
                >
                  <Servicos />
                </ProtectedRoute>
              }
            />

            {/* Usuários - Acesso apenas para admin */}
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute
                  isMobile={isMobile}
                  requiredRole={['developer', 'admin']}
                >
                  <Usuarios />
                </ProtectedRoute>
              }
            />

            {/* WhatsApp - Acesso apenas para admin */}
            <Route
              path="/whatsapp"
              element={
                <ProtectedRoute
                  isMobile={isMobile}
                  requiredRole={['developer', 'admin']}
                >
                  <Whatsapp />
                </ProtectedRoute>
              }
            />

            {/* Gestão MVP - Acesso exclusivo para developer */}
            <Route
              path="/mvp-management"
              element={
                <ProtectedRoute
                  isMobile={isMobile}
                  requiredRole={['developer']}
                >
                  <MvpManagement />
                </ProtectedRoute>
              }
            />

            {/* Conhecimento - Upload de PDF para base de conhecimento */}
            <Route
              path="/conhecimento"
              element={
                <ProtectedRoute
                  isMobile={isMobile}
                  requiredRole={['developer']}
                >
                  <Conhecimento />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route - Redireciona para dashboard */}
            <Route
              path="*"
              element={
                <ProtectedRoute isMobile={isMobile}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </TenantProvider>
    </AuthProvider>
  );
};

export default AppRoutes;