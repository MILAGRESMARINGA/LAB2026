import React, { useState } from 'react';
import { Settings, Clock, Users, Zap, Shield, Info } from 'lucide-react';

interface SmartSendingConfigProps {
  onConfigChange: (config: SendingConfig) => void;
}

export interface SendingConfig {
  dailyLimit: number;
  messagesPerMinute: number;
  batchSize: number;
  batchPauseMinutes: number;
  maxAttempts: number;
  enableSmartDelay: boolean;
  respectBusinessHours: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
}

const SmartSendingConfig: React.FC<SmartSendingConfigProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<SendingConfig>({
    dailyLimit: 2000,
    messagesPerMinute: 20,
    batchSize: 200,
    batchPauseMinutes: 5,
    maxAttempts: 3,
    enableSmartDelay: true,
    respectBusinessHours: true,
    businessHoursStart: '08:00',
    businessHoursEnd: '18:00'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleConfigUpdate = (updates: Partial<SendingConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const presets = [
    {
      name: 'Conservador',
      description: 'Máxima segurança, menor velocidade',
      config: {
        dailyLimit: 1000,
        messagesPerMinute: 10,
        batchSize: 100,
        batchPauseMinutes: 10
      }
    },
    {
      name: 'Balanceado',
      description: 'Equilibrio entre velocidade e segurança',
      config: {
        dailyLimit: 2000,
        messagesPerMinute: 20,
        batchSize: 200,
        batchPauseMinutes: 5
      }
    },
    {
      name: 'Agressivo',
      description: 'Máxima velocidade (maior risco)',
      config: {
        dailyLimit: 3000,
        messagesPerMinute: 30,
        batchSize: 300,
        batchPauseMinutes: 3
      }
    }
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="h-6 w-6 text-purple-400" />
        <h3 className="text-xl font-bold text-white">Configurações de Envio Inteligente</h3>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Presets Rápidos:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => handleConfigUpdate(preset.config)}
              className="p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all text-left"
            >
              <h5 className="text-white font-medium mb-1">{preset.name}</h5>
              <p className="text-slate-400 text-sm">{preset.description}</p>
              <div className="mt-2 text-xs text-slate-500">
                {preset.config.dailyLimit}/dia • {preset.config.messagesPerMinute}/min
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Basic Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            <Users className="h-4 w-4 inline mr-1" />
            Limite Diário
          </label>
          <input
            type="number"
            value={config.dailyLimit}
            onChange={(e) => handleConfigUpdate({ dailyLimit: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="100"
            max="5000"
          />
          <p className="text-slate-500 text-xs mt-1">Máximo de mensagens por dia</p>
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            <Zap className="h-4 w-4 inline mr-1" />
            Mensagens por Minuto
          </label>
          <input
            type="number"
            value={config.messagesPerMinute}
            onChange={(e) => handleConfigUpdate({ messagesPerMinute: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="5"
            max="60"
          />
          <p className="text-slate-500 text-xs mt-1">Velocidade de envio</p>
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            <Shield className="h-4 w-4 inline mr-1" />
            Tamanho do Lote
          </label>
          <input
            type="number"
            value={config.batchSize}
            onChange={(e) => handleConfigUpdate({ batchSize: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="50"
            max="500"
          />
          <p className="text-slate-500 text-xs mt-1">Mensagens antes da pausa</p>
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            <Clock className="h-4 w-4 inline mr-1" />
            Pausa entre Lotes (min)
          </label>
          <input
            type="number"
            value={config.batchPauseMinutes}
            onChange={(e) => handleConfigUpdate({ batchPauseMinutes: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="1"
            max="30"
          />
          <p className="text-slate-500 text-xs mt-1">Tempo de pausa para evitar bloqueio</p>
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl border border-slate-600/30 text-white font-medium transition-all mb-4"
      >
        {showAdvanced ? 'Ocultar' : 'Mostrar'} Configurações Avançadas
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-slate-900/30 rounded-xl border border-slate-600/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Máximo de Tentativas
              </label>
              <input
                type="number"
                value={config.maxAttempts}
                onChange={(e) => handleConfigUpdate({ maxAttempts: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1"
                max="5"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enableSmartDelay}
                  onChange={(e) => handleConfigUpdate({ enableSmartDelay: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-slate-300 text-sm">Delay Inteligente</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.respectBusinessHours}
                  onChange={(e) => handleConfigUpdate({ respectBusinessHours: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-slate-300 text-sm">Respeitar Horário Comercial</span>
              </label>
            </div>
          </div>

          {config.respectBusinessHours && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Início do Expediente
                </label>
                <input
                  type="time"
                  value={config.businessHoursStart}
                  onChange={(e) => handleConfigUpdate({ businessHoursStart: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Fim do Expediente
                </label>
                <input
                  type="time"
                  value={config.businessHoursEnd}
                  onChange={(e) => handleConfigUpdate({ businessHoursEnd: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety Warning */}
      <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-400 font-medium mb-1">⚠️ Aviso Importante</h4>
            <p className="text-yellow-300 text-sm">
              Configurações muito agressivas podem resultar em bloqueio temporário ou permanente do número. 
              Recomendamos começar com o preset "Conservador" e aumentar gradualmente conforme a necessidade.
            </p>
          </div>
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="mt-4 bg-slate-700/20 rounded-xl p-4">
        <h4 className="text-white font-medium mb-2">Resumo da Configuração Atual:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Limite Diário</p>
            <p className="text-white font-medium">{config.dailyLimit}</p>
          </div>
          <div>
            <p className="text-slate-400">Velocidade</p>
            <p className="text-white font-medium">{config.messagesPerMinute}/min</p>
          </div>
          <div>
            <p className="text-slate-400">Lote</p>
            <p className="text-white font-medium">{config.batchSize} msgs</p>
          </div>
          <div>
            <p className="text-slate-400">Pausa</p>
            <p className="text-white font-medium">{config.batchPauseMinutes} min</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSendingConfig;