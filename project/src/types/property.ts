export interface IProperty {
    id: string;
    created_at: string;

    // Vínculos
    owner_id: string; // Contact ID
    type: string;     // 'Venda' | 'Locacao'
    status: string;   // 'disponivel' | 'reservado' | 'vendido'

    // Dados Básicos
    title: string;
    description?: string;

    // Endereço
    address_zipcode?: string;
    address_street?: string;
    address_number?: string;
    address_neighborhood?: string; // Mapped from CEP
    address_city?: string;         // Mapped from CEP
    address_state?: string;        // Mapped from CEP

    // Dimensões
    area_total?: number;
    area_useful?: number;

    // Cômodos
    bedrooms?: number;
    suites?: number;
    bathrooms?: number;
    garages?: number;

    // Financeiro
    price?: number;
    condo_fee?: number;
    iptu_value?: number;

    // Logística
    keys_location?: string;

    // Features
    features: string[]; // Simple array of strings

    // Multimídia
    photos: string[];
    video_url?: string;
    tour_360_url?: string;
}
