import React from 'react';
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
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-100 flex flex-col">
        <div className="p-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="material-icons-round text-white text-lg">bolt</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-serious-900">Optus Admin</span>
        </div>

        <nav className="flex-1 px-6 space-y-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Principal</p>
            <div className="space-y-2">
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
                icon="medical_services"
                label="Profissionais"
                active={location.pathname === '/profissionais'}
                onClick={() => navigate('/profissionais')}
              />
              <NavItem
                icon="room_service"
                label="Serviços"
                active={location.pathname === '/servicos'}
                onClick={() => navigate('/servicos')}
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Administração</p>
            <div className="space-y-2">
              <NavItem
                icon="manage_accounts"
                label="Usuários"
                active={location.pathname === '/usuarios'}
                onClick={() => navigate('/usuarios')}
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Automação</p>
            <div className="space-y-2">
              <NavItem
                icon="link"
                label="Conexão"
                active={location.pathname === '/whatsapp'}
                onClick={() => navigate('/whatsapp')}
              />
              <NavItem
                icon="menu_book"
                label="Conhecimento"
                active={location.pathname === '/conhecimento'}
                onClick={() => navigate('/conhecimento')}
              />
            </div>
          </div>

          {/* Seção Developer - só aparece para role developer */}
          {userProfile?.role === 'developer' && (
            <div>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-4">Developer</p>
              <div className="space-y-2">
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

        <div className="p-6 border-t border-slate-50">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{userProfile?.name || 'Usuário'}</p>
              <p className="text-xs text-slate-500">
                {userProfile?.role || 'User'}
                {isSystemOwner && (
                  <span className="ml-1 px-1 bg-purple-100 text-purple-600 rounded text-[10px]">
                    OWNER
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={signOut}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <span className="material-icons-round text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-500">
              Tenant: {currentTenant?.name} • Plano: {currentTenant?.plan || 'N/A'}
            </div>
            <div className="flex items-center gap-6">
              <div className="relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2.5 bg-white border-none rounded-xl shadow-sm text-sm w-64 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex gap-2">
                <IconButton icon="notifications" />
                <IconButton icon="settings" />
              </div>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

const WhatsAppIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const NavItem = ({
  icon,
  label,
  active = false,
  disabled = false,
  badge,
  onClick
}: {
  icon: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
}) => (
  <button
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all w-full text-left ${disabled
        ? 'text-slate-300 cursor-not-allowed'
        : active
          ? 'bg-brand-50 text-brand-600 font-bold'
          : 'text-slate-500 hover:bg-slate-50'
      }`}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
  >
    {icon === 'whatsapp' ? (
      <WhatsAppIcon />
    ) : (
      <span className="material-icons-round text-xl">{icon}</span>
    )}
    <span className="text-sm">{label}</span>
    {badge && (
      <span className={`ml-auto text-xs px-2 py-1 rounded-full ${badge === 'NOVO'
          ? 'bg-green-100 text-green-600 font-bold'
          : 'bg-slate-100 text-slate-500'
        }`}>
        {badge}
      </span>
    )}
    {disabled && !badge && <span className="ml-auto text-xs bg-slate-100 px-2 py-1 rounded-full">Em breve</span>}
  </button>
);

const IconButton = ({ icon }: { icon: string }) => (
  <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-500 shadow-sm border border-slate-100 hover:text-brand-500 transition-colors">
    <span className="material-icons-round">{icon}</span>
  </button>
);

export default Layout;