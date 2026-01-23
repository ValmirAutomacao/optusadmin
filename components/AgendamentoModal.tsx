import React, { useState, useEffect } from 'react';
import { useTenantQuery } from '../hooks/useTenantQuery';
import { useTenant } from '../contexts/TenantContext';
import { supabase } from '../lib/supabase';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';

interface AgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onSave?: (agendamento: any) => void;
}

const AgendamentoModal: React.FC<AgendamentoModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSave
}) => {
  const [formData, setFormData] = useState({
    cliente_id: '',
    profissional_id: '',
    servico_id: '',
    data_agendamento: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    hora_inicio: '',
    observacoes: ''
  });
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  const { currentTenant } = useTenant();

  // Buscar dados para os selects
  const { data: clientes } = useTenantQuery({
    table: 'clientes',
    select: 'id, name',
    orderBy: { column: 'name', ascending: true }
  });

  const { data: profissionais } = useTenantQuery({
    table: 'profissionais',
    select: 'id, name, color',
    filter: { column: 'active', value: true },
    orderBy: { column: 'name', ascending: true }
  });

  const { data: servicos } = useTenantQuery({
    table: 'servicos',
    select: 'id, name, duration_minutes, price',
    filter: { column: 'active', value: true },
    orderBy: { column: 'name', ascending: true }
  });

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      profissional_id: '',
      servico_id: '',
      data_agendamento: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
      hora_inicio: '',
      observacoes: ''
    });
    setAvailabilityError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    if (!startTime) return '';

    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    return endDate.toTimeString().slice(0, 5);
  };

  const selectedServico = servicos?.find(s => s.id === formData.servico_id);
  const endTime = selectedServico && formData.hora_inicio
    ? calculateEndTime(formData.hora_inicio, selectedServico.duration_minutes)
    : '';

  // Verificação de disponibilidade
  const checkAvailability = async () => {
    if (!formData.profissional_id || !formData.data_agendamento || !formData.hora_inicio || !endTime) {
      return true;
    }

    setCheckingAvailability(true);
    setAvailabilityError('');

    try {
      const { data: conflictingAgendamentos } = await supabase
        .from('agendamentos')
        .select('id, hora_inicio, hora_fim, cliente:clientes(name)')
        .eq('tenant_id', currentTenant?.id)
        .eq('profissional_id', formData.profissional_id)
        .eq('data_agendamento', formData.data_agendamento)
        .neq('status', 'cancelado')
        .gte('hora_fim', formData.hora_inicio)
        .lte('hora_inicio', endTime);

      if (conflictingAgendamentos && conflictingAgendamentos.length > 0) {
        const conflict = conflictingAgendamentos[0];
        setAvailabilityError(
          `Horário não disponível. Conflito com agendamento das ${conflict.hora_inicio} - ${conflict.hora_fim} com ${conflict.cliente?.name || 'Cliente'}.`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      setAvailabilityError('Erro ao verificar disponibilidade. Tente novamente.');
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Verificação automática quando dados necessários estão disponíveis
  useEffect(() => {
    if (formData.profissional_id && formData.data_agendamento && formData.hora_inicio && endTime) {
      const timer = setTimeout(() => {
        checkAvailability();
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timer);
    } else {
      setAvailabilityError('');
    }
  }, [formData.profissional_id, formData.data_agendamento, formData.hora_inicio, endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificação final de disponibilidade antes de salvar
      const isAvailable = await checkAvailability();
      if (!isAvailable) {
        setLoading(false);
        return;
      }

      const agendamentoData = {
        ...formData,
        hora_fim: endTime,
        valor_servico: selectedServico?.price || null,
        valor_total: selectedServico?.price || null,
        status: 'agendado'
      };

      await onSave?.(agendamentoData);
      handleClose();
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      alert('Erro ao criar agendamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.cliente_id && formData.profissional_id &&
                     formData.servico_id && formData.data_agendamento &&
                     formData.hora_inicio && !availabilityError;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Novo Agendamento" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
            Cliente *
          </label>
          <select
            value={formData.cliente_id}
            onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
            required
            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
          >
            <option value="">Selecione um cliente</option>
            {clientes?.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.name}
              </option>
            ))}
          </select>
        </div>

        {/* Profissional */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
            Profissional *
          </label>
          <select
            value={formData.profissional_id}
            onChange={(e) => setFormData({ ...formData, profissional_id: e.target.value })}
            required
            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
          >
            <option value="">Selecione um profissional</option>
            {profissionais?.map((profissional) => (
              <option key={profissional.id} value={profissional.id}>
                {profissional.name}
              </option>
            ))}
          </select>
        </div>

        {/* Serviço */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
            Serviço *
          </label>
          <select
            value={formData.servico_id}
            onChange={(e) => setFormData({ ...formData, servico_id: e.target.value })}
            required
            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
          >
            <option value="">Selecione um serviço</option>
            {servicos?.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.name} ({servico.duration_minutes}min)
                {servico.price && ` - ${new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(servico.price)}`}
              </option>
            ))}
          </select>
        </div>

        {/* Data e Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Data"
            type="date"
            icon="calendar_today"
            value={formData.data_agendamento}
            onChange={(e) => setFormData({ ...formData, data_agendamento: e.target.value })}
            required
          />

          <Input
            label="Horário de Início"
            type="time"
            icon="schedule"
            value={formData.hora_inicio}
            onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
            required
          />
        </div>

        {/* Resumo do Agendamento */}
        {selectedServico && formData.hora_inicio && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Resumo do Agendamento</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Duração:</strong> {selectedServico.duration_minutes} minutos</p>
              <p><strong>Término:</strong> {endTime}</p>
              {selectedServico.price && (
                <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(selectedServico.price)}</p>
              )}
            </div>
          </div>
        )}

        {/* Status de Disponibilidade */}
        {formData.profissional_id && formData.data_agendamento && formData.hora_inicio && (
          <div className={`rounded-xl p-4 border ${
            checkingAvailability
              ? 'bg-yellow-50 border-yellow-200'
              : availabilityError
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2">
              {checkingAvailability && (
                <>
                  <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-yellow-800">Verificando disponibilidade...</span>
                </>
              )}

              {!checkingAvailability && availabilityError && (
                <>
                  <span className="material-icons-round text-red-600 text-lg">warning</span>
                  <span className="text-sm font-medium text-red-800">{availabilityError}</span>
                </>
              )}

              {!checkingAvailability && !availabilityError && endTime && (
                <>
                  <span className="material-icons-round text-green-600 text-lg">check_circle</span>
                  <span className="text-sm font-medium text-green-800">Horário disponível!</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
            Observações
          </label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            placeholder="Observações adicionais..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!isFormValid}
          >
            Agendar
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AgendamentoModal;