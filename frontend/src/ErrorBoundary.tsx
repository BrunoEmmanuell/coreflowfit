import React from 'react'

export class ErrorBoundary extends React.Component<any, { error: Error | null }> {
  constructor(props: any) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: any) {
    // Você pode enviar o erro a um serviço de logging aqui
    console.error('Uncaught error in React tree:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui' }}>
          <h2>Erro durante a inicialização da aplicação</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
          <p>Abra o DevTools (F12) → Console para mais detalhes.</p>
        </div>
      )
    }
    return this.props.children
  }
}
