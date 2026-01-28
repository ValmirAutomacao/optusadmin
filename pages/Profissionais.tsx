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
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
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
      .order('weekday', { ascending: true });

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

  const openEditForm = (profissional: Profissional) => {
    setFormData({
      name: profissional.name,
      specialty_id: profissional.specialty_id || '',
      description: profissional.description || '',
      phone: profissional.phone || '',
      email: profissional.email || '',
      active: profissional.active,
      color: profissional.color
    });
    setEditingProfissional(profissional);
    setShowNewForm(true);
  };

  const closeForm = () => {
    setShowNewForm(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      let profId = editingProfissional?.id;

      if (editingProfissional) {
        await update('profissionais', editingProfissional.id, formData);
      } else {
        const result = await insert('profissionais', formData);
        profId = (result as any)[0].id;
      }

      // Salvar Horários (Simplificado: Deleta e insere de novo)
      if (profId) {
        await supabase.from('professional_schedules').delete().eq('professional_id', profId);

        const schedulesToInsert = schedules.map(s => ({
          ...s,
          professional_id: profId,
          id: undefined // Deixa o banco gerar novos IDs
        })).filter(s => s.weekday !== undefined);

        if (schedulesToInsert.length > 0) {
          await supabase.from('professional_schedules').insert(schedulesToInsert);
        }
      }

      await refetch();
      closeForm();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar profissional: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const addScheduleRow = () => {
    setSchedules([...schedules, { weekday: 1, start_time: '08:00', end_time: '18:00', slot_duration: 30, active: true }]);
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
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">Carregando profissionais...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profissionais</h1>
            <p className="text-slate-500 mt-1">{profissionais.length} membros na equipe</p>
          </div>
          <Button onClick={openNewForm} icon="add">Novo Profissional</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profissionais.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEditForm(p)}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: p.color }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{p.name}</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {p.specialty?.name || 'Sem especialidade'}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${p.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="material-icons-round text-lg">phone</span>
                  {p.phone || 'N/A'}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1" onClick={(e) => { e.stopPropagation(); openEditForm(p); }}>Editar</Button>
              </div>
            </div>
          ))}
        </div>

        <Modal
          isOpen={showNewForm}
          onClose={closeForm}
          title={editingProfissional ? 'Gerenciar Profissional' : 'Novo Profissional'}
          size="lg"
        >
          {/* Tabs */}
          <div className="flex gap-4 border-b border-slate-100 mb-6">
            <button
              className={`pb-3 px-1 text-sm font-bold transition-colors border-b-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
              onClick={() => setActiveTab('info')}
            >
              Info. Gerais
            </button>
            <button
              className={`pb-3 px-1 text-sm font-bold transition-colors border-b-2 ${activeTab === 'agenda' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
              onClick={() => setActiveTab('agenda')}
            >
              Carga Horária
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'info' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input label="Nome" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Especialidade</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 transition-all outline-none"
                      value={formData.specialty_id}
                      onChange={e => setFormData({ ...formData, specialty_id: e.target.value })}
                      required
                    >
                      <option value="">Selecione uma especialidade</option>
                      {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <MaskedInput label="Telefone" maskType="phone" value={formData.phone} onChange={val => setFormData({ ...formData, phone: val })} />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Profissional</label>
                    <textarea
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 transition-all outline-none resize-none"
                      rows={4}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cor</label>
                      <input type="color" className="w-full h-11 rounded-xl cursor-pointer mt-2" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                    </div>
                    <div className="pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} className="w-4 h-4 rounded text-blue-600" />
                        <span className="text-sm font-bold text-slate-700">Ativo</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-slate-800">Grade de Atendimento Semanal</h4>
                  <Button type="button" size="sm" variant="secondary" onClick={addScheduleRow} icon="add">Add Turno</Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {schedules.map((s, index) => (
                    <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <select
                        className="flex-1 min-w-[120px] px-3 py-2 bg-white rounded-lg text-sm font-bold border-none shadow-sm outline-none"
                        value={s.weekday}
                        onChange={e => updateScheduleRow(index, 'weekday', parseInt(e.target.value))}
                      >
                        {WEEKDAYS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                      </select>

                      <div className="flex items-center gap-2">
                        <input type="time" className="px-2 py-2 bg-white rounded-lg text-sm border-none shadow-sm" value={s.start_time?.slice(0, 5)} onChange={e => updateScheduleRow(index, 'start_time', e.target.value)} />
                        <span className="text-slate-400 text-xs font-bold">até</span>
                        <input type="time" className="px-2 py-2 bg-white rounded-lg text-sm border-none shadow-sm" value={s.end_time?.slice(0, 5)} onChange={e => updateScheduleRow(index, 'end_time', e.target.value)} />
                      </div>

                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Slot</span>
                        <input type="number" className="w-12 text-center text-sm font-bold outline-none" value={s.slot_duration} onChange={e => updateScheduleRow(index, 'slot_duration', parseInt(e.target.value))} />
                        <span className="text-slate-400 text-[10px]">min</span>
                      </div>

                      <button type="button" onClick={() => removeScheduleRow(index)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <span className="material-icons-round">delete</span>
                      </button>
                    </div>
                  ))}

                  {schedules.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 text-sm">Nenhum horário configurado ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-6 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={closeForm}>Cancelar</Button>
              <Button type="submit" loading={formLoading} className="flex-1">
                {editingProfissional ? 'Salvar Alterações' : 'Criar Profissional'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Profissionais;