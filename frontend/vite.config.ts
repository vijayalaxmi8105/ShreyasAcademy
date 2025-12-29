import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',  // Ensure this is set to root for Vercel
  build: {
    outDir: 'dist',  // Make sure this matches Vercel's expected output directory
    sourcemap: true,  // Optional: helps with debugging in production
  },
  server: {
    port: 3000,  // Optional: set your preferred port for local development
  },
})
