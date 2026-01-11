export type AppEnv = {
  API_BASE: string | undefined
  SUPABASE_URL: string | undefined
  SUPABASE_ANON_KEY: string | undefined
  APP_NAME: string
  BUILD_TIME: string
}

const env: AppEnv = {
  API_BASE: import.meta.env.VITE_API_BASE,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'CRM WhatsApp',
  BUILD_TIME: new Date().toISOString(),
}

// Exibe avisos úteis no console em produção caso falte ENV
const missing: string[] = []
if (!env.API_BASE) missing.push('VITE_API_BASE')
if (!env.SUPABASE_URL) missing.push('VITE_SUPABASE_URL')
if (!env.SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY')
if (missing.length) {
  console.warn('[ENV WARNING] Variáveis ausentes:', missing.join(', '))
}

;(window as any).__APP_CONFIG__ = env
export default env