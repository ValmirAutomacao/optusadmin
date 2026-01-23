import React, { useState } from 'react';
import { useTenantQuery, useTenantInsert } from '../hooks/useTenantQuery';
import { useTenant } from '../contexts/TenantContext';
import Layout from '../components/Layout';
import UserModal from '../components/UserModal';
import Button from '../components/ui/Button';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'secretaria' | 'financeiro' | 'profissional' | 'visualizador';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

const Usuarios: React.FC = () => {
  const { currentTenant } = useTenant();
  const [showNewUserForm, setShowNewUserForm] = useState(false);

  const {
    data: users,
    loading,
    error,
    refetch
  } = useTenantQuery<User>({
    table: 'users',
    select: 'id, name, email, role, status, created_at',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { insert } = useTenantInsert();

  const handleSaveUser = async (userData: any) => {
    try {
      await insert('users', userData);
      await refetch();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      throw error;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      secretaria: 'Secretária',
      financeiro: 'Financeiro',
      profissional: 'Profissional',
      visualizador: 'Visualizador'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Usuários</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando usuários...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Usuários</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-red-600 text-2xl">error</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar novamente
              </button>
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
            <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
            <p className="text-gray-600 mt-2">
              {users.length} usuários cadastrados
            </p>
          </div>
          <Button
            onClick={() => setShowNewUserForm(true)}
            icon="add"
          >
            Novo Usuário
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-gray-400 text-2xl">people</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum usuário encontrado</h3>
              <p className="text-gray-600 mb-6">
                Comece adicionando o primeiro usuário da sua equipe.
              </p>
              <Button
                onClick={() => setShowNewUserForm(true)}
                icon="add"
              >
                Adicionar Usuário
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Nome</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Role</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Criado em</th>
                    <th className="text-right py-3 px-6 font-medium text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{user.email}</td>
                      <td className="py-4 px-6">
                        <span className="text-gray-900 font-medium">
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status === 'active' ? 'Ativo' : user.status === 'inactive' ? 'Inativo' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 justify-end">
                          <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <span className="material-icons-round text-lg">edit</span>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                            <span className="material-icons-round text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <UserModal
          isOpen={showNewUserForm}
          onClose={() => setShowNewUserForm(false)}
          onSave={handleSaveUser}
        />
      </div>
    </Layout>
  );
};

export default Usuarios;