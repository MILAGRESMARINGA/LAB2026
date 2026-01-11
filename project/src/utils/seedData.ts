import { IContact } from '@/types/crm';
import { v4 as uuidv4 } from 'uuid';

export const SEED_CONTACTS: IContact[] = [
    {
        id: '1',
        nome: 'João Silva',
        telefone: '(11) 98765-4321',
        email: 'joao.silva@email.com',
        status: 'novo',
        prioridade: 'alta',
        tags: ['VIP', 'Indicação'],
        dataCriacao: new Date().toISOString(),
        ultimoContato: new Date().toISOString(),
        aniversario: '03-15',
        observacoes: 'Interessado em apartamento na Zona Sul',
        historico: [
            {
                id: uuidv4(),
                texto: 'Olá, gostaria de mais informações.',
                data: new Date(Date.now() - 86400000).toISOString(),
                tipo: 'recebida'
            },
            {
                id: uuidv4(),
                texto: 'Claro João! Como posso ajudar?',
                data: new Date(Date.now() - 86000000).toISOString(),
                tipo: 'enviada'
            }
        ]
    },
    {
        id: '2',
        nome: 'Maria Oliveira',
        telefone: '(21) 99999-8888',
        email: 'maria.oli@test.com',
        status: 'negociacao',
        prioridade: 'media',
        tags: ['Investidor'],
        dataCriacao: new Date(Date.now() - 172800000).toISOString(),
        ultimoContato: new Date(Date.now() - 172800000).toISOString(),
        historico: []
    },
    {
        id: '3',
        nome: 'Carlos Santos',
        telefone: '(31) 97777-6666',
        status: 'fechado',
        prioridade: 'baixa',
        tags: [],
        dataCriacao: new Date(Date.now() - 604800000).toISOString(),
        ultimoContato: new Date(Date.now() - 604800000).toISOString(),
        historico: []
    }
];
