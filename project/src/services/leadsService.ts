import { supabase } from '../lib/supabase';

export interface Lead {
  id: string;
  user_id: string;
  name: string | null;
  phone: string;
  whatsapp_chat_id: string | null;
  pipeline_stage: string;
  tags: string[];
  notes: string | null;
  assigned_to: string | null;
  first_contact_date: string | null;
  last_interaction_date: string | null;
  last_message_content: string | null;
  response_status: string;
  ai_classification: any;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  lead_id: string;
  chat_id: string;
  message_id: string | null;
  content: string | null;
  from_me: boolean;
  message_type: string;
  media_url: string | null;
  timestamp: string;
  status: string;
  created_at: string;
}

export interface PipelineLog {
  id: string;
  lead_id: string;
  previous_stage: string | null;
  new_stage: string;
  reason: string | null;
  automated: boolean;
  changed_by: string | null;
  timestamp: string;
}

export interface LeadAssignment {
  id: string;
  lead_id: string;
  assigned_to: string;
  assigned_by: string;
  assigned_at: string;
  notes: string | null;
}

// Função para obter o usuário atual
const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
};

// Serviços para Leads
export const leadsService = {
  // Buscar todos os leads
  async getAll(): Promise<Lead[]> {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to fetch leads:', error);
      return [];
    }
  },

  // Buscar lead por telefone
  async getByPhone(phone: string): Promise<Lead | null> {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('phone', phone)
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.warn('Failed to get lead by phone:', error);
      return null;
    }
  },

  // Buscar lead por chat ID do WhatsApp
  async getByChatId(chatId: string): Promise<Lead | null> {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('whatsapp_chat_id', chatId)
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.warn('Failed to get lead by chat ID:', error);
      return null;
    }
  },

  // Criar novo lead
  async create(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...lead, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to create lead:', error);
      throw error;
    }
  },

  // Atualizar lead
  async update(id: string, updates: Partial<Lead>): Promise<Lead> {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to update lead:', error);
      throw error;
    }
  },

  // Deletar lead
  async delete(id: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`);
      
      if (error) throw error;
    } catch (error) {
      console.warn('Failed to delete lead:', error);
      throw error;
    }
  },

  // Buscar leads por estágio do pipeline
  async getByStage(stage: string): Promise<Lead[]> {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('pipeline_stage', stage)
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('last_interaction_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to fetch leads by stage:', error);
      return [];
    }
  },

  // Buscar leads por tags
  async getByTags(tags: string[]): Promise<Lead[]> {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .overlaps('tags', tags)
        .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to fetch leads by tags:', error);
      return [];
    }
  },

  // Atribuir lead a usuário
  async assignLead(leadId: string, assignedTo: string, notes?: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      
      // Atualizar lead
      await this.update(leadId, { assigned_to: assignedTo });
      
      // Criar registro de atribuição
      const { error } = await supabase
        .from('lead_assignments')
        .insert([{
          lead_id: leadId,
          assigned_to: assignedTo,
          assigned_by: user.id,
          notes: notes || null
        }]);
      
      if (error) throw error;
    } catch (error) {
      console.warn('Failed to assign lead:', error);
      throw error;
    }
  }
};

// Serviços para Mensagens do WhatsApp
export const whatsappMessagesService = {
  // Buscar mensagens de um lead
  async getByLeadId(leadId: string): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to fetch messages:', error);
      return [];
    }
  },

  // Criar nova mensagem
  async create(message: Omit<WhatsAppMessage, 'id' | 'created_at'>): Promise<WhatsAppMessage> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert([message])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to create message:', error);
      throw error;
    }
  },

  // Buscar mensagens recentes (últimas X horas)
  async getRecent(hours: number = 1): Promise<WhatsAppMessage[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select(`
          *,
          leads(user_id, assigned_to)
        `)
        .gte('timestamp', since)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to fetch recent messages:', error);
      return [];
    }
  }
};

// Serviços para Logs do Pipeline
export const pipelineLogsService = {
  // Buscar logs de um lead
  async getByLeadId(leadId: string): Promise<PipelineLog[]> {
    try {
      const { data, error } = await supabase
        .from('pipeline_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to fetch pipeline logs:', error);
      return [];
    }
  },

  // Criar log de mudança
  async create(log: Omit<PipelineLog, 'id'>): Promise<PipelineLog> {
    try {
      const { data, error } = await supabase
        .from('pipeline_logs')
        .insert([log])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to create pipeline log:', error);
      throw error;
    }
  },

  // Buscar estatísticas do pipeline
  async getStats(): Promise<Record<string, number>> {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('pipeline_logs')
        .select(`
          new_stage,
          leads!inner(user_id, assigned_to)
        `)
        .or(`leads.user_id.eq.${user.id},leads.assigned_to.eq.${user.id}`);
      
      if (error) throw error;
      
      const stats: Record<string, number> = {};
      data?.forEach(log => {
        stats[log.new_stage] = (stats[log.new_stage] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.warn('Failed to get pipeline stats:', error);
      return {};
    }
  }
};

// Serviços para Atribuições
export const assignmentsService = {
  // Buscar atribuições de um usuário
  async getByUser(userId: string): Promise<LeadAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('lead_assignments')
        .select(`
          *,
          leads(name, phone, pipeline_stage)
        `)
        .eq('assigned_to', userId)
        .order('assigned_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to fetch assignments:', error);
      return [];
    }
  },

  // Criar nova atribuição
  async create(assignment: Omit<LeadAssignment, 'id' | 'assigned_at'>): Promise<LeadAssignment> {
    try {
      const { data, error } = await supabase
        .from('lead_assignments')
        .insert([assignment])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to create assignment:', error);
      throw error;
    }
  }
};

// Função utilitária para análise de IA
export const analyzeMessageWithAI = async (content: string, context: any): Promise<any> => {
  try {
    // Implementar integração com OpenAI/Claude/Gemini
    // Por enquanto, usar análise baseada em palavras-chave
    
    const keywords = {
      interest: ['interessado', 'quero', 'gostaria', 'preciso', 'busco'],
      scheduling: ['agendar', 'visita', 'quando', 'horário', 'disponível', 'pode vir'],
      negotiation: ['preço', 'valor', 'proposta', 'orçamento', 'desconto', 'condições'],
      closing: ['fechado', 'compro', 'aceito', 'vamos fechar', 'ok pode ser', 'combinado'],
      objection: ['caro', 'não tenho', 'vou pensar', 'depois', 'talvez']
    };

    const contentLower = content.toLowerCase();
    const classification = {
      intent: 'unknown',
      confidence: 0,
      suggestedStage: null,
      keywords: []
    };

    // Analisar palavras-chave
    for (const [intent, words] of Object.entries(keywords)) {
      const foundWords = words.filter(word => contentLower.includes(word));
      if (foundWords.length > 0) {
        classification.intent = intent;
        classification.keywords = foundWords;
        classification.confidence = foundWords.length / words.length;
        
        // Sugerir estágio baseado na intenção
        switch (intent) {
          case 'interest':
            classification.suggestedStage = 'follow-up';
            break;
          case 'scheduling':
            classification.suggestedStage = 'scheduled';
            break;
          case 'negotiation':
            classification.suggestedStage = 'negotiating';
            break;
          case 'closing':
            classification.suggestedStage = 'closed';
            break;
        }
        break;
      }
    }

    return classification;
  } catch (error) {
    console.error('Erro na análise de IA:', error);
    return {
      intent: 'unknown',
      confidence: 0,
      suggestedStage: null,
      keywords: []
    };
  }
};