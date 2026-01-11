import React, { useState, useEffect } from 'react';
import { Contact, ContactStatus } from '../types';
import { X, Save, User, Phone, Tag, FileText, Home, DollarSign } from 'lucide-react';

interface ContactFormProps {
  contact?: Contact;
  onSave: (contact: Omit<Contact, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({ contact, onSave, onCancel, isOpen }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    status: 'new' as ContactStatus,
    tags: '',
    notes: '',
    propertyInterest: '',
    budget: '',
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        phone: contact.phone,
        status: contact.status,
        tags: contact.tags.join(', '),
        notes: contact.notes,
        propertyInterest: contact.propertyInterest || '',
        budget: contact.budget?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        status: 'new',
        tags: '',
        notes: '',
        propertyInterest: '',
        budget: '',
      });
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const contactData = {
      name: formData.name,
      phone: formData.phone,
      status: formData.status,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      notes: formData.notes,
      propertyInterest: formData.propertyInterest,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
    };

    onSave(contactData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-20"></div>
        
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {contact ? 'Editar Contato' : 'Novo Contato'}
                </h2>
                <p className="text-gray-600">Preencha as informações do cliente</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-all duration-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <User className="h-4 w-4 mr-2 text-blue-500" />
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <Phone className="h-4 w-4 mr-2 text-emerald-500" />
                  Telefone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="11999887766"
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                <Tag className="h-4 w-4 mr-2 text-purple-500" />
                Status do Lead
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ContactStatus })}
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              >
                <option value="new">Novo Lead</option>
                <option value="contacted">Contatado</option>
                <option value="negotiating">Em Negociação</option>
                <option value="closed">Fechado</option>
              </select>
            </div>

            {/* Property Interest & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <Home className="h-4 w-4 mr-2 text-amber-500" />
                  Interesse Imobiliário
                </label>
                <input
                  type="text"
                  value={formData.propertyInterest}
                  onChange={(e) => setFormData({ ...formData, propertyInterest: e.target.value })}
                  placeholder="Ex: Apartamento 2 quartos"
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
                  Orçamento (R$)
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="350000"
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                <Tag className="h-4 w-4 mr-2 text-pink-500" />
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Lead Quente, Apartamento, Urgente"
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Anotações importantes sobre o cliente..."
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2 font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Save className="h-5 w-5" />
                <span>Salvar Contato</span>
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-2xl hover:bg-gray-300 transition-all duration-300 font-bold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;