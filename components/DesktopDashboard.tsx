import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useTenantQuery } from '../hooks/useTenantQuery';
import { useNavigate } from 'react-router-dom';

const DesktopDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { currentTenant } = useTenant();
  const navigate = useNavigate();

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

  // Query de agendamentos removida temporariamente - coluna hora_agendamento não existe
  const agendamentos: any[] = [];

  const profissionaisAtivos = profissionais?.filter(p => p.active) || [];
  const servicosAtivos = servicos?.filter(s => s.active) || [];

  const hoje = new Date().toISOString().split('T')[0];
  const agendamentosHoje = agendamentos?.filter(a => a.data_agendamento === hoje) || [];

  return (
    <div className="space-y-12 pb-10">

      {/* --- QUICK ACTIONS SECTION --- */}
      <section className="animate-reveal stagger-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
          AÇÕES RÁPIDAS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ActionCard
            label="NOVO AGENDAMENTO"
            icon="add_circle"
            color="orange"
            onClick={() => navigate('/agenda')}
          />
          <ActionCard
            label="VER AGENDA"
            icon="calendar_month"
            color="white"
            onClick={() => navigate('/agenda')}
          />
          <ActionCard
            label="CADASTRAR CLIENTE"
            icon="person_add"
            color="white"
            onClick={() => navigate('/clientes')}
          />
          <ActionCard
            label="CONFIGURAÇÕES"
            icon="settings"
            color="white"
            onClick={() => navigate('/usuarios')}
          />
        </div>
      </section>

      {/* --- PERFORMANCE SECTION --- */}
      <section className="animate-reveal stagger-2">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            PERFORMANCE DE HOJE
          </h3>
          <span className="flex items-center gap-1.5 text-[10px] font-black text-[#ff6b00]">
            <span className="w-1.5 h-1.5 bg-[#ff6b00] rounded-full animate-pulse"></span> AO VIVO
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PerformanceIndicator
            label="AGENDAMENTOS"
            value={agendamentosHoje.length}
            percentage={Math.min((agendamentosHoje.length / 10) * 100, 100)}
          />
          <PerformanceIndicator
            label="TAXA DE OCUPAÇÃO"
            value="75%"
            percentage={75}
          />
          <PerformanceIndicator
            label="NOVOS CLIENTES"
            value={clientes?.length || 0}
            percentage={clientes?.length ? 45 : 0}
          />
        </div>
      </section>

      {/* --- SCHEDULE SECTION --- */}
      <section className="animate-reveal stagger-3">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            AGENDA DE HOJE
          </h3>
          <button onClick={() => navigate('/agenda')} className="text-xs font-black text-[#ff6b00] uppercase tracking-widest hover:underline transition-all">
            Ver Tudo
          </button>
        </div>

        <div className="bg-white rounded-[2rem] p-10 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons-round text-slate-200 text-3xl">event_available</span>
          </div>
          {agendamentosHoje.length === 0 ? (
            <p className="text-slate-500 font-medium tracking-tight">Nenhum agendamento para hoje.</p>
          ) : (
            <div className="space-y-4 text-left">
              {agendamentosHoje.map((a, i) => (
                <ScheduleItem
                  key={a.id}
                  time={a.hora_agendamento || '09:00'}
                  title="Consulta Técnica"
                  client="Cliente Registrado"
                  duration="45 min"
                  delay={i * 100}
                />
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

// --- HELPER COMPONENTS ---

const ActionCard = ({ label, icon, color, onClick }: any) => {
  const isOrange = color === 'orange';
  return (
    <button
      onClick={onClick}
      className={`action-card md:h-52 flex flex-col items-center justify-center gap-6 p-8 shadow-2xl transition-all ${isOrange
        ? 'bg-[#ff6b00] text-white shadow-[#ff6b00]/30 hover:shadow-[#ff6b00]/40'
        : 'bg-white text-slate-800 shadow-slate-200/40 border border-white hover:shadow-slate-200/60'
        }`}
    >
      <div className={`p-4 rounded-3xl ${isOrange ? 'bg-white/20' : 'bg-slate-50'}`}>
        <span className={`material-icons-round text-4xl ${isOrange ? 'text-white' : 'text-[#ff6b00]'}`}>{icon}</span>
      </div>
      <span className="text-[11px] font-black uppercase tracking-widest text-center leading-relaxed">
        {label}
      </span>
    </button>
  );
};

const PerformanceIndicator = ({ label, value, percentage }: any) => (
  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
    <div className="flex justify-between items-start mb-4">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
        {label}
      </p>
    </div>
    <div className="text-3xl font-black text-slate-800 mb-4">{value}</div>
    <div className="chart-bar">
      <div
        className="chart-bar-fill"
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

const ScheduleItem = ({ time, title, client, duration, delay }: any) => (
  <div
    className="bg-white rounded-[2rem] p-6 flex items-center gap-6 shadow-sm border border-slate-100/50 animate-reveal"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex flex-col items-center">
      <span className="text-lg font-black text-slate-800 leading-none">{time}</span>
      <span className="text-[10px] font-black text-slate-400 uppercase mt-1">AM</span>
    </div>
    <div className="w-px h-10 bg-slate-100" />
    <div className="flex-1">
      <h4 className="font-black text-slate-800 tracking-tight">{title}</h4>
      <p className="text-xs text-slate-500 font-medium tracking-tight">Cliente: {client}</p>
    </div>
    <span className="hidden md:block px-3 py-1 bg-orange-50 text-[#ff6b00] rounded-full text-[10px] font-black uppercase">
      {duration}
    </span>
  </div>
);

export default DesktopDashboard;
