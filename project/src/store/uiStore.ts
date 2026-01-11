import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    modalOpen: string | null;

    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
    toggleSidebar: () => void;
    openModal: (modalId: string) => void;
    closeModal: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            theme: 'dark', // Default to requested dark theme
            sidebarOpen: true,
            modalOpen: null,

            toggleTheme: () => set((state) => {
                const newTheme = state.theme === 'light' ? 'dark' : 'light';
                if (typeof document !== 'undefined') {
                    if (newTheme === 'dark') document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                }
                return { theme: newTheme };
            }),

            setTheme: (theme) => {
                if (typeof document !== 'undefined') {
                    if (theme === 'dark') document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                }
                set({ theme });
            },

            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            openModal: (modalId) => set({ modalOpen: modalId }),
            closeModal: () => set({ modalOpen: null }),
        }),
        {
            name: 'ui-storage',
        }
    )
);
