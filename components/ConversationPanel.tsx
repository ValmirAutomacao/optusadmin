// Painel de Conversas Ativas do WhatsApp
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  MessageCircle,
  User,
  Bot,
  Clock,
  UserCheck,
  Search,
  Filter,
  Phone,
  Calendar
} from 'lucide-react';

import type { WhatsappConversation } from '../lib/whatsappAutomation';
import { UazapiService } from '../lib/uazapi';
import { supabase } from '../lib/supabase';

interface ConversationPanelProps {
  conversations: WhatsappConversation[];
  loading: boolean;
}

const STATUS_CONFIG = {
  active: {
    label: 'Ativa',
    color: 'bg-green-100 text-green-700',
    icon: MessageCircle
  },
  waiting_human: {
    label: 'Aguardando Humano',
    color: 'bg-yellow-100 text-yellow-700',
    icon: UserCheck
  },
  completed: {
    label: 'Finalizada',
    color: 'bg-gray-100 text-gray-700',
    icon: Clock
  },
  abandoned: {
    label: 'Abandonada',
    color: 'bg-red-100 text-red-700',
    icon: Clock
  }
};

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversations,
  loading
}) => {
  const [selectedConversation, setSelectedConversation] = useState<WhatsappConversation | null>(null);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Filtrar conversas
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = !searchFilter ||
      conversation.contact_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      conversation.phone_number.includes(searchFilter);

    const matchesStatus = !statusFilter || conversation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString();
  };

  const formatPhone = (phone: string) => {
    // Formatar telefone brasileiro
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const ddd = cleaned.substring(2, 4);
      const number = cleaned.substring(4);
      return `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
    }
    return phone;
  };

  const loadConversationMessages = async (conversation: WhatsappConversation) => {
    setLoadingMessages(true);
    try {
      const uazapi = new UazapiService();

      // Buscar token da instância no banco ou via contexto
      const { data: instanceData } = await supabase
        .from('whatsapp_instances')
        .select('uazapi_token')
        .eq('id', conversation.whatsapp_instance_id)
        .single();

      if (!instanceData?.uazapi_token) {
        throw new Error('Token da instância não encontrado');
      }

      // Formato esperado pela Uazapi: phone@s.whatsapp.net
      const chatid = conversation.phone_number.includes('@')
        ? conversation.phone_number
        : `${conversation.phone_number}@s.whatsapp.net`;

      const response = await uazapi.findMessages(instanceData.uazapi_token, {
        chatid,
        limit: 50
      });

      // Mapear mensagens da Uazapi para o formato do componente
      const messages = response.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.message?.text || msg.message?.caption || '[Mídia]',
        is_from_contact: !msg.fromMe,
        created_at: new Date(msg.timestamp * 1000).toISOString(),
        ai_processed: msg.track_source === 'ai_agent'
      }));

      setConversationMessages(messages.reverse());
    } catch (error) {
      console.error('Erro ao carregar mensagens reais:', error);
      setConversationMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleViewConversation = (conversation: WhatsappConversation) => {
    setSelectedConversation(conversation);
    setIsConversationModalOpen(true);
    loadConversationMessages(conversation);
  };

  const handleTransferToHuman = async (conversationId: string) => {
    try {
      // Implementar transferência para humano
      console.log('Transferindo conversa para humano:', conversationId);
      // await transferConversationToHuman(conversationId);
    } catch (error) {
      console.error('Erro ao transferir para humano:', error);
    }
  };

  const getConversationContext = (context: Record<string, any>) => {
    const stage = context.stage || 'greeting';
    const customerName = context.customer_name;
    const serviceInterest = context.service_interest;

    let summary = `Estágio: ${stage}`;
    if (customerName) summary += ` • Cliente: ${customerName}`;
    if (serviceInterest) summary += ` • Interesse: ${serviceInterest}`;

    return summary;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Carregando conversas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Conversas Ativas</h3>
          <p className="text-sm text-muted-foreground">
            {filteredConversations.length} de {conversations.length} conversas
          </p>
        </div>

        <div className="flex space-x-2">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="waiting_human">Aguardando Humano</option>
            <option value="completed">Finalizadas</option>
            <option value="abandoned">Abandonadas</option>
          </select>
        </div>
      </div>

      {/* Lista de conversas */}
      <div className="grid gap-4">
        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {conversations.length === 0 ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa corresponde aos filtros'}
                </h3>
                <p className="text-muted-foreground">
                  {conversations.length === 0
                    ? 'As conversas aparecerão aqui quando os clientes enviarem mensagens'
                    : 'Tente ajustar os filtros de busca'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredConversations.map((conversation) => (
            <Card key={conversation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold truncate">
                          {conversation.contact_name || 'Contato sem nome'}
                        </h4>
                        {getStatusBadge(conversation.status)}
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <Phone className="h-3 w-3" />
                        <span>{formatPhone(conversation.phone_number)}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(conversation.last_activity)}</span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {getConversationContext(conversation.context)}
                      </p>

                      {conversation.status === 'waiting_human' && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <UserCheck className="w-3 h-3 inline mr-1" />
                          Transferido para atendimento humano
                          {conversation.human_transferred_at && (
                            <span className="ml-1">
                              em {formatTime(conversation.human_transferred_at)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewConversation(conversation)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>

                    {conversation.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransferToHuman(conversation.id)}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de visualização da conversa */}
      <Dialog open={isConversationModalOpen} onOpenChange={setIsConversationModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>{selectedConversation?.contact_name || 'Conversa'}</span>
              {selectedConversation && getStatusBadge(selectedConversation.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedConversation && (
            <div className="space-y-4">
              {/* Informações da conversa */}
              <div className="p-3 bg-muted rounded text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <strong>Telefone:</strong> {formatPhone(selectedConversation.phone_number)}
                  </div>
                  <div>
                    <strong>Iniciada em:</strong> {new Date(selectedConversation.created_at).toLocaleString()}
                  </div>
                  <div className="col-span-2">
                    <strong>Contexto:</strong> {getConversationContext(selectedConversation.context)}
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div>
                <h4 className="font-semibold mb-3">Histórico de Mensagens</h4>
                <ScrollArea className="h-96 border rounded p-3">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center p-8">
                      <p className="text-muted-foreground">Carregando mensagens...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversationMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.is_from_contact ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${message.is_from_contact
                              ? 'bg-gray-100 text-gray-900'
                              : message.ai_processed
                                ? 'bg-blue-500 text-white'
                                : 'bg-green-500 text-white'
                              }`}
                          >
                            <div className="flex items-center space-x-1 mb-1">
                              {message.is_from_contact ? (
                                <User className="w-3 h-3" />
                              ) : message.ai_processed ? (
                                <Bot className="w-3 h-3" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              <span className="text-xs opacity-75">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Ações */}
              <div className="pt-4 border-t space-y-4">
                <div className="flex gap-2">
                  <textarea
                    id="reply-message"
                    className="flex-1 min-h-[80px] p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                    placeholder="Digite sua resposta aqui..."
                  />
                  <Button
                    className="self-end"
                    onClick={async () => {
                      const input = document.getElementById('reply-message') as HTMLTextAreaElement;
                      const message = input.value.trim();
                      if (!message || !selectedConversation) return;

                      try {
                        const uazapi = new UazapiService();
                        const { data: instanceData } = await supabase
                          .from('whatsapp_instances')
                          .select('uazapi_token')
                          .eq('id', selectedConversation.whatsapp_instance_id)
                          .single();

                        if (instanceData?.uazapi_token) {
                          await uazapi.sendMessage(instanceData.uazapi_token, {
                            phone: selectedConversation.phone_number,
                            message: message
                          });
                          input.value = '';
                          // Recarregar mensagens
                          loadConversationMessages(selectedConversation);
                        }
                      } catch (err) {
                        console.error('Erro ao enviar mensagem:', err);
                        alert('Erro ao enviar mensagem');
                      }
                    }}
                  >
                    Enviar
                  </Button>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTransferToHuman(selectedConversation.id)}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Finalizar Atendimento IA
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConversationPanel;