import React, { useState, useMemo, useRef } from 'react';
import { useCRMStore } from '@/store/useCRMStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ContactForm } from '@/components/features/ContactForm';
import { parseContactsCSV } from '@/utils/csvParser';
import { useToast } from '@/hooks/useToast';
import {
  Search, Plus, Upload, LayoutGrid, Table as TableIcon,
  MoreVertical, Phone, Mail, Edit2, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { IContact } from '@/types/crm';

export default function Contacts() {
  const { contacts, filters, setFilters, addContact, updateContact, deleteContact } = useCRMStore();
  const { success, error } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<IContact | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = c.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.telefone.includes(filters.search);
      return matchesSearch;
    });
  }, [contacts, filters]);

  const handleSaveContact = (data: any) => {
    if (editingContact) {
      updateContact(editingContact.id, data);
      success('Contato atualizado!');
    } else {
      addContact({ ...data, tags: [], historico: [] });
      success('Contato criado com sucesso!');
    }
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      deleteContact(id);
      success('Contato excluído!');
    }
  };

  const openNewContact = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const openEditContact = (contact: IContact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const newContacts = parseContactsCSV(content);
        newContacts.forEach(c => addContact(c as any));
        success(`${newContacts.length} contatos importados!`);
      } catch (err) {
        error('Erro ao processar arquivo CSV');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Gestão de Contatos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gerencie seus leads e clientes em um só lugar
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="secondary" icon={<Upload size={18} />} onClick={() => fileInputRef.current?.click()}>
            Importar CSV
          </Button>
          <Button variant="primary" icon={<Plus size={18} />} onClick={openNewContact}>
            Novo Contato
          </Button>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 dark:border-dark-border flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-dark-border flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
            >
              <TableIcon size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50/50 dark:bg-slate-900/20">
          {filteredContacts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Search size={64} className="mb-4 opacity-10" />
              <p>Nenhum contato encontrado</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Contato</th>
                    <th className="px-6 py-4">Prioridade</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredContacts.map(contact => (
                    <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs text-blue-600 font-bold">
                          {contact.nome.substring(0, 2).toUpperCase()}
                        </div>
                        {contact.nome}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={contact.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1"><Phone size={12} /> {contact.telefone}</span>
                          {contact.email && <span className="flex items-center gap-1"><Mail size={12} /> {contact.email}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={contact.prioridade === 'alta' ? 'error' : 'default'}>{contact.prioridade}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditContact(contact)} className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={(e) => handleDelete(contact.id, e)} className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredContacts.map(contact => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => openEditContact(contact)}
                  className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-dark-border transition-all group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20">
                      {contact.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEditContact(contact)} className="p-1 text-slate-300 hover:text-blue-500">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(contact.id)} className="p-1 text-slate-300 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white mb-1 truncate">{contact.nome}</h3>
                  <StatusBadge status={contact.status} />

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                      <Phone size={14} className="text-blue-500" />
                      {contact.telefone}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-xs text-center text-slate-400">
          {filteredContacts.length} contatos cadastrados
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContact ? "Editar Contato" : "Novo Contato"}
        size="lg"
      >
        <ContactForm
          onSubmit={handleSaveContact}
          onCancel={() => setIsModalOpen(false)}
          initialData={editingContact || undefined}
        />
      </Modal>
    </div>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    novo: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    negociacao: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    proposta: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    fechado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    perdido: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${styles[status] || styles.novo}`}>
      {status}
    </span>
  )
}