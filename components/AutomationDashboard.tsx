// Dashboard Principal de Automação WhatsApp
import React, { useState, useEffect } from 'react';
import Button from './ui/Button';


import { useAIAgents } from '../lib/aiAgents';
import { useSystemPrompts } from '../lib/systemPrompts';
import { useCompanyDocuments } from '../lib/documentUpload';
import { useWhatsappAutomation } from '../lib/whatsappAutomation';
import { useConnectionLimits } from '../lib/connectionLimits';

// Componentes especializados
import { AIAgentPanel } from './AIAgentPanel';
import { SystemPromptsPanel } from './SystemPromptsPanel';
import { DocumentUploadPanel } from './DocumentUploadPanel';
import { ConversationPanel } from './ConversationPanel';
import { AutomationStatsPanel } from './AutomationStatsPanel';

interface AutomationDashboardProps {
  tenantId?: string;
}

export const AutomationDashboard: React.FC<AutomationDashboardProps> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Hooks dos sistemas
  const { activeAgent, agents, loading: agentsLoading, loadAgents } = useAIAgents();
  const { activePrompt, prompts, loading: promptsLoading, loadPrompts } = useSystemPrompts();
  const { documents, loading: documentsLoading, loadDocuments } = useCompanyDocuments();
  const { conversations, stats, loading: automationLoading, loadData } = useWhatsappAutomation(tenantId);
  const { connectionInfo, loading: limitsLoading } = useConnectionLimits();

  // Estado do sistema
  const [systemStatus, setSystemStatus] = useState({
    automation: false,
    ai_agent: false,
    prompts: false,
    documents: false,
    protection: true
  });

  useEffect(() => {
    setSystemStatus({
      automation: !!stats && stats.total_messages > 0,
      ai_agent: !!activeAgent,
      prompts: !!activePrompt,
      documents: documents.length > 0,
      protection: true
    });
  }, [stats, activeAgent, activePrompt, documents]);

  const StatusCard = ({ title, status, icon: Icon, description }: any) => (
    <div className="bg-white p-5 rounded-2xl border-2 border-gray-100 relative group hover:border-blue-500/20 transition-all">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</h4>
        <div className="flex items-center gap-2">
          <span className="material-icons-round text-gray-400 text-sm">{Icon}</span>
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {status ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-600">{description}</p>
      {status && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );

  const QuickStats = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white p-6 rounded-2xl border-2 border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-500">Mensagens Hoje</h4>
          <span className="material-icons-round text-blue-500">forum</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">{stats?.total_messages || 0}</div>
        <p className="text-xs text-green-600 mt-1 font-medium">{stats?.automation_rate || 0}% automatizadas</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-500">Conversas Ativas</h4>
          <span className="material-icons-round text-purple-500">group</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">{stats?.active_conversations || 0}</div>
        <p className="text-xs text-purple-600 mt-1 font-medium">
          {conversations.filter(c => c.status === 'waiting_human').length} aguardando humano
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-500">Documentos RAG</h4>
          <span className="material-icons-round text-orange-500">description</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">{documents.length}</div>
        <p className="text-xs text-orange-600 mt-1 font-medium">
          {documents.filter(d => d.status === 'ready').length} ativos
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-500">Conexões</h4>
          <span className="material-icons-round text-yellow-500">bolt</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">
          {connectionInfo?.whatsapp_connections_used || 0}/{connectionInfo?.whatsapp_connection_limit || 2}
        </div>
        <p className="text-xs text-gray-400 mt-1 font-medium">{connectionInfo?.remaining_connections || 0} disponíveis</p>
      </div>
    </div>
  );

  const TABS = [
    { id: 'overview', label: 'Visão Geral', icon: 'dashboard' },
    { id: 'conversations', label: 'Conversas', icon: 'chat' },
    { id: 'ai-agents', label: 'Agentes IA', icon: 'smart_toy' },
    { id: 'prompts', label: 'Prompts', icon: 'psychology' },
    { id: 'documents', label: 'Documentos', icon: 'description' },
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
  ];

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Automação WhatsApp</h2>
          <p className="text-gray-500">Gerencie a inteligência do seu atendimento</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${Object.values(systemStatus).every(Boolean) ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
            {Object.values(systemStatus).every(Boolean) ? "Sistema Operacional" : "Atenção Requerida"}
          </span>
          <Button variant="secondary" icon="visibility">Monitorar</Button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            <span className="material-icons-round text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatusCard title="Proteção" status={systemStatus.protection} icon="shield" description="Instâncias isoladas" />
              <StatusCard title="Agente IA" status={systemStatus.ai_agent} icon="smart_toy" description={activeAgent?.name || "Nenhum ativo"} />
              <StatusCard title="Prompts" status={systemStatus.prompts} icon="settings" description={activePrompt?.name || "Nenhum ativo"} />
              <StatusCard title="Documentos" status={systemStatus.documents} icon="description" description={`${documents.length} arquivos`} />
              <StatusCard title="Automação" status={systemStatus.automation} icon="trending_up" description="Processando mensagens" />
            </div>
            <QuickStats />
            <AutomationStatsPanel stats={stats} />
          </div>
        )}

        {activeTab === 'conversations' && (
          <ConversationPanel conversations={conversations} loading={automationLoading} onRefresh={loadData} />
        )}

        {activeTab === 'ai-agents' && (
          <AIAgentPanel agents={agents} activeAgent={activeAgent} loading={agentsLoading} onRefresh={loadAgents} />
        )}

        {activeTab === 'prompts' && (
          <SystemPromptsPanel prompts={prompts} activePrompt={activePrompt} loading={promptsLoading} onRefresh={loadPrompts} />
        )}

        {activeTab === 'documents' && (
          <DocumentUploadPanel documents={documents} loading={documentsLoading} onRefresh={loadDocuments} />
        )}

        {activeTab === 'settings' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100">
              <h4 className="font-bold text-gray-900 mb-4">Limites e Cotas</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Conexões Usadas</span>
                  <span className="font-bold">{connectionInfo?.whatsapp_connections_used || 0}/{connectionInfo?.whatsapp_connection_limit || 2}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Webhook Status</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg uppercase">Ativo</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100">
              <h4 className="font-bold text-gray-900 mb-4">Segurança</h4>
              <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-2xl border-2 border-green-100">
                <span className="material-icons-round text-4xl">shield</span>
                <div>
                  <p className="text-sm font-bold">Anti-Bloqueio Ativado</p>
                  <p className="text-xs opacity-80">Delay inteligente e rotação de instâncias</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationDashboard;