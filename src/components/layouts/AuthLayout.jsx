import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children, leftTitle, leftDescription, linkText, linkTo }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#020817] p-4 font-sans">

            {/* Container Principal */}
            <div className="flex w-full max-w-4xl max-h-[90vh] flex-row overflow-hidden rounded-2xl shadow-2xl bg-[#0B1120] border border-slate-800">

                {/* Lado Esquerdo */}
                <div className="relative hidden w-1/2 flex-col justify-center items-center bg-gradient-to-br from-blue-900 to-[#0B1120] p-10 text-center md:flex">

                    {/* Logo no canto superior esquerdo */}
                    <div className="absolute top-6 left-6 flex items-center gap-2 text-white font-bold text-lg">
                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-sm">N</div>
                        Nexus CRM
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-3">{leftTitle}</h2>
                    <p className="text-slate-400 mb-8 text-sm max-w-xs">{leftDescription}</p>

                    <Link
                        to={linkTo}
                        className="px-6 py-2 rounded-lg border border-slate-600 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                        {linkText}
                    </Link>
                </div>

                {/* Lado Direito (Formulário) */}
                <div className="flex w-full flex-col justify-center p-6 md:w-1/2 md:p-8 overflow-y-auto custom-scrollbar">
                    <Link to="/" className="text-slate-500 hover:text-white mb-6 flex items-center gap-2 text-xs w-max transition-colors">
                        <ArrowLeft size={14} /> Voltar para o site
                    </Link>

                    {children}
                </div>

            </div>
        </div>
    );
}