/**
 * WPP Backend - servidor principal (versão revisada)
 * - JWT via JWKS (Supabase)
 * - Socket.IO auth
 * - Multi-session (Map userId -> sessionData)
 * - Logging no Supabase via service role key (opcional)
 *
 * Requisitos: configurar project/wpp-backend/.env com as variáveis obrigatórias.
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const jwtLib = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const util = require('util');
require('dotenv').config();

// Optional WhatsApp client (wppconnect)
let wppconnect;
try {
  wppconnect = require('@wppconnect-team/wppconnect');
} catch (e) {
  console.warn('[WPP] pacote wppconnect não encontrado. Instale @wppconnect-team/wppconnect se desejar usar integração WPP.');
}

// ENV
const PORT = process.env.PORT || 3333;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const NODE_ENV = process.env.NODE_ENV || 'production';
// allow overriding JWKS endpoint explicitly
const AUTH_JWKS_URI = process.env.AUTH_JWKS_URI || `${(SUPABASE_URL || '').replace(/\/$/, '')}/auth/v1/keys`;

// basic validation
if (!SUPABASE_URL) {
  console.error('FALTA SUPABASE_URL no .env — defina SUPABASE_URL (ex: https://your.supabase.co)');
  process.exit(1);
}
if (!AUTH_JWKS_URI) {
  console.error('FALTA AUTH_JWKS_URI no .env — defina o JWKS URI.');
  process.exit(1);
}

const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

const app = express();
app.use(express.json());
// security middlewares
app.use(helmet());
app.use(cors({ origin: FRONTEND_ORIGIN }));

// rate limiter (ajuste conforme necessidade)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 120, // max requisições por IP por janela
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.get('/health', (req, res) => res.json({ ok: true, env: NODE_ENV }));

/**
 * JWT middleware (aplica apenas em rotas /api)
 */
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    jwksUri: AUTH_JWKS_URI
  }),
  algorithms: ['RS256'],
  requestProperty: 'auth',
  credentialsRequired: true
});
app.use('/api', checkJwt);

// extrai userId do JWT em /api
app.use('/api', (req, res, next) => {
  if (req.auth && req.auth.sub) {
    req.userId = req.auth.sub;
    return next();
  }
  return res.status(401).json({ error: 'Token inválido ou user_id ausente.' });
});

// HTTP + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: FRONTEND_ORIGIN },
  transports: ['websocket']
});

// sessions: userId => { client, status, lastQr, socketId }
const sessions = new Map();

/**
 * JWKS client + validateToken with timeout
 */
const jwksClient = jwksRsa({
  jwksUri: AUTH_JWKS_URI,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

// promisify getSigningKey
const getSigningKey = util.promisify(jwksClient.getSigningKey.bind(jwksClient));

async function validateToken(token) {
  if (!token) throw new Error('token ausente');
  // try to get kid from token header quickly (faster failure)
  let decodedHeader;
  try {
    decodedHeader = jwtLib.decode(token, { complete: true }) || {};
  } catch (e) {
    decodedHeader = {};
  }
  // timeout guard
  const timeoutMs = 5000;
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('JWKS timeout')), timeoutMs));

  const verifyPromise = (async () => {
    // obtain signing key
    const header = decodedHeader.header || {};
    const key = await getSigningKey(header.kid || undefined);
    const pub = key.getPublicKey ? key.getPublicKey() : key.rsaPublicKey || key.publicKey;
    // verify token
    return new Promise((resolve, reject) => {
      jwtLib.verify(token, pub, { algorithms: ['RS256'] }, (err, payload) => {
        if (err) return reject(err);
        resolve(payload);
      });
    });
  })();

  return Promise.race([verifyPromise, timeout]);
}

/**
 * Logging no Supabase (se supabaseAdmin estiver configurado)
 */
async function logWhatsappMessage({ user_id, to, message, status, metadata = {} }) {
  if (!supabaseAdmin) {
    // em dev apenas logar no console
    console.debug('[LOG-WS] supabaseAdmin não configurado —', { user_id, to, status });
    return;
  }
  try {
    const { error } = await supabaseAdmin.from('whatsapp_messages').insert([{
      user_id,
      to,
      message,
      status,
      metadata,
      created_at: new Date().toISOString()
    }]);
    if (error) console.error('Erro ao logar whatsapp_messages:', error);
  } catch (e) {
    console.error('Exceção ao logar whatsapp message:', e);
  }
}

/**
 * startClient: cria/retorna cliente isolado por userId
 * preserva socketId existente (se houver)
 */
async function startClient(userId) {
  const existing = sessions.get(userId) || {};
  const preservedSocketId = existing.socketId;

  // inicializa sessão parcialmente
  const base = { status: 'STARTING', lastQr: existing.lastQr || null, client: existing.client || null, socketId: preservedSocketId };
  sessions.set(userId, base);

  if (!wppconnect) {
    const err = new Error('wppconnect não disponível. Instale @wppconnect-team/wppconnect.');
    const s = sessions.get(userId) || {};
    s.status = 'ERROR';
    sessions.set(userId, s);
    throw err;
  }

  try {
    const client = await wppconnect.create({
      session: userId,
      headless: true,
      qrTimeout: 0,
      puppeteerOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      catchQR: (qrCode) => {
        const s = sessions.get(userId) || {};
        s.status = 'QRCODE';
        s.lastQr = `data:image/png;base64,${qrCode}`;
        sessions.set(userId, s);
        if (s.socketId) io.to(s.socketId).emit('qr', { qr: s.lastQr });
      },
      statusFind: (statusSession) => {
        const s = sessions.get(userId) || {};
        s.status = statusSession;
        sessions.set(userId, s);
        if (s.socketId) io.to(s.socketId).emit('status', { status: statusSession });
      }
    });

    const sFinal = sessions.get(userId) || {};
    sFinal.client = client;
    sFinal.status = 'CONNECTED';
    sessions.set(userId, sFinal);

    if (sFinal.socketId) io.to(sFinal.socketId).emit('connected', { message: 'Conectado' });

    // optional: attach message handlers if available
    try {
      if (client.onMessage) {
        client.onMessage(async (msg) => {
          // aqui você pode processar e possivelmente salvar mensagens recebidas
          // ex: await logWhatsappMessage({ user_id: userId, to: msg.from, message: msg.body, status: 'RECEIVED' });
          // console.debug('[WPP] mensagem recebida', msg);
        });
      }
    } catch (e) {
      console.debug('[WPP] erro ao registrar onMessage:', e?.message || e);
    }

    return client;
  } catch (err) {
    console.error('[WPP] Erro ao criar client para user:', userId, err);
    const s = sessions.get(userId) || {};
    s.status = 'ERROR';
    sessions.set(userId, s);
    throw err;
  }
}

/**
 * safeSend: tenta múltiplos métodos de envio no client (fallback)
 */
async function safeSend(client, to, message) {
  if (!client) throw new Error('Client inválido');
  const attempts = [
    async () => client.sendText ? await client.sendText(to, message) : null,
    async () => client.sendMessage ? await client.sendMessage(to, { text: message }) : null,
    async () => client.sendTextMessage ? await client.sendTextMessage(to, message) : null
  ];
  for (const fn of attempts) {
    try {
      const res = await fn();
      if (res !== null && res !== undefined) {
        return res;
      }
    } catch (e) {
      console.debug('[WPP] safeSend attempt failed:', e?.message || e);
    }
  }
  throw new Error('Nenhum método de envio disponível no client');
}

/**
 * Helper
 */
function getClientByUserId(userId) {
  const s = sessions.get(userId);
  return s ? s.client : null;
}

/**
 * ROUTES (aplicadas em /api/*)
 */
// start-session
app.post('/api/wpp/start-session', async (req, res) => {
  const userId = req.userId;
  try {
    await startClient(userId);
    const s = sessions.get(userId);
    return res.json({ ok: true, status: s ? s.status : 'STARTING' });
  } catch (err) {
    console.error('[API] start-session error', err);
    return res.status(500).json({ ok: false, error: 'Erro ao iniciar sessão WPP', detail: String(err.message || err) });
  }
});

// status
app.get('/api/wpp/status', (req, res) => {
  const userId = req.userId;
  const s = sessions.get(userId);
  if (!s) return res.json({ ok: true, status: 'NOT_STARTED' });
  return res.json({ ok: true, status: s.status, lastQr: s.lastQr || null });
});

// send-message
app.post('/api/wpp/send-message', async (req, res) => {
  const userId = req.userId;
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ ok: false, error: 'Parâmetros to e message obrigatórios' });
  const s = sessions.get(userId);
  if (!s || !s.client) return res.status(400).json({ ok: false, error: 'Sessão de WhatsApp não iniciada para este usuário.' });
  try {
    const result = await safeSend(s.client, to, message);
    await logWhatsappMessage({ user_id: userId, to, message, status: 'SENT', metadata: result || {} });
    if (s.socketId) io.to(s.socketId).emit('message-sent', { to, message, result });
    return res.json({ ok: true, messageId: (result && (result.id || result.messageId)) || null, status: 'SENT' });
  } catch (err) {
    console.error('[API] send-message error', err);
    await logWhatsappMessage({ user_id: userId, to, message, status: 'ERROR', metadata: { error: String(err) } });
    return res.status(500).json({ ok: false, error: 'Erro ao enviar mensagem', detail: String(err.message || err) });
  }
});

/**
 * Dev-only debug route to inspect session - protected by JWT
 */
if (NODE_ENV === 'development') {
  app.get('/api/debug/session', (req, res) => {
    const userId = req.auth && req.auth.sub ? req.auth.sub : null;
    if (!userId) return res.status(401).json({ ok: false, error: 'no user' });
    const s = sessions.get(userId) || null;
    const safe = s ? { status: s.status, hasClient: !!s.client, socketId: s.socketId, lastQr: !!s.lastQr } : null;
    return res.json({ ok: true, session: safe });
  });
}

/**
 * Socket.IO auth: token via socket.handshake.auth.token
 */
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Token ausente'));
    const payload = await validateToken(token);
    if (!payload || !payload.sub) return next(new Error('Token inválido'));
    socket.userId = payload.sub;
    return next();
  } catch (err) {
    console.error('[WS] auth error', err);
    return next(new Error('Auth inválida'));
  }
});

io.on('connection', (socket) => {
  const uid = socket.userId;
  console.log(`[WS] socket conectado user: ${uid} (id: ${socket.id})`);
  // attach socketId to session, preserving other fields
  const s = sessions.get(uid) || {};
  s.socketId = socket.id;
  sessions.set(uid, s);

  if (s.lastQr) socket.emit('qr', { qr: s.lastQr });
  if (s.status) socket.emit('status', { status: s.status });

  socket.on('disconnect', (reason) => {
    console.log(`[WS] desconectado user: ${uid} reason: ${reason}`);
    const ss = sessions.get(uid);
    if (ss) {
      delete ss.socketId;
      sessions.set(uid, ss);
    }
  });

  socket.on('start-session', async () => {
    try {
      await startClient(uid);
      const s2 = sessions.get(uid);
      socket.emit('status', { status: s2.status });
    } catch (err) {
      socket.emit('error', { message: 'Erro ao iniciar sessão', detail: String(err.message || err) });
    }
  });
});

// graceful shutdown
async function shutdown() {
  console.log('Shutdown iniciado...');
  try {
    await new Promise((resolve) => server.close(resolve));
    // se quiser fechar clients wppconnect, faça aqui:
    for (const [uid, s] of sessions.entries()) {
      try {
        if (s.client && s.client.close) {
          await s.client.close().catch(() => null);
        }
      } catch (e) {
        // ignore
      }
    }
    console.log('Shutdown completo.');
    process.exit(0);
  } catch (e) {
    console.error('Erro durante shutdown', e);
    process.exit(1);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
server.listen(PORT, () => {
  console.log(`WPP Backend rodando em http://localhost:${PORT} (env: ${NODE_ENV})`);
});