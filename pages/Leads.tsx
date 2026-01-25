import React, { useState } from 'react';
import { useTenantQuery, useTenantInsert, useTenantUpdate, useTenantDelete } from '../hooks/useTenantQuery';
import { useTenant } from '../contexts/TenantContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Tabs from '../components/ui/Tabs'; // Assumindo que existe ou criaremos parecido
import ConversationPanel from '../components/ConversationPanel';

interface Lead {
    id: string;
    phone: string;
    name: string | null;
    source: string;
    status: 'novo' | 'em_contato' | 'qualificado' | 'convertido' | 'perdido';
    notes: string | null;
    tags: string[] | null;
    first_contact_at: string;
    last_contact_at: string;
    created_at: string;
}

const Leads: React.FC = () => {
    const { currentTenant } = useTenant();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('contatos');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const {
        data: leads,
        loading,
        error,
        refetch
    } = useTenantQuery<Lead>({
        table: 'leads',
        orderBy: { column: 'last_contact_at', ascending: false }
    });

    const { update } = useTenantUpdate();
    const { deleteRecord } = useTenantDelete();

    const filteredLeads = leads.filter(lead =>
    (lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm))
    );

    const handleUpdateStatus = async (id: string, status: Lead['status']) => {
        try {
            await update('leads', id, { status });
            await refetch();
        } catch (err) {
            console.error('Erro ao atualizar status do lead:', err);
        }
    };

    const handleSaveNotes = async (id: string, notes: string) => {
        try {
            await update('leads', id, { notes });
            await refetch();
            setShowEditModal(false);
        } catch (err) {
            console.error('Erro ao salvar notas:', err);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestão de Leads</h1>
                        <p className="text-gray-600 mt-2">Acompanhe e interaja com potenciais clientes</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('contatos')}
                            className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'contatos'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Contatos / Leads
                        </button>
                        <button
                            onClick={() => setActiveTab('mensagens')}
                            className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'mensagens'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Mensagens (Whatsapp)
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'contatos' ? (
                            <div className="space-y-6">
                                <div className="flex gap-4 mb-6">
                                    <div className="flex-1">
                                        <Input
                                            label=""
                                            placeholder="Buscar por nome ou telefone..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            icon="search"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                                <th className="pb-4 px-4 text-center w-16">Avatar</th>
                                                <th className="pb-4 px-4">Lead</th>
                                                <th className="pb-4 px-4 text-center">Status</th>
                                                <th className="pb-4 px-4">Último Contato</th>
                                                <th className="pb-4 px-4 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredLeads.map((lead) => (
                                                <tr key={lead.id} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mx-auto">
                                                            {lead.name?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="font-bold text-gray-900">{lead.name || 'Lead s/ nome'}</div>
                                                        <div className="text-xs text-gray-400 font-medium">{lead.phone}</div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <select
                                                            value={lead.status}
                                                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value as any)}
                                                            className={`text-xs font-bold px-3 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500/20 ${lead.status === 'novo' ? 'bg-blue-100 text-blue-700' :
                                                                lead.status === 'em_contato' ? 'bg-yellow-100 text-yellow-700' :
                                                                    lead.status === 'qualificado' ? 'bg-purple-100 text-purple-700' :
                                                                        lead.status === 'convertido' ? 'bg-green-100 text-green-700' :
                                                                            'bg-red-100 text-red-700'
                                                                }`}
                                                        >
                                                            <option value="novo">Novo</option>
                                                            <option value="em_contato">Em Contato</option>
                                                            <option value="qualificado">Qualificado</option>
                                                            <option value="convertido">Convertido</option>
                                                            <option value="perdido">Perdido</option>
                                                        </select>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-gray-500 font-medium">
                                                        {new Date(lead.last_contact_at).toLocaleString('pt-BR')}
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm(`Deseja converter o lead "${lead.name}" em um cliente fixo?`)) {
                                                                        handleUpdateStatus(lead.id, 'convertido');
                                                                        navigate('/clientes', { state: { newClient: { name: lead.name, phone: lead.phone } } });
                                                                    }
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                title="Converter em Cliente"
                                                            >
                                                                <span className="material-icons-round text-lg">person_add</span>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingLead(lead);
                                                                    setShowEditModal(true);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                title="Editar Notas"
                                                            >
                                                                <span className="material-icons-round text-lg">note_add</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setActiveTab('mensagens')}
                                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                title="Ver Mensagens"
                                                            >
                                                                <span className="material-icons-round text-lg">chat</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4 mb-6">
                                    <span className="material-icons-round text-blue-600">info</span>
                                    <p className="text-sm text-blue-700 font-medium">
                                        Aqui você pode acompanhar as conversas em tempo real com seus leads.
                                    </p>
                                </div>
                                <ConversationPanel conversations={[]} loading={false} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Editar Notas */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title={`Notas do Lead: ${editingLead?.name || editingLead?.phone}`}
            >
                <div className="space-y-4">
                    <textarea
                        className="w-full h-48 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none font-medium text-gray-700"
                        placeholder="Adicione observações, histórico de follow-up, etc..."
                        defaultValue={editingLead?.notes || ''}
                        id="lead-notes"
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
                        <Button onClick={() => {
                            const notes = (document.getElementById('lead-notes') as HTMLTextAreaElement).value;
                            if (editingLead) handleSaveNotes(editingLead.id, notes);
                        }}>Salvar Notas</Button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default Leads;
