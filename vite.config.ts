import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Separa vendor pesado em chunks imutáveis (cache longo) e
        // reduz o JS inicial — melhora o carregamento em 3G/4G.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom", "react-helmet-async"],
          "vendor-framer": ["framer-motion"],
          "vendor-recharts": ["recharts"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
});
