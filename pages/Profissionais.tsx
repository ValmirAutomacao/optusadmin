import React, { useState, useEffect } from 'react';
import { useTenantQuery, useTenantInsert, useTenantUpdate, useTenantDelete } from '../hooks/useTenantQuery';
import { useTenant } from '../contexts/TenantContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import MaskedInput from '../components/ui/MaskedInput';
import Modal from '../components/ui/Modal';

interface Speciality {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  active: boolean;
}

interface Profissional {
  id: string;
  name: string;
  specialty_id: string;
  description?: string;
  phone?: string;
  email?: string;
  active: boolean;
  color: string;
  created_at: string;
  specialty?: { name: string };
}

const WEEKDAYS = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const Profissionais: React.FC = () => {
  const { currentTenant } = useTenant();
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'agenda'>('info');
  const [editingProfissional, setEditingProfissional] = useState<Profissional | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    specialty_id: '',
    description: '',
    phone: '',
    email: '',
    active: true,
    color: '#3B82F6'
  });

  const [schedules, setSchedules] = useState<Partial<Schedule>[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  // Queries
  const { data: profissionais, loading, error, refetch } = useTenantQuery<Profissional>({
    table: 'profissionais',
    select: '*, specialty:specialties(name)',
    orderBy: { column: 'name', ascending: true }
  });

  const { data: specialties } = useTenantQuery<Speciality>({
    table: 'specialties',
    select: 'id, name',
    orderBy: { column: 'name', ascending: true }
  });

  const { insert } = useTenantInsert();
  const { update } = useTenantUpdate();
  const { deleteRecord } = useTenantDelete();

  // Carregar horários ao editar
  useEffect(() => {
    if (editingProfissional) {
      loadSchedules(editingProfissional.id);
    }
  }, [editingProfissional]);

  const loadSchedules = async (profId: string) => {
    const { data, error } = await supabase
      .from('professional_schedules')
      .select('*')
      .eq('professional_id', profId)
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true });

    if (!error && data) {
      setSchedules(data);
    } else {
      setSchedules([]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specialty_id: '',
      description: '',
      phone: '',
      email: '',
      active: true,
      color: '#3B82F6'
    });
    setSchedules([]);
    setEditingProfissional(null);
    setActiveTab('info');
  };

  const openNewForm = () => {
    resetForm();
    setShowNewForm(true);
  };

  const openEditForm = (p: Profissional) => {
    setFormData({
      name: p.name,
      specialty_id: p.specialty_id || '',
      description: p.description || '',
      phone: p.phone || '',
      email: p.email || '',
      active: p.active,
      color: p.color
    });
    setEditingProfissional(p);
    setShowNewForm(true);
  };

  const closeForm = () => {
    setShowNewForm(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.specialty_id) {
      alert("Por favor, selecione uma especialidade.");
      return;
    }

    setFormLoading(true);

    try {
      let profId: string | undefined;

      // 1. Salvar ou Atualizar Profissional
      if (editingProfissional) {
        const result = await update('profissionais', editingProfissional.id, formData);
        profId = result.id;
      } else {
        const result = await insert('profissionais', formData);
        profId = result.id;
      }

      // 2. Salvar Carga Horária (Sempre que houver profId)
      if (profId) {
        // Limpa turnos antigos
        await supabase.from('professional_schedules').delete().eq('professional_id', profId);

        // Prepara novos turnos (MAP EXPLICITO para evitar propriedades extras)
        const schedulesToInsert = schedules
          .filter(s => s.weekday !== undefined && s.start_time && s.end_time)
          .map(s => ({
            professional_id: profId,
            weekday: Number(s.weekday),
            start_time: s.start_time!.length === 5 ? `${s.start_time}:00` : s.start_time,
            end_time: s.end_time!.length === 5 ? `${s.end_time}:00` : s.end_time,
            slot_duration: Number(s.slot_duration || 30),
            active: true
          }));

        if (schedulesToInsert.length > 0) {
          const { error: scheduleError } = await supabase
            .from('professional_schedules')
            .insert(schedulesToInsert);

          if (scheduleError) {
            console.error('Erro na carga horária:', scheduleError);
            throw new Error(`Erro ao salvar turnos: ${scheduleError.message}`);
          }
        }
      }

      await refetch();
      closeForm();
    } catch (err: any) {
      console.error('Erro detalhado:', err);
      alert('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setFormLoading(false);
    }
  };

  const addScheduleRow = () => {
    setSchedules([...schedules, { weekday: 1, start_time: '08:00', end_time: '12:00', slot_duration: 30, active: true }]);
  };

  const removeScheduleRow = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateScheduleRow = (index: number, field: string, value: any) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir profissional ${name}?`)) return;
    try {
      await deleteRecord('profissionais', id);
      await refetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-500 font-medium">Sincronizando equipe...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Equipe Médica</h1>
            <p className="text-slate-500 mt-1 font-medium">{profissionais.length} membros ativos</p>
          </div>
          <Button onClick={openNewForm} icon="add" className="shadow-lg shadow-blue-600/20">Novo Profissional</Button>
        </div>

        {/* Listagem Estilizada */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profissionais.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              onClick={() => openEditForm(p)}
            >
              <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-inner rotate-3 group-hover:rotate-0 transition-transform" style={{ backgroundColor: p.color }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-lg truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{p.name}</h3>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 uppercase tracking-widest mt-1 border border-blue-100">
                    {p.specialty?.name || 'Geral'}
                  </div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border-[3px] border-white shadow-sm ${p.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 text-slate-500">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <span className="material-icons-round text-xl">phone</span>
                  </div>
                  <span className="text-sm font-black">{p.phone || '–'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button size="sm" variant="secondary" className="flex-1 rounded-[1.25rem] font-black uppercase text-[10px] tracking-widest py-3" onClick={(e) => { e.stopPropagation(); openEditForm(p); }}>Gerenciar</Button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name); }}
                  className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <span className="material-icons-round">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <Modal
          isOpen={showNewForm}
          onClose={closeForm}
          title={editingProfissional ? 'Painel do Especialista' : 'Admitir Novo Especialista'}
          size="lg"
        >
          <div className="flex gap-10 border-b border-slate-100 mb-10 overflow-x-auto hide-scrollbar">
            <button
              className={`pb-5 px-1 text-xs font-black uppercase tracking-[0.25em] transition-all border-b-4 ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-300 hover:text-slate-500'}`}
              onClick={() => setActiveTab('info')}
            >
              Dados Básicos
            </button>
            <button
              className={`pb-5 px-1 text-xs font-black uppercase tracking-[0.25em] transition-all border-b-4 ${activeTab === 'agenda' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-300 hover:text-slate-500'}`}
              onClick={() => setActiveTab('agenda')}
            >
              Carga Horária
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {activeTab === 'info' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <Input label="Nome Completo" placeholder="Ex: Dra. Ana Paula" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Especialidade Clínica</label>
                    <select
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500/20 transition-all outline-none appearance-none cursor-pointer border-r-[16px] border-r-transparent"
                      value={formData.specialty_id}
                      onChange={e => setFormData({ ...formData, specialty_id: e.target.value })}
                      required
                    >
                      <option value="">Selecione...</option>
                      {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <MaskedInput label="WhatsApp Profissional" maskType="phone" value={formData.phone} onChange={val => setFormData({ ...formData, phone: val })} />
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Bio / Observações</label>
                    <textarea
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500/20 transition-all outline-none resize-none"
                      rows={5}
                      placeholder="Breve descrição dos serviços ou carreira..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end gap-6">
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Identidade (Cor)</label>
                      <input type="color" className="w-full h-14 rounded-[1.25rem] cursor-pointer mt-2 border-none shadow-sm" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                    </div>
                    <div className="pb-1">
                      <label className="flex items-center gap-4 cursor-pointer bg-slate-50 px-6 py-4 rounded-[1.25rem] border-2 border-transparent hover:border-blue-100 transition-all">
                        <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} className="w-6 h-6 rounded-lg text-blue-600 border-slate-200 focus:ring-blue-500" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Ativo</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50">
                  <div>
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">Grade de Turnos</h4>
                    <p className="text-[11px] text-blue-600 font-bold mt-1">Configure o calendário semanal de atendimentos.</p>
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={addScheduleRow} icon="add" className="bg-white hover:bg-blue-600 hover:text-white border-none shadow-md px-6 rounded-2xl">Adicionar</Button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {schedules.map((s, index) => (
                    <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-6 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>

                      <div className="flex-1 min-w-[180px]">
                        <label className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] block mb-2 px-1">Dia da Semana</label>
                        <select
                          className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-[11px] font-black text-slate-700 border-none outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                          value={s.weekday}
                          onChange={e => updateScheduleRow(index, 'weekday', parseInt(e.target.value))}
                        >
                          {WEEKDAYS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                        </select>
                      </div>

                      <div className="flex items-center gap-4">
                        <div>
                          <label className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] block mb-2 px-1">Entrada</label>
                          <input type="time" className="px-4 py-3 bg-slate-50 rounded-2xl text-[11px] font-black text-slate-700 border-none hover:bg-slate-100 transition-colors" value={s.start_time?.slice(0, 5)} onChange={e => updateScheduleRow(index, 'start_time', e.target.value)} />
                        </div>
                        <div className="pt-6">
                          <span className="material-icons-round text-slate-200 text-lg">arrow_forward</span>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] block mb-2 px-1">Saída</label>
                          <input type="time" className="px-4 py-3 bg-slate-50 rounded-2xl text-[11px] font-black text-slate-700 border-none hover:bg-slate-100 transition-colors" value={s.end_time?.slice(0, 5)} onChange={e => updateScheduleRow(index, 'end_time', e.target.value)} />
                        </div>
                      </div>

                      <div className="min-w-[100px]">
                        <label className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] block mb-2 px-1">Consulta</label>
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl hover:bg-slate-100 transition-colors">
                          <input type="number" className="w-10 bg-transparent text-center text-xs font-black text-slate-700 outline-none" value={s.slot_duration} onChange={e => updateScheduleRow(index, 'slot_duration', parseInt(e.target.value))} />
                          <span className="text-slate-400 text-[9px] font-black uppercase">min</span>
                        </div>
                      </div>

                      <button type="button" onClick={() => removeScheduleRow(index)} className="mt-4 md:mt-2 p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <span className="material-icons-round">delete_outline</span>
                      </button>
                    </div>
                  ))}

                  {schedules.length === 0 && (
                    <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100/80">
                      <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-50">
                        <span className="material-icons-round text-slate-200 text-4xl">calendar_today</span>
                      </div>
                      <p className="text-slate-400 font-bold text-sm tracking-tight">Sem horários configurados.<br /><span className="text-blue-500/50 uppercase text-[10px] font-black tracking-widest">Clique acima para incluir um turno</span></p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-5 pt-8 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={closeForm} className="px-10 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] py-4">Voltar</Button>
              <Button type="submit" loading={formLoading} className="flex-1 rounded-[1.5rem] shadow-2xl shadow-blue-600/30 font-black uppercase text-xs tracking-[0.25em] py-4 bg-gradient-to-r from-blue-600 to-blue-700">Finalizar e Salvar</Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Profissionais;