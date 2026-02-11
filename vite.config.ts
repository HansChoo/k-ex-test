import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // By default, Vite doesn't define process.env.
      // We define it here to prevent "ReferenceError: process is not defined"
      // and to inject the API_KEY from Vercel environment variables.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fallback for other process.env usages
      'process.env': {}
    }
  }
})