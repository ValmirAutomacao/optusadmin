// Painel de Gerenciamento de Agentes IA
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Bot,
  Plus,
  Settings,
  Trash2,
  Play,
  Pause,
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

import { AIAgentService, AI_PROVIDERS, type AIAgentConfig } from '../lib/aiAgents';

interface AIAgentPanelProps {
  agents: AIAgentConfig[];
  activeAgent: AIAgentConfig | null;
  loading: boolean;
}

export const AIAgentPanel: React.FC<AIAgentPanelProps> = ({
  agents,
  activeAgent,
  loading
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgentConfig | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testing, setTesting] = useState(false);

  // Formulário para novo agente
  const [newAgentForm, setNewAgentForm] = useState({
    name: '',
    provider: 'openrouter' as 'openrouter' | 'openai',
    model: '',
    api_key: '',
    temperature: 0.7,
    max_tokens: 1000,
    custom_instructions: ''
  });

  const resetForm = () => {
    setNewAgentForm({
      name: '',
      provider: 'openrouter',
      model: '',
      api_key: '',
      temperature: 0.7,
      max_tokens: 1000,
      custom_instructions: ''
    });
  };

  const handleCreateAgent = async () => {
    try {
      await AIAgentService.createAgent(newAgentForm);
      setIsCreateModalOpen(false);
      resetForm();
      // Recarregar agentes seria feito via callback do parent
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      alert('Erro ao criar agente: ' + (error as Error).message);
    }
  };

  const handleActivateAgent = async (agentId: string) => {
    try {
      await AIAgentService.activateAgent(agentId);
      // Recarregar dados seria feito via callback do parent
    } catch (error) {
      console.error('Erro ao ativar agente:', error);
      alert('Erro ao ativar agente');
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o agente "${agentName}"?`)) {
      return;
    }

    try {
      await AIAgentService.deleteAgent(agentId);
      // Recarregar dados seria feito via callback do parent
    } catch (error) {
      console.error('Erro ao deletar agente:', error);
      alert('Erro ao deletar agente');
    }
  };

  const handleTestAgent = async () => {
    if (!activeAgent || !testMessage.trim()) return;

    setTesting(true);
    try {
      const response = await AIAgentService.processMessage(testMessage, {
        empresa_nome: 'Teste',
        area_atuacao: 'Teste',
        servicos_disponiveis: 'Teste'
      });

      setTestResponse(response.success ? response.message || '' : response.error || '');
    } catch (error) {
      setTestResponse('Erro no teste: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const getProviderBadge = (provider: string) => {
    const colors = {
      openrouter: 'bg-purple-100 text-purple-700',
      openai: 'bg-green-100 text-green-700'
    };
    return colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? (
        <><CheckCircle2 className="w-3 h-3 mr-1" /> Ativo</>
      ) : (
        <><Pause className="w-3 h-3 mr-1" /> Inativo</>
      )}
    </Badge>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Bot className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Carregando agentes IA...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Agentes IA</h3>
          <p className="text-sm text-muted-foreground">
            Configure e gerencie seus agentes de IA para automação
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Agente IA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agent-name">Nome do Agente</Label>
                  <Input
                    id="agent-name"
                    value={newAgentForm.name}
                    onChange={(e) => setNewAgentForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Assistente Principal"
                  />
                </div>
                <div>
                  <Label htmlFor="agent-provider">Provedor</Label>
                  <Select
                    value={newAgentForm.provider}
                    onValueChange={(value: 'openrouter' | 'openai') =>
                      setNewAgentForm(prev => ({ ...prev, provider: value, model: '' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openrouter">OpenRouter (Testes)</SelectItem>
                      <SelectItem value="openai">OpenAI (Produção)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agent-model">Modelo</Label>
                  <Select
                    value={newAgentForm.model}
                    onValueChange={(value) => setNewAgentForm(prev => ({ ...prev, model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_PROVIDERS[newAgentForm.provider].models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="agent-api-key">API Key</Label>
                  <Input
                    id="agent-api-key"
                    type="password"
                    value={newAgentForm.api_key}
                    onChange={(e) => setNewAgentForm(prev => ({ ...prev, api_key: e.target.value }))}
                    placeholder="Sua API key"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agent-temperature">Temperature (0-2)</Label>
                  <Input
                    id="agent-temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={newAgentForm.temperature}
                    onChange={(e) => setNewAgentForm(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="agent-max-tokens">Max Tokens</Label>
                  <Input
                    id="agent-max-tokens"
                    type="number"
                    min="100"
                    max="8000"
                    value={newAgentForm.max_tokens}
                    onChange={(e) => setNewAgentForm(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="agent-instructions">Instruções Customizadas (Opcional)</Label>
                <Textarea
                  id="agent-instructions"
                  value={newAgentForm.custom_instructions}
                  onChange={(e) => setNewAgentForm(prev => ({ ...prev, custom_instructions: e.target.value }))}
                  placeholder="Instruções específicas para este agente..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAgent} disabled={!newAgentForm.name || !newAgentForm.model || !newAgentForm.api_key}>
                  Criar Agente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de agentes */}
      <div className="grid gap-4">
        {agents.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum agente configurado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro agente IA para começar a automação
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Agente
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          agents.map((agent) => (
            <Card key={agent.id} className={agent.active ? 'ring-2 ring-blue-500' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Bot className="h-8 w-8 text-blue-500" />
                    <div>
                      <h4 className="font-semibold">{agent.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getProviderBadge(agent.provider)}>
                          {AI_PROVIDERS[agent.provider].name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{agent.model}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(agent.active)}

                    {!agent.active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivateAgent(agent.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAgent(agent);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAgent(agent.id, agent.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Temperature:</span>
                    <span className="ml-2 font-medium">{agent.temperature}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Tokens:</span>
                    <span className="ml-2 font-medium">{agent.max_tokens}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Criado em:</span>
                    <span className="ml-2 font-medium">
                      {new Date(agent.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {agent.custom_instructions && (
                  <div className="mt-3 p-2 bg-muted rounded text-sm">
                    <strong>Instruções:</strong> {agent.custom_instructions.substring(0, 100)}
                    {agent.custom_instructions.length > 100 && '...'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Teste de agente ativo */}
      {activeAgent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Testar Agente Ativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-message">Mensagem de Teste</Label>
              <Textarea
                id="test-message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Digite uma mensagem para testar a resposta da IA..."
                rows={3}
              />
            </div>

            <Button onClick={handleTestAgent} disabled={!testMessage.trim() || testing}>
              {testing ? 'Processando...' : 'Testar'}
            </Button>

            {testResponse && (
              <div className="p-3 bg-muted rounded">
                <Label className="text-sm font-medium">Resposta da IA:</Label>
                <p className="mt-1 text-sm">{testResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAgentPanel;