import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Users,
  MessageSquare,
  Timer,
  TrendingUp
} from 'lucide-react';

interface QueueItem {
  id: string;
  contact: {
    name: string;
    phone: string;
  };
  message: string;
  status: 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'blocked';
  attempts: number;
  scheduledTime?: Date;
  sentTime?: Date;
  error?: string;
}

interface MassMessageQueueProps {
  contacts: Array<{id: string; name: string; phone: string}>;
  message: string;
  onComplete: (results: QueueItem[]) => void;
  onCancel: () => void;
}

const MassMessageQueue: React.FC<MassMessageQueueProps> = ({
  contacts,
  message,
  onComplete,
  onCancel
}) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);
  const [batchCount, setBatchCount] = useState(0);
  const [nextBatchTime, setNextBatchTime] = useState<Date | null>(null);
  
  // Configurações inteligentes
  const DAILY_LIMIT = 2000;
  const BATCH_SIZE = 200;
  const MESSAGES_PER_MINUTE = 20;
  const BATCH_PAUSE_MINUTES = 5;
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    // Inicializar fila
    const initialQueue: QueueItem[] = contacts.map((contact, index) => ({
      id: `msg_${Date.now()}_${index}`,
      contact,
      message: message.replace(/\{\{nome\}\}/g, contact.name),
      status: 'pending',
      attempts: 0,
      scheduledTime: new Date(Date.now() + (index * (60000 / MESSAGES_PER_MINUTE)))
    }));
    
    setQueue(initialQueue);
    
    // Recuperar contador diário do localStorage
    const today = new Date().toDateString();
    const savedCount = localStorage.getItem(`daily_count_${today}`);
    setDailyCount(savedCount ? parseInt(savedCount) : 0);
  }, [contacts, message]);

  const updateDailyCount = (increment: number) => {
    const newCount = dailyCount + increment;
    setDailyCount(newCount);
    
    const today = new Date().toDateString();
    localStorage.setItem(`daily_count_${today}`, newCount.toString());
  };

  const simulateMessageSend = async (item: QueueItem): Promise<boolean> => {
    // Simular envio de mensagem
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simular diferentes resultados
    const random = Math.random();
    if (random < 0.85) return true; // 85% sucesso
    if (random < 0.95) throw new Error('Número temporariamente indisponível');
    throw new Error('Número bloqueado ou inválido');
  };

  const processQueue = async () => {
    if (!isRunning || isPaused) return;
    
    const pendingItems = queue.filter(item => 
      item.status === 'pending' || (item.status === 'failed' && item.attempts < MAX_ATTEMPTS)
    );
    
    if (pendingItems.length === 0) {
      setIsRunning(false);
      onComplete(queue);
      return;
    }

    // Verificar limite diário
    if (dailyCount >= DAILY_LIMIT) {
      alert(`Limite diário de ${DAILY_LIMIT} mensagens atingido!`);
      setIsRunning(false);
      return;
    }

    // Verificar pausa entre lotes
    if (batchCount >= BATCH_SIZE && nextBatchTime && new Date() < nextBatchTime) {
      setTimeout(processQueue, 1000);
      return;
    }

    // Resetar contador de lote se necessário
    if (batchCount >= BATCH_SIZE) {
      setBatchCount(0);
      setNextBatchTime(null);
    }

    const currentItem = pendingItems[0];
    const itemIndex = queue.findIndex(item => item.id === currentItem.id);
    
    // Verificar se é hora de enviar
    if (currentItem.scheduledTime && new Date() < currentItem.scheduledTime) {
      setTimeout(processQueue, 1000);
      return;
    }

    // Atualizar status para "enviando"
    setQueue(prev => prev.map((item, index) => 
      index === itemIndex 
        ? { ...item, status: 'sending' as const, attempts: item.attempts + 1 }
        : item
    ));

    try {
      await simulateMessageSend(currentItem);
      
      // Sucesso
      setQueue(prev => prev.map((item, index) => 
        index === itemIndex 
          ? { 
              ...item, 
              status: 'sent' as const, 
              sentTime: new Date(),
              // Simular entrega após alguns segundos
              scheduledTime: new Date(Date.now() + 3000)
            }
          : item
      ));

      updateDailyCount(1);
      setBatchCount(prev => prev + 1);
      
      // Simular entrega
      setTimeout(() => {
        setQueue(prev => prev.map((item, index) => 
          index === itemIndex && item.status === 'sent'
            ? { ...item, status: 'delivered' as const }
            : item
        ));
      }, 3000);

      // Verificar se precisa pausar para próximo lote
      if (batchCount + 1 >= BATCH_SIZE) {
        const pauseTime = new Date(Date.now() + BATCH_PAUSE_MINUTES * 60000);
        setNextBatchTime(pauseTime);
      }

    } catch (error) {
      // Falha
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const newStatus = errorMessage.includes('bloqueado') ? 'blocked' : 'failed';
      
      setQueue(prev => prev.map((item, index) => 
        index === itemIndex 
          ? { 
              ...item, 
              status: newStatus as const,
              error: errorMessage,
              // Reagendar se não for bloqueio
              scheduledTime: newStatus === 'failed' 
                ? new Date(Date.now() + 30000) // Tentar novamente em 30s
                : undefined
            }
          : item
      ));
    }

    // Continuar processamento
    setTimeout(processQueue, 3000); // 3 segundos entre mensagens
  };

  const startQueue = () => {
    setIsRunning(true);
    setIsPaused(false);
    processQueue();
  };

  const pauseQueue = () => {
    setIsPaused(true);
  };

  const resumeQueue = () => {
    setIsPaused(false);
    processQueue();
  };

  const stopQueue = () => {
    setIsRunning(false);
    setIsPaused(false);
    onCancel();
  };

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'sending': return <Timer className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'sent': return <MessageSquare className="h-4 w-4 text-yellow-400" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-orange-400" />;
      case 'blocked': return <XCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusText = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'sending': return 'Enviando...';
      case 'sent': return 'Enviada';
      case 'delivered': return 'Entregue';
      case 'failed': return 'Falhou';
      case 'blocked': return 'Bloqueado';
    }
  };

  const stats = {
    total: queue.length,
    pending: queue.filter(item => item.status === 'pending').length,
    sent: queue.filter(item => item.status === 'sent' || item.status === 'delivered').length,
    failed: queue.filter(item => item.status === 'failed' || item.status === 'blocked').length,
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-slate-700/50">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Fila de Envio em Massa</h2>
              <p className="text-slate-400">
                Enviando para {contacts.length} contatos • Limite diário: {dailyCount}/{DAILY_LIMIT}
              </p>
            </div>
            
            <div className="flex space-x-3">
              {!isRunning ? (
                <button
                  onClick={startQueue}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Iniciar</span>
                </button>
              ) : isPaused ? (
                <button
                  onClick={resumeQueue}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Retomar</span>
                </button>
              ) : (
                <button
                  onClick={pauseQueue}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
                >
                  <Pause className="h-5 w-5" />
                  <span>Pausar</span>
                </button>
              )}
              
              <button
                onClick={stopQueue}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <Square className="h-5 w-5" />
                <span>Parar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700/30 rounded-xl p-4 text-center">
              <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-slate-400 text-sm">Total</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4 text-center">
              <Clock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-slate-400 text-sm">Pendentes</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.sent}</p>
              <p className="text-slate-400 text-sm">Enviadas</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4 text-center">
              <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.failed}</p>
              <p className="text-slate-400 text-sm">Falharam</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Progresso</span>
              <span>{Math.round((stats.sent / stats.total) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.sent / stats.total) * 100}%` }}
              />
            </div>
          </div>

          {/* Next Batch Timer */}
          {nextBatchTime && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-yellow-400 text-sm text-center">
                ⏳ Pausa entre lotes: próximo envio em {Math.ceil((nextBatchTime.getTime() - Date.now()) / 1000)}s
              </p>
            </div>
          )}
        </div>

        {/* Queue List */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-2">
            {queue.map((item, index) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  item.status === 'sending' 
                    ? 'bg-blue-500/10 border-blue-500/20' 
                    : 'bg-slate-700/30 border-slate-600/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className="text-white font-medium">{item.contact.name}</p>
                    <p className="text-slate-400 text-sm">{item.contact.phone}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-white text-sm">{getStatusText(item.status)}</p>
                  {item.attempts > 0 && (
                    <p className="text-slate-400 text-xs">Tentativa {item.attempts}</p>
                  )}
                  {item.error && (
                    <p className="text-red-400 text-xs max-w-xs truncate">{item.error}</p>
                  )}
                  {item.sentTime && (
                    <p className="text-green-400 text-xs">
                      {item.sentTime.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50 bg-slate-800/50">
          <div className="flex justify-between items-center text-sm text-slate-400">
            <div>
              <p>⚠️ Limite diário: {DAILY_LIMIT} mensagens</p>
              <p>🔄 Intervalo: {60/MESSAGES_PER_MINUTE}s entre mensagens</p>
            </div>
            <div className="text-right">
              <p>📦 Lote atual: {batchCount}/{BATCH_SIZE}</p>
              <p>⏸️ Pausa entre lotes: {BATCH_PAUSE_MINUTES} min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MassMessageQueue;