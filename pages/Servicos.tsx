import React, { useState } from 'react';
import { useTenantQuery, useTenantInsert, useTenantUpdate, useTenantDelete } from '../hooks/useTenantQuery';
import { useTenant } from '../contexts/TenantContext';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import MaskedInput from '../components/ui/MaskedInput';
import Modal from '../components/ui/Modal';

interface Speciality {
  id: string;
  name: string;
}

interface Servico {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  specialty_id?: string;
  active: boolean;
  color: string;
  created_at: string;
  specialty?: { name: string };
}

const Servicos: React.FC = () => {
  const { currentTenant } = useTenant();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: '',
    specialty_id: '',
    active: true,
    color: '#10B981'
  });

  const [formLoading, setFormLoading] = useState(false);

  const { data: servicos, loading, error, refetch } = useTenantQuery<Servico>({
    table: 'servicos',
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration_minutes: 60,
      price: '',
      specialty_id: '',
      active: true,
      color: '#10B981'
    });
    setEditingServico(null);
  };

  const openNewForm = () => {
    resetForm();
    setShowNewForm(true);
  };

  const openEditForm = (servico: Servico) => {
    const priceFormatted = servico.price
      ? (servico.price * 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      : '';

    setFormData({
      name: servico.name,
      description: servico.description || '',
      duration_minutes: servico.duration_minutes,
      price: priceFormatted,
      specialty_id: servico.specialty_id || '',
      active: servico.active,
      color: servico.color
    });
    setEditingServico(servico);
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
      const priceValue = formData.price
        ? parseFloat(formData.price.replace(/[R$\s.,]/g, '')) / 100
        : null;

      const submitData = {
        ...formData,
        price: priceValue
      };

      if (editingServico) {
        await update('servicos', editingServico.id, submitData);
      } else {
        await insert('servicos', submitData);
      }

      await refetch();
      closeForm();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar serviço: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o serviço "${name}"?`)) return;
    try {
      await deleteRecord('servicos', id);
      await refetch();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">Carregando serviços...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Serviços</h1>
            <p className="text-slate-500 mt-1">{servicos.length} procedimentos cadastrados</p>
          </div>
          <Button onClick={openNewForm} icon="add">Novo Serviço</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicos.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: s.color }}>
                  <span className="material-icons-round">room_service</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{s.name}</h3>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wider">
                    {s.specialty?.name || 'Geral'}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${s.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Duração</span>
                  <span className="text-slate-700 font-bold">{s.duration_minutes} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Preço</span>
                  <span className="text-slate-700 font-bold">
                    {s.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEditForm(s)}>Editar</Button>
                <Button size="sm" variant="danger" icon="delete" onClick={() => handleDelete(s.id, s.name)} />
              </div>
            </div>
          ))}
        </div>

        <Modal
          isOpen={showNewForm}
          onClose={closeForm}
          title={editingServico ? 'Editar Serviço' : 'Novo Serviço'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Nome do Serviço" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Especialidade</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 transition-all outline-none"
                  value={formData.specialty_id}
                  onChange={e => setFormData({ ...formData, specialty_id: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {specialties.map(spec => <option key={spec.id} value={spec.id}>{spec.name}</option>)}
                </select>
              </div>
              <Input label="Duração (min)" type="number" value={formData.duration_minutes.toString()} onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MaskedInput label="Preço" maskType="money" value={formData.price} onChange={val => setFormData({ ...formData, price: val })} />
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cor</label>
                <input type="color" className="w-full h-11 rounded-xl cursor-pointer mt-2" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
              <textarea
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 transition-all outline-none resize-none"
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={closeForm}>Cancelar</Button>
              <Button type="submit" loading={formLoading} className="flex-1">
                {editingServico ? 'Salvar Alterações' : 'Criar Serviço'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Servicos;