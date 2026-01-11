import React, { useMemo, useEffect } from 'react';
import { useCRMStore } from '@/store/useCRMStore';
import { usePropertyStore } from '@/store/usePropertyStore'; // New Import
import { Card } from '@/components/ui/Card';
import { Users, MessageSquare, TrendingUp, UserX, Calendar, Building, DollarSign, Plus, ArrowRight } from 'lucide-react'; // Added Icons
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatters';

export default function Dashboard() {
  const { contacts, fetchContacts } = useCRMStore();
  const { properties, fetchProperties } = usePropertyStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchContacts();
    fetchProperties();
  }, []);

  const stats = useMemo(() => {
    // Lead Stats
    const totalLeads = contacts.length;
    const activeLeads = contacts.filter(c => !['fechado', 'perdido'].includes(c.status)).length;
    const closed = contacts.filter(c => c.status === 'fechado').length;
    const conversionRate = totalLeads > 0 ? ((closed / totalLeads) * 100).toFixed(1) : '0';

    // Property Stats
    const totalProperties = properties.length;
    const portfolioValue = properties.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    const availableProperties = properties.filter(p => p.status === 'disponivel').length;

    // Messages (Mock logic based on contacts for now)
    const messagesToday = 0; // Placeholder until message store is fully linked

    return {
      totalLeads,
      activeLeads,
      conversionRate,
      totalProperties,
      portfolioValue,
      availableProperties,
      messagesToday
    };
  }, [contacts, properties]);

  const birthdaysToday = contacts.filter(c => {
    if (!c.aniversario) return false;
    const [month, day] = c.aniversario.split('-');
    const today = new Date();
    return (parseInt(month) === today.getMonth() + 1) && (parseInt(day) === today.getDate());
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Olá, Corretor 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Resumo do seu dia • {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/properties" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium">
            <Plus size={18} /> Novo Imóvel
          </Link>
          <Link to="/contacts" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium">
            <Plus size={18} /> Novo Contato
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Properties KPI */}
        <Link to="/properties">
          <StatCard
            title="Imóveis em Carteira"
            value={stats.totalProperties}
            subtitle={`${stats.availableProperties} Disponíveis`}
            icon={<Building className="text-blue-600" size={24} />}
            color="blue"
          />
        </Link>

        {/* Value KPI */}
        <StatCard
          title="VGV (Valor Geral)"
          value={formatCurrency(stats.portfolioValue)}
          subtitle="Em carteira ativa"
          icon={<DollarSign className="text-green-600" size={24} />}
          color="green"
        />

        {/* Leads KPI */}
        <Link to="/contacts">
          <StatCard
            title="Leads Ativos"
            value={stats.activeLeads}
            subtitle="Em negociação"
            icon={<Users className="text-purple-600" size={24} />}
            color="purple"
          />
        </Link>

        {/* Conversion KPI */}
        <Link to="/kanban">
          <StatCard
            title="Conversão"
            value={`${stats.conversionRate}%`}
            subtitle="Leads convertidos"
            icon={<TrendingUp className="text-orange-600" size={24} />}
            color="orange"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Funil de Vendas</h3>
              <Link to="/kanban" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Ver Pipeline <ArrowRight size={14} />
              </Link>
            </div>

            <div className="flex h-64 items-end justify-around pb-4 border-b border-slate-100 dark:border-slate-700">
              <ChartBar label="Novo" count={contacts.filter(c => c.status === 'novo').length} color="bg-blue-500" />
              <ChartBar label="Negoc." count={contacts.filter(c => c.status === 'negociacao').length} color="bg-indigo-500" />
              <ChartBar label="Visita" count={contacts.filter(c => c.status === 'visita').length} color="bg-yellow-500" />
              <ChartBar label="Prop." count={contacts.filter(c => c.status === 'proposta').length} color="bg-orange-500" />
              <ChartBar label="Fechado" count={contacts.filter(c => c.status === 'fechado').length} color="bg-green-500" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-sm text-slate-500">Valor em Negociação</p>
                {/* Mock logic: assume avg ticket or sum from opportunities if we had them */}
                <p className="text-xl font-bold text-slate-900 dark:text-white">R$ --</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-sm text-slate-500">Negócios este Mês</p>
                {/* Mock count of contacts created this month */}
                <p className="text-xl font-bold text-slate-900 dark:text-white">{contacts.filter(c => {
                  const d = new Date(c.dataCriacao);
                  const now = new Date();
                  return d.getMonth() === now.getMonth();
                }).length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4 tracking-wider">Acesso Rápido</h3>
            <div className="space-y-2">
              <ActionButton icon={<Calendar size={18} />} label="Minha Agenda" onClick={() => navigate('/agenda')} />
              <ActionButton icon={<MessageSquare size={18} />} label="Mensagens" onClick={() => navigate('/messages')} />
              <ActionButton icon={<Users size={18} />} label="Todos os Contatos" onClick={() => navigate('/contacts')} />
            </div>
          </Card>

          {/* Birthdays */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-pink-500" size={20} />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Aniversariantes</h3>
            </div>
            {birthdaysToday.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                <p>Nenhum aniversariante hoje</p>
                <span className="text-2xl mt-2 block">🎉</span>
              </div>
            ) : (
              <ul className="space-y-3">
                {birthdaysToday.map(c => (
                  <li key={c.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{c.nome}</p>
                      <p className="text-xs text-slate-500">{c.telefone}</p>
                    </div>
                    <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-medium transition-colors">
                      Parabéns
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

const StatCard = ({ title, value, subtitle, icon, color }: any) => (
  <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: `var(--${color}-500)` }}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
  </Card>
);

const ChartBar = ({ label, count, color }: any) => {
  // scale height arbitrarily for demo, max 10
  const height = Math.max(10, Math.min(100, count * 15)) + '%';

  return (
    <div className="flex flex-col items-center gap-2 w-12 group">
      <div className="relative w-full h-full flex flex-col justify-end">
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{count}</span>
        <div className={`w-full rounded-t-lg ${color} opacity-80 group-hover:opacity-100 transition-all duration-500`} style={{ height }}></div>
      </div>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  );
};

const ActionButton = ({ icon, label, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-all">
    {icon}
    {label}
    <ChevronRight size={14} className="ml-auto opacity-50" />
  </button>
);

import { ChevronRight } from 'lucide-react';