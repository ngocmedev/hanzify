import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import React from 'react';

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: 'white', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Error rendering page:</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 20 }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 20 }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
