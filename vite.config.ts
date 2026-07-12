import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path for GitHub Pages: https://<user>.github.io/german-reader/
// Override with BASE_PATH env if the repo is named differently.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/german-reader/',
})
