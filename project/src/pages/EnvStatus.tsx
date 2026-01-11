import React from 'react'

export default function EnvStatus() {
  const envs = {
    VITE_API_BASE: import.meta.env.VITE_API_BASE,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '*** set ***' : undefined
  }

  return (
    <div className="p-6 max-w-2xl mx-auto text-sm">
      <h1 className="text-xl font-bold mb-4">Status de Ambiente</h1>
      <p className="mb-2">Confira se as variáveis de ambiente estão definidas no host antes de publicar.</p>
      <pre className="bg-zinc-950 text-zinc-200 p-4 rounded">{JSON.stringify(envs, null, 2)}</pre>
      <ul className="mt-3 list-disc pl-5">
        <li>Defina as ENV no host (Integrations → Environment variables).</li>
        <li>As chaves devem começar com <code>VITE_</code> para o Vite expor no frontend.</li>
      </ul>
    </div>
  )
}