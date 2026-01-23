import React, { useState, useEffect } from 'react';
import { whatsappService } from '../lib/uazapi';
import { InstanceProtectionService } from '../lib/instanceProtection';
import { ConnectionLimitService, type TenantConnectionInfo } from '../lib/connectionLimits';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';

interface WhatsappInstance {
  id: string;
  name: string;
  phone?: string;
  description?: string;
  status: 'disconnected' | 'connecting' | 'connected';
  qrcode?: string;
  profile_name?: string;
  profile_pic_url?: string;
  is_business: boolean;
  webhook_configured: boolean;
  connected_at?: string;
  created_at: string;
  uazapi_instance_id?: string; // Para verificação de proteção
}

interface NewInstanceData {
  name: string;
  phone: string;
  description: string;
}

const WhatsappInstances: React.FC = () => {
  const [instances, setInstances] = useState<WhatsappInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsappInstance | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState(false);
  const [protectedInstanceIds, setProtectedInstanceIds] = useState<Set<string>>(new Set());
  const [connectionInfo, setConnectionInfo] = useState<TenantConnectionInfo | null>(null);
  const [formData, setFormData] = useState<NewInstanceData>({
    name: '',
    phone: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<NewInstanceData>>({});

  // Função para verificar quais instâncias estão protegidas
  const checkProtectedInstances = async () => {
    try {
      const protectedList = await InstanceProtectionService.getProtectedInstances();
      const protectedIds = new Set(protectedList.map(p => p.uazapi_instance_id));
      setProtectedInstanceIds(protectedIds);
    } catch (error) {
      console.error('Erro ao verificar instâncias protegidas:', error);
    }
  };

  // Função para carregar informações de limite
  const loadConnectionInfo = async () => {
    try {
      const info = await ConnectionLimitService.getTenantConnectionInfo();
      setConnectionInfo(info);
    } catch (error) {
      console.error('Erro ao carregar info de conexões:', error);
    }
  };

  // Carregar instâncias ao montar o componente
  useEffect(() => {
    loadInstances();
    checkProtectedInstances();
    loadConnectionInfo();
  }, []);

  // Monitorar status da instância selecionada
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (selectedInstance && isStatusModalOpen && monitoringStatus) {
      interval = setInterval(() => {
        checkInstanceStatus(selectedInstance.id);
      }, 3000); // Verificar a cada 3 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedInstance, isStatusModalOpen, monitoringStatus]);

  const loadInstances = async () => {
    try {
      setLoading(true);
      const data = await whatsappService.listTenantInstances();
      setInstances(data);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<NewInstanceData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (formData.phone && !/^\d{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Telefone deve ter entre 10-15 dígitos';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateInstance = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const result = await whatsappService.createWhatsappInstance({
        name: formData.name.trim(),
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : undefined,
        description: formData.description.trim() || undefined
      });

      // Fechar modal de criação e resetar form
      setIsCreateModalOpen(false);
      const instanceName = formData.name.trim();
      const instancePhone = formData.phone ? formData.phone.replace(/\D/g, '') : undefined;
      const instanceDescription = formData.description.trim() || undefined;
      setFormData({ name: '', phone: '', description: '' });
      setFormErrors({});

      // Recarregar lista e info de conexões
      await loadInstances();
      await loadConnectionInfo();

      // Criar objeto temporário com dados do resultado para abrir modal imediatamente
      // (não podemos confiar no state 'instances' pois React ainda não atualizou)
      const newInstanceData: WhatsappInstance = {
        id: result.instanceId,
        name: instanceName,
        phone: instancePhone,
        description: instanceDescription,
        status: (result.status as 'disconnected' | 'connecting' | 'connected') || 'connecting',
        qrcode: result.qrcode,
        is_business: false,
        webhook_configured: false,
        created_at: new Date().toISOString()
      };

      // Abrir modal de status imediatamente com QR Code
      setSelectedInstance(newInstanceData);
      setIsStatusModalOpen(true);
      setMonitoringStatus(true);

    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      alert(`Erro ao criar instância: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkInstanceStatus = async (instanceId: string) => {
    try {
      const status = await whatsappService.checkInstanceStatus(instanceId);

      // Atualizar instância na lista
      setInstances(prev => prev.map(inst =>
        inst.id === instanceId
          ? {
            ...inst,
            status: status.status as any,
            qrcode: status.qrcode,
            profile_name: status.profileName
          }
          : inst
      ));

      // Atualizar instância selecionada
      if (selectedInstance?.id === instanceId) {
        setSelectedInstance(prev => prev ? {
          ...prev,
          status: status.status as any,
          qrcode: status.qrcode,
          profile_name: status.profileName
        } : null);

        // Se conectou, parar monitoramento
        if (status.connected) {
          setMonitoringStatus(false);
        }
      }

    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const handleDeleteInstance = async (instance: WhatsappInstance) => {
    // 🛡️ Verificação extra de proteção antes do confirm
    try {
      if (instance.uazapi_instance_id) {
        const protection = await InstanceProtectionService.isInstanceProtected(instance.uazapi_instance_id);

        if (!protection.allowed) {
          alert(`🛡️ OPERAÇÃO BLOQUEADA!\n\n${protection.reason}\n\nCliente: ${protection.clientInfo || 'N/A'}\nNível: ${protection.protectionLevel || 'N/A'}`);
          return;
        }
      }
    } catch (error: any) {
      alert(`🚨 ERRO DE SEGURANÇA: ${error.message}`);
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar a instância "${instance.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setLoading(true);
      await whatsappService.deleteWhatsappInstance(instance.id);
      await loadInstances();
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);

      // Mostrar mensagem específica se foi bloqueada por proteção
      if (error.message.includes('🛡️') || error.message.includes('BLOQUEADA')) {
        alert(`${error.message}\n\nEsta instância está protegida contra exclusão.`);
      } else {
        alert(`Erro ao deletar instância: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = async (instance: WhatsappInstance) => {
    setSelectedInstance(instance);
    setIsStatusModalOpen(true);

    if (instance.status === 'connecting') {
      setMonitoringStatus(true);
    }

    // Verificar status inicial
    await checkInstanceStatus(instance.id);
  };

  // Função para reconectar instância desconectada (gerar novo QR Code)
  const handleReconnectInstance = async (instance: WhatsappInstance) => {
    try {
      setLoading(true);

      // Chamar API para gerar novo QR Code
      const result = await whatsappService.reconnectInstance(instance.id);

      // Atualizar instância selecionada com novo QR Code
      const updatedInstance: WhatsappInstance = {
        ...instance,
        status: (result.status as 'disconnected' | 'connecting' | 'connected'),
        qrcode: result.qrcode
      };

      setSelectedInstance(updatedInstance);
      setIsStatusModalOpen(true);
      setMonitoringStatus(true);

      // Atualizar lista
      await loadInstances();

    } catch (error: any) {
      console.error('Erro ao reconectar instância:', error);
      alert(`Erro ao reconectar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '✅';
      case 'connecting': return '🔄';
      case 'disconnected': return '❌';
      default: return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'disconnected': return 'Desconectado';
      default: return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'connecting': return 'text-yellow-600 bg-yellow-50';
      case 'disconnected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Conexões WhatsApp</h1>
            {connectionInfo && (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${connectionInfo.can_create_more
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  📱 {connectionInfo.whatsapp_connections_used}/{connectionInfo.whatsapp_connection_limit} em uso
                </span>
                {connectionInfo.remaining_connections > 0 && (
                  <span className="text-sm text-gray-500">
                    • {connectionInfo.remaining_connections} disponível{connectionInfo.remaining_connections > 1 ? 'is' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="text-gray-600">Gerencie suas conexões do WhatsApp para automação (máximo 2 por conta)</p>
        </div>
        <Button
          icon="add"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={loading || (connectionInfo && !connectionInfo.can_create_more)}
        >
          {connectionInfo && !connectionInfo.can_create_more ? 'Limite Atingido' : 'Nova Conexão'}
        </Button>
      </div>

      {/* Lista de Instâncias */}
      <div className="grid gap-4">
        {loading && instances.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Carregando instâncias...</p>
          </div>
        ) : instances.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <span className="text-6xl mb-4 block">📱</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma instância encontrada</h3>
            <p className="text-gray-500 mb-4">Crie sua primeira conexão WhatsApp para começar a automação</p>
            <Button
              icon="add"
              onClick={() => setIsCreateModalOpen(true)}
              disabled={connectionInfo && !connectionInfo.can_create_more}
            >
              {connectionInfo && !connectionInfo.can_create_more ? 'Limite Atingido' : 'Criar Primeira Conexão'}
            </Button>
          </div>
        ) : (
          instances.map((instance) => (
            <div key={instance.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{instance.name}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
                      {getStatusIcon(instance.status)} {getStatusText(instance.status)}
                    </span>
                    {instance.uazapi_instance_id && protectedInstanceIds.has(instance.uazapi_instance_id) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        🛡️ PROTEGIDA
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    {instance.phone && (
                      <div>
                        <span className="font-medium">Telefone:</span> {instance.phone}
                      </div>
                    )}
                    {instance.profile_name && (
                      <div>
                        <span className="font-medium">Perfil:</span> {instance.profile_name}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Webhook:</span> {instance.webhook_configured ? '✅ Configurado' : '❌ Não configurado'}
                    </div>
                    <div>
                      <span className="font-medium">Criado em:</span> {new Date(instance.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {instance.description && (
                    <p className="text-gray-600 mt-2">{instance.description}</p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {/* Botão Conectar para instâncias desconectadas */}
                  {instance.status === 'disconnected' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon="qr_code_2"
                      onClick={() => handleReconnectInstance(instance)}
                      disabled={loading}
                    >
                      Conectar
                    </Button>
                  )}

                  {/* Botão Status para instâncias conectando ou conectadas */}
                  {(instance.status === 'connecting' || instance.status === 'connected') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="visibility"
                      onClick={() => openStatusModal(instance)}
                    >
                      Status
                    </Button>
                  )}



                  <Button
                    variant="danger"
                    size="sm"
                    icon="delete"
                    onClick={() => handleDeleteInstance(instance)}
                    disabled={loading}
                  >
                    Deletar
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Criar Instância */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nova Conexão WhatsApp"
        size="md"
      >
        <div className="space-y-4">
          {/* Status do Limite */}
          {connectionInfo && (
            <div className={`p-4 rounded-xl border ${connectionInfo.can_create_more
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
              }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {connectionInfo.can_create_more ? '✅' : '🚫'}
                </span>
                <div>
                  <p className={`font-semibold ${connectionInfo.can_create_more ? 'text-green-800' : 'text-red-800'
                    }`}>
                    {connectionInfo.can_create_more
                      ? `Você pode criar mais ${connectionInfo.remaining_connections} conexão${connectionInfo.remaining_connections > 1 ? 'ões' : ''}`
                      : 'Limite de conexões atingido'
                    }
                  </p>
                  <p className={`text-sm ${connectionInfo.can_create_more ? 'text-green-600' : 'text-red-600'
                    }`}>
                    Uso atual: {connectionInfo.whatsapp_connections_used}/{connectionInfo.whatsapp_connection_limit} conexões
                  </p>
                </div>
              </div>
            </div>
          )}

          <Input
            label="Nome da Conexão"
            placeholder="Ex: Atendimento Principal"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
            icon="label"
          />

          <Input
            label="Telefone (Opcional)"
            placeholder="Ex: 11999999999"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            error={formErrors.phone}
            icon="phone"
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o uso desta instância..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Informações Importantes</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>QR Code:</strong> Será gerado para você escanear com o WhatsApp</li>
              <li>• <strong>Automação:</strong> Webhook configurado automaticamente</li>
              <li>• <strong>Limite:</strong> Máximo 2 conexões por conta</li>
              <li>• <strong>Recomendação:</strong> Use WhatsApp Business para melhor experiência</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateInstance}
              loading={loading}
              icon="rocket_launch"
              disabled={connectionInfo && !connectionInfo.can_create_more}
            >
              {connectionInfo && !connectionInfo.can_create_more ? 'Limite Atingido' : 'Criar Conexão'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Status/QRCode */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setMonitoringStatus(false);
        }}
        title={`Status: ${selectedInstance?.name}`}
        size="lg"
      >
        {selectedInstance && (
          <div className="space-y-6">
            {/* Status Atual */}
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-medium ${getStatusColor(selectedInstance.status)}`}>
                {getStatusIcon(selectedInstance.status)} {getStatusText(selectedInstance.status)}
              </div>
              {monitoringStatus && (
                <p className="text-sm text-gray-500 mt-2">Atualizando automaticamente...</p>
              )}
            </div>

            {/* QR Code */}
            {selectedInstance.qrcode && selectedInstance.status === 'connecting' && (
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">📱 Escaneie o QR Code</h3>
                <div className="flex justify-center">
                  <img
                    src={selectedInstance.qrcode}
                    alt="QR Code WhatsApp"
                    className="border border-gray-300 rounded-lg"
                    style={{ maxWidth: '300px' }}
                  />
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Como conectar:</h4>
                  <ol className="text-sm text-gray-600 space-y-1 text-left">
                    <li>1. Abra o WhatsApp no seu celular</li>
                    <li>2. Vá em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong></li>
                    <li>3. Toque em <strong>"Conectar um aparelho"</strong></li>
                    <li>4. Escaneie o QR Code acima</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Aguardando QR Code (status connecting mas sem QR) */}
            {!selectedInstance.qrcode && selectedInstance.status === 'connecting' && (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <h3 className="text-lg font-semibold text-gray-900">Gerando QR Code...</h3>
                <p className="text-gray-500">Aguarde enquanto o QR Code é gerado</p>
              </div>
            )}

            {/* Instância desconectada - mostrar botão para reconectar */}
            {selectedInstance.status === 'disconnected' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-lg font-semibold text-gray-700">Instância Desconectada</h3>
                <p className="text-gray-500">Clique no botão abaixo para gerar um novo QR Code</p>
                <Button
                  icon="qr_code_2"
                  onClick={() => handleReconnectInstance(selectedInstance)}
                  loading={loading}
                >
                  Gerar QR Code
                </Button>
              </div>
            )}

            {/* Instância Conectada */}
            {selectedInstance.status === 'connected' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-lg font-semibold text-green-600">Instância Conectada com Sucesso!</h3>
                {selectedInstance.profile_name && (
                  <p className="text-gray-600">Perfil: <strong>{selectedInstance.profile_name}</strong></p>
                )}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-800">
                    🎉 Sua instância está pronta para automação! O webhook foi configurado automaticamente.
                  </p>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-3">
              {selectedInstance.status === 'connecting' && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => checkInstanceStatus(selectedInstance.id)}
                  loading={loading}
                  icon="refresh"
                >
                  Verificar Status
                </Button>
              )}
              <Button
                variant={selectedInstance.status === 'connected' ? 'primary' : 'secondary'}
                className="flex-1"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setMonitoringStatus(false);
                }}
              >
                {selectedInstance.status === 'connected' ? 'Concluído' : 'Fechar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>


    </div>
  );
};

export default WhatsappInstances;