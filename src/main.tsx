import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/provider/query-provider';
import { EditorThemeProvider } from '@/components/provider/editor-theme-provider';
import { EditorTypographyProvider } from '@/components/provider/editor-typography-provider';
import App from './App';
import './globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Providers>
        <EditorThemeProvider>
          <EditorTypographyProvider />
          <App />
          <Toaster position="top-center" reverseOrder={false} />
        </EditorThemeProvider>
      </Providers>
    </BrowserRouter>
  </React.StrictMode>
);
