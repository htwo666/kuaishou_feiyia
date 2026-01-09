import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/kuaishou_feiyia/', // GitHub Pages 必须的路径
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
