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

  const asyncCssPlugin = {
    name: "wizack-async-css",
    enforce: "post" as const,
    transformIndexHtml(html: string) {
      const stylesheetTagRe = /<link\b[^>]*\brel=(["'])stylesheet\1[^>]*>/gi;

      return html.replace(stylesheetTagRe, (tag) => {
        const hrefMatch = tag.match(/\bhref=(["'])([^"']+)\1/i);
        const href = hrefMatch?.[2];
        if (!href) return tag;
        if (!href.includes("/assets/") || !href.toLowerCase().endsWith(".css")) return tag;
        if (/\bmedia=(["'])print\1/i.test(tag)) return tag;

        const hasCrossorigin = /\bcrossorigin(\s*=\s*(["'])[^"']*\2)?/i.test(tag);
        const crossoriginAttr = hasCrossorigin ? " crossorigin" : "";

        const preload = `<link rel="preload" as="style" href="${href}"${crossoriginAttr} />`;
        const asyncStylesheet = `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"${crossoriginAttr} />`;
        const noscript = `<noscript><link rel="stylesheet" href="${href}"${crossoriginAttr} /></noscript>`;

        return `${preload}\n    ${asyncStylesheet}\n    ${noscript}`;
      });
    },
  };

  return {
    plugins: [react(), asyncCssPlugin],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        react: path.resolve(__dirname, "node_modules/react"),
        "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      hmr: false,
      proxy: {
        "/api/dify": difyProxy,
      },
    },
    preview: {
      port: 4173,
      proxy: {
        "/api/dify": difyProxy,
      },
    },
  };
});
