import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [{ src: "node_modules/pdfjs-dist/build/pdf.worker.min.mjs", dest: "." }],
    }),
  ],
  worker: { format: "es" },
  optimizeDeps: { exclude: ["@xenova/transformers"] },
  build: {
    minify: false,
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
});
