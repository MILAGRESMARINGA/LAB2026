import React, { useState } from 'react';
import { Contact, ContactStatus } from '../types';
import { Phone, MessageCircle, Edit3, Trash2, Tag, Calendar, DollarSign, User, MapPin } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onSendMessage: (contact: Contact) => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
  onSendMessage,
  onStatusChange,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: ContactStatus) => {
    switch (status) {
      case 'new': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'contacted': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      case 'negotiating': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'closed': return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const getStatusLabel = (status: ContactStatus) => {
    switch (status) {
      case 'new': return 'Novo Lead';
      case 'contacted': return 'Contatado';
      case 'negotiating': return 'Negociando';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="group relative">
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
      
      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{contact.name}</h3>
                <p className="text-sm text-gray-600 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {contact.phone}
                </p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex space-x-1">
              <button
                onClick={() => onSendMessage(contact)}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-300 hover:scale-110"
                title="Enviar mensagem"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(contact)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 hover:scale-110"
                title="Editar"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(contact.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="mb-4">
            <select
              value={contact.status}
              onChange={(e) => onStatusChange(contact.id, e.target.value as ContactStatus)}
              className={`text-xs px-4 py-2 rounded-full font-bold border-0 cursor-pointer transition-all duration-300 ${getStatusColor(contact.status)}`}
            >
              <option value="new">Novo Lead</option>
              <option value="contacted">Contatado</option>
              <option value="negotiating">Negociando</option>
              <option value="closed">Fechado</option>
            </select>
          </div>

          {/* Tags */}
          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {contact.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
              {contact.tags.length > 2 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-medium">
                  +{contact.tags.length - 2} mais
                </span>
              )}
            </div>
          )}

          {/* Quick info */}
          <div className="space-y-2 mb-4">
            {contact.propertyInterest && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium">Interesse:</span>
                <span className="ml-1">{contact.propertyInterest}</span>
              </div>
            )}
            {contact.budget && (
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
                <span className="font-medium">Orçamento:</span>
                <span className="ml-1 font-bold text-emerald-600">{formatCurrency(contact.budget)}</span>
              </div>
            )}
          </div>

          {/* Toggle details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300"
          >
            {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
          </button>

          {/* Expanded details */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-in slide-in-from-top duration-300">
              {contact.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Observações:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{contact.notes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Criado: {formatDate(contact.createdAt)}</span>
                </div>
                {contact.lastContact && (
                  <div className="flex items-center">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    <span>Último contato: {formatDate(contact.lastContact)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactCard;