// Painel de Gerenciamento de Agentes IA
import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';


import { AIAgentService, AI_PROVIDERS, type AIAgentConfig } from '../lib/aiAgents';

interface AIAgentPanelProps {
  agents: AIAgentConfig[];
  activeAgent: AIAgentConfig | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const AIAgentPanel: React.FC<AIAgentPanelProps> = ({
  agents,
  activeAgent,
  loading,
  onRefresh
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgentConfig | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testing, setTesting] = useState(false);

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
      onRefresh?.();
    } catch (error) {
      alert('Erro ao criar agente');
    }
  };

  const handleActivateAgent = async (agentId: string) => {
    try {
      await AIAgentService.activateAgent(agentId);
      onRefresh?.();
    } catch (error) {
      alert('Erro ao ativar agente');
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (confirm(`Tem certeza que deseja deletar o agente "${agentName}"?`)) {
      try {
        await AIAgentService.deleteAgent(agentId);
        onRefresh?.();
      } catch (error) {
        alert('Erro ao deletar agente');
      }
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

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando agentes IA...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Agentes IA</h3>
          <p className="text-sm text-gray-500">Configure e gerencie seus agentes de IA</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon="add">Novo Agente</Button>
      </div>

      <div className="grid gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className={`p-5 rounded-2xl border-2 transition-all ${agent.active ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <span className="material-icons-round text-2xl">smart_toy</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{agent.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${agent.provider === 'openai' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                      {AI_PROVIDERS[agent.provider].name}
                    </span>
                    <span className="text-xs text-gray-400">{agent.model}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {agent.active ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><span className="material-icons-round text-sm">check_circle</span> Ativo</span>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => handleActivateAgent(agent.id)} icon="play_arrow">Ativar</Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => { setEditingAgent(agent); setIsEditModalOpen(true); }} icon="settings" />
                <Button variant="secondary" size="sm" onClick={() => handleDeleteAgent(agent.id, agent.name)} className="!text-red-500" icon="delete" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeAgent && (
        <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 space-y-4">
          <h4 className="flex items-center gap-2 font-bold text-gray-900"><span className="material-icons-round text-yellow-500">bolt</span> Testar Agente Ativo</h4>
          <textarea
            className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-blue-500/20 transition-all resize-none"
            placeholder="Digite uma mensagem para testar..."
            rows={3}
            value={testMessage}
            onChange={e => setTestMessage(e.target.value)}
          />
          <Button onClick={handleTestAgent} loading={testing} disabled={!testMessage.trim()}>Testar</Button>
          {testResponse && (
            <div className="p-4 bg-gray-50 rounded-2xl">
              <span className="text-xs font-bold text-gray-400 uppercase">Resposta da IA:</span>
              <p className="mt-2 text-sm text-gray-700">{testResponse}</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Agente IA">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome do Agente" value={newAgentForm.name} onChange={e => setNewAgentForm({ ...newAgentForm, name: e.target.value })} />
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-900 uppercase ml-1">Provedor</label>
              <select className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/10" value={newAgentForm.provider} onChange={e => setNewAgentForm({ ...newAgentForm, provider: e.target.value as any, model: '' })}>
                <option value="openrouter">OpenRouter</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-900 uppercase ml-1">Modelo</label>
              <select className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/10" value={newAgentForm.model} onChange={e => setNewAgentForm({ ...newAgentForm, model: e.target.value })}>
                <option value="">Selecione...</option>
                {AI_PROVIDERS[newAgentForm.provider].models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <Input label="API Key" type="password" value={newAgentForm.api_key} onChange={e => setNewAgentForm({ ...newAgentForm, api_key: e.target.value })} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-900 uppercase ml-1">Instruções Customizadas</label>
            <textarea className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/10 resize-none h-32" value={newAgentForm.custom_instructions} onChange={e => setNewAgentForm({ ...newAgentForm, custom_instructions: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateAgent}>Criar Agente</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AIAgentPanel;