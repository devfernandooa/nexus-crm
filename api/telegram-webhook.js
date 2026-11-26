import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function obterCredencialFirebase() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n')
    : '';

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  const rawJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    '';

  if (rawJson) {
    const jsonStr = rawJson.trim().startsWith('{')
      ? rawJson.trim()
      : Buffer.from(rawJson.trim(), 'base64').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    if (!parsed.project_id && parsed.projectId) {
      parsed.project_id = parsed.projectId;
    }
    if (typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key
        .replace(/^"|"$/g, '')
        .replace(/\\n/g, '\n');
    }
    return cert(parsed);
  }

  throw new Error(
    'Credenciais do Firebase Admin não configuradas (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY).'
  );
}

if (!getApps().length) {
  initializeApp({
    credential: obterCredencialFirebase(),
  });
}

const db = getFirestore();

async function enviarMensagemTelegram(chatId, texto) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, mensagem: 'Webhook Telegram ativo' });
  }

  const secretEsperado = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secretEsperado) {
    const secretRecebido = req.headers['x-telegram-bot-api-secret-token'];
    if (secretRecebido !== secretEsperado) {
      return res.status(401).json({ ok: false, erro: 'Unauthorized' });
    }
  }

  try {
    const update = req.body;
    const message = update?.message;

    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const texto = message.text.trim();
    const nome =
      [message.from?.first_name, message.from?.last_name]
        .filter(Boolean)
        .join(' ') || 'Lead Telegram';
    const username = message.from?.username ? `@${message.from.username}` : '';
    const empresaId =
      process.env.DEFAULT_EMPRESA_ID || process.env.NEXUS_EMPRESA_ID;

    if (texto === '/start') {
      await enviarMensagemTelegram(
        chatId,
        `Olá, ${nome}! Bem-vindo ao atendimento do Nexus Hub. Como podemos ajudar hoje?`
      );
      return res.status(200).json({ ok: true });
    }

    if (empresaId) {
      await db.collection('contatos').add({
        empresaId,
        nome,
        tipo: 'lead',
        origem: 'telegram',
        telegramChatId: chatId,
        telegramUsername: username,
        observacoes: `Telegram (${username || chatId}): ${texto}`,
        dataCriacao: FieldValue.serverTimestamp(),
      });
    }

    await enviarMensagemTelegram(
      chatId,
      'Recebemos a sua mensagem! Nossa equipe comercial já foi notificada e entrará em contato em breve.'
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erro no webhook do Telegram:', error);
    return res.status(500).json({ ok: false, erro: error.message });
  }
}