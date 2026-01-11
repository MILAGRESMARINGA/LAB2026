import React from 'react'

type State = { hasError: boolean; error?: any }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, info: any) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <h1 className="text-xl font-bold mb-2">Ops! Algo deu errado.</h1>
          <p className="text-sm text-zinc-500 mb-4">
            Tente recarregar a página. Se persistir, verifique as variáveis de ambiente no
            painel do Bolt Hosting e a disponibilidade da API.
          </p>
          <pre className="text-xs bg-zinc-900 text-zinc-100 p-3 rounded">
            {String(this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}