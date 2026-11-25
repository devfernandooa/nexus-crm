import { db } from '../lib/firebaseAdmin.js'; // ajuste para o caminho do seu Firestore

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const EMPRESA_ID = process.env.DEFAULT_EMPRESA_ID || 'sAYH5cVoqDn3m5LllObO';

async function enviarTelegram(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true });
  }

  const msg = req.body?.message;
  if (!msg?.text || !msg?.chat?.id) {
    return res.status(200).json({ ok: true });
  }

  const chatId = String(msg.chat.id);
  const nomePerfil = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'Lead Telegram';
  const textoRecebido = msg.text.trim();

  try {
    // 1. Reaproveite aqui a sua função de IA (Groq + Gemini) e extração de dados
    // const { respostaTexto, dadosExtraidos, leadCompleto } = await processarComIA(...);

    const respostaTexto = `Olá, ${nomePerfil}! Recebi sua mensagem sobre "${textoRecebido}". Para avançar com seu atendimento, qual seu telefone ou e-mail de contato?`;

    // 2. Salve/atualize a sessão e o lead no Firestore usando a mesma estrutura do WhatsApp
    await db.collection('whatsapp_sessoes').doc(`tg_${chatId}`).set(
      {
        empresaId: EMPRESA_ID,
        canal: 'telegram',
        waId: `tg_${chatId}`,
        nomePerfilWa: nomePerfil,
        atualizadoEm: new Date(),
      },
      { merge: true }
    );

    // 3. Envia a resposta de volta no Telegram
    await enviarTelegram(chatId, respostaTexto);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro no webhook do Telegram:', err);
    return res.status(500).json({ ok: false });
  }
}