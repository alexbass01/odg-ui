import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ include: /\.(jsx?|tsx?)$/ })],
  base: './',
  esbuild: {
    include: /\.(jsx?|tsx?)$/,
    exclude: [],
    loader: 'jsx',
  },
})
