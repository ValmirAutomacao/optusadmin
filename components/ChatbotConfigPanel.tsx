// Painel de Configuração do Chatbot IA
// Usa componentes UI customizados do projeto

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { agentConfigService, uazapiChatbotService } from '../lib/uazapiChatbot';
import type { AgentConfigData } from '../lib/uazapiChatbot';
import Button from './ui/Button';
import Input from './ui/Input';

interface ChatbotConfigPanelProps {
    instanceId: string;
    instanceName: string;
    instanceToken?: string;
    isGlobal?: boolean; // Se true, é config centralizada do developer
    onConfigChange?: (config: AgentConfigData) => void;
}

// Modelos disponíveis por provedor
const PROVIDER_MODELS: Record<string, { value: string; label: string }[]> = {
    openrouter: [
        { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5 (Recomendado)' },
        { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
        { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
        { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku (Econômico)' },
        { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'openai/gpt-4o', label: 'GPT-4o' },
    ],
    openai: [
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4o', label: 'GPT-4o' },
    ],
    anthropic: [
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    ],
    gemini: [
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    ],
};

export function ChatbotConfigPanel({
    instanceId,
    instanceName,
    instanceToken,
    isGlobal = false,
    onConfigChange,
}: ChatbotConfigPanelProps) {
    const [config, setConfig] = useState<Partial<AgentConfigData>>({
        name: 'Assistente Virtual',
        provider: 'openrouter',
        model: 'google/gemini-flash-1.5',
        temperature: 0.7,
        max_tokens: 1024,
        audio_fallback_message: 'Desculpe, não consigo processar áudios no momento. Por favor, digite sua mensagem.',
        image_fallback_message: 'Recebi sua imagem! Um atendente vai analisar e responder em breve.',
        transfer_on_image: true,
        is_active: false,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [massSyncing, setMassSyncing] = useState(false);
    const [existingConfig, setExistingConfig] = useState<AgentConfigData | null>(null);
    const [availablePrompts, setAvailablePrompts] = useState<{ id: string; name: string }[]>([]);
    const [availableInstances, setAvailableInstances] = useState<{ id: string; name: string; status: string }[]>([]);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string>(instanceId === 'global' ? '' : instanceId);

    useEffect(() => {
        loadConfig();
        loadPrompts();
        if (!isGlobal) loadInstances();
    }, [instanceId, isGlobal]);

    const loadInstances = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userData } = await supabase
                .from('users')
                .select('tenant_id')
                .eq('auth_id', user.id)
                .single();

            if (userData?.tenant_id) {
                const { data } = await supabase
                    .from('whatsapp_instances')
                    .select('id, name, status')
                    .eq('tenant_id', userData.tenant_id);
                if (data) setAvailableInstances(data);
            }
        } catch (error) {
            console.error('Failed to load instances:', error);
        }
    };

    const loadPrompts = async () => {
        try {
            const { data } = await supabase.from('system_prompts').select('id, name');
            if (data) setAvailablePrompts(data);
        } catch (error) {
            console.error('Failed to load prompts:', error);
        }
    };

    const loadConfig = async () => {
        try {
            setLoading(true);

            let existing;
            if (isGlobal) {
                // Carregar config global
                existing = await agentConfigService.getGlobalConfig();
            } else {
                // Carregar config da instância específica
                existing = await agentConfigService.getAgentConfigByInstance(instanceId);
            }

            if (existing) {
                setConfig(existing);
                setExistingConfig(existing);
            }
        } catch (error) {
            console.error('Failed to load config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            let savedConfig;
            if (isGlobal) {
                // Salvar como config global (sem instance_id)
                savedConfig = await agentConfigService.upsertGlobalConfig({
                    ...config,
                    is_global: true,
                } as any);
            } else {
                // Salvar config de instância específica
                savedConfig = await agentConfigService.upsertAgentConfig({
                    ...config,
                    instance_id: selectedInstanceId || null,
                } as any);
            }

            setExistingConfig(savedConfig);
            onConfigChange?.(savedConfig);
            alert(isGlobal ? 'Configuração global salva com sucesso!' : 'Configuração salva com sucesso!');
        } catch (error) {
            console.error('Failed to save config:', error);
            alert('Erro ao salvar configuração');
        } finally {
            setSaving(false);
        }
    };

    const handleSync = async () => {
        if (!existingConfig?.id) {
            alert('Salve a configuração primeiro');
            return;
        }

        try {
            setSyncing(true);
            const result = await uazapiChatbotService.syncAgentToUazapi(existingConfig.id);

            if (result.success) {
                alert('Sincronizado com Uazapi!');
                await loadConfig();
            } else {
                alert(`Erro na sincronização: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to sync:', error);
            alert('Erro ao sincronizar com Uazapi');
        } finally {
            setSyncing(false);
        }
    };

    const handleMassSync = async () => {
        if (!confirm('Deseja aplicar estas configurações técnicas (Modelo, Provedor, Prompt) a TODOS os chatbots de clientes?')) {
            return;
        }

        try {
            setMassSyncing(true);
            const { data: configs } = await supabase
                .from('uazapi_agent_configs')
                .select('id')
                .eq('is_global', false);

            if (!configs || configs.length === 0) {
                alert('Nenhum chatbot de cliente encontrado para sincronizar.');
                return;
            }

            let successCount = 0;
            for (const c of configs) {
                const res = await uazapiChatbotService.syncAgentToUazapi(c.id);
                if (res.success) successCount++;
            }

            alert(`${successCount} de ${configs.length} chatbots foram atualizados com o novo template global.`);
        } catch (error) {
            console.error('Mass sync failed:', error);
            alert('Erro durante a sincronização em massa');
        } finally {
            setMassSyncing(false);
        }
    };

    const handleToggleActive = async (active: boolean) => {
        setConfig(prev => ({ ...prev, is_active: active }));

        if (existingConfig?.id) {
            try {
                await agentConfigService.toggleAgentActive(existingConfig.id, active);
                alert(active ? 'Chatbot ativado!' : 'Chatbot desativado');
            } catch (error) {
                console.error('Failed to toggle:', error);
                alert('Erro ao alterar status');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const availableModels = PROVIDER_MODELS[config.provider || 'openrouter'] || [];

    return (
        <div className="bg-white rounded-xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🎯</span>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Master Template de Inteligência</h3>
                        <p className="text-sm text-slate-500">Configurações técnicas herdadas por todas as empresas</p>
                    </div>
                </div>
                {isGlobal && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 font-bold text-xs uppercase tracking-widest">
                        <span className="material-icons-round text-sm">public</span>
                        Configuração Global
                    </div>
                )}
            </div>

            {/* Seção: Seleção de Instância (Apenas se não for global) */}
            {!isGlobal && (
                <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-medium text-blue-800 flex items-center gap-2">
                        📱 Vínculo com WhatsApp
                    </h4>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
                            Selecionar WhatsApp para este Chatbot
                        </label>
                        <select
                            value={selectedInstanceId}
                            onChange={(e) => setSelectedInstanceId(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-transparent rounded-xl text-sm font-medium focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                        >
                            <option value="">Selecione um WhatsApp...</option>
                            {availableInstances.map(inst => (
                                <option key={inst.id} value={inst.id}>
                                    {inst.name} ({inst.status})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-blue-600 ml-1">
                            ⚠️ Apenas o WhatsApp selecionado usará estas configurações de IA.
                            Instâncias críticas não devem ser selecionadas aqui.
                        </p>
                    </div>
                </div>
            )}

            {/* Seção: Configurações Técnicas (Apenas para o Developer/Global) */}
            {isGlobal && (
                <>
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            ⚙️ Provedor de IA
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">Provedor</label>
                                <select
                                    value={config.provider}
                                    onChange={(e) => {
                                        setConfig(prev => ({
                                            ...prev,
                                            provider: e.target.value,
                                            model: PROVIDER_MODELS[e.target.value]?.[0]?.value || '',
                                        }));
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                >
                                    <option value="openrouter">OpenRouter (Multi-modelo)</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="anthropic">Anthropic</option>
                                    <option value="gemini">Google Gemini</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">Modelo</label>
                                <select
                                    value={config.model}
                                    onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                >
                                    {availableModels.map((model) => (
                                        <option key={model.value} value={model.value}>{model.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Input
                            label="Chave de API"
                            type="password"
                            placeholder="sk-... ou sua chave de API"
                            value={config.api_key_encrypted || ''}
                            onChange={(e) => setConfig(prev => ({ ...prev, api_key_encrypted: e.target.value }))}
                            icon="key"
                        />
                    </div>

                    <hr className="border-gray-200" />

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            🧠 Cérebro do Assistente (Prompt)
                        </h4>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
                                Selecionar Prompt do Sistema
                            </label>
                            <select
                                value={config.system_prompt_id || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, system_prompt_id: e.target.value || undefined }))}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                            >
                                <option value="">Nenhum (Usar instruções manuais abaixo)</option>
                                {availablePrompts.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <hr className="border-gray-200" />
                </>
            )}

            {/* Seção: Nome e Instruções */}
            <div className="space-y-4">
                <Input
                    label="Nome Padrão do Assistente"
                    placeholder="Ex: Atendente Virtual"
                    value={config.name || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    icon="smart_toy"
                />

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
                        Instruções Base (Global)
                    </label>
                    <textarea
                        placeholder="Injetado como base para todos os assistentes..."
                        rows={4}
                        value={config.custom_instructions || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, custom_instructions: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
                    />
                </div>

                {/* Seção: Parâmetros de Criatividade (Apenas Developer) */}
                {isGlobal && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
                                    Temperatura ({config.temperature || 0.7})
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={config.temperature || 0.7}
                                    onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Preciso</span>
                                    <span>Criativo</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">Max Tokens</label>
                                <select
                                    value={String(config.max_tokens || 1024)}
                                    onChange={(e) => setConfig(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                >
                                    <option value="512">512 (Curto)</option>
                                    <option value="1024">1024 (Normal)</option>
                                    <option value="2048">2048 (Longo)</option>
                                    <option value="4096">4096 (Muito Longo)</option>
                                </select>
                            </div>
                        </div>
                        <hr className="border-gray-200" />
                    </>
                )}
            </div>

            <hr className="border-gray-200" />

            {/* Botões de Ação */}
            <div className="flex justify-between items-center gap-4">
                {isGlobal ? (
                    <>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span className="text-lg">💡</span>
                            Configurações técnicas aplicadas a todos os clientes durante a sincronização.
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={handleMassSync}
                                disabled={massSyncing}
                                loading={massSyncing}
                                icon="sync_lock"
                            >
                                Atualizar Todos os Clientes
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                loading={saving}
                                icon="save"
                            >
                                Salvar Master Template
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-sm text-blue-600 flex items-center gap-2">
                            <span className="text-lg">ℹ️</span>
                            Sincronize para ativar o assistente no seu WhatsApp.
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={handleSync}
                                disabled={syncing || !existingConfig?.id}
                                loading={syncing}
                                icon="sync"
                            >
                                Sincronizar Agora
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                loading={saving}
                                icon="save"
                            >
                                Salvar Configuração
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ChatbotConfigPanel;
