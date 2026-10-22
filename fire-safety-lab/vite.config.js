import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/Fire-Safety-Lab/',
  build: {
    rolldownOptions: {
      output: {
        // ライブラリ（React・Framer Motion など）をアプリ本体と別ファイルにしてキャッシュを効かせる
        codeSplitting: {
          groups: [{ name: 'vendor', test: /node_modules/ }],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
