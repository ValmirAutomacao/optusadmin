// Integração com recursos de Chatbot IA da API Uazapi
// Gerencia agentes, conhecimento (RAG), triggers e funções
// Usa Edge Function como proxy para proteger tokens

import { supabase } from './supabase';

// URL do proxy Supabase Edge Function
const SUPABASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || '';
const UAZAPI_PROXY_URL = `${SUPABASE_URL}/functions/v1/uazapi-proxy`;

// ========================================
// Types - API Uazapi Chatbot
// ========================================

export interface UazapiAgent {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'custom';
  model: string;
  apikey?: string;
  openaikey?: string;
  basePrompt?: string;
  maxTokens?: number;
  temperature?: number; // 0-100
  diversityLevel?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  signMessages?: boolean;
  readMessages?: boolean;
  maxMessageLength?: number;
  typingDelay_seconds?: number;
  contextTimeWindow_hours?: number;
  contextMaxMessages?: number;
  contextMinMessages?: number;
  owner?: string;
  created?: string;
  updated?: string;
}

export interface UazapiKnowledge {
  id: string;
  active: boolean;
  tittle: string; // Note: API typo "tittle" instead of "title"
  content: string;
  vectorStatus?: string;
  isVectorized?: boolean;
  lastVectorizedAt?: number;
  owner?: string;
  priority?: number;
  created?: string;
  updated?: string;
}

export interface UazapiTrigger {
  id: string;
  active: boolean;
  type: 'agent' | 'quickreply' | 'flow';
  agent_id?: string;
  flow_id?: string;
  quickReply_id?: string;
  wordsToStart?: string;
  ignoreGroups?: boolean;
  lead_field?: string;
  lead_operator?: string;
  lead_value?: string;
  priority?: number;
  responseDelay_seconds?: number;
  owner?: string;
  created?: string;
  updated?: string;
}

export interface UazapiFunction {
  id: string;
  name: string;
  description: string;
  active: boolean;
  method: string;
  endpoint: string;
  headers?: string;
  body?: string;
  parameters?: string;
  owner?: string;
  created?: string;
  updated?: string;
}

// Types internos para sincronização
export interface AgentConfigData {
  id?: string;
  tenant_id: string;
  instance_id?: string; // Nullable para config global
  is_global?: boolean;  // Se true, é config template
  name: string;
  provider: string;
  model: string;
  api_key_encrypted?: string;
  system_prompt_id?: string;
  custom_instructions?: string;
  temperature?: number;
  max_tokens?: number;
  audio_fallback_message?: string;
  image_fallback_message?: string;
  transfer_on_image?: boolean;
  is_active?: boolean;
}

export interface KnowledgeData {
  id?: string;
  tenant_id: string;
  agent_config_id: string;
  title: string;
  content: string;
  category?: string;
  keywords?: string[];
}

// ========================================
// UazapiChatbotService - Gerencia sincronização via proxy
// ========================================

export class UazapiChatbotService {
  private proxyUrl: string;

  constructor() {
    this.proxyUrl = UAZAPI_PROXY_URL;
  }

  // Obter token de autenticação do Supabase
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Usuário não autenticado');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''
    };
  }

  // Fazer requisição via proxy
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: any,
    instanceToken?: string
  ): Promise<T> {
    const headers = await this.getAuthHeaders();

    // Adicionar token da instância se fornecido
    if (instanceToken) {
      headers['x-instance-token'] = instanceToken;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.proxyUrl}${endpoint}`, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Uazapi request failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // ========================================
  // Agentes IA
  // ========================================

  // Listar agentes da instância
  async listAgents(instanceToken: string): Promise<UazapiAgent[]> {
    return this.makeRequest<UazapiAgent[]>(
      '/agent/list',
      'GET',
      undefined,
      instanceToken
    );
  }

  // Criar/Editar agente na Uazapi
  async editAgent(instanceToken: string, agent: any): Promise<UazapiAgent> {
    // A API Uazapi v2 exige que o agente seja envelopado em um objeto "agent"
    const payload = {
      id: agent.id || '',
      delete: false,
      agent: {
        ...agent
      }
    };

    // Remover ID do objeto interno se estiver presente para evitar redundância
    if (payload.agent.id) delete (payload.agent as any).id;

    return this.makeRequest<UazapiAgent>(
      '/agent/edit',
      'POST',
      payload,
      instanceToken
    );
  }

  // Deletar agente
  async deleteAgent(instanceToken: string, agentId: string): Promise<void> {
    await this.makeRequest(
      '/agent/delete',
      'POST',
      { id: agentId },
      instanceToken
    );
  }

  // ========================================
  // Base de Conhecimento (RAG)
  // ========================================

  // Listar conhecimentos
  async listKnowledge(instanceToken: string): Promise<UazapiKnowledge[]> {
    return this.makeRequest<UazapiKnowledge[]>(
      '/knowledge/list',
      'GET',
      undefined,
      instanceToken
    );
  }

  // Criar/Editar conhecimento
  async editKnowledge(instanceToken: string, knowledge: any): Promise<UazapiKnowledge> {
    const payload = {
      id: knowledge.id || '',
      delete: false,
      knowledge: {
        ...knowledge
      }
    };
    if (payload.knowledge.id) delete (payload.knowledge as any).id;

    return this.makeRequest<UazapiKnowledge>(
      '/knowledge/edit',
      'POST',
      payload,
      instanceToken
    );
  }

  // Deletar conhecimento
  async deleteKnowledge(instanceToken: string, knowledgeId: string): Promise<void> {
    await this.makeRequest(
      '/knowledge/delete',
      'POST',
      { id: knowledgeId },
      instanceToken
    );
  }

  // Atualizar configurações globais da instância (Chatbot/OpenAI Key)
  async updateInstanceChatbotSettings(instanceToken: string, settings: {
    openai_apikey?: string;
    openai_base_url?: string;
    chatbot_enabled?: boolean;
    chatbot_ignoreGroups?: boolean;
  }): Promise<void> {
    await this.makeRequest(
      '/instance/updatechatbotsettings',
      'POST',
      settings,
      instanceToken
    );
  }

  // ========================================
  // Triggers (Gatilhos)
  // ========================================

  // Listar triggers
  async listTriggers(instanceToken: string): Promise<UazapiTrigger[]> {
    return this.makeRequest<UazapiTrigger[]>(
      '/trigger/list',
      'GET',
      undefined,
      instanceToken
    );
  }

  // Criar/Editar trigger
  async editTrigger(instanceToken: string, trigger: any): Promise<UazapiTrigger> {
    const payload = {
      id: trigger.id || '',
      delete: false,
      trigger: {
        ...trigger
      }
    };
    if (payload.trigger.id) delete (payload.trigger as any).id;

    return this.makeRequest<UazapiTrigger>(
      '/trigger/edit',
      'POST',
      payload,
      instanceToken
    );
  }

  // Deletar trigger
  async deleteTrigger(instanceToken: string, triggerId: string): Promise<void> {
    await this.makeRequest(
      '/trigger/delete',
      'POST',
      { id: triggerId },
      instanceToken
    );
  }

  // ========================================
  // Funções Customizadas
  // ========================================

  // Listar funções
  async listFunctions(instanceToken: string): Promise<UazapiFunction[]> {
    return this.makeRequest<UazapiFunction[]>(
      '/function/list',
      'GET',
      undefined,
      instanceToken
    );
  }

  // Criar/Editar função
  async editFunction(instanceToken: string, func: any): Promise<UazapiFunction> {
    const payload = {
      id: func.id || '',
      delete: false,
      function: {
        ...func
      }
    };
    if (payload.function.id) delete (payload.function as any).id;

    return this.makeRequest<UazapiFunction>(
      '/function/edit',
      'POST',
      payload,
      instanceToken
    );
  }

  // Deletar função
  async deleteFunction(instanceToken: string, functionId: string): Promise<void> {
    await this.makeRequest(
      '/function/delete',
      'POST',
      { id: functionId },
      instanceToken
    );
  }

  // ========================================
  // Sincronização Supabase <-> Uazapi
  // ========================================

  // Sincronizar agente do Supabase para Uazapi
  async syncAgentToUazapi(agentConfigId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Buscar configuração do agente no Supabase
      const { data: agentConfig, error: fetchError } = await supabase
        .from('uazapi_agent_configs')
        .select(`
          *,
          whatsapp_instances(uazapi_token),
          system_prompts(system_prompt)
        `)
        .eq('id', agentConfigId)
        .single();

      if (fetchError || !agentConfig) {
        throw new Error(`Agent config not found: ${fetchError?.message}`);
      }

      // 2. Buscar Configuração Global (Cérebro compartilhado)
      const { data: globalConfig } = await supabase
        .from('uazapi_agent_configs')
        .select(`
          *,
          system_prompts(system_prompt)
        `)
        .eq('is_global', true)
        .limit(1)
        .maybeSingle();

      // Se for global, não faz nada (já está salvo como template)
      if (agentConfig.is_global) {
        return { success: true };
      }

      let instanceToken = agentConfig.whatsapp_instances?.uazapi_token;

      if (!instanceToken) {
        // Tentar buscar a primeira instância do tenant se não estiver vinculada
        const { data: firstInstance } = await supabase
          .from('whatsapp_instances')
          .select('id, uazapi_token')
          .eq('tenant_id', agentConfig.tenant_id)
          .eq('status', 'connected')
          .limit(1)
          .maybeSingle();

        if (firstInstance) {
          instanceToken = firstInstance.uazapi_token;
          // Salvar o vínculo para futuras operações
          await supabase
            .from('uazapi_agent_configs')
            .update({ instance_id: firstInstance.id })
            .eq('id', agentConfigId);
        }
      }

      if (!instanceToken) {
        throw new Error('Instância de WhatsApp não vinculada. Certifique-se de que a empresa conectou um WhatsApp em Automação.');
      }

      // 3. Preparar dados do agente para Uazapi (Mesclando Global + Local)
      // Prioridade técnica para o Global (Config do Developer)
      // Prioridade de identificação para o Local (Nome da empresa)
      const technicalSource = globalConfig || agentConfig;
      const uazapiAgent: any = {
        name: agentConfig.name || technicalSource.name,
        provider: this.mapProviderToUazapi(technicalSource.provider),
        model: technicalSource.model,
        apikey: technicalSource.api_key_encrypted,
        openaikey: technicalSource.api_key_encrypted, // Campo para RAG
        basePrompt: technicalSource.system_prompts?.system_prompt || technicalSource.custom_instructions || '',
        maxTokens: technicalSource.max_tokens || 1024,
        temperature: Math.round((technicalSource.temperature || 0.7) * 100),
        diversityLevel: 50,
        frequencyPenalty: 0,
        presencePenalty: 0,
        contextTimeWindow_hours: 24,
        contextMaxMessages: 50,
        contextMinMessages: 1,
        readMessages: true,
        typingDelay_seconds: 2,
        maxMessageLength: 4000,
        signMessages: false
      };

      // Campos extras removidos do Agente pois agora usamos openai_base_url na Instância

      if (agentConfig.uazapi_agent_id) {
        uazapiAgent.id = agentConfig.uazapi_agent_id;
      }

      // 4. Sincronizar também as configurações de instância (OpenAI Key para RAG/Vetorização)
      // Isso resolve o erro "OpenAI API key is empty in database" durante a vetorização
      try {
        await this.updateInstanceChatbotSettings(instanceToken, {
          openai_apikey: technicalSource.api_key_encrypted,
          chatbot_enabled: true,
          chatbot_ignoreGroups: true
        });
        console.log('Instance chatbot settings updated successfully');
      } catch (instError) {
        console.warn('Non-critical: Failed to update instance chatbot settings:', instError);
        // Não falhamos a sincronização principal por isso, mas logamos
      }

      // 5. Criar/atualizar agente na Uazapi
      const uazapiResponse = await this.editAgent(instanceToken, uazapiAgent);

      // 4. Atualizar IDs de sincronização no Supabase
      await supabase
        .from('uazapi_agent_configs')
        .update({
          uazapi_agent_id: uazapiResponse.id,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString(),
          sync_error: null,
        })
        .eq('id', agentConfigId);

      // 5. Log de sincronização
      await this.logSync(
        agentConfig.tenant_id,
        'sync_agent',
        '/agent/edit',
        uazapiAgent,
        uazapiResponse,
        'success',
        null,
        agentConfigId
      );

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Logar a falha para depuração se tivermos os IDs básicos
      try {
        const { data: cfg } = await supabase.from('uazapi_agent_configs').select('tenant_id').eq('id', agentConfigId).single();
        if (cfg) {
          await this.logSync(
            cfg.tenant_id,
            'sync_agent_error',
            '/agent/edit',
            { agentConfigId },
            { error: errorMessage },
            'error',
            errorMessage,
            agentConfigId
          );
        }
      } catch (logErr) {
        console.error('Failed to log sync error:', logErr);
      }

      // Atualizar status de erro
      await supabase
        .from('uazapi_agent_configs')
        .update({
          sync_status: 'error',
          sync_error: errorMessage,
        })
        .eq('id', agentConfigId);

      return { success: false, error: errorMessage };
    }
  }

  // Sincronizar trigger do Supabase para Uazapi
  async syncTriggerToUazapi(agentConfigId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Buscar configuração do agente para pegar o instance token
      const { data: agentConfig, error: fetchError } = await supabase
        .from('uazapi_agent_configs')
        .select(`
          *,
          whatsapp_instances(uazapi_token)
        `)
        .eq('id', agentConfigId)
        .single();

      if (fetchError || !agentConfig) {
        throw new Error(`Agent config not found for trigger sync: ${fetchError?.message}`);
      }

      const instanceToken = agentConfig.whatsapp_instances?.uazapi_token;
      if (!instanceToken) {
        throw new Error('Instância de WhatsApp não vinculada.');
      }

      if (!agentConfig.uazapi_agent_id) {
        throw new Error('Agente não sincronizado. Sincronize o robô primeiro.');
      }

      // 2. Preparar trigger (Padrão: Escutar saudações comuns se ativo)
      const uazapiTrigger: any = {
        active: true,
        type: 'agent',
        agent_id: agentConfig.uazapi_agent_id,
        ignoreGroups: true,
        priority: 10, // Prioridade mais alta
        wordsToStart: 'oi|ola|olá|bom dia|boa tarde|boa noite|ajuda|suporte|iniciar|menu|.*'
      };

      // 3. Criar/atualizar trigger na Uazapi
      const triggerResponse = await this.editTrigger(instanceToken, uazapiTrigger);

      // 4. Log
      await this.logSync(
        agentConfig.tenant_id,
        'sync_trigger',
        '/trigger/edit',
        uazapiTrigger,
        triggerResponse,
        'success',
        null,
        agentConfigId
      );

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Tentar logar erro se possível
      try {
        const { data: config } = await supabase.from('uazapi_agent_configs').select('tenant_id').eq('id', agentConfigId).single();
        if (config) {
          await this.logSync(
            config.tenant_id,
            'sync_trigger',
            '/trigger/edit',
            null,
            null,
            'error',
            errorMessage,
            agentConfigId
          );
        }
      } catch (e) { }

      return { success: false, error: errorMessage };
    }
  }

  // Sincronizar conhecimento do Supabase para Uazapi
  async syncKnowledgeToUazapi(knowledgeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Buscar conhecimento no Supabase
      const { data: knowledge, error: fetchError } = await supabase
        .from('uazapi_knowledge')
        .select(`
          *,
          uazapi_agent_configs!inner(
            uazapi_agent_id,
            whatsapp_instances(uazapi_token)
          )
        `)
        .eq('id', knowledgeId)
        .single();

      if (fetchError || !knowledge) {
        throw new Error(`Knowledge not found: ${fetchError?.message}`);
      }

      let instanceToken = knowledge.uazapi_agent_configs?.whatsapp_instances?.uazapi_token;
      if (!instanceToken) {
        // Tentar buscar instância fallback
        const { data: firstInstance } = await supabase
          .from('whatsapp_instances')
          .select('id, uazapi_token')
          .eq('tenant_id', knowledge.tenant_id)
          .eq('status', 'connected')
          .limit(1)
          .maybeSingle();

        if (firstInstance) {
          instanceToken = firstInstance.uazapi_token;
          // Salva vínculo no agente para não precisar repetir
          if (knowledge.agent_config_id) {
            await supabase
              .from('uazapi_agent_configs')
              .update({ instance_id: firstInstance.id })
              .eq('id', knowledge.agent_config_id);
          }
        }
      }

      if (!instanceToken) {
        // Marcamos como 'pending_instance' em vez de erro fatal para a UX ser melhor
        await supabase
          .from('uazapi_knowledge')
          .update({
            sync_status: 'pending_instance',
            sync_error: 'Aguardando vinculação de WhatsApp para sincronizar.',
          })
          .eq('id', knowledgeId);

        return { success: false, error: 'WhatsApp não vinculado' };
      }

      // 2. Preparar dados do conhecimento para Uazapi
      const uazapiKnowledge: Partial<UazapiKnowledge> = {
        id: knowledge.uazapi_knowledge_id || undefined,
        tittle: knowledge.title, // Note: API typo
        content: knowledge.content,
        active: true,
        priority: 0,
      };

      // 3. Criar/atualizar conhecimento na Uazapi
      const uazapiResponse = await this.editKnowledge(instanceToken, uazapiKnowledge);

      // 4. Atualizar IDs de sincronização no Supabase
      await supabase
        .from('uazapi_knowledge')
        .update({
          uazapi_knowledge_id: uazapiResponse.id,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString(),
          sync_error: null,
          is_vectorized: uazapiResponse.isVectorized,
          vector_status: uazapiResponse.vectorStatus,
        })
        .eq('id', knowledgeId);

      // 5. Log de sincronização
      await this.logSync(
        knowledge.tenant_id,
        'sync_knowledge',
        '/knowledge/edit',
        uazapiKnowledge,
        uazapiResponse,
        'success',
        null,
        null,
        knowledgeId
      );

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await supabase
        .from('uazapi_knowledge')
        .update({
          sync_status: 'error',
          sync_error: errorMessage,
        })
        .eq('id', knowledgeId);

      return { success: false, error: errorMessage };
    }
  }

  // Criar trigger para ativar agente em todas as mensagens
  async createDefaultTrigger(
    instanceToken: string,
    agentId: string,
    configId: string,
    tenantId: string
  ): Promise<{ success: boolean; triggerId?: string; error?: string }> {
    try {
      const trigger: Partial<UazapiTrigger> = {
        type: 'all',
        agentId: agentId,
        active: true,
      };

      const response = await this.editTrigger(instanceToken, trigger);

      // Atualizar config com ID do trigger
      await supabase
        .from('uazapi_agent_configs')
        .update({ uazapi_trigger_id: response.id })
        .eq('id', configId);

      // Log
      await this.logSync(
        tenantId,
        'create_trigger',
        '/trigger/edit',
        trigger,
        response,
        'success',
        null,
        configId
      );

      return { success: true, triggerId: response.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  // ========================================
  // Helpers
  // ========================================

  // Mapear provider do Supabase para formato Uazapi
  private mapProviderToUazapi(provider: string): 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'custom' {
    const providerMap: Record<string, 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'custom'> = {
      'openrouter': 'openai', // Mapear para openai e usar openai_base_url na instância
      'openai': 'openai',
      'anthropic': 'anthropic',
      'gemini': 'gemini',
      'google': 'gemini',
      'deepseek': 'deepseek',
    };
    return providerMap[provider.toLowerCase()] || 'openai';
  }

  // Registrar log de sincronização
  private async logSync(
    tenantId: string,
    operation: string,
    endpoint: string,
    requestPayload: any,
    responsePayload: any,
    status: 'success' | 'error',
    errorMessage: string | null,
    agentConfigId?: string | null,
    knowledgeId?: string | null
  ): Promise<void> {
    await supabase.from('uazapi_sync_log').insert({
      tenant_id: tenantId,
      agent_config_id: agentConfigId,
      knowledge_id: knowledgeId,
      operation,
      endpoint,
      request_payload: requestPayload,
      response_payload: responsePayload,
      status,
      error_message: errorMessage,
    });
  }
}

// ========================================
// AgentConfigService - CRUD no Supabase
// ========================================

export class AgentConfigService {
  private chatbotService: UazapiChatbotService;

  constructor() {
    this.chatbotService = new UazapiChatbotService();
  }

  // Obter tenant_id do usuário atual
  private async getCurrentTenantId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_id', user.id)
      .single();

    if (error || !data?.tenant_id) {
      throw new Error('Tenant not found for user');
    }
    return data.tenant_id;
  }

  // Obter configuração ativa para o tenant
  async getAgentConfigForTenant(): Promise<AgentConfigData | null> {
    const tenantId = await this.getCurrentTenantId();

    const { data, error } = await supabase
      .from('uazapi_agent_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_global', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) return data[0];
    return this.applyGlobalToTenant(tenantId);
  }

  // Aplicar config global a um tenant
  async applyGlobalToTenant(tenantId: string): Promise<AgentConfigData | null> {
    const globalConfig = await this.getGlobalConfig();
    if (!globalConfig) return null;

    const { data, error } = await supabase
      .from('uazapi_agent_configs')
      .insert({
        tenant_id: tenantId,
        instance_id: null,
        is_global: false,
        name: globalConfig.name,
        provider: globalConfig.provider,
        model: globalConfig.model,
        api_key_encrypted: (globalConfig as any).api_key_encrypted,
        system_prompt_id: globalConfig.system_prompt_id,
        custom_instructions: globalConfig.custom_instructions,
        temperature: globalConfig.temperature,
        max_tokens: globalConfig.max_tokens,
        audio_fallback_message: globalConfig.audio_fallback_message,
        image_fallback_message: globalConfig.image_fallback_message,
        transfer_on_image: globalConfig.transfer_on_image,
        is_active: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error applying global config to tenant:', error);
      return null;
    }
    return data;
  }

  // Listar configurações de agente do tenant
  async listAgentConfigs(): Promise<AgentConfigData[]> {
    const tenantId = await this.getCurrentTenantId();

    const { data, error } = await supabase
      .from('uazapi_agent_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Obter configuração por instância
  async getAgentConfigByInstance(instanceId: string): Promise<AgentConfigData | null> {
    const { data, error } = await supabase
      .from('uazapi_agent_configs')
      .select('*')
      .eq('instance_id', instanceId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }

  // Criar ou atualizar configuração de agente
  async upsertAgentConfig(config: Omit<AgentConfigData, 'tenant_id'>): Promise<AgentConfigData> {
    const tenantId = await this.getCurrentTenantId();

    const { data, error } = await supabase
      .from('uazapi_agent_configs')
      .upsert({
        ...config,
        tenant_id: tenantId,
      }, {
        onConflict: 'tenant_id,instance_id',
      })
      .select()
      .single();

    if (error) throw error;

    // Sincronizar com Uazapi se ativo
    if (data.is_active) {
      await this.chatbotService.syncAgentToUazapi(data.id);
    }

    return data;
  }

  // Ativar/Desativar agente
  async toggleAgentActive(configId: string, active: boolean): Promise<void> {
    const { error } = await supabase
      .from('uazapi_agent_configs')
      .update({ is_active: active })
      .eq('id', configId);

    if (error) throw error;

    // Sincronizar com Uazapi
    await this.chatbotService.syncAgentToUazapi(configId);
  }

  // Deletar configuração
  async deleteAgentConfig(configId: string): Promise<void> {
    const { data: config, error: fetchError } = await supabase
      .from('uazapi_agent_configs')
      .select('uazapi_agent_id, uazapi_trigger_id, whatsapp_instances(uazapi_token)')
      .eq('id', configId)
      .single();

    if (fetchError) throw fetchError;

    // Deletar na Uazapi primeiro
    if ((config as any)?.whatsapp_instances?.uazapi_token) {
      const token = (config as any).whatsapp_instances.uazapi_token;

      if (config.uazapi_trigger_id) {
        await this.chatbotService.deleteTrigger(token, config.uazapi_trigger_id);
      }
      if (config.uazapi_agent_id) {
        await this.chatbotService.deleteAgent(token, config.uazapi_agent_id);
      }
    }

    // Deletar no Supabase
    const { error } = await supabase
      .from('uazapi_agent_configs')
      .delete()
      .eq('id', configId);

    if (error) throw error;
  }

  // ========================================
  // CONFIG GLOBAL (Centralizada pelo Owner)
  // ========================================

  // Obter configuração global (template para todos os clientes)
  async getGlobalConfig(): Promise<AgentConfigData | null> {
    const { data, error } = await supabase
      .from('uazapi_agent_configs')
      .select('*')
      .eq('is_global', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }

  // Salvar configuração global
  async upsertGlobalConfig(config: Omit<AgentConfigData, 'tenant_id' | 'instance_id'>): Promise<AgentConfigData> {
    const tenantId = await this.getCurrentTenantId();

    // Verificar se já existe config global
    const existing = await this.getGlobalConfig();

    const { data, error } = await supabase
      .from('uazapi_agent_configs')
      .upsert({
        id: existing?.id,
        ...config,
        tenant_id: tenantId,
        instance_id: null,
        is_global: true,
      }, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Aplicar config global a uma instância específica (quando cliente conecta)
  // NÃO altera instâncias existentes - apenas cria nova config para a instância
  async applyGlobalToInstance(instanceId: string): Promise<AgentConfigData | null> {
    // Buscar config global
    const globalConfig = await this.getGlobalConfig();
    if (!globalConfig) return null;

    // Verificar se instância já tem config
    const existingInstanceConfig = await this.getAgentConfigByInstance(instanceId);
    if (existingInstanceConfig) {
      // Instância já tem config, não sobrescrever
      return existingInstanceConfig;
    }

    const tenantId = await this.getCurrentTenantId();

    // Criar nova config para a instância baseada na global
    const { data, error } = await supabase
      .from('uazapi_agent_configs')
      .insert({
        tenant_id: tenantId,
        instance_id: instanceId,
        is_global: false,
        name: globalConfig.name,
        provider: globalConfig.provider,
        model: globalConfig.model,
        api_key_encrypted: (globalConfig as any).api_key_encrypted,
        system_prompt_id: globalConfig.system_prompt_id,
        custom_instructions: globalConfig.custom_instructions,
        temperature: globalConfig.temperature,
        max_tokens: globalConfig.max_tokens,
        audio_fallback_message: globalConfig.audio_fallback_message,
        image_fallback_message: globalConfig.image_fallback_message,
        transfer_on_image: globalConfig.transfer_on_image,
        is_active: false, // Inicia desativado até cliente fazer upload de conhecimento
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// ========================================
// KnowledgeService - CRUD para base de conhecimento
// ========================================

export class KnowledgeService {
  private chatbotService: UazapiChatbotService;

  constructor() {
    this.chatbotService = new UazapiChatbotService();
  }

  // Obter tenant_id do usuário atual
  private async getCurrentTenantId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_id', user.id)
      .single();

    if (error || !data?.tenant_id) {
      throw new Error('Tenant not found for user');
    }
    return data.tenant_id;
  }

  // Listar conhecimentos de um agente
  async listKnowledge(agentConfigId: string): Promise<KnowledgeData[]> {
    const { data, error } = await supabase
      .from('uazapi_knowledge')
      .select('*')
      .eq('agent_config_id', agentConfigId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Criar conhecimento
  async createKnowledge(knowledge: Omit<KnowledgeData, 'tenant_id' | 'id'>, customTenantId?: string): Promise<KnowledgeData> {
    const tenantId = customTenantId || await this.getCurrentTenantId();

    const { data, error } = await supabase
      .from('uazapi_knowledge')
      .insert({
        ...knowledge,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;

    // Sincronizar com Uazapi (tenta, mas não bloqueia se falhar - status mudará para error)
    try {
      await this.chatbotService.syncKnowledgeToUazapi(data.id);
    } catch (e) {
      console.warn('Initial sync failed, record created with pending/error status');
    }

    return data;
  }

  // Atualizar conhecimento
  async updateKnowledge(knowledgeId: string, updates: Partial<KnowledgeData>): Promise<KnowledgeData> {
    const { data, error } = await supabase
      .from('uazapi_knowledge')
      .update(updates)
      .eq('id', knowledgeId)
      .select()
      .single();

    if (error) throw error;

    // Sincronizar com Uazapi
    await this.chatbotService.syncKnowledgeToUazapi(data.id);

    return data;
  }

  // Deletar conhecimento
  async deleteKnowledge(knowledgeId: string): Promise<void> {
    const { data: knowledge, error: fetchError } = await supabase
      .from('uazapi_knowledge')
      .select(`
        uazapi_knowledge_id,
        uazapi_agent_configs(whatsapp_instances(uazapi_token))
      `)
      .eq('id', knowledgeId)
      .single();

    if (fetchError) throw fetchError;

    // Deletar na Uazapi primeiro
    if ((knowledge as any)?.uazapi_agent_configs?.whatsapp_instances?.uazapi_token && knowledge.uazapi_knowledge_id) {
      await this.chatbotService.deleteKnowledge(
        (knowledge as any).uazapi_agent_configs.whatsapp_instances.uazapi_token,
        knowledge.uazapi_knowledge_id
      );
    }

    // Deletar no Supabase
    const { error } = await supabase
      .from('uazapi_knowledge')
      .delete()
      .eq('id', knowledgeId);

    if (error) throw error;
  }

  // Upload de documento para conhecimento (extrair texto e criar)
  async uploadDocumentAsKnowledge(
    agentConfigId: string,
    file: File,
    title: string,
    category: string = 'general',
    customTenantId?: string
  ): Promise<KnowledgeData> {
    // Extrair texto do arquivo
    const content = await this.extractTextFromFile(file);

    // Criar conhecimento com o conteúdo extraído
    return this.createKnowledge({
      agent_config_id: agentConfigId,
      title,
      content,
      category,
      keywords: [],
    }, customTenantId);
  }

  // Extrair texto de diferentes tipos de arquivo
  private async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;

    if (fileType === 'text/plain') {
      return await file.text();
    }

    if (fileType === 'application/json') {
      const text = await file.text();
      return JSON.stringify(JSON.parse(text), null, 2);
    }

    if (fileType === 'application/pdf') {
      try {
        // Carregar PDF.js dinamicamente via CDN se não estiver disponível
        if (!(window as any).pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          document.head.appendChild(script);
          await new Promise((resolve) => { script.onload = resolve; });
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const pdfjsLib = (window as any).pdfjsLib;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
        }

        return fullText.trim() || 'O PDF parece não conter texto extraível.';
      } catch (error) {
        console.error('PDF extraction failed:', error);
        throw new Error('Falha ao extrair texto do PDF. Tente copiar e colar o texto manualmente.');
      }
    }

    throw new Error(`Tipo de arquivo não suportado: ${fileType}. Use .txt, .json ou .pdf`);
  }
}

// Instâncias singleton para uso global
export const uazapiChatbotService = new UazapiChatbotService();
export const agentConfigService = new AgentConfigService();
export const knowledgeService = new KnowledgeService();
