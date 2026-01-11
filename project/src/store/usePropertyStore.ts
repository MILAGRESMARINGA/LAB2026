import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { IProperty } from '@/types/property';

interface PropertyState {
    properties: IProperty[];
    isLoading: boolean;

    fetchProperties: () => Promise<void>;

    addProperty: (property: Partial<IProperty>) => Promise<void>;
    updateProperty: (id: string, updates: Partial<IProperty>) => Promise<void>;
    deleteProperty: (id: string) => Promise<void>;

    getPropertyById: (id: string) => IProperty | undefined;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
    properties: [],
    isLoading: false,

    fetchProperties: async () => {
        set({ isLoading: true });

        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            set({ properties: data as IProperty[] });
        }
        set({ isLoading: false });
    },

    addProperty: async (propData) => {
        // Clean undefined values or ensure types match DB
        const { data, error } = await supabase
            .from('properties')
            .insert(propData)
            .select()
            .single();

        if (!error && data) {
            set(state => ({ properties: [data as IProperty, ...state.properties] }));
        }
    },

    updateProperty: async (id, updates) => {
        const { error } = await supabase.from('properties').update(updates).eq('id', id);

        if (!error) {
            set(state => ({
                properties: state.properties.map(p => p.id === id ? { ...p, ...updates } : p)
            }));
        }
    },

    deleteProperty: async (id) => {
        const { error } = await supabase.from('properties').delete().eq('id', id);
        if (!error) {
            set(state => ({
                properties: state.properties.filter(p => p.id !== id)
            }));
        }
    },

    getPropertyById: (id) => get().properties.find(p => p.id === id)
}));
