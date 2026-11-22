import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase-config';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function ModalRecuperarSenha({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [enviando, setEnviando] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setEnviando(true);

        try {
            await sendPasswordResetEmail(auth, email);
            toast.success('Enviamos um link de recuperação para o seu e-mail. Verifique a caixa de entrada e o spam.', { duration: 6000 });
            setEmail('');
            onClose();
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/user-not-found') {
                toast.error('E-mail não encontrado. Verifique se digitou corretamente.');
            } else if (error.code === 'auth/invalid-email') {
                toast.error('E-mail inválido. Verifique o formato.');
            } else {
                toast.error('Erro ao enviar o e-mail. Tente novamente mais tarde.');
            }
        } finally {
            setEnviando(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Recuperar Senha"
            icon={<Mail size={18} className="text-emerald-600 dark:text-emerald-400" />} // <-- Verde Esmeralda
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm !text-slate-600 dark:!text-slate-400">
                    Digite o e-mail cadastrado para receber um link de redefinição de senha.
                </p>
                <div>
                    <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">E-mail</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        placeholder="seu@email.com"
                        required
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium !text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:!text-slate-300 dark:hover:bg-slate-800"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={enviando}
                        className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Send size={16} /> {enviando ? 'Enviando...' : 'Enviar Link'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}