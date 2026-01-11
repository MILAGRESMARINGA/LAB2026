import { create } from 'zustand';
import { IContact, IContactFilters, IMessageTemplate, IUser, IEvent } from '@/types/crm';
import { supabase } from '@/lib/supabase';

interface CRMState {
    contacts: IContact[];
    events: IEvent[];
    templates: IMessageTemplate[];
    user: IUser | null;
    filters: IContactFilters;
    isLoading: boolean;

    // Sync Actions
    fetchContacts: () => Promise<void>;
    fetchEvents: () => Promise<void>;

    // Contact Actions
    addContact: (contact: Omit<IContact, 'id' | 'dataCriacao' | 'historico'>) => Promise<void>;
    updateContact: (id: string, updates: Partial<IContact>) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;
    getContactById: (id: string) => IContact | undefined;

    // Event Actions
    addEvent: (event: Omit<IEvent, 'id'>) => Promise<void>;
    updateEvent: (id: string, updates: Partial<IEvent>) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;

    setFilters: (filters: Partial<IContactFilters>) => void;
    resetFilters: () => void;

    addTemplate: (template: Omit<IMessageTemplate, 'id'>) => void;
    deleteTemplate: (id: string) => void;
}

export const useCRMStore = create<CRMState>((set, get) => ({
    contacts: [],
    events: [],
    templates: [
        { id: '1', nome: 'Boas Vindas', conteudo: 'Olá {nome}, tudo bem?', variaveis: ['nome'] }
    ],
    user: { id: '1', name: 'Admin', username: 'admin', role: 'admin' },
    filters: { search: '', status: [], tags: [], priority: [] },
    isLoading: false,

    fetchContacts: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase.from('contacts').select('*');
        if (!error && data) {
            // Map DB fields to Frontend (snake_case to camelCase if needed)
            // Assuming schema.sql used snake_case like data_criacao, ultimo_contato
            // We need to map it carefully or update types to match DB
            // For now, let's assume we mapped types manually or just pass data if names match
            // DB has: nome, telefone, email, status, prioridade, tags, data_criacao, ultimo_contato, aniversario, observacoes
            const mappedContacts: IContact[] = data.map((c: any) => ({
                id: c.id,
                nome: c.nome,
                telefone: c.telefone,
                email: c.email,
                status: c.status,
                prioridade: c.prioridade,
                tags: c.tags || [],
                dataCriacao: c.data_criacao,
                ultimoContato: c.ultimo_contato,
                historico: [], // TODO: fetch history
                aniversario: c.aniversario
            }));
            set({ contacts: mappedContacts });
        }
        set({ isLoading: false });
    },

    fetchEvents: async () => {
        const { data, error } = await supabase.from('events').select('*');
        if (!error && data) {
            const mappedEvents: IEvent[] = data.map((e: any) => ({
                id: e.id,
                title: e.title,
                description: e.description,
                startDate: e.start_date,
                endDate: e.end_date,
                type: e.type,
                contactId: e.contact_id,
                status: e.status
            }));
            set({ events: mappedEvents });
        }
    },

    addContact: async (contactData) => {
        const dbContact = {
            nome: contactData.nome,
            telefone: contactData.telefone,
            email: contactData.email,
            status: contactData.status,
            prioridade: contactData.prioridade,
            tags: contactData.tags,
            // data_criacao handled by default
            // ultimo_contato handled by default
        };

        const { data, error } = await supabase.from('contacts').insert(dbContact).select().single();

        if (!error && data) {
            const newContact: IContact = {
                id: data.id,
                ...contactData,
                dataCriacao: data.data_criacao,
                ultimoContato: data.ultimo_contato,
                historico: []
            };
            set((state) => ({ contacts: [...state.contacts, newContact] }));
        }
    },

    updateContact: async (id, updates) => {
        const dbUpdates: any = {};
        if (updates.nome) dbUpdates.nome = updates.nome;
        if (updates.telefone) dbUpdates.telefone = updates.telefone;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.prioridade) dbUpdates.prioridade = updates.prioridade;
        // Add other fields mapping as needed

        const { error } = await supabase.from('contacts').update(dbUpdates).eq('id', id);

        if (!error) {
            set((state) => ({
                contacts: state.contacts.map((c) => c.id === id ? { ...c, ...updates } : c)
            }));
        }
    },

    deleteContact: async (id) => {
        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (!error) {
            set((state) => ({
                contacts: state.contacts.filter((c) => c.id !== id)
            }));
        }
    },

    getContactById: (id) => get().contacts.find((c) => c.id === id),

    addEvent: async (eventData) => {
        const dbEvent = {
            title: eventData.title,
            description: eventData.description,
            start_date: eventData.startDate,
            end_date: eventData.endDate,
            type: eventData.type,
            status: eventData.status,
            contact_id: eventData.contactId
        };
        const { data, error } = await supabase.from('events').insert(dbEvent).select().single();

        if (!error && data) {
            set((state) => ({ events: [...state.events, { ...eventData, id: data.id }] }));
        }
    },

    updateEvent: async (id, updates) => {
        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.startDate) dbUpdates.start_date = updates.startDate;
        if (updates.endDate) dbUpdates.end_date = updates.endDate;
        if (updates.status) dbUpdates.status = updates.status;
        // ... map others

        const { error } = await supabase.from('events').update(dbUpdates).eq('id', id);
        if (!error) {
            set((state) => ({
                events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e)
            }));
        }
    },

    deleteEvent: async (id) => {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (!error) {
            set((state) => ({
                events: state.events.filter((e) => e.id !== id)
            }));
        }
    },

    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
    })),

    resetFilters: () => set({ filters: { search: '', status: [], tags: [], priority: [] } }),

    addTemplate: (data) => set((state) => ({
        templates: [...state.templates, { ...data, id: Math.random().toString() }] // Keeping templates local for now or move to DB later
    })),

    deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter((t) => t.id !== id)
    })),
}));
