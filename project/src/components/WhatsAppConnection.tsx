import React, { useEffect, useState } from 'react';
import { Smartphone, RefreshCw, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { API_BASE_URL } from '../hooks/useWhatsApp';

interface WhatsAppConnectionProps {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  qrCode: string | null;
  connectionError: string | null;
  connectionLoading: boolean;
  onFetchConnectionStatus: () => void;
  onStartSession: () => void;
  onCloseSession: () => void;
}

const WhatsAppConnection: React.FC<WhatsAppConnectionProps> = ({ 
  connectionStatus,
  qrCode,
  connectionError,
  connectionLoading,
  onFetchConnectionStatus,
  onStartSession,
  onCloseSession
}) => {
  useEffect(() => {
    // Verificar status inicial
    onFetchConnectionStatus();
  }, [onFetchConnectionStatus]);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'connecting':
        return <RefreshCw className="h-6 w-6 text-yellow-600 animate-spin" />;
      default:
        return <AlertCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'WhatsApp Conectado';
      case 'connecting':
        return 'Aguardando conexão...';
      default:
        return 'WhatsApp Desconectado';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'connecting':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Smartphone className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-900">Integração WhatsApp</h2>
      </div>

      {/* Status Display */}
      <div className={`flex items-center space-x-3 p-4 rounded-lg border ${getStatusColor()} mb-6`}>
        {getStatusIcon()}
        <div>
          <p className="font-medium">{getStatusText()}</p>
          {connectionError && (
            <p className="text-sm text-red-600 mt-1">Erro: {connectionError}</p>
          )}
        </div>
      </div>

      {/* QR Code Display */}
      {qrCode && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <QrCode className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Escaneie o QR Code</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Abra o WhatsApp no seu celular, vá em "Dispositivos conectados" e escaneie o código abaixo:
          </p>
          <div className="flex justify-center">
            <img
              src={qrCode}
              alt="QR Code de Conexão WhatsApp"
              className="w-64 h-64 rounded-lg border shadow-md"
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            O QR Code expira em alguns minutos. Clique em "Atualizar" se necessário.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {connectionStatus === 'disconnected' ? (
          <button
            onClick={onStartSession}
            disabled={connectionLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {connectionLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Smartphone className="h-4 w-4" />
            )}
            <span>{connectionLoading ? 'Conectando...' : 'Conectar WhatsApp'}</span>
          </button>
        ) : (
          <button
            onClick={onCloseSession}
            disabled={connectionLoading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {connectionLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{connectionLoading ? 'Desconectando...' : 'Desconectar'}</span>
          </button>
        )}
        
        <button
          onClick={onFetchConnectionStatus}
          disabled={connectionLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${connectionLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Configuration Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Configuração da API:</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>URL Base:</strong> {API_BASE_URL}</p>
          <p><strong>Endpoints necessários:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>GET /session/start - Iniciar sessão e obter QR Code</li>
            <li>GET /session/status - Verificar status da conexão</li>
            <li>POST /session/close - Encerrar sessão</li>
            <li>POST /send-message - Enviar mensagem de texto</li>
            <li>POST /send-media - Enviar mídia</li>
          </ul>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Como configurar:</h3>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Instale o WPPConnect: <code className="bg-gray-200 px-1 rounded">npm install @wppconnect-team/wppconnect</code></li>
          <li>Configure seu servidor Node.js na porta 3333</li>
          <li>Libere CORS para permitir requisições do frontend</li>
          <li>Implemente os endpoints necessários</li>
          <li>Clique em "Conectar WhatsApp" e escaneie o QR Code</li>
        </ol>
      </div>
    </div>
  );
};

export default WhatsAppConnection;