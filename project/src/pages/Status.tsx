import { useEffect, useState } from 'react'
import env from '../config/env'
import { WhatsAppService } from '../services/whatsapp'
import { supabase } from '../lib/supabase'

export default function StatusPage() {
  const [wa, setWa] = useState<any>(null)
  const [auth, setAuth] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      const w = await WhatsAppService.health()
      setWa(w)
      const s = await supabase.auth.getSession()
      setAuth(s)
    })()
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Status do Sistema</h1>
      <section className="p-4 rounded border bg-white/5">
        <h2 className="font-semibold mb-2">Config</h2>
        <pre className="text-xs overflow-auto">
{JSON.stringify(
  {
    API_BASE: env.API_BASE,
    SUPABASE_URL: env.SUPABASE_URL,
    HAS_SUPABASE_KEY: Boolean(env.SUPABASE_ANON_KEY),
    BUILD_TIME: env.BUILD_TIME,
  },
  null,
  2
)}
        </pre>
      </section>

      <section className="p-4 rounded border bg-white/5">
        <h2 className="font-semibold mb-2">WhatsApp API</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(wa, null, 2)}</pre>
      </section>

      <section className="p-4 rounded border bg-white/5">
        <h2 className="font-semibold mb-2">Supabase Auth</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(auth, null, 2)}</pre>
      </section>
    </div>
  )
}