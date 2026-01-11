import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

const PendingApproval: React.FC = () => {
    const { signOut } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-700/50 max-w-md w-full text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <Clock className="w-10 h-10 text-yellow-400" />
                </div>

                <h1 className="text-2xl font-bold text-white">Aguardando Aprovação</h1>

                <p className="text-slate-300">
                    Sua conta foi criada com sucesso e está em análise.
                    Você receberá um email assim que o administrador liberar seu acesso.
                </p>

                <div className="bg-slate-700/50 rounded-xl p-4 text-left">
                    <div className="flex items-center space-x-3 text-slate-400 mb-2">
                        <CheckCircle size={16} className="text-green-400" />
                        <span className="text-sm">Cadastro realizado</span>
                    </div>
                    <div className="flex items-center space-x-3 text-white font-medium">
                        <div className="w-4 h-4 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                        <span className="text-sm">Aguardando liberação do admin</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-white text-sm hover:underline transition-colors"
                >
                    Voltar para o Login
                </button>
            </div>
        </div>
    );
};

export default PendingApproval;
