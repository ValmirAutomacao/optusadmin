// Painel de Gerenciamento da Base de Conhecimento (RAG)
// Usa componentes UI customizados do projeto

import React, { useState, useEffect } from 'react';
import { knowledgeService, uazapiChatbotService } from '../lib/uazapiChatbot';
import type { KnowledgeData } from '../lib/uazapiChatbot';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';

interface UazapiKnowledgePanelProps {
    agentConfigId: string;
    instanceToken?: string;
}

const CATEGORIES = [
    { value: 'general', label: 'Geral' },
    { value: 'services', label: 'Serviços' },
    { value: 'policies', label: 'Políticas' },
    { value: 'faq', label: 'FAQ' },
    { value: 'procedures', label: 'Procedimentos' },
];

export function UazapiKnowledgePanel({
    agentConfigId,
    instanceToken,
}: UazapiKnowledgePanelProps) {
    const [knowledge, setKnowledge] = useState<KnowledgeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<KnowledgeData | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'general',
        keywords: '',
    });

    useEffect(() => {
        loadKnowledge();
    }, [agentConfigId]);

    const loadKnowledge = async () => {
        try {
            setLoading(true);
            const data = await knowledgeService.listKnowledge(agentConfigId);
            setKnowledge(data);
        } catch (error) {
            console.error('Failed to load knowledge:', error);
            alert('Erro ao carregar base de conhecimento');
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setEditingItem(null);
        setFormData({
            title: '',
            content: '',
            category: 'general',
            keywords: '',
        });
        setDialogOpen(true);
    };

    const handleEdit = (item: KnowledgeData) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            content: item.content,
            category: item.category || 'general',
            keywords: item.keywords?.join(', ') || '',
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            alert('Título e conteúdo são obrigatórios');
            return;
        }

        try {
            setSaving(true);
            const keywordsArray = formData.keywords
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean);

            if (editingItem) {
                await knowledgeService.updateKnowledge(editingItem.id!, {
                    title: formData.title,
                    content: formData.content,
                    category: formData.category,
                    keywords: keywordsArray,
                });
                alert('Conhecimento atualizado!');
            } else {
                await knowledgeService.createKnowledge({
                    agent_config_id: agentConfigId,
                    title: formData.title,
                    content: formData.content,
                    category: formData.category,
                    keywords: keywordsArray,
                });
                alert('Conhecimento adicionado!');
            }

            setDialogOpen(false);
            loadKnowledge();
        } catch (error) {
            console.error('Failed to save knowledge:', error);
            alert('Erro ao salvar conhecimento');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este conhecimento?')) return;

        try {
            await knowledgeService.deleteKnowledge(id);
            alert('Conhecimento excluído');
            loadKnowledge();
        } catch (error) {
            console.error('Failed to delete knowledge:', error);
            alert('Erro ao excluir conhecimento');
        }
    };

    const handleSync = async (id: string) => {
        try {
            const result = await uazapiChatbotService.syncKnowledgeToUazapi(id);
            if (result.success) {
                alert('Sincronizado com Uazapi!');
                loadKnowledge();
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error) {
            alert('Erro ao sincronizar');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setSaving(true);
            await knowledgeService.uploadDocumentAsKnowledge(
                agentConfigId,
                file,
                file.name.replace(/\.[^/.]+$/, ''),
                'general'
            );
            alert('Documento importado com sucesso!');
            loadKnowledge();
        } catch (error) {
            console.error('Failed to upload:', error);
            alert(error instanceof Error ? error.message : 'Erro ao importar documento');
        } finally {
            setSaving(false);
            e.target.value = '';
        }
    };

    const filteredKnowledge = knowledge.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📚</span>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Base de Conhecimento</h3>
                        <p className="text-sm text-gray-500">Adicione informações para o chatbot usar nas respostas</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <label>
                        <input
                            type="file"
                            accept=".txt,.json,.pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <Button variant="secondary" disabled={saving} icon="upload">
                            Importar Documento
                        </Button>
                    </label>
                    <Button onClick={handleNew} icon="add">
                        Adicionar
                    </Button>
                </div>
            </div>

            {/* Barra de busca */}
            <Input
                placeholder="Buscar no conhecimento..."
                icon="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Lista de conhecimentos */}
            {filteredKnowledge.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl block mb-4">📚</span>
                    <p className="font-medium">Nenhum conhecimento cadastrado</p>
                    <p className="text-sm">Adicione informações para treinar seu chatbot</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredKnowledge.map((item) => (
                        <div
                            key={item.id}
                            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-400">📄</span>
                                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            {CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${(item as any).is_vectorized ? 'bg-green-100 text-green-800' :
                                            (item as any).sync_status === 'error' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {(item as any).is_vectorized ? '✅ Vetorizado' :
                                                (item as any).sync_status === 'error' ? '❌ Erro' :
                                                    '⏳ Pendente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">{item.content}</p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <Button variant="ghost" size="sm" icon="edit" onClick={() => handleEdit(item)}>
                                        Editar
                                    </Button>
                                    <Button variant="ghost" size="sm" icon="sync" onClick={() => handleSync(item.id!)}>
                                        Sync
                                    </Button>
                                    <Button variant="danger" size="sm" icon="delete" onClick={() => handleDelete(item.id!)}>
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de criação/edição */}
            <Modal
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editingItem ? 'Editar Conhecimento' : 'Novo Conhecimento'}
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Título *"
                            placeholder="Ex: Horário de Funcionamento"
                            value={formData.title}
                            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        />
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">Categoria</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">Conteúdo *</label>
                        <textarea
                            placeholder="Digite as informações que o chatbot deve saber..."
                            rows={8}
                            value={formData.content}
                            onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
                        />
                        <p className="text-xs text-gray-500 ml-1">
                            Seja claro e detalhado. O chatbot usará este texto para responder perguntas.
                        </p>
                    </div>

                    <Input
                        label="Palavras-chave (opcional)"
                        placeholder="horário, funcionamento, aberto, fechado"
                        value={formData.keywords}
                        onChange={(e) => setFormData((prev) => ({ ...prev, keywords: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 ml-1">Separe as palavras-chave por vírgula</p>

                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" className="flex-1" onClick={() => setDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button className="flex-1" onClick={handleSave} loading={saving}>
                            {editingItem ? 'Atualizar' : 'Adicionar'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default UazapiKnowledgePanel;
