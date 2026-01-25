// Painel de Gerenciamento de Prompts do Sistema
import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import { SystemPromptService, type SystemPrompt } from '../lib/systemPrompts';

interface SystemPromptsPanelProps {
  prompts: SystemPrompt[];
  activePrompt: SystemPrompt | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const SystemPromptsPanel: React.FC<SystemPromptsPanelProps> = ({
  prompts,
  activePrompt,
  loading,
  onRefresh
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<SystemPrompt | null>(null);

  const [promptForm, setPromptForm] = useState({
    name: '',
    system_prompt: '',
    description: '',
    variables: [] as string[],
    version: '1.0.0'
  });

  const [newVariable, setNewVariable] = useState('');

  const resetForm = () => {
    setPromptForm({
      name: '',
      system_prompt: '',
      description: '',
      variables: [],
      version: '1.0.0'
    });
  };

  const handleCreatePrompt = async () => {
    try {
      await SystemPromptService.createPrompt(promptForm);
      setIsCreateModalOpen(false);
      resetForm();
      onRefresh?.();
    } catch (error) {
      alert('Erro ao criar prompt');
    }
  };

  const handleActivatePrompt = async (id: string) => {
    try {
      await SystemPromptService.activatePrompt(id);
      onRefresh?.();
    } catch (error) {
      alert('Erro ao ativar prompt');
    }
  };

  const handleEditPrompt = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setPromptForm({
      name: prompt.name,
      system_prompt: prompt.system_prompt,
      description: prompt.description || '',
      variables: Array.isArray(prompt.variables) ? prompt.variables : [],
      version: prompt.version
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePrompt = async () => {
    if (!editingPrompt) return;
    try {
      await SystemPromptService.updatePrompt(editingPrompt.id, {
        system_prompt: promptForm.system_prompt,
        description: promptForm.description,
        variables: promptForm.variables,
        version: promptForm.version
      });
      setIsEditModalOpen(false);
      onRefresh?.();
    } catch (error) {
      alert('Erro ao atualizar prompt');
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      try {
        await SystemPromptService.deletePrompt(id);
        onRefresh?.();
      } catch (error) {
        alert('Erro ao excluir prompt');
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando prompts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Prompts do Sistema (Cérebros)</h3>
          <p className="text-sm text-gray-500">Controle o comportamento base da IA</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon="add">Novo Prompt</Button>
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className={`p-5 rounded-2xl border-2 transition-all ${prompt.active ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-gray-900">{prompt.name}</h4>
                  {prompt.active && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full">Ativo</span>}
                  <span className="text-xs text-gray-400">v{prompt.version}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{prompt.description}</p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(prompt.variables) && prompt.variables.map(v => (
                    <span key={v} className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] rounded-lg">{"{"}{v}{"}"}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setPreviewPrompt(prompt); setIsPreviewModalOpen(true) }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Preview"><span className="material-icons-round text-lg">visibility</span></button>
                {!prompt.active && <button onClick={() => handleActivatePrompt(prompt.id)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Ativar"><span className="material-icons-round text-lg">play_arrow</span></button>}
                <button onClick={() => handleEditPrompt(prompt)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><span className="material-icons-round text-lg">edit</span></button>
                <button onClick={() => handleDeletePrompt(prompt.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Excluir"><span className="material-icons-round text-lg">delete</span></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar/Editar */}
      <Modal isOpen={isCreateModalOpen || isEditModalOpen} onClose={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false) }} title={isEditModalOpen ? "Editar Prompt" : "Novo Prompt"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome" value={promptForm.name} onChange={e => setPromptForm({ ...promptForm, name: e.target.value })} />
            <Input label="Versão" value={promptForm.version} onChange={e => setPromptForm({ ...promptForm, version: e.target.value })} />
          </div>
          <Input label="Descrição" value={promptForm.description} onChange={e => setPromptForm({ ...promptForm, description: e.target.value })} />

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900 uppercase">Conteúdo do Prompt</label>
            <textarea
              className="w-full h-48 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 transition-all outline-none resize-none font-mono text-sm"
              value={promptForm.system_prompt}
              onChange={e => setPromptForm({ ...promptForm, system_prompt: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false) }}>Cancelar</Button>
            <Button onClick={isEditModalOpen ? handleUpdatePrompt : handleCreatePrompt}>Salvar Prompt</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Preview */}
      <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} title={`Preview: ${previewPrompt?.name}`}>
        <div className="space-y-4">
          <div className="p-4 bg-gray-900 text-blue-100 rounded-2xl font-mono text-xs whitespace-pre-wrap max-h-96 overflow-y-auto">
            {previewPrompt?.system_prompt}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsPreviewModalOpen(false)}>Fechar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};