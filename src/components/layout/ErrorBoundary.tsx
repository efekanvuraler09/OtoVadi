import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Hata durumunda gösterilecek arayüz; reset çağrıldığında çocuklar yeniden denenir */
  fallback: (reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Render sırasında oluşan hataları yakalayıp tüm uygulamanın beyaz ekrana düşmesini engeller.
 * Not: Olay işleyicileri ve async kod içindeki hatalar React tarafından buraya iletilmez.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Beklenmeyen arayüz hatası:', error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return this.props.fallback(this.reset);
    }
    return this.props.children;
  }
}
