import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // Keep the dev-server origin aligned with the browser URL. MSW passes
      // document navigations through to the network, and serving on a
      // different loopback hostname can make those passthroughs fail.
      host: "localhost",
      port: 5173,
      proxy: {
        "/api": {
          target: env.DEVMATE_API_PROXY_TARGET ?? "http://127.0.0.1:8000",
          changeOrigin: false,
        },
      },
    },
    build: {
      sourcemap: mode !== "production",
    },
  };
});
