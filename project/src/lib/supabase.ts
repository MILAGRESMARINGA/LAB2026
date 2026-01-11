import { createClient, SupabaseClient } from '@supabase/supabase-js'
import env from '../config/env'

// Create a fallback client if environment variables are missing
const supabaseUrl = env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = env.SUPABASE_ANON_KEY || 'placeholder-key'

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase não configurado. Usando modo demo local.')
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// Types baseados no schema do banco
export interface Contact {
  id: string
  user_id: string
  user_id: string
  name: string | null
  phone: string | null
  email?: string | null
  status: string | null
  tags: string[]
  notes: string | null
  property_interest?: string | null
  budget?: number | null
  last_contact?: string | null
  created_at: string
}

export interface Group {
  id: string
  user_id: string
  name: string | null
  description: string | null
  created_at: string
}

export interface Message {
  id: string
  user_id: string
  template: string | null
  created_at: string
}

export interface SendLog {
  id: string
  user_id: string
  contact_id: string | null
  message_id: string | null
  status: string | null
  timestamp: string
}