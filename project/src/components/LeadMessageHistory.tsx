import React, { useState, useEffect } from 'react';
import { whatsappMessagesService, WhatsAppMessage } from '../services/leadsService';
import { 
  MessageSquare, 
  X, 
  Clock, 
  User, 
  Bot,
  Image,
  Video,
  FileText,
  ExternalLink
} from 'lucide-react';

interface LeadMessageHistoryProps {
  leadId: string;
  leadName: string;
  leadPhone: string;
  isOpen: boolean;
  onClose: () => void;
}

const LeadMessageHistory: React.FC<LeadMessageHistoryProps> = ({
  leadId,
  leadName,
  leadPhone,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && leadId) {
      const fetchMessages = async () => {
        try {
          setLoading(true);
          const data = await whatsappMessagesService.getByLeadId(leadId);
          setMessages(data);
        } catch (error) {
          console.error('Erro ao carregar mensagens:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchMessages();
    }
  }, [isOpen, leadId]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700/50">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Histórico WhatsApp</h2>
              <p className="text-slate-400">{leadName} - {leadPhone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Carregando histórico...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-slate-400 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400">Nenhuma mensagem encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.from_me ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.from_me 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-700/50 text-white border border-slate-600/50'
                  }`}>
                    {/* Message Header */}
                    <div className="flex items-center space-x-2 mb-2">
                      {message.from_me ? (
                        <Bot className="h-4 w-4 text-blue-200" />
                      ) : (
                        <User className="h-4 w-4 text-slate-300" />
                      )}
                      <span className="text-xs opacity-75">
                        {message.from_me ? 'Você' : leadName}
                      </span>
                      <span className="text-xs opacity-50">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div className="space-y-2">
                      {message.message_type !== 'text' && (
                        <div className="flex items-center space-x-2 text-xs opacity-75">
                          {getMessageIcon(message.message_type)}
                          <span>{message.message_type}</span>
                          {message.media_url && (
                            <button className="text-blue-200 hover:text-white">
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                      
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>

                    {/* Message Status */}
                    <div className="flex justify-between items-center mt-2 text-xs opacity-50">
                      <span>{message.status}</span>
                      <Clock className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
          <div className="flex justify-between items-center text-sm text-slate-400">
            <span>💬 {messages.length} mensagens no histórico</span>
            <span>🤖 Classificação automática ativada</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadMessageHistory;