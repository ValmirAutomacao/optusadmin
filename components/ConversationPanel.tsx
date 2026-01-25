// Painel de Conversas Ativas do WhatsApp
import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';


import type { WhatsappConversation } from '../lib/whatsappAutomation';
import { UazapiService } from '../lib/uazapi';
import { supabase } from '../lib/supabase';

interface ConversationPanelProps {
  conversations: WhatsappConversation[];
  loading: boolean;
  onRefresh?: () => void;
}

const STATUS_CONFIG = {
  active: {
    label: 'Ativa',
    color: 'bg-green-100 text-green-700',
    icon: 'chat'
  },
  waiting_human: {
    label: 'Aguardando Humano',
    color: 'bg-yellow-100 text-yellow-700',
    icon: 'person_search'
  },
  completed: {
    label: 'Finalizada',
    color: 'bg-gray-100 text-gray-700',
    icon: 'done_all'
  },
  abandoned: {
    label: 'Abandonada',
    color: 'bg-red-100 text-red-700',
    icon: 'history'
  }
};

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversations,
  loading,
  onRefresh
}) => {
  const [selectedConversation, setSelectedConversation] = useState<WhatsappConversation | null>(null);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = !searchFilter ||
      conversation.contact_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      conversation.phone_number.includes(searchFilter);

    const matchesStatus = !statusFilter || conversation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'Agora';
      if (diffMinutes < 60) return `${diffMinutes}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString();
    } catch { return '...'; }
  };

  const loadConversationMessages = async (conversation: WhatsappConversation) => {
    setLoadingMessages(true);
    try {
      const uazapi = new UazapiService();
      const { data: instanceData } = await supabase
        .from('whatsapp_instances')
        .select('uazapi_token')
        .eq('id', conversation.whatsapp_instance_id)
        .single();

      if (!instanceData?.uazapi_token) throw new Error('Token não encontrado');

      const chatid = conversation.phone_number.includes('@')
        ? conversation.phone_number
        : `${conversation.phone_number}@s.whatsapp.net`;

      const response = await uazapi.findMessages(instanceData.uazapi_token, {
        chatid,
        limit: 50
      });

      const messages = response.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.message?.text || msg.message?.caption || '[Mídia]',
        is_from_contact: !msg.fromMe,
        created_at: new Date(msg.timestamp * 1000).toISOString(),
        ai_processed: msg.track_source === 'ai_agent'
      }));

      setConversationMessages(messages.reverse());
    } catch (error) {
      console.error(error);
      setConversationMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedConversation) return;
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
          message: replyText
        });
        setReplyText('');
        loadConversationMessages(selectedConversation);
      }
    } catch (err) {
      alert('Erro ao enviar mensagem');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando conversas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Conversas WhatsApp</h3>
          <p className="text-sm text-gray-500">{filteredConversations.length} conversas encontradas</p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400">search</span>
            <input
              className="pl-9 pr-4 py-2 bg-gray-50 border-2 border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500/20 transition-all w-64"
              placeholder="Buscar..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 bg-gray-50 border-2 border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500/20"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Status: Todos</option>
            <option value="active">Ativas</option>
            <option value="waiting_human">Aguardando Humano</option>
            <option value="completed">Finalizadas</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredConversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => { setSelectedConversation(conv); setIsConversationModalOpen(true); loadConversationMessages(conv); }}
            className="p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-500/30 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <span className="material-icons-round text-2xl">person</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {conv.contact_name || conv.phone_number}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><span className="material-icons-round text-[12px]">phone</span> {conv.phone_number}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><span className="material-icons-round text-[12px]">schedule</span> {formatTime(conv.last_activity)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${STATUS_CONFIG[conv.status as keyof typeof STATUS_CONFIG]?.color}`}>
                  {STATUS_CONFIG[conv.status as keyof typeof STATUS_CONFIG]?.label}
                </span>
                <span className="material-icons-round text-gray-300 group-hover:text-blue-500 transition-colors">chevron_right</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isConversationModalOpen} onClose={() => setIsConversationModalOpen(false)} title={selectedConversation?.contact_name || "Chat"}>
        <div className="flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 rounded-2xl mb-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full text-gray-400">Carregando histórico...</div>
            ) : conversationMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 italic text-sm">Nenhuma mensagem encontrada</div>
            ) : (
              conversationMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.is_from_contact ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.is_from_contact
                    ? 'bg-white text-gray-800'
                    : msg.ai_processed ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                    <div className="flex items-center gap-2 mb-1 opacity-60 text-inherit">
                      <span className="material-icons-round text-xs">{msg.is_from_contact ? 'person' : msg.ai_processed ? 'smart_toy' : 'person_pin'}</span>
                      <span className="text-[10px] font-bold">{formatTime(msg.created_at)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <textarea
              className="flex-1 p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-blue-500/20 transition-all resize-none"
              placeholder="Digite sua resposta..."
              rows={2}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            />
            <Button className="h-full" onClick={handleSendMessage}><span className="material-icons-round">send</span></Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConversationPanel;