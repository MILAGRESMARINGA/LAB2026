export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
}

export interface MessageTemplate {
  id: string;
  content: string;
  variables: string[];
}

export interface QueueItem {
  id: string;
  contact: Contact;
  message: string;
  originalTemplate: string;
  status: 'pending' | 'processing' | 'sent' | 'delivered' | 'failed' | 'blocked';
  attempts: number;
  scheduledTime: Date;
  sentTime?: Date;
  deliveredTime?: Date;
  error?: string;
  priority: 'low' | 'normal' | 'high';
}

export interface PipelineConfig {
  dailyLimit: number;
  messagesPerMinute: number;
  batchSize: number;
  batchPauseMinutes: number;
  maxAttempts: number;
  retryDelayMinutes: number;
  enableSmartDelay: boolean;
  respectBusinessHours: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
}

export interface PipelineStats {
  totalQueued: number;
  pending: number;
  processing: number;
  sent: number;
  delivered: number;
  failed: number;
  blocked: number;
  dailyCount: number;
  currentBatch: number;
  estimatedCompletion: Date | null;
}

export class MessagePipeline {
  private queue: QueueItem[] = [];
  private isRunning = false;
  private isPaused = false;
  private config: PipelineConfig;
  private stats: PipelineStats;
  private currentBatchCount = 0;
  private dailyCount = 0;
  private lastBatchTime: Date | null = null;
  private onStatsUpdate?: (stats: PipelineStats) => void;
  private onQueueUpdate?: (queue: QueueItem[]) => void;

  constructor(config: PipelineConfig) {
    this.config = config;
    this.stats = this.initializeStats();
    this.loadDailyCount();
  }

  private initializeStats(): PipelineStats {
    return {
      totalQueued: 0,
      pending: 0,
      processing: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      blocked: 0,
      dailyCount: this.dailyCount,
      currentBatch: 0,
      estimatedCompletion: null
    };
  }

  private loadDailyCount() {
    const today = new Date().toDateString();
    const savedCount = localStorage.getItem(`pipeline_daily_count_${today}`);
    this.dailyCount = savedCount ? parseInt(savedCount) : 0;
  }

  private saveDailyCount() {
    const today = new Date().toDateString();
    localStorage.setItem(`pipeline_daily_count_${today}`, this.dailyCount.toString());
  }

  private updateStats() {
    this.stats = {
      totalQueued: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      processing: this.queue.filter(item => item.status === 'processing').length,
      sent: this.queue.filter(item => item.status === 'sent').length,
      delivered: this.queue.filter(item => item.status === 'delivered').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
      blocked: this.queue.filter(item => item.status === 'blocked').length,
      dailyCount: this.dailyCount,
      currentBatch: this.currentBatchCount,
      estimatedCompletion: this.calculateEstimatedCompletion()
    };

    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.stats);
    }
  }

  private calculateEstimatedCompletion(): Date | null {
    const pendingItems = this.queue.filter(item => 
      item.status === 'pending' || (item.status === 'failed' && item.attempts < this.config.maxAttempts)
    );

    if (pendingItems.length === 0) return null;

    const messagesPerSecond = this.config.messagesPerMinute / 60;
    const totalSeconds = pendingItems.length / messagesPerSecond;
    
    // Add batch pause time
    const batches = Math.ceil(pendingItems.length / this.config.batchSize);
    const pauseTime = (batches - 1) * this.config.batchPauseMinutes * 60;
    
    return new Date(Date.now() + (totalSeconds + pauseTime) * 1000);
  }

  public addToQueue(contacts: Contact[], template: MessageTemplate, priority: 'low' | 'normal' | 'high' = 'normal'): string[] {
    const newItems: QueueItem[] = contacts.map((contact, index) => {
      const personalizedMessage = this.personalizeMessage(template.content, contact);
      
      return {
        id: `msg_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        contact,
        message: personalizedMessage,
        originalTemplate: template.content,
        status: 'pending',
        attempts: 0,
        scheduledTime: this.calculateScheduledTime(index, priority),
        priority,
      };
    });

    // Sort by priority and scheduled time
    this.queue.push(...newItems);
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.scheduledTime.getTime() - b.scheduledTime.getTime();
    });

    this.updateStats();
    if (this.onQueueUpdate) {
      this.onQueueUpdate([...this.queue]);
    }

    return newItems.map(item => item.id);
  }

  private personalizeMessage(template: string, contact: Contact): string {
    let message = template;
    message = message.replace(/\{\{nome\}\}/g, contact.name);
    message = message.replace(/\{\{telefone\}\}/g, contact.phone);
    message = message.replace(/\{\{email\}\}/g, contact.email || '');
    
    // Add more variables as needed
    const now = new Date();
    message = message.replace(/\{\{data\}\}/g, now.toLocaleDateString('pt-BR'));
    message = message.replace(/\{\{hora\}\}/g, now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    
    return message;
  }

  private calculateScheduledTime(index: number, priority: 'low' | 'normal' | 'high'): Date {
    const baseDelay = (60 / this.config.messagesPerMinute) * 1000; // milliseconds
    let delay = baseDelay * index;

    // Priority adjustment
    if (priority === 'high') {
      delay *= 0.5; // Send high priority messages faster
    } else if (priority === 'low') {
      delay *= 1.5; // Send low priority messages slower
    }

    // Smart delay based on time of day
    if (this.config.enableSmartDelay) {
      const hour = new Date().getHours();
      if (hour >= 22 || hour <= 7) {
        delay *= 2; // Slower during night hours
      }
    }

    return new Date(Date.now() + delay);
  }

  private isBusinessHours(): boolean {
    if (!this.config.respectBusinessHours) return true;

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const startTime = parseInt(this.config.businessHoursStart.replace(':', ''));
    const endTime = parseInt(this.config.businessHoursEnd.replace(':', ''));

    return currentTime >= startTime && currentTime <= endTime;
  }

  private async sendMessage(item: QueueItem): Promise<boolean> {
    try {
      // Simulate API call - replace with actual WhatsApp API
      const response = await fetch('https://api.ultramsg.com/instanceID/messages/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'your-token',
          to: item.contact.phone,
          body: item.message
        })
      });

      // Simulate different response scenarios
      const random = Math.random();
      if (random < 0.85) {
        // 85% success rate
        return true;
      } else if (random < 0.95) {
        // 10% temporary failure
        throw new Error('Número temporariamente indisponível');
      } else {
        // 5% permanent failure
        throw new Error('Número bloqueado ou inválido');
      }
    } catch (error) {
      console.error('Erro no envio:', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    
    console.log('🚀 Pipeline iniciada');
    await this.processQueue();
  }

  public pause(): void {
    this.isPaused = true;
    console.log('⏸️ Pipeline pausada');
  }

  public resume(): void {
    if (!this.isRunning) return;
    
    this.isPaused = false;
    console.log('▶️ Pipeline retomada');
    this.processQueue();
  }

  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    console.log('⏹️ Pipeline parada');
  }

  private async processQueue(): Promise<void> {
    while (this.isRunning && !this.isPaused) {
      // Check daily limit
      if (this.dailyCount >= this.config.dailyLimit) {
        console.log('📊 Limite diário atingido');
        this.stop();
        break;
      }

      // Check business hours
      if (!this.isBusinessHours()) {
        console.log('🕐 Fora do horário comercial, pausando...');
        await this.sleep(60000); // Check again in 1 minute
        continue;
      }

      // Check batch pause
      if (this.needsBatchPause()) {
        console.log('⏳ Pausa entre lotes...');
        await this.sleep(this.config.batchPauseMinutes * 60 * 1000);
        this.currentBatchCount = 0;
        this.lastBatchTime = new Date();
      }

      // Get next item to process
      const nextItem = this.getNextItem();
      if (!nextItem) {
        console.log('✅ Fila processada completamente');
        this.stop();
        break;
      }

      // Check if it's time to send
      if (new Date() < nextItem.scheduledTime) {
        await this.sleep(1000); // Check again in 1 second
        continue;
      }

      // Process the item
      await this.processItem(nextItem);
      
      // Update counters
      this.currentBatchCount++;
      this.updateStats();
      
      // Small delay between messages
      await this.sleep(1000);
    }
  }

  private needsBatchPause(): boolean {
    return this.currentBatchCount >= this.config.batchSize && 
           this.queue.some(item => item.status === 'pending');
  }

  private getNextItem(): QueueItem | null {
    return this.queue.find(item => 
      item.status === 'pending' || 
      (item.status === 'failed' && item.attempts < this.config.maxAttempts)
    ) || null;
  }

  private async processItem(item: QueueItem): Promise<void> {
    // Update status to processing
    item.status = 'processing';
    item.attempts++;
    
    if (this.onQueueUpdate) {
      this.onQueueUpdate([...this.queue]);
    }

    try {
      const success = await this.sendMessage(item);
      
      if (success) {
        item.status = 'sent';
        item.sentTime = new Date();
        this.dailyCount++;
        this.saveDailyCount();
        
        // Simulate delivery confirmation after a delay
        setTimeout(() => {
          item.status = 'delivered';
          item.deliveredTime = new Date();
          if (this.onQueueUpdate) {
            this.onQueueUpdate([...this.queue]);
          }
          this.updateStats();
        }, 3000 + Math.random() * 7000); // 3-10 seconds
        
        console.log(`✅ Mensagem enviada para ${item.contact.name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      item.error = errorMessage;
      
      if (errorMessage.includes('bloqueado') || errorMessage.includes('inválido')) {
        item.status = 'blocked';
        console.log(`🚫 Número bloqueado: ${item.contact.phone}`);
      } else if (item.attempts >= this.config.maxAttempts) {
        item.status = 'failed';
        console.log(`❌ Falha definitiva para ${item.contact.name}: ${errorMessage}`);
      } else {
        item.status = 'pending';
        item.scheduledTime = new Date(Date.now() + this.config.retryDelayMinutes * 60 * 1000);
        console.log(`🔄 Reagendando ${item.contact.name} para nova tentativa`);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getStats(): PipelineStats {
    return { ...this.stats };
  }

  public getQueue(): QueueItem[] {
    return [...this.queue];
  }

  public removeFromQueue(itemId: string): boolean {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.updateStats();
      if (this.onQueueUpdate) {
        this.onQueueUpdate([...this.queue]);
      }
      return true;
    }
    return false;
  }

  public retryItem(itemId: string): boolean {
    const item = this.queue.find(item => item.id === itemId);
    if (item && (item.status === 'failed' || item.status === 'blocked')) {
      item.status = 'pending';
      item.attempts = 0;
      item.error = undefined;
      item.scheduledTime = new Date();
      
      this.updateStats();
      if (this.onQueueUpdate) {
        this.onQueueUpdate([...this.queue]);
      }
      return true;
    }
    return false;
  }

  public updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuração da pipeline atualizada');
  }

  public onStatsChange(callback: (stats: PipelineStats) => void): void {
    this.onStatsUpdate = callback;
  }

  public onQueueChange(callback: (queue: QueueItem[]) => void): void {
    this.onQueueUpdate = callback;
  }

  public clearQueue(): void {
    this.queue = [];
    this.updateStats();
    if (this.onQueueUpdate) {
      this.onQueueUpdate([]);
    }
    console.log('🗑️ Fila limpa');
  }

  public exportLogs(): string {
    const logs = this.queue.map(item => ({
      id: item.id,
      contact: item.contact.name,
      phone: item.contact.phone,
      message: item.message,
      status: item.status,
      attempts: item.attempts,
      scheduledTime: item.scheduledTime.toISOString(),
      sentTime: item.sentTime?.toISOString(),
      deliveredTime: item.deliveredTime?.toISOString(),
      error: item.error
    }));

    return JSON.stringify(logs, null, 2);
  }
}