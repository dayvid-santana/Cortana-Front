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
      port: 5174,
      proxy: {
        "/api": {
          target: env.DEVMATE_API_PROXY_TARGET ?? "http://127.0.0.1:8000",
          changeOrigin: false,
          configure: (proxy) => {
            // Vite's dev proxy answers SSE responses with `Connection: close`. Chromium's
            // EventSource then treats any pause between events (the backend "thinking")
            // as the response having ended, and reconnects in a tight loop instead of
            // just waiting — every reconnect starts a fresh proxied request, so a slow
            // answer can end up never actually delivered to a live connection. Forcing
            // keep-alive on event-stream responses is what makes long-lived SSE survive
            // this proxy at all.
            proxy.on("proxyRes", (proxyRes) => {
              if (proxyRes.headers["content-type"]?.includes("text/event-stream")) {
                proxyRes.headers.connection = "keep-alive";
              }
            });
          },
        },
      },
    },
    build: {
      sourcemap: mode !== "production",
    },
  };
});
