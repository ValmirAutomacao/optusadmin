import React, { useState } from 'react';
import { useTenantQuery, useTenantInsert, useTenantUpdate, useTenantDelete } from '../hooks/useTenantQuery';
import { useTenant } from '../contexts/TenantContext';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import MaskedInput from '../components/ui/MaskedInput';
import Modal from '../components/ui/Modal';

interface Servico {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  category?: string;
  active: boolean;
  color: string;
  created_at: string;
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
    category: '',
    active: true,
    color: '#10B981'
  });
  const [formLoading, setFormLoading] = useState(false);

  const {
    data: servicos,
    loading,
    error,
    refetch
  } = useTenantQuery<Servico>({
    table: 'servicos',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
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
      category: '',
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
      category: servico.category || '',
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
      console.error('Erro ao salvar serviço:', error);
      alert('Erro ao salvar serviço: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o serviço "${name}"?`)) {
      return;
    }

    try {
      await deleteRecord('servicos', id);
      await refetch();
    } catch (error: any) {
      console.error('Erro ao excluir serviço:', error);
      alert('Erro ao excluir serviço: ' + error.message);
    }
  };

  const handleToggleActive = async (servico: Servico) => {
    try {
      await update('servicos', servico.id, {
        active: !servico.active
      });
      await refetch();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status: ' + error.message);
    }
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (!price) return 'Preço não definido';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Serviços</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando serviços...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Serviços</h1>
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Serviços</h1>
            <p className="text-gray-600 mt-2">
              {servicos.length} serviços cadastrados
            </p>
          </div>
          <Button onClick={openNewForm} icon="add">
            Novo Serviço
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {servicos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-green-600 text-2xl">room_service</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum serviço encontrado</h3>
              <p className="text-gray-600 mb-6">
                Comece adicionando o primeiro serviço do seu negócio.
              </p>
              <Button onClick={openNewForm} icon="add">
                Adicionar Serviço
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {servicos.map((servico) => (
                <div
                  key={servico.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: servico.color }}
                      >
                        <span className="material-icons-round text-lg">room_service</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{servico.name}</h3>
                        {servico.category && (
                          <p className="text-sm text-gray-500">{servico.category}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(servico)}
                        className={`p-1 rounded transition-colors ${
                          servico.active
                            ? 'text-green-600 hover:bg-green-100'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={servico.active ? 'Desativar' : 'Ativar'}
                      >
                        <span className="material-icons-round text-lg">
                          {servico.active ? 'check_circle' : 'cancel'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {servico.description && (
                    <p className="text-sm text-gray-600 mb-4">{servico.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Duração:</span>
                      <span className="font-medium">{formatDuration(servico.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Preço:</span>
                      <span className="font-medium">{formatPrice(servico.price)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="edit"
                      onClick={() => openEditForm(servico)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon="delete"
                      onClick={() => handleDelete(servico.id, servico.name)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal
          isOpen={showNewForm}
          onClose={closeForm}
          title={editingServico ? 'Editar Serviço' : 'Novo Serviço'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nome do Serviço"
              icon="room_service"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Nome do serviço"
            />

            <Input
              label="Categoria"
              icon="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ex: Consulta, Procedimento, Exame, etc."
            />

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição sobre o serviço..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Duração (minutos)"
                type="number"
                icon="schedule"
                value={formData.duration_minutes.toString()}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                required
                min="1"
                placeholder="60"
              />

              <MaskedInput
                label="Preço"
                icon="attach_money"
                maskType="money"
                value={formData.price}
                onChange={(maskedValue) => setFormData({ ...formData, price: maskedValue })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
                Cor (para agenda)
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Serviço ativo
              </label>
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="button" variant="secondary" onClick={closeForm}>
                Cancelar
              </Button>
              <Button type="submit" loading={formLoading}>
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