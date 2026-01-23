// Integração com API Uazapi para gerenciamento de instâncias WhatsApp
import { supabase } from './supabase'
import { InstanceProtectionService, CRITICAL_INSTANCE_ID } from './instanceProtection'
import { ConnectionLimitService } from './connectionLimits'

// Configurações da API Uazapi (usando variáveis de ambiente)
const UAZAPI_BASE_URL = import.meta.env.VITE_UAZAPI_BASE_URL || 'https://optus.uazapi.com'
const UAZAPI_ADMIN_TOKEN = import.meta.env.VITE_UAZAPI_ADMIN_TOKEN || '0TzblrcqZ04deiwH2kgLapvZuaI6fRws4sBba2E1Nwlw3rK2j4'

// Types para API Uazapi
interface UazapiInstance {
  id: string
  token: string
  status: 'disconnected' | 'connecting' | 'connected'
  name: string
  profileName?: string
  profilePicUrl?: string
  isBusiness?: boolean
  platform?: string
  qrcode?: string
  paircode?: string
  owner?: string
  created?: string
  updated?: string
  lastDisconnect?: string
  lastDisconnectReason?: string
}

interface CreateInstanceRequest {
  name: string
  systemName?: string
  adminField01?: string
  adminField02?: string
}

interface ConnectInstanceRequest {
  phone?: string // Se informado, usa PairCode. Se não, usa QRCode
}

interface WebhookConfig {
  url: string
  events: string[]
  excludeMessages?: string[]
  enabled?: boolean
}

interface SendMessageRequest {
  phone: string
  message: string
  type?: 'text' | 'image' | 'audio' | 'document'
  mediaUrl?: string
}

// Classe principal para integração
export class UazapiService {
  private baseUrl: string
  private adminToken: string

  constructor() {
    this.baseUrl = UAZAPI_BASE_URL
    this.adminToken = UAZAPI_ADMIN_TOKEN
  }

  // Headers padrão para requisições administrativas
  private getAdminHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'admintoken': this.adminToken
    }
  }

  // Headers para requisições com token da instância
  private getInstanceHeaders(token: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'token': token
    }
  }

  // Fazer requisições HTTP com tratamento de erro
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    headers: Record<string, string> = {},
    body?: any
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Uazapi Error (${response.status}): ${errorText}`)
      }

      return await response.json() as T
    } catch (error) {
      console.error('Uazapi Request Error:', error)
      throw error
    }
  }

  // 1. Criar nova instância
  async createInstance(data: CreateInstanceRequest): Promise<UazapiInstance> {
    const response = await this.makeRequest<{
      instance: UazapiInstance
      token: string
      response: string
    }>('/instance/init', 'POST', this.getAdminHeaders(), data)

    console.log('Resposta createInstance:', JSON.stringify(response, null, 2))

    // O token pode vir em diferentes lugares dependendo da versão da API
    const instanceToken = response.token || response.instance?.token

    if (!instanceToken) {
      console.error('Token não encontrado na resposta:', response)
      throw new Error('Token da instância não retornado pela API')
    }

    return {
      ...response.instance,
      token: instanceToken
    }
  }

  // 2. Conectar instância (gerar QRCode ou PairCode)
  async connectInstance(instanceToken: string, data?: ConnectInstanceRequest): Promise<{
    connected: boolean
    loggedIn: boolean
    instance: UazapiInstance
  }> {
    return await this.makeRequest(
      '/instance/connect',
      'POST',
      this.getInstanceHeaders(instanceToken),
      data
    )
  }

  // 3. Verificar status da instância
  async getInstanceStatus(instanceToken: string): Promise<{
    instance: UazapiInstance
    status: {
      connected: boolean
      loggedIn: boolean
      jid?: any
    }
  }> {
    return await this.makeRequest(
      '/instance/status',
      'GET',
      this.getInstanceHeaders(instanceToken)
    )
  }

  // 4. Configurar webhook
  async configureWebhook(instanceToken: string, config: WebhookConfig): Promise<any> {
    return await this.makeRequest(
      '/webhook',
      'POST',
      this.getInstanceHeaders(instanceToken),
      config
    )
  }

  // 5. Listar todas as instâncias (admin)
  async listAllInstances(): Promise<UazapiInstance[]> {
    return await this.makeRequest('/instance/all', 'GET', this.getAdminHeaders())
  }

  // 6. Deletar instância (COM PROTEÇÃO!)
  async deleteInstance(instanceId: string, instanceToken: string): Promise<{ response: string }> {
    // 🛡️ VERIFICAÇÃO CRÍTICA DE PROTEÇÃO
    await InstanceProtectionService.canDeleteInstance(instanceId);

    return await InstanceProtectionService.safeOperation(
      instanceId,
      'DELETE',
      () => this.makeRequest(
        '/instance',
        'DELETE',
        this.getInstanceHeaders(instanceToken)
      )
    );
  }

  // 7. Desconectar instância
  async disconnectInstance(instanceToken: string): Promise<{ response: string; instance: UazapiInstance }> {
    return await this.makeRequest(
      '/instance/disconnect',
      'POST',
      this.getInstanceHeaders(instanceToken)
    )
  }

  // 8. Enviar mensagem
  async sendMessage(instanceToken: string, data: SendMessageRequest): Promise<{ response: string; messageId?: string }> {
    const endpoint = data.type === 'text' || !data.type
      ? '/message/text'
      : `/message/${data.type}`;

    const payload = data.type === 'text' || !data.type
      ? { phone: data.phone, message: data.message }
      : { phone: data.phone, message: data.message, mediaUrl: data.mediaUrl };

    return await this.makeRequest(
      endpoint,
      'POST',
      this.getInstanceHeaders(instanceToken),
      payload
    )
  }
}

// Serviço principal para gerenciar instâncias WhatsApp
export class WhatsappInstanceService {
  private uazapi: UazapiService
  private webhookBaseUrl: string

  constructor() {
    this.uazapi = new UazapiService()
    // URL base para webhooks - será configurada via env
    this.webhookBaseUrl = import.meta.env.VITE_WEBHOOK_BASE_URL || 'https://seu-dominio.com/webhooks'
  }

  // Obter tenant_id do usuário logado
  private async getCurrentTenantId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Buscar tenant_id do usuário usando auth_id
    const { data: userData, error } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_id', user.id)
      .single()

    if (error) throw error
    return userData.tenant_id
  }

  // 1. Criar nova instância completa (fluxo automatizado)
  async createWhatsappInstance(data: {
    name: string
    phone?: string
    description?: string
  }): Promise<{
    instanceId: string
    qrcode?: string
    status: string
  }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Buscar dados do usuário incluindo o ID da tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('auth_id', user.id)
      .single()

    if (userError || !userData) {
      throw new Error('Erro ao obter dados do usuário')
    }

    const tenantId = userData.tenant_id
    const userId = userData.id // ID da tabela users, não auth.uid()

    // 🔢 VERIFICAR LIMITE DE CONEXÕES PRIMEIRO
    const limitCheck = await ConnectionLimitService.canCreateConnection(tenantId);
    if (!limitCheck.allowed) {
      throw new Error(`🚫 ${limitCheck.reason}\n\nUso atual: ${limitCheck.currentUsage}/${limitCheck.limit} conexões`);
    }

    let uazapiInstance: { id: string; token: string } | null = null
    let dbInstanceId: string | null = null

    try {
      // 1. Criar instância na Uazapi
      uazapiInstance = await this.uazapi.createInstance({
        name: data.name,
        systemName: 'optus',
        adminField01: tenantId,
        adminField02: userId
      })

      console.log('Instância criada na Uazapi:', uazapiInstance.id)

      // 2. Salvar no banco Supabase (SEMPRE salvar, mesmo se etapas seguintes falharem)
      const { data: dbInstance, error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          tenant_id: tenantId,
          name: data.name,
          phone: data.phone,
          description: data.description,
          uazapi_instance_id: uazapiInstance.id,
          uazapi_token: uazapiInstance.token,
          status: 'disconnected',
          created_by: userId
        })
        .select()
        .single()

      if (dbError) {
        console.error('Erro ao salvar no banco:', dbError)
        throw new Error(`Erro ao salvar instância: ${dbError.message}`)
      }

      dbInstanceId = dbInstance.id
      console.log('Instância salva no banco:', dbInstanceId)

      // 3. Tentar conectar instância (SEMPRE gerar QR Code - não enviar telefone)
      let qrcode: string | undefined

      try {
        // Não enviar telefone para forçar QR Code (WhatsApp não suporta paircode)
        const connectResult = await this.uazapi.connectInstance(uazapiInstance.token)

        qrcode = connectResult.instance?.qrcode

        // 4. Atualizar status no banco
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connecting',
            qrcode: qrcode
          })
          .eq('id', dbInstance.id)

        console.log('Conexão iniciada com sucesso')
      } catch (connectError) {
        console.warn('Aviso: Não foi possível iniciar conexão automática:', connectError)
        // Continuar mesmo com erro - instância foi criada
      }

      // 5. Tentar configurar webhook - não falhar se der erro
      try {
        const webhookUrl = `${this.webhookBaseUrl}/whatsapp/${dbInstance.id}`
        await this.uazapi.configureWebhook(uazapiInstance.token, {
          url: webhookUrl,
          events: ['connection', 'messages', 'messages_update'],
          excludeMessages: ['wasSentByApi'],
          enabled: true
        })

        await supabase
          .from('whatsapp_instances')
          .update({
            webhook_configured: true,
            webhook_url: webhookUrl
          })
          .eq('id', dbInstance.id)

        console.log('Webhook configurado com sucesso')
      } catch (webhookError) {
        console.warn('Aviso: Não foi possível configurar webhook:', webhookError)
        // Continuar mesmo com erro - webhook pode ser configurado depois
      }

      return {
        instanceId: dbInstance.id,
        qrcode: qrcode,
        status: qrcode ? 'connecting' : 'disconnected'
      }

    } catch (error) {
      console.error('Erro ao criar instância WhatsApp:', error)
      throw error
    }
  }

  // 2. Listar instâncias do tenant
  async listTenantInstances() {
    const tenantId = await getCurrentTenantId()

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // 3. Monitorar status de instância específica
  async checkInstanceStatus(instanceId: string): Promise<{
    status: string
    qrcode?: string
    profileName?: string
    connected: boolean
  }> {
    const tenantId = await getCurrentTenantId()

    // Buscar dados da instância no banco
    const { data: dbInstance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !dbInstance) throw new Error('Instância não encontrada')

    if (!dbInstance.uazapi_token) {
      throw new Error('Token da instância não encontrado')
    }

    try {
      // Consultar status atual na Uazapi
      const statusResult = await this.uazapi.getInstanceStatus(dbInstance.uazapi_token)

      // Atualizar dados no banco se houve mudança
      const updateData: any = {
        status: statusResult.instance.status,
        qrcode: statusResult.instance.qrcode || null
      }

      // Se conectou, salvar dados do perfil
      if (statusResult.status.connected && statusResult.instance.profileName) {
        updateData.profile_name = statusResult.instance.profileName
        updateData.profile_pic_url = statusResult.instance.profilePicUrl
        updateData.is_business = statusResult.instance.isBusiness || false
        updateData.platform = statusResult.instance.platform
        updateData.connected_at = new Date().toISOString()
      }

      await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('id', instanceId)

      return {
        status: statusResult.instance.status,
        qrcode: statusResult.instance.qrcode,
        profileName: statusResult.instance.profileName,
        connected: statusResult.status.connected
      }

    } catch (error) {
      console.error('Erro ao verificar status:', error)
      throw error
    }
  }

  // 4. Reconectar instância (gerar novo QR Code)
  async reconnectInstance(instanceId: string): Promise<{
    qrcode?: string
    status: string
  }> {
    const tenantId = await getCurrentTenantId()

    // Buscar dados da instância no banco
    const { data: dbInstance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !dbInstance) throw new Error('Instância não encontrada')

    if (!dbInstance.uazapi_token) {
      throw new Error('Token da instância não encontrado')
    }

    try {
      // Chamar API para gerar novo QR Code
      const connectResult = await this.uazapi.connectInstance(dbInstance.uazapi_token)

      const qrcode = connectResult.instance?.qrcode

      // Atualizar status no banco
      await supabase
        .from('whatsapp_instances')
        .update({
          status: 'connecting',
          qrcode: qrcode
        })
        .eq('id', instanceId)

      return {
        qrcode: qrcode,
        status: qrcode ? 'connecting' : 'disconnected'
      }

    } catch (error) {
      console.error('Erro ao reconectar instância:', error)
      throw error
    }
  }

  // 5. Deletar instância (COM PROTEÇÃO TOTAL!)
  async deleteWhatsappInstance(instanceId: string): Promise<void> {
    const tenantId = await getCurrentTenantId()

    const { data: dbInstance, error } = await supabase
      .from('whatsapp_instances')
      .select('uazapi_instance_id, uazapi_token')
      .eq('id', instanceId)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !dbInstance) throw new Error('Instância não encontrada')

    // 🛡️ VERIFICAÇÃO CRÍTICA ANTES DE QUALQUER OPERAÇÃO
    if (dbInstance.uazapi_instance_id) {
      await InstanceProtectionService.canDeleteInstance(dbInstance.uazapi_instance_id);
    }

    try {
      // Deletar na Uazapi (com proteção adicional)
      if (dbInstance.uazapi_token && dbInstance.uazapi_instance_id) {
        await this.uazapi.deleteInstance(dbInstance.uazapi_instance_id, dbInstance.uazapi_token)
      }

      // Deletar no banco
      const { error: deleteError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId)

      if (deleteError) throw deleteError

    } catch (error) {
      console.error('Erro ao deletar instância:', error)
      // Se erro menciona proteção, re-throw com mensagem clara
      if (error instanceof Error && error.message.includes('BLOQUEADA')) {
        throw new Error(`🛡️ ${error.message}`)
      }
      throw error
    }
  }
}

// Instância singleton do serviço
export const whatsappService = new WhatsappInstanceService()

// Helper function para obter tenant ID (usado em componentes)
export async function getCurrentTenantId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: userData, error } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('auth_id', user.id)
    .single()

  if (error) throw error
  return userData.tenant_id
}