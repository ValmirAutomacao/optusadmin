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
    } else {
      setSchedules([]);
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
      let profId = editingProfissional?.id;

      if (editingProfissional) {
        await update('profissionais', editingProfissional.id, formData);
      } else {
        const result = await insert('profissionais', formData);
        if (result && Array.isArray(result) && result.length > 0) {
          profId = result[0].id;
        }
      }

      // Salvar Horários
      if (profId) {
        // 1. Deleta os antigos
        await supabase.from('professional_schedules').delete().eq('professional_id', profId);

        // 2. Prepara os novos (limpando IDs e garantindo formatos)
        const schedulesToInsert = schedules
          .filter(s => s.weekday !== undefined && s.start_time && s.end_time)
          .map(s => ({
            professional_id: profId,
            weekday: s.weekday,
            start_time: s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time,
            end_time: s.end_time.length === 5 ? `${s.end_time}:00` : s.end_time,
            slot_duration: s.slot_duration || 30,
            active: true
          }));

        if (schedulesToInsert.length > 0) {
          const { error: scheduleError } = await supabase
            .from('professional_schedules')
            .insert(schedulesToInsert);

          if (scheduleError) throw scheduleError;
        }
      }

      await refetch();
      closeForm();
    } catch (err: any) {
      console.error('Erro detalhado ao salvar:', err);
      alert('Erro ao salvar profissional: ' + (err.message || 'Erro desconhecido'));
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

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-500 font-medium">Sincronizando profissionais...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Equipe Médica</h1>
            <p className="text-slate-500 mt-1 font-medium">{profissionais.length} especialistas ativos</p>
          </div>
          <Button onClick={openNewForm} icon="add" className="shadow-lg shadow-blue-600/20">Novo Profissional</Button>
        </div>

        {/* Listagem */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profissionais.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-[2rem] border border-slate-100 p-7 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
              onClick={() => openEditForm(p)}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-inner" style={{ backgroundColor: p.color }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-lg truncate group-hover:text-blue-600 transition-colors">{p.name}</h3>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 uppercase tracking-widest mt-1">
                    {p.specialty?.name || 'Geral'}
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full border-4 border-white shadow-sm ${p.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-slate-500">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <span className="material-icons-round text-lg">phone</span>
                  </div>
                  <span className="text-sm font-bold">{p.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="secondary" className="flex-1 rounded-xl" onClick={(e) => { e.stopPropagation(); openEditForm(p); }}>Gerenciar</Button>
              </div>
            </div>
          ))}
        </div>

        <Modal
          isOpen={showNewForm}
          onClose={closeForm}
          title={editingProfissional ? 'Gerenciar Especialista' : 'Novo Especialista'}
          size="lg"
        >
          {/* Tabs Estilizadas */}
          <div className="flex gap-8 border-b border-slate-100 mb-8">
            <button
              className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              onClick={() => setActiveTab('info')}
            >
              Dados Básicos
            </button>
            <button
              className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'agenda' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              onClick={() => setActiveTab('agenda')}
            >
              Carga Horária
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'info' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <Input label="Nome Completo" placeholder="Ex: Dr. Roberto Silva" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Especialidade</label>
                    <select
                      className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500/20 transition-all outline-none appearance-none cursor-pointer"
                      value={formData.specialty_id}
                      onChange={e => setFormData({ ...formData, specialty_id: e.target.value })}
                      required
                    >
                      <option value="">Selecione...</option>
                      {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <MaskedInput label="WhatsApp / Telefone" maskType="phone" value={formData.phone} onChange={val => setFormData({ ...formData, phone: val })} />
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sobre o Profissional</label>
                    <textarea
                      className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500/20 transition-all outline-none resize-none"
                      rows={4}
                      placeholder="Resumo biográfico ou notas internas..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end gap-6">
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cor na Agenda</label>
                      <input type="color" className="w-full h-12 rounded-2xl cursor-pointer mt-2 border-none shadow-sm" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                    </div>
                    <div className="pb-2">
                      <label className="flex items-center gap-3 cursor-pointer bg-slate-50 px-4 py-3 rounded-2xl border-2 border-transparent hover:border-blue-100 transition-all">
                        <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} className="w-5 h-5 rounded-lg text-blue-600 border-slate-200 focus:ring-blue-500" />
                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Ativo</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-3xl">
                  <div>
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">Grade Semanal</h4>
                    <p className="text-[11px] text-blue-600 font-bold mt-0.5">Cadastre os turnos de atendimento deste especialista.</p>
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={addScheduleRow} icon="add" className="bg-white hover:bg-blue-600 hover:text-white border-none shadow-sm">Adicionar Turno</Button>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                  {schedules.map((s, index) => (
                    <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-4 p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm animate-reveal">
                      <div className="flex-1 min-w-[150px]">
                        <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">Dia</label>
                        <select
                          className="w-full px-3 py-2 bg-slate-50 rounded-xl text-xs font-black text-slate-700 border-none outline-none cursor-pointer"
                          value={s.weekday}
                          onChange={e => updateScheduleRow(index, 'weekday', parseInt(e.target.value))}
                        >
                          {WEEKDAYS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <div>
                          <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">Início</label>
                          <input type="time" className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-black text-slate-700 border-none" value={s.start_time?.slice(0, 5)} onChange={e => updateScheduleRow(index, 'start_time', e.target.value)} />
                        </div>
                        <span className="mt-4 text-slate-300">
                          <span className="material-icons-round text-sm">east</span>
                        </span>
                        <div>
                          <label className="text-[9px] font-black text-slate-300 uppercase tracking_widest block mb-1">Término</label>
                          <input type="time" className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-black text-slate-700 border-none" value={s.end_time?.slice(0, 5)} onChange={e => updateScheduleRow(index, 'end_time', e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">Duração</label>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                          <input type="number" className="w-10 bg-transparent text-center text-xs font-black text-slate-700 outline-none" value={s.slot_duration} onChange={e => updateScheduleRow(index, 'slot_duration', parseInt(e.target.value))} />
                          <span className="text-slate-400 text-[10px] font-bold">min</span>
                        </div>
                      </div>

                      <button type="button" onClick={() => removeScheduleRow(index)} className="mt-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <span className="material-icons-round">delete</span>
                      </button>
                    </div>
                  ))}

                  {schedules.length === 0 && (
                    <div className="text-center py-16 bg-slate-50/50 rounded-[2.5rem] border-4 border-dashed border-slate-100">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <span className="material-icons-round text-slate-200 text-3xl">event_busy</span>
                      </div>
                      <p className="text-slate-400 font-bold text-sm tracking-tight">Nenhum turno definido.<br />Clique em "Adicionar Turno" para começar.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-8 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={closeForm} className="px-8 rounded-2xl font-black uppercase text-xs tracking-widest">Descartar</Button>
              <Button type="submit" loading={formLoading} className="flex-1 rounded-2xl shadow-xl shadow-blue-600/20 font-black uppercase text-xs tracking-[0.2em]">
                {editingProfissional ? 'Salvar Configurações' : 'Efetivar Cadastro'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Profissionais;