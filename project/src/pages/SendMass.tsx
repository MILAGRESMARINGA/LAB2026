import React, { useState } from 'react';
import { useCRMStore } from '@/store/useCRMStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { Send, CheckSquare, Square, Filter } from 'lucide-react';

export default function SendMass() {
  const { contacts } = useCRMStore();
  const { success } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === contacts.length) setSelectedIds([]);
    else setSelectedIds(contacts.map(c => c.id));
  };

  const handleSend = () => {
    if (!message) return;
    setSending(true);
    // Simulate sending
    setTimeout(() => {
      setSending(false);
      success(`Mensagem enviada para ${selectedIds.length} contatos!`);
      setSelectedIds([]);
      setMessage('');
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Lista de Seleção */}
      <Card className="lg:col-span-2 flex flex-col h-full overflow-hidden" noPadding>
        <div className="p-4 border-b border-slate-200 dark:border-dark-border flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <button onClick={toggleAll} className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
              {selectedIds.length === contacts.length && contacts.length > 0 ? <CheckSquare /> : <Square />}
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {selectedIds.length} selecionados
            </span>
          </div>
          <Button variant="ghost" size="sm" icon={<Filter size={16} />}>Filtrar</Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => toggleSelect(contact.id)}
              className={`
                        flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
                        ${selectedIds.includes(contact.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                    `}
            >
              <div className={`text-blue-600 ${selectedIds.includes(contact.id) ? 'opacity-100' : 'opacity-0'}`}>
                <CheckSquare size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-slate-900 dark:text-white">{contact.nome}</h4>
                <p className="text-sm text-slate-500">{contact.telefone}</p>
              </div>
              <Badge>{contact.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Compositor */}
      <div className="flex flex-col gap-6">
        <Card className="flex-1 flex flex-col">
          <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Compor Mensagem</h3>

          <div className="flex gap-2 mb-4 flex-wrap">
            <Button size="sm" variant="secondary" onClick={() => setMessage(prev => prev + ' {nome} ')}>+ Nome</Button>
            <Button size="sm" variant="secondary" onClick={() => setMessage(prev => prev + ' {data} ')}>+ Data</Button>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Olá {nome}, tudo bem?..."
            className="flex-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm focus:ring-2 focus:ring-blue-500 resize-none mb-4 custom-scrollbar"
          />

          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg mb-4">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Preview</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">
              {message
                ? message.replace('{nome}', 'João Silva').replace('{data}', new Date().toLocaleDateString())
                : 'Sua mensagem aparecerá aqui...'}
            </p>
          </div>

          <Button
            fullWidth
            size="lg"
            icon={<Send size={18} />}
            onClick={handleSend}
            loading={sending}
            disabled={selectedIds.length === 0 || !message}
          >
            Enviar Campanha
          </Button>
        </Card>

        <Card>
          <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">Dicas</h3>
          <ul className="text-sm text-slate-500 space-y-2 list-disc pl-4">
            <li>Evite enviar muitas mensagens de uma vez.</li>
            <li>Use variáveis para personalizar.</li>
            <li>Mantenha o tom profissional.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}