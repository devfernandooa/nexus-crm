/* global process */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

let db = null;

try {
    if (
        !getApps().length &&
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
    ) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY
                    .replace(/^["']|["']$/g, '')
                    .replace(/\\n/g, '\n'),
            }),
        });
    }

    if (getApps().length) {
        db = getFirestore();
    }
} catch (initError) {
    console.error('❌ Erro ao inicializar Firebase Admin:', initError);
}

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const EMPRESA_ID = process.env.NEXUS_EMPRESA_ID;

async function enviarMensagemWhatsApp(para, texto) {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        console.error('❌ WHATSAPP_TOKEN ou WHATSAPP_PHONE_NUMBER_ID ausentes nas variáveis de ambiente.');
        return;
    }

    const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
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

    const data = await res.json();
    console.log('📤 GRAPH API STATUS:', res.status, JSON.stringify(data));
}

function extrairDadosResposta(texto, telefoneFallback) {
    const linhas = texto
        .split(/\n|,|;/)
        .map((l) => l.trim())
        .filter(Boolean);

    let nome = '';
    let telefone = '';
    let interesse = '';

    for (const linha of linhas) {
        const lower = linha.toLowerCase();
        if (lower.startsWith('nome:')) {
            nome = linha.slice(5).trim();
        } else if (lower.startsWith('telefone:') || lower.startsWith('tel:')) {
            telefone = linha.replace(/^(telefone|tel):/i, '').trim();
        } else if (
            lower.startsWith('interesse:') ||
            lower.startsWith('serviço:') ||
            lower.startsWith('servico:') ||
            lower.startsWith('produto:')
        ) {
            interesse = linha.replace(/^(interesse|serviço|servico|produto):/i, '').trim();
        }
    }

    if (!nome && linhas.length >= 1) nome = linhas[0];
    if (!telefone && linhas.length >= 2) telefone = linhas[1];
    if (!interesse && linhas.length >= 3) interesse = linhas.slice(2).join(' - ');
    if (!interesse && linhas.length === 2) interesse = linhas[1];

    return {
        nome: nome || 'Lead WhatsApp',
        telefone: telefone || telefoneFallback,
        interesse: interesse || texto.trim(),
    };
}

export default async function handler(req, res) {
    // 1. Verificação inicial do Webhook pela Meta (GET)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }
        return res.status(403).end();
    }

    // 2. Recebimento de mensagens (POST)
    if (req.method === 'POST') {
        console.log('📩 WEBHOOK RECEBIDO:', JSON.stringify(req.body));

        try {
            if (!db) {
                console.error('❌ Firestore não inicializado. Verifique FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY na Vercel.');
                return res.status(200).json({ ok: false, error: 'firestore_uninitialized' });
            }

            const entry = req.body?.entry?.[0];
            const change = entry?.changes?.[0]?.value;
            const mensagem = change?.messages?.[0];

            if (!mensagem || mensagem.type !== 'text') {
                return res.status(200).json({ ok: true });
            }

            const waId = mensagem.from;
            const textoRecebido = mensagem.text?.body || '';
            const nomePerfilWa = change?.contacts?.[0]?.profile?.name || '';

            const sessaoRef = db.collection('whatsapp_sessoes').doc(waId);
            const sessaoSnap = await sessaoRef.get();
            const sessao = sessaoSnap.exists ? sessaoSnap.data() : null;

            // Etapa 1: Primeiro contato -> Boas-vindas + Solicitação de dados
            if (!sessao || sessao.etapa === 'concluida') {
                await sessaoRef.set({
                    waId,
                    nomePerfilWa,
                    etapa: 'aguardando_dados',
                    atualizadoEm: FieldValue.serverTimestamp(),
                });

                await enviarMensagemWhatsApp(
                    waId,
                    `Olá${nomePerfilWa ? `, ${nomePerfilWa}` : ''}! Seja bem-vindo(a) ao nosso atendimento.\n\n` +
                    `Para agilizar seu atendimento, por favor envie em uma única mensagem:\n` +
                    `1️⃣ *Seu Nome*\n` +
                    `2️⃣ *Seu Telefone*\n` +
                    `3️⃣ *Seu Interesse* (breve descrição do produto ou serviço desejado)`
                );

                return res.status(200).json({ ok: true });
            }

            // Etapa 2: Cliente enviou os dados -> Gera Lead no Nexus + Negócio em Prospecção
            if (sessao.etapa === 'aguardando_dados') {
                const dados = extrairDadosResposta(textoRecebido, waId);

                const contatoRef = await db.collection('contatos').add({
                    empresaId: EMPRESA_ID || '',
                    nome: dados.nome,
                    telefone: dados.telefone,
                    email: '',
                    empresa: '',
                    cargo: dados.interesse,
                    observacoes: `Interesse via WhatsApp: ${dados.interesse}`,
                    tipo: 'lead',
                    status: 'Novo',
                    origem: 'whatsapp',
                    dataCriacao: FieldValue.serverTimestamp(),
                });

                await db.collection('negocios').add({
                    empresaId: EMPRESA_ID || '',
                    titulo: dados.nome,
                    contato: dados.telefone,
                    contatoId: contatoRef.id,
                    descricao: dados.interesse,
                    valor: 0,
                    status: 'prospeccao',
                    produtos: [],
                    origem: 'whatsapp',
                    dataCriacao: FieldValue.serverTimestamp(),
                });

                await sessaoRef.set(
                    {
                        etapa: 'concluida',
                        contatoId: contatoRef.id,
                        dadosCapturados: dados,
                        atualizadoEm: FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );

                await enviarMensagemWhatsApp(
                    waId,
                    `Recebemos sua mensagem! A qualquer momento um dos nossos colaboradores retornará o contato.\n\n` +
                    `Muito obrigado pelo seu interesse e confiança! 🤝`
                );
            }

            return res.status(200).json({ ok: true });
        } catch (error) {
            console.error('❌ Erro no webhook WhatsApp:', error);
            return res.status(200).json({ ok: false });
        }
    }

    return res.status(405).end();
}