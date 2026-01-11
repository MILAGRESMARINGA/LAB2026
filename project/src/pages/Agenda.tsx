import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EventForm } from '@/components/features/EventForm';
import { useCRMStore } from '@/store/useCRMStore';
import { useToast } from '@/hooks/useToast';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, Trash2, Edit2 } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { IEvent } from '@/types/crm';

export default function Agenda() {
  const { events, addEvent, updateEvent, deleteEvent } = useCRMStore();
  const { success } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);

  const days = React.useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const daysEvents = useMemo(() => {
    return events.filter(e => isSameDay(parseISO(e.startDate), currentDate));
  }, [events, currentDate]);

  const handleSaveEvent = (data: any) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
      success('Evento atualizado!');
    } else {
      addEvent({ ...data, status: 'pendente' });
      success('Evento criado!');
    }
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      deleteEvent(id);
      success('Evento excluído!');
      setIsModalOpen(false);
    }
  };

  const openNewEvent = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditEvent = (event: IEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setCurrentDate(d => addDays(d, -7))}>
              <ChevronLeft />
            </Button>
            <h2 className="text-xl font-bold capitalize text-slate-900 dark:text-white">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="ghost" onClick={() => setCurrentDate(d => addDays(d, 7))}>
              <ChevronRight />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
            <Button variant="primary" icon={<Plus size={18} />} onClick={openNewEvent}>Novo</Button>
          </div>
        </Card>

        <div className="grid grid-cols-7 gap-4 flex-1">
          {days.map(day => {
            const dayEvents = events.filter(e => isSameDay(parseISO(e.startDate), day));
            const hasEvents = dayEvents.length > 0;

            return (
              <Card
                key={day.toString()}
                className={`
                            flex flex-col items-center p-4 cursor-pointer hover:border-blue-500 transition-colors relative
                            ${isToday(day) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                            ${isSameDay(day, currentDate) ? 'border-blue-500 bg-blue-50/50' : ''}
                        `}
                onClick={() => setCurrentDate(day)}
                noPadding
              >
                <span className="text-sm text-slate-500 dark:text-slate-400 capitalize mb-2 mt-4">
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <span className={`
                            text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full
                            ${isToday(day) ? 'bg-blue-600 text-white' : 'text-slate-900 dark:text-white'}
                        `}>
                  {format(day, 'd')}
                </span>

                <div className="flex gap-1 mt-4 mb-2 h-2">
                  {hasEvents && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <CalendarIcon className="text-blue-600" />
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
              Eventos de {format(currentDate, "d 'de' MMM", { locale: ptBR })}
            </h3>
          </div>

          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {daysEvents.length === 0 ? (
              <div className="text-center text-slate-400 py-10">
                Nenhum evento para este dia.
              </div>
            ) : (
              daysEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => openEditEvent(event)}
                  className="group flex gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="text-center min-w-[3rem]">
                    <span className="block text-xs text-slate-500 font-bold">
                      {format(parseISO(event.startDate), 'HH:mm')}
                    </span>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-4 flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-white">{event.title}</h4>
                    <p className="text-sm text-slate-500 capitalize">{event.type}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center">
                    <Edit2 size={14} className="text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? "Editar Evento" : "Novo Evento"}
        footer={editingEvent && (
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => handleDelete(editingEvent.id)}>
            Excluir
          </Button>
        )}
      >
        <EventForm
          onSubmit={handleSaveEvent}
          onCancel={() => setIsModalOpen(false)}
          initialData={editingEvent || { startDate: currentDate.toISOString() }}
        />
      </Modal>
    </div>
  );
}

import { useMemo } from 'react';