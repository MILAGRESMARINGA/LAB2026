import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Edit3
} from 'lucide-react';

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  const handleProfileEdit = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleSettings = () => {
    navigate('/settings');
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* User Avatar/Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-700/50 transition-all duration-300 group"
      >
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <User className="h-5 w-5 text-white" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-slate-400">{user.email}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 z-50 overflow-hidden">
            {/* User Info Header */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={handleProfileEdit}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-700/50 transition-all duration-300 text-left group"
              >
                <Edit3 className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-white font-medium">Editar Perfil</p>
                  <p className="text-xs text-slate-400">Alterar informações pessoais</p>
                </div>
              </button>

              <button
                onClick={handleSettings}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-700/50 transition-all duration-300 text-left group"
              >
                <Settings className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-white font-medium">Configurações</p>
                  <p className="text-xs text-slate-400">Preferências do sistema</p>
                </div>
              </button>

              <div className="border-t border-slate-700/50 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 transition-all duration-300 text-left group"
                >
                  <LogOut className="h-5 w-5 text-red-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-red-400 font-medium">Sair</p>
                    <p className="text-xs text-red-300/70">Encerrar sessão</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;