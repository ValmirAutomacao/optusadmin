// Painel de Gerenciamento de Prompts do Sistema
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  Eye,
  Copy,
  Wand2
} from 'lucide-react';

import { SystemPromptService, type SystemPrompt } from '../lib/systemPrompts';

interface SystemPromptsPanelProps {
  prompts: SystemPrompt[];
  activePrompt: SystemPrompt | null;
  loading: boolean;
}

export const SystemPromptsPanel: React.FC<SystemPromptsPanelProps> = ({
  prompts,
  activePrompt,
  loading
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<SystemPrompt | null>(null);

  // Formulário para novo prompt
  const [promptForm, setPromptForm] = useState({
    name: '',
    system_prompt: '',
    description: '',
    variables: [] as string[],
    version: '1.0.0'
  });

  const [newVariable, setNewVariable] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const resetForm = () => {
    setPromptForm({
      name: '',
      system_prompt: '',
      description: '',
      variables: [],
      version: '1.0.0'
    });
    setValidationResult(null);
  };

  const addVariable = () => {
    if (newVariable.trim() && !promptForm.variables.includes(newVariable.trim())) {
      setPromptForm(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable.trim()]
      }));
      setNewVariable('');
    }
  };

  const removeVariable = (variable: string) => {
    setPromptForm(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
  };

  const validatePrompt = () => {
    const result = SystemPromptService.validatePrompt(
      promptForm.system_prompt,
      promptForm.variables
    );
    setValidationResult(result);
    return result;
  };

  const handleCreatePrompt = async () => {
    const validation = validatePrompt();
    if (!validation.valid) {
      alert('Corrija os erros de validação antes de salvar');
      return;
    }

    try {
      await SystemPromptService.createPrompt(promptForm);
      setIsCreateModalOpen(false);
      resetForm();
      // Recarregar prompts seria feito via callback do parent
    } catch (error) {
      console.error('Erro ao criar prompt:', error);
      alert('Erro ao criar prompt: ' + (error as Error).message);
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

    const validation = validatePrompt();
    if (!validation.valid) {
      alert('Corrija os erros de validação antes de salvar');
      return;
    }

    try {
      await SystemPromptService.updatePrompt(editingPrompt.id, {
        system_prompt: promptForm.system_prompt,
        description: promptForm.description,
        variables: promptForm.variables,
        version: promptForm.version
      });
      setIsEditModalOpen(false);
      setEditingPrompt(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao atualizar prompt:', error);
      alert('Erro ao atualizar prompt');
    }
  };

  const handleActivatePrompt = async (promptId: string) => {
    try {
      await SystemPromptService.activatePrompt(promptId);
      // Recarregar dados seria feito via callback do parent
    } catch (error) {
      console.error('Erro ao ativar prompt:', error);
      alert('Erro ao ativar prompt');
    }
  };

  const handleDeletePrompt = async (promptId: string, promptName: string) => {
    try {
      await SystemPromptService.deletePrompt(promptId);
      // Recarregar dados seria feito via callback do parent
    } catch (error) {
      console.error('Erro ao deletar prompt:', error);
      alert('Erro ao deletar prompt');
    }
  };

  const handleDuplicatePrompt = async (prompt: SystemPrompt) => {
    try {
      const newName = `${prompt.name}_copy_${Date.now()}`;
      const newVersion = `${prompt.version}_copy`;
      await SystemPromptService.duplicatePrompt(prompt.id, newName, newVersion);
      // Recarregar dados seria feito via callback do parent
    } catch (error) {
      console.error('Erro ao duplicar prompt:', error);
      alert('Erro ao duplicar prompt');
    }
  };

  const previewWithSampleData = (prompt: SystemPrompt) => {
    let processedPrompt = prompt.system_prompt;

    // Substituir com dados de exemplo
    const sampleData = {
      empresa_nome: 'Exemplo Clínica',
      area_atuacao: 'Medicina Geral',
      servicos_disponiveis: 'Consultas, Exames, Procedimentos',
      endereco_empresa: 'Rua das Flores, 123 - Centro',
      telefone_empresa: '(11) 99999-9999',
      horario_funcionamento: 'Segunda a Sexta: 8h às 18h'
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      processedPrompt = processedPrompt.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return processedPrompt;
  };

  const getStatusBadge = (prompt: SystemPrompt) => {
    if (prompt.active) {
      return (
        <Badge variant="default">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Carregando prompts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Prompts do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Configure o comportamento da IA para todos os clientes
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Prompt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prompt-name">Nome do Prompt</Label>
                  <Input
                    id="prompt-name"
                    value={promptForm.name}
                    onChange={(e) => setPromptForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Atendimento Padrão v2"
                  />
                </div>
                <div>
                  <Label htmlFor="prompt-version">Versão</Label>
                  <Input
                    id="prompt-version"
                    value={promptForm.version}
                    onChange={(e) => setPromptForm(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="Ex: 2.0.0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="prompt-description">Descrição</Label>
                <Input
                  id="prompt-description"
                  value={promptForm.description}
                  onChange={(e) => setPromptForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o propósito deste prompt..."
                />
              </div>

              <div>
                <Label>Variáveis Disponíveis</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    placeholder="Nome da variável (ex: empresa_nome)"
                    onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                  />
                  <Button type="button" onClick={addVariable}>Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {promptForm.variables.map((variable) => (
                    <Badge key={variable} variant="secondary">
                      {`{${variable}}`}
                      <button
                        onClick={() => removeVariable(variable)}
                        className="ml-2 text-xs hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="prompt-content">Conteúdo do Prompt</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={validatePrompt}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Validar
                  </Button>
                </div>
                <Textarea
                  id="prompt-content"
                  value={promptForm.system_prompt}
                  onChange={(e) => setPromptForm(prev => ({ ...prev, system_prompt: e.target.value }))}
                  placeholder="Digite o prompt do sistema aqui..."
                  rows={10}
                  className="font-mono"
                />
              </div>

              {validationResult && (
                <div className="space-y-2">
                  {validationResult.errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <h4 className="font-semibold text-red-800 mb-2">Erros:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {validationResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <h4 className="font-semibold text-yellow-800 mb-2">Avisos:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.valid && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-700">✓ Prompt válido!</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePrompt} disabled={!promptForm.name || !promptForm.system_prompt}>
                  Criar Prompt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de prompts */}
      <div className="grid gap-4">
        {prompts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum prompt configurado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro prompt para controlar o comportamento da IA
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          prompts.map((prompt) => (
            <Card key={prompt.id} className={prompt.active ? 'ring-2 ring-blue-500' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      <h4 className="font-semibold">{prompt.name}</h4>
                      {getStatusBadge(prompt)}
                      <Badge variant="outline">v{prompt.version}</Badge>
                    </div>

                    {prompt.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {prompt.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {Array.isArray(prompt.variables) && prompt.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {`{${variable}}`}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Criado em {new Date(prompt.created_at).toLocaleDateString()} •
                      {prompt.system_prompt.length} caracteres
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewPrompt(prompt);
                        setIsPreviewModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {!prompt.active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivatePrompt(prompt.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPrompt(prompt)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicatePrompt(prompt)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar o prompt "{prompt.name}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePrompt(prompt.id, prompt.name)}>
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Preview */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preview: {previewPrompt?.name}</DialogTitle>
          </DialogHeader>
          {previewPrompt && (
            <div className="space-y-4">
              <div>
                <Label>Prompt Original:</Label>
                <div className="p-3 bg-muted rounded font-mono text-sm max-h-60 overflow-y-auto">
                  {previewPrompt.system_prompt}
                </div>
              </div>

              <div>
                <Label>Preview com Dados de Exemplo:</Label>
                <div className="p-3 bg-blue-50 rounded font-mono text-sm max-h-60 overflow-y-auto">
                  {previewWithSampleData(previewPrompt)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição (similar ao de criação) */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Prompt</DialogTitle>
          </DialogHeader>
          {/* Conteúdo similar ao modal de criação */}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePrompt}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemPromptsPanel;