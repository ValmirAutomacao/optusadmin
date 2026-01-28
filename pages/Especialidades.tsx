import React, { useState } from 'react';
import { useTenantQuery, useTenantInsert, useTenantUpdate, useTenantDelete } from '../hooks/useTenantQuery';
import { useTenant } from '../contexts/TenantContext';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

interface Specialty {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    active: boolean;
    created_at: string;
}

const Especialidades: React.FC = () => {
    const { currentTenant } = useTenant();
    const [showNewForm, setShowNewForm] = useState(false);
    const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        active: true
    });
    const [formLoading, setFormLoading] = useState(false);

    const {
        data: specialties,
        loading,
        error,
        refetch
    } = useTenantQuery<Specialty>({
        table: 'specialties',
        select: '*',
        orderBy: { column: 'name', ascending: true }
    });

    const { insert } = useTenantInsert();
    const { update } = useTenantUpdate();
    const { deleteRecord } = useTenantDelete();

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            active: true
        });
        setEditingSpecialty(null);
    };

    const openNewForm = () => {
        resetForm();
        setShowNewForm(true);
    };

    const openEditForm = (specialty: Specialty) => {
        setFormData({
            name: specialty.name,
            description: specialty.description || '',
            active: specialty.active
        });
        setEditingSpecialty(specialty);
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
            if (editingSpecialty) {
                await update('specialties', editingSpecialty.id, formData);
            } else {
                await insert('specialties', formData);
            }

            await refetch();
            closeForm();
        } catch (error: any) {
            console.error('Erro ao salvar especialidade:', error);
            alert('Erro ao salvar especialidade: ' + error.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir a especialidade "${name}"? Isso pode afetar médicos e serviços vinculados.`)) {
            return;
        }

        try {
            await deleteRecord('specialties', id);
            await refetch();
        } catch (error: any) {
            console.error('Erro ao excluir especialidade:', error);
            alert('Erro ao excluir especialidade: ' + error.message);
        }
    };

    const handleToggleActive = async (specialty: Specialty) => {
        try {
            await update('specialties', specialty.id, {
                active: !specialty.active
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Especialidades</h1>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Carregando especialidades...</p>
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
                        <h1 className="text-3xl font-bold text-gray-900">Especialidades</h1>
                        <p className="text-gray-600 mt-2">
                            {specialties.length} especialidades cadastradas
                        </p>
                    </div>
                    <Button onClick={openNewForm} icon="add">
                        Nova Especialidade
                    </Button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {specialties.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons-round text-blue-600 text-2xl">category</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma especialidade encontrada</h3>
                            <p className="text-gray-600 mb-6">
                                Cadastre as especialidades dos seus profissionais para organizar o agendamento.
                            </p>
                            <Button onClick={openNewForm} icon="add">
                                Adicionar Especialidade
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {specialties.map((specialty) => (
                                <div
                                    key={specialty.id}
                                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <span className="material-icons-round">category</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{specialty.name}</h3>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleActive(specialty)}
                                            className={`p-1 rounded transition-colors ${specialty.active
                                                    ? 'text-green-600 hover:bg-green-100'
                                                    : 'text-gray-400 hover:bg-gray-100'
                                                }`}
                                            title={specialty.active ? 'Desativar' : 'Ativar'}
                                        >
                                            <span className="material-icons-round text-lg">
                                                {specialty.active ? 'check_circle' : 'cancel'}
                                            </span>
                                        </button>
                                    </div>

                                    {specialty.description && (
                                        <p className="text-sm text-gray-600 mb-6 line-clamp-2">{specialty.description}</p>
                                    )}

                                    <div className="mt-auto flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            icon="edit"
                                            onClick={() => openEditForm(specialty)}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            icon="delete"
                                            onClick={() => handleDelete(specialty.id, specialty.name)}
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
                    title={editingSpecialty ? 'Editar Especialidade' : 'Nova Especialidade'}
                    size="md"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Nome da Especialidade"
                            icon="label"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Ex: Cardiologia, Nutrição, etc."
                        />

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
                                Descrição
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Opcional: Descreva o que esta especialidade trata..."
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
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
                                Especialidade ativa
                            </label>
                        </div>

                        <div className="flex gap-3 pt-6">
                            <Button type="button" variant="secondary" onClick={closeForm}>
                                Cancelar
                            </Button>
                            <Button type="submit" loading={formLoading}>
                                {editingSpecialty ? 'Salvar Alterações' : 'Criar Especialidade'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
};

export default Especialidades;
