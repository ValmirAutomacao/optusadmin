// Integração com recursos de Chatbot IA da API Uazapi
// Gerencia agentes, conhecimento (RAG), triggers e funções

import { supabase } from './supabase';

// Declaração de tipo para Vite env
declare const __UAZAPI_BASE_URL__: string | undefined;
const UAZAPI_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_UAZAPI_BASE_URL) || 'https://optus.uazapi.com';

// ========================================
// Types - API Uazapi Chatbot
// ========================================

export interface UazapiAgent {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'custom';
  model: string;
  apikey?: string;
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
  type: 'group' | 'contact' | 'all';
  agentId: string;
  groupJid?: string;
  contactJid?: string;
  keywords?: string[];
  active: boolean;
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
  api_key?: string;
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
// UazapiChatbotService - Gerencia sincronização
// ========================================

export class UazapiChatbotService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = UAZAPI_BASE_URL;
  }

  // Headers para requisições com token da instância
  private getInstanceHeaders(token: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Fazer requisição HTTP com tratamento de erro
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    headers: Record<string, string> = {},
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

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
      this.getInstanceHeaders(instanceToken)
    );
  }

  // Criar/Editar agente na Uazapi
  async editAgent(instanceToken: string, agent: Partial<UazapiAgent>): Promise<UazapiAgent> {
    return this.makeRequest<UazapiAgent>(
      '/agent/edit',
      'POST',
      this.getInstanceHeaders(instanceToken),
      agent
    );
  }

  // Deletar agente
  async deleteAgent(instanceToken: string, agentId: string): Promise<void> {
    await this.makeRequest(
      '/agent/delete',
      'POST',
      this.getInstanceHeaders(instanceToken),
      { id: agentId }
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
      this.getInstanceHeaders(instanceToken)
    );
  }

  // Criar/Editar conhecimento
  async editKnowledge(instanceToken: string, knowledge: Partial<UazapiKnowledge>): Promise<UazapiKnowledge> {
    return this.makeRequest<UazapiKnowledge>(
      '/knowledge/edit',
      'POST',
      this.getInstanceHeaders(instanceToken),
      knowledge
    );
  }

  // Deletar conhecimento
  async deleteKnowledge(instanceToken: string, knowledgeId: string): Promise<void> {
    await this.makeRequest(
      '/knowledge/delete',
      'POST',
      this.getInstanceHeaders(instanceToken),
      { id: knowledgeId }
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
      this.getInstanceHeaders(instanceToken)
    );
  }

  // Criar/Editar trigger
  async editTrigger(instanceToken: string, trigger: Partial<UazapiTrigger>): Promise<UazapiTrigger> {
    return this.makeRequest<UazapiTrigger>(
      '/trigger/edit',
      'POST',
      this.getInstanceHeaders(instanceToken),
      trigger
    );
  }

  // Deletar trigger
  async deleteTrigger(instanceToken: string, triggerId: string): Promise<void> {
    await this.makeRequest(
      '/trigger/delete',
      'POST',
      this.getInstanceHeaders(instanceToken),
      { id: triggerId }
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
      this.getInstanceHeaders(instanceToken)
    );
  }

  // Criar/Editar função
  async editFunction(instanceToken: string, func: Partial<UazapiFunction>): Promise<UazapiFunction> {
    return this.makeRequest<UazapiFunction>(
      '/function/edit',
      'POST',
      this.getInstanceHeaders(instanceToken),
      func
    );
  }

  // Deletar função
  async deleteFunction(instanceToken: string, functionId: string): Promise<void> {
    await this.makeRequest(
      '/function/delete',
      'POST',
      this.getInstanceHeaders(instanceToken),
      { id: functionId }
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
          whatsapp_instances!inner(uazapi_token),
          system_prompts(system_prompt)
        `)
        .eq('id', agentConfigId)
        .single();

      if (fetchError || !agentConfig) {
        throw new Error(`Agent config not found: ${fetchError?.message}`);
      }

      const instanceToken = agentConfig.whatsapp_instances.uazapi_token;
      if (!instanceToken) {
        throw new Error('Instance token not found');
      }

      // 2. Preparar dados do agente para Uazapi
      const uazapiAgent: Partial<UazapiAgent> = {
        id: agentConfig.uazapi_agent_id || undefined, // Criar novo se não existir
        name: agentConfig.name,
        provider: this.mapProviderToUazapi(agentConfig.provider),
        model: agentConfig.model,
        apikey: agentConfig.api_key_encrypted, // TODO: Decrypt
        basePrompt: agentConfig.system_prompts?.system_prompt || agentConfig.custom_instructions || '',
        maxTokens: agentConfig.max_tokens || 1024,
        temperature: Math.round((agentConfig.temperature || 0.7) * 100), // Convert 0-1 to 0-100
        contextTimeWindow_hours: 24,
        contextMaxMessages: 50,
        contextMinMessages: 1,
        readMessages: true,
        typingDelay_seconds: 2,
      };

      // 3. Criar/atualizar agente na Uazapi
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

      const instanceToken = knowledge.uazapi_agent_configs.whatsapp_instances.uazapi_token;
      if (!instanceToken) {
        throw new Error('Instance token not found');
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
      'openrouter': 'custom', // OpenRouter usa custom + apikey
      'openai': 'openai',
      'anthropic': 'anthropic',
      'gemini': 'gemini',
      'google': 'gemini',
      'deepseek': 'deepseek',
    };
    return providerMap[provider.toLowerCase()] || 'custom';
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
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
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
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
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
  async createKnowledge(knowledge: Omit<KnowledgeData, 'tenant_id' | 'id'>): Promise<KnowledgeData> {
    const tenantId = await this.getCurrentTenantId();

    const { data, error } = await supabase
      .from('uazapi_knowledge')
      .insert({
        ...knowledge,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;

    // Sincronizar com Uazapi
    await this.chatbotService.syncKnowledgeToUazapi(data.id);

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
    category: string = 'general'
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
    });
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

    // Para outros tipos, por enquanto retornar mensagem
    // TODO: Implementar extração de PDF, DOCX, etc.
    throw new Error(`Tipo de arquivo não suportado: ${fileType}. Use .txt ou .json`);
  }
}

// Instâncias singleton para uso global
export const uazapiChatbotService = new UazapiChatbotService();
export const agentConfigService = new AgentConfigService();
export const knowledgeService = new KnowledgeService();
