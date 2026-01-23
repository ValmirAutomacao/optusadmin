import React, { useState } from 'react';
import { useTenantQuery, useTenantInsert } from '../hooks/useTenantQuery';
import { useTenant } from '../contexts/TenantContext';
import Layout from '../components/Layout';
import Calendar from '../components/Calendar';
import AgendamentoModal from '../components/AgendamentoModal';
import Button from '../components/ui/Button';

interface Agendamento {
  id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string;
  data_agendamento: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  observacoes?: string;
  cliente?: { name: string };
  profissional?: { name: string; color: string };
  servico?: { name: string };
}

const Agenda: React.FC = () => {
  const { currentTenant } = useTenant();
  const [showNewAgendamento, setShowNewAgendamento] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const {
    data: agendamentos,
    loading,
    error,
    refetch
  } = useTenantQuery<Agendamento>({
    table: 'agendamentos',
    select: `
      *,
      cliente:clientes(name),
      profissional:profissionais(name, color),
      servico:servicos(name)
    `,
    orderBy: { column: 'data_agendamento', ascending: true }
  });

  const { insert } = useTenantInsert();

  const formatAgendamentosForCalendar = (agendamentos: Agendamento[]) => {
    return agendamentos?.map(agendamento => ({
      id: agendamento.id,
      title: `${agendamento.hora_inicio} - ${agendamento.cliente?.name}`,
      start: `${agendamento.data_agendamento}T${agendamento.hora_inicio}`,
      end: `${agendamento.data_agendamento}T${agendamento.hora_fim}`,
      color: agendamento.profissional?.color || '#3B82F6',
      cliente: agendamento.cliente?.name,
      profissional: agendamento.profissional?.name,
      status: agendamento.status
    })) || [];
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowNewAgendamento(true);
  };

  const handleEventClick = (event: any) => {
    const agendamento = agendamentos?.find(a => a.id === event.id);
    if (agendamento) {
      setSelectedAgendamento(agendamento);
    }
  };

  const handleSaveAgendamento = async (agendamentoData: any) => {
    try {
      await insert('agendamentos', agendamentoData);
      await refetch();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      throw error;
    }
  };

  const getStatusStats = () => {
    if (!agendamentos) return { total: 0, hoje: 0, pendentes: 0 };

    const hoje = new Date().toISOString().split('T')[0];
    const agendamentosHoje = agendamentos.filter(a => a.data_agendamento === hoje);
    const pendentes = agendamentos.filter(a => a.status === 'agendado').length;

    return {
      total: agendamentos.length,
      hoje: agendamentosHoje.length,
      pendentes
    };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Agenda</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando agenda...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Agenda</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-red-600 text-2xl">error</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refetch} icon="refresh">
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
            <p className="text-gray-600 mt-1">
              {stats.total} agendamentos • {stats.hoje} hoje • {stats.pendentes} pendentes
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  view === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  view === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  view === 'day'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dia
              </button>
            </div>

            <Button onClick={() => setShowNewAgendamento(true)} icon="add">
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="material-icons-round text-blue-600">event</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Agendamentos</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="material-icons-round text-green-600">today</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.hoje}</p>
                <p className="text-sm text-gray-600">Hoje</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="material-icons-round text-yellow-600">schedule</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendentes}</p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <Calendar
          events={formatAgendamentosForCalendar(agendamentos)}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          view={view}
        />

        {/* Modal de Novo Agendamento */}
        <AgendamentoModal
          isOpen={showNewAgendamento}
          onClose={() => {
            setShowNewAgendamento(false);
            setSelectedDate(undefined);
          }}
          selectedDate={selectedDate}
          onSave={handleSaveAgendamento}
        />

        {/* Modal de Visualização do Agendamento */}
        {selectedAgendamento && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Detalhes do Agendamento</h3>
                <button
                  onClick={() => setSelectedAgendamento(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="material-icons-round">close</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Cliente */}
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Cliente</p>
                  <p className="text-lg font-medium">{selectedAgendamento.cliente?.name}</p>
                </div>

                {/* Profissional */}
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Profissional</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedAgendamento.profissional?.color || '#3B82F6' }}
                    />
                    <p className="text-lg font-medium">{selectedAgendamento.profissional?.name}</p>
                  </div>
                </div>

                {/* Serviço */}
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Serviço</p>
                  <p className="text-lg font-medium">{selectedAgendamento.servico?.name}</p>
                </div>

                {/* Data e Horário */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Data</p>
                    <p className="font-medium">
                      {new Date(selectedAgendamento.data_agendamento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Horário</p>
                    <p className="font-medium">
                      {selectedAgendamento.hora_inicio} - {selectedAgendamento.hora_fim}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    selectedAgendamento.status === 'agendado'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedAgendamento.status === 'confirmado'
                        ? 'bg-green-100 text-green-800'
                        : selectedAgendamento.status === 'cancelado'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAgendamento.status.charAt(0).toUpperCase() + selectedAgendamento.status.slice(1)}
                  </span>
                </div>

                {/* Observações */}
                {selectedAgendamento.observacoes && (
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Observações</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedAgendamento.observacoes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedAgendamento(null)}
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Implementar edição
                    console.log('Editar agendamento:', selectedAgendamento.id);
                  }}
                  icon="edit"
                  className="flex-1"
                >
                  Editar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Agenda;