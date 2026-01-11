import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { motion } from 'framer-motion';

export const DarkModeToggle: React.FC = () => {
    const { theme, toggleTheme } = useUIStore();

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Dark Mode"
        >
            {theme === 'light' ? (
                <Moon className="w-5 h-5" />
            ) : (
                <Sun className="w-5 h-5" />
            )}
        </motion.button>
    );
};
