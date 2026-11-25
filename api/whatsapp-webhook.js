import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';



const apps = getApps();
const app = apps.length
    ? apps[0]
    : initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });

const db = getFirestore(app);

// Configurações de ambiente
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_EMPRESA_ID = process.env.DEFAULT_EMPRESA_ID || 'empresa_padrao';

/**
 * Envia mensagem de texto de volta para o WhatsApp via Meta Cloud API
 */
async function enviarMensagemWhatsApp(to, text, phoneNumberId = PHONE_NUMBER_ID) {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
        }),
    });

    const data = await response.json();
    console.log('📤 GRAPH API STATUS:', response.status, JSON.stringify(data));
    return data;
}

/**
 * Busca instruções personalizadas da empresa no Firestore (coleção config_ia)
 */
async function obterConfiguracaoIA(empresaId) {
    try {
        const docSnap = await db.collection('config_ia').doc(empresaId).get();
        if (docSnap.exists) {
            return docSnap.data();
        }
    } catch (err) {
        console.warn('⚠️ Falha ao ler config_ia, usando prompt padrão:', err.message);
    }

    return {
        nomeEmpresa: 'Nexus Hub',
        promptSistema:
            'Você é um assistente comercial cordial e objetivo. Seu objetivo é atender o cliente, entender sua necessidade/interesse e coletar naturalmente o nome completo (caso ainda não saiba) e o que ele procura. Faça uma pergunta curta por vez. Nunca invente informações.',
    };
}

/**
 * Consulta a API do Gemini com Structured Output (JSON Schema) e fallback automático de modelos
 */
async function processarComIA({ historico, mensagemAtual, dadosAtuais, nomePerfilWa, configIA }) {
    const modelos = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

    const systemInstruction = `
${configIA.promptSistema}

REGRAS ESTRITAS DE EXTRAÇÃO DE DADOS (CRM):
1. Analise o histórico da conversa e a última mensagem do cliente.
2. Extraia apenas o que o cliente realmente informou:
   - "nome": Nome da pessoa (se não informado explicitamente na conversa, pode usar "${nomePerfilWa || ''}" apenas se parecer um nome real de pessoa, nunca textos longos ou frases).
   - "email": E-mail válido se informado, caso contrário "".
   - "empresa": Nome da empresa do cliente se informado, caso contrário "".
   - "cargo": Cargo profissional APENAS se o cliente disser explicitamente (ex: "sou gerente", "sou proprietário"). Caso contrário, deixe "" (string vazia). NUNCA coloque a mensagem do cliente no campo cargo.
   - "interesse": Resumo claro e objetivo do produto, serviço ou dúvida do cliente.
   - "leadCompleto": true se já temos pelo menos o nome do cliente E um interesse claro identificado; false se ainda falta entender o que ele deseja.
3. "respostaWhatsApp": Escreva a resposta que será enviada ao cliente no WhatsApp. Seja natural, educado, breve (máximo 3 parágrafos curtos) e sem formatação markdown complexa.

DADOS JÁ COLETADOS ANTERIORMENTE NESTA SESSÃO:
${JSON.stringify(dadosAtuais || {})}
`.trim();

    const contents = [
        ...historico.map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.text }],
        })),
        {
            role: 'user',
            parts: [{ text: mensagemAtual }],
        },
    ];

    const payload = {
        systemInstruction: {
            parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
            responseSchema: {
                type: 'OBJECT',
                properties: {
                    respostaWhatsApp: { type: 'STRING' },
                    nome: { type: 'STRING' },
                    email: { type: 'STRING' },
                    empresa: { type: 'STRING' },
                    cargo: { type: 'STRING' },
                    interesse: { type: 'STRING' },
                    leadCompleto: { type: 'BOOLEAN' },
                },
                required: [
                    'respostaWhatsApp',
                    'nome',
                    'email',
                    'empresa',
                    'cargo',
                    'interesse',
                    'leadCompleto',
                ],
            },
        },
    };

    let ultimoErro = '';

    for (const modelo of modelos) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
            const result = await response.json();
            const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
                console.log(`🤖 Resposta gerada com sucesso usando: ${modelo}`);
                return JSON.parse(rawText);
            }
        }

        const errorText = await response.text();
        ultimoErro = `Erro na API Gemini (${modelo} - ${response.status}): ${errorText}`;
        console.warn(`⚠️ ${ultimoErro} — tentando próximo modelo...`);
    }

    throw new Error(ultimoErro);
}

/**
 * Cria ou atualiza o Contato (com deduplicação por telefone + empresaId)
 * e registra um Negócio vinculado quando um novo atendimento é qualificado.
 */
async function salvarOuAtualizarLead({ empresaId, telefone, dadosExtraidos, criarNegocio }) {
    const agora = FieldValue.serverTimestamp();
    const contatosRef = db.collection('contatos');

    const snapshot = await contatosRef
        .where('empresaId', '==', empresaId)
        .where('telefone', '==', telefone)
        .limit(1)
        .get();

    const nomeLimpo = (dadosExtraidos.nome || 'Lead WhatsApp').slice(0, 100).trim();
    const cargoLimpo = (dadosExtraidos.cargo || '').slice(0, 80).trim();
    const empresaCliente = (dadosExtraidos.empresa || '').slice(0, 100).trim();
    const emailLimpo = (dadosExtraidos.email || '').slice(0, 120).trim();
    const interesseLimpo = (dadosExtraidos.interesse || '').trim();

    let contatoId;

    if (!snapshot.empty) {
        const docExistente = snapshot.docs[0];
        contatoId = docExistente.id;
        const dadosAnteriores = docExistente.data();

        const atualizacoes = {
            atualizadoEm: agora,
        };

        if (nomeLimpo && nomeLimpo !== 'Lead WhatsApp') atualizacoes.nome = nomeLimpo;
        if (cargoLimpo) atualizacoes.cargo = cargoLimpo;
        if (empresaCliente) atualizacoes.empresa = empresaCliente;
        if (emailLimpo) atualizacoes.email = emailLimpo;
        if (interesseLimpo) {
            const obsAnterior = dadosAnteriores.observacoes || '';
            atualizacoes.observacoes = obsAnterior
                ? `${obsAnterior}\n[Nova interação WhatsApp]: ${interesseLimpo}`
                : `Interesse via WhatsApp: ${interesseLimpo}`;
        }

        await contatosRef.doc(contatoId).update(atualizacoes);
        console.log(`♻️ Contato atualizado (deduplicado): ${contatoId}`);
    } else {
        const novoContato = await contatosRef.add({
            empresaId,
            nome: nomeLimpo,
            cargo: cargoLimpo,
            empresa: empresaCliente,
            email: emailLimpo,
            telefone,
            origem: 'whatsapp',
            status: 'Novo',
            tipo: 'lead',
            observacoes: interesseLimpo ? `Interesse via WhatsApp: ${interesseLimpo}` : '',
            dataCriacao: agora,
            atualizadoEm: agora,
        });
        contatoId = novoContato.id;
        console.log(`✅ Novo contato criado: ${contatoId}`);
    }

    if (criarNegocio && interesseLimpo) {
        const novoNegocio = await db.collection('negocios').add({
            empresaId,
            contatoId,
            contatoNome: nomeLimpo,
            telefone,
            titulo: `${nomeLimpo} - ${interesseLimpo.slice(0, 60)}`,
            descricao: interesseLimpo,
            etapa: 'Novo Lead',
            valor: 0,
            origem: 'whatsapp',
            dataCriacao: agora,
            atualizadoEm: agora,
        });
        console.log(`💼 Negócio criado: ${novoNegocio.id}`);
        return { contatoId, negocioId: novoNegocio.id };
    }

    return { contatoId, negocioId: null };
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verificado com sucesso!');
            return res.status(200).send(challenge);
        }
        return res.status(403).send('Forbidden');
    }

    if (req.method === 'POST') {
        try {
            const body = req.body;
            console.log('📩 WEBHOOK RECEBIDO:', JSON.stringify(body));

            if (body.object !== 'whatsapp_business_account') {
                return res.status(404).send('Not Found');
            }

            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            if (!value?.messages || value.messages.length === 0) {
                return res.status(200).send('EVENT_RECEIVED');
            }

            const message = value.messages[0];
            const contactInfo = value.contacts?.[0];
            const phoneNumberIdRecebido = value.metadata?.phone_number_id || PHONE_NUMBER_ID;

            if (message.type !== 'text') {
                await enviarMensagemWhatsApp(
                    message.from,
                    'Olá! No momento consigo processar apenas mensagens de texto. Como posso ajudar?',
                    phoneNumberIdRecebido
                );
                return res.status(200).send('NON_TEXT_HANDLED');
            }

            const waId = message.from;
            const textoMensagem = message.text?.body?.trim() || '';
            const nomePerfilWa = contactInfo?.profile?.name || '';
            const empresaId = DEFAULT_EMPRESA_ID;

            const sessaoRef = db.collection('whatsapp_sessoes').doc(waId);
            const sessaoSnap = await sessaoRef.get();
            const sessaoAtual = sessaoSnap.exists
                ? sessaoSnap.data()
                : {
                    waId,
                    empresaId,
                    nomePerfilWa,
                    historico: [],
                    dadosColetados: {},
                    negocioCriadoNaSessao: false,
                    etapa: 'em_atendimento_ia',
                };

            const historicoRecente = (sessaoAtual.historico || []).slice(-10);
            const configIA = await obterConfiguracaoIA(empresaId);

            const resultadoIA = await processarComIA({
                historico: historicoRecente,
                mensagemAtual: textoMensagem,
                dadosAtuais: sessaoAtual.dadosColetados,
                nomePerfilWa,
                configIA,
            });

            const dadosConsolidados = {
                nome: resultadoIA.nome || sessaoAtual.dadosColetados?.nome || nomePerfilWa,
                email: resultadoIA.email || sessaoAtual.dadosColetados?.email || '',
                empresa: resultadoIA.empresa || sessaoAtual.dadosColetados?.empresa || '',
                cargo: resultadoIA.cargo || sessaoAtual.dadosColetados?.cargo || '',
                interesse: resultadoIA.interesse || sessaoAtual.dadosColetados?.interesse || '',
            };

            let negocioCriado = Boolean(sessaoAtual.negocioCriadoNaSessao);

            if (resultadoIA.leadCompleto) {
                const resLead = await salvarOuAtualizarLead({
                    empresaId,
                    telefone: waId,
                    dadosExtraidos: dadosConsolidados,
                    criarNegocio: !negocioCriado,
                });

                if (resLead.negocioId) {
                    negocioCriado = true;
                }
            }

            const novoHistorico = [
                ...historicoRecente,
                { role: 'user', text: textoMensagem, timestamp: new Date().toISOString() },
                { role: 'assistant', text: resultadoIA.respostaWhatsApp, timestamp: new Date().toISOString() },
            ];

            await sessaoRef.set(
                {
                    waId,
                    empresaId,
                    nomePerfilWa,
                    historico: novoHistorico,
                    dadosColetados: dadosConsolidados,
                    negocioCriadoNaSessao: negocioCriado,
                    etapa: resultadoIA.leadCompleto ? 'qualificado' : 'em_atendimento_ia',
                    atualizadoEm: FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            await enviarMensagemWhatsApp(waId, resultadoIA.respostaWhatsApp, phoneNumberIdRecebido);

            return res.status(200).send('OK');
        } catch (error) {
            console.error('❌ ERRO NO WEBHOOK WHATSAPP:', error);
            return res.status(200).send('ERROR_LOGGED');
        }
    }

    return res.status(405).send('Method Not Allowed');
}