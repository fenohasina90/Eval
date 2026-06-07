import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig ({
  plugins: [react (), tailwindcss ()],
  headers: {
    'Access-Control-Allow-Headers': 'Authorization, App-Token, Session-Token',
  },
  server: {
    proxy: {
      // API legacy → /glpi/apirest.php
      // ⚠️ MUST be before '/api' to avoid '/api' matching '/apirest' requests
      '/apirest': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: path => path.replace (/^\/apirest/, '/glpi/apirest.php'),
        configure: proxy => {
          proxy.on ('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader ('Authorization', req.headers.authorization);
            }
            if (req.headers['app-token']) {
              proxyReq.setHeader ('App-Token', req.headers['app-token']);
            }
          });
        },
      },
      // API moderne (OAuth token) → /glpi/api.php/token
      // ⚠️ MUST be before '/api' to avoid '/api' matching '/api/token' requests
      '/api/token': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: path =>
          path.replace (/^\/api\/token/, '/glpi/api.php/token'),
      },
      // API moderne (REST v2.3) → /glpi/api.php/v2.3
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: path =>
          path.replace (/^\/api/, '/glpi/api.php/v2.3'),
      },
    },
  },
});
