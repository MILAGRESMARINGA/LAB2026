import { useState, useEffect } from 'react';
import { leadsService, whatsappMessagesService, pipelineLogsService, Lead } from '../services/leadsService';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar leads
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await leadsService.getAll();
        setLeads(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar leads');
        console.error('Erro ao carregar leads:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Criar novo lead
  const createLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const newLead = await leadsService.create({
        ...leadData,
        user_id: '', // Será preenchido pelo service
        pipeline_stage: leadData.pipeline_stage || 'new',
        tags: leadData.tags || ['novo-lead'],
        response_status: leadData.response_status || 'waiting'
      });
      
      setLeads(prev => [newLead, ...prev]);
      return newLead;
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      throw error;
    }
  };

  // Atualizar lead
  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const updatedLead = await leadsService.update(id, updates);
      setLeads(prev => prev.map(lead => lead.id === id ? updatedLead : lead));
      
      // Se mudou o estágio, criar log
      if (updates.pipeline_stage) {
        const currentLead = leads.find(l => l.id === id);
        if (currentLead && currentLead.pipeline_stage !== updates.pipeline_stage) {
          await pipelineLogsService.create({
            lead_id: id,
            previous_stage: currentLead.pipeline_stage,
            new_stage: updates.pipeline_stage,
            reason: 'Mudança manual',
            automated: false,
            changed_by: null // Será preenchido pelo service
          });
        }
      }
      
      return updatedLead;
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      throw error;
    }
  };

  // Deletar lead
  const deleteLead = async (id: string) => {
    try {
      await leadsService.delete(id);
      setLeads(prev => prev.filter(lead => lead.id !== id));
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      throw error;
    }
  };

  // Buscar leads por estágio
  const getLeadsByStage = (stage: string) => {
    return leads.filter(lead => lead.pipeline_stage === stage);
  };

  // Buscar leads por tags
  const getLeadsByTags = (tags: string[]) => {
    return leads.filter(lead => 
      lead.tags && lead.tags.some(tag => tags.includes(tag))
    );
  };

  // Atribuir lead
  const assignLead = async (leadId: string, assignedTo: string, notes?: string) => {
    try {
      await leadsService.assignLead(leadId, assignedTo, notes);
      await updateLead(leadId, { assigned_to: assignedTo });
    } catch (error) {
      console.error('Erro ao atribuir lead:', error);
      throw error;
    }
  };

  // Buscar mensagens de um lead
  const getLeadMessages = async (leadId: string) => {
    try {
      return await whatsappMessagesService.getByLeadId(leadId);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  };

  // Buscar logs do pipeline de um lead
  const getLeadPipelineLogs = async (leadId: string) => {
    try {
      return await pipelineLogsService.getByLeadId(leadId);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }
  };

  // Estatísticas
  const getStats = () => {
    const stats = {
      total: leads.length,
      byStage: {} as Record<string, number>,
      byTags: {} as Record<string, number>,
      whatsappImported: leads.filter(l => l.tags?.includes('whatsapp-importado')).length,
      assigned: leads.filter(l => l.assigned_to).length,
      unassigned: leads.filter(l => !l.assigned_to).length
    };

    // Contar por estágio
    leads.forEach(lead => {
      stats.byStage[lead.pipeline_stage] = (stats.byStage[lead.pipeline_stage] || 0) + 1;
    });

    // Contar por tags
    leads.forEach(lead => {
      lead.tags?.forEach(tag => {
        stats.byTags[tag] = (stats.byTags[tag] || 0) + 1;
      });
    });

    return stats;
  };

  return {
    leads,
    loading,
    error,
    createLead,
    updateLead,
    deleteLead,
    getLeadsByStage,
    getLeadsByTags,
    assignLead,
    getLeadMessages,
    getLeadPipelineLogs,
    getStats,
    refetch: () => {
      setLoading(true);
      leadsService.getAll().then(setLeads).finally(() => setLoading(false));
    }
  };
};