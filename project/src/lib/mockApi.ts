import { IUser } from '@/types/crm';

// Mock Data
let mockUsers: IUser[] = [
    {
        id: '1',
        name: 'Administrador Gustavo',
        email: 'admin@crm.com',
        role: 'admin',
        status: 'active',
        avatar: 'https://github.com/shadcn.png'
    },
    {
        id: '2',
        name: 'Corretor João',
        email: 'joao@crm.com',
        role: 'editor',
        status: 'active'
    },
    {
        id: '3',
        name: 'Corretor Iniciante',
        email: 'pending@crm.com',
        role: 'leitor',
        status: 'pending' // Waiting approval
    }
];

export const mockApi = {
    getUsers: async (): Promise<IUser[]> => {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        return [...mockUsers];
    },

    updateUserStatus: async (userId: string, status: 'active' | 'pending' | 'banned'): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        mockUsers = mockUsers.map(u => u.id === userId ? { ...u, status } : u);
    },

    updateUserRole: async (userId: string, role: 'admin' | 'editor' | 'leitor'): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        mockUsers = mockUsers.map(u => u.id === userId ? { ...u, role } : u);
    },

    // Helper to simulate registration
    registerMockUser: async (user: Partial<IUser>): Promise<IUser> => {
        const newUser: IUser = {
            id: Math.random().toString(36).substr(2, 9),
            name: user.name || 'Novo Usuário',
            email: user.email || 'novo@test.com',
            role: 'leitor', // Default
            status: 'pending', // Default
            ...user
        } as IUser;
        mockUsers.push(newUser);
        return newUser;
    }
};
