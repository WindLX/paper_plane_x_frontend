import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const repoRoot = path.resolve(__dirname, '..')
const appVersion = fs.readFileSync(path.resolve(repoRoot, 'VERSION'), 'utf-8').trim()

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
  },
  preview: {
    host: '127.0.0.1',
  },
})
