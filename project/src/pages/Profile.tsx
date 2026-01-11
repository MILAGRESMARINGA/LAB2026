import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import {
  User, Mail, Save
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '', // Need to ensure type has phone
        role: user.role || 'Admin',
        bio: ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateUser({
        name: formData.name,
        // email is usuall read only in simple edit
      });

      toastSuccess('Perfil atualizado com sucesso!');
    } catch (error) {
      toastError('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Meu Perfil</h1>
        <p className="text-slate-500">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg mx-auto">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-700" />
                ) : (
                  <span className="text-3xl font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{formData.name || 'Usuário'}</h3>
            <p className="text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20 inline-block px-3 py-1 rounded-full text-sm">
              {formData.role?.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Informações Pessoais</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className="w-full pl-10 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full pl-10 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-500"
                  />
                </div>
              </div>

              <Button type="submit" loading={loading} icon={<Save size={18} />}>
                Salvar Alterações
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;