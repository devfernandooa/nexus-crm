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

const TEMPO_OCIOSIDADE_MS = 60 * 1000; // 1 minuto de ociosidade

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

function mesclarItensPedido(existentes = [], novos = []) {
  const mapa = new Map();

  for (const item of existentes) {
    const chave = String(item.produto || '').trim().toLowerCase();
    if (!chave) continue;
    mapa.set(chave, { ...item });
  }

  for (const raw of novos) {
    const nomeProduto = String(raw.produto || '').trim();
    if (!nomeProduto) continue;
    const chave = nomeProduto.toLowerCase();
    const quantidade = Number(raw.quantidade) || 1;
    const valorUnitario = Number(raw.valorUnitario) || 0;

    if (mapa.has(chave)) {
      const anterior = mapa.get(chave);
      const qtdFinal = quantidade > 1 ? quantidade : anterior.quantidade;
      const valFinal = valorUnitario > 0 ? valorUnitario : anterior.valorUnitario;
      mapa.set(chave, {
        ...anterior,
        produto: nomeProduto,
        quantidade: qtdFinal,
        valorUnitario: valFinal,
        subtotal: qtdFinal * valFinal,
      });
    } else {
      mapa.set(chave, {
        id: `tg_${Date.now()}_${mapa.size}`,
        produto: nomeProduto,
        quantidade,
        valorUnitario,
        subtotal: quantidade * valorUnitario,
        origem: 'telegram',
        dataSolicitacao: new Date().toISOString(),
      });
    }
  }

  return Array.from(mapa.values());
}

async function consolidarEFinalizarPedido(db, sessaoRef, sessaoData, motivo = 'cliente_finalizou') {
  const itens = Array.isArray(sessaoData.itensRascunho) ? sessaoData.itensRascunho : [];
  const observacaoSolicitacao = String(sessaoData.observacaoPedido || '').trim();

  if (!sessaoData.contatoId || (itens.length === 0 && !observacaoSolicitacao)) {
    await sessaoRef.set(
      {
        aguardandoResposta: false,
        itensRascunho: [],
        observacaoPedido: '',
        atualizadoEm: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return null;
  }

  const subtotalNovo = itens.reduce((acc, p) => acc + Number(p.subtotal || 0), 0);
  const tipoNegocio = sessaoData.jaComprouAntes ? 'recompra' : 'primeiro_negocio';
  const nomeContato = sessaoData.nomeContato || sessaoData.nomeTelegram || 'Cliente Telegram';
  const telefoneContato = sessaoData.telefoneContato || '';
  const resumoProdutos =
    itens.length > 0
      ? itens.map((p) => `${p.quantidade}x ${p.produto}`).join(', ')
      : observacaoSolicitacao;

  const observacoesCompletas = [
    `Canal: Telegram (${sessaoData.chatId})`,
    resumoProdutos ? `Itens solicitados: ${resumoProdutos}` : '',
    observacaoSolicitacao ? `Observação do cliente: ${observacaoSolicitacao}` : '',
    motivo === 'ociosidade_1min' ? 'Encerrado após 1 min de ociosidade.' : 'Encerrado pelo cliente.',
  ]
    .filter(Boolean)
    .join(' | ');

  // Evita duplicar exatamente a mesma solicitação recém-criada
  const assinaturaAtual = `${sessaoData.contatoId}|${resumoProdutos}|${observacaoSolicitacao}`;
  if (sessaoData.ultimaAssinaturaFinalizada === assinaturaAtual) {
    await sessaoRef.set(
      {
        aguardandoResposta: false,
        itensRascunho: [],
        observacaoPedido: '',
        atualizadoEm: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return null;
  }

  const negocioRef = await db.collection('negocios').add({
    empresaId: sessaoData.empresaId || EMPRESA_PADRAO,
    contatoId: sessaoData.contatoId,
    contato: nomeContato,
    contatoNome: nomeContato,
    telefone: telefoneContato,
    titulo: `${tipoNegocio === 'recompra' ? 'Recompra' : 'Pedido'} Telegram - ${nomeContato}`,
    tipoNegocio,
    status: 'prospeccao',
    origem: 'telegram',
    observacoes: observacoesCompletas,
    pedidos: itens,
    produtos: itens.map((p) => p.produto),
    valor: subtotalNovo,
    valorTotal: subtotalNovo,
    dataCriacao: FieldValue.serverTimestamp(),
    atualizadoEm: FieldValue.serverTimestamp(),
  });

  await db.collection('solicitacoes_compra').add({
    empresaId: sessaoData.empresaId || EMPRESA_PADRAO,
    contatoId: sessaoData.contatoId,
    negocioId: negocioRef.id,
    contatoNome: nomeContato,
    clienteNome: nomeContato,
    produto: resumoProdutos || 'Solicitação via Telegram',
    observacoes: observacoesCompletas,
    telefone: telefoneContato,
    tipoSolicitacao: tipoNegocio,
    origem: 'telegram',
    telegramChatId: sessaoData.chatId,
    itens,
    valorEstimado: subtotalNovo,
    lida: false,
    criadoEm: FieldValue.serverTimestamp(),
  });

  await sessaoRef.set(
    {
      aguardandoResposta: false,
      itensRascunho: [],
      observacaoPedido: '',
      ultimaAssinaturaFinalizada: assinaturaAtual,
      ultimoNegocioId: negocioRef.id,
      finalizadoEm: FieldValue.serverTimestamp(),
      atualizadoEm: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { negocioId: negocioRef.id, resumoProdutos };
}

async function processarSessoesOciosas(db) {
  const agora = Date.now();
  const snap = await db
    .collection('sessoes_telegram')
    .where('aguardandoResposta', '==', true)
    .get();

  let encerradas = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const ultimaInteracaoMs = Number(data.ultimaInteracaoMs || 0);
    if (!ultimaInteracaoMs || agora - ultimaInteracaoMs < TEMPO_OCIOSIDADE_MS) {
      continue;
    }

    const resultado = await consolidarEFinalizarPedido(
      db,
      docSnap.ref,
      data,
      'ociosidade_1min'
    );

    if (resultado && data.chatId) {
      await enviarMensagemTelegram(
        data.chatId,
        `Como não recebi novas mensagens por aqui, já fechei e enviei sua solicitação (${resultado.resumoProdutos}) para o time comercial da Agrotec. Se lembrar de mais algum item depois, é só mandar um oi!`
      );
    }

    encerradas += 1;
  }

  return encerradas;
}

function fallbackHumanizado({ mensagem, contatoExistente, itensAtuais }) {
  const texto = String(mensagem || '').trim();
  const lower = texto.toLowerCase();
  const primeiroNome =
    String(contatoExistente?.nome || '').trim().split(/\s+/)[0] || '';

  const encerrarPedido =
    /^(n[aã]o|n[aã]o,?\s*obrigad[oa]|s[oó]\s*isso|pode\s*fechar|encerrar|finalizar|nada\s*mais)\b/.test(
      lower
    );

  const ehSaudacao =
    /^(oi+|ol[aá]+|bom\s*dia|boa\s*tarde|boa\s*noite|e\s*a[ií]|tudo\s*bem)\b/.test(
      lower
    );

  const querAdicionar =
    /adicionar|acrescentar|incluir|mais\s+um|outro\s+produto|novo\s+item/.test(
      lower
    );

  const itensExtraidos = [...(itensAtuais || [])];
  let novoItemAdicionado = '';
  let novaObservacao = '';

  const qtdMatch = lower.match(
    /(\d+)\s*(sacos?|kg|quilos?|litros?|un|unidades?)?\s*(?:de\s+)?([a-z0-9\-\s]+)/i
  );

  if (qtdMatch && !ehSaudacao && !encerrarPedido) {
    const quantidade = Number(qtdMatch[1]) || 1;
    const unidade = qtdMatch[2] ? `${qtdMatch[2]} de ` : '';
    const produtoBase = String(qtdMatch[3] || texto).trim().slice(0, 70);
    if (produtoBase) {
      const jaExiste = itensExtraidos.some(
        (i) => i.produto.toLowerCase() === produtoBase.toLowerCase()
      );
      if (!jaExiste) {
        itensExtraidos.push({
          produto: produtoBase,
          quantidade,
          valorUnitario: 0,
        });
      }
      novoItemAdicionado = `${quantidade} ${unidade}${produtoBase}`.trim();
      novaObservacao = texto;
    }
  } else if (
    !encerrarPedido &&
    !ehSaudacao &&
    !querAdicionar &&
    /momba[cç]a|marandu|brachiaria|npk|semente|fertilizante|ra[cç][aã]o|adubo|biobac|defensivo|irrig/i.test(
      lower
    )
  ) {
    const itemLimpo = texto
      .replace(/^(adiciona(r)?\s*(o\s+produto|produto|item)?\s*)/i, '')
      .trim()
      .slice(0, 70);
    if (
      itemLimpo &&
      !itensExtraidos.some((i) => i.produto.toLowerCase() === itemLimpo.toLowerCase())
    ) {
      itensExtraidos.push({
        produto: itemLimpo,
        quantidade: 1,
        valorUnitario: 0,
      });
    }
    novoItemAdicionado = itemLimpo;
    novaObservacao = texto;
  } else if (!encerrarPedido && !ehSaudacao && itensExtraidos.length > 0) {
    novaObservacao = texto;
  }

  let respostaTelegram = '';

  if (encerrarPedido) {
    respostaTelegram = primeiroNome
      ? `Fechado, ${primeiroNome}! Já encaminho tudo para a equipe da Agrotec dar sequência. Qualquer coisa que precisar no campo, estou por aqui.`
      : 'Fechado! Já encaminho tudo para a equipe da Agrotec dar sequência. Se precisar de mais alguma coisa, é só chamar.';
  } else if (ehSaudacao) {
    if (contatoExistente) {
      respostaTelegram = primeiroNome
        ? `Oi, ${primeiroNome}! Tudo bem por aí? Como posso te ajudar hoje — quer fazer um novo pedido, cotar algum insumo ou falar com nossa equipe?`
        : 'Oi! Tudo bem por aí? Como posso te ajudar hoje com sementes, fertilizantes, nutrição animal ou assistência técnica?';
    } else {
      respostaTelegram =
        'Olá! Tudo bem? Sou o assistente da Agrotec. Como posso te ajudar hoje no campo? Se quiser, já me diga seu nome, telefone com DDD e o que você procura.';
    }
  } else if (querAdicionar && !novoItemAdicionado) {
    respostaTelegram =
      'Claro! Qual produto, variedade ou quantidade você quer adicionar ao pedido?';
  } else if (novoItemAdicionado) {
    respostaTelegram = `Perfeito, já anotei ${novoItemAdicionado}. Vai querer incluir mais algum produto ou algum detalhe na observação? Se já estiver tudo certo, é só me avisar para encerrar.`;
  } else if (contatoExistente) {
    respostaTelegram = primeiroNome
      ? `Entendi, ${primeiroNome}. Anotei essa observação por aqui! Quer acrescentar mais algum item ou já podemos encerrar o pedido?`
      : 'Entendi! Anotei esse detalhe por aqui. Quer acrescentar mais algum item ou já podemos encerrar o pedido?';
  } else {
    respostaTelegram =
      'Certo! Para eu deixar tudo organizado para você, me informe seu nome, telefone com DDD e qual produto ou serviço da Agrotec você precisa.';
  }

  return {
    respostaTelegram,
    intencao: encerrarPedido
      ? 'encerramento'
      : novoItemAdicionado || querAdicionar
        ? 'novo_pedido_recompra'
        : 'geral',
    encerrarPedido,
    observacaoSolicitacao: novaObservacao,
    dadosExtraidos: {},
    itensPedido: itensExtraidos,
  };
}

async function interpretarMensagemComIA({
  mensagem,
  historico,
  contatoExistente,
  jaComprouAntes,
  itensAtuais,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackHumanizado({ mensagem, contatoExistente, itensAtuais });
  }

  const jaTeveConversa = Array.isArray(historico) && historico.length > 0;

  const systemPrompt = `
Você é o atendente virtual da Agrotec (produtos e serviços agropecuários: sementes, fertilizantes, nutrição animal, defensivos/adjuvantes, irrigação, análise de solo e assistência técnica).
Fale em português do Brasil de forma humana, natural, acolhedora e direta — como um bom consultor agropecuário no chat, nunca robótico ou repetitivo.

Contexto atual do usuário no CRM:
- Já é contato/cliente cadastrado? ${contatoExistente ? `SIM (Nome: ${contatoExistente.nome || 'Cliente'}, Tipo: ${contatoExistente.tipo || 'lead'}, Telefone: ${contatoExistente.telefone || 'não informado'})` : 'NÃO (Novo lead)'}
- Possui compra/negócio anterior? ${jaComprouAntes ? 'SIM' : 'NÃO'}
- Já houve troca de mensagens nesta conversa? ${jaTeveConversa ? 'SIM (NÃO repita saudação inicial nem diga novamente que localizou o cadastro)' : 'NÃO'}
- Itens já anotados no rascunho atual: ${itensAtuais.length > 0 ? JSON.stringify(itensAtuais.map((i) => ({ produto: i.produto, quantidade: i.quantidade }))) : 'Nenhum'}

Regras de atendimento:
1. Se NÃO é contato cadastrado:
   - Colete de forma leve e natural: Nome, Telefone (com DDD) e Interesse.
2. Se JÁ é contato cadastrado:
   - Cumprimente pelo primeiro nome apenas na primeira mensagem da conversa. Nas seguintes, responda de forma natural e fluida sem repetir apresentações.
   - Quando o cliente mencionar produto, variedade, quantidade ou quiser adicionar itens, atualize "itensPedido" com os itens acumulados e registre detalhes relevantes em "observacaoSolicitacao", perguntando de forma leve se deseja adicionar algo mais ou encerrar.
   - Não gere encerramento em saudações simples ("oi", "olá", "boa noite").
   - Quando o cliente encerrar ("não", "não, obrigado", "só isso", "pode fechar", "encerrar", "finalizar"), defina "encerrarPedido": true e despeça-se de forma cordial.

Responda EXCLUSIVAMENTE em JSON válido:
{
  "respostaTelegram": "texto para enviar ao usuário no Telegram",
  "intencao": "coleta_lead" | "suporte" | "novo_pedido_recompra" | "encerramento" | "geral",
  "encerrarPedido": false,
  "observacaoSolicitacao": "resumo objetivo do pedido ou observação do cliente",
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
          temperature: 0.35,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    console.warn('Fallback humanizado ativado devido a erro na API Gemini:', resp.status, errText);
    return fallbackHumanizado({ mensagem, contatoExistente, itensAtuais });
  }

  const json = await resp.json();
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  try {
    return JSON.parse(rawText);
  } catch {
    return {
      respostaTelegram: rawText,
      intencao: 'geral',
      encerrarPedido: false,
      observacaoSolicitacao: mensagem,
      dadosExtraidos: {},
      itensPedido: [],
    };
  }
}

export default async function handler(req, res) {
  try {
    const db = initFirebaseAdmin();

    if (req.method === 'GET' || req.query?.action === 'check-idle') {
      const encerradas = await processarSessoesOciosas(db);
      return res.status(200).json({ ok: true, sessoesEncerradas: encerradas });
    }

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

    await processarSessoesOciosas(db);

    const update = req.body || {};
    const msg = update.message || update.edited_message;

    if (!msg?.chat?.id || !msg?.text) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const chatId = String(msg.chat.id);
    const updateId = Number(update.update_id || 0);
    const textoUsuario = String(msg.text).trim();
    const nomeTelegram =
      [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') ||
      'Contato Telegram';

    const sessaoRef = db.collection('sessoes_telegram').doc(chatId);
    const sessaoSnap = await sessaoRef.get();
    const sessaoAtual = sessaoSnap.exists ? sessaoSnap.data() : {};

    if (updateId && Number(sessaoAtual.ultimoUpdateId || 0) >= updateId) {
      return res.status(200).json({ ok: true, duplicated: true });
    }

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
    const itensRascunhoAtual = Array.isArray(sessaoAtual.itensRascunho)
      ? sessaoAtual.itensRascunho
      : [];

    const iaResult = await interpretarMensagemComIA({
      mensagem: textoUsuario,
      historico: historicoAtual,
      contatoExistente: contato,
      jaComprouAntes,
      itensAtuais: itensRascunhoAtual,
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
    } else if (contato && !contato.telegramChatId) {
      await db.collection('contatos').doc(contato.id).update({
        telegramChatId: chatId,
        atualizadoEm: FieldValue.serverTimestamp(),
      });
    }

    const novosItens = Array.isArray(iaResult.itensPedido) ? iaResult.itensPedido : [];
    const itensConsolidados = mesclarItensPedido(itensRascunhoAtual, novosItens);

    const obsNova = String(iaResult.observacaoSolicitacao || '').trim();
    const obsAnterior = String(sessaoAtual.observacaoPedido || '').trim();
    const observacaoConsolidada =
      obsNova && !obsAnterior.toLowerCase().includes(obsNova.toLowerCase())
        ? [obsAnterior, obsNova].filter(Boolean).join(' ; ')
        : obsAnterior || obsNova;

    const respostaFinal =
      iaResult.respostaTelegram ||
      'Oi! Como posso te ajudar hoje na Agrotec?';

    const novoHistorico = [
      ...historicoAtual,
      { role: 'user', texto: textoUsuario },
      { role: 'assistant', texto: respostaFinal },
    ].slice(-12);

    const temConteudoPedido =
      itensConsolidados.length > 0 || Boolean(observacaoConsolidada);

    const dadosSessaoAtualizados = {
      empresaId: EMPRESA_PADRAO,
      chatId,
      ultimoUpdateId: updateId || sessaoAtual.ultimoUpdateId || 0,
      nomeTelegram,
      nomeContato: contato?.nome || rascunhoLead.nome || nomeTelegram,
      telefoneContato: contato?.telefone || rascunhoLead.telefone || '',
      contatoId: contatoIdFinal,
      jaComprouAntes,
      tipoContato: contato?.tipo || (contatoIdFinal ? 'lead' : 'desconhecido'),
      rascunhoLead,
      itensRascunho: itensConsolidados,
      observacaoPedido: observacaoConsolidada,
      ultimaIntencao: iaResult.intencao || 'geral',
      aguardandoResposta: temConteudoPedido,
      ultimaInteracaoMs: Date.now(),
      historico: novoHistorico,
      atualizadoEm: FieldValue.serverTimestamp(),
    };

    await sessaoRef.set(dadosSessaoAtualizados, { merge: true });

    const textoLower = textoUsuario.toLowerCase();
    const clienteEncerrou =
      Boolean(iaResult.encerrarPedido) ||
      /^(n[aã]o|n[aã]o,?\s*obrigad[oa]|s[oó]\s*isso|pode\s*fechar|encerrar|finalizar|nada\s*mais)\b/.test(
        textoLower
      );

    if (clienteEncerrou && temConteudoPedido) {
      await consolidarEFinalizarPedido(
        db,
        sessaoRef,
        dadosSessaoAtualizados,
        'cliente_finalizou'
      );
    }

    await enviarMensagemTelegram(chatId, respostaFinal);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erro no webhook do Telegram:', error);
    return res.status(200).json({ ok: false, error: error.message });
  }
}