// ==========================================================
// ⚡ C.H.A.O.S. VITE BUILD CONFIGURATION ⚡
// ==========================================================
// - OPTIMIZED BUILD SETTINGS FOR REACT + TYPESCRIPT
// - PATH ALIASES FOR CLEAN IMPORTS
// - CROSS-PLATFORM COMPATIBILITY SETTINGS
// - TAURI INTEGRATION FOR NATIVE APP COMPILATION
// ==========================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Enable cross-platform path usage
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  
  // Tauri expects a fixed port
  server: {
    port: 3000,
    strictPort: true,
    // Enable HMR and error overlay
    hmr: {
      overlay: true,
    },
    // Allow connections from all devices on network for testing
    host: true,
  },
  
  // Optimize build settings
  build: {
    // Target modern browsers for smaller bundles
    target: 'esnext',
    // Generate sourcemaps for debugging
    sourcemap: true,
    // Optimize chunks for faster loading
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor code for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'tailwind-merge', 'clsx'],
        },
      },
    },
  },
  
  // Testing configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  
  // Environment variables configuration
  envPrefix: ['VITE_', 'TAURI_'],
  
  // Automatically clear console
  clearScreen: false,
});
