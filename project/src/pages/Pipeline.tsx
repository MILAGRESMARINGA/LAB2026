import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PipelineMonitor from '../components/PipelineMonitor';
import SmartSendingConfig from '../components/SmartSendingConfig';
import { MessagePipeline, PipelineConfig, Contact, MessageTemplate } from '../services/MessagePipeline';
import { 
  Settings, 
  Users, 
  MessageSquare, 
  Plus,
  Upload,
  Send,
  Zap
} from 'lucide-react';

const Pipeline: React.FC = () => {
  const [pipeline, setPipeline] = useState<MessagePipeline | null>(null);
  const [activeTab, setActiveTab] = useState<'monitor' | 'config' | 'compose'>('monitor');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [messageTitle, setMessageTitle] = useState('');

  // Initialize pipeline
  useEffect(() => {
    const defaultConfig: PipelineConfig = {
      dailyLimit: 2000,
      messagesPerMinute: 20,
      batchSize: 200,
      batchPauseMinutes: 5,
      maxAttempts: 3,
      retryDelayMinutes: 30,
      enableSmartDelay: true,
      respectBusinessHours: true,
      businessHoursStart: '08:00',
      businessHoursEnd: '18:00'
    };

    const newPipeline = new MessagePipeline(defaultConfig);
    setPipeline(newPipeline);

    // Load mock contacts
    const mockContacts: Contact[] = [
      { id: '1', name: 'João Silva', phone: '5511999887766', email: 'joao@email.com', tags: ['cliente', 'vip'] },
      { id: '2', name: 'Maria Santos', phone: '5511988776655', email: 'maria@email.com', tags: ['lead', 'interessado'] },
      { id: '3', name: 'Carlos Oliveira', phone: '5511977665544', email: 'carlos@email.com', tags: ['cliente'] },
      { id: '4', name: 'Ana Costa', phone: '5511966554433', email: 'ana@email.com', tags: ['lead'] },
      { id: '5', name: 'Pedro Almeida', phone: '5511955443322', email: 'pedro@email.com', tags: ['cliente', 'premium'] },
    ];
    setContacts(mockContacts);

    return () => {
      newPipeline.stop();
    };
  }, []);

  const handleConfigChange = (config: PipelineConfig) => {
    if (pipeline) {
      pipeline.updateConfig(config);
    }
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const handleAddToQueue = () => {
    if (!pipeline || !message.trim() || selectedContacts.length === 0) {
      alert('Preencha todos os campos e selecione pelo menos um contato');
      return;
    }

    const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
    const template: MessageTemplate = {
      id: Date.now().toString(),
      content: message,
      variables: ['nome', 'telefone', 'email', 'data', 'hora']
    };

    const addedIds = pipeline.addToQueue(selectedContactsData, template, 'normal');
    
    alert(`${addedIds.length} mensagens adicionadas à fila!`);
    setSelectedContacts([]);
    setMessage('');
    setMessageTitle('');
    setActiveTab('monitor');
  };

  const predefinedMessages = [
    {
      title: 'Saudação Inicial',
      content: 'Olá {{nome}}! Espero que esteja bem. Sou da equipe de vendas e gostaria de apresentar nossas soluções.'
    },
    {
      title: 'Follow-up',
      content: 'Oi {{nome}}! Como está? Vi que você demonstrou interesse em nossos serviços. Posso te ajudar com mais informações?'
    },
    {
      title: 'Promoção',
      content: '🎉 {{nome}}, temos uma promoção especial só para você! Condições imperdíveis até {{data}}. Não perca!'
    },
    {
      title: 'Lembrete',
      content: 'Olá {{nome}}! Este é um lembrete amigável sobre nossa conversa. Quando podemos agendar uma reunião?'
    }
  ];

  if (!pipeline) {
    return (
      <Layout title="Pipeline de Mensagens">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Inicializando pipeline...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Pipeline de Mensagens">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4">
            <Zap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Pipeline de Mensagens
          </h1>
          <p className="text-slate-400">
            Sistema inteligente de processamento e envio em massa
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-slate-800/30 rounded-xl p-1 max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab('compose')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'compose'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Compor
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'monitor'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Zap className="h-4 w-4 inline mr-2" />
              Monitor
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'config'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Configurações
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Message Composer */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center space-x-3 mb-6">
                <MessageSquare className="h-6 w-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Compor Mensagem</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Título da Campanha
                  </label>
                  <input
                    type="text"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    placeholder="Ex: Promoção Black Friday"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Olá {{nome}}! Esta é uma mensagem personalizada..."
                    className="w-full h-40 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <p className="text-slate-400 text-sm mt-2">
                    Variáveis disponíveis: <code className="bg-slate-700 px-1 rounded">{'{{nome}}'}</code>, 
                    <code className="bg-slate-700 px-1 rounded ml-1">{'{{telefone}}'}</code>, 
                    <code className="bg-slate-700 px-1 rounded ml-1">{'{{email}}'}</code>
                  </p>
                </div>

                {/* Predefined Messages */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Mensagens Predefinidas
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {predefinedMessages.map((msg, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setMessage(msg.content);
                          setMessageTitle(msg.title);
                        }}
                        className="text-left p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/30 transition-colors"
                      >
                        <p className="text-white font-medium text-sm">{msg.title}</p>
                        <p className="text-slate-400 text-xs mt-1 truncate">{msg.content}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {message && (
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Preview:</h4>
                    <div className="bg-green-600 text-white p-3 rounded-lg max-w-xs">
                      <p className="text-sm whitespace-pre-wrap">
                        {message.replace(/\{\{nome\}\}/g, 'João Silva')
                                .replace(/\{\{telefone\}\}/g, '11999887766')
                                .replace(/\{\{email\}\}/g, 'joao@email.com')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Selection */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-green-400" />
                  <h2 className="text-xl font-bold text-white">
                    Contatos ({selectedContacts.length}/{contacts.length})
                  </h2>
                </div>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {selectedContacts.length === contacts.length ? 'Desmarcar' : 'Selecionar'} Todos
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {contacts.map((contact) => (
                  <label key={contact.id} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => handleContactToggle(contact.id)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{contact.name}</p>
                      <p className="text-slate-400 text-sm">{contact.phone}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags?.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleAddToQueue}
                disabled={!message.trim() || selectedContacts.length === 0}
                className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Adicionar à Fila ({selectedContacts.length})</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'monitor' && (
          <PipelineMonitor pipeline={pipeline} />
        )}

        {activeTab === 'config' && (
          <SmartSendingConfig onConfigChange={handleConfigChange} />
        )}
      </div>
    </Layout>
  );
};

export default Pipeline;