import React, { useState } from 'react';
import { useTenantInsert } from '../hooks/useTenantQuery';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (userData: any) => void;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'visualizador',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const { insert } = useTenantInsert();

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'visualizador',
      phone: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = {
        ...formData,
        status: 'pending' // Usuários começam como pendentes até ativação
      };

      await insert('users', userData);
      await onSave?.(userData);
      handleClose();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.email;

  const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'secretaria', label: 'Secretária' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'profissional', label: 'Profissional' },
    { value: 'visualizador', label: 'Visualizador' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Novo Usuário" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome */}
        <Input
          label="Nome Completo"
          icon="person"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nome do usuário"
          required
        />

        {/* Email */}
        <Input
          label="E-mail"
          type="email"
          icon="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@exemplo.com"
          required
        />

        {/* Telefone */}
        <Input
          label="Telefone"
          icon="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="(11) 99999-9999"
        />

        {/* Role */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
            Função *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Informações sobre o convite */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            <span className="material-icons-round text-sm mr-1">info</span>
            Informações do Convite
          </h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p>• O usuário receberá um convite por e-mail</p>
            <p>• Ele precisará criar uma senha no primeiro acesso</p>
            <p>• O status será "Pendente" até a ativação da conta</p>
          </div>
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
            icon="send"
          >
            Enviar Convite
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;