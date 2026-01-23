// Dashboard Principal de Automação WhatsApp
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Bot,
  FileText,
  Settings,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Shield,
  Upload,
  Eye
} from 'lucide-react';

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
  const { activeAgent, agents, loading: agentsLoading } = useAIAgents();
  const { activePrompt, prompts, loading: promptsLoading } = useSystemPrompts();
  const { documents, loading: documentsLoading } = useCompanyDocuments();
  const { conversations, stats, loading: automationLoading } = useWhatsappAutomation(tenantId);
  const { connectionInfo, loading: limitsLoading } = useConnectionLimits();

  // Estado do sistema
  const [systemStatus, setSystemStatus] = useState({
    automation: false,
    ai_agent: false,
    prompts: false,
    documents: false,
    protection: true // Sempre ativo
  });

  // Verificar status dos sistemas
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
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <Badge variant={status ? "default" : "secondary"}>
            {status ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
        {status && (
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const QuickStats = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.total_messages || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.automation_rate || 0}% automatizadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.active_conversations || 0}</div>
          <p className="text-xs text-muted-foreground">
            {conversations.filter(c => c.status === 'waiting_human').length} aguardando humano
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documentos RAG</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{documents.length}</div>
          <p className="text-xs text-muted-foreground">
            {documents.filter(d => d.status === 'ready').length} prontos para uso
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conexões</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {connectionInfo?.whatsapp_connections_used || 0}/{connectionInfo?.whatsapp_connection_limit || 2}
          </div>
          <p className="text-xs text-muted-foreground">
            {connectionInfo?.remaining_connections || 0} disponíveis
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Automação WhatsApp</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={Object.values(systemStatus).every(Boolean) ? "default" : "secondary"}>
            {Object.values(systemStatus).every(Boolean) ? "Sistema Ativo" : "Configuração Necessária"}
          </Badge>
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Monitorar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="ai-agents">Agentes IA</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status dos Sistemas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatusCard
              title="Proteção"
              status={systemStatus.protection}
              icon={Shield}
              description="Instâncias críticas protegidas"
            />
            <StatusCard
              title="Agente IA"
              status={systemStatus.ai_agent}
              icon={Bot}
              description={activeAgent?.name || "Nenhum agente ativo"}
            />
            <StatusCard
              title="Prompts"
              status={systemStatus.prompts}
              icon={Settings}
              description={activePrompt?.name || "Nenhum prompt ativo"}
            />
            <StatusCard
              title="Documentos"
              status={systemStatus.documents}
              icon={FileText}
              description={`${documents.length} documentos carregados`}
            />
            <StatusCard
              title="Automação"
              status={systemStatus.automation}
              icon={TrendingUp}
              description="Sistema processando mensagens"
            />
          </div>

          {/* Estatísticas Rápidas */}
          <QuickStats />

          {/* Painel de Estatísticas */}
          <AutomationStatsPanel stats={stats} />
        </TabsContent>

        <TabsContent value="conversations">
          <ConversationPanel
            conversations={conversations}
            loading={automationLoading}
          />
        </TabsContent>

        <TabsContent value="ai-agents">
          <AIAgentPanel
            agents={agents}
            activeAgent={activeAgent}
            loading={agentsLoading}
          />
        </TabsContent>

        <TabsContent value="prompts">
          <SystemPromptsPanel
            prompts={prompts}
            activePrompt={activePrompt}
            loading={promptsLoading}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentUploadPanel
            documents={documents}
            loading={documentsLoading}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Limites de Conexão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Usado:</span>
                        <span className="font-medium">{connectionInfo?.whatsapp_connections_used || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Limite:</span>
                        <span className="font-medium">{connectionInfo?.whatsapp_connection_limit || 2}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Disponível:</span>
                        <span className="font-medium text-green-600">
                          {connectionInfo?.remaining_connections || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Instâncias Protegidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">1 Instância Protegida</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      WEBLOCAÇÃO - Sistema protegido
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Webhook Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Status:</span>
                      <Badge variant="default">Configurado</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      URL: https://seu-dominio.com/webhooks/whatsapp/
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Events: connection, messages, messages_update
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomationDashboard;