import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // O modo demonstração lê os JSONs de web/src/data/clientes.
    fs: { allow: ['..'] },
  },
});
