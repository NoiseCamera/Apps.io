import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are loaded correctly on GitHub Pages
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  define: {
    // Optional: Shim process.env if you want to keep the code as is, 
    // but better to use import.meta.env in the code.
  }
})