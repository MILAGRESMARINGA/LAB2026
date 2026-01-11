import React, { useState, useEffect } from 'react';
import { leadsService } from '../services/leadsService';
import { supabase } from '../lib/supabase';
import { 
  UserCheck, 
  X, 
  Users, 
  Search,
  Plus,
  CheckCircle
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface LeadAssignmentModalProps {
  leadId: string;
  leadName: string;
  currentAssignee?: string;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: (assignedTo: string) => void;
}

const LeadAssignmentModal: React.FC<LeadAssignmentModalProps> = ({
  leadId,
  leadName,
  currentAssignee,
  isOpen,
  onClose,
  onAssigned
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      // Em um sistema real, você buscaria usuários da equipe
      // Por enquanto, usar dados simulados
      const mockUsers: User[] = [
        { id: 'user1', email: 'joao@empresa.com', name: 'João Vendedor' },
        { id: 'user2', email: 'maria@empresa.com', name: 'Maria Corretora' },
        { id: 'user3', email: 'carlos@empresa.com', name: 'Carlos Gerente' },
        { id: 'user4', email: 'ana@empresa.com', name: 'Ana Consultora' }
      ];
      
      setUsers(mockUsers);
      setSelectedUser(currentAssignee || '');
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) {
      alert('Selecione um usuário para atribuir');
      return;
    }

    try {
      setLoading(true);
      await leadsService.assignLead(leadId, selectedUser, notes);
      onAssigned(selectedUser);
      onClose();
    } catch (error) {
      console.error('Erro ao atribuir lead:', error);
      alert('Erro ao atribuir lead');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl w-full max-w-md border border-slate-700/50">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Atribuir Responsável</h2>
              <p className="text-slate-400 text-sm">{leadName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Search Users */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Buscar Usuário
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Users List */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Selecionar Responsável
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredUsers.map((user) => (
                <label key={user.id} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="assignedUser"
                    value={user.id}
                    checked={selectedUser === user.id}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{user.name || user.email}</p>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                  </div>
                  {selectedUser === user.id && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo da atribuição, instruções especiais..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleAssign}
              disabled={loading || !selectedUser}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Atribuindo...</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Atribuir Lead</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-slate-500 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadAssignmentModal;