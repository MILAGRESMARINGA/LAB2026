import { IContact } from "@/types/crm";

export const parseContactsCSV = (content: string): Partial<IContact>[] => {
    const lines = content.split('\n');
    const contacts: Partial<IContact>[] = [];

    // Simple CSV parser assuming Header: Nome,Telefone,Email,Status
    // Or just data.
    // We will skip header if first row has "nome" or "name"
    let startIndex = 0;
    if (lines[0].toLowerCase().includes('nome') || lines[0].toLowerCase().includes('name')) {
        startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        // Basic mapping: 0=Name, 1=Phone, 2=Email (optional)
        if (parts.length >= 2) {
            contacts.push({
                nome: parts[0].trim(),
                telefone: parts[1].trim(),
                email: parts[2]?.trim() || '',
                status: 'novo',
                prioridade: 'media',
                tags: ['Importado']
            });
        }
    }

    return contacts;
};
