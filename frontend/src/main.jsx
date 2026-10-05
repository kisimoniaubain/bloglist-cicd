import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './redux/store';
import { applyTheme, getInitialTheme } from './utils/theme';
import { LanguageProvider } from './contexts/LanguageContext';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
          <h2>Something went wrong loading the app.</h2>
          <p style={{ color: '#888', fontSize: '14px' }}>{String(this.state.error)}</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '1rem', padding: '8px 16px', cursor: 'pointer' }}>
            Clear Cache &amp; Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

applyTheme(getInitialTheme());

const appTree = (
  <ErrorBoundary>
    <Provider store={store}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
        }}
      />
    </Provider>
  </ErrorBoundary>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {appTree}
  </React.StrictMode>
);
