import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userProfile, signOut } = useAuth();
  const { currentTenant, isSystemOwner } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Sidebar - Always Visible on Desktop */}
      <aside className="w-72 flex-shrink-0 flex flex-col bg-white border-r border-slate-100/50 shadow-sm z-20">
        {/* Logo Section */}
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
            <span className="material-icons-round text-white text-xl">bolt</span>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-800">Optus</span>
            <span className="text-xl font-light text-slate-400">Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-7 overflow-y-auto hide-scrollbar">
          {/* Section: Principal */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">
              Principal
            </p>
            <div className="space-y-1">
              <NavItem
                icon="dashboard"
                label="Dashboard"
                active={location.pathname === '/'}
                onClick={() => navigate('/')}
              />
              <NavItem
                icon="calendar_month"
                label="Agenda"
                active={location.pathname === '/agenda'}
                onClick={() => navigate('/agenda')}
              />
              <NavItem
                icon="people"
                label="Clientes"
                active={location.pathname === '/clientes'}
                onClick={() => navigate('/clientes')}
              />
              <NavItem
                icon="contact_page"
                label="Leads"
                active={location.pathname === '/leads'}
                onClick={() => navigate('/leads')}
              />
              <NavItem
                icon="medical_services"
                label="Profissionais"
                active={location.pathname === '/profissionais'}
                onClick={() => navigate('/profissionais')}
              />
            </div>
          </div>

          {/* Section: Gestão */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">
              Gestão
            </p>
            <div className="space-y-1">
              <NavItem
                icon="room_service"
                label="Serviços"
                active={location.pathname === '/servicos'}
                onClick={() => navigate('/servicos')}
              />
              <NavItem
                icon="manage_accounts"
                label="Usuários"
                active={location.pathname === '/usuarios'}
                onClick={() => navigate('/usuarios')}
              />
            </div>
          </div>

          {/* Section: Automação */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">
              Automação
            </p>
            <div className="space-y-1">
              <NavItem
                icon="link"
                label="Whatsapp"
                active={location.pathname === '/whatsapp'}
                onClick={() => navigate('/whatsapp')}
              />
            </div>
          </div>

          {/* Section: Extra */}
          {userProfile?.role === 'developer' && (
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 px-4">
                Sistema
              </p>
              <div className="space-y-1">
                <NavItem
                  icon="admin_panel_settings"
                  label="Gestão MVP"
                  active={location.pathname === '/mvp-management'}
                  onClick={() => navigate('/mvp-management')}
                />
              </div>
            </div>
          )}
        </nav>

        {/* Desktop User Footer */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-50 border border-slate-100/50 rounded-3xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-600/10">
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                {userProfile?.name?.split(' ')[0] || 'Usuário'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {userProfile?.role || 'Acesso'}
              </p>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <span className="material-icons-round text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header - Clean */}
        <div className="h-4"></div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-32 md:pb-10 pt-2">
          <div className="max-w-7xl mx-auto animate-reveal">
            {children}
          </div>
        </div>

        {/* Floating Action Button (Mobile Reference Look) */}
        <button className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-[#ff6b00] rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,107,0,0.4)] z-40 active:scale-90 transition-transform">
          <span className="material-icons-round text-3xl">add</span>
        </button>

        {/* Bottom Navigation - Mobile Only */}
        <div className="mobile-nav md:hidden">
          <BottomTab
            icon="home"
            active={location.pathname === '/'}
            onClick={() => navigate('/')}
          />
          <BottomTab
            icon="calendar_month"
            active={location.pathname === '/agenda'}
            onClick={() => navigate('/agenda')}
          />
          <div className="w-12"></div>
          <BottomTab
            icon="people"
            active={location.pathname === '/clientes'}
            onClick={() => navigate('/clientes')}
          />
          <BottomTab
            icon="settings"
            active={location.pathname === '/usuarios'}
            onClick={() => navigate('/usuarios')}
          />
        </div>
      </main>
    </div>
  );
};

// Types & Helpers
const NavItem = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${active
      ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/25 font-bold'
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
  >
    <span className="material-icons-round text-[20px]">{icon}</span>
    <span className="text-sm tracking-tight">{label}</span>
  </button>
);

const BottomTab = ({ icon, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 transition-all ${active ? 'text-white' : 'text-slate-500'
      }`}
  >
    <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-[#ff6b00] shadow-lg shadow-[#ff6b00]/30' : ''}`}>
      <span className="material-icons-round text-2xl">{icon}</span>
    </div>
  </button>
);

export default Layout;