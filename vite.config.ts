import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // Use localhost for development, production server for build
  const apiTarget = mode === "development" 
    ? "http://localhost:8080" 
    : "https://my-school-pwjd.onrender.com";

  return {
    server: {
      host: "::",
      port: 8081,

      // Environment-based API proxy
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
