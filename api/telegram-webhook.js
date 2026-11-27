import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function initFirebaseAdmin() {
  if (!getApps().length) {
    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!rawJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não configurado.');
    }

    const limpo = rawJson.trim().replace(/^['"]|['"]$/g, '');
    const serviceAccount = JSON.parse(limpo);

    if (typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
}

const EMPRESA_PADRAO =
  process.env.DEFAULT_EMPRESA_ID || 'agrotec-produtos-servicos-agropecuarios';

const normalizarTelefone = (tel = '') => String(tel).replace(/\D/g, '');

async function enviarMensagemTelegram(chatId, texto) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN não configurado.');
  }

  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Erro ao enviar mensagem no Telegram: ${errText}`);
  }
}

async function buscarContatoPorIdentificador(db, empresaId, { chatId, telefone, nome }) {
  const snap = await db
    .collection('contatos')
    .where('empresaId', '==', empresaId)
    .get();

  const contatos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const chatIdStr = String(chatId || '');
  const telLimpo = normalizarTelefone(telefone);
  const nomeLimpo = String(nome || '').trim().toLowerCase();

  if (chatIdStr) {
    const porChat = contatos.find((c) => String(c.telegramChatId || '') === chatIdStr);
    if (porChat) return porChat;
  }

  if (telLimpo.length >= 8) {
    const porTel = contatos.find((c) => {
      const telDoc = normalizarTelefone(c.telefone);
      return (
        telDoc &&
        (telDoc === telLimpo || telDoc.endsWith(telLimpo) || telLimpo.endsWith(telDoc))
      );
    });
    if (porTel) return porTel;
  }

  if (nomeLimpo.length >= 3) {
    const porNome = contatos.find(
      (c) => String(c.nome || '').trim().toLowerCase() === nomeLimpo
    );
    if (porNome) return porNome;
  }

  return null;
}

async function verificarComprasAnteriores(db, empresaId, contato) {
  if (!contato?.id) return false;

  const snap = await db
    .collection('negocios')
    .where('empresaId', '==', empresaId)
    .where('contatoId', '==', contato.id)
    .get();

  return snap.docs.some((d) => {
    const data = d.data();
    const st = String(data.status || '').toLowerCase();
    const temPedidos = Array.isArray(data.pedidos) && data.pedidos.length > 0;
    return st.includes('ganh') || data.tipoNegocio === 'recompra' || temPedidos;
  });
}

async function interpretarMensagemComIA({
  mensagem,
  historico,
  contatoExistente,
  jaComprouAntes,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      respostaTelegram:
        'Olá! Sou o assistente da Agrotec. Como posso ajudar você hoje no campo?',
      dadosExtraidos: {},
      intencao: 'geral',
      itensPedido: [],
    };
  }

  const jaTeveConversa = Array.isArray(historico) && historico.length > 0;

  const systemPrompt = `
Você é o assistente virtual da Agrotec (produtos e serviços agropecuários: sementes, fertilizantes, nutrição animal, defensivos/adjuvantes, irrigação, análise de solo e assistência técnica).
Responda sempre em português do Brasil, de forma cordial, objetiva e natural, sem parecer robô.

Contexto atual do usuário no CRM:
- Já é contato/cliente cadastrado? ${contatoExistente ? `SIM (Nome: ${contatoExistente.nome || 'Cliente'}, Tipo: ${contatoExistente.tipo || 'lead'}, Telefone: ${contatoExistente.telefone || 'não informado'})` : 'NÃO (Novo lead)'}
- Possui compra/negócio anterior? ${jaComprouAntes ? 'SIM' : 'NÃO'}
- Já houve troca de mensagens nesta conversa? ${jaTeveConversa ? 'SIM (NÃO repita a saudação inicial nem diga novamente que localizou o cadastro)' : 'NÃO'}

Regras de atendimento:
1. Se NÃO é contato cadastrado:
   - Colete de forma leve e natural: **Nome**, **Telefone** (com DDD) e **Interesse** (produto ou serviço agropecuário desejado).
   - Não peça os 3 de uma vez de forma dura; acolha e pergunte o que estiver faltando.
2. Se JÁ é contato cadastrado:
   - Apenas na PRIMEIRA mensagem da conversa (quando não houve troca anterior), cumprimente pelo nome e informe que localizou o cadastro na Agrotec. Nas mensagens seguintes, vá direto ao ponto sem repetir apresentação.
   - Se o usuário pedir um produto/serviço, informar variedade (ex.: Mombaça, Marandu) ou quantidade (ex.: 10 sacos de fertilizante NPK 04-14-08), preencha "itensPedido" com cada item identificado (produto, quantidade, valorUnitario estimado ou 0) e use intencao "novo_pedido_recompra", confirmando o registro do pedido/cotação de forma direta.

Responda EXCLUSIVAMENTE em JSON válido com este formato:
{
  "respostaTelegram": "texto para enviar ao usuário no Telegram",
  "intencao": "coleta_lead" | "suporte" | "novo_pedido_recompra" | "geral",
  "dadosExtraidos": {
    "nome": "string ou vazio",
    "telefone": "string ou vazio",
    "interesse": "string ou vazio"
  },
  "itensPedido": [
    {
      "produto": "nome do produto ou serviço",
      "quantidade": 1,
      "valorUnitario": 0
    }
  ]
}
`;

  const contents = [
    ...(historico || []).slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.texto }],
    })),
    {
      role: 'user',
      parts: [{ text: mensagem }],
    },
  ];

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Erro na API Gemini: ${errText}`);
  }

  const json = await resp.json();
  const rawText =
    json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  try {
    return JSON.parse(rawText);
  } catch {
    return {
      respostaTelegram: rawText,
      intencao: 'geral',
      dadosExtraidos: {},
      itensPedido: [],
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const secretEsperado = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secretEsperado) {
    const secretRecebido = req.headers['x-telegram-bot-api-secret-token'];
    if (secretRecebido !== secretEsperado) {
      return res.status(401).json({ ok: false, error: 'Unauthorized webhook' });
    }
  }

  try {
    const db = initFirebaseAdmin();
    const update = req.body || {};
    const msg = update.message || update.edited_message;

    if (!msg?.chat?.id || !msg?.text) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const chatId = String(msg.chat.id);
    const textoUsuario = String(msg.text).trim();
    const nomeTelegram =
      [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') ||
      'Contato Telegram';

    const sessaoRef = db.collection('sessoes_telegram').doc(chatId);
    const sessaoSnap = await sessaoRef.get();
    const sessaoAtual = sessaoSnap.exists ? sessaoSnap.data() : {};

    const rascunhoLead = {
      nome: sessaoAtual.rascunhoLead?.nome || '',
      telefone: sessaoAtual.rascunhoLead?.telefone || '',
      interesse: sessaoAtual.rascunhoLead?.interesse || '',
    };

    const telEncontradoMsg = normalizarTelefone(textoUsuario);
    if (telEncontradoMsg.length >= 8 && !rascunhoLead.telefone) {
      rascunhoLead.telefone = textoUsuario;
    }

    let contato = await buscarContatoPorIdentificador(db, EMPRESA_PADRAO, {
      chatId,
      contatoId: sessaoAtual.contatoId,
      telefone: rascunhoLead.telefone,
    });

    if (!contato && sessaoAtual.contatoId) {
      const cSnap = await db.collection('contatos').doc(sessaoAtual.contatoId).get();
      if (cSnap.exists) {
        contato = { id: cSnap.id, ...cSnap.data() };
      }
    }

    const jaComprouAntes = contato
      ? await verificarComprasAnteriores(db, EMPRESA_PADRAO, contato)
      : false;

    const historicoAtual = Array.isArray(sessaoAtual.historico)
      ? sessaoAtual.historico
      : [];

    const iaResult = await interpretarMensagemComIA({
      mensagem: textoUsuario,
      historico: historicoAtual,
      contatoExistente: contato,
      jaComprouAntes,
    });

    const extraidos = iaResult.dadosExtraidos || {};
    if (extraidos.nome && !rascunhoLead.nome) rascunhoLead.nome = extraidos.nome.trim();
    if (extraidos.telefone) rascunhoLead.telefone = extraidos.telefone.trim();
    if (extraidos.interesse) rascunhoLead.interesse = extraidos.interesse.trim();

    let contatoIdFinal = contato?.id || null;

    if (!contato && rascunhoLead.nome && rascunhoLead.telefone && rascunhoLead.interesse) {
      const novoContatoRef = await db.collection('contatos').add({
        empresaId: EMPRESA_PADRAO,
        nome: rascunhoLead.nome,
        telefone: rascunhoLead.telefone,
        email: '',
        tipo: 'lead',
        status: 'Novo',
        origem: 'telegram',
        telegramChatId: chatId,
        observacoes: `Telegram (${rascunhoLead.telefone}): Interesse em ${rascunhoLead.interesse}`,
        criadoEm: FieldValue.serverTimestamp(),
        atualizadoEm: FieldValue.serverTimestamp(),
      });

      contatoIdFinal = novoContatoRef.id;
      contato = {
        id: contatoIdFinal,
        nome: rascunhoLead.nome,
        telefone: rascunhoLead.telefone,
        tipo: 'lead',
      };

      await db.collection('negocios').add({
        empresaId: EMPRESA_PADRAO,
        contatoId: contatoIdFinal,
        contato: rascunhoLead.nome,
        contatoNome: rascunhoLead.nome,
        telefone: rascunhoLead.telefone,
        titulo: `${rascunhoLead.interesse} - ${rascunhoLead.nome}`,
        tipoNegocio: 'primeiro_negocio',
        status: 'prospeccao',
        origem: 'telegram',
        observacoes: `Interesse via Telegram: ${rascunhoLead.interesse}`,
        pedidos: [],
        produtos: [],
        valor: 0,
        valorTotal: 0,
        dataCriacao: FieldValue.serverTimestamp(),
        atualizadoEm: FieldValue.serverTimestamp(),
      });
    } else if (contato && !contato.telegramChatId) {
      await db.collection('contatos').doc(contato.id).update({
        telegramChatId: chatId,
        atualizadoEm: FieldValue.serverTimestamp(),
      });
    }

    const itensPedido = Array.isArray(iaResult.itensPedido) ? iaResult.itensPedido : [];
    if (contatoIdFinal && itensPedido.length > 0) {
      const pedidosFormatados = itensPedido.map((item, idx) => {
        const quantidade = Number(item.quantidade) || 1;
        const valorUnitario = Number(item.valorUnitario) || 0;
        const nomeProduto = String(item.produto || 'Item Agro').trim() || 'Item Agro';
        return {
          id: `tg_${Date.now()}_${idx}`,
          produto: nomeProduto,
          quantidade,
          valorUnitario,
          subtotal: quantidade * valorUnitario,
          origem: 'telegram',
          dataSolicitacao: new Date().toISOString(),
        };
      });

      const subtotalNovo = pedidosFormatados.reduce(
        (acc, p) => acc + Number(p.subtotal || 0),
        0
      );
      const tipoNegocio = jaComprouAntes ? 'recompra' : 'primeiro_negocio';
      const nomeContato = contato?.nome || rascunhoLead.nome || nomeTelegram;
      const resumoProdutos = pedidosFormatados
        .map((p) => `${p.quantidade}x ${p.produto}`)
        .join(', ');

      const negocioRef = await db.collection('negocios').add({
        empresaId: EMPRESA_PADRAO,
        contatoId: contatoIdFinal,
        contato: nomeContato,
        contatoNome: nomeContato,
        telefone: contato?.telefone || rascunhoLead.telefone || '',
        titulo: `${tipoNegocio === 'recompra' ? 'Recompra' : 'Pedido'} Telegram - ${nomeContato}`,
        tipoNegocio,
        status: 'prospeccao',
        origem: 'telegram',
        observacoes: `Solicitado via Telegram (${chatId})`,
        pedidos: pedidosFormatados,
        produtos: pedidosFormatados.map((p) => p.produto),
        valor: subtotalNovo,
        valorTotal: subtotalNovo,
        dataCriacao: FieldValue.serverTimestamp(),
        atualizadoEm: FieldValue.serverTimestamp(),
      });

      await db.collection('solicitacoes_compra').add({
        empresaId: EMPRESA_PADRAO,
        contatoId: contatoIdFinal,
        negocioId: negocioRef.id,
        contatoNome: nomeContato,
        clienteNome: nomeContato,
        produto: resumoProdutos,
        telefone: contato?.telefone || rascunhoLead.telefone || '',
        tipoSolicitacao: tipoNegocio,
        origem: 'telegram',
        telegramChatId: chatId,
        itens: pedidosFormatados,
        valorEstimado: subtotalNovo,
        lida: false,
        criadoEm: FieldValue.serverTimestamp(),
      });
    }

    const respostaFinal =
      iaResult.respostaTelegram ||
      'Certo! Como posso ajudar você na Agrotec hoje?';

    const novoHistorico = [
      ...historicoAtual,
      { role: 'user', texto: textoUsuario },
      { role: 'assistant', texto: respostaFinal },
    ].slice(-12);

    await sessaoRef.set(
      {
        empresaId: EMPRESA_PADRAO,
        chatId,
        nomeTelegram,
        contatoId: contatoIdFinal,
        tipoContato: contato?.tipo || (contatoIdFinal ? 'lead' : 'desconhecido'),
        rascunhoLead,
        ultimaIntencao: iaResult.intencao || 'geral',
        historico: novoHistorico,
        atualizadoEm: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await enviarMensagemTelegram(chatId, respostaFinal);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erro no webhook do Telegram:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}