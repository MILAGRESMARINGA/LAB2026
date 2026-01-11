import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Trello,
    MessageSquare,
    Send,
    Settings,
    LogOut,
    Calendar,
    Building,
    Shield
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const Sidebar: React.FC = () => {
    const { sidebarOpen, toggleSidebar } = useUIStore();
    const { user, signOut } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };


    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Users, label: 'Contatos', path: '/contacts' },
        { icon: Trello, label: 'Kanban', path: '/kanban' },
        { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
        { icon: Send, label: 'Envio em Massa', path: '/send-mass' },
        { icon: Building, label: 'Imóveis', path: '/properties' },
        { icon: Calendar, label: 'Agenda', path: '/agenda' }
    ];

    const sidebarVariants = {
        open: { width: '16rem', x: 0 },
        closed: { width: '0rem', x: '-100%' }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-20 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
                onClick={toggleSidebar}
            />

            <motion.aside
                initial={false}
                animate={sidebarOpen ? 'open' : 'closed'}
                variants={sidebarVariants}
                className={`
          fixed top-0 left-0 z-30 h-full bg-white dark:bg-dark-card border-r border-slate-200 dark:border-dark-border
          flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 lg:w-64 lg:static
        `}
            >
                <div className="p-6 flex items-center justify-center border-b border-slate-100 dark:border-dark-border">
                    <h1 className="text-2xl font-bold text-blue-600">CRM<span className="text-slate-800 dark:text-white">Pro</span></h1>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                  ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-slate-600 hover:bg-white hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400'
                                    }
                `}
                            >
                                <Icon size={20} className="relative z-10" />
                                <span className="relative z-10">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-dark-border space-y-2">
                    {/* Admin Link */}
                    {user?.role === 'admin' && (
                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'text-slate-600 hover:bg-purple-50 hover:text-purple-600 dark:text-slate-400 dark:hover:bg-purple-900/20 dark:hover:text-purple-400'
                                }
                            `}
                        >
                            <Shield size={20} />
                            Administração
                        </NavLink>
                    )}

                    <NavLink
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-dark-bg"
                    >
                        <Settings size={20} />
                        Perfil
                    </NavLink>
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        Sair
                    </button>
                </div>
            </motion.aside>
        </>
    );
};
