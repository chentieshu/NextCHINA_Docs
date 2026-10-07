import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'nextchina-release-identity',
    transformIndexHtml() {
      const commit = process.env.GITHUB_SHA;
      return commit && /^[a-f0-9]{40}$/.test(commit) ? [{
        tag: 'meta', attrs: { name: 'nextchina-commit', content: commit }, injectTo: 'head' as const
      }] : [];
    }
  }],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, '.') } }
});
