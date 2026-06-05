import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ command }) => {
  return {
    base: command === 'build' ? './' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('./'),
        'react': path.resolve('./node_modules/react'),
        'react-dom': path.resolve('./node_modules/react-dom'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Separate heavy libraries to avoid any bundle exceeding 1MB limit
              if (id.includes('pdfjs-dist') || id.includes('react-pdf')) {
                return 'vendor-pdfjs';
              }
              if (id.includes('pdf-lib')) {
                return 'vendor-pdflib';
              }
              if (id.includes('jspdf')) {
                return 'vendor-jspdf';
              }
              if (id.includes('xlsx')) {
                return 'vendor-xlsx';
              }
              if (id.includes('pptx-preview')) {
                return 'vendor-pptx';
              }
              if (id.includes('mammoth')) {
                return 'vendor-mammoth';
              }
              if (id.includes('echarts')) {
                return 'vendor-echarts';
              }
              if (id.includes('zrender')) {
                return 'vendor-zrender';
              }
              if (id.includes('epubjs')) {
                return 'vendor-epubjs';
              }
              if (id.includes('@capacitor') || id.includes('@capawesome')) {
                return 'vendor-capacitor';
              }
              // Group React & motion to reduce index bundle size
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('motion')) {
                return 'vendor-framework';
              }
              // Group markdown rendering tools
              if (id.includes('react-markdown') || id.includes('remark') || id.includes('micromark')) {
                return 'vendor-markdown';
              }
            }
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
