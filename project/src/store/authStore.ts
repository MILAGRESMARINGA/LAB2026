import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { IUser } from '@/types/crm';

interface AuthState {
    user: IUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    role: 'admin' | 'editor' | 'leitor' | null;

    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    checkSession: () => Promise<void>;
    updateUser: (updates: Partial<IUser>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    loading: true,
    role: null,

    signIn: async (email, password) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (!error && data.user) {
            // In a real app, we would fetch the role/status from a 'profiles' table here
            // For now, we decode it from metadata or default to active for the admin demo
            const metadata = data.user.user_metadata;
            const isDemoAdmin = email === 'admin@crm.com';

            const user: IUser = {
                id: data.user.id,
                name: metadata.name || email.split('@')[0],
                email: data.user.email || email,
                role: (metadata.role as any) || (isDemoAdmin ? 'admin' : 'leitor'),
                avatar: metadata.avatar_url,
                status: (metadata.status as any) || (isDemoAdmin ? 'active' : 'pending')
            };
            set({ user, isAuthenticated: true, role: user.role, loading: false });
        } else {
            set({ loading: false });
        }
        return { error };
    },

    signUp: async (email, password) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    status: 'pending', // Default new users to pending
                    role: 'leitor'
                }
            }
        });

        if (!error && data.user) {
            // We don't auto-login if email confirmation is required, but for this demo:
            // Logic handled by Supabase config
        }
        set({ loading: false });
        // NOTE: Supabase might require email confirmation.
        return { error };
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, role: null });
    },

    checkSession: async () => {
        set({ loading: true });
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            const metadata = session.user.user_metadata;
            const isDemoAdmin = session.user.email === 'admin@crm.com';

            const user: IUser = {
                id: session.user.id,
                name: metadata.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                role: (metadata.role as any) || (isDemoAdmin ? 'admin' : 'leitor'),
                avatar: metadata.avatar_url,
                status: (metadata.status as any) || (isDemoAdmin ? 'active' : 'pending')
            };
            set({ user, isAuthenticated: true, role: user.role, loading: false });
        } else {
            // Check for demo mode localStorage if desired, or just fail
            set({ user: null, isAuthenticated: false, role: null, loading: false });
        }
    },

    updateUser: (updates) => {
        set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null
        }));
    }
}));

