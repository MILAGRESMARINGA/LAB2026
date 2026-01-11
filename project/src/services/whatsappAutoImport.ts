import { supabase } from '../lib/supabase';
import { contactsService } from './supabaseService';
import { whatsappService } from './whatsappService';

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  profilePicUrl?: string;
  isGroup: boolean;
  lastSeen?: string;
}

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  fromMe: boolean;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface WhatsAppChat {
  id: string;
  contact: WhatsAppContact;
  lastMessage: WhatsAppMessage;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  messages: WhatsAppMessage[];
}

export interface LeadMetadata {
  whatsapp_chat_id: string;
  first_contact_date: string;
  last_message_date: string;
  last_message_content: string;
  message_count: number;
  response_status: 'waiting' | 'responded' | 'no_response';
  pipeline_stage: string;
  auto_imported: boolean;
  tags: string[];
}

export class WhatsAppAutoImport {
  private isImporting = false;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private onProgressUpdate?: (progress: { current: number; total: number; status: string }) => void;
  private onLeadCreated?: (lead: any) => void;
  private onPipelineUpdate?: (leadId: string, newStage: string, reason: string) => void;

  // Configurações
  private config = {
    importDaysLimit: 30, // Últimos 30 dias
    monitoringInterval: 30000, // 30 segundos
    pipelineRules: {
      firstResponseDelay: 24 * 60 * 60 * 1000, // 24 horas
      followUpDelay: 48 * 60 * 60 * 1000, // 48 horas
      noResponseDelay: 72 * 60 * 60 * 1000, // 72 horas
    }
  };

  // 1. IMPORTAÇÃO AUTOMÁTICA DE CONTATOS E CONVERSAS
  async startAutoImport(): Promise<void> {
    if (this.isImporting) {
      throw new Error('Importação já está em andamento');
    }

    this.isImporting = true;
    console.log('🚀 Iniciando importação automática do WhatsApp...');

    try {
      // Verificar se WhatsApp está conectado
      const status = await this.checkWhatsAppConnection();
      if (status !== 'CONNECTED') {
        throw new Error('WhatsApp não está conectado. Conecte primeiro.');
      }

      // Buscar todos os chats
      const chats = await this.fetchWhatsAppChats();
      console.log(`📱 Encontrados ${chats.length} chats para processar`);

      let processed = 0;
      for (const chat of chats) {
        try {
          await this.processChat(chat);
          processed++;
          
          if (this.onProgressUpdate) {
            this.onProgressUpdate({
              current: processed,
              total: chats.length,
              status: `Processando ${chat.contact.name || chat.contact.phone}`
            });
          }

          // Delay para evitar sobrecarga
          await this.delay(1000);
        } catch (error) {
          console.error(`Erro ao processar chat ${chat.id}:`, error);
        }
      }

      console.log(`✅ Importação concluída: ${processed}/${chats.length} chats processados`);
      
      // Iniciar monitoramento automático
      this.startRealTimeMonitoring();
      
    } catch (error) {
      console.error('❌ Erro na importação automática:', error);
      throw error;
    } finally {
      this.isImporting = false;
    }
  }

  // 2. VERIFICAR CONEXÃO WHATSAPP
  private async checkWhatsAppConnection(): Promise<string> {
    try {
      // Simular verificação de status (substituir pela API real)
      const response = await fetch('/api/whatsapp/status', {
        timeout: 10000
      });
      
      if (!response.ok) {
        return 'DISCONNECTED';
      }
      
      const data = await response.json();
      return data.status || 'DISCONNECTED';
    } catch (error) {
      console.warn('WhatsApp backend não disponível, usando modo simulado');
      return 'CONNECTED'; // Modo demo
    }
  }

  // 3. BUSCAR CHATS DO WHATSAPP
  private async fetchWhatsAppChats(): Promise<WhatsAppChat[]> {
    try {
      // Implementação real da API WPPConnect/UltraMSG
      const response = await fetch('/api/whatsapp/chats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar chats');
      }

      const data = await response.json();
      return data.chats || [];
    } catch (error) {
      console.warn('Usando dados simulados para demonstração');
      
      // Dados simulados para demonstração
      return this.generateMockChats();
    }
  }

  // 4. PROCESSAR CHAT INDIVIDUAL
  private async processChat(chat: WhatsAppChat): Promise<void> {
    const { contact, lastMessage, messages } = chat;
    
    // Verificar se contato já existe no CRM
    const existingContact = await contactsService.getByPhone(contact.phone);
    
    if (!existingContact) {
      // Criar novo lead automaticamente
      await this.createLeadFromChat(chat);
    } else {
      // Atualizar metadados do contato existente
      await this.updateContactMetadata(existingContact.id, chat);
    }
  }

  // 5. CRIAR LEAD AUTOMÁTICO
  private async createLeadFromChat(chat: WhatsAppChat): Promise<void> {
    const { contact, lastMessage, messages } = chat;
    
    try {
      // Criar contato no CRM
      const newContact = await contactsService.create({
        name: contact.name || `Contato ${contact.phone}`,
        phone: contact.phone,
        type: 'lead'
      });

      // Criar metadados do WhatsApp
      const metadata: LeadMetadata = {
        whatsapp_chat_id: chat.id,
        first_contact_date: new Date(Math.min(...messages.map(m => m.timestamp))).toISOString(),
        last_message_date: new Date(lastMessage.timestamp).toISOString(),
        last_message_content: lastMessage.content,
        message_count: messages.length,
        response_status: this.determineResponseStatus(messages),
        pipeline_stage: 'new',
        auto_imported: true,
        tags: ['novo-lead', 'whatsapp-importado']
      };

      // Salvar metadados (implementar tabela lead_metadata)
      await this.saveLeadMetadata(newContact.id, metadata);

      // Determinar estágio inicial do pipeline
      const initialStage = this.determinePipelineStage(messages);
      if (initialStage !== 'new') {
        await this.updatePipelineStage(newContact.id, initialStage, 'Importação automática');
      }

      console.log(`✅ Lead criado: ${contact.name || contact.phone} → ${initialStage}`);
      
      if (this.onLeadCreated) {
        this.onLeadCreated({
          ...newContact,
          metadata,
          stage: initialStage
        });
      }
    } catch (error) {
      console.error('Erro ao criar lead:', error);
    }
  }

  // 6. MONITORAMENTO EM TEMPO REAL
  startRealTimeMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔄 Iniciando monitoramento em tempo real...');
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkForNewMessages();
        await this.updatePipelineStages();
      } catch (error) {
        console.error('Erro no monitoramento:', error);
      }
    }, this.config.monitoringInterval);
  }

  stopRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Monitoramento parado');
  }

  // 7. VERIFICAR NOVAS MENSAGENS
  private async checkForNewMessages(): Promise<void> {
    try {
      // Buscar mensagens recentes (últimos 5 minutos)
      const recentMessages = await this.fetchRecentMessages();
      
      for (const message of recentMessages) {
        await this.processNewMessage(message);
      }
    } catch (error) {
      console.error('Erro ao verificar novas mensagens:', error);
    }
  }

  // 8. PROCESSAR NOVA MENSAGEM
  private async processNewMessage(message: WhatsAppMessage): Promise<void> {
    // Encontrar contato pelo chat ID
    const contact = await this.findContactByChatId(message.chatId);
    if (!contact) return;

    // Atualizar metadados
    await this.updateContactMetadata(contact.id, {
      last_message_date: new Date(message.timestamp).toISOString(),
      last_message_content: message.content,
      message_count: contact.metadata?.message_count + 1 || 1
    });

    // Analisar conteúdo para mudança de pipeline
    const newStage = this.analyzeMessageForPipelineChange(message, contact.metadata?.pipeline_stage);
    
    if (newStage && newStage !== contact.metadata?.pipeline_stage) {
      await this.updatePipelineStage(contact.id, newStage, `Mensagem: "${message.content.substring(0, 50)}..."`);
    }
  }

  // 9. ANÁLISE INTELIGENTE DE PIPELINE
  private analyzeMessageForPipelineChange(message: WhatsAppMessage, currentStage?: string): string | null {
    const content = message.content.toLowerCase();
    
    // Palavras-chave para cada estágio
    const stageKeywords = {
      'contacted': ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite'],
      'follow-up': ['interessado', 'gostaria', 'quero saber', 'me fale mais'],
      'scheduled': ['agendar', 'visita', 'quando', 'horário', 'pode vir', 'disponível'],
      'negotiating': ['preço', 'valor', 'proposta', 'orçamento', 'desconto', 'condições'],
      'closed': ['fechado', 'compro', 'aceito', 'vamos fechar', 'ok pode ser']
    };

    // Verificar se mensagem é do cliente (não nossa)
    if (message.fromMe) {
      if (currentStage === 'new') return 'contacted';
      return null;
    }

    // Analisar conteúdo da mensagem do cliente
    for (const [stage, keywords] of Object.entries(stageKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return stage;
      }
    }

    // Regras baseadas em tempo
    const messageAge = Date.now() - message.timestamp;
    if (messageAge > this.config.pipelineRules.noResponseDelay && currentStage === 'contacted') {
      return 'follow-up';
    }

    return null;
  }

  // 10. DETERMINAR STATUS DE RESPOSTA
  private determineResponseStatus(messages: WhatsAppMessage[]): 'waiting' | 'responded' | 'no_response' {
    const lastMessage = messages[messages.length - 1];
    const lastClientMessage = messages.filter(m => !m.fromMe).pop();
    
    if (!lastClientMessage) return 'no_response';
    
    const timeSinceLastResponse = Date.now() - lastClientMessage.timestamp;
    
    if (timeSinceLastResponse > this.config.pipelineRules.noResponseDelay) {
      return 'no_response';
    } else if (lastMessage.fromMe) {
      return 'waiting';
    } else {
      return 'responded';
    }
  }

  // 11. DETERMINAR ESTÁGIO INICIAL DO PIPELINE
  private determinePipelineStage(messages: WhatsAppMessage[]): string {
    const clientMessages = messages.filter(m => !m.fromMe);
    const ourMessages = messages.filter(m => m.fromMe);
    
    if (ourMessages.length === 0) return 'new';
    if (clientMessages.length === 0) return 'contacted';
    
    // Analisar última mensagem do cliente
    const lastClientMessage = clientMessages[clientMessages.length - 1];
    const content = lastClientMessage.content.toLowerCase();
    
    // Palavras-chave para estágios avançados
    if (content.includes('agendar') || content.includes('visita') || content.includes('quando')) {
      return 'scheduled';
    }
    if (content.includes('preço') || content.includes('valor') || content.includes('proposta')) {
      return 'negotiating';
    }
    if (content.includes('interessado') || content.includes('quero')) {
      return 'follow-up';
    }
    
    return 'contacted';
  }

  // 12. SALVAR METADADOS DO LEAD
  private async saveLeadMetadata(contactId: string, metadata: LeadMetadata): Promise<void> {
    try {
      // Implementar tabela lead_metadata no Supabase
      const { error } = await supabase
        .from('lead_metadata')
        .insert([{
          contact_id: contactId,
          ...metadata,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar metadados:', error);
      // Fallback para localStorage
      const key = `lead_metadata_${contactId}`;
      localStorage.setItem(key, JSON.stringify(metadata));
    }
  }

  // 13. ATUALIZAR ESTÁGIO DO PIPELINE
  private async updatePipelineStage(contactId: string, newStage: string, reason: string): Promise<void> {
    try {
      // Atualizar no banco
      await contactsService.update(contactId, { type: newStage });
      
      // Registrar log de mudança
      await this.logPipelineChange(contactId, newStage, reason);
      
      console.log(`🔄 Pipeline atualizado: ${contactId} → ${newStage} (${reason})`);
      
      if (this.onPipelineUpdate) {
        this.onPipelineUpdate(contactId, newStage, reason);
      }
    } catch (error) {
      console.error('Erro ao atualizar pipeline:', error);
    }
  }

  // 14. LOG DE MUDANÇAS DO PIPELINE
  private async logPipelineChange(contactId: string, newStage: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pipeline_logs')
        .insert([{
          contact_id: contactId,
          previous_stage: 'unknown', // Buscar estágio anterior se necessário
          new_stage: newStage,
          reason: reason,
          timestamp: new Date().toISOString(),
          automated: true
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }

  // 15. BUSCAR MENSAGENS RECENTES
  private async fetchRecentMessages(): Promise<WhatsAppMessage[]> {
    try {
      const response = await fetch('/api/whatsapp/recent-messages', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Falha ao buscar mensagens');
      
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.warn('Usando dados simulados para mensagens recentes');
      return [];
    }
  }

  // 16. ENCONTRAR CONTATO POR CHAT ID
  private async findContactByChatId(chatId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('lead_metadata')
        .select('contact_id, contacts(*)')
        .eq('whatsapp_chat_id', chatId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Contato não encontrado para chat:', chatId);
      return null;
    }
  }

  // 17. ATUALIZAR METADADOS DO CONTATO
  private async updateContactMetadata(contactId: string, updates: Partial<LeadMetadata>): Promise<void> {
    try {
      const { error } = await supabase
        .from('lead_metadata')
        .update(updates)
        .eq('contact_id', contactId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar metadados:', error);
    }
  }

  // 18. GERAR DADOS SIMULADOS (PARA DEMONSTRAÇÃO)
  private generateMockChats(): WhatsAppChat[] {
    const mockContacts = [
      { name: 'João Silva', phone: '5511999887766' },
      { name: 'Maria Santos', phone: '5511988776655' },
      { name: 'Carlos Oliveira', phone: '5511977665544' },
      { name: 'Ana Costa', phone: '5511966554433' },
      { name: 'Pedro Almeida', phone: '5511955443322' }
    ];

    return mockContacts.map((contact, index) => ({
      id: `chat_${index + 1}`,
      contact: {
        id: `contact_${index + 1}`,
        name: contact.name,
        phone: contact.phone,
        isGroup: false
      },
      lastMessage: {
        id: `msg_${index + 1}`,
        chatId: `chat_${index + 1}`,
        fromMe: false,
        content: index % 2 === 0 ? 'Oi, tenho interesse em apartamento' : 'Bom dia! Gostaria de agendar uma visita',
        timestamp: Date.now() - (index * 3600000), // Mensagens das últimas horas
        type: 'text',
        status: 'read'
      },
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
      messages: [
        {
          id: `msg_${index + 1}_1`,
          chatId: `chat_${index + 1}`,
          fromMe: false,
          content: index % 2 === 0 ? 'Oi, tenho interesse em apartamento' : 'Bom dia! Gostaria de agendar uma visita',
          timestamp: Date.now() - (index * 3600000),
          type: 'text',
          status: 'read'
        }
      ]
    }));
  }

  // 19. UTILITÁRIOS
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 20. CALLBACKS PARA UI
  onProgress(callback: (progress: { current: number; total: number; status: string }) => void): void {
    this.onProgressUpdate = callback;
  }

  onNewLead(callback: (lead: any) => void): void {
    this.onLeadCreated = callback;
  }

  onPipelineChange(callback: (leadId: string, newStage: string, reason: string) => void): void {
    this.onPipelineUpdate = callback;
  }

  // 21. CONFIGURAÇÕES
  updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig() {
    return { ...this.config };
  }

  // 22. STATUS DO SISTEMA
  getStatus() {
    return {
      isImporting: this.isImporting,
      isMonitoring: this.isMonitoring,
      config: this.config
    };
  }
}

// Instância singleton
export const whatsappAutoImport = new WhatsAppAutoImport();