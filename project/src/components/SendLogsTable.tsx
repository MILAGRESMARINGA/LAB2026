import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  XCircle,
  Send,
  User,
  MessageSquare
} from 'lucide-react';

interface SendLog {
  id: string;
  contact: {
    name: string;
    phone: string;
  };
  message: {
    title: string;
    body: string;
  };
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'blocked';
  attempts: number;
  timestamp: string;
  error?: string;
}

const SendLogsTable: React.FC = () => {
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Simular carregamento de logs
    const mockLogs: SendLog[] = [
      {
        id: '1',
        contact: { name: 'João Silva', phone: '11999887766' },
        message: { title: 'Promoção', body: 'Olá João! Temos uma oferta especial...' },
        status: 'delivered',
        attempts: 1,
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        contact: { name: 'Maria Santos', phone: '11988776655' },
        message: { title: 'Follow-up', body: 'Oi Maria! Como está?' },
        status: 'failed',
        attempts: 2,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        error: 'Número temporariamente indisponível'
      },
      {
        id: '3',
        contact: { name: 'Carlos Oliveira', phone: '11977665544' },
        message: { title: 'Lembrete', body: 'Carlos, não esqueça da reunião...' },
        status: 'sent',
        attempts: 1,
        timestamp: new Date(Date.now() - 600000).toISOString(),
      }
    ];

    setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: SendLog['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'sent': return <Send className="h-4 w-4 text-blue-400" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-orange-400" />;
      case 'blocked': return <XCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusText = (status: SendLog['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'sent': return 'Enviada';
      case 'delivered': return 'Entregue';
      case 'failed': return 'Falhou';
      case 'blocked': return 'Bloqueado';
    }
  };

  const getStatusColor = (status: SendLog['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'sent': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'failed': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'blocked': return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  const handleRetry = (logId: string) => {
    setLogs(prev => prev.map(log => 
      log.id === logId 
        ? { ...log, status: 'pending' as const, attempts: log.attempts + 1 }
        : log
    ));
    
    // Simular reenvio
    setTimeout(() => {
      setLogs(prev => prev.map(log => 
        log.id === logId 
          ? { ...log, status: Math.random() > 0.3 ? 'sent' : 'failed' as const }
          : log
      ));
    }, 2000);
  };

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.status === filter
  );

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MessageSquare className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Fila de Envio</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="sent">Enviadas</option>
            <option value="delivered">Entregues</option>
            <option value="failed">Falharam</option>
            <option value="blocked">Bloqueadas</option>
          </select>
          
          <button
            onClick={() => window.location.reload()}
            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-blue-400" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum log de envio encontrado</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Status Icon */}
                  <div className="mt-1">
                    {getStatusIcon(log.status)}
                  </div>
                  
                  {/* Contact Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-white font-medium">{log.contact.name}</span>
                      <span className="text-slate-400 text-sm">({log.contact.phone})</span>
                    </div>
                    
                    <div className="text-sm text-slate-300 mb-2">
                      <strong>{log.message.title}</strong>
                    </div>
                    
                    <div className="text-xs text-slate-400 mb-2 line-clamp-2">
                      {log.message.body}
                    </div>
                    
                    {log.error && (
                      <div className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                        {log.error}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status and Actions */}
                <div className="text-right space-y-2">
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(log.status)}`}>
                    {getStatusIcon(log.status)}
                    <span>{getStatusText(log.status)}</span>
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    <div>Tentativas: {log.attempts}</div>
                    <div>{formatTime(log.timestamp)}</div>
                  </div>
                  
                  {log.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(log.id)}
                      className="text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-3 py-1 rounded-lg transition-colors"
                    >
                      Reenviar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {['pending', 'sent', 'delivered', 'failed', 'blocked'].map(status => {
            const count = logs.filter(log => log.status === status).length;
            return (
              <div key={status} className="bg-slate-700/20 rounded-lg p-3">
                <div className="text-lg font-bold text-white">{count}</div>
                <div className="text-xs text-slate-400 capitalize">{getStatusText(status as any)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SendLogsTable;