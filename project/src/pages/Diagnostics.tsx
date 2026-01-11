import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings,
  Send,
  Globe,
  Server,
  Smartphone,
  Zap,
  ExternalLink,
  Copy,
  Save,
  TestTube
} from 'lucide-react';

interface HealthCheck {
  endpoint: string;
  status: 'checking' | 'success' | 'error';
  response?: any;
  error?: string;
  duration?: number;
}

const Diagnostics: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('custom_api_url') || 
    import.meta.env.VITE_API_BASE || 
    'https://seu-backend.onrender.com'
  );
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('5511999887766');
  const [testMessage, setTestMessage] = useState('🤖 Teste do CRM WhatsApp Pro - ' + new Date().toLocaleTimeString());

  const endpoints = [
    { path: '/health', name: 'Health Check', description: 'Verifica se o servidor está online' },
    { path: '/session/status', name: 'WhatsApp Status', description: 'Status da conexão WhatsApp' },
    { path: '/session/start', name: 'Session Start', description: 'Iniciar sessão WhatsApp' }
  ];

  useEffect(() => {
    if (apiUrl !== import.meta.env.VITE_API_BASE) {
      localStorage.setItem('custom_api_url', apiUrl);
    }
  }, [apiUrl]);

  const runHealthCheck = async (endpoint: string): Promise<HealthCheck> => {
    const startTime = Date.now();
    const fullUrl = `${apiUrl}${endpoint}`;
    
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        endpoint,
        status: 'success',
        response: data,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      let errorMessage = 'Erro desconhecido';
      if (error.name === 'TimeoutError') {
        errorMessage = 'Timeout - servidor não respondeu em 10s';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Erro de rede - verifique a URL e CORS';
      } else if (error.message.includes('ERR_NETWORK')) {
        errorMessage = 'Erro de conexão - backend pode estar offline';
      } else {
        errorMessage = error.message;
      }

      return {
        endpoint,
        status: 'error',
        error: errorMessage,
        duration
      };
    }
  };

  const runAllChecks = async () => {
    setTesting(true);
    const checks: HealthCheck[] = [];
    
    for (const endpoint of endpoints) {
      const check = { ...endpoint, endpoint: endpoint.path, status: 'checking' as const };
      checks.push(check);
      setHealthChecks([...checks]);
      
      const result = await runHealthCheck(endpoint.path);
      const index = checks.findIndex(c => c.endpoint === endpoint.path);
      checks[index] = result;
      setHealthChecks([...checks]);
    }
    
    setTesting(false);
  };

  const testSendMessage = async () => {
    if (!testPhone || !testMessage) {
      alert('Preencha telefone e mensagem para teste');
      return;
    }

    setTesting(true);
    
    try {
      const response = await fetch(`${apiUrl}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('✅ Mensagem enviada com sucesso!\n\n' + JSON.stringify(result, null, 2));
      } else {
        alert('❌ Erro no envio:\n\n' + JSON.stringify(result, null, 2));
      }
    } catch (error: any) {
      alert('❌ Erro de conexão:\n\n' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const saveApiUrl = () => {
    setApiUrl(tempApiUrl);
    alert('✅ URL da API salva! Execute os testes novamente.');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('📋 Copiado para a área de transferência!');
  };

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'checking': return <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'checking': return 'bg-blue-500/10 border-blue-500/20';
      case 'success': return 'bg-green-500/10 border-green-500/20';
      case 'error': return 'bg-red-500/10 border-red-500/20';
    }
  };

  return (
    <Layout title="Diagnósticos">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4">
            <Activity className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Diagnósticos do Sistema
          </h1>
          <p className="text-slate-400">
            Teste e configure a conexão com o backend WhatsApp
          </p>
        </div>

        {/* API URL Configuration */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Configuração da API</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                URL do Backend WhatsApp
              </label>
              <div className="flex space-x-3">
                <input
                  type="url"
                  value={tempApiUrl}
                  onChange={(e) => setTempApiUrl(e.target.value)}
                  placeholder="https://sua-url-ngrok.ngrok-free.app"
                  className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={saveApiUrl}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Salvar</span>
                </button>
              </div>
              <p className="text-slate-400 text-sm mt-2">
                URL atual: <code className="bg-slate-700 px-2 py-1 rounded">{apiUrl}</code>
              </p>
            </div>

            {/* Quick Setup Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setTempApiUrl('http://localhost:3333')}
                className="p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl border border-slate-600/30 text-left transition-colors"
              >
                <h4 className="text-white font-medium text-sm">Local</h4>
                <p className="text-slate-400 text-xs">localhost:3333</p>
              </button>
              <button
                onClick={() => setTempApiUrl('https://sua-url.ngrok-free.app')}
                className="p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl border border-slate-600/30 text-left transition-colors"
              >
                <h4 className="text-white font-medium text-sm">Ngrok</h4>
                <p className="text-slate-400 text-xs">Túnel público</p>
              </button>
              <button
                onClick={() => setTempApiUrl('https://seu-app.onrender.com')}
                className="p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl border border-slate-600/30 text-left transition-colors"
              >
                <h4 className="text-white font-medium text-sm">Render</h4>
                <p className="text-slate-400 text-xs">Produção</p>
              </button>
            </div>
          </div>
        </div>

        {/* Health Checks */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Server className="h-6 w-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Testes de Conectividade</h2>
            </div>
            <button
              onClick={runAllChecks}
              disabled={testing}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Testando...</span>
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  <span>Executar Testes</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {endpoints.map((endpoint, index) => {
              const check = healthChecks.find(c => c.endpoint === endpoint.path);
              
              return (
                <div key={endpoint.path} className={`p-4 rounded-xl border ${check ? getStatusColor(check.status) : 'bg-slate-700/30 border-slate-600/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {check ? getStatusIcon(check.status) : <Globe className="h-4 w-4 text-slate-400" />}
                      <div>
                        <h3 className="text-white font-medium">{endpoint.name}</h3>
                        <p className="text-slate-400 text-sm">{endpoint.description}</p>
                        <code className="text-xs text-slate-500">{apiUrl}{endpoint.path}</code>
                      </div>
                    </div>
                    
                    {check && (
                      <div className="text-right">
                        {check.duration && (
                          <p className="text-slate-400 text-xs">{check.duration}ms</p>
                        )}
                        {check.status === 'success' && check.response && (
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(check.response, null, 2))}
                            className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                          >
                            <Copy className="h-3 w-3 inline mr-1" />
                            Copiar resposta
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {check?.response && (
                    <div className="mt-3 bg-slate-900/50 rounded-lg p-3">
                      <pre className="text-xs text-slate-300 overflow-auto">
                        {(() => {
                          try {
                            return JSON.stringify(check.response, null, 2);
                          } catch (error) {
                            return 'Erro ao serializar resposta: objeto contém propriedades não serializáveis';
                          }
                        })()}
                      </pre>
                    </div>
                  )}
                  
                  {check?.error && (
                    <div className="mt-3 bg-red-900/30 rounded-lg p-3">
                      <p className="text-red-400 text-sm">❌ {check.error}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Message Test */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <TestTube className="h-6 w-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Teste de Envio</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Número de Teste
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5511999887766"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-slate-500 text-xs mt-1">Formato: 5511999887766 (com código do país)</p>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Mensagem de Teste
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Mensagem de teste..."
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            onClick={testSendMessage}
            disabled={testing || !testPhone || !testMessage}
            className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
          >
            {testing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Enviando teste...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Enviar Mensagem de Teste</span>
              </>
            )}
          </button>
        </div>

        {/* Common Issues */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-6">
            🔧 Checklist de Problemas Comuns
          </h2>

          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <h3 className="text-yellow-400 font-medium mb-2">
                ⚠️ Ainda aparece "https://seu-backend.onrender.com"
              </h3>
              <p className="text-yellow-300 text-sm mb-3">
                Você não configurou a variável VITE_API_BASE no Bolt Hosting.
              </p>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-300 text-sm mb-2">
                  <strong>Solução:</strong>
                </p>
                <ol className="text-slate-400 text-sm space-y-1 list-decimal list-inside">
                  <li>Vá em Settings → Environment Variables no Bolt Hosting</li>
                  <li>Adicione: <code className="bg-slate-700 px-1 rounded">VITE_API_BASE=https://sua-url-ngrok.ngrok-free.app</code></li>
                  <li>Clique em Deploy para republicar</li>
                </ol>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <h3 className="text-red-400 font-medium mb-2">
                🚫 ERR_NETWORK / CORS
              </h3>
              <p className="text-red-300 text-sm mb-3">
                Erro de CORS ou conexão bloqueada.
              </p>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-300 text-sm mb-2">
                  <strong>Soluções:</strong>
                </p>
                <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                  <li>Verifique FRONTEND_ORIGIN no .env do backend</li>
                  <li>Temporariamente use <code className="bg-slate-700 px-1 rounded">cors({{ origin: '*' }})</code></li>
                  <li>Certifique-se que backend está rodando</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h3 className="text-blue-400 font-medium mb-2">
                🔒 Frontend HTTPS + Backend HTTP
              </h3>
              <p className="text-blue-300 text-sm mb-3">
                Navegador bloqueia "mixed content".
              </p>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-300 text-sm mb-2">
                  <strong>Solução:</strong>
                </p>
                <p className="text-slate-400 text-sm">
                  Use backend HTTPS (ngrok/Render/Railway) ou teste localmente.
                </p>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <h3 className="text-purple-400 font-medium mb-2">
                📱 QR Code não aparece
              </h3>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                  <li>Aguarde alguns segundos após iniciar sessão</li>
                  <li>Verifique logs do backend no terminal</li>
                  <li>Teste o endpoint <code className="bg-slate-700 px-1 rounded">/session/start</code> diretamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Commands */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-4">
            ⚡ Comandos Rápidos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h3 className="text-white font-medium mb-2">Teste Manual cURL:</h3>
              <code className="text-xs text-green-400 bg-slate-900/50 p-2 rounded block">
                curl {apiUrl}/health
              </code>
              <button
                onClick={() => copyToClipboard(`curl ${apiUrl}/health`)}
                className="text-blue-400 hover:text-blue-300 text-xs mt-2"
              >
                <Copy className="h-3 w-3 inline mr-1" />
                Copiar comando
              </button>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4">
              <h3 className="text-white font-medium mb-2">Teste de Mensagem:</h3>
              <code className="text-xs text-green-400 bg-slate-900/50 p-2 rounded block">
                curl -X POST {apiUrl}/send-message \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json\" \<br/>
                &nbsp;&nbsp;-d '{{"to":"5511999887766","message":"Teste!"}}'
              </code>
              <button
                onClick={() => copyToClipboard(`curl -X POST ${apiUrl}/send-message -H "Content-Type: application/json" -d '{"to":"5511999887766","message":"Teste!"}'`)}
                className="text-blue-400 hover:text-blue-300 text-xs mt-2"
              >
                <Copy className="h-3 w-3 inline mr-1" />
                Copiar comando
              </button>
            </div>
          </div>
        </div>

        {/* Alternative Services */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            🚀 Alternativa: Serviços Prontos
          </h2>
          <p className="text-slate-300 mb-4">
            Se não quiser hospedar backend próprio, use serviços prontos:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="text-white font-medium mb-2">UltraMSG</h3>
              <p className="text-slate-400 text-sm mb-3">
                Serviço pago com API pronta para WhatsApp
              </p>
              <a
                href="https://ultramsg.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Acessar UltraMSG</span>
              </a>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="text-white font-medium mb-2">Z-API</h3>
              <p className="text-slate-400 text-sm mb-3">
                API brasileira para automação WhatsApp
              </p>
              <a
                href="https://z-api.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Acessar Z-API</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Diagnostics;