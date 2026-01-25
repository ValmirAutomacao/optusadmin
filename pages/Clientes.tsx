import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTenantQuery, useTenantInsert, useTenantUpdate, useTenantDelete } from '../hooks/useTenantQuery';
import { useTenant } from '../contexts/TenantContext';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import MaskedInput from '../components/ui/MaskedInput';
import Modal from '../components/ui/Modal';
import { validateEmail, validatePhone } from '../hooks/useMask';

interface Cliente {
  id: string;
  name: string;
  email?: string;
  phone: string;
  birth_date?: string;
  address?: any;
  notes?: string;
  tags?: string[];
  whatsapp_consent: boolean;
  email_consent: boolean;
  lgpd_consent: boolean;
  lgpd_consent_date?: string;
  score: number;
  last_contact?: string;
  created_at: string;
}

const Clientes: React.FC = () => {
  const { currentTenant } = useTenant();
  const location = useLocation();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    notes: '',
    whatsapp_consent: false,
    email_consent: false,
    lgpd_consent: false
  });

  // Capturar dados de um novo lead sendo convertido
  React.useEffect(() => {
    const state = location.state as any;
    if (state?.newClient) {
      setFormData(prev => ({
        ...prev,
        name: state.newClient.name || '',
        phone: state.newClient.phone || '',
        notes: 'Lead convertido do WhatsApp'
      }));
      setShowNewForm(true);
      // Limpar estado para não reabrir ao atualizar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  const {
    data: clientes,
    loading,
    error,
    refetch
  } = useTenantQuery<Cliente>({
    table: 'clientes',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { insert } = useTenantInsert();
  const { update } = useTenantUpdate();
  const { deleteRecord } = useTenantDelete();

  const filteredClientes = clientes.filter(cliente =>
    cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.phone.includes(searchTerm)
  );

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      birth_date: '',
      notes: '',
      whatsapp_consent: false,
      email_consent: false,
      lgpd_consent: false
    });
    setFormErrors({});
    setEditingCliente(null);
  };

  const openNewForm = () => {
    resetForm();
    setShowNewForm(true);
  };

  const openEditForm = (cliente: Cliente) => {
    setFormData({
      name: cliente.name,
      email: cliente.email || '',
      phone: cliente.phone,
      birth_date: cliente.birth_date || '',
      notes: cliente.notes || '',
      whatsapp_consent: cliente.whatsapp_consent,
      email_consent: cliente.email_consent,
      lgpd_consent: cliente.lgpd_consent
    });
    setEditingCliente(cliente);
    setShowNewForm(true);
  };

  const closeForm = () => {
    setShowNewForm(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Formato de telefone inválido';
    }

    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Email inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormLoading(true);

    try {
      const submitData = {
        ...formData,
        lgpd_consent_date: formData.lgpd_consent ? new Date().toISOString() : null
      };

      if (editingCliente) {
        await update('clientes', editingCliente.id, submitData);
      } else {
        await insert('clientes', submitData);
      }

      await refetch();
      closeForm();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${name}"?`)) {
      return;
    }

    try {
      await deleteRecord('clientes', id);
      await refetch();
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente: ' + error.message);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Clientes</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando clientes...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Clientes</h1>
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
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-2">
              {filteredClientes.length} de {clientes.length} clientes
            </p>
          </div>
          <Button onClick={openNewForm} icon="add">
            Novo Cliente
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-4">
          <Input
            label=""
            icon="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, email ou telefone..."
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredClientes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-blue-600 text-2xl">people</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {clientes.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
              </h3>
              <p className="text-gray-600 mb-6">
                {clientes.length === 0
                  ? 'Comece adicionando o primeiro cliente.'
                  : 'Tente ajustar os termos de busca.'}
              </p>
              {clientes.length === 0 && (
                <Button onClick={openNewForm} icon="add">
                  Adicionar Cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {cliente.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{cliente.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(cliente.score)}`}>
                            Score: {cliente.score}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {cliente.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="material-icons-round text-lg">email</span>
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="material-icons-round text-lg">phone</span>
                      {cliente.phone}
                    </div>
                    {cliente.birth_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="material-icons-round text-lg">cake</span>
                        {formatDate(cliente.birth_date)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {cliente.whatsapp_consent && (
                      <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center" title="WhatsApp autorizado">
                        <span className="material-icons-round text-green-600 text-sm">check</span>
                      </span>
                    )}
                    {cliente.email_consent && (
                      <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center" title="Email autorizado">
                        <span className="material-icons-round text-blue-600 text-sm">email</span>
                      </span>
                    )}
                    {cliente.lgpd_consent && (
                      <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center" title="LGPD consentimento">
                        <span className="material-icons-round text-purple-600 text-sm">verified_user</span>
                      </span>
                    )}
                  </div>

                  {cliente.notes && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cliente.notes}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="edit"
                      onClick={() => openEditForm(cliente)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon="delete"
                      onClick={() => handleDelete(cliente.id, cliente.name)}
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
          title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nome Completo"
              icon="person"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Nome completo do cliente"
              error={formErrors.name}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                icon="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                error={formErrors.email}
              />

              <MaskedInput
                label="Telefone"
                icon="phone"
                maskType="phone"
                value={formData.phone}
                onChange={(maskedValue, unmaskedValue) => setFormData({ ...formData, phone: maskedValue })}
                required
                error={formErrors.phone}
              />
            </div>

            <Input
              label="Data de Nascimento"
              type="date"
              icon="cake"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            />

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o cliente..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                Consentimentos
              </h4>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="whatsapp_consent"
                    checked={formData.whatsapp_consent}
                    onChange={(e) => setFormData({ ...formData, whatsapp_consent: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="whatsapp_consent" className="text-sm font-medium text-gray-700">
                    Autoriza contato via WhatsApp
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="email_consent"
                    checked={formData.email_consent}
                    onChange={(e) => setFormData({ ...formData, email_consent: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="email_consent" className="text-sm font-medium text-gray-700">
                    Autoriza contato via Email
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="lgpd_consent"
                    checked={formData.lgpd_consent}
                    onChange={(e) => setFormData({ ...formData, lgpd_consent: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="lgpd_consent" className="text-sm font-medium text-gray-700">
                    Consentimento LGPD para tratamento de dados
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="button" variant="secondary" onClick={closeForm}>
                Cancelar
              </Button>
              <Button type="submit" loading={formLoading}>
                {editingCliente ? 'Salvar Alterações' : 'Criar Cliente'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Clientes;