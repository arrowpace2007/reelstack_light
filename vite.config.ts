import path from 'path';
import { defineConfig, loadEnv } from 'vite';


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5000,
        host: '0.0.0.0',
        strictPort: true,
        allowedHosts: ['.replit.dev', '.repl.co', 'localhost'],
        hmr: {
          clientPort: 443,
          protocol: 'wss'
        }
      },
      plugins: [],
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
