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
    return cert({ projectId, clientEmail, privateKey });
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

  throw new Error('Credenciais do Firebase Admin não configuradas.');
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

function extrairTelefoneTexto(texto) {
  const apenasDigitos = texto.replace(/\D/g, '');
  const match = apenasDigitos.match(/(?:55)?(\d{2}9?\d{8})/);
  return match ? match[1] : '';
}

async function buscarContatoExistente(empresaId, { chatId, username, telefoneDigitos }) {
  const contatosRef = db.collection('contatos');

  // 1. Busca pelo telegramChatId
  const snapChat = await contatosRef
    .where('empresaId', '==', empresaId)
    .where('telegramChatId', '==', chatId)
    .limit(1)
    .get();

  if (!snapChat.empty) {
    const doc = snapChat.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // 2. Busca pelo username do Telegram (se existir)
  if (username) {
    const snapUser = await contatosRef
      .where('empresaId', '==', empresaId)
      .where('telegramUsername', '==', username)
      .limit(1)
      .get();

    if (!snapUser.empty) {
      const doc = snapUser.docs[0];
      return { id: doc.id, ...doc.data() };
    }
  }

  // 3. Se o usuário informou um telefone na mensagem, tenta casar com a carteira
  if (telefoneDigitos && telefoneDigitos.length >= 8) {
    const sufixo = telefoneDigitos.slice(-8);
    const snapEmpresa = await contatosRef
      .where('empresaId', '==', empresaId)
      .get();

    for (const doc of snapEmpresa.docs) {
      const dados = doc.data();
      const telBase = String(dados.telefone || '').replace(/\D/g, '');
      if (telBase.endsWith(sufixo)) {
        return { id: doc.id, ...dados };
      }
    }
  }

  return null;
}

async function analisarMensagemComIA({ texto, nomeContato, ehCliente, nomeEmpresa }) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const promptSistema = `Você é o assistente virtual oficial da "${nomeEmpresa}", loja especializada em produtos e serviços agropecuários.
Analise a mensagem recebida via Telegram de "${nomeContato}" (${ehCliente ? 'JÁ É CLIENTE CADASTRADO' : 'NOVO CONTATO/LEAD'}).
Responda APENAS com um JSON válido no formato:
{
  "intencao": "compra" | "orcamento" | "duvida" | "saudacao",
  "produto": "nome do produto ou serviço mencionado (ou vazio if não mencionou)",
  "quantidade": "quantidade mencionada (ou vazio)",
  "resposta": "resposta curta, cordial, profissional e objetiva em português do Brasil para enviar ao cliente no Telegram (máximo 2 frases). Se ele ainda não disse qual produto precisa, pergunte qual produto/quantidade deseja cotar. Se já disse, confirme que a equipe comercial da ${nomeEmpresa} recebeu a solicitação."
}`;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: promptSistema },
          { role: 'user', content: texto },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!resp.ok) return null;

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    return content ? JSON.parse(content) : null;
  } catch (err) {
    console.warn('Fallback IA Telegram:', err.message);
    return null;
  }
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
    const nomeTelegram =
      [message.from?.first_name, message.from?.last_name]
        .filter(Boolean)
        .join(' ') || 'Contato Telegram';
    const username = message.from?.username ? `@${message.from.username}` : '';

    const empresaId =
      process.env.DEFAULT_EMPRESA_ID || process.env.NEXUS_EMPRESA_ID;
    const nomeEmpresa =
      process.env.NOME_EMPRESA ||
      process.env.AGROTEC_NOME ||
      'Agrotec Produtos e Serviços Agropecuários';

    if (texto === '/start') {
      await enviarMensagemTelegram(
        chatId,
        `Olá, ${nomeTelegram}! Bem-vindo ao atendimento da ${nomeEmpresa}. Como podemos ajudar hoje? Se já for nosso cliente, pode informar seu telefone ou o produto que deseja adquirir.`
      );
      return res.status(200).json({ ok: true });
    }

    const telefoneDigitos = extrairTelefoneTexto(texto);
    const contatoExistente = empresaId
      ? await buscarContatoExistente(empresaId, { chatId, username, telefoneDigitos })
      : null;

    const ehCliente =
      contatoExistente &&
      (String(contatoExistente.tipo || '').toLowerCase() === 'cliente' ||
        String(contatoExistente.status || '').toLowerCase() === 'cliente');

    const nomeExibicao = contatoExistente?.nome || nomeTelegram;

    // Analisa produto e intenção com IA (com fallback seguro)
    const analiseIA = await analisarMensagemComIA({
      texto,
      nomeContato: nomeExibicao,
      ehCliente: Boolean(ehCliente),
      nomeEmpresa,
    });

    const produtoIdentificado = analiseIA?.produto?.trim() || '';
    const quantidadeIdentificada = analiseIA?.quantidade?.trim() || '';
    const resumoProduto = [produtoIdentificado, quantidadeIdentificada]
      .filter(Boolean)
      .join(' - ');

    if (empresaId) {
      if (contatoExistente) {
        // Atualiza contato existente (cliente ou lead já cadastrado) sem duplicar
        const observacaoAtualizada = resumoProduto
          ? `Telegram — Interesse em: ${resumoProduto} ("${texto}")`
          : `Telegram: ${texto}`;

        await db.collection('contatos').doc(contatoExistente.id).update({
          telegramChatId: chatId,
          ...(username ? { telegramUsername: username } : {}),
          observacoes: observacaoAtualizada,
          ultimoProdutoInteresse: resumoProduto || contatoExistente.ultimoProdutoInteresse || '',
          ultimaInteracaoCanal: 'telegram',
          atualizadoEm: FieldValue.serverTimestamp(),
        });

        // Se for CLIENTE, cria uma solicitação de compra/notificação dedicada para o time comercial
        if (ehCliente) {
          await db.collection('solicitacoes_compra').add({
            empresaId,
            clienteId: contatoExistente.id,
            clienteNome: contatoExistente.nome || nomeTelegram,
            telefone: contatoExistente.telefone || telefoneDigitos || '',
            canal: 'telegram',
            telegramChatId: chatId,
            produto: resumoProduto || 'Produto a confirmar',
            mensagemOriginal: texto,
            status: 'novo',
            lida: false,
            criadoEm: FieldValue.serverTimestamp(),
          });
        }
      } else {
        // Novo Lead
        const obsLead = resumoProduto
          ? `Telegram (${username || chatId}) — Interesse: ${resumoProduto} | "${texto}"`
          : `Telegram (${username || chatId}): ${texto}`;

        await db.collection('contatos').add({
          empresaId,
          nome: nomeTelegram,
          telefone: telefoneDigitos || '',
          tipo: 'lead',
          origem: 'telegram',
          telegramChatId: chatId,
          telegramUsername: username,
          ultimoProdutoInteresse: resumoProduto,
          observacoes: obsLead,
          dataCriacao: FieldValue.serverTimestamp(),
        });
      }
    }

    const respostaFinal =
      analiseIA?.resposta ||
      (ehCliente
        ? `Olá, ${nomeExibicao}! Registramos seu interesse${resumoProduto ? ` em ${resumoProduto}` : ''} na ${nomeEmpresa}. Nossa equipe comercial já foi notificada para agilizar seu pedido!`
        : `Recebemos sua mensagem na ${nomeEmpresa}! Nossa equipe comercial já foi notificada e entrará em contato em breve.`);

    await enviarMensagemTelegram(chatId, respostaFinal);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erro no webhook do Telegram:', error);
    return res.status(500).json({ ok: false, erro: error.message });
  }
}