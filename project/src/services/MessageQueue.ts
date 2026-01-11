interface Contact {
  id: string;
  name: string;
  phone: string;
  status: 'new' | 'contacted' | 'negotiating' | 'closed';
}

interface QueueItem {
  id: string;
  contact: Contact;
  message: string;
  status: 'pending' | 'sending' | 'sent' | 'error';
  attempts: number;
  timestamp: string;
  error?: string;
}

class MessageQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private dailyLimit = 50000; // 50 mil mensagens por dia
  private dailyCount = 0;
  private onUpdate?: (queue: QueueItem[]) => void;

  constructor() {
    this.loadDailyCount();
  }

  private loadDailyCount() {
    const today = new Date().toDateString();
    const savedCount = localStorage.getItem(`daily_count_${today}`);
    this.dailyCount = savedCount ? parseInt(savedCount) : 0;
  }

  private saveDailyCount() {
    const today = new Date().toDateString();
    localStorage.setItem(`daily_count_${today}`, this.dailyCount.toString());
  }

  public addToQueue(contacts: Contact[], message: string) {
    const newItems: QueueItem[] = contacts.map(contact => ({
      id: `${Date.now()}_${contact.id}`,
      contact,
      message: message.replace('{{nome}}', contact.name),
      status: 'pending',
      attempts: 0,
      timestamp: new Date().toISOString()
    }));

    this.queue.push(...newItems);
    this.notifyUpdate();
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0 && this.dailyCount < this.dailyLimit) {
      const item = this.queue.find(item => item.status === 'pending');
      if (!item) break;

      // Atualizar status para enviando
      item.status = 'sending';
      item.attempts++;
      this.notifyUpdate();

      try {
        // Simular envio da mensagem
        const success = await this.sendMessage(item);
        
        if (success) {
          item.status = 'sent';
          this.dailyCount++;
          this.saveDailyCount();
        } else {
          throw new Error('Falha no envio');
        }
      } catch (error) {
        item.status = 'error';
        item.error = error instanceof Error ? error.message : 'Erro desconhecido';
        
        // Reenviar até 3 tentativas
        if (item.attempts < 3) {
          setTimeout(() => {
            item.status = 'pending';
            this.notifyUpdate();
          }, 30000); // Tentar novamente em 30 segundos
        }
      }

      this.notifyUpdate();

      // Delay baseado na quantidade de mensagens enviadas
      const batchNumber = Math.floor(this.dailyCount / 200);
      if (this.dailyCount % 200 === 0 && this.dailyCount > 0) {
        // Pausa de 5 minutos a cada 200 mensagens
        await this.delay(5 * 60 * 1000);
      } else {
        // Delay de 3 segundos entre mensagens
        await this.delay(3000);
      }
    }

    this.isProcessing = false;
  }

  private async sendMessage(item: QueueItem): Promise<boolean> {
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: item.contact.phone,
          body: item.message,
        }),
      });

      const result = await response.json();
      return response.ok && result.status === 'success';
    } catch (error) {
      console.error('Erro no envio:', error);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private notifyUpdate() {
    if (this.onUpdate) {
      this.onUpdate([...this.queue]);
    }
  }

  public onQueueUpdate(callback: (queue: QueueItem[]) => void) {
    this.onUpdate = callback;
  }

  public getQueue(): QueueItem[] {
    return [...this.queue];
  }

  public getDailyCount(): number {
    return this.dailyCount;
  }

  public getDailyLimit(): number {
    return this.dailyLimit;
  }

  public clearQueue() {
    this.queue = [];
    this.notifyUpdate();
  }

  public removeFromQueue(itemId: string) {
    this.queue = this.queue.filter(item => item.id !== itemId);
    this.notifyUpdate();
  }

  public retryItem(itemId: string) {
    const item = this.queue.find(item => item.id === itemId);
    if (item && item.status === 'error') {
      item.status = 'pending';
      item.attempts = 0;
      item.error = undefined;
      this.notifyUpdate();
      
      if (!this.isProcessing) {
        this.processQueue();
      }
    }
  }
}

export default MessageQueue;