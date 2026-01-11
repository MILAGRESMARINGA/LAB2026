import React, { useEffect, useState } from 'react';
import { mockApi } from '@/lib/mockApi';
import { IUser } from '@/types/crm';
import {
    CheckCircle, XCircle, Shield, ShieldAlert, BadgeCheck, MoreVertical, Search, Trash2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuthStore();

    const fetchUsers = async () => {
        setLoading(true);
        const data = await mockApi.getUsers();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleStatusChange = async (userId: string, newStatus: 'active' | 'pending' | 'banned') => {
        await mockApi.updateUserStatus(userId, newStatus);
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    };

    const handleRoleCycle = async (userId: string, currentRole: string) => {
        const roles: ('admin' | 'editor' | 'leitor')[] = ['leitor', 'editor', 'admin'];
        const currentIndex = roles.indexOf(currentRole as any);
        const nextRole = roles[(currentIndex + 1) % roles.length];

        await mockApi.updateUserRole(userId, nextRole);
        setUsers(users.map(u => u.id === userId ? { ...u, role: nextRole } : u));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'banned': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gerenciamento de Usuários</h1>
                    <p className="text-slate-500">Administre permissões e acessos do sistema</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center shadow-sm">
                    <Search className="text-slate-400 w-5 h-5 ml-2" />
                    <input
                        className="bg-transparent border-none focus:ring-0 text-sm p-2 w-64 text-slate-700 dark:text-white placeholder-slate-400"
                        placeholder="Buscar usuário..."
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuário</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Função</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {u.avatar ? <img src={u.avatar} className="rounded-full" /> : u.name.charAt(0)}
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</div>
                                            <div className="text-sm text-slate-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-600 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700`}
                                        onClick={() => handleRoleCycle(u.id, u.role)}
                                        title="Clique para alterar função"
                                    >
                                        <Shield className="w-3 h-3 mr-1" />
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${getStatusColor(u.status)}`}>
                                        {u.status === 'active' ? 'Ativo' : u.status === 'pending' ? 'Pendente' : 'Banido'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        {u.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusChange(u.id, 'active')}
                                                className="text-green-600 hover:text-green-900 dark:hover:text-green-400 p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                                                title="Aprovar"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                        {u.status !== 'banned' ? (
                                            <button
                                                onClick={() => handleStatusChange(u.id, 'banned')}
                                                className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                                title="Banir"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusChange(u.id, 'active')}
                                                className="text-slate-400 hover:text-slate-600 p-1 rounded"
                                                title="Reativar"
                                            >
                                                <BadgeCheck className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && (
                    <div className="p-8 text-center text-slate-500">Carregando usuários...</div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
