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
const DEFAULT_EMPRESA_ID = process.env.DEFAULT_EMPRESA_ID || 'sAYH5cVoqDn3m5LllObO';

function normalizarTelefone(tel) {
  if (!tel) return '';
  const digitos = String(tel).replace(/\D/g, '');
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return digitos;
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

async function extrairDadosLead({ textoMensagem, nomePerfilWa, telefoneRemetente, produtos }) {
  const listaProdutos =
    produtos.length > 0
      ? produtos.map((p) => `- ${p.nome} (R$ ${p.preco})`).join('\n')
      : 'Nenhum produto específico listado';

  const promptSistema = `Você é um extrator de dados de leads para um CRM.
Analise a mensagem recebida e extraia estritamente em JSON válido:
{
  "nome": "Nome do cliente (se não estiver no texto, use '${nomePerfilWa || 'Lead WhatsApp'}')",
  "telefone": "Apenas números com DDI/DDD se informado no texto, ou '${telefoneRemetente}'",
  "interesse": "Produto, serviço ou assunto de interesse identificado (se houver produto compatível na lista, use o nome oficial dele)",
  "empresa": "Nome da empresa do cliente, se mencionado, ou ''",
  "email": "E-mail do cliente, se mencionado, ou ''",
  "respostaCurta": "Mensagem curta confirmando o recebimento do interesse"
}

Produtos cadastrados no CRM:
${listaProdutos}

Responda APENAS com o JSON, sem markdown ou texto extra.`;

  const promptUsuario = `Remetente WhatsApp: ${nomePerfilWa} (${telefoneRemetente})\nMensagem: "${textoMensagem}"`;

  if (GROQ_API_KEY) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: promptSistema },
            { role: 'user', content: promptUsuario },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const raw = data.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(raw);
        console.log('🤖 Dados extraídos via Groq:', parsed);
        return parsed;
      }
    } catch (err) {
      console.warn('⚠️ Falha na Groq, tentando Gemini:', err.message);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${promptSistema}\n\n${promptUsuario}` }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
          }),
        }
      );

      if (resp.ok) {
        const data = await resp.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(raw);
        console.log('🤖 Dados extraídos via Gemini:', parsed);
        return parsed;
      }
    } catch (err) {
      console.warn('⚠️ Falha no Gemini, usando fallback direto:', err.message);
    }
  }

  return {
    nome: nomePerfilWa || 'Lead WhatsApp',
    telefone: telefoneRemetente,
    interesse: textoMensagem,
    empresa: '',
    email: '',
    respostaCurta: `Olá ${nomePerfilWa || ''}! Recebemos seu contato sobre "${textoMensagem}". Em breve nossa equipe retorna.`,
  };
}

async function gerarLeadNoCRM({ empresaId, dados, textoOriginal, remetenteWa }) {
  const agora = Timestamp.now();
  const agoraIso = new Date().toISOString();
  const telefoneFinal = normalizarTelefone(dados.telefone) || normalizarTelefone(remetenteWa);
  const nomeFinal = (dados.nome || '').trim() || 'Lead WhatsApp';
  const interesseFinal = (dados.interesse || textoOriginal || '').trim();
  const emailFinal = (dados.email || '').trim();
  const empresaCliente = (dados.empresa || '').trim();

  const contatosRef = db.collection('contatos');
  const existenteSnap = await contatosRef
    .where('empresaId', '==', empresaId)
    .where('telefone', '==', telefoneFinal)
    .limit(1)
    .get();

  let contatoId;

  if (!existenteSnap.empty) {
    const docExistente = existenteSnap.docs[0];
    contatoId = docExistente.id;
    await docExistente.ref.update({
      nome: nomeFinal,
      ...(empresaCliente && { empresa: empresaCliente }),
      ...(emailFinal && { email: emailFinal }),
      observacoes: `Interesse via WhatsApp: ${interesseFinal}`,
      atualizadoEm: agora,
    });
    console.log(`♻️ Lead atualizado em contatos: ${contatoId} (${nomeFinal})`);
  } else {
    const novoContato = await contatosRef.add({
      empresaId,
      nome: nomeFinal,
      cargo: '',
      empresa: empresaCliente,
      email: emailFinal,
      telefone: telefoneFinal,
<<<<<<< HEAD
      origem: 'whatsapp',
      status: 'Novo',
      tipo: 'lead',
=======
      endereco: '',
      status: 'Novo',
>>>>>>> dev
      observacoes: `Interesse via WhatsApp: ${interesseFinal}`,
      dataCriacao: agora,
      atualizadoEm: agora,
    });
    contatoId = novoContato.id;
    console.log(`✅ Novo Lead criado em contatos: ${contatoId} (${nomeFinal})`);
  }

  let negocioId = null;
  if (interesseFinal) {
    const novoNegocio = await db.collection('negocios').add({
      empresaId,
      titulo: `${interesseFinal} - ${nomeFinal}`,
      contatoId,
      contatoNome: nomeFinal,
      telefone: telefoneFinal,
      etapa: 'Novo Lead',
      valor: 0,
      origem: 'whatsapp',
      descricao: `Mensagem original: "${textoOriginal}"`,
      dataCriacao: agora,
      atualizadoEm: agora,
    });
    negocioId = novoNegocio.id;
    console.log(`💼 Negócio criado em negocios: ${negocioId}`);
  }

  await db
    .collection('whatsapp_sessoes')
    .doc(normalizarTelefone(remetenteWa))
    .set(
      {
        empresaId,
        nome: nomeFinal,
        telefone: telefoneFinal,
        interesse: interesseFinal,
        contatoId,
        ultimoNegocioId: negocioId,
        atualizadoEm: agora,
        historico: FieldValue.arrayUnion({
          role: 'user',
          text: textoOriginal,
          timestamp: agoraIso,
        }),
      },
      { merge: true }
    );

  return { contatoId, negocioId, nomeFinal, telefoneFinal, interesseFinal };
}

async function tentarResponderWhatsApp(para, texto) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !para || !texto) return;

  try {
    const resp = await fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
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
    });

    if (!resp.ok) {
      const erro = await resp.text();
      console.warn(`⚠️ Envio WhatsApp não entregue (status ${resp.status}) - Lead já salvo no CRM:`, erro);
    } else {
      console.log('📤 Resposta enviada no WhatsApp com sucesso');
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

    const remetenteWa = message.from;
    const nomePerfilWa = value?.contacts?.[0]?.profile?.name || '';
    const textoMensagem =
      message.text?.body ||
      message.button?.text ||
      message.interactive?.button_reply?.title ||
      '';

    if (!textoMensagem.trim()) {
      return res.status(200).json({ status: 'empty_message' });
    }

    console.log(`📩 Mensagem recebida de ${nomePerfilWa} (${remetenteWa}): "${textoMensagem}"`);

    const empresaId = DEFAULT_EMPRESA_ID;
    const produtos = await buscarProdutosEmpresa(empresaId);

    const dadosExtraidos = await extrairDadosLead({
      textoMensagem,
      nomePerfilWa,
      telefoneRemetente: remetenteWa,
      produtos,
    });

    const resultadoLead = await gerarLeadNoCRM({
      empresaId,
      dados: dadosExtraidos,
      textoOriginal: textoMensagem,
      remetenteWa,
    });

    await tentarResponderWhatsApp(remetenteWa, dadosExtraidos.respostaCurta);

    return res.status(200).json({
      status: 'lead_gerado',
      lead: resultadoLead,
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}