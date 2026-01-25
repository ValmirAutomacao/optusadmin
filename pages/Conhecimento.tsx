/**
 * Página de Conhecimento
 * Para clientes fazerem upload de PDF para base de conhecimento
 */

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import UazapiKnowledgePanel from '../components/UazapiKnowledgePanel';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import ChatbotConfigPanel from '../components/ChatbotConfigPanel';

const Conhecimento: React.FC = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [agentConfigId, setAgentConfigId] = useState<string | null>(null);
    const [instanceToken, setInstanceToken] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        loadGlobalAgentConfig();
    }, []);

    async function loadGlobalAgentConfig() {
        setLoading(true);

        try {
            // Importar o service aqui ou no topo
            const { agentConfigService } = await import('../lib/uazapiChatbot');
            const agentConfig = await agentConfigService.getAgentConfigForTenant();

            if (agentConfig) {
                setAgentConfigId(agentConfig.id!);
                // Opcional: buscar token se vinculado
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }

        setLoading(false);
    }

    return (
        <Layout isMobile={isMobile}>
            <div className="p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Base de Conhecimento</h1>
                    <p className="text-gray-600">
                        Adicione documentos e informações para que o chatbot possa responder melhor
                    </p>
                </div>

                {agentConfigId && (
                    <div className="mb-6">
                        <Button
                            variant="secondary"
                            icon={showSettings ? 'expand_less' : 'settings'}
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            {showSettings ? 'Ocultar Configurações' : 'Configurar WhatsApp do Chatbot'}
                        </Button>

                        {showSettings && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <ChatbotConfigPanel
                                    instanceId=""
                                    instanceName="Chatbot"
                                    onConfigChange={() => {
                                        loadGlobalAgentConfig();
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Conteúdo */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Carregando...</div>
                    ) : agentConfigId ? (
                        <UazapiKnowledgePanel agentConfigId={agentConfigId} />
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Chatbot não configurado
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                O chatbot ainda não foi configurado pelo administrador do sistema.
                                Entre em contato com o suporte para mais informações.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Conhecimento;
