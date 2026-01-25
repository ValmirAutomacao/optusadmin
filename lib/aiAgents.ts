// Sistema de Agentes IA - OpenRouter/OpenAI Integration
import React from 'react';
import { supabase } from './supabase';
import { SystemPromptService } from './systemPrompts';

// Configurações dos provedores IA
const AI_PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-3.1-405b-instruct',
      'google/gemini-pro-1.5'
    ]
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ]
  }
} as const;

// Types para configuração de agentes
interface AIAgentConfig {
  id: string;
  tenant_id: string;
  name: string;
  provider: 'openrouter' | 'openai';
  model: string;
  api_key: string;
  temperature: number;
  max_tokens: number;
  system_prompt_id?: string;
  custom_instructions?: string;
  active: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  success: boolean;
  message?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd?: number;
  };
}

// Classe principal para gerenciamento de agentes IA
export class AIAgentService {

  /**
   * 🤖 Criar novo agente IA
   */
  static async createAgent(data: {
    name: string;
    provider: 'openrouter' | 'openai';
    model: string;
    api_key: string;
    temperature?: number;
    max_tokens?: number;
    custom_instructions?: string;
  }): Promise<AIAgentConfig> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Obter tenant_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      // Validar modelo para o provedor
      if (!AI_PROVIDERS[data.provider].models.includes(data.model)) {
        throw new Error(`Modelo ${data.model} não disponível para ${data.provider}`);
      }

      // Testar API key antes de salvar
      await this.testApiKey(data.provider, data.api_key, data.model);

      const { data: agentData, error } = await supabase
        .from('ai_agents')
        .insert({
          tenant_id: userData.tenant_id,
          name: data.name,
          provider: data.provider,
          model: data.model,
          api_key: data.api_key,
          temperature: data.temperature || 0.7,
          max_tokens: data.max_tokens || 1000,
          custom_instructions: data.custom_instructions,
          created_by: user.id,
          updated_by: user.id,
          active: false // Novo agente sempre inativo inicialmente
        })
        .select()
        .single();

      if (error) throw error;
      return agentData;

    } catch (error) {
      console.error('Erro ao criar agente IA:', error);
      throw error;
    }
  }

  /**
   * 📝 Listar agentes do tenant
   */
  static async listTenantAgents(): Promise<AIAgentConfig[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erro ao listar agentes:', error);
      throw error;
    }
  }

  /**
   * ✅ Obter agente ativo
   */
  static async getActiveAgent(): Promise<AIAgentConfig | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('active', true)
        .limit(1);

      if (error) {
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;

    } catch (error) {
      console.error('Erro ao obter agente ativo:', error);
      return null;
    }
  }

  /**
   * 🎯 Ativar agente específico
   */
  static async activateAgent(id: string): Promise<AIAgentConfig> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      // Desativar todos os agentes do tenant
      await supabase
        .from('ai_agents')
        .update({ active: false })
        .eq('tenant_id', userData.tenant_id);

      // Ativar o agente específico
      const { data, error } = await supabase
        .from('ai_agents')
        .update({
          active: true,
          updated_by: user.id
        })
        .eq('id', id)
        .eq('tenant_id', userData.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Erro ao ativar agente:', error);
      throw error;
    }
  }

  /**
   * 💬 Processar mensagem via agente ativo
   */
  static async processMessage(
    userMessage: string,
    tenantData?: {
      empresa_nome?: string;
      area_atuacao?: string;
      servicos_disponiveis?: string;
      endereco_empresa?: string;
      telefone_empresa?: string;
      horario_funcionamento?: string;
    }
  ): Promise<AIResponse> {
    try {
      // Obter agente ativo
      const agent = await this.getActiveAgent();
      if (!agent) {
        return {
          success: false,
          error: 'Nenhum agente IA ativo configurado'
        };
      }

      // Obter tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      // Obter prompt processado se tiver system_prompt_id
      let systemPrompt = agent.custom_instructions || 'Você é um assistente virtual prestativo.';

      if (agent.system_prompt_id) {
        const promptData = await SystemPromptService.getPromptForTenant(
          userData.tenant_id,
          tenantData || {}
        );

        if (promptData) {
          systemPrompt = promptData.final_prompt;
        }
      }

      // Preparar mensagens
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      // Fazer chamada para API
      const response = await this.callAIAPI(agent, messages);

      // Log da conversa (opcional)
      await this.logConversation(agent.id, userMessage, response.message || '', response.usage);

      return response;

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * 🔌 Chamar API do provedor IA
   */
  private static async callAIAPI(agent: AIAgentConfig, messages: ChatMessage[]): Promise<AIResponse> {
    try {
      const provider = AI_PROVIDERS[agent.provider];

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agent.api_key}`
      };

      // Headers específicos do OpenRouter
      if (agent.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://optusadmin.com';
        headers['X-Title'] = 'OptusAdmin WhatsApp Assistant';
      }

      const requestBody = {
        model: agent.model,
        messages: messages,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens
      };

      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: data.choices[0]?.message?.content || 'Sem resposta',
        usage: {
          prompt_tokens: data.usage?.prompt_tokens || 0,
          completion_tokens: data.usage?.completion_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0,
          cost_usd: data.usage?.cost_usd || 0
        }
      };

    } catch (error) {
      console.error('Erro na chamada da API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na API'
      };
    }
  }

  /**
   * 🧪 Testar API key
   */
  private static async testApiKey(
    provider: 'openrouter' | 'openai',
    apiKey: string,
    model: string
  ): Promise<void> {
    try {
      const providerConfig = AI_PROVIDERS[provider];

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://optusadmin.com';
        headers['X-Title'] = 'OptusAdmin API Test';
      }

      const testMessage = {
        model: model,
        messages: [{ role: 'user', content: 'teste' }],
        max_tokens: 10
      };

      const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(testMessage)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Key inválida ou modelo indisponível: ${errorText}`);
      }

    } catch (error) {
      throw new Error(`Falha no teste da API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * 📊 Registrar conversa para auditoria
   */
  private static async logConversation(
    agentId: string,
    userMessage: string,
    aiResponse: string,
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number; cost_usd?: number }
  ): Promise<void> {
    try {
      await supabase
        .from('ai_conversation_logs')
        .insert({
          agent_id: agentId,
          user_message: userMessage,
          ai_response: aiResponse,
          tokens_used: usage?.total_tokens || 0,
          cost_usd: usage?.cost_usd || 0
        });
    } catch (error) {
      console.error('Erro ao registrar conversa:', error);
      // Não falhar a operação principal por causa do log
    }
  }

  /**
   * 🗑️ Deletar agente
   */
  static async deleteAgent(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id)
        .eq('tenant_id', userData.tenant_id);

      if (error) throw error;

    } catch (error) {
      console.error('Erro ao deletar agente:', error);
      throw error;
    }
  }

  /**
   * ✏️ Atualizar agente
   */
  static async updateAgent(id: string, updates: Partial<{
    name: string;
    model: string;
    api_key: string;
    temperature: number;
    max_tokens: number;
    custom_instructions: string;
  }>): Promise<AIAgentConfig> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      // Testar API key se fornecida
      if (updates.api_key) {
        const { data: currentAgent, error: agentError } = await supabase
          .from('ai_agents')
          .select('provider, model')
          .eq('id', id)
          .eq('tenant_id', userData.tenant_id)
          .single();

        if (agentError) throw agentError;

        await this.testApiKey(
          currentAgent.provider,
          updates.api_key,
          updates.model || currentAgent.model
        );
      }

      const { data, error } = await supabase
        .from('ai_agents')
        .update({
          ...updates,
          updated_by: user.id
        })
        .eq('id', id)
        .eq('tenant_id', userData.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Erro ao atualizar agente:', error);
      throw error;
    }
  }
}

// Hook React para usar agentes IA
export const useAIAgents = () => {
  const [agents, setAgents] = React.useState<AIAgentConfig[]>([]);
  const [activeAgent, setActiveAgent] = React.useState<AIAgentConfig | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const [allAgents, active] = await Promise.all([
        AIAgentService.listTenantAgents(),
        AIAgentService.getActiveAgent()
      ]);
      setAgents(allAgents);
      setActiveAgent(active);
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMessage = async (message: string, tenantData?: any) => {
    return await AIAgentService.processMessage(message, tenantData);
  };

  React.useEffect(() => {
    loadAgents();
  }, []);

  return {
    agents,
    activeAgent,
    loading,
    loadAgents,
    processMessage,
    createAgent: AIAgentService.createAgent,
    updateAgent: AIAgentService.updateAgent,
    activateAgent: AIAgentService.activateAgent,
    deleteAgent: AIAgentService.deleteAgent
  };
};

// Export tipos
export type { AIAgentConfig, ChatMessage, AIResponse };
export { AI_PROVIDERS };