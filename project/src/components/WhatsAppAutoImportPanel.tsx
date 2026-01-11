import React, { useState, useEffect } from 'react';
import { whatsappAutoImport } from '../services/whatsappAutoImport';
import { 
  Download, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Users,
  MessageSquare,
  Clock,
  Zap,
  Settings,
  Eye,
  Filter,
  UserPlus,
  TrendingUp,
  Shield,
  Bell
} from 'lucide-react';

interface ImportProgress {
  current: number;
  total: number;
  status: string;
}

const WhatsAppAutoImportPanel: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({ current: 0, total: 0, status: '' });
  const [importedLeads, setImportedLeads] = useState<any[]>([]);
  const [pipelineChanges, setPipelineChanges] = useState<any[]>([]);
  const [config, setConfig] = useState(whatsappAutoImport.getConfig());
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalImported: 0,
    newLeads: 0,
    pipelineChanges: 0,
    lastSync: null as Date | null
  });

  useEffect(() => {
    // Configurar callbacks
    whatsappAutoImport.onProgress(setProgress);
    whatsappAutoImport.onNewLead((lead) => {
      setImportedLeads(prev => [...prev, lead]);
      setStats(prev => ({ ...prev, newLeads: prev.newLeads + 1, totalImported: prev.totalImported + 1 }));
    });
    whatsappAutoImport.onPipelineChange((leadId, newStage, reason) => {
      const change = {
        id: Date.now().toString(),
        leadId,
        newStage,
        reason,
        timestamp: new Date().toISOString()
      };
      setPipelineChanges(prev => [...prev, change]);
      setStats(prev => ({ ...prev, pipelineChanges: prev.pipelineChanges + 1 }));
    });

    return () => {
      whatsappAutoImport.stopRealTimeMonitoring();
    };
  }, []);

  const handleStartImport = async () => {
    try {
      setImporting(true);
      setError(null);
      setImportedLeads([]);
      setPipelineChanges([]);
      
      await whatsappAutoImport.startAutoImport();
      setMonitoring(true);
      setStats(prev => ({ ...prev, lastSync: new Date() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na importação');
    } finally {
      setImporting(false);
    }
  };

  const handleStopMonitoring = () => {
    whatsappAutoImport.stopRealTimeMonitoring();
    setMonitoring(false);
  };

  const handleConfigUpdate = (newConfig: any) => {
    whatsappAutoImport.updateConfig(newConfig);
    setConfig(whatsappAutoImport.getConfig());
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'new': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'contacted': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'follow-up': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'scheduled': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'negotiating': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'closed': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[stage] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStageText = (stage: string) => {
    const texts = {
      'new': '🟡 Novo Lead',
      'contacted': '🟠 Em Atendimento',
      'follow-up': '🔁 Follow-up',
      'scheduled': '📅 Agendamento',
      'negotiating': '📄 Proposta',
      'closed': '✅ Fechamento'
    };
    return texts[stage] || stage;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Main Control Panel */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Importação Automática WhatsApp</h2>
              <p className="text-slate-400">Sistema inteligente de captura e classificação de leads</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${monitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-slate-300 text-sm">
              {monitoring ? 'Monitorando' : 'Parado'}
            </span>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {importing && progress.total > 0 && (
          <div className="mb-6 bg-slate-900/50 rounded-xl p-4">
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>Importando contatos e conversas...</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-slate-400 text-xs mt-2">{progress.status}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/30 rounded-xl p-4 text-center">
            <UserPlus className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.totalImported}</p>
            <p className="text-slate-400 text-sm">Leads Importados</p>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-4 text-center">
            <Users className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.newLeads}</p>
            <p className="text-slate-400 text-sm">Novos Leads</p>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-4 text-center">
            <TrendingUp className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.pipelineChanges}</p>
            <p className="text-slate-400 text-sm">Mudanças Pipeline</p>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-4 text-center">
            <Clock className="h-6 w-6 text-orange-400 mx-auto mb-2" />
            <p className="text-xs text-white">
              {stats.lastSync ? stats.lastSync.toLocaleTimeString('pt-BR') : 'Nunca'}
            </p>
            <p className="text-slate-400 text-sm">Última Sync</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {!importing && !monitoring ? (
            <button
              onClick={handleStartImport}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all flex items-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>Iniciar Importação Automática</span>
            </button>
          ) : monitoring ? (
            <button
              onClick={handleStopMonitoring}
              className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-rose-600 transition-all flex items-center space-x-2"
            >
              <Pause className="h-5 w-5" />
              <span>Parar Monitoramento</span>
            </button>
          ) : (
            <button
              disabled
              className="bg-slate-600 text-white px-6 py-3 rounded-xl font-medium opacity-50 cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Importando...</span>
            </button>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configurações de Importação
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Limite de Dias para Importação
              </label>
              <input
                type="number"
                value={config.importDaysLimit}
                onChange={(e) => handleConfigUpdate({ importDaysLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
                max="90"
              />
              <p className="text-slate-500 text-xs mt-1">Importar conversas dos últimos X dias</p>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Intervalo de Monitoramento (segundos)
              </label>
              <input
                type="number"
                value={config.monitoringInterval / 1000}
                onChange={(e) => handleConfigUpdate({ monitoringInterval: parseInt(e.target.value) * 1000 })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                min="10"
                max="300"
              />
              <p className="text-slate-500 text-xs mt-1">Frequência de verificação de novas mensagens</p>
            </div>
          </div>

          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-yellow-400 font-medium mb-1">🔒 LGPD e Privacidade</h4>
                <p className="text-yellow-300 text-sm">
                  Este sistema importa conversas do WhatsApp. Certifique-se de ter consentimento dos clientes 
                  conforme a LGPD. Os dados são criptografados e armazenados com segurança.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Imported Leads */}
      {importedLeads.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-green-400" />
            Leads Importados ({importedLeads.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {importedLeads.slice(0, 12).map((lead, index) => (
              <div key={index} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{lead.name}</h4>
                    <p className="text-slate-400 text-sm">{lead.phone}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs border ${getStageColor(lead.stage)}`}>
                    {getStageText(lead.stage)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {lead.metadata?.tags?.map((tag: string, tagIndex: number) => (
                      <span key={tagIndex} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {lead.metadata?.last_message_content && (
                    <p className="text-slate-300 text-xs bg-slate-600/30 p-2 rounded">
                      "{lead.metadata.last_message_content.substring(0, 50)}..."
                    </p>
                  )}
                  
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Msgs: {lead.metadata?.message_count || 0}</span>
                    <span>{lead.metadata?.response_status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {importedLeads.length > 12 && (
            <p className="text-slate-400 text-center mt-4">
              ... e mais {importedLeads.length - 12} leads importados
            </p>
          )}
        </div>
      )}

      {/* Pipeline Changes Log */}
      {pipelineChanges.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
            Mudanças Automáticas no Pipeline ({pipelineChanges.length})
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {pipelineChanges.slice(0, 10).map((change) => (
              <div key={change.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Bell className="h-4 w-4 text-purple-400" />
                  <div>
                    <p className="text-white text-sm">
                      Lead movido para <span className="font-medium">{getStageText(change.newStage)}</span>
                    </p>
                    <p className="text-slate-400 text-xs">{change.reason}</p>
                  </div>
                </div>
                <span className="text-slate-500 text-xs">{formatTime(change.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-blue-400 font-bold mb-4">📋 Como Funciona a Importação Automática</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">🔄 Processo Automático:</h4>
            <ol className="text-blue-300 text-sm space-y-1 list-decimal list-inside">
              <li>Conecta ao WhatsApp Web/API</li>
              <li>Importa todos os contatos e conversas</li>
              <li>Cria leads automaticamente para novos números</li>
              <li>Classifica no pipeline baseado na conversa</li>
              <li>Monitora novas mensagens em tempo real</li>
              <li>Move leads automaticamente conforme interações</li>
            </ol>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">🏷️ Tags Automáticas:</h4>
            <div className="flex flex-wrap gap-2">
              {['#whatsapp', '#importado', '#respondeu', '#nova_conversa', '#lead_ativo', '#sem_resposta'].map(tag => (
                <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            
            <h4 className="text-white font-medium mb-2 mt-4">🤖 IA Classificação:</h4>
            <p className="text-blue-300 text-sm">
              Sistema analisa conteúdo das mensagens para detectar intenção e mover automaticamente no pipeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

};

export default WhatsAppAutoImportPanel;