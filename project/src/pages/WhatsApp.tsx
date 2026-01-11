import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import WhatsAppAutoImportPanel from '../components/WhatsAppAutoImportPanel';
import { useWhatsAppConnection } from '../hooks/useWhatsAppConnection';
import { 
  Smartphone, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Power,
  PowerOff,
  Download,
  Zap
} from 'lucide-react';

const WhatsApp: React.FC = () => {
  const navigate = useNavigate();
  const { 
    status, 
    loading, 
    error, 
    startSession, 
    closeSession, 
    checkStatus 
  } = useWhatsAppConnection();

  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'CONNECTED':
        return <CheckCircle className="h-8 w-8 text-green-400" />;
      case 'CONNECTING':
        return <RefreshCw className="h-8 w-8 text-yellow-400 animate-spin" />;
      default:
        return <AlertCircle className="h-8 w-8 text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'CONNECTED':
        return 'WhatsApp Conectado';
      case 'CONNECTING':
        return 'Aguardando Conexão...';
      default:
        return 'WhatsApp Desconectado';
    }
  };

  const getStatusDescription = () => {
    switch (status.status) {
      case 'CONNECTED':
        return 'Seu WhatsApp está conectado e pronto para enviar mensagens.';
      case 'CONNECTING':
        return 'Escaneie o QR Code com seu WhatsApp para conectar.';
      default:
        return 'Clique em "Iniciar Sessão" para conectar seu WhatsApp.';
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'CONNECTED':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'CONNECTING':
        return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      default:
        return 'from-red-500/20 to-rose-500/20 border-red-500/30';
    }
  };

  return (
    <Layout title="Conexão WhatsApp">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-4">
            <Smartphone className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Conexão WhatsApp
          </h1>
          <p className="text-slate-400">
            Configure e gerencie sua conexão com o WhatsApp
          </p>
        </div>

        {/* Status Card */}
        <div className={`mb-8 bg-gradient-to-r ${getStatusColor()} backdrop-blur-xl rounded-2xl p-8 border text-center`}>
          <div className="flex flex-col items-center space-y-4">
            {getStatusIcon()}
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {getStatusText()}
              </h2>
              <p className="text-slate-300 max-w-md">
                {getStatusDescription()}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* QR Code Section */}
        {status.qrcode && (
          <div className="mb-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <QrCode className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">
                  Escaneie o QR Code
                </h3>
              </div>
              
              <div className="bg-white p-4 rounded-2xl inline-block mb-6">
                <img
                  src={status.qrcode}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64 mx-auto"
                />
              </div>
              
              <div className="max-w-md mx-auto">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Como conectar:
                </h4>
                <ol className="text-left text-slate-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span>Abra o WhatsApp no seu celular</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span>Vá em Menu → Dispositivos conectados</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span>Toque em "Conectar um dispositivo"</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                    <span>Escaneie o código QR acima</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {status.status === 'DISCONNECTED' ? (
            <button
              onClick={startSession}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Iniciando...</span>
                </>
              ) : (
                <>
                  <Power className="h-5 w-5" />
                  <span>Iniciar Sessão</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={closeSession}
              disabled={loading}
              className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-8 py-4 rounded-xl font-medium hover:from-red-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Desconectando...</span>
                </>
              ) : (
                <>
                  <PowerOff className="h-5 w-5" />
                  <span>Desconectar</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={checkStatus}
            disabled={loading}
            className="bg-slate-700 text-white px-8 py-4 rounded-xl font-medium hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Status</span>
          </button>
        </div>

        {/* Configuration Info */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4">
            Configuração do Backend
          </h3>
          <div className="bg-slate-900/50 rounded-xl p-4">
            <p className="text-slate-300 text-sm mb-2">
              <strong>URL da API:</strong> {import.meta.env.VITE_API_BASE || 'https://seu-backend.onrender.com'}
            </p>
            <p className="text-slate-400 text-xs">
              Certifique-se de que seu backend WPPConnect está rodando e acessível.
            </p>
          </div>
        </div>

        {/* Auto Import Panel - Only show when connected */}
        {status.status === 'CONNECTED' && (
          <div className="mt-8">
            <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div>
                  <h3 className="text-green-400 font-bold">WhatsApp Conectado com Sucesso!</h3>
                  <p className="text-green-300 text-sm">
                    Agora você pode ativar a importação automática de contatos e conversas
                  </p>
                </div>
              </div>
            </div>
            
            <WhatsAppAutoImportPanel />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WhatsApp;