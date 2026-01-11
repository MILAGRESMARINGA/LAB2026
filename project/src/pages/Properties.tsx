import React, { useEffect, useState } from 'react';
import { usePropertyStore } from '@/store/usePropertyStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PropertyForm } from '@/components/features/PropertyForm';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatters';
import { Plus, Home, Search, Bed, Car, ArrowUpRight, Edit2, Trash2, MapPin } from 'lucide-react';

export default function Properties() {
    const { properties, fetchProperties, addProperty, deleteProperty } = usePropertyStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { success } = useToast();

    useEffect(() => {
        fetchProperties();
    }, []);

    const handleCreate = async (data: any) => {
        await addProperty(data);
        success('Imóvel cadastrado com sucesso!');
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Excluir este imóvel?')) {
            await deleteProperty(id);
            success('Imóvel removido!');
        }
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Imóveis
                    </h1>
                    <p className="text-slate-500">Gestão de carteira imobiliária</p>
                </div>
                <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                    Novo Imóvel
                </Button>
            </div>

            <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por título..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar p-1">
                {properties.map(p => (
                    <div key={p.id} className="group bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all">
                        {/* Image Cover */}
                        <div className="h-48 bg-slate-200 dark:bg-slate-700 relative">
                            {p.photos?.[0] ? (
                                <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Home size={48} opacity={0.3} />
                                </div>
                            )}
                            <div className="absolute top-3 right-3">
                                <Badge variant={p.status === 'disponivel' ? 'success' : p.status === 'vendido' ? 'error' : 'warning'}>
                                    {p.status}
                                </Badge>
                            </div>
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">
                                {p.type}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1" title={p.title}>{p.title}</h3>
                                <p className="font-bold text-blue-600 dark:text-blue-400">
                                    {p.price ? formatCurrency(p.price) : 'R$ 0,00'}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 text-slate-500 text-xs mb-4">
                                <MapPin size={12} />
                                <span className="truncate max-w-[200px]">{p.address_street || 'Endereço não informado'}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 dark:border-slate-800 mb-4">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-slate-400 uppercase">Área</span>
                                    <span className="font-semibold text-sm flex items-center gap-1">
                                        {p.area_useful || 0} <span className="text-[10px]">m²</span>
                                    </span>
                                </div>
                                <div className="flex flex-col items-center border-l border-slate-100 dark:border-slate-800">
                                    <span className="text-xs text-slate-400 uppercase">Quartos</span>
                                    <span className="font-semibold text-sm flex items-center gap-1">
                                        <Bed size={14} className="text-slate-400" /> {p.bedrooms || 0}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center border-l border-slate-100 dark:border-slate-800">
                                    <span className="text-xs text-slate-400 uppercase">Vagas</span>
                                    <span className="font-semibold text-sm flex items-center gap-1">
                                        <Car size={14} className="text-slate-400" /> {p.garages || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600">
                                    Ver Detalhes <ArrowUpRight size={14} className="ml-1" />
                                </Button>
                                <div className="flex gap-1">
                                    <button className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-50" onClick={() => console.log('Edit')}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50" onClick={() => handleDelete(p.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Imóvel"
                size="xl"
            >
                <PropertyForm
                    onSubmit={handleCreate}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
