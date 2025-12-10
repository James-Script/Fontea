import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <h2 className="text-xl font-bold text-red-600">Ocorreu um erro ao renderizar esta página</h2>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
