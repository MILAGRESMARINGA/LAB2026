import React, { useState } from 'react';
import { useCRMStore } from '@/store/useCRMStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Send, Paperclip, MoreVertical, Phone } from 'lucide-react';
import { format } from 'date-fns';

export default function Messages() {
  const { contacts } = useCRMStore();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  // Mock messages for UI if history is empty
  const messages = selectedContact?.historico.length
    ? selectedContact.historico
    : [];

  return (
    <div className="h-[calc(100vh-140px)] bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border overflow-hidden flex">
      {/* Sidebar de Chats */}
      <div className="w-80 border-r border-slate-200 dark:border-dark-border flex flex-col bg-slate-50 dark:bg-slate-900/50">
        <div className="p-4 border-b border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card">
          <h2 className="font-semibold text-lg mb-4">Mensagens</h2>
          <Input
            placeholder="Buscar conversa..."
            icon={<Search size={16} />}
            className="bg-slate-100 dark:bg-slate-800 border-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => setSelectedContactId(contact.id)}
              className={`
                        p-4 flex gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                        ${selectedContactId === contact.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    `}
            >
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                {contact.nome.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-medium truncate text-slate-900 dark:text-white">{contact.nome}</h4>
                  <span className="text-xs text-slate-400">
                    {format(new Date(contact.ultimoContato), 'HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {contact.historico[0]?.texto || 'Nenhuma mensagem.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a]">
        {selectedContact ? (
          <>
            <div className="h-16 bg-white dark:bg-dark-card px-6 flex items-center justify-between border-b border-slate-200 dark:border-dark-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  {selectedContact.nome.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{selectedContact.nome}</h3>
                  <p className="text-xs text-slate-500">{selectedContact.telefone}</p>
                </div>
              </div>
              <div className="flex gap-2 text-slate-400">
                <Button variant="ghost" size="sm"><Phone size={20} /></Button>
                <Button variant="ghost" size="sm"><MoreVertical size={20} /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]">
              {messages.length === 0 ? (
                <div className="text-center py-10">
                  <span className="bg-white dark:bg-dark-card px-4 py-2 rounded-lg text-sm shadow-sm text-slate-500">
                    Comece a conversa com {selectedContact.nome}
                  </span>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.tipo === 'enviada' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                                    max-w-[70%] p-3 rounded-lg shadow-sm relative
                                    ${msg.tipo === 'enviada'
                        ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-tr-none'
                        : 'bg-white dark:bg-dark-card text-slate-900 dark:text-slate-100 rounded-tl-none'
                      }
                                `}>
                      <p className="text-sm">{msg.texto}</p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block text-right mt-1">
                        {format(new Date(msg.data), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white dark:bg-dark-card border-t border-slate-200 dark:border-dark-border">
              <div className="flex gap-2 items-end">
                <Button variant="ghost" size="md" className="shrink-0">
                  <Paperclip size={20} />
                </Button>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none h-10 max-h-32 custom-scrollbar"
                  rows={1}
                />
                <Button variant="primary" size="md" className="shrink-0 bg-[#00a884] hover:bg-[#008f6f]">
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={32} />
            </div>
            <p>Selecione um contato para ver as mensagens</p>
          </div>
        )}
      </div>
    </div>
  );
}
import { MessageSquare } from 'lucide-react';