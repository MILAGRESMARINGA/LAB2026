import React from 'react';
import { Database, MessageSquare, Shield } from 'lucide-react';
import WhatsAppConnection from '../components/WhatsAppConnection';

interface SettingsProps {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  qrCode: string | null;
  connectionError: string | null;
  connectionLoading: boolean;
  onFetchConnectionStatus: () => void;
  onStartSession: () => void;
  onCloseSession: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  connectionStatus, 
  qrCode, 
  connectionError, 
  connectionLoading, 
  onFetchConnectionStatus, 
  onStartSession, 
  onCloseSession, 
  onConnect, 
  onDisconnect 
}) => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
        <p className="text-gray-600">Configure as integrações e preferências do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Integration */}
        <WhatsAppConnection 
          connectionStatus={connectionStatus}
          qrCode={qrCode}
          connectionError={connectionError}
          connectionLoading={connectionLoading}
          onFetchConnectionStatus={onFetchConnectionStatus}
          onStartSession={onStartSession}
          onCloseSession={onCloseSession}
        />

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Dados</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Armazenamento</h3>
              <p className="text-sm text-gray-600 mb-3">
                Os dados são armazenados localmente no navegador. Em produção, configure um banco de dados.
              </p>
            </div>

            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Exportar Dados
              </button>
              <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors">
                Importar Dados
              </button>
              <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                Limpar Dados
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">⚠️ Sugestão para Produção:</h3>
            <p className="text-sm text-yellow-800">
              Configure o Supabase para persistência de dados em produção. Clique em "Connect to Supabase" no topo da tela para configurar.
            </p>
          </div>
        </div>

        {/* Message Templates */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Templates de Mensagem</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Templates Padrão</h3>
              <p className="text-sm text-gray-600 mb-3">
                O sistema inclui templates pré-configurados para diferentes tipos de interação.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">Apresentação Inicial</span>
                <span className="text-xs text-gray-600">Saudação</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">Divulgação de Imóvel</span>
                <span className="text-xs text-gray-600">Propriedade</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">Follow-up</span>
                <span className="text-xs text-gray-600">Acompanhamento</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">Proposta</span>
                <span className="text-xs text-gray-600">Fechamento</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">Segurança e Privacidade</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Proteção de Dados</h3>
              <p className="text-sm text-gray-600 mb-3">
                Este é um ambiente de demonstração. Em produção, implemente autenticação e criptografia adequadas.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked disabled className="h-4 w-4" />
                <span className="text-sm text-gray-700">Dados armazenados localmente</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="h-4 w-4" />
                <span className="text-sm text-gray-700">Backup automático</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="h-4 w-4" />
                <span className="text-sm text-gray-700">Criptografia de dados</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-red-50 rounded-lg">
            <h3 className="font-medium text-red-900 mb-2">⚠️ Importante:</h3>
            <p className="text-sm text-red-800">
              Para uso comercial, implemente autenticação, HTTPS, e siga as regulamentações de proteção de dados (LGPD).
            </p>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuração da API</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Exemplos de Endpoints WPPConnect:</h3>
          <code className="text-sm text-gray-800 bg-white p-2 rounded border block">
            POST http://localhost:3333/api/send-message<br/>
            {JSON.stringify({ phone: "11999887766", message: "Olá! Como posso ajudá-lo?" }, null, 2)}
          </code>
          
          <h3 className="font-medium text-gray-900 mb-3 mt-4">Endpoint de Envio de Mídia:</h3>
          <code className="text-sm text-gray-800 bg-white p-2 rounded border block">
            POST http://localhost:3333/api/send-media<br/>
            FormData: phone, media (file), type, caption
          </code>
          
          <h3 className="font-medium text-gray-900 mb-3 mt-4">Exemplo de implementação no Node.js:</h3>
          <code className="text-sm text-gray-800 bg-white p-2 rounded border block whitespace-pre">
{`const wppconnect = require('@wppconnect-team/wppconnect');

app.post('/api/send-message', async (req, res) => {
  try {
    const { phone, message } = req.body;
    await client.sendText(phone + '@c.us', message);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`}
          </code>
          
          <h3 className="font-medium text-gray-900 mb-3 mt-4">Exemplo para envio de mídia:</h3>
          <code className="text-sm text-gray-800 bg-white p-2 rounded border block whitespace-pre">
{`const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/send-media', upload.single('media'), async (req, res) => {
  try {
    const { phone, type, caption } = req.body;
    const mediaPath = req.file.path;
    
    if (type === 'image') {
      await client.sendImage(phone + '@c.us', mediaPath, 'image', caption);
    } else if (type === 'video') {
      await client.sendVideoAsGif(phone + '@c.us', mediaPath, 'video', caption);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`}
          </code>
        </div>
      </div>
    </div>
  );
};

export default Settings;