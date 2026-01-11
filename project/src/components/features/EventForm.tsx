import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { IEvent } from '@/types/crm';

const eventSchema = z.object({
    title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
    type: z.enum(['reuniao', 'visita', 'tarefa']),
    startDate: z.string(),
    description: z.string().optional()
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
    onSubmit: (data: EventFormData) => void;
    onCancel: () => void;
    initialData?: Partial<IEvent>;
    loading?: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({ onSubmit, onCancel, initialData, loading }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: initialData?.title || '',
            type: initialData?.type || 'reuniao',
            startDate: initialData?.startDate ? initialData.startDate.substring(0, 16) : new Date().toISOString().substring(0, 16),
            description: initialData?.description || ''
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Título do Evento"
                {...register('title')}
                error={errors.title?.message}
                placeholder="Ex: Reunião com Cliente"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                    <select
                        {...register('type')}
                        className="w-full rounded-lg border border-slate-300 bg-white dark:bg-dark-card dark:border-dark-border py-2 px-3 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="reuniao">Reunião</option>
                        <option value="visita">Visita</option>
                        <option value="tarefa">Tarefa</option>
                    </select>
                </div>

                <Input
                    label="Data e Hora"
                    type="datetime-local"
                    {...register('startDate')}
                    error={errors.startDate?.message}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white dark:bg-dark-card dark:border-dark-border py-2 px-3 focus:ring-2 focus:ring-blue-500"
                    placeholder="Detalhes do evento..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-border mt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" loading={loading}>Salvar Evento</Button>
            </div>
        </form>
    );
};
