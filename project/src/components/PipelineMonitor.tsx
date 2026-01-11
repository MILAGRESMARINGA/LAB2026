import React, { useState, useEffect } from 'react';
import { MessagePipeline, PipelineStats, QueueItem } from '../services/MessagePipeline';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Download,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Users,
  MessageSquare,
  Timer
} from 'lucide-react';

interface PipelineMonitorProps {
  pipeline: MessagePipeline;
}

const PipelineMonitor: React.FC<PipelineMonitorProps> = ({ pipeline }) => {
  const [stats, setStats] = useState<PipelineStats>(pipeline.getStats());
  const [queue, setQueue] = useState<QueueItem[]>(pipeline.getQueue());
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    pipeline.onStatsChange(setStats);
    pipeline.onQueueChange(setQueue);
    
    return () => {
      pipeline.onStatsChange(() => {});
      pipeline.onQueueChange(() => {});
    };
  }, [pipeline]);

  const handleStart = async () => {
    setIsRunning(true);
    setIsPaused(false);
    await pipeline.start();
  };

  const handlePause = () => {
    setIsPaused(true);
    pipeline.pause();
  };

  const handleResume = () => {
    setIsPaused(false);
    pipeline.resume();
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    pipeline.stop();
  };

  const handleRetry = (itemId: string) => {
    pipeline.retryItem(itemId);
  };

  const handleRemove = (itemId: string) => {
    pipeline.removeFromQueue(itemId);
  };

  const handleExportLogs = () => {
    const logs = pipeline.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearQueue = () => {
    if (confirm('Tem certeza que deseja limpar toda a fila?')) {
      pipeline.clearQueue();
    }
  };

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'sent': return <MessageSquare className="h-4 w-4 text-green-400" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-orange-400" />;
      case 'blocked': return <XCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'sent': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'failed': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'blocked': return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  const getStatusText = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'sent': return 'Enviada';
      case 'delivered': return 'Entregue';
      case 'failed': return 'Falhou';
      case 'blocked': return 'Bloqueado';
    }
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return '-';
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    if (stats.totalQueued === 0) return 0;
    return Math.round(((stats.sent + stats.delivered + stats.failed + stats.blocked) / stats.totalQueued) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Pipeline de Mensagens</h2>
            <p className="text-slate-400">
              Controle inteligente de envio em massa
            </p>
          </div>
          
          <div className="flex space-x-3">
            {!isRunning ? (
              <button
                onClick={handleStart}
                disabled={stats.pending === 0}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Play className="h-5 w-5" />
                <span>Iniciar</span>
              </button>
            ) : isPaused ? (
              <button
                onClick={handleResume}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <Play className="h-5 w-5" />
                <span>Retomar</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <Pause className="h-5 w-5" />
                <span>Pausar</span>
              </button>
            )}
            
            <button
              onClick={handleStop}
              disabled={!isRunning}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Square className="h-5 w-5" />
              <span>Parar</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Progresso Geral</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleExportLogs}
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Logs</span>
          </button>
          <button
            onClick={handleClearQueue}
            className="text-slate-400 hover:text-red-400 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Limpar Fila</span>
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.totalQueued, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'from-yellow-500 to-orange-500' },
          { label: 'Enviadas', value: stats.sent, icon: MessageSquare, color: 'from-green-500 to-emerald-500' },
          { label: 'Entregues', value: stats.delivered, icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
          { label: 'Falharam', value: stats.failed, icon: AlertCircle, color: 'from-orange-500 to-red-500' },
          { label: 'Bloqueadas', value: stats.blocked, icon: XCircle, color: 'from-red-500 to-pink-500' },
        ].map((stat, index) => (
          <div key={index} className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
            <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-slate-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span className="text-white font-medium">Limite Diário</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.dailyCount}/2000</p>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${(stats.dailyCount / 2000) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center space-x-3 mb-2">
            <Timer className="h-5 w-5 text-purple-400" />
            <span className="text-white font-medium">Lote Atual</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.currentBatch}/200</p>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-500 h-2 rounded-full"
              style={{ width: `${(stats.currentBatch / 200) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="h-5 w-5 text-green-400" />
            <span className="text-white font-medium">Conclusão Estimada</span>
          </div>
          <p className="text-lg font-bold text-white">
            {stats.estimatedCompletion 
              ? stats.estimatedCompletion.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : 'N/A'
            }
          </p>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-4">Fila de Processamento</h3>
        
        {queue.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Nenhuma mensagem na fila</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queue.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="flex items-center space-x-4 flex-1">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.contact.name}</p>
                    <p className="text-slate-400 text-sm">{item.contact.phone}</p>
                    {item.error && (
                      <p className="text-red-400 text-xs mt-1">{item.error}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-300">Tentativas: {item.attempts}</p>
                    <p className="text-slate-400">Agendado: {formatTime(item.scheduledTime)}</p>
                    {item.sentTime && (
                      <p className="text-green-400">Enviado: {formatTime(item.sentTime)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 ml-4">
                  <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs border ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span>{getStatusText(item.status)}</span>
                  </div>
                  
                  <div className="flex space-x-1">
                    {(item.status === 'failed' || item.status === 'blocked') && (
                      <button
                        onClick={() => handleRetry(item.id)}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Tentar novamente"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remover da fila"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineMonitor;