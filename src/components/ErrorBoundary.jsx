import React from 'react';
import { logger } from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorCount: 0,
      lastErrorTime: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const errorCount = this.state.errorCount + 1;
    const now = Date.now();
    const lastErrorTime = this.state.lastErrorTime;

    if (errorCount > 3 && lastErrorTime && (now - lastErrorTime) < 10000) {
      logger.error('ERRO CRÍTICO: Possível loop de erros detectado', {
        error: error.message,
        errorCount,
        stack: error.stack
      });
    } else {
      logger.error('Error caught by boundary', {
        error: error.message,
        errorInfo,
        errorCount
      });
    }

    this.setState({
      errorCount,
      lastErrorTime: now
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorCount: 0,
      lastErrorTime: null
    });
  };

  render() {
    if (this.state.hasError) {
      const isRecurringError = this.state.errorCount > 3;

      return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">Oops! Algo deu errado</h1>
              <p className="text-gray-600 mb-6">
                {isRecurringError
                  ? 'Encontramos um erro recorrente. Por favor, recarregue a página ou contacte o suporte.'
                  : 'Encontramos um erro inesperado. Tente novamente ou recarregue a página.'}
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-700 break-words">
                  {this.state.error?.message || 'Erro desconhecido'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleRetry}
                  disabled={isRecurringError}
                  className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Recarregar Página
                </button>
                {isRecurringError && (
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full px-6 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors"
                  >
                    Voltar ao Início
                  </button>
                )}
              </div>
            </div>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-8 bg-gray-900 text-gray-100 p-4 rounded-lg max-w-2xl w-full text-left overflow-auto max-h-48">
              <p className="font-bold mb-2">Stack trace (desenvolvimento):</p>
              <pre className="text-xs whitespace-pre-wrap break-words">
                {this.state.error?.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
