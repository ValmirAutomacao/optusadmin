// Sistema Completo de Automação WhatsApp
import { supabase } from './supabase';
import { AIAgentService } from './aiAgents';
import { CompanyDocumentService } from './documentUpload';
import { SystemPromptService } from './systemPrompts';
import { UazapiService } from './uazapi';

// Types para automação
interface WhatsappMessage {
  id: string;
  whatsapp_instance_id: string;
  phone_number: string;
  contact_name?: string;
  message_type: 'text' | 'image' | 'audio' | 'document' | 'location';
  content: string;
  is_from_contact: boolean;
  ai_processed: boolean;
  ai_response?: string;
  conversation_id: string;
  created_at: string;
}

interface WhatsappConversation {
  id: string;
  whatsapp_instance_id: string;
  phone_number: string;
  contact_name?: string;
  status: 'active' | 'waiting_human' | 'completed' | 'abandoned';
  context: Record<string, any>; // Contexto da conversa (nome, serviço, etc.)
  last_activity: string;
  created_at: string;
  human_transferred_at?: string;
  human_transferred_by?: string;
}

interface ConversationContext {
  customer_name?: string;
  customer_phone?: string;
  service_interest?: string;
  appointment_date?: string;
  appointment_time?: string;
  additional_info?: string;
  stage: 'greeting' | 'collecting_info' | 'scheduling' | 'confirming' | 'completed' | 'human_transfer';
}

interface AutomationResponse {
  should_respond: boolean;
  response_text?: string;
  actions?: Array<{
    type: 'schedule_appointment' | 'send_info' | 'transfer_human' | 'send_menu';
    data?: any;
  }>;
  update_context?: Partial<ConversationContext>;
}

// Classe principal para automação completa
export class WhatsappAutomationService {
  private uazapi: UazapiService;

  constructor() {
    this.uazapi = new UazapiService();
  }

  /**
   * 📨 Processar mensagem recebida via webhook
   */
  static async processIncomingMessage(webhookData: {
    instanceId: string;
    from: string;
    body: string;
    type: string;
    timestamp: number;
  }): Promise<void> {
    try {
      // 1. Validar instância
      const instance = await this.validateInstance(webhookData.instanceId);
      if (!instance) {
        console.error('Instância não encontrada:', webhookData.instanceId);
        return;
      }

      // 2. Salvar mensagem no banco
      const message = await this.saveMessage({
        whatsapp_instance_id: instance.id,
        phone_number: webhookData.from,
        content: webhookData.body,
        message_type: webhookData.type as any,
        is_from_contact: true,
        ai_processed: false
      });

      // 3. Obter ou criar conversa
      const conversation = await this.getOrCreateConversation(
        instance.id,
        webhookData.from
      );

      // 4. Verificar se deve processar automaticamente
      if (conversation.status === 'waiting_human') {
        // Se está aguardando humano, não processar
        console.log('Conversa aguardando atendimento humano');
        return;
      }

      // 5. Processar com IA e RAG
      const automationResponse = await this.generateAutomatedResponse(
        instance.tenant_id,
        webhookData.body,
        conversation
      );

      // 6. Executar resposta automática
      if (automationResponse.should_respond && automationResponse.response_text) {
        await this.sendAutomatedResponse(
          instance,
          webhookData.from,
          automationResponse.response_text,
          message.id
        );
      }

      // 7. Executar ações adicionais
      if (automationResponse.actions) {
        await this.executeActions(
          instance,
          conversation,
          automationResponse.actions
        );
      }

      // 8. Atualizar contexto da conversa
      if (automationResponse.update_context) {
        await this.updateConversationContext(
          conversation.id,
          automationResponse.update_context
        );
      }

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  /**
   * 🔍 Validar instância WhatsApp
   */
  private static async validateInstance(uazapiInstanceId: string) {
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('id, tenant_id, name')
      .eq('uazapi_instance_id', uazapiInstanceId)
      .eq('status', 'connected')
      .single();

    if (error) {
      console.error('Erro ao validar instância:', error);
      return null;
    }

    return data;
  }

  /**
   * 💾 Salvar mensagem no banco
   */
  private static async saveMessage(data: Omit<WhatsappMessage, 'id' | 'created_at' | 'conversation_id'>) {
    // Criar conversation_id baseado na instância + telefone
    const conversationId = `${data.whatsapp_instance_id}_${data.phone_number}`;

    const { data: message, error } = await supabase
      .from('whatsapp_messages')
      .insert({
        ...data,
        conversation_id: conversationId
      })
      .select()
      .single();

    if (error) throw error;
    return message;
  }

  /**
   * 💬 Obter ou criar conversa
   */
  private static async getOrCreateConversation(
    instanceId: string,
    phoneNumber: string
  ): Promise<WhatsappConversation> {
    // Tentar obter conversa existente
    const { data: existing } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('whatsapp_instance_id', instanceId)
      .eq('phone_number', phoneNumber)
      .eq('status', 'active')
      .single();

    if (existing) {
      // Atualizar última atividade
      await supabase
        .from('whatsapp_conversations')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', existing.id);

      return existing;
    }

    // Criar nova conversa
    const { data: newConversation, error } = await supabase
      .from('whatsapp_conversations')
      .insert({
        whatsapp_instance_id: instanceId,
        phone_number: phoneNumber,
        status: 'active',
        context: {
          stage: 'greeting'
        },
        last_activity: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return newConversation;
  }

  /**
   * 🤖 Gerar resposta automatizada com IA + RAG
   */
  private static async generateAutomatedResponse(
    tenantId: string,
    userMessage: string,
    conversation: WhatsappConversation
  ): Promise<AutomationResponse> {
    try {
      // 1. Buscar informações relevantes nos documentos (RAG)
      const documentResults = await CompanyDocumentService.searchDocuments(
        userMessage,
        undefined, // Buscar em todas as categorias
        3 // Top 3 resultados
      );

      // 2. Obter dados da empresa do tenant
      const tenantData = await this.getTenantData(tenantId);

      // 3. Preparar contexto adicional
      const ragContext = documentResults.length > 0
        ? `\n\nINFORMAÇÕES DA EMPRESA ENCONTRADAS:\n${documentResults.map(r => r.content_chunk).join('\n\n')}`
        : '';

      const conversationHistory = await this.getRecentMessages(conversation.id, 5);

      const contextualMessage = `
MENSAGEM DO CLIENTE: ${userMessage}

HISTÓRICO DA CONVERSA:
${conversationHistory}

CONTEXTO ATUAL: ${JSON.stringify(conversation.context)}

${ragContext}

INSTRUÇÕES ESPECÍFICAS:
- Se o cliente está cumprimentando pela primeira vez, apresente-se e ofereça ajuda
- Se está perguntando sobre serviços, use as informações da empresa
- Se quer agendar, colete: nome, telefone, serviço e horário preferido
- Se a dúvida é complexa ou foge do escopo, ofereça transferir para humano
- Seja natural, amigável e profissional
- Sempre termine perguntando como pode ajudar mais
`;

      // 4. Processar com IA
      const aiResponse = await AIAgentService.processMessage(
        contextualMessage,
        tenantData
      );

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'Erro na IA');
      }

      // 5. Analisar resposta e determinar ações
      const actions = this.analyzeMessageForActions(userMessage, aiResponse.message || '');
      const contextUpdate = this.analyzeContextUpdate(userMessage, conversation.context);

      return {
        should_respond: true,
        response_text: aiResponse.message,
        actions,
        update_context: contextUpdate
      };

    } catch (error) {
      console.error('Erro na geração de resposta:', error);

      // Resposta de fallback
      return {
        should_respond: true,
        response_text: '🤖 Olá! Estou com um problema técnico no momento. Em breve um de nossos atendentes entrará em contato com você. Obrigado pela compreensão!',
        actions: [{
          type: 'transfer_human',
          data: { reason: 'technical_error' }
        }]
      };
    }
  }

  /**
   * 🏢 Obter dados da empresa (tenant)
   */
  private static async getTenantData(tenantId: string) {
    const { data, error } = await supabase
      .from('tenants')
      .select('nome, area_atuacao, servicos_disponiveis, endereco, telefone, horario_funcionamento')
      .eq('id', tenantId)
      .single();

    if (error) return {};

    return {
      empresa_nome: data.nome,
      area_atuacao: data.area_atuacao,
      servicos_disponiveis: data.servicos_disponiveis,
      endereco_empresa: data.endereco,
      telefone_empresa: data.telefone,
      horario_funcionamento: data.horario_funcionamento
    };
  }

  /**
   * 📜 Obter mensagens recentes da conversa
   */
  private static async getRecentMessages(conversationId: string, limit: number = 5): Promise<string> {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('content, is_from_contact, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return '';

    return data
      .reverse() // Ordem cronológica
      .map(msg => `${msg.is_from_contact ? 'Cliente' : 'Assistente'}: ${msg.content}`)
      .join('\n');
  }

  /**
   * 🎬 Analisar mensagem para identificar ações
   */
  private static analyzeMessageForActions(userMessage: string, aiResponse: string): Array<{
    type: 'schedule_appointment' | 'send_info' | 'transfer_human' | 'send_menu';
    data?: any;
  }> {
    const actions: any[] = [];
    const messageLower = userMessage.toLowerCase();

    // Detectar solicitação de agendamento
    if (messageLower.includes('agendar') ||
        messageLower.includes('marcar') ||
        messageLower.includes('consulta') ||
        messageLower.includes('horário')) {
      actions.push({
        type: 'schedule_appointment',
        data: { trigger: 'scheduling_request' }
      });
    }

    // Detectar solicitação de transferência para humano
    if (messageLower.includes('falar com') ||
        messageLower.includes('atendente') ||
        messageLower.includes('pessoa') ||
        aiResponse.includes('transferir')) {
      actions.push({
        type: 'transfer_human',
        data: { reason: 'customer_request' }
      });
    }

    return actions;
  }

  /**
   * 🔄 Analisar atualização de contexto
   */
  private static analyzeContextUpdate(
    userMessage: string,
    currentContext: Record<string, any>
  ): Partial<ConversationContext> {
    const updates: Partial<ConversationContext> = {};
    const messageLower = userMessage.toLowerCase();

    // Detectar nome do cliente
    if (messageLower.includes('meu nome é') ||
        messageLower.includes('me chamo') ||
        messageLower.includes('sou o') ||
        messageLower.includes('sou a')) {
      const nameMatch = userMessage.match(/(?:nome é|me chamo|sou o|sou a)\s+([a-záàâãéèêíìîóòôõúùûç\s]+)/i);
      if (nameMatch) {
        updates.customer_name = nameMatch[1].trim();
      }
    }

    // Detectar interesse em serviços
    if (messageLower.includes('gostaria') ||
        messageLower.includes('quero') ||
        messageLower.includes('preciso')) {
      updates.service_interest = userMessage;
    }

    return updates;
  }

  /**
   * 📤 Enviar resposta automatizada
   */
  private static async sendAutomatedResponse(
    instance: any,
    phoneNumber: string,
    responseText: string,
    originalMessageId: string
  ): Promise<void> {
    try {
      const uazapi = new UazapiService();

      // Enviar via Uazapi (implementar método sendMessage)
      await uazapi.sendMessage(instance.uazapi_token, {
        phone: phoneNumber,
        message: responseText
      });

      // Salvar resposta no banco
      await this.saveMessage({
        whatsapp_instance_id: instance.id,
        phone_number: phoneNumber,
        content: responseText,
        message_type: 'text',
        is_from_contact: false,
        ai_processed: true,
        ai_response: responseText
      });

      // Marcar mensagem original como processada
      await supabase
        .from('whatsapp_messages')
        .update({ ai_processed: true, ai_response: responseText })
        .eq('id', originalMessageId);

    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
    }
  }

  /**
   * ⚡ Executar ações identificadas
   */
  private static async executeActions(
    instance: any,
    conversation: WhatsappConversation,
    actions: Array<{ type: string; data?: any }>
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'schedule_appointment':
            await this.handleSchedulingFlow(instance, conversation);
            break;

          case 'transfer_human':
            await this.transferToHuman(conversation.id, action.data?.reason);
            break;

          case 'send_info':
            // Enviar informações específicas
            break;

          case 'send_menu':
            await this.sendServiceMenu(instance, conversation.phone_number);
            break;
        }
      } catch (error) {
        console.error(`Erro ao executar ação ${action.type}:`, error);
      }
    }
  }

  /**
   * 📅 Lidar com fluxo de agendamento
   */
  private static async handleSchedulingFlow(
    instance: any,
    conversation: WhatsappConversation
  ): Promise<void> {
    // Lógica para agendamento - integração com sistema existente
    // Por enquanto, apenas atualizar status
    await supabase
      .from('whatsapp_conversations')
      .update({
        context: {
          ...conversation.context,
          stage: 'scheduling'
        }
      })
      .eq('id', conversation.id);
  }

  /**
   * 👥 Transferir para atendimento humano
   */
  private static async transferToHuman(
    conversationId: string,
    reason?: string
  ): Promise<void> {
    await supabase
      .from('whatsapp_conversations')
      .update({
        status: 'waiting_human',
        human_transferred_at: new Date().toISOString(),
        context: {
          transfer_reason: reason || 'customer_request'
        }
      })
      .eq('id', conversationId);

    // TODO: Notificar equipe de atendimento
  }

  /**
   * 📋 Enviar menu de serviços
   */
  private static async sendServiceMenu(
    instance: any,
    phoneNumber: string
  ): Promise<void> {
    const menuMessage = `
📋 *NOSSOS SERVIÇOS*

1️⃣ Agendamento de consultas
2️⃣ Informações sobre tratamentos
3️⃣ Valores e formas de pagamento
4️⃣ Localização e horários
5️⃣ Falar com atendente

Digite o número da opção desejada ou descreva como posso ajudar! 😊
    `.trim();

    const uazapi = new UazapiService();
    await uazapi.sendMessage(instance.uazapi_token, {
      phone: phoneNumber,
      message: menuMessage
    });
  }

  /**
   * 🔄 Atualizar contexto da conversa
   */
  private static async updateConversationContext(
    conversationId: string,
    updates: Partial<ConversationContext>
  ): Promise<void> {
    const { data: current } = await supabase
      .from('whatsapp_conversations')
      .select('context')
      .eq('id', conversationId)
      .single();

    if (current) {
      await supabase
        .from('whatsapp_conversations')
        .update({
          context: {
            ...current.context,
            ...updates
          }
        })
        .eq('id', conversationId);
    }
  }

  /**
   * 📊 Obter estatísticas de automação
   */
  static async getAutomationStats(tenantId: string, days: number = 30) {
    try {
      const { data, error } = await supabase.rpc('get_automation_stats', {
        p_tenant_id: tenantId,
        p_days: days
      });

      if (error) throw error;
      return data[0] || {
        total_messages: 0,
        automated_responses: 0,
        human_transfers: 0,
        automation_rate: 0
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        total_messages: 0,
        automated_responses: 0,
        human_transfers: 0,
        automation_rate: 0
      };
    }
  }

  /**
   * 📱 Listar conversas ativas
   */
  static async getActiveConversations(tenantId: string) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          whatsapp_instances!inner(tenant_id, name)
        `)
        .eq('whatsapp_instances.tenant_id', tenantId)
        .in('status', ['active', 'waiting_human'])
        .order('last_activity', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erro ao listar conversas:', error);
      return [];
    }
  }
}

// Hook React para usar automação
export const useWhatsappAutomation = (tenantId?: string) => {
  const [conversations, setConversations] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const loadData = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const [conversationsData, statsData] = await Promise.all([
        WhatsappAutomationService.getActiveConversations(tenantId),
        WhatsappAutomationService.getAutomationStats(tenantId)
      ]);

      setConversations(conversationsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados de automação:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [tenantId]);

  return {
    conversations,
    stats,
    loading,
    loadData
  };
};

// Export tipos
export type {
  WhatsappMessage,
  WhatsappConversation,
  ConversationContext,
  AutomationResponse
};