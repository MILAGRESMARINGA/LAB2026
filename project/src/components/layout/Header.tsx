import React from 'react';
import { Menu, Search, Bell, User } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { Input } from '../ui/Input';
import { DarkModeToggle } from '../ui/DarkModeToggle';
import { ConnectionStatus } from '../ui/ConnectionStatus';

export const Header: React.FC = () => {
    const { toggleSidebar } = useUIStore();

    return (
        <header className="h-16 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
                >
                    <Menu size={24} />
                </button>

                <div className="hidden md:block w-64 lg:w-96">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar contatos, mensagens..."
                            className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <ConnectionStatus />
                <DarkModeToggle />

                <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-dark-card"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Admin</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Master</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};
