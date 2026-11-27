import { db } from '@/firebase-config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

function obterTimestampVencimento(tarefa) {
  if (!tarefa?.dataVencimento) return Number.MAX_SAFE_INTEGER;
  const [ano, mes, dia] = String(tarefa.dataVencimento).split('-').map(Number);
  if (!ano || !mes || !dia) return Number.MAX_SAFE_INTEGER;

  let horas = 23;
  let minutos = 59;
  if (tarefa.horaVencimento && /^\d{2}:\d{2}$/.test(tarefa.horaVencimento)) {
    const [h, m] = tarefa.horaVencimento.split(':').map(Number);
    horas = h;
    minutos = m;
  }

  const ts = new Date(ano, mes - 1, dia, horas, minutos, 0, 0).getTime();
  return Number.isNaN(ts) ? Number.MAX_SAFE_INTEGER : ts;
}

export async function adicionarTarefa(dados, empresaId, usuarioId) {
  try {
    if (!empresaId || !usuarioId) {
      return { sucesso: false, erro: 'Usuário ou empresa não identificados.' };
    }

    const ref = collection(db, 'tarefas');
    await addDoc(ref, {
      ...dados,
      concluida: false,
      empresaId,
      usuarioId,
      criadoPor: usuarioId,
      dataCriacao: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    return { sucesso: false, erro: error.message };
  }
}

export async function atualizarTarefa(id, dados) {
  try {
    const ref = doc(db, 'tarefas', id);
    await updateDoc(ref, {
      ...dados,
      atualizadoEm: serverTimestamp(),
    });
    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    return { sucesso: false, erro: error.message };
  }
}

export async function deletarTarefa(id) {
  try {
    const ref = doc(db, 'tarefas', id);
    await deleteDoc(ref);
    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Escuta apenas as tarefas pertencentes ao `usuarioId` dentro da `empresaId`
 * (aplicando a mesma regra inclusive para usuários com role 'admin').
 */
export function escutarTarefas(empresaId, usuarioId, callback) {
  if (!empresaId || !usuarioId) return () => {};

  const ref = collection(db, 'tarefas');
  const q = query(
    ref,
    where('empresaId', '==', empresaId),
    where('usuarioId', '==', usuarioId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const lista = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    lista.sort((a, b) => obterTimestampVencimento(a) - obterTimestampVencimento(b));
    callback(lista);
  });

  return unsubscribe;
}

/**
 * Constrói a lista de alertas/lembretes com base na data (e hora/antecedência)
 * para alimentar o sininho de notificações e os lembretes em tela.
 */
export function construirAlertasTarefas(tarefas = [], agoraDate = new Date()) {
  const anoH = agoraDate.getFullYear();
  const mesH = String(agoraDate.getMonth() + 1).padStart(2, '0');
  const diaH = String(agoraDate.getDate()).padStart(2, '0');
  const hojeISO = `${anoH}-${mesH}-${diaH}`;
  const agoraMs = agoraDate.getTime();

  const alertas = [];

  (tarefas || []).forEach((tarefa) => {
    if (tarefa.concluida || !tarefa.dataVencimento) return;

    const [ano, mes, dia] = String(tarefa.dataVencimento).split('-').map(Number);
    if (!ano || !mes || !dia) return;

    const utcTarefa = Date.UTC(ano, mes - 1, dia);
    const utcHoje = Date.UTC(anoH, mesH - 1, diaH);
    const diffDias = Math.round((utcTarefa - utcHoje) / (1000 * 60 * 60 * 24));

    let horaAlvo = 9;
    let minAlvo = 0;
    let temHoraEspecifica = false;

    if (tarefa.horaVencimento && /^\d{2}:\d{2}$/.test(tarefa.horaVencimento)) {
      const [h, m] = tarefa.horaVencimento.split(':').map(Number);
      horaAlvo = h;
      minAlvo = m;
      temHoraEspecifica = true;
    }

    const vencimentoMs = new Date(ano, mes - 1, dia, horaAlvo, minAlvo, 0, 0).getTime();
    const antecedenciaMin = Number(tarefa.lembreteMinutos ?? 0);
    const dispararLembreteEmMs = vencimentoMs - antecedenciaMin * 60 * 1000;

    if (diffDias < 0 || (temHoraEspecifica && agoraMs > vencimentoMs)) {
      const diasAtraso = Math.max(1, Math.abs(diffDias));
      alertas.push({
        id: `${tarefa.id}__vencida`,
        tarefaId: tarefa.id,
        tipo: 'vencida',
        corNivel: diasAtraso > 3 ? 'critico' : 'atrasado',
        titulo: tarefa.titulo,
        mensagem:
          diasAtraso === 1
            ? 'Tarefa vencida há 1 dia'
            : `Tarefa vencida há ${diasAtraso} dias`,
        horario: tarefa.horaVencimento || null,
        dataVencimento: tarefa.dataVencimento,
      });
      return;
    }

    if (diffDias === 0) {
      const lembreteAtivo = !temHoraEspecifica || agoraMs >= dispararLembreteEmMs;
      alertas.push({
        id: `${tarefa.id}__hoje`,
        tarefaId: tarefa.id,
        tipo: lembreteAtivo ? 'lembrete' : 'hoje',
        corNivel: 'hoje',
        titulo: tarefa.titulo,
        mensagem: tarefa.horaVencimento
          ? `Vence hoje às ${tarefa.horaVencimento}`
          : 'Vence hoje',
        horario: tarefa.horaVencimento || null,
        dataVencimento: tarefa.dataVencimento,
      });
      return;
    }

    if (diffDias <= 2 && agoraMs >= dispararLembreteEmMs) {
      alertas.push({
        id: `${tarefa.id}__proximo`,
        tarefaId: tarefa.id,
        tipo: 'lembrete',
        corNivel: diffDias === 1 ? 'amanha' : 'breve',
        titulo: tarefa.titulo,
        mensagem:
          diffDias === 1
            ? `Lembrete: vence amanhã${tarefa.horaVencimento ? ` às ${tarefa.horaVencimento}` : ''}`
            : `Lembrete: vence em ${diffDias} dias`,
        horario: tarefa.horaVencimento || null,
        dataVencimento: tarefa.dataVencimento,
      });
    }
  });

  return alertas;
}