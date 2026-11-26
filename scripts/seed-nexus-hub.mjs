import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const auth = getAuth(app);
const db = initializeFirestore(app, { preferRest: true });

const SENHA_PADRAO = 'senha123';
const EMPRESA_ID = 'agrotec-produtos-servicos-agropecuarios';

const DADOS_EMPRESA = {
  nome: 'Agrotec Produtos e serviços Agropecuarios EIRELI',
  razaoSocial: 'Agrotec Produtos e serviços Agropecuarios EIRELI',
  nomeFantasia: 'Agrotec Agropecuária',
  cnpj: '18.452.910/0001-64',
  telefone: '(75) 3622-4810',
  email: 'contato@agrotecagro.com.br',
  cidade: 'Feira de Santana',
  estado: 'BA',
  endereco: 'Av. Presidente Dutra, 1450 - Centro, Feira de Santana - BA',
  etapasFunil: [
    { id: 'prospeccao', nome: 'Prospecção', tipo: 'aberto', cor: 'emerald' },
    { id: 'diagnostico', nome: 'Diagnóstico Técnico', tipo: 'aberto', cor: 'sky' },
    { id: 'proposta', nome: 'Proposta Comercial', tipo: 'aberto', cor: 'amber' },
    { id: 'ganho', nome: 'Ganho', tipo: 'ganho', cor: 'emerald' },
    { id: 'perdido', nome: 'Perdido', tipo: 'perdido', cor: 'rose' },
  ],
  atualizadoEm: FieldValue.serverTimestamp(),
};

const EQUIPE = [
  {
    nome: 'Fernando Almeida',
    email: 'devfernandooar@gmail.com',
    role: 'admin',
    cargo: 'Administrador',
    telefone: '(75) 99100-1001',
  },
  {
    nome: 'Rafael Mendes',
    email: 'rafael.vendedor@agrotecagro.com.br',
    role: 'vendedor',
    cargo: 'Consultor de Vendas',
    telefone: '(75) 99100-1002',
  },
  {
    nome: 'Camila Rocha',
    email: 'camila.vendedor@agrotecagro.com.br',
    role: 'vendedor',
    cargo: 'Consultora Comercial',
    telefone: '(75) 99100-1003',
  },
  {
    nome: 'Thiago Nogueira',
    email: 'thiago.vendedor@agrotecagro.com.br',
    role: 'vendedor',
    cargo: 'Representante Agro',
    telefone: '(75) 99100-1004',
  },
];

// 8 Produtos + 5 Serviços = 13 itens na coleção `produtos`
const ITENS_CATALOGO = [
  // 8 Produtos
  { nome: 'Fertilizante NPK 20-05-20 (Saca 50kg)', categoria: 'produto', tipoItem: 'produto', preco: 185.0, unidade: 'saca', estoque: 240, ativo: true },
  { nome: 'Inoculante Biológico BioBac 1L', categoria: 'produto', tipoItem: 'produto', preco: 94.0, unidade: 'un', estoque: 150, ativo: true },
  { nome: 'Ração Mineral Bovinos Corte 30kg', categoria: 'produto', tipoItem: 'produto', preco: 112.0, unidade: 'saca', estoque: 320, ativo: true },
  { nome: 'Semente de Capim Mombaça 20kg', categoria: 'produto', tipoItem: 'produto', preco: 340.0, unidade: 'saca', estoque: 95, ativo: true },
  { nome: 'Calcário Dolomítico Agrícola (Tonelada)', categoria: 'produto', tipoItem: 'produto', preco: 260.0, unidade: 't', estoque: 180, ativo: true },
  { nome: 'Adjuvante Agrícola Siliconado 5L', categoria: 'produto', tipoItem: 'produto', preco: 215.0, unidade: 'galão', estoque: 75, ativo: true },
  { nome: 'Suplemento Proteico Energético 25kg', categoria: 'produto', tipoItem: 'produto', preco: 148.0, unidade: 'saca', estoque: 210, ativo: true },
  { nome: 'Kit Irrigação Gotejamento 1 Hectare', categoria: 'produto', tipoItem: 'produto', preco: 2450.0, unidade: 'kit', estoque: 18, ativo: true },

  // 5 Serviços
  { nome: 'Análise de Solo e Recomendação Agronômica', categoria: 'servico', tipoItem: 'servico', preco: 450.0, unidade: 'laudo', estoque: null, ativo: true },
  { nome: 'Consultoria Técnica em Manejo de Pastagem', categoria: 'servico', tipoItem: 'servico', preco: 850.0, unidade: 'visita', estoque: null, ativo: true },
  { nome: 'Aplicação Aérea / Pulverização Assistida', categoria: 'servico', tipoItem: 'servico', preco: 190.0, unidade: 'ha', estoque: null, ativo: true },
  { nome: 'Elaboração de Projeto de Irrigação', categoria: 'servico', tipoItem: 'servico', preco: 1650.0, unidade: 'projeto', estoque: null, ativo: true },
  { nome: 'Assistência Veterinária e Sanitária do Rebanho', categoria: 'servico', tipoItem: 'servico', preco: 620.0, unidade: 'atendimento', estoque: null, ativo: true },
];

const NOMES_LEADS = [
  'Lucas Ferreira', 'Mariana Costa', 'Diego Santos', 'Beatriz Lima', 'Gustavo Alves',
  'Larissa Oliveira', 'Henrique Souza', 'Juliana Pereira', 'Matheus Rodrigues', 'Fernanda Carvalho',
  'Bruno Martins', 'Amanda Ribeiro', 'Gabriel Gomes', 'Patricia Barbosa', 'Vinicius Dias',
  'Aline Castro', 'Felipe Nunes', 'Vanessa Mendes', 'Leonardo Freitas', 'Tatiane Moreira',
  'Eduardo Vieira', 'Bianca Cardoso', 'Rodrigo Teixeira', 'Priscila Correia', 'Caio Cavalcanti',
  'Natalia Moura', 'Igor Azevedo', 'Renata Ramos', 'Arthur Monteiro', 'Debora Vasconcelos',
];

const NOMES_CLIENTES = [
  'Antonio Carlos Peixoto', 'Sebastiao Andrade', 'Josefa Maria Brito', 'Francisco das Chagas', 'Valdir Nascimento',
  'Marlene Santana', 'Geraldo Magela', 'Aparecida de Fatima', 'Claudio Roberto', 'Ivoneide Dantas',
  'Manoel Messias', 'Eliane Macedo', 'Osvaldo Cruz', 'Sandra Regina', 'Edson Arantes Filho',
  'Solange Magalhaes', 'Waldemar Lemos', 'Celia Regina', 'Benedito Fonseca', 'Lurdes Sampaio',
  'Airton Senna Costa', 'Neide Aparecida', 'Raimundo Nonato', 'Dulce Helena', 'Mauricio Prado',
  'Vera Lucia Soares', 'Reginaldo Rossi', 'Miriam Leitao', 'Ademir Guia', 'Zilda Arns Neves',
];

const FAZENDAS_REGIOES = [
  'Fazenda Boa Vista - Feira de Santana/BA',
  'Sítio Bela Esperança - Conceição da Feira/BA',
  'Fazenda Santa Luzia - Serrinha/BA',
  'Chácara Vale Verde - Riachão do Jacuípe/BA',
  'Fazenda Ouro Branco - Ipirá/BA',
  'Sítio Monte Alegre - Alagoinhas/BA',
];

async function limparColecao(nomeColecao, filtrarEmpresa = false) {
  const colRef = db.collection(nomeColecao);
  const snap = filtrarEmpresa
    ? await colRef.where('empresaId', '==', EMPRESA_ID).get()
    : await colRef.get();

  if (snap.empty) return;

  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

async function limparUsuariosAntigos() {
  const snap = await db.collection('usuarios').get();
  if (!snap.empty) {
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch();
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  let nextPageToken;
  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    if (listUsersResult.users.length > 0) {
      await auth.deleteUsers(listUsersResult.users.map((u) => u.uid));
    }
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);
}

async function criarOuAtualizarUsuarioAuth(membro) {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(membro.email);
    userRecord = await auth.updateUser(userRecord.uid, {
      displayName: membro.nome,
      password: SENHA_PADRAO,
    });
  } catch {
    userRecord = await auth.createUser({
      email: membro.email,
      password: SENHA_PADRAO,
      displayName: membro.nome,
    });
  }

  await db.collection('usuarios').doc(userRecord.uid).set({
    uid: userRecord.uid,
    nome: membro.nome,
    email: membro.email,
    role: membro.role,
    cargo: membro.cargo,
    telefone: membro.telefone,
    empresaId: EMPRESA_ID,
    nomeEmpresa: DADOS_EMPRESA.nome,
    ativo: true,
    dataCriacao: FieldValue.serverTimestamp(),
  });

  return { ...membro, uid: userRecord.uid };
}

async function seed() {
  console.log('1/5 Limpando dados anteriores...');
  await limparColecao('negocios', false);
  await limparColecao('contatos', false);
  await limparColecao('produtos', false);
  await limparColecao('tarefas', false);
  await limparColecao('convites', false);
  await limparUsuariosAntigos();

  console.log('2/5 Criando empresa Agrotec...');
  await db.collection('empresas').doc(EMPRESA_ID).set(DADOS_EMPRESA, { merge: true });

  console.log('3/5 Criando Admin e 3 Vendedores (senha padrão: senha123)...');
  const usuariosCriados = [];
  for (const membro of EQUIPE) {
    const criado = await criarOuAtualizarUsuarioAuth(membro);
    usuariosCriados.push(criado);
  }

  const vendedores = usuariosCriados.filter((u) => u.role === 'vendedor');
  const adminUser = usuariosCriados.find((u) => u.role === 'admin');

  console.log('4/5 Cadastrando 8 produtos e 5 serviços...');
  const catalogoIds = [];
  for (let i = 0; i < ITENS_CATALOGO.length; i++) {
    const item = ITENS_CATALOGO[i];
    const docRef = await db.collection('produtos').add({
      ...item,
      empresaId: EMPRESA_ID,
      responsavelId: adminUser.uid,
      dataCriacao: Timestamp.fromMillis(Date.now() - (20 - i) * 3600 * 1000),
    });
    catalogoIds.push({ id: docRef.id, ...item });
  }

  console.log('5/5 Cadastrando 30 Leads, 30 Clientes e 24 Negócios vinculados a clientes...');
  for (let i = 0; i < 30; i++) {
    const vendedor = vendedores[i % vendedores.length];
    const nomeLead = NOMES_LEADS[i];
    const tel = `(75) 988${String(1000 + i).padStart(4, '0')}`;
    const email = `lead${i + 1}.${nomeLead.toLowerCase().split(' ')[0]}@agroteste.com.br`;

    await db.collection('contatos').add({
      nome: nomeLead,
      empresa: FAZENDAS_REGIOES[i % FAZENDAS_REGIOES.length],
      telefone: tel,
      email,
      tipo: 'lead',
      status: 'lead',
      origem: i % 3 === 0 ? 'whatsapp' : 'indicacao',
      observacoes: `Interesse inicial em ${catalogoIds[i % catalogoIds.length].nome}`,
      empresaId: EMPRESA_ID,
      responsavelId: vendedor.uid,
      dataCriacao: Timestamp.fromMillis(Date.now() - (35 - i) * 1800 * 1000),
    });
  }

  const etapasAbertas = ['prospeccao', 'diagnostico', 'proposta'];

  for (let i = 0; i < 30; i++) {
    const vendedor = vendedores[i % vendedores.length];
    const nomeCliente = NOMES_CLIENTES[i];
    const tel = `(75) 997${String(2000 + i).padStart(4, '0')}`;
    const email = `cliente${i + 1}.${nomeCliente.toLowerCase().split(' ')[0]}@fazendaagro.com.br`;
    const empresaFazenda = FAZENDAS_REGIOES[i % FAZENDAS_REGIOES.length];

    const contatoRef = await db.collection('contatos').add({
      nome: nomeCliente,
      empresa: empresaFazenda,
      telefone: tel,
      email,
      tipo: 'cliente',
      status: 'cliente',
      origem: 'carteira',
      observacoes: `Cliente ativo da carteira — ${empresaFazenda}`,
      empresaId: EMPRESA_ID,
      responsavelId: vendedor.uid,
      dataCriacao: Timestamp.fromMillis(Date.now() - (50 - i) * 3600 * 1000),
    });

    // Pelo menos 20 clientes com negócios (cria 24 negócios para os 24 primeiros clientes)
    if (i < 24) {
      const itemA = catalogoIds[i % catalogoIds.length];
      const itemB = catalogoIds[(i + 3) % catalogoIds.length];
      const qtdA = (i % 4) + 1;
      const qtdB = i % 2 === 0 ? 1 : 2;
      const valorTotal = Number((itemA.preco * qtdA + itemB.preco * qtdB).toFixed(2));
      const statusEtapa =
        i < 16 ? etapasAbertas[i % etapasAbertas.length] : i < 22 ? 'ganho' : 'perdido';

      await db.collection('negocios').add({
        titulo: `${itemA.nome.split(' (')[0]} - ${nomeCliente.split(' ')[0]}`,
        valor: valorTotal,
        status: statusEtapa,
        etapa: statusEtapa,
        contato: nomeCliente,
        contatoNome: nomeCliente,
        contatoId: contatoRef.id,
        contatoExistente: true,
        telefone: tel,
        email,
        empresaNome: empresaFazenda,
        responsavelId: vendedor.uid,
        responsavelNome: vendedor.nome,
        produtos: [
          { id: itemA.id, nome: itemA.nome, preco: itemA.preco, quantidade: qtdA, tipoItem: itemA.tipoItem },
          { id: itemB.id, nome: itemB.nome, preco: itemB.preco, quantidade: qtdB, tipoItem: itemB.tipoItem },
        ],
        observacoes: `Negócio #${i + 1} vinculado ao cliente ${nomeCliente}.`,
        empresaId: EMPRESA_ID,
        dataCriacao: Timestamp.fromMillis(Date.now() - (25 - i) * 3600 * 1000),
      });
    }
  }

  console.log('Seed concluído com sucesso!');
  console.log('Admin:', EQUIPE[0].email, '| Senha:', SENHA_PADRAO);
  console.log('Vendedores:', vendedores.map((v) => `${v.nome} (${v.email})`).join(', '));
}

seed().catch((err) => {
  console.error('Erro ao popular banco:', err);
  process.exit(1);
});