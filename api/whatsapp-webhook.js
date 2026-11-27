import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

function obterCredencialFirebase() {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (parsed.private_key && typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  }

  throw new Error(
    'Credenciais do Firebase ausentes: configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY na Vercel.'
  );
}

if (!getApps().length) {
  initializeApp({
    credential: cert(obterCredencialFirebase()),
  });
}

const db = getFirestore();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_EMPRESA_ID =
  process.env.DEFAULT_EMPRESA_ID || 'agrotec-produtos-servicos-agropecuarios';
const TIMEOUT_IA_MS = 6000;

function normalizarTelefone(tel) {
  if (!tel) return '';
  const digitos = String(tel).replace(/\D/g, '');
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return digitos;
}

function ehSaudacaoOuAgradecimento(texto = '') {
  const lower = String(texto).trim().toLowerCase();
  return /^(oi+|ol[aá]+|bom\s*dia|boa\s*tarde|boa\s*noite|e\s*a[ií]|tudo\s*bem|obrigad[oa]|valeu|ok|certo)\b[!?.]*$/.test(
    lower
  );
}

async function buscarProdutosEmpresa(empresaId) {
  try {
    const snap = await db
      .collection('produtos')
      .where('empresaId', '==', empresaId)
      .limit(30)
      .get();

    return snap.docs.map((doc) => ({
      id: doc.id,
      nome: doc.data().nome || '',
      preco: doc.data().preco || 0,
    }));
  } catch (err) {
    console.warn('⚠️ Não foi possível listar produtos:', err.message);
    return [];
  }
}

async function extrairDadosLead({
  textoMensagem,
  nomePerfilWa,
  telefoneRemetente,
  produtos,
  contatoExistente,
  historico,
}) {
  const listaProdutos =
    produtos.length > 0
      ? produtos.map((p) => `- ${p.nome} (R$ ${p.preco})`).join('\n')
      : 'Sementes de pastagem, fertilizantes NPK, nutrição animal, defensivos/adjuvantes, irrigação e assistência técnica';

  const resumoHistorico = Array.isArray(historico)
    ? historico
        .slice(-6)
        .map((h) => `${h.role === 'assistant' ? 'Atendente' : 'Cliente'}: ${h.text}`)
        .join('\n')
    : '';

  const nomeConhecido =
    contatoExistente?.nome || nomePerfilWa || 'Lead WhatsApp';

  const promptSistema = `Você é o assistente comercial da Agrotec (produtos e serviços agropecuários) no WhatsApp.
Responda de forma humana, natural, cordial e objetiva — sem repetir saudações se a conversa já estiver em andamento.

Contexto do cliente:
- Já cadastrado no CRM: ${contatoExistente ? `SIM (Nome: ${contatoExistente.nome}, Status: ${contatoExistente.status || 'Novo'})` : 'NÃO'}
- Histórico recente:
${resumoHistorico || '(Primeira mensagem)'}

Produtos cadastrados no CRM:
${listaProdutos}

Analise a mensagem atual e retorne ESTRITAMENTE em JSON válido:
{
  "nome": "Nome do cliente (mantenha '${nomeConhecido}' se já conhecido e não houver nome novo no texto)",
  "telefone": "Apenas dígitos com DDI/DDD, padrão '${telefoneRemetente}'",
  "interesse": "Produto, serviço ou pedido específico identificado. Se for apenas saudação ('oi', 'bom dia') ou agradecimento ('obrigado'), retorne '' (string vazia)",
  "quantidade": 1,
  "empresa": "Nome da fazenda/empresa se mencionado, ou ''",
  "email": "E-mail se mencionado, ou ''",
  "respostaCurta": "Resposta humanizada e direta para enviar ao cliente no WhatsApp"
}

Responda APENAS com o JSON, sem markdown ou texto extra.`;

  const promptUsuario = `Remetente WhatsApp: ${nomePerfilWa} (${telefoneRemetente})\nMensagem atual: "${textoMensagem}"`;

  if (GROQ_API_KEY) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(TIMEOUT_IA_MS),
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: promptSistema },
            { role: 'user', content: promptUsuario },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const raw = data.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(raw);
        return { ...parsed, provedorIA: 'groq' };
      }
    } catch (err) {
      console.warn('⚠️ Falha/timeout na Groq, tentando Gemini:', err.message);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(TIMEOUT_IA_MS),
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${promptSistema}\n\n${promptUsuario}` }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
          }),
        }
      );

      if (resp.ok) {
        const data = await resp.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(raw);
        return { ...parsed, provedorIA: 'gemini' };
      }
    } catch (err) {
      console.warn('⚠️ Falha/timeout no Gemini, usando fallback local:', err.message);
    }
  }

  const apenasSaudacao = ehSaudacaoOuAgradecimento(textoMensagem);
  const primeiroNome = nomeConhecido.split(/\s+/)[0];

  return {
    nome: nomeConhecido,
    telefone: telefoneRemetente,
    interesse: apenasSaudacao ? '' : textoMensagem,
    quantidade: 1,
    empresa: '',
    email: '',
    provedorIA: 'fallback',
    respostaCurta: apenasSaudacao
      ? `Oi, ${primeiroNome}! Tudo bem? Como posso te ajudar hoje na Agrotec?`
      : `Perfeito, ${primeiroNome}! Já anotei sua solicitação sobre "${textoMensagem}" para a equipe comercial da Agrotec. Se quiser acrescentar alguma quantidade ou detalhe, é só mandar por aqui.`,
  };
}

async function gerarOuAtualizarLeadNoCRM({
  empresaId,
  dados,
  textoOriginal,
  remetenteWa,
  sessaoAtual,
}) {
  const agora = Timestamp.now();
  const agoraIso = new Date().toISOString();
  const telefoneFinal =
    normalizarTelefone(dados.telefone) || normalizarTelefone(remetenteWa);
  const interesseFinal = (dados.interesse || '').trim();
  const emailFinal = (dados.email || '').trim();
  const empresaCliente = (dados.empresa || '').trim();
  const quantidade = Number(dados.quantidade) || 1;

  const contatosRef = db.collection('contatos');
  const existenteSnap = await contatosRef
    .where('empresaId', '==', empresaId)
    .where('telefone', '==', telefoneFinal)
    .limit(1)
    .get();

  let contatoId;
  let nomeFinal = (dados.nome || '').trim() || 'Lead WhatsApp';

  if (!existenteSnap.empty) {
    const docExistente = existenteSnap.docs[0];
    const dadosAntigos = docExistente.data();
    contatoId = docExistente.id;

    // Preserva nome real já cadastrado se o novo vier genérico
    if (
      dadosAntigos.nome &&
      dadosAntigos.nome !== 'Lead WhatsApp' &&
      nomeFinal === 'Lead WhatsApp'
    ) {
      nomeFinal = dadosAntigos.nome;
    }

    const obsAtualizada = interesseFinal
      ? [dadosAntigos.observacoes, `WhatsApp: ${interesseFinal}`]
          .filter(Boolean)
          .slice(-3)
          .join(' | ')
      : dadosAntigos.observacoes || '';

    await docExistente.ref.update({
      nome: nomeFinal,
      ...(empresaCliente && { empresa: empresaCliente }),
      ...(emailFinal && { email: emailFinal }),
      ...(obsAtualizada && { observacoes: obsAtualizada }),
      atualizadoEm: FieldValue.serverTimestamp(),
    });
  } else {
    const novoContato = await contatosRef.add({
      empresaId,
      nome: nomeFinal,
      cargo: '',
      empresa: empresaCliente,
      email: emailFinal,
      telefone: telefoneFinal,
      endereco: '',
      tipo: 'lead',
      status: 'Novo',
      origem: 'whatsapp',
      observacoes: interesseFinal
        ? `Interesse via WhatsApp: ${interesseFinal}`
        : 'Contato iniciado via WhatsApp',
      dataCriacao: agora,
      criadoEm: FieldValue.serverTimestamp(),
      atualizadoEm: FieldValue.serverTimestamp(),
    });
    contatoId = novoContato.id;
  }

  let negocioId = sessaoAtual?.ultimoNegocioId || null;

  // Só cria ou atualiza negócio quando há interesse real (ignora "oi", "obrigado", etc.)
  if (interesseFinal && !ehSaudacaoOuAgradecimento(interesseFinal)) {
    const itemPedido = {
      id: `wa_${Date.now()}`,
      produto: interesseFinal,
      quantidade,
      valorUnitario: 0,
      subtotal: 0,
      origem: 'whatsapp',
      dataSolicitacao: agoraIso,
    };

    // Verifica se já existe um negócio aberto recente para este contato para consolidar em vez de duplicar
    let negocioAbertoRef = null;
    if (negocioId) {
      const negSnap = await db.collection('negocios').doc(negocioId).get();
      if (negSnap.exists) {
        const negData = negSnap.data();
        const statusAtual = String(negData.status || negData.etapa || '').toLowerCase();
        if (!statusAtual.includes('ganh') && !statusAtual.includes('perd')) {
          negocioAbertoRef = negSnap.ref;
        }
      }
    }

    if (negocioAbertoRef) {
      await negocioAbertoRef.update({
        titulo: `${interesseFinal} - ${nomeFinal}`,
        observacoes: FieldValue.arrayUnion
          ? `${interesseFinal} ("${textoOriginal}")`
          : `WhatsApp: ${textoOriginal}`,
        pedidos: FieldValue.arrayUnion(itemPedido),
        produtos: FieldValue.arrayUnion(interesseFinal),
        atualizadoEm: FieldValue.serverTimestamp(),
      });
    } else {
      const novoNegocio = await db.collection('negocios').add({
        empresaId,
        titulo: `${interesseFinal} - ${nomeFinal}`,
        contatoId,
        contato: nomeFinal,
        contatoNome: nomeFinal,
        telefone: telefoneFinal,
        status: 'prospeccao',
        etapa: 'Novo Lead',
        valor: 0,
        valorTotal: 0,
        origem: 'whatsapp',
        pedidos: [itemPedido],
        produtos: [interesseFinal],
        observacoes: `Mensagem original: "${textoOriginal}"`,
        descricao: `Mensagem original: "${textoOriginal}"`,
        dataCriacao: agora,
        atualizadoEm: FieldValue.serverTimestamp(),
      });
      negocioId = novoNegocio.id;

      await db.collection('solicitacoes_compra').add({
        empresaId,
        contatoId,
        negocioId,
        contatoNome: nomeFinal,
        clienteNome: nomeFinal,
        produto: `${quantidade}x ${interesseFinal}`,
        telefone: telefoneFinal,
        tipoSolicitacao: 'primeiro_negocio',
        origem: 'whatsapp',
        itens: [itemPedido],
        valorEstimado: 0,
        lida: false,
        criadoEm: FieldValue.serverTimestamp(),
      });
    }
  }

  return { contatoId, negocioId, nomeFinal, telefoneFinal, interesseFinal };
}

async function tentarResponderWhatsApp(para, texto) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !para || !texto) return;

  try {
    const resp = await fetch(
      `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: para,
          type: 'text',
          text: { body: texto },
        }),
      }
    );

    if (!resp.ok) {
      const erro = await resp.text();
      console.warn(
        `⚠️ Envio WhatsApp não entregue (status ${resp.status}) - Lead já salvo no CRM:`,
        erro
      );
    }
  } catch (err) {
    console.warn('⚠️ Falha de rede ao tentar responder WhatsApp:', err.message);
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body;
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return res.status(200).json({ status: 'ignored_event' });
    }

    const messageId = message.id || '';
    const remetenteWa = message.from;
    const telefoneNorm = normalizarTelefone(remetenteWa);
    const nomePerfilWa = value?.contacts?.[0]?.profile?.name || '';
    const textoMensagem =
      message.text?.body ||
      message.button?.text ||
      message.interactive?.button_reply?.title ||
      '';

    if (!textoMensagem.trim()) {
      return res.status(200).json({ status: 'empty_message' });
    }

    // 1. Carrega sessão e deduplica message.id para evitar retries da Meta
    const sessaoRef = db.collection('whatsapp_sessoes').doc(telefoneNorm);
    const sessaoSnap = await sessaoRef.get();
    const sessaoAtual = sessaoSnap.exists ? sessaoSnap.data() : {};

    if (messageId && sessaoAtual.ultimoMessageId === messageId) {
      return res.status(200).json({ status: 'duplicated_message' });
    }

    // 2. Busca contato existente para dar contexto à IA
    const empresaId = DEFAULT_EMPRESA_ID;
    let contatoExistente = null;
    const contatoSnap = await db
      .collection('contatos')
      .where('empresaId', '==', empresaId)
      .where('telefone', '==', telefoneNorm)
      .limit(1)
      .get();

    if (!contatoSnap.empty) {
      contatoExistente = { id: contatoSnap.docs[0].id, ...contatoSnap.docs[0].data() };
    }

    const produtos = await buscarProdutosEmpresa(empresaId);
    const historicoAtual = Array.isArray(sessaoAtual.historico)
      ? sessaoAtual.historico
      : [];

    const dadosExtraidos = await extrairDadosLead({
      textoMensagem,
      nomePerfilWa,
      telefoneRemetente: telefoneNorm,
      produtos,
      contatoExistente,
      historico: historicoAtual,
    });

    const resultadoLead = await gerarOuAtualizarLeadNoCRM({
      empresaId,
      dados: dadosExtraidos,
      textoOriginal: textoMensagem,
      remetenteWa: telefoneNorm,
      sessaoAtual,
    });

    const respostaFinal = dadosExtraidos.respostaCurta;
    const agoraIso = new Date().toISOString();

    await sessaoRef.set(
      {
        empresaId,
        ultimoMessageId: messageId,
        nome: resultadoLead.nomeFinal,
        telefone: resultadoLead.telefoneFinal,
        interesse: resultadoLead.interesseFinal || sessaoAtual.interesse || '',
        contatoId: resultadoLead.contatoId,
        ultimoNegocioId: resultadoLead.negocioId,
        provedorUltimaIA: dadosExtraidos.provedorIA || 'groq',
        atualizadoEm: FieldValue.serverTimestamp(),
        historico: [
          ...historicoAtual.slice(-10),
          { role: 'user', text: textoMensagem, timestamp: agoraIso },
          ...(respostaFinal
            ? [{ role: 'assistant', text: respostaFinal, timestamp: agoraIso }]
            : []),
        ],
      },
      { merge: true }
    );

    await tentarResponderWhatsApp(remetenteWa, respostaFinal);

    return res.status(200).json({
      status: 'processado',
      lead: resultadoLead,
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook WhatsApp:', error);
    // Retorna 200 para evitar fila de retry em loop da Meta
    return res.status(200).json({ status: 'erro_tratado', error: error.message });
  }
}