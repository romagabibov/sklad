import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
          <div className="max-w-xl bg-white p-6 rounded-xl shadow-lg border border-red-200">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Что-то пошло не так</h1>
            <p className="text-slate-700 mb-4">В приложении произошла непредвиденная ошибка. Пожалуйста, сделайте снимок экрана или скопируйте текст ошибки и отправьте разработчику.</p>
            <div className="bg-slate-100 p-4 rounded-lg overflow-auto max-h-60 text-xs font-mono text-slate-800">
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
            >
              Перезагрузить приложение
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
