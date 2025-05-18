// ==========================================================
// ⚡ C.H.A.O.S. FRONTEND ENTRY POINT ⚡
// ==========================================================
// - REACT APPLICATION BOOTSTRAP
// - ROUTING CONFIGURATION
// - THEME PROVIDER SETUP
// - CROSS-PLATFORM STYLING INTEGRATION
// ==========================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './lib/theme-provider';

// Import global styles
import './styles/globals.css';

// Mount React application
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="chaos-ui-theme">
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
