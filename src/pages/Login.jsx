import { useState } from 'react';
import { auth } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Botao from '../components/ui/Botao';


function Login() {

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setErro('');
        setLoading(true);
        try {
            /**
             * Aqui chamamos o firebase numa função assincrona
             * e passamos o email e senha para autenticar o usuário
             * caso o usuário seja autenticado, ele será redirecionado para a página de tarefas
             * caso contrário, será exibida uma mensagem de erro
             */
            await signInWithEmailAndPassword(auth, email, senha);
            navigate('/app');
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setErro('Usuário ou senha incorretos.');
            } else {
                setErro('Ocorreu um erro ao tentar fazer login. Por favor, tente novamente mais tarde.');
            }
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <form className="bg-white p-8 rounded-lg shadow-md w-full max-w-md" onSubmit={handleSubmit}>

                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>

                {erro && <p className="text-red-500 text-sm mb-4 text-center">{erro}</p>}

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor='userEmail'>E-Mail:</label>
                    <input
                        type="email"
                        id='userEmail'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="seu@email.com"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor='userPassword'>Senha:</label>
                    <input
                        type="password"
                        id='userPassword'
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="********"
                    />
                </div>

                <div>
                    <Botao type="submit" disabled={loading} className="w-full">
                        {loading ? 'Carregando...' : 'Entrar'}
                    </Botao>
                </div>
            </form>
        </div>
    );
}

export default Login;
