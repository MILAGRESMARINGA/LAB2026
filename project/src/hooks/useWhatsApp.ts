// useWhatsApp.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken } from '../lib/authService'; // ajuste o caminho conforme seu projeto

type Status = 'NOT_CONNECTED' | 'CONNECTED_SOCKET' | 'CONNECTED_WPP' | 'QRCODE' | 'DISCONNECTED' | string;

export function useWhatsApp() {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<Status>('NOT_CONNECTED');
  const [qr, setQr] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const token = await getAuthToken();
      if (!token) {
        setStatus('NOT_CONNECTED');
        return;
      }

      const SOCKET_URL = import.meta.env.VITE_WPP_SOCKET_URL || import.meta.env.VITE_API_BASE || 'http://localhost:3333';

      const socket = io(SOCKET_URL, {
        auth: async (cb) => {
          const newToken = await getAuthToken();
          cb({ token: newToken });
        },
        transports: ['websocket'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        if (!mounted) return;
        setStatus('CONNECTED_SOCKET');
      });

      socket.on('qr', (data: { qr: string }) => {
        if (!mounted) return;
        setQr(data.qr);
        setStatus('QRCODE');
      });

      socket.on('status', (data: { status: string }) => {
        if (!mounted) return;
        setStatus(data.status);
      });

      socket.on('connected', () => {
        if (!mounted) return;
        setConnected(true);
        setStatus('CONNECTED_WPP');
      });

      socket.on('message-sent', (payload: any) => {
        // opcional: tratar confirmação de envio
        console.log('[WS] message-sent', payload);
      });

      socket.on('disconnect', () => {
        if (!mounted) return;
        setConnected(false);
        setStatus('DISCONNECTED');
      });

      socket.on('connect_error', (err: any) => {
        console.error('[WS] connect_error', err);
        if (!mounted) return;
        setStatus('DISCONNECTED');
      });
    })();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const startSessionViaSocket = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('start-session');
    }
  };

  return {
    socket: socketRef.current,
    status,
    qr,
    connected,
    startSessionViaSocket
  };
}