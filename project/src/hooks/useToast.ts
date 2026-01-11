import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastState {
    toasts: Toast[];
    addToast: (type: ToastType, message: string) => void;
    removeToast: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (type, message) => {
        const id = uuidv4();
        set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 5000);
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const useToast = () => {
    const addToast = useToastStore((state) => state.addToast);

    return {
        success: (msg: string) => addToast('success', msg),
        error: (msg: string) => addToast('error', msg),
        warning: (msg: string) => addToast('warning', msg),
        info: (msg: string) => addToast('info', msg),
        toasts: useToastStore((state) => state.toasts),
        removeToast: useToastStore((state) => state.removeToast)
    };
};
