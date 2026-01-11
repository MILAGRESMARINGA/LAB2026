export const API_BASE = import.meta.env.VITE_API_BASE || ''
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const hasAllEnv =
  Boolean(API_BASE) && Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY)