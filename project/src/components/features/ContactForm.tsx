import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { IContact } from '@/types/crm';

const contactSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    telefone: z.string().min(10, 'Telefone inválido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    status: z.enum(['novo', 'negociacao', 'proposta', 'fechado', 'perdido']),
    prioridade: z.enum(['alta', 'media', 'baixa'])
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
    onSubmit: (data: ContactFormData) => void;
    onCancel: () => void;
    initialData?: Partial<IContact>;
    loading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({ onSubmit, onCancel, initialData, loading }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            nome: initialData?.nome || '',
            telefone: initialData?.telefone || '',
            email: initialData?.email || '',
            status: initialData?.status || 'novo',
            prioridade: initialData?.prioridade || 'media'
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Nome Completo"
                {...register('nome')}
                error={errors.nome?.message}
                placeholder="Ex: João Silva"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Telefone / WhatsApp"
                    {...register('telefone')}
                    error={errors.telefone?.message}
                    placeholder="(11) 99999-9999"
                />
                <Input
                    label="Email (Opcional)"
                    {...register('email')}
                    error={errors.email?.message}
                    placeholder="joao@email.com"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                        {...register('status')}
                        className="w-full rounded-lg border border-slate-300 bg-white dark:bg-dark-card dark:border-dark-border py-2 px-3 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="novo">Novo</option>
                        <option value="negociacao">Em Negociação</option>
                        <option value="proposta">Proposta</option>
                        <option value="fechado">Fechado</option>
                        <option value="perdido">Perdido</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
                    <select
                        {...register('prioridade')}
                        className="w-full rounded-lg border border-slate-300 bg-white dark:bg-dark-card dark:border-dark-border py-2 px-3 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-border mt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" loading={loading}>Salvar Contato</Button>
            </div>
        </form>
    );
};
