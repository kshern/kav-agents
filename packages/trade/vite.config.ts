import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('../core/src', import.meta.url))
    },
  },
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
      
    }
  }
})
