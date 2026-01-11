// Configuração da API WhatsApp (UltraMSG/WPPConnect)
const API_CONFIG = {
  // UltraMSG Configuration
  ultramsg: {
    baseUrl: 'https://api.ultramsg.com',
    instanceId: 'instanceXXXX', // Substitua pelo seu ID de instância
    token: 'YOUR_ULTRAMSG_TOKEN', // Substitua pelo seu token
  },
  
  // WPPConnect Configuration (caso use servidor próprio)
  wppconnect: {
    baseUrl: 'http://localhost:3333', // URL do seu servidor WPPConnect
    session: 'default',
  }
};

export interface WhatsAppMessage {
  phone: string;
  message: string;
  type?: 'text' | 'image' | 'document';
  media?: File;
  caption?: string;
}

export interface SendResult {
  phone: string;
  status: 'success' | 'error';
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private provider: 'ultramsg' | 'wppconnect' = 'ultramsg';

  // Função para delay entre mensagens
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enviar mensagem via UltraMSG
  private async sendViaUltraMSG(message: WhatsAppMessage): Promise<SendResult> {
    try {
      const { instanceId, token } = API_CONFIG.ultramsg;
      const url = `${API_CONFIG.ultramsg.baseUrl}/${instanceId}/messages/chat`;
      
      const payload = {
        token,
        to: message.phone,
        body: message.message,
        priority: 1,
        referenceId: `msg_${Date.now()}`
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.sent) {
        return {
          phone: message.phone,
          status: 'success',
          messageId: result.id
        };
      } else {
        throw new Error(result.error || 'Falha no envio');
      }
    } catch (error) {
      return {
        phone: message.phone,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Enviar mensagem via WPPConnect
  private async sendViaWPPConnect(message: WhatsAppMessage): Promise<SendResult> {
    try {
      const { baseUrl, session } = API_CONFIG.wppconnect;
      const url = `${baseUrl}/api/${session}/send-message`;
      
      const payload = {
        phone: message.phone,
        message: message.message,
        isGroup: false
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        return {
          phone: message.phone,
          status: 'success',
          messageId: result.response?.id
        };
      } else {
        throw new Error(result.message || 'Falha no envio');
      }
    } catch (error) {
      return {
        phone: message.phone,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Enviar mensagem única
  async sendMessage(message: WhatsAppMessage): Promise<SendResult> {
    if (this.provider === 'ultramsg') {
      return this.sendViaUltraMSG(message);
    } else {
      return this.sendViaWPPConnect(message);
    }
  }

  // Enviar mensagens em massa com controle de fila
  async sendMassMessages(
    contacts: Array<{ id: string; name: string; phone: string }>,
    messageTemplate: string,
    onProgress?: (progress: { sent: number; total: number; current: string }) => void
  ): Promise<SendResult[]> {
    const results: SendResult[] = [];
    const total = contacts.length;

    console.log(`🚀 Iniciando envio em massa para ${total} contatos`);

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      // Personalizar mensagem substituindo {{nome}}
      const personalizedMessage = messageTemplate.replace(/\{\{nome\}\}/g, contact.name);
      
      // Callback de progresso
      if (onProgress) {
        onProgress({
          sent: i,
          total,
          current: contact.name
        });
      }

      console.log(`📤 Enviando mensagem ${i + 1}/${total} para ${contact.name} (${contact.phone})`);

      // Enviar mensagem
      const result = await this.sendMessage({
        phone: contact.phone,
        message: personalizedMessage
      });

      results.push(result);

      // Log do resultado
      if (result.status === 'success') {
        console.log(`✅ Mensagem enviada com sucesso para ${contact.name}`);
      } else {
        console.log(`❌ Falha ao enviar para ${contact.name}: ${result.error}`);
      }

      // Controle de delay para evitar bloqueio
      if (i < contacts.length - 1) { // Não fazer delay no último
        if ((i + 1) % 200 === 0) {
          // Pausa de 5 minutos a cada 200 mensagens
          console.log(`⏸️ Pausa de 5 minutos após ${i + 1} mensagens...`);
          await this.delay(5 * 60 * 1000); // 5 minutos
        } else {
          // Delay de 3 segundos entre mensagens
          await this.delay(3000); // 3 segundos
        }
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`🎯 Envio concluído: ${successCount} sucessos, ${errorCount} erros`);

    return results;
  }

  // Configurar provedor
  setProvider(provider: 'ultramsg' | 'wppconnect') {
    this.provider = provider;
    console.log(`🔧 Provedor WhatsApp alterado para: ${provider}`);
  }

  // Verificar configuração
  isConfigured(): boolean {
    if (this.provider === 'ultramsg') {
      return API_CONFIG.ultramsg.token !== 'YOUR_ULTRAMSG_TOKEN' && 
             API_CONFIG.ultramsg.instanceId !== 'instanceXXXX';
    } else {
      return API_CONFIG.wppconnect.baseUrl !== 'http://localhost:3333';
    }
  }

  // Obter configuração atual
  getConfig() {
    return {
      provider: this.provider,
      configured: this.isConfigured(),
      config: this.provider === 'ultramsg' ? API_CONFIG.ultramsg : API_CONFIG.wppconnect
    };
  }
}

// Instância singleton
export const whatsappService = new WhatsAppService();

// Função utilitária para envio rápido (compatível com o prompt)
export async function sendMassWhatsApp(
  contacts: Array<{ id: string; name: string; phone: string }>,
  message: string
): Promise<SendResult[]> {
  return whatsappService.sendMassMessages(contacts, message);
}