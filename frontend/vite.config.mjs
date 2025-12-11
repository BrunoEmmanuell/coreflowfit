import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [react(), tsconfigPaths()],
  define: {
    'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  }
  }
});
