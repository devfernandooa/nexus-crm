// src/utils/funilUtils.js

// Gera um ID amigável (slug) a partir do nome
export function gerarSlug(nome) {
    return nome.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-') // Troca espaços e símbolos por hífen
        .replace(/^-+|-+$/g, ''); // Remove hífens no início e fim
}

// Converte o formato antigo (string[]) para o novo ({ id, nome, tipo }[])
export function migrarFunilAntigo(etapasAntigas) {
    if (!etapasAntigas || etapasAntigas.length === 0) {
        // Se estiver vazio, retorna o padrão de fábrica
        return [
            { id: 'prospeccao', nome: 'Prospecção', tipo: 'aberto' },
            { id: 'qualificacao', nome: 'Qualificação', tipo: 'aberto' },
            { id: 'proposta', nome: 'Proposta', tipo: 'aberto' },
            { id: 'ganho', nome: 'Ganho', tipo: 'ganho' },
            { id: 'perdido', nome: 'Perdido', tipo: 'perdido' }
        ];
    }

    // Se já estiver no formato novo (objetos), não faz nada
    if (typeof etapasAntigas[0] === 'object' && etapasAntigas[0].id) {
        return etapasAntigas;
    }

    // Migra do antigo para o novo
    return etapasAntigas.map((nomeEtapa, index) => {
        let tipo = 'aberto';

        // Regra de negócio para os dados antigos:
        // A penúltima vira 'ganho', a última vira 'perdido'
        if (index === etapasAntigas.length - 2) tipo = 'ganho';
        if (index === etapasAntigas.length - 1) tipo = 'perdido';

        return {
            id: gerarSlug(nomeEtapa),
            nome: nomeEtapa,
            tipo: tipo
        };
    });
}