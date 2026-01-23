// Painel de Configuração do Chatbot IA
// Usa componentes UI customizados do projeto

import React, { useState, useEffect } from 'react';
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
    const [existingConfig, setExistingConfig] = useState<AgentConfigData | null>(null);

    useEffect(() => {
        loadConfig();
    }, [instanceId, isGlobal]);

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
                    instance_id: instanceId,
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
                    <span className="text-2xl">🤖</span>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Configuração do Chatbot IA</h3>
                        <p className="text-sm text-gray-500">Configure o assistente virtual para {instanceName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">Ativo</span>
                        <button
                            onClick={() => handleToggleActive(!config.is_active)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.is_active ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.is_active ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </label>
                    {existingConfig && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${(existingConfig as any).sync_status === 'synced' ? 'bg-green-100 text-green-800' :
                            (existingConfig as any).sync_status === 'error' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {(existingConfig as any).sync_status === 'synced' ? '✅ Sincronizado' :
                                (existingConfig as any).sync_status === 'error' ? '❌ Erro' :
                                    '⏳ Pendente'}
                        </span>
                    )}
                </div>
            </div>

            {/* Seção: Provedor e Modelo */}
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
                    value={config.api_key || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                    icon="key"
                />
                <p className="text-xs text-gray-500 ml-1">
                    {config.provider === 'openrouter' ? 'Obtenha em openrouter.ai/keys' : `Obtenha no painel do ${config.provider}`}
                </p>
            </div>

            <hr className="border-gray-200" />

            {/* Seção: Nome e Instruções */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    💬 Comportamento do Assistente
                </h4>

                <Input
                    label="Nome do Assistente"
                    placeholder="Ex: Atendente Virtual"
                    value={config.name || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    icon="smart_toy"
                />

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
                        Instruções Personalizadas
                    </label>
                    <textarea
                        placeholder="Instruções específicas para o assistente..."
                        rows={4}
                        value={config.custom_instructions || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, custom_instructions: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
                    />
                </div>

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
            </div>

            <hr className="border-gray-200" />

            {/* Aviso de Limitações */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">⚠️ Limitação do Chatbot</h4>
                <p className="text-sm text-yellow-700">
                    O chatbot nativo da Uazapi não processa mensagens de áudio nem imagem.
                    Esses tipos de mensagem serão ignorados pelo assistente.
                </p>
            </div>

            <hr className="border-gray-200" />

            {/* Botões de Ação */}
            <div className="flex justify-between">
                {!isGlobal ? (
                    <Button
                        variant="secondary"
                        onClick={handleSync}
                        disabled={syncing || !existingConfig?.id}
                        loading={syncing}
                        icon="sync"
                    >
                        Sincronizar com Uazapi
                    </Button>
                ) : (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="text-lg">💡</span>
                        Esta config será aplicada a novas instâncias
                    </div>
                )}

                <Button
                    onClick={handleSave}
                    disabled={saving}
                    loading={saving}
                    icon="save"
                >
                    {isGlobal ? 'Salvar Config Global' : 'Salvar Configuração'}
                </Button>
            </div>
        </div>
    );
}

export default ChatbotConfigPanel;
