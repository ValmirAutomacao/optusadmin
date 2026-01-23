
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useTenantQuery } from '../hooks/useTenantQuery';
import { useNavigate, useLocation } from 'react-router-dom';

const DesktopDashboard: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const { currentTenant, isSystemOwner } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profissionais } = useTenantQuery({
    table: 'profissionais',
    select: 'id, name, active',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: servicos } = useTenantQuery({
    table: 'servicos',
    select: 'id, name, active, price',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: clientes } = useTenantQuery({
    table: 'clientes',
    select: 'id, name, created_at',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: agendamentos } = useTenantQuery({
    table: 'agendamentos',
    select: 'id, data_agendamento, status',
    orderBy: { column: 'data_agendamento', ascending: true }
  });

  const profissionaisAtivos = profissionais?.filter(p => p.active) || [];
  const servicosAtivos = servicos?.filter(s => s.active) || [];
  const clientesRecentes = clientes?.slice(0, 5) || [];

  const hoje = new Date().toISOString().split('T')[0];
  const agendamentosHoje = agendamentos?.filter(a => a.data_agendamento === hoje) || [];
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Reference Image 3 */}
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
      <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-serious-900">
              Bem-vindo, {userProfile?.name?.split(' ')[0] || 'Usuário'}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Tenant: {currentTenant?.name || 'Carregando...'} • Plano: {currentTenant?.plan || 'N/A'}
            </p>
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
        </header>

        {/* Stats Grid - Real Data */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Profissionais"
            value={profissionaisAtivos.length.toString()}
            change={`${profissionais?.length || 0} total`}
            color="brand"
            onClick={() => navigate('/profissionais')}
          />
          <StatCard
            label="Serviços"
            value={servicosAtivos.length.toString()}
            change={`${servicos?.length || 0} total`}
            color="emerald"
            onClick={() => navigate('/servicos')}
          />
          <StatCard
            label="Clientes"
            value={clientes?.length.toString() || '0'}
            change="Cadastros"
            color="blue"
            onClick={() => navigate('/clientes')}
          />
          <StatCard
            label="Agenda Hoje"
            value={agendamentosHoje.length.toString()}
            change={`${agendamentos?.length || 0} total`}
            color="purple"
            onClick={() => navigate('/agenda')}
          />
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Clientes Recentes */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Clientes Recentes</h3>
              <button
                onClick={() => navigate('/clientes')}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium"
              >
                Ver todos
              </button>
            </div>
            <div className="space-y-3">
              {clientesRecentes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="material-icons-round text-blue-600">people</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Nenhum cliente cadastrado</p>
                  <button
                    onClick={() => navigate('/clientes')}
                    className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Cadastrar primeiro cliente
                  </button>
                </div>
              ) : (
                clientesRecentes.map((cliente: any) => (
                  <div key={cliente.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {cliente.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cliente.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Profissionais */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Profissionais</h3>
              <button
                onClick={() => navigate('/profissionais')}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium"
              >
                Gerenciar
              </button>
            </div>
            <div className="space-y-3">
              {profissionaisAtivos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="material-icons-round text-purple-600">medical_services</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Nenhum profissional cadastrado</p>
                  <button
                    onClick={() => navigate('/profissionais')}
                    className="text-xs bg-purple-500 text-white px-3 py-1 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Cadastrar profissional
                  </button>
                </div>
              ) : (
                profissionaisAtivos.slice(0, 5).map((profissional: any) => (
                  <div key={profissional.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {profissional.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profissional.name}</p>
                      <p className="text-xs text-green-600">Ativo</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Serviços */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Serviços</h3>
              <button
                onClick={() => navigate('/servicos')}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium"
              >
                Gerenciar
              </button>
            </div>
            <div className="space-y-3">
              {servicosAtivos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="material-icons-round text-green-600">room_service</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Nenhum serviço cadastrado</p>
                  <button
                    onClick={() => navigate('/servicos')}
                    className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Cadastrar serviço
                  </button>
                </div>
              ) : (
                servicosAtivos.slice(0, 5).map((servico: any) => (
                  <div key={servico.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                      <span className="material-icons-round text-sm">room_service</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{servico.name}</p>
                      <p className="text-xs text-gray-500">
                        {servico.price
                          ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(servico.price)
                          : 'Preço não definido'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({
  icon,
  label,
  active = false,
  disabled = false,
  onClick
}: {
  icon: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
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
    <span className="material-icons-round text-xl">{icon}</span>
    <span className="text-sm">{label}</span>
    {disabled && <span className="ml-auto text-xs bg-slate-100 px-2 py-1 rounded-full">Em breve</span>}
  </button>
);

const IconButton = ({ icon }: { icon: string }) => (
  <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-500 shadow-sm border border-slate-100 hover:text-brand-500 transition-colors">
    <span className="material-icons-round">{icon}</span>
  </button>
);

const StatCard = ({ label, value, change, color, live = false, onClick }: any) => (
  <div
    className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}`}
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      {live ? (
        <span className="flex items-center gap-1 text-[10px] font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" /> LIVE
        </span>
      ) : (
        <span className={`text-[10px] font-bold ${color === 'rose' ? 'text-rose-500' : color === 'emerald' ? 'text-emerald-500' : color === 'blue' ? 'text-blue-500' : 'text-brand-500'}`}>
          {change}
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-serious-900">{value}</div>
    <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'rose' ? 'bg-rose-500' : color === 'blue' ? 'bg-blue-500' : 'bg-brand-500'} w-1/2`} />
    </div>
  </div>
);

export default DesktopDashboard;
