import React, { useState } from 'react';
import { useTenantQuery, useTenantInsert, useTenantUpdate, useTenantDelete } from '../hooks/useTenantQuery';
import { useTenant } from '../contexts/TenantContext';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import MaskedInput from '../components/ui/MaskedInput';
import Modal from '../components/ui/Modal';
import { validateEmail, validatePhone } from '../hooks/useMask';

interface Profissional {
  id: string;
  name: string;
  specialty: string;
  description?: string;
  phone?: string;
  email?: string;
  active: boolean;
  color: string;
  created_at: string;
}

const Profissionais: React.FC = () => {
  const { currentTenant } = useTenant();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingProfissional, setEditingProfissional] = useState<Profissional | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    description: '',
    phone: '',
    email: '',
    active: true,
    color: '#3B82F6'
  });
  const [formLoading, setFormLoading] = useState(false);

  const {
    data: profissionais,
    loading,
    error,
    refetch
  } = useTenantQuery<Profissional>({
    table: 'profissionais',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { insert } = useTenantInsert();
  const { update } = useTenantUpdate();
  const { deleteRecord } = useTenantDelete();

  const resetForm = () => {
    setFormData({
      name: '',
      specialty: '',
      description: '',
      phone: '',
      email: '',
      active: true,
      color: '#3B82F6'
    });
    setEditingProfissional(null);
  };

  const openNewForm = () => {
    resetForm();
    setShowNewForm(true);
  };

  const openEditForm = (profissional: Profissional) => {
    setFormData({
      name: profissional.name,
      specialty: profissional.specialty,
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
      if (editingProfissional) {
        await update('profissionais', editingProfissional.id, formData);
      } else {
        await insert('profissionais', formData);
      }

      await refetch();
      closeForm();
    } catch (error: any) {
      console.error('Erro ao salvar profissional:', error);
      alert('Erro ao salvar profissional: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o profissional "${name}"?`)) {
      return;
    }

    try {
      await deleteRecord('profissionais', id);
      await refetch();
    } catch (error: any) {
      console.error('Erro ao excluir profissional:', error);
      alert('Erro ao excluir profissional: ' + error.message);
    }
  };

  const handleToggleActive = async (profissional: Profissional) => {
    try {
      await update('profissionais', profissional.id, {
        active: !profissional.active
      });
      await refetch();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Profissionais</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando profissionais...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Profissionais</h1>
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
            <h1 className="text-3xl font-bold text-gray-900">Profissionais</h1>
            <p className="text-gray-600 mt-2">
              {profissionais.length} profissionais cadastrados
            </p>
          </div>
          <Button onClick={openNewForm} icon="add">
            Novo Profissional
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {profissionais.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-purple-600 text-2xl">medical_services</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum profissional encontrado</h3>
              <p className="text-gray-600 mb-6">
                Comece adicionando o primeiro profissional da sua equipe.
              </p>
              <Button onClick={openNewForm} icon="add">
                Adicionar Profissional
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {profissionais.map((profissional) => (
                <div
                  key={profissional.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: profissional.color }}
                      >
                        {profissional.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{profissional.name}</h3>
                        <p className="text-sm text-gray-500">{profissional.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(profissional)}
                        className={`p-1 rounded transition-colors ${
                          profissional.active
                            ? 'text-green-600 hover:bg-green-100'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={profissional.active ? 'Desativar' : 'Ativar'}
                      >
                        <span className="material-icons-round text-lg">
                          {profissional.active ? 'check_circle' : 'cancel'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {profissional.description && (
                    <p className="text-sm text-gray-600 mb-4">{profissional.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    {profissional.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="material-icons-round text-lg">email</span>
                        {profissional.email}
                      </div>
                    )}
                    {profissional.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="material-icons-round text-lg">phone</span>
                        {profissional.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="edit"
                      onClick={() => openEditForm(profissional)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon="delete"
                      onClick={() => handleDelete(profissional.id, profissional.name)}
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
          title={editingProfissional ? 'Editar Profissional' : 'Novo Profissional'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nome"
              icon="person"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Nome completo"
            />

            <Input
              label="Especialidade"
              icon="medical_services"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              required
              placeholder="Ex: Cardiologista, Fisioterapeuta, etc."
            />

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição sobre o profissional..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                icon="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />

              <MaskedInput
                label="Telefone"
                icon="phone"
                maskType="phone"
                value={formData.phone}
                onChange={(maskedValue) => setFormData({ ...formData, phone: maskedValue })}
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
                Profissional ativo
              </label>
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="button" variant="secondary" onClick={closeForm}>
                Cancelar
              </Button>
              <Button type="submit" loading={formLoading}>
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