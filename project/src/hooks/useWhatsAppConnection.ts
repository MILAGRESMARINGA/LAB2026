import { useState, useEffect } from 'react';
import { WhatsAppService, SessionStatus } from '../services/whatsapp';

export const useWhatsAppConnection = () => {
  const [status, setStatus] = useState<SessionStatus>({
    status: 'DISCONNECTED'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const statusData = await WhatsAppService.getSessionStatus();
      setStatus(statusData);
    } catch (err) {
      // Handle timeout and network errors gracefully
      if (err instanceof Error && (err.message.includes('timeout') || err.message.includes('Network Error') || err.code === 'ECONNREFUSED')) {
        setStatus({ status: 'DISCONNECTED' });
        console.warn('WhatsApp backend não disponível - usando status desconectado');
      } else {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      }
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionData = await WhatsAppService.startSession();
      setStatus(sessionData);
      
      // Se recebeu QR code, verificar status periodicamente
      if (sessionData.qrcode) {
        const interval = setInterval(async () => {
          try {
            const currentStatus = await WhatsAppService.getSessionStatus();
            setStatus(currentStatus);
            
            if (currentStatus.status === 'CONNECTED') {
              clearInterval(interval);
            }
          } catch (error) {
            console.error('Erro ao verificar status:', error);
          }
        }, 3000);

        // Limpar interval após 5 minutos
        setTimeout(() => clearInterval(interval), 300000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sessão');
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async () => {
    try {
      setLoading(true);
      setError(null);
      await WhatsAppService.closeSession();
      setStatus({ status: 'DISCONNECTED' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao encerrar sessão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return {
    status,
    loading,
    error,
    startSession,
    closeSession,
    checkStatus,
  };
};