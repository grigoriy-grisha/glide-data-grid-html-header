import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/glide-data-grid-html-header/',  // Базовый путь для GitHub Pages (имя репозитория)
})



