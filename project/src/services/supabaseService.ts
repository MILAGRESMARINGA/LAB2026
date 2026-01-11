import { supabase, Contact, Group, Message, SendLog } from '../lib/supabase'

// Função para obter o usuário atual
const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')
  return user
}

// Serviços para Contatos
export const contactsService = {
  // Buscar todos os contatos
  async getAll(): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.warn('Failed to fetch contacts:', error)
      return []
    }
  },

  // Criar novo contato
  async create(contact: Omit<Contact, 'id' | 'user_id' | 'created_at'>): Promise<Contact> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('contacts')
        .insert([{ ...contact, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Failed to create contact:', error)
      throw error
    }
  },

  // Atualizar contato
  async update(id: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Failed to update contact:', error)
      throw error
    }
  },

  // Deletar contato
  async delete(id: string): Promise<void> {
    try {
      const user = await getCurrentUser()
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (error) throw error
    } catch (error) {
      console.warn('Failed to delete contact:', error)
      throw error
    }
  },

  // Buscar por telefone
  async getByPhone(phone: string): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('phone', phone)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.warn('Failed to get contact by phone:', error)
      return null
    }
  }
}

// Serviços para Grupos
export const groupsService = {
  async getAll(): Promise<Group[]> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      // Fallback: return empty array if user_id column doesn't exist
      console.warn('Groups table missing user_id column, returning empty array')
      return []
    }
  },

  async create(group: Omit<Group, 'id' | 'created_at'>): Promise<Group> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('groups')
        .insert([{ ...group, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Failed to create group:', error)
      throw error
    }
  },

  async update(id: string, updates: Partial<Group>): Promise<Group> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Failed to update group:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const user = await getCurrentUser()
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (error) throw error
    } catch (error) {
      console.warn('Failed to delete group:', error)
      throw error
    }
  }
}

// Serviços para Mensagens
export const messagesService = {
  async getAll(): Promise<Message[]> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      // Fallback: return empty array if user_id column doesn't exist
      console.warn('Messages table missing user_id column, returning empty array')
      return []
    }
  },

  async create(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('messages')
        .insert([{ ...message, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Failed to create message:', error)
      throw error
    }
  },

  async update(id: string, updates: Partial<Message>): Promise<Message> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Failed to update message:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const user = await getCurrentUser()
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (error) throw error
    } catch (error) {
      console.warn('Failed to delete message:', error)
      throw error
    }
  }
}

// Serviços para Logs de Envio
export const sendLogsService = {
  async getAll(): Promise<SendLog[]> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('send_logs')
        .select(`
          *,
          contacts(name, phone),
          messages(template)
        `)
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      // Fallback: return empty array if user_id column doesn't exist
      console.warn('Send_logs table missing user_id column, returning empty array')
      return []
    }
  },

  async create(log: Omit<SendLog, 'id' | 'timestamp'>): Promise<SendLog> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('send_logs')
        .insert([{ ...log, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Failed to create send log:', error)
      throw error
    }
  },

  async updateStatus(id: string, status: string): Promise<SendLog> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('send_logs')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Failed to update send log status:', error)
      throw error
    }
  },

  // Contar mensagens enviadas hoje
  async getTodayCount(): Promise<number> {
    try {
      const user = await getCurrentUser()
      const today = new Date().toISOString().split('T')[0]
      
      const { count, error } = await supabase
        .from('send_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('timestamp', `${today}T00:00:00.000Z`)
        .lt('timestamp', `${today}T23:59:59.999Z`)
        .in('status', ['sent', 'delivered'])
      
      if (error) throw error
      return count || 0
    } catch (error) {
      console.warn('Failed to get today count, returning 0')
      return 0
    }
  },

  // Estatísticas por status
  async getStats(): Promise<Record<string, number>> {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase
        .from('send_logs')
        .select('status')
        .eq('user_id', user.id)
      
      if (error) throw error
      
      const stats: Record<string, number> = {}
      data?.forEach(log => {
        stats[log.status || 'unknown'] = (stats[log.status || 'unknown'] || 0) + 1
      })
      
      return stats
    } catch (error) {
      console.warn('Failed to get stats, returning empty object')
      return {}
    }
  }
}

// Função para envio em massa com fila inteligente
export async function sendMessagesQueue(contacts: Contact[], messageTemplate: string) {
  const user = await getCurrentUser()
  const DAILY_LIMIT = 50000
  const BATCH_SIZE = 200
  const MESSAGE_DELAY = 3000 // 3 segundos
  const BATCH_DELAY = 5 * 60 * 1000 // 5 minutos

  // Verificar limite diário
  const todayCount = await sendLogsService.getTodayCount()
  if (todayCount + contacts.length > DAILY_LIMIT) {
    throw new Error(`Limite diário excedido. Você pode enviar apenas ${DAILY_LIMIT - todayCount} mensagens hoje.`)
  }

  // Criar template de mensagem no banco
  const messageRecord = await messagesService.create({
    user_id: user.id,
    template: messageTemplate
  })

  const results = []
  
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i]
    const personalizedMessage = messageTemplate.replace(/\{\{nome\}\}/g, contact.name || 'Cliente')

    // Criar log inicial
    const logRecord = await sendLogsService.create({
      user_id: user.id,
      contact_id: contact.id,
      message_id: messageRecord.id,
      status: 'pending'
    })

    try {
      // Simular envio da mensagem (substituir pela API real)
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: contact.phone,
          body: personalizedMessage
        })
      })

      const result = await response.json()
      
      // Atualizar status do log
      await sendLogsService.updateStatus(
        logRecord.id, 
        response.ok ? 'sent' : 'error'
      )

      results.push({
        contact: contact.name,
        phone: contact.phone,
        status: response.ok ? 'sent' : 'error',
        ...result
      })

    } catch (error) {
      // Atualizar status para erro
      await sendLogsService.updateStatus(logRecord.id, 'error')
      
      results.push({
        contact: contact.name,
        phone: contact.phone,
        status: 'error',
        error: error.message
      })
    }

    // Delay entre mensagens
    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`Pausa de 5 minutos após ${i + 1} mensagens...`)
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
    } else {
      await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY))
    }
  }

  return results
}