import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        layout
                        className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-lg rounded-lg p-4 flex items-start gap-3 min-w-[300px] max-w-sm pointer-events-auto"
                    >
                        <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
                        <div className="flex-1 text-sm text-slate-700 dark:text-slate-200">{toast.message}</div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
