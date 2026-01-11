export interface IMessage {
    id: string;
    texto: string;
    data: string;                  // ISO format
    tipo: 'enviada' | 'recebida';
    midia?: {
        tipo: 'imagem' | 'pdf';
        url: string;
        nome: string;
    };
}

export interface IContact {
    id: string;
    nome: string;
    telefone: string;              // (XX) 9XXXX-XXXX
    email?: string;
    status: 'novo' | 'negociacao' | 'proposta' | 'fechado' | 'perdido';
    prioridade: 'alta' | 'media' | 'baixa';
    tags: string[];
    dataCriacao: string;           // ISO format
    ultimoContato: string;         // ISO format
    aniversario?: string;          // MM-DD format
    observacoes?: string;
    historico: IMessage[];
}

export interface IUser {
    id: string;
    username?: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    company?: string;
    location?: string;
    position?: string;
    bio?: string;
    role: 'admin' | 'editor' | 'leitor';
    status: 'active' | 'pending' | 'banned';
}

export interface IMessageTemplate {
    id: string;
    nome: string;
    conteudo: string;
    variaveis: string[];
}

export interface IContactFilters {
    search: string;
    status: string[];
    tags: string[];
    priority: string[];
}

export interface IEvent {
    id: string;
    title: string;
    description?: string;
    startDate: string; // ISO
    endDate?: string;  // ISO
    type: 'reuniao' | 'visita' | 'tarefa';
    contactId?: string;
    status: 'pendente' | 'concluido';
}
