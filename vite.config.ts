import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server/index";

export default defineConfig(({ mode }) => ({
  root: path.resolve(__dirname, "client"),

  // ✅ Root ki public/ folder use karo
  publicDir: path.resolve(__dirname, "public"),

  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [
        path.resolve(__dirname),              // ✅ root folder allow karo
        path.resolve(__dirname, "client"),
        path.resolve(__dirname, "shared"),
        path.resolve(__dirname, "public"),    // ✅ public folder explicitly allow
        path.resolve(__dirname, "node_modules"),
      ],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },

  build: {
    outDir: path.resolve(__dirname, "dist/spa"),
  },

  plugins: [react(), expressPlugin()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}