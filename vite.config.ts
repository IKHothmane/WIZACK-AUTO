import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const difyApiKey = (env.DIFY_API_KEY || "").trim();

  const difyProxy = {
    target: "https://api.dify.ai",
    changeOrigin: true,
    secure: true,
    rewrite: (p: string) => p.replace(/^\/api\/dify/, "/v1"),
    configure: (proxy: any) => {
      proxy.on("proxyReq", (proxyReq: any) => {
        if (difyApiKey) proxyReq.setHeader("Authorization", `Bearer ${difyApiKey}`);
        proxyReq.setHeader("Accept", "text/event-stream, application/json");
      });
    },
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api/dify": difyProxy,
      },
    },
    preview: {
      port: 3000,
      proxy: {
        "/api/dify": difyProxy,
      },
    },
  };
});
