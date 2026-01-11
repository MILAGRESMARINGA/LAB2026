import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from '../ui/Toast';

export const MainLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Header />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative custom-scrollbar">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            <ToastContainer />
        </div>
    );
};
