import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config';
import { criarContaComEmpresa } from '../services/authService';
import { collection, doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';


function Cadastro() {
    const navigate = useNavigate();
    const [nomeEmpresa, setNomeEmpresa] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const [nomeResponsavel, setNomeResponsavel] = useState('');
    const [segmento, setSegmento] = useState('');
    async function handleSubmit(e) {
        e.preventDefault();
        console.log("1. Entrou no handleSubmit");
        setErro('');
        setLoading(true);
        if (senha !== confirmarSenha) {
            setErro('As senhas não coincidem.');
            setLoading(false);
            return;
        }
        try {
            console.log("2. Tentando chamar o serviço");
            const resultado = await criarContaComEmpresa(nomeEmpresa, nomeResponsavel, segmento, email, senha);
            console.log("3. Resultado:", resultado);
            navigate('/app');
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                setErro('Este e-mail já está em uso.');
            } else {
                setErro('Erro ao criar conta: ' + error.message);
            }
            setLoading(false);
        }
    }
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <form className="bg-white p-8 rounded-lg shadow-md w-full max-w-md" onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Cadastro</h2>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor='nomeDaEmpresa'>Nome da Empresa:</label>
                    <input
                        type="text"
                        id='nomeDaEmpresa'
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite o nome da empresa"
                        value={nomeEmpresa}
                        onChange={(e) => setNomeEmpresa(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor='userEmail'>E-Mail:</label>
                    <input
                        type="email"
                        id='userEmail'
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite seu e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                {/* Nome da Empresa */}
                <div className="mb-4">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Nome da Empresa:</label>
                    <input
                        type="text"
                        value={nomeEmpresa}
                        onChange={(e) => setNomeEmpresa(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        placeholder="Ex: Megatech Soluções"
                    />
                </div>

                {/* NOVO: Nome do Responsável */}
                <div className="mb-4">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Seu Nome:</label>
                    <input
                        type="text"
                        value={nomeResponsavel}
                        onChange={(e) => setNomeResponsavel(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        placeholder="Ex: Fernando Almeida"
                    />
                </div>

                {/* NOVO: Segmento */}
                <div className="mb-4">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Segmento da Empresa:</label>
                    <select
                        value={segmento}
                        onChange={(e) => setSegmento(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    >
                        <option value="">Selecione...</option>
                        <option value="Tecnologia">Tecnologia</option>
                        <option value="Varejo">Varejo</option>
                        <option value="Serviços">Serviços</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Educação">Educação</option>
                        <option value="Outros">Outros</option>
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor='userPassword'>Senha:</label>
                    <input
                        type="password"
                        id='userPassword'
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor='userConfirmPassword'>Confirmar Senha:</label>
                    <input
                        type="password"
                        id='userConfirmPassword'
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirme sua senha"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                    />
                </div>
                <div>
                    <button type="submit" className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">
                        Cadastrar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Cadastro;