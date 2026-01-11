import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCRMStore } from '@/store/useCRMStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapPin, Home, CheckSquare, Image as ImageIcon, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock CEP fetch
const fetchAddressByCEP = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;
    try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (data.erro) return null;
        return data;
    } catch (e) {
        return null;
    }
};

const STEPS = [
    { number: 1, title: 'Vínculo e Endereço', icon: MapPin },
    { number: 2, title: 'Detalhes Técnicos', icon: Home },
    { number: 3, title: 'Características', icon: CheckSquare },
    { number: 4, title: 'Fotos e Mídia', icon: ImageIcon },
];

const AVAILABLE_FEATURES = [
    'Piscina', 'Churrasqueira', 'Portaria 24h', 'Academia', 'Salão de Festas',
    'Ar Condicionado', 'Mobiliado', 'Varanda Gourmet', 'Armários Embutidos', 'Elevador'
];

export const PropertyForm = ({ onSubmit, onCancel, initialData }: any) => {
    const [currentStep, setCurrentStep] = useState(1);
    const { contacts, fetchContacts } = useCRMStore();
    const [loadingCep, setLoadingCep] = useState(false);

    const { register, handleSubmit, setValue } = useForm({
        defaultValues: initialData || {
            type: 'Venda',
            features: [],
            photos: []
        }
    });

    useEffect(() => {
        if (contacts.length === 0) fetchContacts();
    }, []);

    const handleCepBlur = async (e: any) => {
        const cep = e.target.value;
        if (!cep) return;
        setLoadingCep(true);
        const addr = await fetchAddressByCEP(cep);
        if (addr) {
            setValue('address_street', addr.logradouro);
            setValue('address_neighborhood', addr.bairro);
            setValue('address_city', addr.localidade);
            setValue('address_state', addr.uf);
        }
        setLoadingCep(false);
    };

    const nextStep = () => setCurrentStep(p => Math.min(p + 1, 4));
    const prevStep = () => setCurrentStep(p => Math.max(p - 1, 1));

    // Custom submit handler to parse numbers
    const onFormSubmit = (data: any) => {
        const formattedData = {
            ...data,
            // Parse Floats
            price: data.price ? parseFloat(data.price) : 0,
            condo_fee: data.condo_fee ? parseFloat(data.condo_fee) : 0,
            iptu_value: data.iptu_value ? parseFloat(data.iptu_value) : 0,
            area_total: data.area_total ? parseFloat(data.area_total) : 0,
            area_useful: data.area_useful ? parseFloat(data.area_useful) : 0,
            // Parse Ints
            bedrooms: data.bedrooms ? parseInt(data.bedrooms) : 0,
            suites: data.suites ? parseInt(data.suites) : 0,
            bathrooms: data.bathrooms ? parseInt(data.bathrooms) : 0,
            garages: data.garages ? parseInt(data.garages) : 0,
        };
        onSubmit(formattedData);
    };

    return (
        <div className="flex flex-col h-full max-h-[80vh]">
            <div className="flex justify-between mb-8 px-4">
                {STEPS.map((s) => (
                    <div key={s.number} className={`flex flex-col items-center gap-2 ${currentStep >= s.number ? 'text-blue-600' : 'text-slate-300'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${currentStep >= s.number ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                            <s.icon size={20} />
                        </div>
                        <span className="text-xs font-medium hidden sm:block">{s.title}</span>
                    </div>
                ))}
            </div>

            {/* Changed to onFormSubmit wrapper */}
            <form id="property-form" className="flex-1 overflow-y-auto px-1 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {/* STEP 1: GENERAL */}
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Proprietário</label>
                                    <select {...register('owner_id')} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700">
                                        <option value="">Selecione...</option>
                                        {contacts.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tipo</label>
                                    <select {...register('type')} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700">
                                        <option value="Venda">Venda</option>
                                        <option value="Locacao">Locação</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <MapPin size={18} /> Endereço
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="CEP" {...register('address_zipcode')} onBlur={handleCepBlur} placeholder="00000-000" />
                                    <div className="md:col-span-2">
                                        <Input label="Rua/Av" {...register('address_street')} disabled={loadingCep} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="Número" {...register('address_number')} />
                                    <Input label="Bairro" {...register('address_neighborhood')} disabled={loadingCep} />
                                    <Input label="Cidade" {...register('address_city')} disabled={loadingCep} />
                                </div>
                                <Input label="Estado" {...register('address_state')} disabled={loadingCep} />

                                {/* REFACTORED KEYS LOCATION */}
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Onde estão as chaves?</label>
                                    <select {...register('keys_location')} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700">
                                        <option value="">Selecione...</option>
                                        <option value="portaria">Na Portaria</option>
                                        <option value="proprietario">Com Proprietário</option>
                                        <option value="imobiliaria">Na Imobiliária</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: DETAILS */}
                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <Input label="Título do Anúncio" {...register('title')} placeholder="Ex: Apto Luxo Jd. Europa" />

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Input label="Preço (R$)" type="number" step="0.01" {...register('price')} />
                                <Input label="Condomínio (R$)" type="number" step="0.01" {...register('condo_fee')} />
                                <Input label="IPTU (R$)" type="number" step="0.01" {...register('iptu_value')} />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Input label="Área Total (m²)" type="number" step="0.01" {...register('area_total')} />
                                <Input label="Área Útil (m²)" type="number" step="0.01" {...register('area_useful')} />
                                <Input label="Quartos" type="number" {...register('bedrooms')} />
                                <Input label="Suítes" type="number" {...register('suites')} />
                                <Input label="Banheiros" type="number" {...register('bathrooms')} />
                                <Input label="Vagas" type="number" {...register('garages')} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descrição Completa</label>
                                <textarea {...register('description')} rows={5} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500" placeholder="Descreva os detalhes..." />
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: FEATURES */}
                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300 border-b pb-2">Características</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {AVAILABLE_FEATURES.map(f => (
                                        <label key={f} className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer">
                                            <input type="checkbox" value={f} {...register('features')} className="rounded text-blue-600" />
                                            <span className="text-sm">{f}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: MEDIA */}
                    {currentStep === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <Input label="Link Vídeo" {...register('video_url')} placeholder="https://..." />
                            <Input label="Link Tour 360º" {...register('tour_360_url')} placeholder="https://..." />

                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500">
                                <ImageIcon size={48} className="mb-4 text-slate-300" />
                                <p className="font-medium">Arraste fotos aqui (Visual apenas)</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            <div className="flex justify-between mt-6 pt-4 border-t dark:border-slate-700">
                <Button variant="ghost" onClick={currentStep === 1 ? onCancel : prevStep}>
                    {currentStep === 1 ? 'Cancelar' : <><ChevronLeft size={16} /> Voltar</>}
                </Button>

                {currentStep < 4 ? (
                    <Button onClick={nextStep}>
                        Próximo <ChevronRight size={16} className="ml-2" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit(onFormSubmit)} icon={<Save size={16} />} variant="primary">
                        Salvar Imóvel
                    </Button>
                )}
            </div>
        </div>
    );
};
