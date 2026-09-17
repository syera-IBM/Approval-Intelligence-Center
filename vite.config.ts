import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'http'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    proxy: {
      // Watson Assistant API proxy — forwards /wa-api/* to the instance base URL.
      '/wa-api': {
        target: process.env.VITE_OPENCHAT_URL ?? 'https://api.us-south.assistant.watson.cloud.ibm.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/wa-api/, ''),
      },
      // All requests to /bwl-api/* are forwarded to Blueworks Live server-side,
      // bypassing browser CORS restrictions entirely.
      '/bwl-api': {
        target: process.env.VITE_BWL_URL ?? 'https://ibm.blueworkslive.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/bwl-api/, ''),
        // Rewrite the domain on Set-Cookie headers so the browser stores the
        // BWL session cookie against localhost and sends it back on subsequent
        // proxied requests (required for the login → API call flow).
        cookieDomainRewrite: 'localhost',
        // Strip WWW-Authenticate from proxied responses. Without this, a 401
        // from BWL causes the browser to show its own native credential dialog
        // instead of letting the app handle the error response.
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes: IncomingMessage, _req: IncomingMessage, _res: ServerResponse) => {
            delete proxyRes.headers['www-authenticate'];
          });
        },
      },
    },
  },
})
