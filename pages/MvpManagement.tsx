/**
 * Página de Gestão MVP
 * Acesso exclusivo do developer/owner
 */

import React, { useState, useEffect } from 'react';
import {
    fetchCnpjData,
    isValidCnpj,
    isValidCpf,
    formatCnpj,
    formatCpf,
    cleanCnpj,
    CnpjData
} from '../lib/cnpjService';
import {
    sendManagerOnboardingEmail,
    sendCollaboratorOnboardingEmail,
    sendProfessionalOnboardingEmail
} from '../lib/onboardingService';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ChatbotConfigPanel from '../components/ChatbotConfigPanel';
import { SystemPromptsPanel } from '../components/SystemPromptsPanel';
import { useSystemPrompts } from '../lib/systemPrompts';
import { useAIAgents } from '../lib/aiAgents';

interface Tenant {
    id: string;
    name: string;
    document: string;
    document_type: 'cnpj' | 'cpf';
    segment: string;
    manager_name: string;
    manager_email: string;
    onboarding_completed: boolean;
    onboarding_sent_at: string | null;
    created_at: string;
    address: {
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        cidade: string;
        uf: string;
        cep: string;
    };
}

interface Collaborator {
    id: string;
    tenant_id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    onboarding_completed: boolean;
    tenant?: { name: string };
}

interface Professional {
    id: string;
    tenant_id: string;
    name: string;
    email: string;
    specialty: string;
    status: string;
    onboarding_completed: boolean;
    tenant?: { name: string };
}

type TabType = 'clientes' | 'chatbot';

export default function MvpManagement() {
    const [activeTab, setActiveTab] = useState<TabType>('clientes');
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const { prompts, activePrompt, loading: loadingPrompts } = useSystemPrompts();
    const { agents, loadAgents } = useAIAgents();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);

        // Carregar tenants
        const { data: tenantsData } = await supabase
            .from('tenants')
            .select('*')
            .order('created_at', { ascending: false });

        setTenants(tenantsData || []);
        setLoading(false);
    }

    const tabs = [
        { id: 'clientes' as const, label: 'Clientes', icon: '🏢', count: tenants.length },
        { id: 'chatbot' as const, label: 'Chatbot IA', icon: '🤖', count: null },
    ];

    return (
        <Layout isMobile={isMobile}>
            <div className="p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Gestão MVP</h1>
                    <p className="text-gray-600">Área exclusiva do desenvolvedor</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {tab.count !== null && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    {activeTab === 'clientes' && (
                        <ClientesTab
                            tenants={tenants}
                            loading={loading}
                            onRefresh={loadData}
                            showForm={showForm}
                            setShowForm={setShowForm}
                        />
                    )}
                    {activeTab === 'chatbot' && (
                            <ChatbotConfigPanel
                                instanceId="global"
                                instanceName="Configuração Global"
                                isGlobal={true}
                            />

                            <div className="pt-8 border-t">
                                <SystemPromptsPanel
                                    prompts={prompts}
                                    activePrompt={activePrompt}
                                    loading={loadingPrompts}
                                />
                            </div>
                        </div>
                    )}
            </div>
        </div>
        </Layout >
    );
}

// ==================== CLIENTES TAB ====================
function ClientesTab({
    tenants,
    loading,
    onRefresh,
    showForm,
    setShowForm
}: {
    tenants: Tenant[];
    loading: boolean;
    onRefresh: () => void;
    showForm: boolean;
    setShowForm: (v: boolean) => void;
}) {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Clientes Cadastrados</h2>
                <Button
                    icon="add"
                    onClick={() => setShowForm(true)}
                >
                    Novo Cliente
                </Button>
            </div>

            {showForm && (
                <TenantForm
                    onClose={() => setShowForm(false)}
                    onSaved={() => { setShowForm(false); onRefresh(); }}
                />
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500">Carregando...</div>
            ) : tenants.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl">🏢</span>
                    <p className="mt-2">Nenhum cliente cadastrado</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tenants.map(tenant => (
                        <TenantCard key={tenant.id} tenant={tenant} onRefresh={onRefresh} />
                    ))}
                </div>
            )}
        </div>
    );
}

function TenantCard({ tenant, onRefresh }: { tenant: Tenant; onRefresh: () => void }) {
    const [resending, setResending] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);

    async function resendOnboarding() {
        if (!tenant.manager_email) return;

        setResending(true);

        const { data } = await supabase
            .from('tenants')
            .select('onboarding_token')
            .eq('id', tenant.id)
            .single();

        if (data?.onboarding_token) {
            await sendManagerOnboardingEmail({
                tenantName: tenant.name,
                managerName: tenant.manager_name,
                managerEmail: tenant.manager_email,
                token: data.onboarding_token
            });
        }

        setResending(false);
        onRefresh();
    }

    async function handleDelete() {
        if (!confirm(`Tem certeza que deseja excluir a empresa "${tenant.name}"?\n\nEsta ação não pode ser desfeita.`)) {
            return;
        }

        setDeleting(true);

        // Primeiro, limpar dados relacionados
        await supabase.from('users').delete().eq('tenant_id', tenant.id);
        await supabase.from('professionals').delete().eq('tenant_id', tenant.id);
        await supabase.from('servicos').delete().eq('tenant_id', tenant.id);
        await supabase.from('clientes').delete().eq('tenant_id', tenant.id);

        // Então, excluir o tenant
        const { error } = await supabase
            .from('tenants')
            .delete()
            .eq('id', tenant.id);

        if (error) {
            alert('Erro ao excluir: ' + error.message);
        }

        setDeleting(false);
        onRefresh();
    }

    if (showEditForm) {
        return (
            <TenantEditForm
                tenant={tenant}
                onClose={() => setShowEditForm(false)}
                onSaved={() => { setShowEditForm(false); onRefresh(); }}
            />
        );
    }

    return (
        <div className="border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-lg">{tenant.name}</h3>
                    <p className="text-sm text-gray-500">
                        {tenant.document_type?.toUpperCase()}: {
                            tenant.document_type === 'cnpj'
                                ? formatCnpj(tenant.document || '')
                                : formatCpf(tenant.document || '')
                        }
                    </p>
                    {tenant.segment && (
                        <p className="text-sm text-gray-500">Segmento: {tenant.segment}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {tenant.onboarding_completed ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            ✅ Ativo
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                            ⏳ Aguardando
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    <p>👤 {tenant.manager_name}</p>
                    <p>📧 {tenant.manager_email}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowEditForm(true)}
                    >
                        ✏️ Editar
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        loading={deleting}
                        onClick={handleDelete}
                        className="!text-red-600 hover:!bg-red-50"
                    >
                        🗑️ Excluir
                    </Button>
                    {!tenant.onboarding_completed && (
                        <Button
                            variant="secondary"
                            size="sm"
                            loading={resending}
                            onClick={resendOnboarding}
                        >
                            📨 Reenviar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Formulário de edição de Tenant
function TenantEditForm({ tenant, onClose, onSaved }: { tenant: Tenant; onClose: () => void; onSaved: () => void }) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: tenant.name || '',
        segment: tenant.segment || '',
        managerName: tenant.manager_name || '',
        managerEmail: tenant.manager_email || '',
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.name || !formData.managerName || !formData.managerEmail) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        setSaving(true);

        const { error } = await supabase
            .from('tenants')
            .update({
                name: formData.name,
                segment: formData.segment,
                manager_name: formData.managerName,
                manager_email: formData.managerEmail,
            })
            .eq('id', tenant.id);

        if (error) {
            alert('Erro ao atualizar: ' + error.message);
            setSaving(false);
            return;
        }

        setSaving(false);
        onSaved();
    }

    return (
        <div className="border-2 border-indigo-300 rounded-xl p-4 bg-indigo-50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Editar: {tenant.name}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome da Empresa *"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                    label="Segmento"
                    value={formData.segment}
                    onChange={(e) => setFormData(prev => ({ ...prev, segment: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Nome do Gestor *"
                        value={formData.managerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                    />
                    <Input
                        label="Email do Gestor *"
                        type="email"
                        value={formData.managerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, managerEmail: e.target.value }))}
                    />
                </div>
                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={saving}>
                        💾 Salvar
                    </Button>
                </div>
            </form>
        </div>
    );
}

function TenantForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const [documentType, setDocumentType] = useState<'cnpj' | 'cpf'>('cnpj');
    const [document, setDocument] = useState('');
    const [loadingCnpj, setLoadingCnpj] = useState(false);
    const [saving, setSaving] = useState(false);
    const [cnpjData, setCnpjData] = useState<CnpjData | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        segment: '',
        managerName: '',
        managerEmail: '',
        address: {
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            uf: '',
            cep: ''
        }
    });

    async function handleCnpjSearch() {
        if (!isValidCnpj(document)) {
            alert('CNPJ inválido');
            return;
        }

        setLoadingCnpj(true);
        try {
            const data = await fetchCnpjData(document);
            setCnpjData(data);
            setFormData(prev => ({
                ...prev,
                name: data.razaoSocial,
                segment: data.atividadePrincipal,
                address: data.endereco
            }));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Erro ao buscar CNPJ');
        }
        setLoadingCnpj(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.name || !formData.managerName || !formData.managerEmail) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        setSaving(true);

        // Gerar domain a partir do nome (slug)
        const domain = formData.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Criar tenant
        const { data: tenant, error } = await supabase
            .from('tenants')
            .insert({
                name: formData.name,
                domain: domain,
                document: cleanCnpj(document),
                document_type: documentType,
                segment: formData.segment,
                manager_name: formData.managerName,
                manager_email: formData.managerEmail,
                address: formData.address,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            alert('Erro ao criar cliente: ' + error.message);
            setSaving(false);
            return;
        }

        // Enviar email de onboarding
        if (tenant) {
            await sendManagerOnboardingEmail({
                tenantName: formData.name,
                managerName: formData.managerName,
                managerEmail: formData.managerEmail,
                token: tenant.onboarding_token
            });
        }

        setSaving(false);
        onSaved();
    }

    return (
        <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Novo Cliente</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de documento */}
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="docType"
                            checked={documentType === 'cnpj'}
                            onChange={() => setDocumentType('cnpj')}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <span>CNPJ</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="docType"
                            checked={documentType === 'cpf'}
                            onChange={() => setDocumentType('cpf')}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <span>CPF</span>
                    </label>
                </div>

                {/* Documento + Busca */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            label={documentType.toUpperCase()}
                            value={document}
                            onChange={(e) => setDocument(e.target.value)}
                            placeholder={documentType === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                        />
                    </div>
                    {documentType === 'cnpj' && (
                        <div className="pt-6">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleCnpjSearch}
                                loading={loadingCnpj}
                            >
                                🔍 Buscar
                            </Button>
                        </div>
                    )}
                </div>

                {/* Dados da empresa */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Nome/Razão Social *"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome da empresa"
                    />
                    <Input
                        label="Segmento/Atividade"
                        value={formData.segment}
                        onChange={(e) => setFormData(prev => ({ ...prev, segment: e.target.value }))}
                        placeholder="Ex: Clínica odontológica"
                    />
                </div>

                {/* Endereço */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <Input
                            label="Logradouro"
                            value={formData.address.logradouro}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                address: { ...prev.address, logradouro: e.target.value }
                            }))}
                        />
                    </div>
                    <Input
                        label="Número"
                        value={formData.address.numero}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, numero: e.target.value }
                        }))}
                    />
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <Input
                        label="Bairro"
                        value={formData.address.bairro}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, bairro: e.target.value }
                        }))}
                    />
                    <Input
                        label="Cidade"
                        value={formData.address.cidade}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, cidade: e.target.value }
                        }))}
                    />
                    <Input
                        label="UF"
                        value={formData.address.uf}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, uf: e.target.value }
                        }))}
                    />
                    <Input
                        label="CEP"
                        value={formData.address.cep}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, cep: e.target.value }
                        }))}
                    />
                </div>

                {/* Gestor */}
                <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-3">👤 Dados do Gestor</p>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Nome do Gestor *"
                            value={formData.managerName}
                            onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                            placeholder="Nome completo"
                        />
                        <Input
                            label="Email do Gestor *"
                            type="email"
                            value={formData.managerEmail}
                            onChange={(e) => setFormData(prev => ({ ...prev, managerEmail: e.target.value }))}
                            placeholder="email@empresa.com"
                        />
                    </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={saving}>
                        💾 Salvar e Enviar Email
                    </Button>
                </div>
            </form>
        </div>
    );
}

// ==================== COLABORADORES TAB ====================
function ColaboradoresTab({
    collaborators,
    tenants,
    loading,
    onRefresh
}: {
    collaborators: Collaborator[];
    tenants: Tenant[];
    loading: boolean;
    onRefresh: () => void;
}) {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        tenant_id: '',
        name: '',
        email: '',
        role: ''
    });
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.tenant_id || !formData.name || !formData.email) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        setSaving(true);

        const { data, error } = await supabase
            .from('collaborators')
            .insert({
                tenant_id: formData.tenant_id,
                name: formData.name,
                email: formData.email,
                role: formData.role
            })
            .select()
            .single();

        if (error) {
            alert('Erro: ' + error.message);
            setSaving(false);
            return;
        }

        // Enviar email
        const tenant = tenants.find(t => t.id === formData.tenant_id);
        if (data && tenant) {
            await sendCollaboratorOnboardingEmail({
                tenantName: tenant.name,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                token: data.onboarding_token
            });
        }

        setSaving(false);
        setShowForm(false);
        setFormData({ tenant_id: '', name: '', email: '', role: '' });
        onRefresh();
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Colaboradores</h2>
                <Button icon="add" onClick={() => setShowForm(true)}>
                    Novo Colaborador
                </Button>
            </div>

            {showForm && (
                <div className="mb-6 p-6 bg-gray-50 rounded-xl border">
                    <h3 className="font-semibold mb-4">Novo Colaborador</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Empresa *</label>
                            <select
                                value={formData.tenant_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, tenant_id: e.target.value }))}
                                className="w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Selecione...</option>
                                {tenants.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label="Nome *"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <Input
                                label="Email *"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            />
                            <Input
                                label="Função"
                                value={formData.role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                            <Button type="submit" loading={saving}>Salvar</Button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500">Carregando...</div>
            ) : collaborators.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl">👥</span>
                    <p className="mt-2">Nenhum colaborador cadastrado</p>
                </div>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-3 px-4">Nome</th>
                            <th className="text-left py-3 px-4">Email</th>
                            <th className="text-left py-3 px-4">Empresa</th>
                            <th className="text-left py-3 px-4">Função</th>
                            <th className="text-left py-3 px-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {collaborators.map(c => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">{c.name}</td>
                                <td className="py-3 px-4 text-sm text-gray-500">{c.email}</td>
                                <td className="py-3 px-4 text-sm">{c.tenant?.name}</td>
                                <td className="py-3 px-4 text-sm">{c.role}</td>
                                <td className="py-3 px-4">
                                    <span className={`px - 2 py - 1 rounded - full text - xs ${c.onboarding_completed
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        } `}>
                                        {c.onboarding_completed ? 'Ativo' : 'Pendente'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// ==================== PROFISSIONAIS TAB ====================
function ProfissionaisTab({
    professionals,
    tenants,
    loading,
    onRefresh
}: {
    professionals: Professional[];
    tenants: Tenant[];
    loading: boolean;
    onRefresh: () => void;
}) {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        tenant_id: '',
        name: '',
        email: '',
        specialty: ''
    });
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.tenant_id || !formData.name || !formData.email) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        setSaving(true);

        const { data, error } = await supabase
            .from('professionals')
            .insert({
                tenant_id: formData.tenant_id,
                name: formData.name,
                email: formData.email,
                specialty: formData.specialty
            })
            .select()
            .single();

        if (error) {
            alert('Erro: ' + error.message);
            setSaving(false);
            return;
        }

        // Enviar email
        const tenant = tenants.find(t => t.id === formData.tenant_id);
        if (data && tenant) {
            await sendProfessionalOnboardingEmail({
                tenantName: tenant.name,
                name: formData.name,
                email: formData.email,
                specialty: formData.specialty,
                token: data.onboarding_token
            });
        }

        setSaving(false);
        setShowForm(false);
        setFormData({ tenant_id: '', name: '', email: '', specialty: '' });
        onRefresh();
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Profissionais</h2>
                <Button icon="add" onClick={() => setShowForm(true)}>
                    Novo Profissional
                </Button>
            </div>

            {showForm && (
                <div className="mb-6 p-6 bg-gray-50 rounded-xl border">
                    <h3 className="font-semibold mb-4">Novo Profissional</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Empresa *</label>
                            <select
                                value={formData.tenant_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, tenant_id: e.target.value }))}
                                className="w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Selecione...</option>
                                {tenants.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label="Nome *"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <Input
                                label="Email *"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            />
                            <Input
                                label="Especialidade"
                                value={formData.specialty}
                                onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                            <Button type="submit" loading={saving}>Salvar</Button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500">Carregando...</div>
            ) : professionals.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl">🩺</span>
                    <p className="mt-2">Nenhum profissional cadastrado</p>
                </div>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-3 px-4">Nome</th>
                            <th className="text-left py-3 px-4">Email</th>
                            <th className="text-left py-3 px-4">Empresa</th>
                            <th className="text-left py-3 px-4">Especialidade</th>
                            <th className="text-left py-3 px-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {professionals.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">{p.name}</td>
                                <td className="py-3 px-4 text-sm text-gray-500">{p.email}</td>
                                <td className="py-3 px-4 text-sm">{p.tenant?.name}</td>
                                <td className="py-3 px-4 text-sm">{p.specialty}</td>
                                <td className="py-3 px-4">
                                    <span className={`px - 2 py - 1 rounded - full text - xs ${p.onboarding_completed
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        } `}>
                                        {p.onboarding_completed ? 'Ativo' : 'Pendente'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
