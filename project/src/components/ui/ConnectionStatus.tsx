import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from './Badge';
import { Wifi, WifiOff } from 'lucide-react';

export const ConnectionStatus = () => {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const { error } = await supabase.from('contacts').select('count', { count: 'exact', head: true });
                if (error && error.code !== 'PGRST116') { // Ignore "no rows" errors if table empty but exists
                    // If table doesn't exist, we might get an error, but that means "connected to Supabase but schema missing" which is also useful info
                    if (error.code === '42P01') { // undefined_table
                        setIsOnline(true); // Connected, but schema missing. Or false? Let's say online but warn.
                        console.warn('Supabase connected but table missing (run schema.sql)');
                    } else {
                        setIsOnline(false);
                    }
                } else {
                    setIsOnline(true);
                }
            } catch (e) {
                setIsOnline(false);
            }
        };

        checkConnection();
        const interval = setInterval(checkConnection, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    if (isOnline === null) return null; // Loading

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {isOnline ? (
                <>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden md:inline">Conectado</span>
                </>
            ) : (
                <>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden md:inline">Desconectado</span>
                </>
            )}
        </div>
    );
};
