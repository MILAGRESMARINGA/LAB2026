import { Contact, MessageTemplate, Property } from '../types';

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '11999887766',
    status: 'new',
    tags: ['Lead Quente', 'Apartamento'],
    notes: 'Interessado em apartamento de 2 quartos',
    createdAt: '2024-01-15T10:00:00Z',
    propertyInterest: 'Apartamento 2 quartos',
    budget: 350000
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '11988776655',
    status: 'contacted',
    tags: ['Casa', 'Urgente'],
    notes: 'Precisa de casa com quintal para pets',
    createdAt: '2024-01-14T14:30:00Z',
    lastContact: '2024-01-15T09:00:00Z',
    propertyInterest: 'Casa com quintal',
    budget: 450000
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    phone: '11977665544',
    status: 'negotiating',
    tags: ['Investidor', 'Comercial'],
    notes: 'Investidor procurando salas comerciais',
    createdAt: '2024-01-12T16:00:00Z',
    lastContact: '2024-01-14T11:00:00Z',
    propertyInterest: 'Sala comercial',
    budget: 800000
  },
  {
    id: '4',
    name: 'Ana Costa',
    phone: '11966554433',
    status: 'closed',
    tags: ['Cliente VIP', 'Apartamento'],
    notes: 'Fechou negócio - apartamento cobertura',
    createdAt: '2024-01-10T08:00:00Z',
    lastContact: '2024-01-13T15:00:00Z',
    propertyInterest: 'Cobertura',
    budget: 1200000
  }
];

export const messageTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Apresentação Inicial',
    content: 'Olá {nome}! Sou {corretor} da {imobiliaria}. Vi seu interesse em {tipo_imovel} e tenho ótimas opções para você. Posso te ajudar?',
    variables: ['nome', 'corretor', 'imobiliaria', 'tipo_imovel'],
    category: 'greeting'
  },
  {
    id: '2',
    name: 'Divulgação de Imóvel',
    content: '🏠 Olá {nome}! Acabou de chegar no mercado: {titulo_imovel} em {localizacao} por apenas R$ {valor}. {quartos} quartos, {banheiros} banheiros, {area}m². Quer agendar uma visita?',
    variables: ['nome', 'titulo_imovel', 'localizacao', 'valor', 'quartos', 'banheiros', 'area'],
    category: 'property'
  },
  {
    id: '3',
    name: 'Follow-up',
    content: 'Oi {nome}! Como está? Vi que você teve interesse em {tipo_imovel}. Tenho algumas novidades que podem te interessar. Quando podemos conversar?',
    variables: ['nome', 'tipo_imovel'],
    category: 'follow-up'
  },
  {
    id: '4',
    name: 'Proposta',
    content: '{nome}, tenho uma proposta especial para o {titulo_imovel}! O proprietário aceitou negociar por R$ {valor_proposta}. É uma oportunidade única! Vamos fechar?',
    variables: ['nome', 'titulo_imovel', 'valor_proposta'],
    category: 'closing'
  }
];

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Apartamento Moderno Vila Madalena',
    price: 450000,
    location: 'Vila Madalena, São Paulo',
    type: 'Apartamento',
    bedrooms: 2,
    bathrooms: 2,
    area: 65
  },
  {
    id: '2',
    title: 'Casa com Quintal Jardins',
    price: 850000,
    location: 'Jardins, São Paulo',
    type: 'Casa',
    bedrooms: 3,
    bathrooms: 2,
    area: 180
  },
  {
    id: '3',
    title: 'Sala Comercial Centro',
    price: 320000,
    location: 'Centro, São Paulo',
    type: 'Comercial',
    area: 45
  }
];