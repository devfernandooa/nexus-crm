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
const TIMEOUT_IA_MS = 6000; // 6s máx. aguardando resposta da IA

const normalizarTelefone = (tel = '') => String(tel).replace(/\D/g, '');

function toNumeroSeguro(valor, fallback = 0) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : fallback;
  }
  if (typeof valor === 'string') {
    const limpo = valor
      .replace(/[R$\s]/gi, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(',', '.');
    const num = Number(limpo);
    return Number.isFinite(num) ? num : fallback;
  }
  return fallback;
}

function normalizarItemComCatalogo(item, catalogo = [], idx = 0, origem = 'telegram') {
  const nomeBruto = String(item?.produto || item?.nome || 'Item').trim() || 'Item';
  const match = catalogo.find(
    (p) =>
      p.nome &&
      (p.nome.toLowerCase() === nomeBruto.toLowerCase() ||
        nomeBruto.toLowerCase().includes(p.nome.toLowerCase()))
  );

  const quantidade = Math.max(1, Math.floor(toNumeroSeguro(item?.quantidade, 1)));
  const precoCatalogo = toNumeroSeguro(match?.preco, 0);
  const precoItem = toNumeroSeguro(
    item?.valorUnitario ?? item?.precoUnitario ?? item?.preco,
    0
  );
  const valorUnitario = precoItem > 0 ? precoItem : precoCatalogo;
  const subtotal = toNumeroSeguro(quantidade * valorUnitario, 0);

  return {
    id: item?.id || `${origem}_${Date.now()}_${idx}`,
    produtoId: match?.id || item?.produtoId || null,
    nome: match?.nome || nomeBruto,
    produto: match?.nome || nomeBruto,
    tipo: match?.tipo || item?.tipo || 'Produto',
    quantidade,
    valorUnitario,
    precoUnitario: valorUnitario,
    preco: valorUnitario,
    subtotal,
    origem,
    dataSolicitacao: item?.dataSolicitacao || new Date().toISOString(),
  };
}

async function buscarProdutosEmpresa(db, empresaId) {
  try {
    const snap = await db
      .collection('produtos')
      .where('empresaId', '==', empresaId)
      .limit(30)
      .get();

    return snap.docs.map((doc) => ({
      id: doc.id,
      nome: doc.data().nome || '',
      preco: toNumeroSeguro(doc.data().preco, 0),
      tipo: doc.data().tipo || 'Produto',
    }));
  } catch (err) {
    console.warn('⚠️ Não foi possível listar produtos no Telegram:', err.message);
    return [];
  }
}

function removerTelefonesDoTexto(texto = '') {
  return String(texto)
    .replace(/\b(?:\+?55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}\b/g, ' ')
    .replace(/\b\d{8,11}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function itemPareceTelefoneOuNumeroSolto(produto = '', quantidade = 1) {
  const limpo = String(produto).replace(/\D/g, '');
  if (limpo.length >= 8) return true;
  if (/^\d{2}$/.test(String(quantidade)) && limpo.length >= 6) return true;
  return false;
}

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

function mesclarItensPedido(existentes = [], novos = [], catalogo = []) {
  const mapa = new Map();

  for (const item of existentes) {
    const prod = String(item.produto || item.nome || '').trim();
    const qtd = Math.max(1, Math.floor(toNumeroSeguro(item.quantidade, 1)));
    if (!prod || itemPareceTelefoneOuNumeroSolto(prod, qtd)) continue;
    const norm = normalizarItemComCatalogo(item, catalogo, mapa.size, 'telegram');
    mapa.set(prod.toLowerCase(), norm);
  }

  for (const raw of novos) {
    const nomeProduto = String(raw.produto || raw.nome || '').trim();
    const quantidade = Math.max(1, Math.floor(toNumeroSeguro(raw.quantidade, 1)));
    if (!nomeProduto || itemPareceTelefoneOuNumeroSolto(nomeProduto, quantidade)) continue;

    const chave = nomeProduto.toLowerCase();
    const normNovo = normalizarItemComCatalogo(raw, catalogo, mapa.size, 'telegram');

    if (mapa.has(chave)) {
      const anterior = mapa.get(chave);
      const qtdFinal = quantidade > 1 ? quantidade : anterior.quantidade;
      const valFinal =
        normNovo.valorUnitario > 0 ? normNovo.valorUnitario : anterior.valorUnitario;
      const subtotalFinal = toNumeroSeguro(qtdFinal * valFinal, 0);
      mapa.set(chave, {
        ...anterior,
        nome: normNovo.nome,
        produto: normNovo.produto,
        quantidade: qtdFinal,
        valorUnitario: valFinal,
        precoUnitario: valFinal,
        preco: valFinal,
        subtotal: subtotalFinal,
      });
    } else {
      mapa.set(chave, normNovo);
    }
  }

  return Array.from(mapa.values());
}

async function consolidarEFinalizarPedido(
  db,
  sessaoRef,
  sessaoData,
  motivo = 'cliente_finalizou',
  catalogoProdutos = []
) {
  const itensValidos = (Array.isArray(sessaoData.itensRascunho) ? sessaoData.itensRascunho : [])
    .filter((p) => !itemPareceTelefoneOuNumeroSolto(p.produto || p.nome, p.quantidade))
    .map((p, idx) => normalizarItemComCatalogo(p, catalogoProdutos, idx, 'telegram'));

  const observacaoSolicitacao = String(sessaoData.observacaoPedido || '').trim();

  if (!sessaoData.contatoId || itensValidos.length === 0) {
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

  const subtotalNovo = itensValidos.reduce(
    (acc, p) => acc + toNumeroSeguro(p.subtotal, 0),
    0
  );
  const tipoNegocio = sessaoData.jaComprouAntes ? 'recompra' : 'primeiro_negocio';
  const nomeContato = sessaoData.nomeContato || sessaoData.nomeTelegram || 'Cliente Telegram';
  const telefoneContato = sessaoData.telefoneContato || '';
  const resumoProdutos = itensValidos.map((p) => `${p.quantidade}x ${p.nome}`).join(', ');

  const observacoesCompletas = [
    `Canal: Telegram (${sessaoData.chatId})`,
    `Itens solicitados: ${resumoProdutos}`,
    observacaoSolicitacao ? `Observação: ${observacaoSolicitacao}` : '',
    motivo === 'ociosidade_1min' ? 'Encerrado após 1 min de ociosidade.' : 'Encerrado pelo cliente.',
  ]
    .filter(Boolean)
    .join(' | ');

  const assinaturaAtual = `${sessaoData.contatoId}|${resumoProdutos}`;
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
    pedidos: itensValidos,
    produtos: itensValidos,
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
    produto: resumoProdutos,
    observacoes: observacoesCompletas,
    telefone: telefoneContato,
    tipoSolicitacao: tipoNegocio,
    origem: 'telegram',
    telegramChatId: sessaoData.chatId,
    itens: itensValidos,
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

async function processarSessoesOciosas(db, catalogoProdutos = []) {
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
      'ociosidade_1min',
      catalogoProdutos
    );

    if (resultado && data.chatId) {
      await enviarMensagemTelegram(
        data.chatId,
        `Como ficamos 1 minutinho sem resposta, já fechei e enviei seu pedido (${resultado.resumoProdutos}) para a equipe comercial da Agrotec. Se precisar de mais algum item depois, é só chamar por aqui!`
      );
    } else {
      await docSnap.ref.set(
        { aguardandoResposta: false, atualizadoEm: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    encerradas += 1;
  }

  return encerradas;
}

function fallbackRoteiroHumanizado({ mensagem, contatoExistente, itensAtuais }) {
  const textoOriginal = String(mensagem || '').trim();
  const textoSemTelefone = removerTelefonesDoTexto(textoOriginal);
  const lower = textoOriginal.toLowerCase();
  const lowerSemTel = textoSemTelefone.toLowerCase();
  const primeiroNome =
    String(contatoExistente?.nome || '').trim().split(/\s+/)[0] || '';

  const itensExtraidos = (Array.isArray(itensAtuais) ? itensAtuais : []).filter(
    (i) => !itemPareceTelefoneOuNumeroSolto(i.produto || i.nome, i.quantidade)
  );
  const temItensEmAberto = itensExtraidos.length > 0;

  const ehAgradecimento =
    /^(obrigad[oa]|valeu|brigad[oa]|agrade[cç]o)\b/.test(lower);

  const encerrarPedido =
    /^(n[aã]o|n[aã]o,?\s*obrigad[oa]|s[oó]\s*isso|pode\s*fechar|encerrar|finalizar|nada\s*mais)\b/.test(
      lower
    );

  const ehSaudacao =
    /^(oi+|ol[aá]+|bom\s*dia|boa\s*tarde|boa\s*noite|e\s*a[ií]|tudo\s*bem)\b/.test(
      lower
    );

  const querNovoPedido =
    /novo\s+pedido|fazer\s+(um\s+)?pedido|cotar|or[cç]amento|comprar|recompra/.test(
      lower
    );

  const perguntaCatalogo =
    /quais\s+(itens|produtos|servi[cç]os)|o\s+que\s+(voc[eê]s\s+)?(t[eê]m|tem|vendem|oferecem)|dispon[ií]ve[li]s|cat[aá]logo/.test(
      lower
    );

  let novoItemAdicionado = '';
  let novaObservacao = '';

  const qtdMatch = lowerSemTel.match(
    /(\d+)\s*(sacos?|kg|quilos?|litros?|un|unidades?)\s+(?:de\s+)?([a-zà-ú0-9\-\s]+)/i
  );

  if (qtdMatch && !ehSaudacao && !encerrarPedido && !perguntaCatalogo && !ehAgradecimento) {
    const quantidade = Math.max(1, Math.floor(toNumeroSeguro(qtdMatch[1], 1)));
    const unidade = qtdMatch[2] ? `${qtdMatch[2]} de ` : '';
    const produtoBase = String(qtdMatch[3] || '').trim().slice(0, 70);
    if (produtoBase && !itemPareceTelefoneOuNumeroSolto(produtoBase, quantidade)) {
      const jaExiste = itensExtraidos.some(
        (i) => String(i.produto || i.nome || '').toLowerCase() === produtoBase.toLowerCase()
      );
      if (!jaExiste) {
        itensExtraidos.push({
          produto: produtoBase,
          quantidade,
          valorUnitario: 0,
        });
      }
      novoItemAdicionado = `${quantidade} ${unidade}${produtoBase}`.trim();
      novaObservacao = textoSemTelefone;
    }
  } else if (
    !encerrarPedido &&
    !ehSaudacao &&
    !ehAgradecimento &&
    !perguntaCatalogo &&
    !querNovoPedido &&
    /momba[cç]a|marandu|brachiaria|npk|semente|fertilizante|ra[cç][aã]o|adubo|biobac|defensivo|irrig/i.test(
      lowerSemTel
    )
  ) {
    const itemLimpo = textoSemTelefone
      .replace(/^(adiciona(r)?\s*(o\s+produto|produto|item)?\s*)/i, '')
      .trim()
      .slice(0, 70);
    if (itemLimpo && !itemPareceTelefoneOuNumeroSolto(itemLimpo, 1)) {
      const jaExiste = itensExtraidos.some(
        (i) => String(i.produto || i.nome || '').toLowerCase() === itemLimpo.toLowerCase()
      );
      if (!jaExiste) {
        itensExtraidos.push({
          produto: itemLimpo,
          quantidade: 1,
          valorUnitario: 0,
        });
      }
      novoItemAdicionado = itemLimpo;
      novaObservacao = textoSemTelefone;
    }
  }

  let respostaTelegram = '';

  if (encerrarPedido) {
    if (temItensEmAberto) {
      respostaTelegram = primeiroNome
        ? `Combinado, ${primeiroNome}! Já fechei e enviei seu pedido para o time comercial da Agrotec. Se precisar de mais alguma coisa, é só chamar.`
        : 'Combinado! Já fechei e enviei seu pedido para o time comercial da Agrotec. Se precisar de mais alguma coisa, é só chamar.';
    } else {
      respostaTelegram = primeiroNome
        ? `Tudo certo, ${primeiroNome}! Atendimento encerrado por aqui. Quando precisar, é só mandar mensagem.`
        : 'Tudo certo! Atendimento encerrado por aqui. Quando precisar, é só mandar mensagem.';
    }
  } else if (ehAgradecimento) {
    respostaTelegram = primeiroNome
      ? `Por nada, ${primeiroNome}! Precisando de insumos, cotações ou suporte no campo, estou à disposição.`
      : 'Por nada! Precisando de insumos, cotações ou suporte no campo, estou à disposição.';
  } else if (ehSaudacao) {
    respostaTelegram = primeiroNome
      ? `Oi, ${primeiroNome}! Tudo bem? Como posso te ajudar hoje — quer montar um pedido, ver os itens disponíveis ou falar com a equipe?`
      : 'Oi! Tudo bem? Como posso te ajudar hoje na Agrotec?';
  } else if (perguntaCatalogo) {
    respostaTelegram =
      'Na Agrotec trabalhamos com sementes de pastagem (como Mombaça e Marandu), fertilizantes NPK, nutrição animal, defensivos e adjuvantes, irrigação, análise de solo e assistência técnica. Qual desses você procura e qual quantidade você precisa?';
  } else if (querNovoPedido || (lower === 'sim' && !temItensEmAberto)) {
    respostaTelegram = primeiroNome
      ? `Perfeito, ${primeiroNome}! Quais produtos, variedades ou quantidades você quer incluir nesse pedido?`
      : 'Perfeito! Quais produtos, variedades ou quantidades você quer incluir nesse pedido?';
  } else if (novoItemAdicionado) {
    respostaTelegram = `Anotado: ${novoItemAdicionado}. Quer adicionar mais algum item ou já posso encerrar o pedido?`;
  } else if (!contatoExistente) {
    respostaTelegram =
      'Certo! Para o nosso atendimento na Agrotec, me informe seu nome, telefone com DDD e qual produto ou serviço agropecuário você procura.';
  } else {
    respostaTelegram = primeiroNome
      ? `Entendi, ${primeiroNome}. Sobre esse assunto, não tenho esse detalhe registrado por aqui — se quiser montar um pedido ou consultar nossos produtos agropecuários, é só me dizer qual item e quantidade você precisa.`
      : 'Entendi. Sobre esse assunto, não tenho esse detalhe registrado por aqui — se quiser montar um pedido ou consultar nossos produtos agropecuários, é só me dizer qual item e quantidade você precisa.';
  }

  return {
    modoResposta: 'fallback',
    respostaTelegram,
    intencao: encerrarPedido
      ? 'encerramento'
      : novoItemAdicionado || querNovoPedido
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
  const inicioMs = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fb = fallbackRoteiroHumanizado({ mensagem, contatoExistente, itensAtuais });
    return { ...fb, latenciaIAMs: Date.now() - inicioMs };
  }

  const jaTeveConversa = Array.isArray(historico) && historico.length > 0;

  const systemPrompt = `
Você é o atendente virtual da Agrotec (produtos e serviços agropecuários: sementes, fertilizantes, nutrição animal, defensivos/adjuvantes, irrigação, análise de solo e assistência técnica).
Responda sempre em português do Brasil de forma natural, clara, objetiva e aderente ao que o usuário perguntou ou pediu.

Contexto atual do usuário no CRM:
- Já é contato/cliente cadastrado? ${contatoExistente ? `SIM (Nome: ${contatoExistente.nome || 'Cliente'}, Tipo: ${contatoExistente.tipo || 'lead'}, Telefone: ${contatoExistente.telefone || 'não informado'})` : 'NÃO (Novo lead)'}
- Possui compra/negócio anterior? ${jaComprouAntes ? 'SIM' : 'NÃO'}
- Já houve troca de mensagens nesta conversa? ${jaTeveConversa ? 'SIM (NÃO repita saudação inicial nem diga novamente que localizou o cadastro)' : 'NÃO'}
- Itens já anotados no rascunho atual: ${itensAtuais.length > 0 ? JSON.stringify(itensAtuais.map((i) => ({ produto: i.produto || i.nome, quantidade: i.quantidade }))) : 'Nenhum'}

Regras de roteiro:
1. Responda exatamente ao que o usuário pediu ou perguntou — nunca trate agradecimento ("obrigado"), saudação ("oi", "boa noite") ou dúvida fora do catálogo como se fosse um novo item de pedido.
2. Nunca transforme DDD ou número de telefone em quantidade ou item de pedido.
3. Se o usuário perguntar algo fora do escopo/sem informação disponível, explique com clareza e pergunte como pode ajudar nos produtos/serviços da Agrotec.
4. Se o usuário pedir ou adicionar produto/quantidade válida, atualize "itensPedido" e registre detalhes úteis em "observacaoSolicitacao".
5. Se o usuário encerrar ("encerrar", "não", "só isso", "pode fechar"), defina "encerrarPedido": true e despeça-se de forma natural.

Responda EXCLUSIVAMENTE em JSON válido:
{
  "respostaTelegram": "texto para enviar ao usuário no Telegram",
  "intencao": "coleta_lead" | "suporte" | "novo_pedido_recompra" | "encerramento" | "geral",
  "encerrarPedido": false,
  "observacaoSolicitacao": "resumo objetivo se houver pedido/observação relevante, ou vazio",
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

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_IA_MS),
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

    const latenciaIAMs = Date.now() - inicioMs;
    if (latenciaIAMs > 3500) {
      console.warn(`Demora na resposta da IA Gemini: ${latenciaIAMs}ms`);
    }

    if (!resp.ok) {
      const errText = await resp.text();
      console.warn('Fallback ativado devido a erro na API Gemini:', resp.status, latenciaIAMs, errText);
      const fb = fallbackRoteiroHumanizado({ mensagem, contatoExistente, itensAtuais });
      return { ...fb, latenciaIAMs };
    }

    const json = await resp.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    try {
      const parsed = JSON.parse(rawText);
      return {
        modoResposta: 'ia',
        latenciaIAMs,
        respostaTelegram: parsed.respostaTelegram,
        intencao: parsed.intencao || 'geral',
        encerrarPedido: Boolean(parsed.encerrarPedido),
        observacaoSolicitacao: parsed.observacaoSolicitacao || '',
        dadosExtraidos: parsed.dadosExtraidos || {},
        itensPedido: Array.isArray(parsed.itensPedido) ? parsed.itensPedido : [],
      };
    } catch {
      return {
        modoResposta: 'ia',
        latenciaIAMs,
        respostaTelegram: rawText,
        intencao: 'geral',
        encerrarPedido: false,
        observacaoSolicitacao: '',
        dadosExtraidos: {},
        itensPedido: [],
      };
    }
  } catch (err) {
    const latenciaIAMs = Date.now() - inicioMs;
    console.warn(`Timeout/falha na IA após ${latenciaIAMs}ms:`, err?.message || err);
    const fb = fallbackRoteiroHumanizado({ mensagem, contatoExistente, itensAtuais });
    return { ...fb, latenciaIAMs };
  }
}

export default async function handler(req, res) {
  try {
    const db = initFirebaseAdmin();
    const catalogoProdutos = await buscarProdutosEmpresa(db, EMPRESA_PADRAO);

    if (req.method === 'GET' || req.query?.action === 'check-idle') {
      const encerradas = await processarSessoesOciosas(db, catalogoProdutos);
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

    await processarSessoesOciosas(db, catalogoProdutos);

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
    const itensRascunhoAtual = (
      Array.isArray(sessaoAtual.itensRascunho) ? sessaoAtual.itensRascunho : []
    ).filter((i) => !itemPareceTelefoneOuNumeroSolto(i.produto || i.nome, i.quantidade));

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
    const itensConsolidados = mesclarItensPedido(
      itensRascunhoAtual,
      novosItens,
      catalogoProdutos
    );

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

    const temItensPedido = itensConsolidados.length > 0;

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
      modoUltimaResposta: iaResult.modoResposta || 'ia',
      latenciaUltimaIAMs: iaResult.latenciaIAMs || 0,
      aguardandoResposta: temItensPedido,
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

    if (clienteEncerrou && temItensPedido) {
      await consolidarEFinalizarPedido(
        db,
        sessaoRef,
        dadosSessaoAtualizados,
        'cliente_finalizou',
        catalogoProdutos
      );
    }

    await enviarMensagemTelegram(chatId, respostaFinal);

    return res.status(200).json({ ok: true, latenciaIAMs: iaResult.latenciaIAMs || 0 });
  } catch (error) {
    console.error('Erro no webhook do Telegram:', error);
    return res.status(200).json({ ok: false, error: error.message });
  }
}