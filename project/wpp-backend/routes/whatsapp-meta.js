/**
 * WhatsApp Meta Official API
 * - Enviar mensagens via Graph API
 * - Receber webhooks de mensagens
 * - Gerenciar templates de mensagens
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// ENV variables
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_API_GRAPH_URL = process.env.META_API_GRAPH_URL || 'https://graph.instagram.com/v18.0';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

/**
 * POST /webhook - Receber mensagens do WhatsApp
 */
router.post('/webhook', async (req, res) => {
  const body = req.body;

  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.challenge']) {
    const verifyToken = req.query['hub.verify_token'];
    if (verifyToken === META_WEBHOOK_VERIFY_TOKEN) {
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.status(403).json({ error: 'Token de verificação inválido' });
  }

  if (body.object) {
    body.entry?.forEach((entry) => {
      const changes = entry.changes || [];
      changes.forEach((change) => {
        if (change.field === 'messages') {
          const messages = change.value.messages || [];
          console.log('[META-WEBHOOK] Nova mensagem:', messages);
        }
      });
    });
    return res.status(200).json({ received: true });
  }

  res.status(400).json({ error: 'Payload inválido' });
});

/**
 * GET /webhook - Validação de URL pelo Meta
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[META] Webhook verificado com sucesso');
    return res.status(200).send(challenge);
  }

  console.warn('[META] Tentativa de webhook com token inválido');
  res.status(403).json({ error: 'Token inválido' });
});

/**
 * POST /send-message - Enviar mensagem de texto
 */
router.post('/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'Parâmetros "to" e "message" obrigatórios' });
    }

    const phoneNumber = to.replace(/\D/g, '');

    const response = await axios.post(
      `${META_API_GRAPH_URL}/${META_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[META] Mensagem enviada:', response.data);

    res.json({
      ok: true,
      messageId: response.data.messages[0]?.id,
      status: 'SENT'
    });
  } catch (error) {
    console.error('[META] Erro:', error.response?.data || error.message);
    res.status(500).json({
      ok: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
